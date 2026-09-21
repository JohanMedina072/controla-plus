import MovementItem from './MovementItem'

function MovementList({ movements, onEdit, onDelete, formatMoney }) {
  return (
    <div className="movement-list">
      {movements.map((movement) => (
        <MovementItem
          key={movement.id}
          movement={movement}
          onEdit={onEdit}
          onDelete={onDelete}
          formatMoney={formatMoney}
        />
      ))}
    </div>
  )
}

export default MovementList