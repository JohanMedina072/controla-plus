function AccountList({ accounts, loading, error, formatMoney, onAdd }) {
  const activeAccounts = accounts.filter((account) => account.isActive)
  const totalBalance = activeAccounts.reduce(
    (total, account) => total + Number(account.currentBalance),
    0,
  )

  return (
    <section id="accounts-section" className="accounts-section">
      <div className="accounts-header">
        <div>
          <h2>Cuentas</h2>
          <p>Dinero disponible separado por cada cuenta.</p>
          {!loading && !error && accounts.length > 0 && (
            <strong className="accounts-total">
              Disponible total: {formatMoney(totalBalance)}
            </strong>
          )}
        </div>

        <button type="button" className="secondary-button" onClick={onAdd}>
          + Nueva cuenta
        </button>
      </div>

      {loading && <p>Cargando cuentas...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && accounts.length === 0 && (
        <p>No hay cuentas creadas todavía.</p>
      )}

      {!loading && !error && accounts.length > 0 && (
        <div className="account-grid">
          {accounts.map((account, index) => (
            <article
              className={`account-card account-card-variant-${index % 3}`}
              key={account.id}
            >
              <div className="account-card-header">
                <span className="account-card-icon" aria-hidden="true">
                  {(account.name || '?').slice(0, 1).toUpperCase()}
                </span>
                <div className="account-card-title">
                  <h3>{account.name}</h3>
                  <span className="account-card-caption">Cuenta personal</span>
                </div>
                <span className={account.isActive ? 'account-status active' : 'account-status'}>
                  {account.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <span className="account-label">Saldo actual</span>
              <strong className="account-balance">
                {formatMoney(account.currentBalance)}
              </strong>

              <span className="account-initial-balance">
                Saldo inicial: {formatMoney(account.initialBalance)}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default AccountList
