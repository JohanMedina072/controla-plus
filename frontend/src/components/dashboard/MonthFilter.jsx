function MonthFilter({ value, onChange, onClear }) {
  return (
    <section className="month-filter">
      <label htmlFor="month-filter">Filtrar por mes</label>

      <div className="month-filter-controls">
        <input
          id="month-filter"
          type="month"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />

        {value && (
          <button
            type="button"
            className="secondary-button"
            onClick={onClear}
          >
            Ver todo
          </button>
        )}
      </div>
    </section>
  )
}

export default MonthFilter