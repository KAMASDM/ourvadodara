// App.jsx — main interactive app
const SAMPLE_NEWS = [
  { id:1, featured:true, title:'Vadodara Smart City Project Reaches New Milestone', excerpt:'Phase 1 infrastructure is complete. Residents report smoother commutes across the ring-road corridor.', img:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&h=600&fit=crop', category:'Local', catColor:'#7c3aed', author:'City Desk', time:'2h ago', loc:'Vadodara', views:'1.2K', comments:'12', readTime:'3 min read' },
  { id:2, title:'Major Traffic Changes on RC Dutt Road Starting Monday', excerpt:'Due to ongoing metro construction, significant traffic diversions have been implemented.', img:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=500&fit=crop', category:'Traffic', catColor:'#ea580c', author:'Ravi Shah', time:'4h ago', loc:'RC Dutt Road', views:'856', comments:'34', live:true },
  { id:3, title:'Baroda Cricket Association Announces Tournament', excerpt:'Annual inter-district tournament set to kick off next week with 16 teams competing.', img:'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=500&fit=crop', category:'Sports', catColor:'#16a34a', author:'Sports Desk', time:'6h ago', loc:'Reliance Stadium', views:'2.3K', comments:'89' },
  { id:4, title:'Navratri Celebrations Light Up Polo Ground', excerpt:'Traditional garba brings thousands out for the nine nights of celebration.', img:'https://images.unsplash.com/photo-1604933834413-4f5d5fbeaeb9?w=800&h=500&fit=crop', category:'Culture', catColor:'#db2777', author:'Priya Joshi', time:'8h ago', loc:'Polo Ground', views:'4.7K', comments:'203' },
  { id:5, title:'Laxmi Vilas Palace Opens New Heritage Tour', excerpt:'Guided evening tours now available through the palace gardens.', img:'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=800&h=500&fit=crop', category:'Heritage', catColor:'#a16207', author:'Tourism Dept', time:'1d ago', loc:'Laxmi Vilas', views:'942', comments:'18' },
];

const HomeFeed = ({ onOpen, saved, onSave }) => {
  const [cat, setCat] = React.useState('all');
  const featured = SAMPLE_NEWS[0];
  const rest = SAMPLE_NEWS.slice(1);
  return (
    <div>
      <StoriesRail/>
      <CategoryChips active={cat} onChange={setCat}/>
      <BreakingBanner/>
      <div className="section-head"><h2>📌 Pinned · Weather</h2><span className="more">Focus ⋯</span></div>
      <FocusCard/>
      <div className="section-head"><h2>Top Story</h2><span className="more">See all</span></div>
      <FeaturedCard story={featured} onOpen={onOpen}/>
      <div className="section-head"><h2>Latest News</h2><span className="more">See all</span></div>
      {rest.map(s => <NewsCard key={s.id} story={s} onOpen={onOpen} saved={saved.has(s.id)} onSave={onSave}/>)}
      <div style={{height: 20}}/>
    </div>
  );
};

const RoundupScreen = ({ onOpen }) => (
  <div>
    <div style={{padding: '20px 16px 8px', background: 'linear-gradient(135deg, var(--ov-ivory-50), var(--ov-ivory-100))', borderBottom: '1px solid var(--ov-warmBrown-200)'}}>
      <div style={{fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:'var(--ov-warmBrown-700)'}}>TUESDAY · 19 APR 2026</div>
      <h1 style={{fontSize:26, fontWeight:700, letterSpacing:'-.02em', margin:'4px 0 4px'}}>Your daily roundup</h1>
      <p style={{fontSize:13, color:'var(--ov-fg-muted)', margin:0}}>6 stories shaping Vadodara today. ~4 min read.</p>
    </div>
    <div style={{padding: '14px 16px'}}>
      {SAMPLE_NEWS.slice(0,4).map((s,i) => (
        <div key={s.id} onClick={() => onOpen(s)} style={{display:'flex', gap:12, padding:'12px 0', borderBottom: i<3 ? '1px solid var(--ov-border)' : 'none', cursor:'pointer'}}>
          <div style={{flexShrink:0, fontSize:26, fontWeight:700, color:'var(--ov-warmBrown-500)', width:30, fontFamily:'Inter, sans-serif'}}>{String(i+1).padStart(2,'0')}</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:s.catColor, marginBottom:2}}>{s.category}</div>
            <h3 style={{fontSize:15, fontWeight:700, lineHeight:1.3, margin:'0 0 4px'}}>{s.title}</h3>
            <p style={{fontSize:12, color:'var(--ov-fg-muted)', margin:0, lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{s.excerpt}</p>
          </div>
          <img src={s.img} style={{width:60, height:60, borderRadius:10, objectFit:'cover', flexShrink:0}}/>
        </div>
      ))}
    </div>
  </div>
);

const BreakingScreen = ({ onOpen }) => (
  <div>
    <div style={{padding:'20px 16px 10px', background: 'linear-gradient(135deg, var(--ov-accent-500), var(--ov-danger-500))', color:'#fff'}}>
      <div style={{fontSize:10, fontWeight:700, letterSpacing:'.12em', opacity:.9}}>● LIVE · UPDATING NOW</div>
      <h1 style={{fontSize:24, fontWeight:700, letterSpacing:'-.02em', margin:'4px 0 6px'}}>Breaking news</h1>
      <p style={{fontSize:13, opacity:.9, margin:0}}>Real-time alerts from across Vadodara.</p>
    </div>
    <div style={{padding: '16px'}}>
      {SAMPLE_NEWS.filter(s => s.live || s.category==='Traffic').concat(SAMPLE_NEWS.slice(1,3)).map((s,i) => (
        <div key={i} onClick={() => onOpen(s)} style={{background:'#fff', border:'1px solid var(--ov-border)', borderLeft:'4px solid var(--ov-danger-500)', borderRadius:10, padding:14, marginBottom:10, cursor:'pointer'}}>
          <div style={{fontSize:10, fontWeight:700, color:'var(--ov-danger-500)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:4}}>● {s.time}</div>
          <h3 style={{fontSize:14, fontWeight:700, margin:'0 0 4px', lineHeight:1.3}}>{s.title}</h3>
          <p style={{fontSize:12, color:'var(--ov-fg-muted)', margin:0, lineHeight:1.4}}>{s.excerpt}</p>
        </div>
      ))}
    </div>
  </div>
);

const App = () => {
  const [authed, setAuthed] = React.useState(false);
  const [tab, setTab] = React.useState('home');
  const [article, setArticle] = React.useState(null);
  const [saved, setSaved] = React.useState(new Set());
  const [view, setView] = React.useState('app'); // app | login

  const toggleSave = (id) => {
    setSaved(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const scrollRef = React.useRef(null);
  React.useEffect(() => { scrollRef.current?.scrollTo({top:0, behavior:'instant'}); }, [tab, article, view]);

  if (view === 'login') {
    return (
      <>
        <div className="view-tabs">
          <button className={view==='app'?'active':''} onClick={() => setView('app')}>App</button>
          <button className={view==='login'?'active':''} onClick={() => setView('login')}>Login</button>
        </div>
        <div className="stage"><div className="phone"><div className="phone-scroll">
          <StatusBar/>
          <LoginScreen onLogin={() => { setAuthed(true); setView('app'); }}/>
        </div></div></div>
      </>
    );
  }

  if (article) {
    return (
      <>
        <div className="view-tabs">
          <button className={view==='app'?'active':''} onClick={() => setView('app')}>App</button>
          <button className={view==='login'?'active':''} onClick={() => setView('login')}>Login</button>
        </div>
        <div className="stage"><div className="phone"><div className="phone-scroll" ref={scrollRef}>
          <StatusBar/>
          <ArticleScreen story={article} onBack={() => setArticle(null)}/>
        </div></div></div>
      </>
    );
  }

  if (tab === 'reels') {
    return (
      <>
        <div className="view-tabs">
          <button className={view==='app'?'active':''} onClick={() => setView('app')}>App</button>
          <button className={view==='login'?'active':''} onClick={() => setView('login')}>Login</button>
        </div>
        <div className="stage"><div className="phone"><div className="phone-scroll">
          <ReelsScreen onBack={() => setTab('home')}/>
          <TabBar active={tab} onChange={setTab}/>
        </div></div></div>
      </>
    );
  }

  return (
    <>
      <div className="view-tabs">
        <button className={view==='app'?'active':''} onClick={() => setView('app')}>App</button>
        <button className={view==='login'?'active':''} onClick={() => setView('login')}>Login</button>
      </div>
      <div className="stage">
        <div className="phone">
          <div className="phone-scroll" ref={scrollRef}>
            <StatusBar/>
            <Header onSearch={() => {}} onNotif={() => {}}/>
            <div style={{minHeight: 600}}>
              {tab === 'home' && <HomeFeed onOpen={setArticle} saved={saved} onSave={toggleSave}/>}
              {tab === 'roundup' && <RoundupScreen onOpen={setArticle}/>}
              {tab === 'breaking' && <BreakingScreen onOpen={setArticle}/>}
              {tab === 'profile' && <ProfileScreen onLogout={() => setView('login')}/>}
            </div>
            <TabBar active={tab} onChange={setTab}/>
          </div>
        </div>
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
