import { useEffect, useMemo, useState } from 'react'
import './App.css'

import Header from './components/layout/Header'
import SummaryCards from './components/dashboard/SummaryCards'
import MovementList from './components/movements/MovementList'
import MovementForm from './components/movements/MovementForm'
import MonthFilter from './components/dashboard/MonthFilter'
import CategorySummary from './components/dashboard/CategorySummary'
import ExpenseChart from './components/dashboard/ExpenseChart'
import MonthlyChart from './components/dashboard/MonthlyChart'
import exportMovementsToExcel from './utils/exportMovementsToExcel'
import validateMovement from './utils/validateMovement'

import formatMoney from './utils/formatMoney'

import {
  getCatalog,
  getMovements,
  removeMovement,
  saveMovement,
} from './services/movement.service'

function App() {
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
  
  
  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    amount: '',
    description: '',
    categoryId: '',
    paymentMethodId: '',
  })

useEffect(() => {
  const loadData = async () => {
    try {
      const [movementsResult, catalogResult] = await Promise.all([
        getMovements(),
        getCatalog(),
      ])

      setMovements(movementsResult)
      setCategories(catalogResult.categories)
      setPaymentMethods(catalogResult.paymentMethods)

      const firstExpenseCategory = catalogResult.categories.find(
        (category) => category.type === 'EXPENSE',
      )

      setFormData((current) => ({
        ...current,
        categoryId: firstExpenseCategory?.id || '',
        paymentMethodId: catalogResult.paymentMethods[0]?.id || '',
      }))
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  loadData()
}, [])

  const filteredMovements = useMemo(() => {
    if (!selectedMonth) {
      return movements
    }

    return movements.filter((movement) =>
      movement.date?.slice(0, 7) === selectedMonth,
    )
  }, [movements, selectedMonth])

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
  const totalsByMonth = movements.reduce((accumulator, movement) => {
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
}, [movements])


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

  const resetForm = () => {
    setFormData({
      type: 'EXPENSE',
      amount: '',
      description: '',
      categoryId:
        categories.find((category) => category.type === 'EXPENSE')?.id || '',
      paymentMethodId: paymentMethods[0]?.id || '',
    })

    setEditingMovementId(null)
  }

  const handleNewMovement = () => {
    resetForm()
    setMessage('')
    setError('')
    setIsFormOpen(true)
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

      setMessage('Movimiento eliminado correctamente.')
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  return (
    <main className="app">
      <Header onToggleForm={handleNewMovement} /> 
      <MonthFilter
        value={selectedMonth}
        onChange={setSelectedMonth}
        onClear={() => setSelectedMonth('')}
      />
      {isFormOpen && (
        <MovementForm
          formData={formData}
          categories={categories}
          paymentMethods={paymentMethods}
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

      <SummaryCards
        balance={balance}
        income={totals.income}
        expenses={totals.expenses}
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

      <section className="movements-section">
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
    </main>
  )
}

export default App
