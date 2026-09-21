function Header({ onToggleForm }) {
  return (
    <header className="header">
      <div>
        <p className="eyebrow">CONTROL FINANCIERO PERSONAL</p>

        <h1>Controla+</h1>

        <p>Hola, Johan. Aquí tienes un resumen de tus movimientos.</p>
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={onToggleForm}
      >
        + Nuevo movimiento
      </button>
    </header>
  )
}

export default Header