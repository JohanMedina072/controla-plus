function CategorySummary({ categories, formatMoney }) {
  if (categories.length === 0) {
    return null
  }

  return (
    <section className="category-summary">
      <h2>Gastos por categoría</h2>

      <div className="category-list">
        {categories.map((category) => (
          <article className="category-row" key={category.name}>
            <div className="category-row-info">
              <strong>{category.name}</strong>
              <span>
                {formatMoney(category.amount)} · {category.percentage.toFixed(1)}%
              </span>
            </div>

            <div className="category-bar">
              <div
                className="category-bar-fill"
                style={{ width: `${category.percentage}%` }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default CategorySummary