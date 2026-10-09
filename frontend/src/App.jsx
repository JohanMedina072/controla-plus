import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

import AuthPage from './components/auth/AuthPage'
import ProfileForm from './components/auth/ProfileForm'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import AccountList from './components/accounts/AccountList'
import AccountForm from './components/accounts/AccountForm'
import QuickMovementForm from './components/movements/QuickMovementForm'
import VoiceMovementReview from './components/movements/VoiceMovementReview'
import ReminderList from './components/reminders/ReminderList'
import ReminderForm from './components/reminders/ReminderForm'
import SummaryCards from './components/dashboard/SummaryCards'
import InsightsPanel from './components/dashboard/InsightsPanel'
import MovementList from './components/movements/MovementList'
import MovementForm from './components/movements/MovementForm'
import CategorySummary from './components/dashboard/CategorySummary'
import ExpenseChart from './components/dashboard/ExpenseChart'
import MonthlyChart from './components/dashboard/MonthlyChart'
import exportMovementsToExcel from './utils/exportMovementsToExcel'
import validateMovement from './utils/validateMovement'
import validateAccount from './utils/validateAccount'
import validateReminder from './utils/validateReminder'
import { getSpendingInsights } from './utils/spendingInsights'
import parseVoiceMovement from './utils/parseVoiceMovement'

import formatMoney from './utils/formatMoney'

import {
  getCatalog,
  getMovements,
  removeMovement,
  saveMovement,
} from './services/movement.service'
import { getAccounts, saveAccount } from './services/account.service'
import {
  completeReminder,
  getReminders,
  removeReminder,
  saveReminder,
} from './services/reminder.service'
import { REMINDER_NAMES } from './utils/reminderOptions'
import {
  clearStoredAuth,
  getStoredAuth,
  saveStoredAuth,
} from './utils/authStorage'

