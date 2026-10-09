function SummaryCards({
  balance,
  availableBalance,
  income,
  expenses,
  monthlyChange,
  formatMoney,
}) {
  const monthlyChangeLabel =
    monthlyChange === null || monthlyChange === undefined
      ? 'Sin comparación'
      : `${monthlyChange >= 0 ? '+' : ''}${monthlyChange.toFixed(0)}%`

  return (
    <section className="dashboard-summary" aria-label="Resumen financiero">
      <article className="summary-stat-card summary-stat-income">
        <span className="summary-stat-icon" aria-hidden="true">
          ↑
        </span>
        <span>Ingresos</span>
        <strong>{formatMoney(income)}</strong>
        <small>Movimientos del periodo</small>
      </article>

      <article className="summary-balance-card">
        <div className="summary-balance-ring">
          <div className="summary-balance-content">
            <span>Dinero disponible</span>
            <strong>{formatMoney(availableBalance)}</strong>
            <small>Saldo actual de tus cuentas</small>
          </div>
        </div>

        <div className="summary-period-balance">
          <span>Balance del periodo</span>
          <strong className={balance >= 0 ? 'income' : 'expense'}>
            {formatMoney(balance)}
          </strong>
        </div>
      </article>

      <article className="summary-stat-card summary-stat-expense">
        <span className="summary-stat-icon" aria-hidden="true">
          ↓
        </span>
        <span>Gastos</span>
        <strong>{formatMoney(expenses)}</strong>
        <small>Movimientos del periodo</small>
      </article>

      <article className="summary-variation-card">
        <span className="summary-variation-icon" aria-hidden="true">
          ◒
        </span>
        <div>
          <span>Variación mensual de gastos</span>
          <strong>{monthlyChangeLabel}</strong>
          <small>Comparado con el mes anterior</small>
        </div>
      </article>

    </section>
  )
}

export default SummaryCards
