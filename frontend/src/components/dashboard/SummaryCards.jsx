function SummaryCards({ balance, income, expenses, formatMoney }) {
  return (
    <section className="summary-grid">
      <article className="summary-card">
        <span>Balance</span>
        <strong>{formatMoney(balance)}</strong>
      </article>

      <article className="summary-card">
        <span>Ingresos</span>
        <strong>{formatMoney(income)}</strong>
      </article>

      <article className="summary-card">
        <span>Gastos</span>
        <strong>{formatMoney(expenses)}</strong>
      </article>
    </section>
  )
}

export default SummaryCards