function App() {
  const [auth, setAuth] = useState(() => getStoredAuth())
  const [movements, setMovements] = useState([])
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMovementId, setEditingMovementId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [accounts, setAccounts] = useState([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [accountError, setAccountError] = useState('')
  const [accountMessage, setAccountMessage] = useState('')
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false)
  const [accountSaving, setAccountSaving] = useState(false)
  const [accountFormData, setAccountFormData] = useState({
    name: '',
    initialBalance: '',
  })
  const [reminders, setReminders] = useState([])
  const [remindersLoading, setRemindersLoading] = useState(true)
  const [reminderError, setReminderError] = useState('')
  const [reminderMessage, setReminderMessage] = useState('')
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false)
  const [editingReminderId, setEditingReminderId] = useState(null)
  const [reminderSaving, setReminderSaving] = useState(false)
  const [reminderFormData, setReminderFormData] = useState({
    type: 'CREDIT_CARD',
    name: '',
    nextDueDate: '',
    amount: '',
  })

  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    amount: '',
    description: '',
    categoryId: '',
    paymentMethodId: '',
    accountId: '',
  })
  const [quickFormData, setQuickFormData] = useState({
    type: 'EXPENSE',
    amount: '',
    description: '',
    categoryId: '',
    paymentMethodId: '',
    accountId: '',
  })
  const [quickSaving, setQuickSaving] = useState(false)
  const [quickError, setQuickError] = useState('')
  const [quickMessage, setQuickMessage] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [voiceDraft, setVoiceDraft] = useState(null)
  const [voiceSaving, setVoiceSaving] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const voiceReviewRef = useRef(null)

  useEffect(() => {
    const handleAuthExpired = () => setAuth(null)

    window.addEventListener('controla:auth-expired', handleAuthExpired)

    return () => {
      window.removeEventListener('controla:auth-expired', handleAuthExpired)
    }
  }, [])

  useEffect(() => {
    if (!auth) return

    const loadData = async () => {
      try {
        setLoading(true)
        setAccountsLoading(true)
        setRemindersLoading(true)
        setError('')
        setAccountError('')
        setReminderError('')

        const [
          movementsResult,
          catalogResult,
          accountsResult,
          remindersResult,
        ] = await Promise.all([
          getMovements(),
          getCatalog(),
          getAccounts(),
          getReminders(),
        ])

        setMovements(movementsResult)
        setCategories(catalogResult.categories)
        setPaymentMethods(catalogResult.paymentMethods)
        setAccounts(accountsResult)
        setReminders(remindersResult)

        const firstExpenseCategory = catalogResult.categories.find(
          (category) => category.type === 'EXPENSE',
        )

        setFormData((current) => ({
          ...current,
          categoryId: firstExpenseCategory?.id || '',
          paymentMethodId: catalogResult.paymentMethods[0]?.id || '',
        }))

        setQuickFormData((current) => ({
          ...current,
          categoryId: firstExpenseCategory?.id || '',
          paymentMethodId: catalogResult.paymentMethods[0]?.id || '',
        }))
      } catch (error) {
        setError(error.message)
        setAccountError(error.message)
        setReminderError(error.message)
      } finally {
        setLoading(false)
        setAccountsLoading(false)
        setRemindersLoading(false)
      }
    }

    loadData()
  }, [auth])

  useEffect(() => {
    if (!voiceDraft) return

    voiceReviewRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [voiceDraft])

  const searchFilteredMovements = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es-PE')

    return movements.filter((movement) => {
      if (!normalizedSearch) return true

      const searchableText = [
        movement.description,
        movement.category?.name,
        movement.account?.name,
        movement.paymentMethod?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es-PE')

      return searchableText.includes(normalizedSearch)
    })
  }, [movements, searchTerm])

  const filteredMovements = useMemo(() => {
    if (!selectedMonth) return searchFilteredMovements

    return searchFilteredMovements.filter(
      (movement) => movement.date?.slice(0, 7) === selectedMonth,
    )
  }, [searchFilteredMovements, selectedMonth])

  const categoryTotals = useMemo(() => {
    const totalsByCategory = filteredMovements
      .filter((movement) => movement.type === 'EXPENSE')
      .reduce((accumulator, movement) => {
        const categoryName = movement.category?.name || 'Sin categoría'
        const amount = Number(movement.amount)

        accumulator[categoryName] =
          (accumulator[categoryName] || 0) + amount

        return accumulator
      }, {})

    const totalExpenses = Object.values(totalsByCategory).reduce(
      (total, amount) => total + amount,
      0,
    )

    return Object.entries(totalsByCategory)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpenses
          ? (amount / totalExpenses) * 100
          : 0,
      }))
      .sort((first, second) => second.amount - first.amount)
  }, [filteredMovements])

