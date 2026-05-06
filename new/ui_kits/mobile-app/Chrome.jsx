// Chrome.jsx — status bar, header, tab bar
const StatusBar = () => (
  <div className="statusbar">
    <span>9:41</span>
    <div className="glyphs">
      <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor"><path d="M1 9h2V7H1v2zm3 0h2V5H4v4zm3 0h2V3H7v6zm3 0h2V1h-2v8zm3 0h2V0h-2v9z"/></svg>
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M1 4a11 11 0 0112 0M3 6a7 7 0 018 0M6 8a2 2 0 012 0"/></svg>
      <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor"><rect x=".5" y=".5" width="18" height="9" rx="2"/><rect x="2" y="2" width="14" height="6" fill="currentColor"/><rect x="19.5" y="3" width="1.5" height="4" rx=".5" fill="currentColor"/></svg>
    </div>
  </div>
);

const Icon = ({ name, size = 20 }) => {
  const paths = {
    home: <><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/></>,
    search: <><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.7" y2="16.7"/></>,
    back: <polyline points="15 18 9 12 15 6"/>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></>,
    bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>,
    msg: <path d="M21 12a8 8 0 0 1-13 6L3 21l3-5a8 8 0 1 1 15-4z"/>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></>,
    pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    news: <><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></>,
    reels: <><rect x="3" y="3" width="18" height="18" rx="3"/><polygon points="10 8 16 12 10 16" fill="currentColor" stroke="none"/></>,
    alert: <><path d="M12 2l10 18H2z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="1" fill="currentColor"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>,
    heart: <path d="M12 21s-8-5.5-8-11.5A5 5 0 0 1 12 6a5 5 0 0 1 8 3.5c0 6-8 11.5-8 11.5z"/>,
    play: <><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16" fill="currentColor" stroke="none"/></>,
    heart_fill: <path d="M12 21s-8-5.5-8-11.5A5 5 0 0 1 12 6a5 5 0 0 1 8 3.5c0 6-8 11.5-8 11.5z" fill="currentColor"/>,
    sparkles: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2"/></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || null}
    </svg>
  );
};

const Header = ({ onNotif, onSearch }) => (
  <div className="header">
    <div className="logo-tile"><img src="../../assets/our-vadodara-logo.png" alt="Our Vadodara"/></div>
    <div style={{flex:1, minWidth:0}}>
      <div className="brand-title">Our Vadodara</div>
      <div className="brand-sub">📍 Vadodara · 32° Sunny</div>
    </div>
    <button className="icon-btn" onClick={onSearch}><Icon name="search"/></button>
    <button className="icon-btn"><Icon name="globe"/></button>
    <button className="icon-btn" onClick={onNotif}><Icon name="bell"/><span className="badge">9+</span></button>
  </div>
);

const TabBar = ({ active, onChange }) => {
  const tabs = [
    { id: 'home', ic: 'home', lb: 'Home' },
    { id: 'roundup', ic: 'news', lb: 'Roundup' },
    { id: 'reels', ic: 'reels', lb: 'Reels' },
    { id: 'breaking', ic: 'alert', lb: 'Breaking', alert: true },
    { id: 'profile', ic: 'user', lb: 'Profile' }
  ];
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <button key={t.id} className={`tab ${active===t.id?'active':''} ${t.alert?'alert':''}`} onClick={() => onChange(t.id)}>
          <span className="ic"><Icon name={t.ic} size={20}/></span>
          <span className="lb">{t.lb}</span>
        </button>
      ))}
    </div>
  );
};

const BackBar = ({ title, onBack }) => (
  <div className="back-bar">
    <button className="icon-btn" onClick={onBack}><Icon name="back"/></button>
    <span className="title">{title}</span>
  </div>
);

Object.assign(window, { StatusBar, Header, TabBar, BackBar, Icon });
