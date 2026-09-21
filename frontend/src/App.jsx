import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Header from './components/layout/Header'
import SummaryCards from './components/dashboard/SummaryCards'
import MovementList from './components/movements/MovementList'
import MovementForm from './components/movements/MovementForm'

import formatMoney from './utils/formatMoney'
import { API_URL, CATALOG_URL, USER_ID } from './services/api'



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
        const [movementsResponse, catalogResponse] = await Promise.all([
          fetch(API_URL),
          fetch(`${CATALOG_URL}?userId=${USER_ID}`),
        ])

        if (!movementsResponse.ok) {
          throw new Error('No se pudieron obtener los movimientos')
        }

        if (!catalogResponse.ok) {
          throw new Error('No se pudo obtener el catálogo')
        }

        const movementsResult = await movementsResponse.json()
        const catalogResult = await catalogResponse.json()

        setMovements(movementsResult.data)
        setCategories(catalogResult.data.categories)
        setPaymentMethods(catalogResult.data.paymentMethods)

        const firstExpenseCategory = catalogResult.data.categories.find(
          (category) => category.type === 'EXPENSE',
        )

        setFormData((current) => ({
          ...current,
          categoryId: firstExpenseCategory?.id || '',
          paymentMethodId:
            catalogResult.data.paymentMethods[0]?.id || '',
        }))
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const totals = useMemo(() => {
    return movements.reduce(
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
  }, [movements])

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

    if (!formData.amount || Number(formData.amount) <= 0) {
      setMessage('Ingresa un monto mayor que cero.')
      return
    }

    try {
      setSaving(true)

      const isEditing = Boolean(editingMovementId)

      const response = await fetch(
        isEditing ? `${API_URL}/${editingMovementId}` : API_URL,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: formData.type,
            amount: Number(formData.amount),
            description: formData.description,
            userId: USER_ID,
            categoryId: formData.categoryId,
            paymentMethodId: formData.paymentMethodId,
          }),
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || 'No se pudo guardar el movimiento',
        )
      }

      if (isEditing) {
        setMovements((current) =>
          current.map((movement) =>
            movement.id === editingMovementId
              ? result.data
              : movement,
          ),
        )
      } else {
        setMovements((current) => [result.data, ...current])
      }

      resetForm()
      setIsFormOpen(false)

      setMessage(
        isEditing
          ? 'Movimiento actualizado correctamente.'
          : 'Movimiento guardado correctamente.',
      )
    } catch (submitError) {
      console.error(submitError)
      setMessage(
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

    try {
      const response = await fetch(`${API_URL}/${movementId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || 'No se pudo eliminar el movimiento',
        )
      }

      setMovements((current) =>
        current.filter((movement) => movement.id !== movementId),
      )

      setMessage('Movimiento eliminado correctamente.')
    } catch (deleteError) {
      console.error(deleteError)
      setError(deleteError.message)
    }
  }

  return (
    <main className="app">
        <Header
          onToggleForm={() => setIsFormOpen((current) => !current)}
        />
      {isFormOpen && (
        <MovementForm
          formData={formData}
          categories={categories}
          paymentMethods={paymentMethods}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingMovementId(null)
            setMessage('')
          }}  
          saving={saving}
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

      <section className="movements-section">
        <div className="section-title">
          <h2>Movimientos recientes</h2>
          <p>Datos obtenidos desde PostgreSQL.</p>
        </div>

        {loading && <p>Cargando movimientos...</p>}

        {error && <p className="error">{error}</p>}

        {!loading && !error && movements.length === 0 && (
          <p>No hay movimientos registrados.</p>
        )}

        {!loading && !error && movements.length > 0 && (
          <MovementList
            movements={movements}
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