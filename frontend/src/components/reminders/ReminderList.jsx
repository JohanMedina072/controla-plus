import ReminderItem from './ReminderItem'

function ReminderList({
  reminders,
  loading,
  error,
  formatMoney,
  onAdd,
  onEdit,
  onComplete,
  onDelete,
}) {
  return (
    <section className="reminders-section">
      <div className="reminders-header">
        <div>
          <h2>Recordatorios de pagos</h2>
          <p>Fechas de tarjetas de crédito y créditos.</p>
        </div>

        <button type="button" className="secondary-button" onClick={onAdd}>
          + Nuevo recordatorio
        </button>
      </div>

      {loading && <p>Cargando recordatorios...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && reminders.length === 0 && (
        <p>No hay recordatorios creados todavía.</p>
      )}

      {!loading && !error && reminders.length > 0 && (
        <div className="reminder-list">
          {reminders.map((reminder) => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              formatMoney={formatMoney}
              onEdit={onEdit}
              onComplete={onComplete}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default ReminderList
