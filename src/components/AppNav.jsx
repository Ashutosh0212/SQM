/** @typedef {'home' | 'customers' | 'quotation' | 'po'} MainView */

const LOGO_SRC = encodeURI(`${import.meta.env.BASE_URL}Shivatronics logo.png`);

export function AppNav({ mainView, onNavigate, onSignOut }) {
  const items = [
    { id: 'home', label: 'Home' },
    { id: 'customers', label: 'Customers' },
    { id: 'quotation', label: 'Quotation' },
    { id: 'po', label: 'Purchase Order' },
  ];

  return (
    <header className="app-top-nav">
      <div className="app-brand">
        <img className="app-brand-logo" src={LOGO_SRC} alt="Shivatronics" />
        <span className="app-brand-text">SQM</span>
      </div>
      <nav className="app-main-tabs" aria-label="Main">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              'app-main-tab' + (mainView === item.id ? ' is-active' : '')
            }
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button type="button" className="btn btn-print app-signout" onClick={onSignOut}>
        Sign out
      </button>
    </header>
  );
}
