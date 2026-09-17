import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:3000/api/movements'

const USER_ID = '74b90258-dcdd-47a7-ba59-55ebcca23df4'
const CATEGORY_ID = '877aa249-a629-450f-99a2-f25072fbcb28'
const PAYMENT_METHOD_ID = '670489e5-84d1-4724-b01e-f67e78432917'

const formatMoney = (value) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(Number(value || 0))

function App() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    amount: '',
    description: '',
  })

  useEffect(() => {
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudieron obtener los movimientos')
        }

        return response.json()
      })
      .then((result) => {
        setMovements(result.data || [])
      })
      .catch(() => {
        setError('No se pudo conectar con el backend')
      })
      .finally(() => {
        setLoading(false)
      })
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

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!formData.amount || Number(formData.amount) <= 0) {
      setMessage('Ingresa un monto mayor que cero.')
      return
    }

    try {
      setSaving(true)

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          amount: Number(formData.amount),
          description: formData.description,
          userId: USER_ID,
          categoryId: CATEGORY_ID,
          paymentMethodId: PAYMENT_METHOD_ID,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'No se pudo guardar el movimiento')
      }

      setMovements((current) => [result.data, ...current])

      setFormData({
        type: 'EXPENSE',
        amount: '',
        description: '',
      })

      setIsFormOpen(false)
      setMessage('Movimiento guardado correctamente.')
    } catch (submissionError) {
      setMessage(submissionError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">CONTROL FINANCIERO PERSONAL</p>
          <h1>Controla+</h1>
          <p>Hola, Johan. Aquí tienes un resumen de tus movimientos.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setIsFormOpen((current) => !current)}
        >
          + Nuevo movimiento
        </button>
      </header>

      {isFormOpen && (
        <section className="form-section">
          <h2>Registrar movimiento</h2>

          <form onSubmit={handleSubmit}>
            <label>
              Tipo
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="EXPENSE">Gasto</option>
                <option value="INCOME">Ingreso</option>
              </select>
            </label>

            <label>
              Monto
              <input
                type="number"
                name="amount"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Ejemplo: 25"
              />
            </label>

            <label>
              Descripción
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ejemplo: Pasaje"
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar movimiento'}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </button>
            </div>

            {message && <p className="form-message">{message}</p>}
          </form>
        </section>
      )}

      <section className="summary-grid">
        <article className="summary-card">
          <span>Balance</span>
          <strong>{formatMoney(balance)}</strong>
        </article>

        <article className="summary-card">
          <span>Ingresos</span>
          <strong>{formatMoney(totals.income)}</strong>
        </article>

        <article className="summary-card">
          <span>Gastos</span>
          <strong>{formatMoney(totals.expenses)}</strong>
        </article>
      </section>

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
          <div className="movement-list">
            {movements.map((movement) => (
              <article className="movement-item" key={movement.id}>
                <div>
                  <strong>{movement.description || 'Sin descripción'}</strong>
                  <span>{movement.category?.name || 'Comida'}</span>
                </div>

                <strong
                  className={
                    movement.type === 'INCOME' ? 'income' : 'expense'
                  }
                >
                  {movement.type === 'INCOME' ? '+' : '-'}
                  {formatMoney(movement.amount)}
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App