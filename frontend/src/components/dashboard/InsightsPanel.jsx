function InsightsPanel({ insights, formatMoney }) {
  const changeLabel =
    insights.changePercentage === null
      ? 'Sin comparación disponible'
      : `${insights.changePercentage >= 0 ? '+' : ''}${insights.changePercentage.toFixed(0)}% frente al mes anterior`

  return (
    <section className="insights-section">
      <div className="insights-header">
        <div>
          <p className="insights-eyebrow">ANÁLISIS DE GASTOS</p>
          <h2>Entiende tus movimientos</h2>
          <p>Resumen automático de {insights.periodLabel}.</p>
        </div>
      </div>

      <div className="insights-grid">
        <article className="insight-card">
          <span>Gastos del periodo</span>
          <strong>{formatMoney(insights.periodExpenses)}</strong>
        </article>

        <article className="insight-card">
          <span>Últimos 7 días</span>
          <strong>{formatMoney(insights.lastSevenDaysExpenses)}</strong>
        </article>

        <article className="insight-card">
          <span>Gastos de hoy</span>
          <strong>{formatMoney(insights.todayExpenses)}</strong>
        </article>

        <article className="insight-card">
          <span>Variación mensual</span>
          <strong>{changeLabel}</strong>
        </article>
      </div>

      <div className="insight-message">
        <strong>Lectura automática</strong>
        <p>{insights.recommendation}</p>
      </div>

      {insights.topCategory && (
        <div className="insights-category-block">
          <div className="insights-category-header">
            <h3>Distribución por categoría</h3>
            <span>Categoría principal: {insights.topCategory.name}</span>
          </div>

          <div className="insights-category-list">
            {insights.categoryBreakdown.slice(0, 5).map((category) => (
              <div className="insights-category-row" key={category.name}>
                <div className="insights-category-row-info">
                  <span>{category.name}</span>
                  <strong>{formatMoney(category.amount)}</strong>
                </div>
                <div className="insights-category-bar">
                  <span
                    style={{ width: `${Math.min(category.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default InsightsPanel
