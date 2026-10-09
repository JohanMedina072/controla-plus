import {
  formatReminderDate,
  getReminderStatus,
} from '../../utils/reminderStatus'
import { getReminderTypeLabel } from '../../utils/reminderOptions'

function ReminderItem({
  reminder,
  formatMoney,
  onEdit,
  onComplete,
  onDelete,
}) {
  const status = getReminderStatus(reminder)
  const dueDate = status.dueDate || null
  const dueDay = dueDate
    ? new Intl.DateTimeFormat('es-PE', { day: '2-digit' }).format(dueDate)
    : '--'
  const dueMonth = dueDate
    ? new Intl.DateTimeFormat('es-PE', { month: 'short' })
        .format(dueDate)
        .replace('.', '')
    : 'sin fecha'

  return (
    <article className="reminder-item">
      <div className="reminder-date-badge" aria-label={`Próximo pago: ${formatReminderDate(status.dueDate)}`}>
        <strong>{dueDay}</strong>
        <span>{dueMonth}</span>
      </div>

      <div className="reminder-item-main">
        <div className="reminder-item-heading">
          <div>
            <span className="reminder-type">
              {getReminderTypeLabel(reminder.type)}
            </span>
            <h3>{reminder.name}</h3>
          </div>

          <span className={`reminder-status ${status.className}`}>
            {status.label}
          </span>
        </div>

        <p>Próximo pago: {formatReminderDate(status.dueDate)}</p>

        {reminder.amount !== null && (
          <p>Monto registrado: {formatMoney(reminder.amount)}</p>
        )}
      </div>

      <div className="reminder-actions">
        {status.className !== 'paid' && (
          <button
            type="button"
            className="complete-button"
            onClick={() => onComplete(reminder.id)}
          >
            Marcar pagado
          </button>
        )}

        <button
          type="button"
          className="edit-button"
          onClick={() => onEdit(reminder)}
        >
          Editar
        </button>

        <button
          type="button"
          className="delete-button"
          onClick={() => onDelete(reminder.id)}
        >
          Eliminar
        </button>
      </div>
    </article>
  )
}

export default ReminderItem
