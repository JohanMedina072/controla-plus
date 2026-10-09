function MovementItem({ movement, onEdit, onDelete, formatMoney }) {
  const movementDate = movement.date ? new Date(movement.date) : null
  const formattedDate = movementDate
    ? new Intl.DateTimeFormat('es-PE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(movementDate)
    : ''
  const movementDay = movementDate
    ? new Intl.DateTimeFormat('es-PE', { day: '2-digit' }).format(movementDate)
    : '--'
  const movementMonth = movementDate
    ? new Intl.DateTimeFormat('es-PE', { month: 'short' })
        .format(movementDate)
        .replace('.', '')
    : 'sin fecha'

  return (
    <article className="movement-item">
      <div className="movement-date-badge" aria-label={formattedDate || 'Sin fecha'}>
        <strong>{movementDay}</strong>
        <span>{movementMonth}</span>
      </div>

      <div
        className={`movement-icon ${
          movement.type === 'INCOME' ? 'movement-icon-income' : ''
        }`}
        aria-hidden="true"
      >
        {movement.type === 'INCOME' ? '↗' : '↘'}
      </div>

      <div className="movement-item-main">
        <strong>{movement.description || 'Sin descripción'}</strong>
        <span>
          {formattedDate && `${formattedDate} · `}
          {movement.category?.name || 'Sin categoría'} ·{' '}
          {movement.account?.name || 'Sin cuenta'}
        </span>
      </div>

      <div className="movement-actions">
        <strong
          className={movement.type === 'INCOME' ? 'income' : 'expense'}
        >
          {movement.type === 'INCOME' ? '+' : '-'}
          {formatMoney(movement.amount)}
        </strong>

        <button
          type="button"
          className="edit-button"
          onClick={() => onEdit(movement)}
        >
          Editar
        </button>

        <button
          type="button"
          className="delete-button"
          onClick={() => onDelete(movement.id)}
        >
          Eliminar
        </button>
      </div>
    </article>
  )
}

export default MovementItem
