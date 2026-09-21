function MovementItem({ movement, onEdit, onDelete, formatMoney }) {
  return (
    <article className="movement-item">
      <div>
        <strong>{movement.description || 'Sin descripción'}</strong>
        <span>{movement.category?.name || 'Sin categoría'}</span>
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