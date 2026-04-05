const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const { pool } = require("./db/pool");
const { runMigrations } = require("./db/migrate");

const app = express();
const port = process.env.PORT || 5001;
const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
const adminEmails = new Set(
  String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
);

app.use(cors());
app.use(express.json());

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getAuthUserId(req) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, jwtSecret);
    return payload.userId || null;
  } catch (error) {
    return null;
  }
}

function getAuthPayload(req) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const payload = getAuthPayload(req);
  const userId = payload?.userId || null;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.userId = userId;
  req.auth = payload;
  next();
}

async function requireAdmin(req, res, next) {
  const payload = getAuthPayload(req);
  const userId = payload?.userId || null;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);

    if (result.rows.length === 0 || result.rows[0].role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.userId = userId;
    req.auth = payload;
    return next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

function mapProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    priceKzt: Number(row.price_kzt),
    stockQuantity: Number(row.stock_quantity),
    imageUrls: row.image_urls || [],
    isActive: row.is_active,
    availabilityStatus: !row.is_active
      ? "inactive"
      : Number(row.stock_quantity) > 0
      ? "in_stock"
      : "out_of_stock",
  };
}

function normalizeProductPayload(body) {
  const category = String(body.category || "").trim();
  const normalizedCategory =
    category === "sports_inventory" ? "equipment" : category === "sports_nutrition" ? "nutrition" : category;

  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    name: String(body.name || "").trim(),
    category: normalizedCategory,
    description: String(body.description || "").trim(),
    priceKzt: Number(body.priceKzt),
    stockQuantity: Number(body.stockQuantity),
    imageUrls,
    isActive: typeof body.isActive === "boolean" ? body.isActive : true,
  };
}

async function syncAdminRoles() {
  if (adminEmails.size === 0) {
    return;
  }

  const emails = [...adminEmails];

  await pool.query(
    `
      UPDATE users
      SET role = 'admin'
      WHERE email = ANY($1::text[])
    `,
    [emails]
  );
}