const monthlyTotals = useMemo(() => {
  const totalsByMonth = searchFilteredMovements.reduce((accumulator, movement) => {
    const month = movement.date?.slice(0, 7)

    if (!month) return accumulator

    if (!accumulator[month]) {
      accumulator[month] = {
        month,
        income: 0,
        expenses: 0,
      }
    }

    const amount = Number(movement.amount)

    if (movement.type === 'INCOME') {
      accumulator[month].income += amount
    } else {
      accumulator[month].expenses += amount
    }

    return accumulator
  }, {})

  return Object.values(totalsByMonth)
    .sort((first, second) => first.month.localeCompare(second.month))
    .map((item) => ({
      ...item,
      label: new Intl.DateTimeFormat('es-PE', {
        month: 'short',
        year: 'numeric',
      }).format(new Date(`${item.month}-01T00:00:00`)),
    }))
}, [searchFilteredMovements])


  const totals = useMemo(() => {
    return filteredMovements.reduce(
      (accumulator, movement) => {
        const amount = Number(movement.amount)

        if (movement.type === 'INCOME') {
          accumulator.income += amount
        } else {
          accumulator.expenses += amount
        }

        return accumulator
      },
      { income: 0, expenses: 0 },
    )
  }, [filteredMovements])

  const balance = totals.income - totals.expenses

  const spendingInsights = useMemo(
    () => getSpendingInsights(searchFilteredMovements, selectedMonth),
    [searchFilteredMovements, selectedMonth],
  )

  const availableBalance = useMemo(
    () =>
      accounts
        .filter((account) => account.isActive)
        .reduce((total, account) => total + Number(account.currentBalance), 0),
    [accounts],
  )

  const resetForm = () => {
    setFormData({
      type: 'EXPENSE',
      amount: '',
      description: '',
      categoryId:
        categories.find((category) => category.type === 'EXPENSE')?.id || '',
      paymentMethodId: paymentMethods[0]?.id || '',
      accountId: '',
    })

    setEditingMovementId(null)
  }

  const resetAccountForm = () => {
    setAccountFormData({
      name: '',
      initialBalance: '',
    })
  }

  const handleNewAccount = () => {
    resetAccountForm()
    setAccountError('')
    setAccountMessage('')
    setIsAccountFormOpen(true)
  }

  const handleAccountCancel = () => {
    resetAccountForm()
    setAccountError('')
    setAccountMessage('')
    setIsAccountFormOpen(false)
  }

  const handleAccountChange = (event) => {
    const { name, value } = event.target

    setAccountFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleAccountSubmit = async (event) => {
    event.preventDefault()
    setAccountError('')
    setAccountMessage('')

    const validationMessage = validateAccount(accountFormData)

    if (validationMessage) {
      setAccountError(validationMessage)
      return
    }

    try {
      setAccountSaving(true)

      const account = await saveAccount({
        name: accountFormData.name.trim(),
        initialBalance: Number(accountFormData.initialBalance),
      })

      setAccounts((current) => [...current, account])
      resetAccountForm()
      setIsAccountFormOpen(false)
      setAccountMessage('Cuenta creada correctamente.')
    } catch (saveError) {
      setAccountError(
        saveError.message || 'Ocurrió un error al crear la cuenta.',
      )
    } finally {
      setAccountSaving(false)
    }
  }

  const resetReminderForm = () => {
    setReminderFormData({
      type: 'CREDIT_CARD',
      name: '',
      nextDueDate: '',
      amount: '',
    })
    setEditingReminderId(null)
  }

  const handleNewReminder = () => {
    resetReminderForm()
    setReminderError('')
    setReminderMessage('')
    setIsReminderFormOpen(true)
  }

  const handleReminderCancel = () => {
    resetReminderForm()
    setReminderError('')
    setReminderMessage('')
    setIsReminderFormOpen(false)
  }

  const handleReminderChange = (event) => {
    const { name, value } = event.target

    setReminderFormData((current) => {
      if (name === 'type') {
        return {
          ...current,
          type: value,
          name: REMINDER_NAMES[value]?.[0] || '',
        }
      }

      return {
        ...current,
        [name]: value,
      }
    })
  }

  const handleReminderSubmit = async (event) => {
    event.preventDefault()
    setReminderError('')
    setReminderMessage('')

    const validationMessage = validateReminder(reminderFormData)

    if (validationMessage) {
      setReminderError(validationMessage)
      return
    }

    try {
      setReminderSaving(true)

      const isEditing = Boolean(editingReminderId)
      const result = await saveReminder({
        reminderId: isEditing ? editingReminderId : null,
        data: {
          type: reminderFormData.type,
          name: reminderFormData.name,
          nextDueDate: reminderFormData.nextDueDate,
          amount:
            reminderFormData.amount === ''
              ? null
              : Number(reminderFormData.amount),
        },
      })

      if (isEditing) {
        setReminders((current) =>
          current.map((reminder) =>
            reminder.id === editingReminderId ? result : reminder,
          ),
        )
      } else {
        setReminders((current) => [...current, result])
      }

      resetReminderForm()
      setIsReminderFormOpen(false)
      setReminderMessage(
        isEditing
          ? 'Recordatorio actualizado correctamente.'
          : 'Recordatorio guardado correctamente.',
      )
    } catch (saveError) {
      setReminderError(
        saveError.message || 'Ocurrió un error al guardar el recordatorio.',
      )
    } finally {
      setReminderSaving(false)
    }
  }

  const handleEditReminder = (reminder) => {
    setReminderFormData({
      type: reminder.type,
      name: reminder.name,
      nextDueDate: reminder.nextDueDate || '',
      amount: reminder.amount || '',
    })
    setEditingReminderId(reminder.id)
    setReminderError('')
    setReminderMessage('')
    setIsReminderFormOpen(true)
  }

  const handleCompleteReminder = async (reminderId) => {
    setReminderError('')
    setReminderMessage('')

    try {
      const result = await completeReminder(reminderId)

      setReminders((current) =>
        current.map((reminder) =>
          reminder.id === reminderId ? result : reminder,
        ),
      )
      setReminderMessage(
        'Recordatorio marcado como pagado. No se modificó ninguna cuenta ni movimiento.',
      )
    } catch (completeError) {
      setReminderError(completeError.message)
    }
  }

  const handleDeleteReminder = async (reminderId) => {
    const confirmed = window.confirm(
      '¿Seguro que deseas eliminar este recordatorio?',
    )

    if (!confirmed) return

    setReminderError('')
    setReminderMessage('')

    try {
      await removeReminder(reminderId)
      setReminders((current) =>
        current.filter((reminder) => reminder.id !== reminderId),
      )
      setReminderMessage('Recordatorio eliminado correctamente.')
    } catch (deleteError) {
      setReminderError(deleteError.message)
    }
  }

  const refreshAccounts = async () => {
    try {
      const accountsResult = await getAccounts()
      setAccounts(accountsResult)
    } catch (refreshError) {
      setAccountError(refreshError.message)
    }
  }

  const handleNewMovement = () => {
    resetForm()
    setMessage('')
    setError('')
    setIsFormOpen(true)
  }

  const resetQuickForm = () => {
    setQuickFormData({
      type: 'EXPENSE',
      amount: '',
      description: '',
      categoryId:
        categories.find((category) => category.type === 'EXPENSE')?.id || '',
      paymentMethodId: paymentMethods[0]?.id || '',
      accountId: '',
    })
  }

  const handleQuickChange = (event) => {
    const { name, value } = event.target

    setQuickFormData((current) => {
      if (name === 'type') {
        const firstCategory = categories.find(
          (category) => category.type === value,
        )

        return {
          ...current,
          type: value,
          categoryId: firstCategory?.id || '',
        }
      }

      return {
        ...current,
        [name]: value,
      }
    })
  }

  const handleCancel = () => {
    resetForm()
    setMessage('')
    setError('')
    setIsFormOpen(false)
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => {
      if (name === 'type') {
        const firstCategory = categories.find(
          (category) => category.type === value,
        )

        return {
          ...current,
          type: value,
          categoryId: firstCategory?.id || '',
        }
      }

      return {
        ...current,
        [name]: value,
      }
    })
  }

  const handleEdit = (movement) => {
    setFormData({
      type: movement.type,
      amount: movement.amount,
      description: movement.description || '',
      categoryId: movement.categoryId,
      paymentMethodId: movement.paymentMethodId,
      accountId: movement.accountId || '',
    })

    setEditingMovementId(movement.id)
    setIsFormOpen(true)
    setMessage('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const validationMessage = validateMovement(formData)

    if (validationMessage) {
      setError(validationMessage)
      return
    }

    try {
      setSaving(true)

      const isEditing = Boolean(editingMovementId)

      const result = await saveMovement({
        movementId: isEditing ? editingMovementId : null,
        data: {
          type: formData.type,
          amount: Number(formData.amount),
          description: formData.description.trim(),
          categoryId: formData.categoryId,
          paymentMethodId: formData.paymentMethodId,
          accountId: formData.accountId,
        },
      })

      if (isEditing) {
        setMovements((current) =>
          current.map((movement) =>
            movement.id === editingMovementId
              ? result
              : movement,
          ),
        )
      } else {
        setMovements((current) => [result, ...current])
      }

      await refreshAccounts()

      resetForm()
      setIsFormOpen(false)

      setMessage(
        isEditing
          ? 'Movimiento actualizado correctamente.'
          : 'Movimiento guardado correctamente.',
      )
    } catch (submitError) {
      setError(
        submitError.message ||
          'Ocurrió un error al guardar el movimiento.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleQuickSubmit = async (event) => {
    event.preventDefault()
    setQuickError('')
    setQuickMessage('')

    const validationMessage = validateMovement(quickFormData)

    if (validationMessage) {
      setQuickError(validationMessage)
      return
    }

    try {
      setQuickSaving(true)

      const result = await saveMovement({
        movementId: null,
        data: {
          type: quickFormData.type,
          amount: Number(quickFormData.amount),
          description: quickFormData.description.trim(),
          categoryId: quickFormData.categoryId,
          paymentMethodId: quickFormData.paymentMethodId,
          accountId: quickFormData.accountId,
        },
      })

      setMovements((current) => [result, ...current])
      await refreshAccounts()
      resetQuickForm()
      setQuickMessage('Movimiento guardado correctamente.')
    } catch (submitError) {
      setQuickError(
        submitError.message ||
          'Ocurrió un error al guardar el movimiento.',
      )
    } finally {
      setQuickSaving(false)
    }
  }

  const handleDelete = async (movementId) => {
    const confirmed = window.confirm(
      '¿Seguro que deseas eliminar este movimiento?',
    )

    if (!confirmed) return

    setMessage('')
    setError('')

    try {
      await removeMovement(movementId)

      setMovements((current) =>
        current.filter((movement) => movement.id !== movementId),
      )

      await refreshAccounts()

      setMessage('Movimiento eliminado correctamente.')
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  const handleAuthenticated = (session) => {
    saveStoredAuth(session)
    setAuth(session)
  }

  const handleLogout = () => {
    clearStoredAuth()
    setAuth(null)
  }

  const handleProfileOpen = () => {
    setProfileMessage('')
    setIsProfileOpen(true)
  }

  const handleProfileCancel = () => {
    setProfileMessage('')
    setIsProfileOpen(false)
  }

  const handleProfileUpdated = (updatedUser) => {
    const updatedAuth = {
      ...auth,
      user: updatedUser,
    }

    saveStoredAuth(updatedAuth)
    setAuth(updatedAuth)
    setIsProfileOpen(false)
    setProfileMessage('Perfil actualizado correctamente.')
  }

  const handleVoiceTranscript = (transcript) => {
    const parsedMovement = parseVoiceMovement(transcript, {
      categories,
      paymentMethods,
      accounts,
    })

    setVoiceDraft({
      transcript,
      ...parsedMovement,
    })
    setVoiceError('')
  }

  const handleVoiceCancel = () => {
    setVoiceDraft(null)
    setVoiceError('')
  }

  const handleVoiceSubmit = async (formData) => {
    setVoiceError('')

    const validationMessage = validateMovement(formData)

    if (validationMessage) {
      setVoiceError(validationMessage)
      return
    }

    try {
      setVoiceSaving(true)

      const result = await saveMovement({
        movementId: null,
        data: {
          type: formData.type,
          amount: Number(formData.amount),
          description: formData.description.trim(),
          categoryId: formData.categoryId,
          paymentMethodId: formData.paymentMethodId,
          accountId: formData.accountId,
        },
      })

      setMovements((current) => [result, ...current])
      await refreshAccounts()
      setVoiceDraft(null)
      setMessage('Movimiento registrado por voz correctamente.')
    } catch (submitError) {
      setVoiceError(
        submitError.message || 'No se pudo guardar el movimiento por voz.',
      )
    } finally {
      setVoiceSaving(false)
    }
  }

  const handleNavigate = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  if (!auth) {
    return <AuthPage onAuthenticated={handleAuthenticated} />
  }

  return (
    <main className="app-shell">
      <Sidebar
        user={auth.user}
        onNavigate={handleNavigate}
        onToggleForm={handleNewMovement}
        onToggleProfile={handleProfileOpen}
        onLogout={handleLogout}
      />

      <div className="app">
      <Header
        user={auth.user}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenReminders={() => handleNavigate('reminders-section')}
        onToggleProfile={handleProfileOpen}
        reminderCount={reminders.length}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onClearMonth={() => setSelectedMonth('')}
      />
      {isProfileOpen && (
        <ProfileForm
          user={auth.user}
          onCancel={handleProfileCancel}
          onUpdated={handleProfileUpdated}
        />
      )}
      {!isProfileOpen && profileMessage && (
        <p className="form-message">{profileMessage}</p>
      )}
      <div className="dashboard-hero-grid">
        <div className="dashboard-summary-column">
          <SummaryCards
            balance={balance}
            availableBalance={availableBalance}
            income={totals.income}
            expenses={totals.expenses}
            monthlyChange={spendingInsights.changePercentage}
            formatMoney={formatMoney}
          />
        </div>

        <div className="dashboard-quick-column">
          <QuickMovementForm
            formData={quickFormData}
            categories={categories}
            paymentMethods={paymentMethods}
            accounts={accounts}
            onChange={handleQuickChange}
            onSubmit={handleQuickSubmit}
            onOpenDetailed={handleNewMovement}
            saving={quickSaving}
            error={quickError}
            message={quickMessage}
            onVoiceTranscript={handleVoiceTranscript}
          />
          {voiceDraft && (
            <div ref={voiceReviewRef} className="voice-review-anchor">
              <VoiceMovementReview
                key={voiceDraft.transcript}
                draft={voiceDraft}
                categories={categories}
                paymentMethods={paymentMethods}
                accounts={accounts}
                onSubmit={handleVoiceSubmit}
                onCancel={handleVoiceCancel}
                saving={voiceSaving}
                error={voiceError}
              />
            </div>
          )}
        </div>
      </div>
      <div className="dashboard-secondary-grid">
        <div className="dashboard-secondary-panel">
          <AccountList
            accounts={accounts}
            loading={accountsLoading}
            error={accountError}
            formatMoney={formatMoney}
            onAdd={handleNewAccount}
          />
          {isAccountFormOpen && (
            <AccountForm
              formData={accountFormData}
              onChange={handleAccountChange}
              onSubmit={handleAccountSubmit}
              onCancel={handleAccountCancel}
              saving={accountSaving}
              error={accountError}
            />
          )}
          {!isAccountFormOpen && accountMessage && (
            <p className="form-message">{accountMessage}</p>
          )}
        </div>

        <div className="dashboard-secondary-panel">
          <ReminderList
            reminders={reminders}
            loading={remindersLoading}
            error={reminderError}
            formatMoney={formatMoney}
            onAdd={handleNewReminder}
            onEdit={handleEditReminder}
            onComplete={handleCompleteReminder}
            onDelete={handleDeleteReminder}
          />
          {isReminderFormOpen && (
            <ReminderForm
              formData={reminderFormData}
              onChange={handleReminderChange}
              onSubmit={handleReminderSubmit}
              onCancel={handleReminderCancel}
              saving={reminderSaving}
              error={reminderError}
              isEditing={Boolean(editingReminderId)}
            />
          )}
          {!isReminderFormOpen && reminderMessage && (
            <p className="form-message">{reminderMessage}</p>
          )}
        </div>
      </div>
      {isFormOpen && (
        <MovementForm
          formData={formData}
          categories={categories}
          paymentMethods={paymentMethods}
          accounts={accounts}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          saving={saving}
          error={error}
          message={message}
          isEditing={Boolean(editingMovementId)}
        />
      )}

      {!isFormOpen && message && (
        <p className="form-message">{message}</p>
      )}

      <section id="reports-section" className="reports-section">
        <InsightsPanel
          insights={spendingInsights}
          formatMoney={formatMoney}
        />

        <CategorySummary
          categories={categoryTotals}
          formatMoney={formatMoney}
        />
        <ExpenseChart
          categories={categoryTotals}
          formatMoney={formatMoney}
        />

        <MonthlyChart
          data={monthlyTotals}
          formatMoney={formatMoney}
        />

        <div className="dashboard-actions">
          <button
            type="button"
            className="export-button"
            onClick={() =>
              exportMovementsToExcel(filteredMovements, selectedMonth)
            }
            disabled={filteredMovements.length === 0}
          >
            Exportar a Excel
          </button>
        </div>
      </section>

      <section id="movements-section" className="movements-section">
        <div className="section-title">
          <h2>Movimientos recientes</h2>
          <p>Datos obtenidos desde PostgreSQL.</p>
        </div>

        {loading && <p>Cargando movimientos...</p>}

        {error && <p className="error">{error}</p>}

        {!loading && !error && filteredMovements.length === 0 && (
          <p>No hay movimientos registrados.</p>
        )}

        {!loading && !error && filteredMovements.length > 0 && (
          <MovementList
            movements={filteredMovements}
            onEdit={handleEdit}
            onDelete={handleDelete}
            formatMoney={formatMoney}
          />
        )}
      </section>
      </div>
    </main>
  )
}

export default App
