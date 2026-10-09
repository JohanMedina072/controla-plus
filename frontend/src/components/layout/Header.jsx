function Header({
  user,
  searchTerm,
  onSearchChange,
  onOpenReminders,
  onToggleProfile,
  reminderCount,
  selectedMonth,
  onMonthChange,
  onClearMonth,
}) {
  const displayName = user?.name || user?.email || 'usuario'
  const firstName = displayName.split(/\s+/)[0]
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <header className="page-header" id="dashboard-overview">
      <div className="page-header-toolbar">
        <label className="header-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar movimientos, categorías o cuentas..."
            aria-label="Buscar en tus movimientos"
          />
        </label>

        <div className="header-toolbar-actions">
          <label className="header-period-filter">
            <span aria-hidden="true">▣</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => onMonthChange(event.target.value)}
              aria-label="Filtrar dashboard por mes"
            />
            {selectedMonth && (
              <button
                type="button"
                onClick={onClearMonth}
                aria-label="Ver todos los meses"
              >
                ×
              </button>
            )}
          </label>

          <button
            type="button"
            className="header-notification-button"
            onClick={onOpenReminders}
            aria-label="Ver recordatorios"
          >
            <span aria-hidden="true">♧</span>
            {reminderCount > 0 && <i aria-hidden="true" />}
          </button>

          <button
            type="button"
            className="header-user-button"
            onClick={onToggleProfile}
          >
            <span className="header-avatar" aria-hidden="true">
              {initials || 'U'}
            </span>
            <span className="header-user-copy">
              <strong>{displayName}</strong>
              <small>Mi perfil</small>
            </span>
            <span aria-hidden="true">⌄</span>
          </button>
        </div>
      </div>

      <div className="page-header-copy">
        <p className="eyebrow">PANEL FINANCIERO PERSONAL</p>
        <h1>¡Hola, {firstName}!</h1>
        <p>Aquí tienes un resumen de tu situación financiera.</p>
      </div>
    </header>
  )
}

export default Header
