import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:3000/api/movements'

const formatMoney = (value) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(Number(value || 0))

function App() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">CONTROL FINANCIERO PERSONAL</p>
          <h1>Controla+</h1>
          <p>Hola, Johan. Aquí tienes un resumen de tus movimientos.</p>
        </div>

        <button className="primary-button">+ Nuevo movimiento</button>
      </header>

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
          <div>
            <h2>Movimientos recientes</h2>
            <p>Datos obtenidos desde PostgreSQL.</p>
          </div>
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
                  <span>{movement.category?.name || 'Sin categoría'}</span>
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