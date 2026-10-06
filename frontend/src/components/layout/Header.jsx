function Header({ user, onToggleForm, onLogout }) {
  const displayName = user?.name || user?.email || 'usuario'

  return (
    <header className="header">
      <div>
        <p className="eyebrow">CONTROL FINANCIERO PERSONAL</p>

        <h1>Controla+</h1>

        <p>Hola, {displayName}. Aquí tienes un resumen de tus movimientos.</p>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onLogout}
        >
          Cerrar sesión
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onToggleForm}
        >
          + Nuevo movimiento
        </button>
      </div>
    </header>
  )
}

export default Header