app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT id, name, category, description, price_kzt, stock_quantity, image_urls, is_active
        FROM products
        ORDER BY id ASC
      `
    );

    return res.json({
      products: result.rows.map(mapProductRow),
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  try {
    const result = await pool.query(
      `
        SELECT id, name, category, description, price_kzt, stock_quantity, image_urls, is_active
        FROM products
        WHERE id = $1
      `,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const row = result.rows[0];

    return res.json({
      product: mapProductRow(row),
    });
  } catch (error) {
    console.error("Product fetch error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT id, name, category, description, price_kzt, stock_quantity, image_urls, is_active
        FROM products
        ORDER BY id DESC
      `
    );

    return res.json({ products: result.rows.map(mapProductRow) });
  } catch (error) {
    console.error("Admin products fetch error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  const payload = normalizeProductPayload(req.body);

  if (
    !payload.name ||
    !payload.description ||
    !["equipment", "nutrition"].includes(payload.category) ||
    !Number.isFinite(payload.priceKzt) ||
    payload.priceKzt <= 0 ||
    !Number.isInteger(payload.stockQuantity) ||
    payload.stockQuantity < 0
  ) {
    return res.status(400).json({ message: "Invalid product payload" });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO products (name, category, description, price_kzt, stock_quantity, image_urls, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, category, description, price_kzt, stock_quantity, image_urls, is_active
      `,
      [
        payload.name,
        payload.category,
        payload.description,
        payload.priceKzt,
        payload.stockQuantity,
        payload.imageUrls,
        payload.isActive,
      ]
    );

    return res.status(201).json({ product: mapProductRow(result.rows[0]) });
  } catch (error) {
    console.error("Admin product create error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const payload = normalizeProductPayload(req.body);

  if (
    !payload.name ||
    !payload.description ||
    !["equipment", "nutrition"].includes(payload.category) ||
    !Number.isFinite(payload.priceKzt) ||
    payload.priceKzt <= 0 ||
    !Number.isInteger(payload.stockQuantity) ||
    payload.stockQuantity < 0
  ) {
    return res.status(400).json({ message: "Invalid product payload" });
  }

  try {
    const result = await pool.query(
      `
        UPDATE products
        SET
          name = $1,
          category = $2,
          description = $3,
          price_kzt = $4,
          stock_quantity = $5,
          image_urls = $6,
          is_active = $7
        WHERE id = $8
        RETURNING id, name, category, description, price_kzt, stock_quantity, image_urls, is_active
      `,
      [
        payload.name,
        payload.category,
        payload.description,
        payload.priceKzt,
        payload.stockQuantity,
        payload.imageUrls,
        payload.isActive,
        productId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ product: mapProductRow(result.rows[0]) });
  } catch (error) {
    console.error("Admin product update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  try {
    const result = await pool.query(
      `
        UPDATE products
        SET is_active = FALSE
        WHERE id = $1
        RETURNING id
      `,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Admin product delete error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          o.id,
          o.user_id,
          o.created_at,
          o.total_amount_kzt,
          o.status,
          o.fulfillment_type,
          o.delivery_address,
          COALESCE(
            json_agg(
              json_build_object(
                'productId', oi.product_id,
                'name', oi.product_name,
                'quantity', oi.quantity,
                'priceKzt', oi.price_kzt
              )
              ORDER BY oi.id
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
          ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `
    );

    return res.json({
      orders: result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        createdAt: row.created_at,
        totalAmountKzt: Number(row.total_amount_kzt),
        status: row.status,
        fulfillmentType: row.fulfillment_type,
        deliveryAddress: row.delivery_address,
        items: row.items,
      })),
    });
  } catch (error) {
    console.error("Admin orders fetch error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
  const orderId = Number(req.params.id);
  const nextStatus = String(req.body.status || "").trim();
  const allowedStatuses = [
    "new",
    "processing",
    "paid",
    "shipped_or_ready",
    "completed",
    "cancelled",
  ];

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  if (!allowedStatuses.includes(nextStatus)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const result = await pool.query(
      `
        UPDATE orders
        SET status = $1
        WHERE id = $2
        RETURNING id, status
      `,
      [nextStatus, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({
      order: {
        id: result.rows[0].id,
        status: result.rows[0].status,
      },
    });
  } catch (error) {
    console.error("Admin order status update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/orders", async (req, res) => {
  const { items, fulfillmentType, deliveryAddress } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Order items are required" });
  }

  if (fulfillmentType !== "pickup" && fulfillmentType !== "delivery") {
    return res.status(400).json({ message: "Invalid fulfillment type" });
  }

  const cleanAddress = String(deliveryAddress || "").trim();
  if (fulfillmentType === "delivery" && !cleanAddress) {
    return res.status(400).json({ message: "Delivery address is required" });
  }

  const normalizedItems = items
    .map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
    }))
    .filter(
      (item) =>
        Number.isInteger(item.productId) &&
        item.productId > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );

  if (normalizedItems.length !== items.length) {
    return res.status(400).json({ message: "Invalid order items" });
  }

  const uniqueProductIds = [...new Set(normalizedItems.map((item) => item.productId))];
  const userId = getAuthUserId(req);
  const client = await pool.connect();

  try {
    const productsResult = await client.query(
      `
        SELECT id, name, price_kzt, stock_quantity, is_active
        FROM products
        WHERE id = ANY($1::int[])
        FOR UPDATE
      `,
      [uniqueProductIds]
    );

    const productsMap = new Map(productsResult.rows.map((row) => [row.id, row]));

    if (productsMap.size !== uniqueProductIds.length) {
      return res.status(400).json({ message: "Some products were not found" });
    }

    const orderItems = normalizedItems.map((item) => {
      const product = productsMap.get(item.productId);

      if (!product.is_active) {
        throw new Error(`Product ${product.id} is inactive`);
      }

      if (Number(product.stock_quantity) < item.quantity) {
        throw new Error(`Not enough stock for product ${product.id}`);
      }

      return {
        productId: product.id,
        productName: product.name,
        priceKzt: Number(product.price_kzt),
        quantity: item.quantity,
      };
    });

    const totalAmountKzt = orderItems.reduce(
      (sum, item) => sum + item.priceKzt * item.quantity,
      0
    );

    await client.query("BEGIN");

    const orderResult = await client.query(
      `
        INSERT INTO orders (user_id, fulfillment_type, delivery_address, total_amount_kzt, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, fulfillment_type, delivery_address, total_amount_kzt, status, created_at
      `,
      [
        userId,
        fulfillmentType,
        fulfillmentType === "delivery" ? cleanAddress : null,
        totalAmountKzt,
        "new",
      ]
    );

    const order = orderResult.rows[0];

    for (const item of orderItems) {
      await client.query(
        `
          INSERT INTO order_items (order_id, product_id, product_name, price_kzt, quantity)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [order.id, item.productId, item.productName, item.priceKzt, item.quantity]
      );

      await client.query(
        `
          UPDATE products
          SET stock_quantity = stock_quantity - $1
          WHERE id = $2
        `,
        [item.quantity, item.productId]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      order: {
        id: order.id,
        userId: order.user_id,
        fulfillmentType: order.fulfillment_type,
        deliveryAddress: order.delivery_address,
        totalAmountKzt: Number(order.total_amount_kzt),
        status: order.status,
        createdAt: order.created_at,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Order creation error:", error);

    if (String(error.message).includes("Not enough stock")) {
      return res.status(409).json({ message: "Not enough stock for selected product" });
    }

    if (String(error.message).includes("inactive")) {
      return res.status(409).json({ message: "Selected product is not available" });
    }

    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

app.post("/api/program-purchases", requireAuth, async (req, res) => {
  const { programTitle, amountKzt, programUrl } = req.body;

  const cleanProgramTitle = String(programTitle || "").trim();
  const cleanProgramUrl = String(programUrl || "").trim();
  const cleanAmountKzt = Number(amountKzt);

  if (!cleanProgramTitle || !cleanProgramUrl || cleanAmountKzt <= 0) {
    return res.status(400).json({ message: "Invalid program purchase payload" });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO program_purchases (user_id, program_title, amount_kzt, status, program_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, program_title, amount_kzt, status, program_url, created_at
      `,
      [req.userId, cleanProgramTitle, cleanAmountKzt, "paid", cleanProgramUrl]
    );

    const purchase = result.rows[0];

    return res.status(201).json({
      purchase: {
        id: purchase.id,
        programTitle: purchase.program_title,
        amountKzt: Number(purchase.amount_kzt),
        status: purchase.status,
        programUrl: purchase.program_url,
        createdAt: purchase.created_at,
      },
    });
  } catch (error) {
    console.error("Program purchase create error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/orders/active", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          o.id,
          o.created_at,
          o.total_amount_kzt,
          o.status,
          COALESCE(
            json_agg(
              json_build_object(
                'productId', oi.product_id,
                'name', oi.product_name,
                'quantity', oi.quantity,
                'priceKzt', oi.price_kzt
              )
              ORDER BY oi.id
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
          ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = $1
          AND o.status IN ('new', 'processing', 'paid', 'shipped_or_ready')
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `,
      [req.userId]
    );

    return res.json({
      orders: result.rows.map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        totalAmountKzt: Number(row.total_amount_kzt),
        status: row.status,
        items: row.items,
      })),
    });
  } catch (error) {
    console.error("Active orders fetch error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/orders/history", requireAuth, async (req, res) => {
  try {
    const ordersResult = await pool.query(
      `
        SELECT
          o.id,
          o.created_at,
          o.total_amount_kzt,
          o.status,
          COALESCE(
            json_agg(
              json_build_object(
                'productId', oi.product_id,
                'name', oi.product_name,
                'quantity', oi.quantity,
                'priceKzt', oi.price_kzt
              )
              ORDER BY oi.id
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
          ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = $1
          AND o.status IN ('completed', 'cancelled')
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `,
      [req.userId]
    );

    const purchasesResult = await pool.query(
      `
        SELECT id, program_title, amount_kzt, status, program_url, created_at
        FROM program_purchases
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [req.userId]
    );

    return res.json({
      orders: ordersResult.rows.map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        totalAmountKzt: Number(row.total_amount_kzt),
        status: row.status,
        items: row.items,
      })),
      programPurchases: purchasesResult.rows.map((row) => ({
        id: row.id,
        programTitle: row.program_title,
        amountKzt: Number(row.amount_kzt),
        status: row.status,
        programUrl: row.program_url,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("Order history fetch error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, firstName, lastName, country, city } = req.body;

  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || "").trim();
  const cleanFirstName = String(firstName || "").trim();
  const cleanLastName = String(lastName || "").trim();
  const cleanCountry = String(country || "").trim();
  const cleanCity = String(city || "").trim();

  if (
    !cleanEmail ||
    !cleanPassword ||
    !cleanFirstName ||
    !cleanLastName ||
    !cleanCountry ||
    !cleanCity
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (cleanPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    const userRole = adminEmails.has(cleanEmail) ? "admin" : "user";

    const insertResult = await pool.query(
      `
        INSERT INTO users (email, password_hash, first_name, last_name, country, city, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, first_name, last_name, country, city, role
      `,
      [
        cleanEmail,
        passwordHash,
        cleanFirstName,
        cleanLastName,
        cleanCountry,
        cleanCity,
        userRole,
      ]
    );

    const user = insertResult.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, jwtSecret, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        country: user.country,
        city: user.city,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || "").trim();

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const userResult = await pool.query(
      `
        SELECT id, email, password_hash, first_name, last_name, country, city, role
        FROM users
        WHERE email = $1
      `,
      [cleanEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(
      cleanPassword,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, jwtSecret, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        country: user.country,
        city: user.city,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT id, email, first_name, last_name, country, city, role
        FROM users
        WHERE id = $1
      `,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        country: user.country,
        city: user.city,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/account", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
        DELETE FROM users
        WHERE id = $1
        RETURNING id
      `,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Account deleted" });
  } catch (error) {
    console.error("Account delete error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

runMigrations()
  .then(() => syncAdminRoles())
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Migration/startup failed:", error);
    process.exit(1);
  });