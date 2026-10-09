const NAV_ITEMS = [
  { id: 'dashboard-overview', label: 'Inicio', icon: '⌂' },
  { id: 'accounts-section', label: 'Cuentas', icon: '▣' },
  { id: 'movements-section', label: 'Movimientos', icon: '↔' },
  { id: 'budgets', label: 'Presupuestos', icon: '◔', disabled: true },
  { id: 'categories', label: 'Categorías', icon: '⁙', disabled: true },
  { id: 'reminders-section', label: 'Recordatorios', icon: '◷' },
  { id: 'reports-section', label: 'Reportes', icon: '▥' },
  {
    id: 'payment-methods',
    label: 'Métodos de pago',
    icon: '▤',
    disabled: true,
  },
  { id: 'profile', label: 'Configuración', icon: '⚙', action: 'profile' },
]

function Sidebar({
  user,
  onNavigate,
  onToggleForm,
  onToggleProfile,
  onLogout,
}) {
  const displayName = user?.name || user?.email || 'Usuario'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="sidebar-brand-copy">
          <strong>
            Controla<span>+</span>
          </strong>
          <small>Tu vida financiera, más simple</small>
        </span>
      </div>

      <button
        type="button"
        className="sidebar-new-button"
        onClick={onToggleForm}
      >
        <span aria-hidden="true">+</span>
        Nuevo movimiento
      </button>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        <p className="sidebar-nav-label">MENÚ PRINCIPAL</p>

        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            className={`sidebar-nav-button${item.disabled ? ' is-disabled' : ''}`}
            key={item.id}
            disabled={item.disabled}
            onClick={() => {
              if (item.action === 'profile') {
                onToggleProfile()
                return
              }

              onNavigate(item.id)
            }}
          >
            <span className="sidebar-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
            {item.disabled && <small>Próximo</small>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-profile-button"
          onClick={onToggleProfile}
        >
          <span className="sidebar-avatar" aria-hidden="true">
            {initials || 'U'}
          </span>
          <span className="sidebar-profile-copy">
            <strong>{displayName}</strong>
            <small>Mi perfil</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>

        <button
          type="button"
          className="sidebar-logout-button"
          onClick={onLogout}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
