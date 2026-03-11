import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001'
  const paymentUrl = 'https://pay.kaspi.kz/pay/klrytula'
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [authMode, setAuthMode] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [authUser, setAuthUser] = useState(() => {
    const raw = localStorage.getItem('lorefit_user')
    return raw ? JSON.parse(raw) : null
  })
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    country: '',
    city: '',
  })
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [shopSearchQuery, setShopSearchQuery] = useState('')
  const [shopPriceSort, setShopPriceSort] = useState('default')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cartItems, setCartItems] = useState(() => {
    const raw = localStorage.getItem('lorefit_cart')
    return raw ? JSON.parse(raw) : []
  })
  const [fulfillmentType, setFulfillmentType] = useState('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [lastOrder, setLastOrder] = useState(null)
  const [activeOrders, setActiveOrders] = useState([])
  const [historyOrders, setHistoryOrders] = useState([])
  const [historyPrograms, setHistoryPrograms] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [accountTab, setAccountTab] = useState('profile')
  const [accountDeleteLoading, setAccountDeleteLoading] = useState(false)
  const [accountDeleteError, setAccountDeleteError] = useState('')
  const [adminProducts, setAdminProducts] = useState([])
  const [adminOrders, setAdminOrders] = useState([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminSuccess, setAdminSuccess] = useState('')
  const [adminTab, setAdminTab] = useState('products')
  const [adminEditingProductId, setAdminEditingProductId] = useState(null)
  const [adminProductModalOpen, setAdminProductModalOpen] = useState(false)
  const [adminDeleteProductId, setAdminDeleteProductId] = useState(null)
  const [adminStatusModalOrderId, setAdminStatusModalOrderId] = useState(null)
  const [adminStatusModalValue, setAdminStatusModalValue] = useState('new')
  const [adminProductQuery, setAdminProductQuery] = useState('')
  const [adminProductCategoryFilter, setAdminProductCategoryFilter] = useState('all')
  const [adminProductAvailabilityFilter, setAdminProductAvailabilityFilter] = useState('all')
  const [adminOrderQuery, setAdminOrderQuery] = useState('')
  const [adminOrderStatusFilter, setAdminOrderStatusFilter] = useState('all')
  const [adminOrderDateFrom, setAdminOrderDateFrom] = useState('')
  const [adminOrderDateTo, setAdminOrderDateTo] = useState('')
  const [adminOrderMinSum, setAdminOrderMinSum] = useState('')
  const [adminOrderMaxSum, setAdminOrderMaxSum] = useState('')
  const [adminProductForm, setAdminProductForm] = useState({
    name: '',
    category: 'equipment',
    description: '',
    priceKzt: '',
    stockQuantity: '',
    imageUrlsText: '',
    isActive: true,
  })

  const categories = [
    {
      title: 'Силовые тренировки',
      description: 'Программы для набора силы, выносливости и построения рельефа.',
      level: 'Для начинающих и продвинутых',
    },
    {
      title: 'Йога и мобильность',
      description: 'Практики для гибкости, снятия стресса и восстановления тела.',
      level: 'Мягкий и средний темп',
    },
    {
      title: 'Кардио и HIIT',
      description: 'Интенсивные онлайн‑занятия для жиросжигания и энергии.',
      level: 'Высокая интенсивность',
    },
    {
      title: 'Тренировки дома',
      description: 'Курсы без зала и сложного инвентаря, с понятными шагами.',
      level: 'Формат 20–40 минут',
    },
  ]

  const trainers = [
    {
      name: 'Каринэ',
      specialty:
        'Тестовое описание: персональный онлайн-тренер, помогает выстроить регулярные тренировки, поддерживает мотивацию и адаптирует нагрузку под ваш уровень.',
      stats: 'Тестовый профиль тренера',
    },
  ]

  const steps = [
    {
      title: 'Выбери цель',
      text: 'Похудение, набор формы, здоровье спины или поддержка тонуса.',
    },
    {
      title: 'Найди тренера',
      text: 'Сравни рейтинги, стили занятий и длительность программ.',
    },
    {
      title: 'Тренируйся онлайн',
      text: 'Смотри уроки в удобное время и отслеживай свой прогресс.',
    },
  ]

  const reviews = [
    {
      text: 'За 2 месяца вернула форму без спортзала. Уроки короткие и очень понятные.',
      author: 'Айгерим, 29 лет',
    },
    {
      text: 'Нашёл тренера под свой график: тренируюсь утром дома, результат уже через 3 недели.',
      author: 'Рустам, 34 года',
    },
  ]

  const timeSlots = ['07:00', '09:00', '12:00', '15:00', '18:00', '20:00']

  const cartTotalKzt = cartItems.reduce((sum, item) => sum + item.priceKzt * item.quantity, 0)
  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const formatKzt = (amount) => `${new Intl.NumberFormat('ru-RU').format(amount)} ₸`
  const categoryLabels = {
    equipment: 'Спортивный инвентарь',
    nutrition: 'Спортивное питание',
  }

  const statusLabels = {
    in_stock: 'В наличии',
    out_of_stock: 'Нет в наличии',
    inactive: 'Неактивен',
  }

  const orderStatusLabels = {
    new: 'Новый',
    processing: 'В обработке',
    paid: 'Оплачен',
    shipped_or_ready: 'Отправлен / готов к выдаче',
    completed: 'Завершён',
    cancelled: 'Отменён',
  }

  const orderStatusOptions = ['new', 'processing', 'paid', 'shipped_or_ready', 'completed', 'cancelled']
  const isAdmin = authUser?.role === 'admin'
  const filteredAdminProducts = adminProducts.filter((product) => {
    const query = adminProductQuery.trim().toLowerCase()
    const byQuery =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      String(product.id).includes(query)
    const byCategory = adminProductCategoryFilter === 'all' || product.category === adminProductCategoryFilter
    const byAvailability =
      adminProductAvailabilityFilter === 'all' ||
      (adminProductAvailabilityFilter === 'active' ? product.isActive : !product.isActive)

    return byQuery && byCategory && byAvailability
  })

  const filteredAdminOrders = adminOrders.filter((order) => {
    const query = adminOrderQuery.trim().toLowerCase()
    const byQuery =
      !query ||
      String(order.id).includes(query) ||
      (order.items || []).some((item) => item.name.toLowerCase().includes(query))

    const byStatus = adminOrderStatusFilter === 'all' || order.status === adminOrderStatusFilter

    const orderDate = new Date(order.createdAt)
    const fromDate = adminOrderDateFrom ? new Date(`${adminOrderDateFrom}T00:00:00`) : null
    const toDate = adminOrderDateTo ? new Date(`${adminOrderDateTo}T23:59:59`) : null
    const byDateFrom = !fromDate || orderDate >= fromDate
    const byDateTo = !toDate || orderDate <= toDate

    const minSum = adminOrderMinSum !== '' ? Number(adminOrderMinSum) : null
    const maxSum = adminOrderMaxSum !== '' ? Number(adminOrderMaxSum) : null
    const byMin = minSum === null || order.totalAmountKzt >= minSum
    const byMax = maxSum === null || order.totalAmountKzt <= maxSum

    return byQuery && byStatus && byDateFrom && byDateTo && byMin && byMax
  })

  const refreshProducts = async () => {
    setProductsLoading(true)
    setProductsError('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/products`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load products')
      }

      setProducts(data.products || [])
    } catch (error) {
      setProductsError('Не удалось загрузить товары. Попробуйте позже.')
    } finally {
      setProductsLoading(false)
    }
  }

  useEffect(() => {
    refreshProducts()
  }, [apiBaseUrl])

  useEffect(() => {
    const syncAuthUser = async () => {
      const token = localStorage.getItem('lorefit_token')

      if (!token) {
        return
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch profile')
        }

        setAuthUser(data.user)
        localStorage.setItem('lorefit_user', JSON.stringify(data.user))
      } catch (error) {
        localStorage.removeItem('lorefit_token')
        localStorage.removeItem('lorefit_user')
        setAuthUser(null)
      }
    }

    syncAuthUser()
  }, [apiBaseUrl])

  useEffect(() => {
    localStorage.setItem('lorefit_cart', JSON.stringify(cartItems))
  }, [cartItems])

  useEffect(() => {
    if (!products.length) {
      return
    }

    setCartItems((prev) =>
      prev
        .map((item) => {
          const product = products.find((productItem) => productItem.id === item.productId)

          if (!product || product.availabilityStatus !== 'in_stock') {
            return null
          }

          return {
            ...item,
            quantity: Math.min(item.quantity, product.stockQuantity),
            priceKzt: product.priceKzt,
            name: product.name,
          }
        })
        .filter(Boolean),
    )
  }, [products])

  useEffect(() => {
    if (currentPage !== 'checkout' || fulfillmentType !== 'delivery') {
      return
    }

    if (deliveryAddress.trim() || !authUser) {
      return
    }

    setDeliveryAddress([authUser.country, authUser.city].filter(Boolean).join(', '))
  }, [currentPage, fulfillmentType, deliveryAddress, authUser])

  const addToCart = (product) => {
    if (product.availabilityStatus !== 'in_stock') {
      return
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id)

      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          return prev
        }

        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          priceKzt: product.priceKzt,
          quantity: 1,
        },
      ]
    })
  }

  const openProductDetails = async (productId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/products/${productId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load product')
      }

      setSelectedProduct(data.product)
      setCurrentPage('product-details')
    } catch (error) {
      setProductsError('Не удалось открыть карточку товара.')
    }
  }

  const changeCartQuantity = (productId, nextQuantity) => {
    if (nextQuantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.productId !== productId))
      return
    }

    const product = products.find((item) => item.id === productId)
    if (product && nextQuantity > product.stockQuantity) {
      return
    }

    setCartItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item)),
    )
  }

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const submitOrder = async () => {
    if (cartItems.length === 0) {
      setOrderError('Корзина пуста.')
      return
    }

    if (fulfillmentType === 'delivery' && !deliveryAddress.trim()) {
      setOrderError('Введите адрес доставки.')
      return
    }

    setOrderLoading(true)
    setOrderError('')

    const token = localStorage.getItem('lorefit_token')

    try {
      const response = await fetch(`${apiBaseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          fulfillmentType,
          deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : '',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Order creation failed')
      }

      setLastOrder(data.order)
      setCartItems([])
      setDeliveryAddress('')
      setCurrentPage('order-success')
    } catch (error) {
      setOrderError('Не удалось оформить заказ. Проверьте данные и попробуйте снова.')
    } finally {
      setOrderLoading(false)
    }
  }

  const loadOrdersData = async () => {
    const token = localStorage.getItem('lorefit_token')

    if (!token) {
      setOrdersError('Войдите в аккаунт, чтобы увидеть заказы.')
      setActiveOrders([])
      setHistoryOrders([])
      setHistoryPrograms([])
      return
    }

    setOrdersLoading(true)
    setOrdersError('')

    try {
      const [activeResponse, historyResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/orders/active`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/api/orders/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const activeData = await activeResponse.json()
      const historyData = await historyResponse.json()

      if (!activeResponse.ok || !historyResponse.ok) {
        throw new Error('Failed to load orders')
      }

      setActiveOrders(activeData.orders || [])
      setHistoryOrders(historyData.orders || [])
      setHistoryPrograms(historyData.programPurchases || [])
    } catch (error) {
      setOrdersError('Не удалось загрузить заказы. Попробуйте позже.')
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadAdminData = async () => {
    const token = localStorage.getItem('lorefit_token')

    if (!token) {
      setAdminError('Войдите как администратор.')
      return
    }

    setAdminLoading(true)
    setAdminError('')
    setAdminSuccess('')

    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/products`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/api/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const productsData = await productsResponse.json()
      const ordersData = await ordersResponse.json()

      if (!productsResponse.ok || !ordersResponse.ok) {
        throw new Error('Failed to load admin data')
      }

      setAdminProducts(productsData.products || [])
      const orders = ordersData.orders || []
      setAdminOrders(orders)
    } catch (error) {
      setAdminError('Не удалось загрузить данные админ-панели.')
    } finally {
      setAdminLoading(false)
    }
  }

  const resetAdminProductForm = () => {
    setAdminEditingProductId(null)
    setAdminProductModalOpen(false)
    setAdminProductForm({
      name: '',
      category: 'equipment',
      description: '',
      priceKzt: '',
      stockQuantity: '',
      imageUrlsText: '',
      isActive: true,
    })
  }

  const updateAdminProductForm = (event) => {
    const { name, value, type, checked } = event.target
    setAdminProductForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const editAdminProduct = (product) => {
    setAdminEditingProductId(product.id)
    setAdminProductModalOpen(true)
    setAdminProductForm({
      name: product.name,
      category: product.category,
      description: product.description,
      priceKzt: String(product.priceKzt),
      stockQuantity: String(product.stockQuantity),
      imageUrlsText: (product.imageUrls || []).join(', '),
      isActive: Boolean(product.isActive),
    })
  }

  const submitAdminProduct = async (event) => {
    event.preventDefault()

    const token = localStorage.getItem('lorefit_token')
    if (!token) {
      setAdminError('Войдите как администратор.')
      return
    }

    setAdminError('')
    setAdminSuccess('')

    const payload = {
      name: adminProductForm.name.trim(),
      category: adminProductForm.category,
      description: adminProductForm.description.trim(),
      priceKzt: Number(adminProductForm.priceKzt),
      stockQuantity: Number(adminProductForm.stockQuantity),
      imageUrls: adminProductForm.imageUrlsText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      isActive: adminProductForm.isActive,
    }

    try {
      const endpoint = adminEditingProductId
        ? `${apiBaseUrl}/api/admin/products/${adminEditingProductId}`
        : `${apiBaseUrl}/api/admin/products`

      const response = await fetch(endpoint, {
        method: adminEditingProductId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save product')
      }

      setAdminSuccess(adminEditingProductId ? 'Товар обновлён.' : 'Товар добавлен.')
      resetAdminProductForm()
      await loadAdminData()
      await refreshProducts()
    } catch (error) {
      setAdminError('Не удалось сохранить товар.')
    }
  }

  const deleteAdminProduct = async (productId) => {
    const token = localStorage.getItem('lorefit_token')
    if (!token) {
      setAdminError('Войдите как администратор.')
      return
    }

    setAdminError('')
    setAdminSuccess('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete product')
      }

      setAdminSuccess('Товар удалён.')
      setAdminDeleteProductId(null)
      await loadAdminData()
      await refreshProducts()
    } catch (error) {
      setAdminError('Не удалось удалить товар.')
    }
  }

  const updateAdminOrderStatus = async (orderId, nextStatus) => {
    const token = localStorage.getItem('lorefit_token')

    if (!token || !nextStatus) {
      setAdminError('Некорректные данные для обновления статуса.')
      return
    }

    setAdminError('')
    setAdminSuccess('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status')
      }

      setAdminSuccess('Статус заказа обновлён.')
      setAdminStatusModalOrderId(null)
      await loadAdminData()
      if (currentPage === 'account') {
        await loadOrdersData()
      }
    } catch (error) {
      setAdminError('Не удалось обновить статус заказа.')
    }
  }

  const buyOnlineProgram = async (programTitle) => {
    const token = localStorage.getItem('lorefit_token')

    if (!token || !authUser) {
      setCurrentPage('auth')
      return
    }

    try {
      await fetch(`${apiBaseUrl}/api/program-purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          programTitle,
          amountKzt: 7900,
          programUrl: `/programs/${encodeURIComponent(programTitle.toLowerCase())}`,
        }),
      })
    } catch (error) {
      return
    }

    window.location.assign(paymentUrl)
  }

  const deleteAccount = async () => {
    const token = localStorage.getItem('lorefit_token')

    if (!token) {
      setAccountDeleteError('Сессия не найдена. Войдите снова.')
      return
    }

    setAccountDeleteLoading(true)
    setAccountDeleteError('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account')
      }

      localStorage.removeItem('lorefit_token')
      localStorage.removeItem('lorefit_user')
      localStorage.removeItem('lorefit_cart')
      setAuthUser(null)
      setCurrentPage('home')
    } catch (error) {
      setAccountDeleteError('Не удалось удалить аккаунт. Попробуйте позже.')
    } finally {
      setAccountDeleteLoading(false)
    }
  }

  const updateAuthForm = (event) => {
    const { name, value } = event.target
    setAuthForm((prev) => ({ ...prev, [name]: value }))
  }

  const resetAuthMessages = () => {
    setAuthError('')
    setAuthSuccess('')
  }

  const getRussianAuthError = (message) => {
    const normalized = String(message || '').toLowerCase()

    if (normalized.includes('invalid credentials')) {
      return 'Неверный email или пароль. Проверьте данные и попробуйте снова.'
    }

    if (normalized.includes('email already exists')) {
      return 'Пользователь с таким email уже существует.'
    }

    if (normalized.includes('all fields are required')) {
      return 'Пожалуйста, заполните все поля.'
    }

    if (normalized.includes('password must be at least 6 characters')) {
      return 'Пароль должен содержать минимум 6 символов.'
    }

    if (normalized.includes('email and password are required')) {
      return 'Введите email и пароль.'
    }

    return 'Не удалось выполнить вход. Попробуйте еще раз.'
  }

  const onLogout = () => {
    localStorage.removeItem('lorefit_token')
    localStorage.removeItem('lorefit_user')
    setAuthUser(null)
    setCurrentPage('home')
  }

  const onSubmitAuth = async (event) => {
    event.preventDefault()
    resetAuthMessages()
    setAuthLoading(true)

    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login'
    const payload =
      authMode === 'register'
        ? authForm
        : {
            email: authForm.email,
            password: authForm.password,
          }

    try {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Request failed')
      }

      localStorage.setItem('lorefit_token', data.token)
      localStorage.setItem('lorefit_user', JSON.stringify(data.user))
      setAuthUser(data.user)
      setAuthSuccess(authMode === 'register' ? 'Registration successful' : 'Login successful')
      setAuthForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        country: '',
        city: '',
      })
      setCurrentPage('home')
    } catch (error) {
      setAuthError(getRussianAuthError(error.message))
    } finally {
      setAuthLoading(false)
    }
  }

  if (currentPage === 'auth') {
    return (
      <div className="booking-page">
        <div className="booking-shell container">
          <button className="back-link" type="button" onClick={() => setCurrentPage('home')}>
            ← Назад на главную
          </button>

          <section className="auth-card">
            <p className="badge">Аккаунт</p>
            <h1>{authMode === 'register' ? 'Регистрация' : 'Вход'}</h1>
            <p className="booking-text">
              {authMode === 'register'
                ? 'Создай аккаунт для доступа к тренировкам и бронированию.'
                : 'Войди в аккаунт по email и паролю.'}
            </p>

            <div className="auth-switch">
              <button
                className={authMode === 'login' ? 'slot active' : 'slot'}
                type="button"
                onClick={() => {
                  setAuthMode('login')
                  resetAuthMessages()
                }}
              >
                Вход
              </button>
              <button
                className={authMode === 'register' ? 'slot active' : 'slot'}
                type="button"
                onClick={() => {
                  setAuthMode('register')
                  resetAuthMessages()
                }}
              >
                Регистрация
              </button>
            </div>

            <form className="auth-form" onSubmit={onSubmitAuth}>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                className="date-input"
                id="email"
                name="email"
                type="email"
                value={authForm.email}
                onChange={updateAuthForm}
                required
              />

              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                className="date-input"
                id="password"
                name="password"
                type="password"
                value={authForm.password}
                onChange={updateAuthForm}
                minLength={6}
                required
              />

              {authMode === 'register' && (
                <>
                  <label className="field-label" htmlFor="firstName">
                    First name
                  </label>
                  <input
                    className="date-input"
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={authForm.firstName}
                    onChange={updateAuthForm}
                    required
                  />

                  <label className="field-label" htmlFor="lastName">
                    Last name
                  </label>
                  <input
                    className="date-input"
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={authForm.lastName}
                    onChange={updateAuthForm}
                    required
                  />

                  <label className="field-label" htmlFor="country">
                    Country
                  </label>
                  <input
                    className="date-input"
                    id="country"
                    name="country"
                    type="text"
                    value={authForm.country}
                    onChange={updateAuthForm}
                    required
                  />

                  <label className="field-label" htmlFor="city">
                    City
                  </label>
                  <input
                    className="date-input"
                    id="city"
                    name="city"
                    type="text"
                    value={authForm.city}
                    onChange={updateAuthForm}
                    required
                  />
                </>
              )}

              {authError && <p className="auth-error">{authError}</p>}
              {authSuccess && <p className="auth-success">{authSuccess}</p>}

              <button className="primary pay-button" type="submit" disabled={authLoading}>
                {authLoading
                  ? 'Подожди...'
                  : authMode === 'register'
                    ? 'Зарегистрироваться'
                    : 'Войти'}
              </button>
            </form>
          </section>
        </div>
      </div>
    )
  }

  if (currentPage === 'booking') {
    return (
      <div className="booking-page">
        <div className="booking-shell container">
          <button
            className="back-link"
            type="button"
            onClick={() => setCurrentPage('home')}
          >
            ← Назад на главную
          </button>

          <div className="booking-layout">
            <section className="booking-card">
              <p className="badge">Онлайн бронирование</p>
              <h1>Забронируй тренировку и переходи к оплате</h1>
              <p className="booking-text">
                Выбери удобную дату и время. После подтверждения ты сразу перейдёшь
                к безопасной оплате занятия.
              </p>

              <label className="field-label" htmlFor="booking-date">
                Дата тренировки
              </label>
              <input
                className="date-input"
                id="booking-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />

              <p className="field-label">Время</p>
              <div className="slots">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={slot === selectedTime ? 'slot active' : 'slot'}
                    onClick={() => setSelectedTime(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </section>

            <aside className="summary-card">
              <h3>Детали бронирования</h3>
              <div className="summary-row">
                <span>Тренировка</span>
                <strong>Функционал + кардио</strong>
              </div>
              <div className="summary-row">
                <span>Дата</span>
                <strong>{selectedDate || 'Не выбрана'}</strong>
              </div>
              <div className="summary-row">
                <span>Время</span>
                <strong>{selectedTime}</strong>
              </div>
              <div className="summary-row total">
                <span>К оплате</span>
                <strong>7 900 ₸</strong>
              </div>

              <button
                className="primary pay-button"
                type="button"
                disabled={!selectedDate}
                onClick={() => window.location.assign(paymentUrl)}
              >
                Оплатить тренировку
              </button>
              {!selectedDate && (
                <p className="hint">Сначала выбери дату в календаре.</p>
              )}
            </aside>
          </div>
        </div>
      </div>
    )
  }

  if (currentPage === 'shop') {
    const normalizedQuery = shopSearchQuery.trim().toLowerCase()
    const searchedProducts = products.filter((item) =>
      item.name.toLowerCase().includes(normalizedQuery),
    )

    const sortedProducts = [...searchedProducts].sort((a, b) => {
      if (shopPriceSort === 'asc') {
        return a.priceKzt - b.priceKzt
      }

      if (shopPriceSort === 'desc') {
        return b.priceKzt - a.priceKzt
      }

      return a.id - b.id
    })

    return (
      <div className="page">
        <header className="hero shop-hero">
          <nav className="nav container shop-nav">
            <div className="brand">LoreFit</div>
            <div className="nav-links">
              <button className="nav-link-button" type="button" onClick={() => setCurrentPage('home')}>
                Главная
              </button>
              <button className="nav-link-button" type="button" onClick={() => setCurrentPage('shop')}>
                Товары
              </button>
              {authUser && (
                <button
                  className="nav-link-button"
                  type="button"
                  onClick={() => {
                    setCurrentPage('account')
                    loadOrdersData()
                  }}
                >
                  Личный кабинет
                </button>
              )}
              <button
                className="nav-link-button nav-cart-button"
                type="button"
                aria-label={`Корзина, товаров: ${cartItemsCount}`}
                onClick={() => setCurrentPage('cart')}
              >
                <span className="nav-cart-icon" aria-hidden="true">
                  🛒
                </span>
                <span className="nav-cart-label">Корзина</span>
                <span className="nav-cart-count">{cartItemsCount}</span>
              </button>
            </div>
            {authUser ? (
              <div className="auth-nav">
                <span className="auth-user">{authUser.firstName}</span>
                <button className="nav-button" type="button" onClick={onLogout}>
                  Выйти
                </button>
                {isAdmin && (
                  <button
                    className="nav-button admin-nav-button"
                    type="button"
                    onClick={() => {
                      setCurrentPage('admin-panel')
                      loadAdminData()
                    }}
                  >
                    Перейти в консоль администратора
                  </button>
                )}
              </div>
            ) : (
              <button className="nav-button" type="button" onClick={() => setCurrentPage('auth')}>
                Войти
              </button>
            )}
          </nav>
        </header>

        <main>
          <section className="section container shop-page-container">
            <section className="shop-card shop-catalog shop-card-wide">
              <p className="badge">Спортивные товары</p>
              <h1>Товары для эффективных тренировок</h1>
              <p className="booking-text">
                Выбери нужный инвентарь для занятий дома и в зале.
              </p>

              <div className="shop-controls">
                <div>
                  <label className="field-label" htmlFor="shop-search">
                    Поиск по названию
                  </label>
                  <input
                    className="date-input"
                    id="shop-search"
                    type="text"
                    value={shopSearchQuery}
                    onChange={(event) => setShopSearchQuery(event.target.value)}
                    placeholder="Введите название товара"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="shop-sort">
                    Сортировка по цене
                  </label>
                  <select
                    className="date-input"
                    id="shop-sort"
                    value={shopPriceSort}
                    onChange={(event) => setShopPriceSort(event.target.value)}
                  >
                    <option value="default">По умолчанию</option>
                    <option value="asc">Сначала дешевле</option>
                    <option value="desc">Сначала дороже</option>
                  </select>
                </div>
              </div>

              {productsLoading && <p className="booking-text">Загрузка товаров...</p>}
              {productsError && <p className="auth-error">{productsError}</p>}

              <div className="grid cards-4 shop-grid">
                {sortedProducts.map((product) => (
                  <article
                    key={product.id}
                    className="product-card product-card-clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => openProductDetails(product.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openProductDetails(product.id)
                      }
                    }}
                  >
                    <img className="product-image" src={product.imageUrls?.[0]} alt={product.name} />
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="product-footer">
                      <strong>{formatKzt(product.priceKzt)}</strong>
                      <button
                        className="primary"
                        type="button"
                        disabled={product.availabilityStatus !== 'in_stock'}
                        onClick={(event) => {
                          event.stopPropagation()
                          addToCart(product)
                        }}
                      >
                        В корзину
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {!productsLoading && sortedProducts.length === 0 && (
                <p className="booking-text">Товары по вашему запросу не найдены.</p>
              )}
            </section>
          </section>
        </main>
      </div>
    )
  }

  if (currentPage === 'product-details' && selectedProduct) {
    return (
      <div className="booking-page">
        <div className="booking-shell container">
          <button className="back-link" type="button" onClick={() => setCurrentPage('shop')}>
            ← Назад к товарам
          </button>

          <section className="shop-card">
            <p className="badge">Карточка товара</p>
            <h1>{selectedProduct.name}</h1>
            <img className="product-detail-image" src={selectedProduct.imageUrls?.[0]} alt={selectedProduct.name} />

            <div className="detail-grid">
              <div className="summary-row">
                <span>ID</span>
                <strong>{selectedProduct.id}</strong>
              </div>
              <div className="summary-row">
                <span>Категория</span>
                <strong>{categoryLabels[selectedProduct.category]}</strong>
              </div>
              <div className="summary-row">
                <span>Цена</span>
                <strong>{formatKzt(selectedProduct.priceKzt)}</strong>
              </div>
              <div className="summary-row">
                <span>Остаток на складе</span>
                <strong>{selectedProduct.stockQuantity} шт.</strong>
              </div>
              <div className="summary-row">
                <span>Статус наличия</span>
                <strong>{statusLabels[selectedProduct.availabilityStatus]}</strong>
              </div>
              <div className="summary-row">
                <span>Статус активности</span>
                <strong>{selectedProduct.isActive ? 'Активен' : 'Неактивен'}</strong>
              </div>
            </div>

            <p className="booking-text product-detail-description">{selectedProduct.description}</p>

            <button
              className="primary"
              type="button"
              disabled={selectedProduct.availabilityStatus !== 'in_stock'}
              onClick={() => addToCart(selectedProduct)}
            >
              Добавить в корзину
            </button>
          </section>
        </div>
      </div>
    )
  }

  if (currentPage === 'cart') {
    return (
      <div className="booking-page">
        <div className="booking-shell container">
          <button className="back-link" type="button" onClick={() => setCurrentPage('shop')}>
            ← Назад к товарам
          </button>

          <section className="shop-card">
            <p className="badge">Корзина</p>
            <h1>Твои товары</h1>

            {cartItems.length === 0 ? (
              <p className="booking-text">Корзина пока пуста. Добавь товары в разделе «Товары».</p>
            ) : (
              <>
                <div className="cart-list">
                  {cartItems.map((item) => (
                    <article key={item.productId} className="cart-item">
                      <div>
                        <h3>{item.name}</h3>
                        <p>{formatKzt(item.priceKzt)} за шт.</p>
                      </div>
                      <div className="cart-item-controls">
                        <button
                          type="button"
                          className="slot"
                          onClick={() => changeCartQuantity(item.productId, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          className="slot"
                          onClick={() => changeCartQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="secondary cart-remove-button"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          Удалить
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="summary-row total">
                  <span>Итого</span>
                  <strong>{formatKzt(cartTotalKzt)}</strong>
                </div>

                <button className="primary pay-button" type="button" onClick={() => setCurrentPage('checkout')}>
                  Перейти к оформлению
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    )
  }

  if (currentPage === 'checkout') {
    return (
      <div className="booking-page">
        <div className="booking-shell container">
          <button className="back-link" type="button" onClick={() => setCurrentPage('cart')}>
            ← Назад в корзину
          </button>

          <div className="booking-layout">
            <section className="booking-card">
              <p className="badge">Оформление заказа</p>
              <h1>Подтверди заказ</h1>

              <div className="cart-list">
                {cartItems.map((item) => (
                  <div key={item.productId} className="summary-row">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <strong>{formatKzt(item.priceKzt * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              <p className="field-label">Способ получения</p>
              <div className="auth-switch">
                <button
                  className={fulfillmentType === 'pickup' ? 'slot active' : 'slot'}
                  type="button"
                  onClick={() => setFulfillmentType('pickup')}
                >
                  Самовывоз
                </button>
                <button
                  className={fulfillmentType === 'delivery' ? 'slot active' : 'slot'}
                  type="button"
                  onClick={() => setFulfillmentType('delivery')}
                >
                  Доставка
                </button>
              </div>

              {fulfillmentType === 'delivery' && (
                <>
                  <label className="field-label" htmlFor="delivery-address">
                    Адрес доставки
                  </label>
                  <input
                    className="date-input"
                    id="delivery-address"
                    type="text"
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                    placeholder="Город, улица, дом, квартира"
                    required
                  />
                </>
              )}

              {orderError && <p className="auth-error">{orderError}</p>}
            </section>

            <aside className="summary-card">
              <h3>Оплата</h3>
              <div className="summary-row total">
                <span>К оплате</span>
                <strong>{formatKzt(cartTotalKzt)}</strong>
              </div>
              <button className="primary pay-button" type="button" disabled={orderLoading} onClick={submitOrder}>
                {orderLoading ? 'Обработка...' : 'Оплатить заказ'}
              </button>
            </aside>
          </div>
        </div>
      </div>
    )
  }

  if (currentPage === 'order-success') {
    return (
      <div className="booking-page">
        <div className="booking-shell container">
          <section className="shop-card success-card">
            <p className="badge">Успешно</p>
            <h1>Ваш заказ подтвержден</h1>
            <p className="booking-text">
              Номер заказа: <strong>#{lastOrder?.id}</strong>
            </p>
            <p className="booking-text">Сумма: {formatKzt(lastOrder?.totalAmountKzt || 0)}</p>
            <button className="primary" type="button" onClick={() => setCurrentPage('home')}>
              Вернуться на главную
            </button>
          </section>
        </div>
      </div>
    )
  }

  if (currentPage === 'account') {
    return (
      <div className="page">
        <header className="hero shop-hero">
          <nav className="nav container shop-nav">
            <div className="brand">LoreFit</div>
            <div className="nav-links">
              <button className="nav-link-button" type="button" onClick={() => setCurrentPage('home')}>
                Главная
              </button>
              <button className="nav-link-button" type="button" onClick={() => setCurrentPage('shop')}>
                Товары
              </button>
              <button className="nav-link-button" type="button" onClick={() => setCurrentPage('account')}>
                Личный кабинет
              </button>
            </div>
            {authUser ? (
              <div className="auth-nav">
                <span className="auth-user">{authUser.firstName}</span>
                <button className="nav-button" type="button" onClick={onLogout}>
                  Выйти
                </button>
              </div>
            ) : (
              <button className="nav-button" type="button" onClick={() => setCurrentPage('auth')}>
                Войти
              </button>
            )}
          </nav>
        </header>

        <main>
          <section className="section container shop-page-container">
            <section className="shop-card shop-card-wide">
              <p className="badge">Личный кабинет</p>
              <h1>Настройки аккаунта</h1>

              <div className="account-layout">
                <aside className="account-sidebar">
                  <button
                    className={accountTab === 'profile' ? 'slot active' : 'slot'}
                    type="button"
                    onClick={() => setAccountTab('profile')}
                  >
                    Профиль пользователя
                  </button>
                  <button
                    className={accountTab === 'active' ? 'slot active' : 'slot'}
                    type="button"
                    onClick={() => {
                      setAccountTab('active')
                      loadOrdersData()
                    }}
                  >
                    Активные заказы
                  </button>
                  <button
                    className={accountTab === 'history' ? 'slot active' : 'slot'}
                    type="button"
                    onClick={() => {
                      setAccountTab('history')
                      loadOrdersData()
                    }}
                  >
                    История покупок
                  </button>
                  <button
                    className={accountTab === 'management' ? 'slot active' : 'slot'}
                    type="button"
                    onClick={() => setAccountTab('management')}
                  >
                    Управление аккаунтом
                  </button>
                </aside>

                <div className="account-content">
                  {(accountTab === 'active' || accountTab === 'history') && ordersLoading && (
                    <p className="booking-text">Загрузка...</p>
                  )}
                  {(accountTab === 'active' || accountTab === 'history') && ordersError && (
                    <p className="auth-error">{ordersError}</p>
                  )}

                  {accountTab === 'profile' && (
                    <div className="account-panel">
                      <h2 className="account-subtitle">Профиль пользователя</h2>
                      <div className="detail-grid">
                        <div className="summary-row">
                          <span>Имя</span>
                          <strong>{authUser?.firstName || '-'}</strong>
                        </div>
                        <div className="summary-row">
                          <span>Фамилия</span>
                          <strong>{authUser?.lastName || '-'}</strong>
                        </div>
                        <div className="summary-row">
                          <span>Email</span>
                          <strong>{authUser?.email || '-'}</strong>
                        </div>
                        <div className="summary-row">
                          <span>Страна</span>
                          <strong>{authUser?.country || '-'}</strong>
                        </div>
                        <div className="summary-row">
                          <span>Город</span>
                          <strong>{authUser?.city || '-'}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {accountTab === 'active' && (
                    <div className="account-panel">
                      <h2 className="account-subtitle">Активные заказы</h2>
                      <div className="cart-list">
                        {activeOrders.map((order) => (
                          <article className="cart-item" key={order.id}>
                            <div>
                              <h3>Заказ #{order.id}</h3>
                              <p>{new Date(order.createdAt).toLocaleString('ru-RU')}</p>
                              <p>Статус: {orderStatusLabels[order.status] || order.status}</p>
                              <p>
                                Состав: {(order.items || [])
                                  .map((item) => `${item.name} × ${item.quantity}`)
                                  .join(', ')}
                              </p>
                            </div>
                            <strong>{formatKzt(order.totalAmountKzt)}</strong>
                          </article>
                        ))}
                        {!ordersLoading && activeOrders.length === 0 && (
                          <p className="booking-text">Активных заказов пока нет.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {accountTab === 'history' && (
                    <div className="account-panel">
                      <h2 className="account-subtitle">История покупок</h2>
                      <div className="cart-list">
                        {historyOrders.map((order) => (
                          <article className="cart-item" key={`history-order-${order.id}`}>
                            <div>
                              <h3>Заказ #{order.id}</h3>
                              <p>{new Date(order.createdAt).toLocaleString('ru-RU')}</p>
                              <p>Статус: {orderStatusLabels[order.status] || order.status}</p>
                              <p>
                                Состав: {(order.items || [])
                                  .map((item) => `${item.name} × ${item.quantity}`)
                                  .join(', ')}
                              </p>
                            </div>
                            <strong>{formatKzt(order.totalAmountKzt)}</strong>
                          </article>
                        ))}

                        {historyPrograms.map((program) => (
                          <article className="cart-item" key={`history-program-${program.id}`}>
                            <div>
                              <h3>{program.programTitle}</h3>
                              <p>{new Date(program.createdAt).toLocaleString('ru-RU')}</p>
                              <p>Статус: {program.status === 'paid' ? 'Оплачен' : 'Отменён'}</p>
                              <a href={program.programUrl}>Смотреть программу</a>
                            </div>
                            <strong>{formatKzt(program.amountKzt)}</strong>
                          </article>
                        ))}

                        {!ordersLoading && historyOrders.length === 0 && historyPrograms.length === 0 && (
                          <p className="booking-text">История покупок пока пуста.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {accountTab === 'management' && (
                    <div className="account-panel">
                      <h2 className="account-subtitle">Управление аккаунтом</h2>
                      <p className="booking-text">Действие необратимо: все личные данные будут удалены.</p>
                      {accountDeleteError && <p className="auth-error">{accountDeleteError}</p>}
                      <button
                        className="secondary"
                        type="button"
                        disabled={accountDeleteLoading}
                        onClick={deleteAccount}
                      >
                        {accountDeleteLoading ? 'Удаление...' : 'Удалить аккаунт'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </section>
        </main>
      </div>
    )
  }

  if (currentPage === 'admin-panel') {
    return (
      <div className="booking-page">
        <div className="booking-shell container">
          <button className="back-link" type="button" onClick={() => setCurrentPage('home')}>
            ← Назад на главную
          </button>

          <section className="shop-card">
            <p className="badge">Администратор</p>
            <h1>Управление товарами и заказами</h1>

            {!isAdmin ? (
              <p className="auth-error">Доступ только для администратора.</p>
            ) : (
              <>
                <div className="admin-page-head">
                  <div className="auth-switch admin-tabs">
                    <button
                      className={adminTab === 'products' ? 'slot active' : 'slot'}
                      type="button"
                      onClick={() => setAdminTab('products')}
                    >
                      Товары
                    </button>
                    <button
                      className={adminTab === 'orders' ? 'slot active' : 'slot'}
                      type="button"
                      onClick={() => setAdminTab('orders')}
                    >
                      Заказы
                    </button>
                  </div>
                  <button className="secondary" type="button" onClick={loadAdminData}>
                    Обновить данные
                  </button>
                </div>

                {adminLoading && <p className="booking-text">Загрузка...</p>}
                {adminError && <p className="auth-error">{adminError}</p>}
                {adminSuccess && <p className="auth-success">{adminSuccess}</p>}

                {adminTab === 'products' && (
                  <div className="admin-layout admin-layout-products">
                    <div className="admin-main admin-main-wide">
                      <h3>Поиск и фильтры</h3>
                      <div className="admin-filters-grid">
                        <div>
                          <label className="field-label" htmlFor="admin-products-search">
                            Поиск товара
                          </label>
                          <input
                            className="date-input"
                            id="admin-products-search"
                            type="text"
                            value={adminProductQuery}
                            onChange={(event) => setAdminProductQuery(event.target.value)}
                            placeholder="ID, название, описание"
                          />
                        </div>

                        <div>
                          <label className="field-label" htmlFor="admin-products-category-filter">
                            Категория
                          </label>
                          <select
                            className="date-input"
                            id="admin-products-category-filter"
                            value={adminProductCategoryFilter}
                            onChange={(event) => setAdminProductCategoryFilter(event.target.value)}
                          >
                            <option value="all">Все категории</option>
                            <option value="equipment">Спортивный инвентарь</option>
                            <option value="nutrition">Спортивное питание</option>
                          </select>
                        </div>

                        <div>
                          <label className="field-label" htmlFor="admin-products-active-filter">
                            Активность
                          </label>
                          <select
                            className="date-input"
                            id="admin-products-active-filter"
                            value={adminProductAvailabilityFilter}
                            onChange={(event) => setAdminProductAvailabilityFilter(event.target.value)}
                          >
                            <option value="all">Все</option>
                            <option value="active">Только активные</option>
                            <option value="inactive">Только неактивные</option>
                          </select>
                        </div>
                      </div>

                      <button
                        className="primary pay-button"
                        type="button"
                        onClick={() => {
                          setAdminEditingProductId(null)
                          setAdminProductForm({
                            name: '',
                            category: 'equipment',
                            description: '',
                            priceKzt: '',
                            stockQuantity: '',
                            imageUrlsText: '',
                            isActive: true,
                          })
                          setAdminProductModalOpen(true)
                        }}
                      >
                        Добавить товар
                      </button>
                    </div>

                    <div className="admin-main admin-main-wide">
                      <h2 className="account-subtitle">Список товаров</h2>
                      <div className="cart-list admin-products-list">
                        {filteredAdminProducts.map((product) => (
                          <article className="cart-item admin-product-item" key={`admin-product-${product.id}`}>
                            <div>
                              <h3>{product.name}</h3>
                              <p>ID: {product.id}</p>
                              <p>Категория: {categoryLabels[product.category] || product.category}</p>
                              <p>Цена: {formatKzt(product.priceKzt)}</p>
                              <p>Остаток: {product.stockQuantity} шт.</p>
                              <p>Статус: {product.isActive ? 'Активен' : 'Неактивен'}</p>
                            </div>
                            <div className="admin-actions vertical admin-product-actions">
                              <button className="secondary" type="button" onClick={() => editAdminProduct(product)}>
                                Редактировать
                              </button>
                              <button
                                className="secondary"
                                type="button"
                                onClick={() => setAdminDeleteProductId(product.id)}
                              >
                                Удалить
                              </button>
                            </div>
                          </article>
                        ))}
                        {!adminLoading && filteredAdminProducts.length === 0 && (
                          <p className="booking-text">Товары не найдены.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'orders' && (
                  <div className="admin-layout admin-layout-products">
                    <div className="admin-main admin-main-wide">
                      <h3>Поиск и фильтры</h3>
                      <div className="admin-filters-grid admin-filters-grid-orders">
                        <div>
                          <label className="field-label" htmlFor="admin-orders-search">
                            Поиск заказа
                          </label>
                          <input
                            className="date-input"
                            id="admin-orders-search"
                            type="text"
                            value={adminOrderQuery}
                            onChange={(event) => setAdminOrderQuery(event.target.value)}
                            placeholder="№ заказа или товар"
                          />
                        </div>

                        <div>
                          <label className="field-label" htmlFor="admin-orders-status-filter">
                            Статус
                          </label>
                          <select
                            className="date-input"
                            id="admin-orders-status-filter"
                            value={adminOrderStatusFilter}
                            onChange={(event) => setAdminOrderStatusFilter(event.target.value)}
                          >
                            <option value="all">Все статусы</option>
                            {orderStatusOptions.map((status) => (
                              <option key={status} value={status}>
                                {orderStatusLabels[status]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="field-label" htmlFor="admin-orders-date-from">
                            Дата от
                          </label>
                          <input
                            className="date-input"
                            id="admin-orders-date-from"
                            type="date"
                            value={adminOrderDateFrom}
                            onChange={(event) => setAdminOrderDateFrom(event.target.value)}
                          />
                        </div>

                        <div>
                          <label className="field-label" htmlFor="admin-orders-date-to">
                            Дата до
                          </label>
                          <input
                            className="date-input"
                            id="admin-orders-date-to"
                            type="date"
                            value={adminOrderDateTo}
                            onChange={(event) => setAdminOrderDateTo(event.target.value)}
                          />
                        </div>

                        <div>
                          <label className="field-label" htmlFor="admin-orders-sum-min">
                            Сумма от (₸)
                          </label>
                          <input
                            className="date-input"
                            id="admin-orders-sum-min"
                            type="number"
                            min="0"
                            value={adminOrderMinSum}
                            onChange={(event) => setAdminOrderMinSum(event.target.value)}
                          />
                        </div>

                        <div>
                          <label className="field-label" htmlFor="admin-orders-sum-max">
                            Сумма до (₸)
                          </label>
                          <input
                            className="date-input"
                            id="admin-orders-sum-max"
                            type="number"
                            min="0"
                            value={adminOrderMaxSum}
                            onChange={(event) => setAdminOrderMaxSum(event.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-main admin-main-wide">
                      <h2 className="account-subtitle">Список заказов</h2>
                      <div className="cart-list admin-products-list">
                        {filteredAdminOrders.map((order) => (
                          <article className="cart-item admin-product-item" key={`admin-order-${order.id}`}>
                            <div>
                              <h3>Заказ #{order.id}</h3>
                              <p>{new Date(order.createdAt).toLocaleString('ru-RU')}</p>
                              <p>Статус: {orderStatusLabels[order.status] || order.status}</p>
                              <p>Сумма: {formatKzt(order.totalAmountKzt)}</p>
                              <p>
                                Состав: {(order.items || [])
                                  .map((item) => `${item.name} × ${item.quantity}`)
                                  .join(', ')}
                              </p>
                            </div>
                            <div className="admin-actions vertical admin-product-actions">
                              <button
                                className="primary"
                                type="button"
                                onClick={() => {
                                  setAdminStatusModalOrderId(order.id)
                                  setAdminStatusModalValue(order.status)
                                }}
                              >
                                Изменить статус
                              </button>
                            </div>
                          </article>
                        ))}
                        {!adminLoading && filteredAdminOrders.length === 0 && (
                          <p className="booking-text">Заказы не найдены.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {adminProductModalOpen && (
                  <div className="admin-modal-overlay" role="dialog" aria-modal="true">
                    <div className="admin-modal-card">
                      <h2>{adminEditingProductId ? 'Редактировать товар' : 'Создать товар'}</h2>
                      <form className="auth-form admin-form" onSubmit={submitAdminProduct}>
                        <label className="field-label" htmlFor="admin-name">
                          Название
                        </label>
                        <input
                          className="date-input"
                          id="admin-name"
                          name="name"
                          type="text"
                          value={adminProductForm.name}
                          onChange={updateAdminProductForm}
                          required
                        />

                        <label className="field-label" htmlFor="admin-category">
                          Категория
                        </label>
                        <select
                          className="date-input"
                          id="admin-category"
                          name="category"
                          value={adminProductForm.category}
                          onChange={updateAdminProductForm}
                        >
                          <option value="equipment">Спортивный инвентарь</option>
                          <option value="nutrition">Спортивное питание</option>
                        </select>

                        <label className="field-label" htmlFor="admin-description">
                          Описание
                        </label>
                        <textarea
                          className="date-input admin-textarea"
                          id="admin-description"
                          name="description"
                          value={adminProductForm.description}
                          onChange={updateAdminProductForm}
                          required
                        />

                        <label className="field-label" htmlFor="admin-price">
                          Цена (₸)
                        </label>
                        <input
                          className="date-input"
                          id="admin-price"
                          name="priceKzt"
                          type="number"
                          min="1"
                          value={adminProductForm.priceKzt}
                          onChange={updateAdminProductForm}
                          required
                        />

                        <label className="field-label" htmlFor="admin-stock">
                          Количество на складе
                        </label>
                        <input
                          className="date-input"
                          id="admin-stock"
                          name="stockQuantity"
                          type="number"
                          min="0"
                          value={adminProductForm.stockQuantity}
                          onChange={updateAdminProductForm}
                          required
                        />

                        <label className="field-label" htmlFor="admin-images">
                          Изображения (через запятую)
                        </label>
                        <input
                          className="date-input"
                          id="admin-images"
                          name="imageUrlsText"
                          type="text"
                          value={adminProductForm.imageUrlsText}
                          onChange={updateAdminProductForm}
                        />

                        <label className="admin-checkbox">
                          <input
                            type="checkbox"
                            name="isActive"
                            checked={adminProductForm.isActive}
                            onChange={updateAdminProductForm}
                          />
                          Активный товар
                        </label>

                        <div className="admin-actions">
                          <button className="primary" type="submit">
                            {adminEditingProductId ? 'Сохранить изменения' : 'Создать товар'}
                          </button>
                          <button className="secondary" type="button" onClick={resetAdminProductForm}>
                            Отмена
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {adminDeleteProductId !== null && (
                  <div className="admin-modal-overlay" role="dialog" aria-modal="true">
                    <div className="admin-modal-card small">
                      <h2>Подтверждение удаления</h2>
                      <p className="booking-text">Вы уверены, что хотите удалить товар?</p>
                      <div className="admin-actions">
                        <button className="primary" type="button" onClick={() => deleteAdminProduct(adminDeleteProductId)}>
                          Да, удалить
                        </button>
                        <button className="secondary" type="button" onClick={() => setAdminDeleteProductId(null)}>
                          Отмена
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {adminStatusModalOrderId !== null && (
                  <div className="admin-modal-overlay" role="dialog" aria-modal="true">
                    <div className="admin-modal-card small">
                      <h2>Изменить статус заказа</h2>
                      <label className="field-label" htmlFor="admin-status-modal-select">
                        Новый статус
                      </label>
                      <select
                        className="date-input"
                        id="admin-status-modal-select"
                        value={adminStatusModalValue}
                        onChange={(event) => setAdminStatusModalValue(event.target.value)}
                      >
                        {orderStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {orderStatusLabels[status]}
                          </option>
                        ))}
                      </select>

                      <div className="admin-actions">
                        <button
                          className="primary"
                          type="button"
                          onClick={() => updateAdminOrderStatus(adminStatusModalOrderId, adminStatusModalValue)}
                        >
                          Сохранить
                        </button>
                        <button className="secondary" type="button" onClick={() => setAdminStatusModalOrderId(null)}>
                          Отмена
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="hero">
        <nav className="nav container">
          <div className="brand">LoreFit</div>
          <div className="nav-links">
            <a href="#catalog">Каталог</a>
            <a href="#trainers">О тренере</a>
            <a href="#reviews">Отзывы</a>
            <button className="nav-link-button" type="button" onClick={() => setCurrentPage('shop')}>
              Товары
            </button>
            {authUser && (
              <button
                className="nav-link-button"
                type="button"
                onClick={() => {
                  setCurrentPage('account')
                  loadOrdersData()
                }}
              >
                Личный кабинет
              </button>
            )}
            <button
              className="nav-link-button nav-cart-button"
              type="button"
              aria-label={`Корзина, товаров: ${cartItemsCount}`}
              onClick={() => setCurrentPage('cart')}
            >
              <span className="nav-cart-icon" aria-hidden="true">
                🛒
              </span>
              <span className="nav-cart-label">Корзина</span>
              <span className="nav-cart-count">{cartItemsCount}</span>
            </button>
          </div>
          {authUser ? (
            <div className="auth-nav">
              <span className="auth-user">{authUser.firstName}</span>
              <button className="nav-button" type="button" onClick={onLogout}>
                Выйти
              </button>
              {isAdmin && (
                <button
                  className="nav-button admin-nav-button"
                  type="button"
                  onClick={() => {
                    setCurrentPage('admin-panel')
                    loadAdminData()
                  }}
                >
                  Перейти в консоль администратора
                </button>
              )}
            </div>
          ) : (
            <button className="nav-button" type="button" onClick={() => setCurrentPage('auth')}>
              Войти
            </button>
          )}
        </nav>

        <div className="hero-content container">
          <div>
            <p className="badge">Маркетплейс онлайн тренировок</p>
            <h1>Тренируйся с персональным тренером, где и когда удобно</h1>
            <p className="hero-text">
              Сравнивай программы, выбирай формат и начинай занятия уже сегодня.
              Все курсы, интенсивы и персональные планы в одном месте.
            </p>
            <div className="hero-actions">
              <button className="primary" onClick={() => setCurrentPage('booking')}>
                Забронировать тренировку
              </button>
              <button className="secondary" onClick={() => setCurrentPage('shop')}>
                Спортивные товары
              </button>
            </div>
          </div>

          <div className="hero-card">
            <p className="hero-card-title">Популярная программа</p>
            <h3>21 день: сильное тело дома</h3>
            <p>12 видеоуроков · чат с тренером · персональный план питания</p>
            <div className="hero-meta">
              <span>4.9 ★</span>
              <span>1 240 участников</span>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="section container" id="catalog">
          <div className="section-head">
            <h2>Категории тренировок</h2>
            <p>Выбирай направление под свою цель и текущий уровень подготовки.</p>
          </div>
          <div className="grid cards-4">
            {categories.map((item) => (
              <article key={item.title} className="card-item">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span>{item.level}</span>
                <button
                  className="primary category-buy-button"
                  type="button"
                  onClick={() => buyOnlineProgram(item.title)}
                >
                  Купить онлайн-программу
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="section section-soft" id="trainers">
          <div className="container">
            <div className="section-head">
              <h2>Тренер платформы</h2>
              <p>Профиль доступного тренера для онлайн-занятий.</p>
            </div>
            <div className="grid cards-3">
              {trainers.map((trainer) => (
                <article key={trainer.name} className="trainer-card">
                  <div className="avatar" aria-hidden="true">
                    {trainer.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')}
                  </div>
                  <h3>{trainer.name}</h3>
                  <p>{trainer.specialty}</p>
                  <span>{trainer.stats}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section container" id="how">
          <div className="section-head">
            <h2>Как это работает</h2>
          </div>
          <div className="grid cards-3 steps">
            {steps.map((step, index) => (
              <article key={step.title} className="step-card">
                <div className="step-number">0{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section container" id="reviews">
          <div className="section-head">
            <h2>Что говорят пользователи</h2>
          </div>
          <div className="grid cards-2">
            {reviews.map((review) => (
              <blockquote key={review.author} className="review-card">
                <p>“{review.text}”</p>
                <cite>{review.author}</cite>
              </blockquote>
            ))}
          </div>
        </section>
      </main>

      <section className="cta">
        <div className="container cta-inner">
          <div>
            <h2>Начни путь к своей форме уже сегодня</h2>
            <p>Регистрация занимает меньше минуты. Первые тренировки доступны сразу.</p>
          </div>
          <button className="primary" onClick={() => setCurrentPage('booking')}>
            Перейти к бронированию
          </button>
        </div>
      </section>
    </div>
  )
}

export default App
