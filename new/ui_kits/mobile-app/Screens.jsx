// Screens.jsx — Article, Reels, Login, Profile

const ArticleScreen = ({ story, onBack }) => {
  const [reaction, setReaction] = React.useState(null);
  const rxs = ['👍','❤️','😂','😮','😢','😡','🔥','🎉','👏','🤔','🙏','😍'];
  return (
    <div>
      <BackBar title="Article" onBack={onBack}/>
      <div className="article">
        <div className="hero-img" style={{backgroundImage: `url(${story.img})`}}/>
        <div style={{display:'flex', gap:6, marginBottom:12}}>
          <span className="pill pill-cat" style={{background: story.catColor || '#7c3aed'}}>{story.category}</span>
          {story.live && <span className="pill pill-live">Live</span>}
        </div>
        <h1>{story.title}</h1>
        <p className="lead">{story.excerpt}</p>
        <div className="byline">
          <div className="av">{story.author[0]}</div>
          <div style={{flex:1}}>
            <div className="nm">{story.author} <span style={{color:'var(--ov-primary-600)'}}>✓</span></div>
            <div className="dt">{story.time} · {story.readTime || '3 min read'}</div>
          </div>
          <button className="icon-btn"><Icon name="bookmark" size={18}/></button>
          <button className="icon-btn"><Icon name="share" size={18}/></button>
        </div>
        <p className="body-p">Phase 1 of the smart-city infrastructure is complete across the ring-road corridor. Residents report smoother commutes and fewer peak-hour jams since the adaptive signals went live last week.</p>
        <p className="body-p">"The improvement is visible," said Meera Patel, a Sayajigunj commuter who takes the corridor daily. City officials attribute the change to sensor-based signal timing and new dedicated bus lanes on RC Dutt Road.</p>
        <p className="body-p">Phase 2 — covering the Alkapuri and Fatehgunj districts — is expected to begin in the coming quarter, with a focus on pedestrian-first intersections and heritage-area treatments around Laxmi Vilas Palace.</p>
        <div className="rx-tray">
          {rxs.map((r, i) => (
            <button key={i} className={reaction === i ? 'active' : ''} onClick={() => setReaction(i)}>{r}</button>
          ))}
        </div>
        <div style={{fontSize: 11, color: 'var(--ov-fg-subtle)', marginTop: 4}}>127 people reacted · Be the first to comment</div>
      </div>
    </div>
  );
};

const REELS = [
  { img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=1400&fit=crop', title: 'Inside the new Vadodara metro tunnel', excerpt: 'A first look at the underground corridor near Sayajigunj.', author: 'City Desk', likes: '12.4K', comments: '287' },
  { img: 'https://images.unsplash.com/photo-1604933834413-4f5d5fbeaeb9?w=800&h=1400&fit=crop', title: 'Navratri Garba, day one', excerpt: 'Live from Polo Ground — the energy is electric.', author: 'Culture', likes: '48.2K', comments: '1.1K' },
];

const ReelsScreen = ({ onBack }) => {
  const [idx, setIdx] = React.useState(0);
  const r = REELS[idx];
  return (
    <div className="reels">
      <div style={{position:'absolute', top: 44, left: 16, right: 16, zIndex: 10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <button className="icon-btn" onClick={onBack} style={{color:'#fff', background:'rgba(0,0,0,.3)'}}><Icon name="back" size={20}/></button>
        <div style={{display:'flex', gap: 20}}>
          <button style={{background:'transparent', border:'none', color:'#fff', fontSize:14, fontWeight:600, opacity:.7, cursor:'pointer'}}>Following</button>
          <button style={{background:'transparent', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', position:'relative'}}>
            For You
            <div style={{position:'absolute', bottom:-4, left:0, right:0, height:2, background:'#fff', borderRadius:2}}/>
          </button>
        </div>
        <div style={{width:36}}/>
      </div>
      <div className="reel" style={{backgroundImage: `url(${r.img})`}}>
        <div className="scrim"/>
        <div className="overlay-b">
          <div className="ra" style={{marginBottom: 14}}>
            <div className="av">{r.author[0]}</div>
            <div className="nm">@{r.author.toLowerCase().replace(/\s/g,'')}</div>
            <button className="follow">Follow</button>
          </div>
          <h3 className="rh">{r.title}</h3>
          <p className="re">{r.excerpt}</p>
        </div>
        <div className="side">
          <button><span className="ic">❤️</span><span className="n">{r.likes}</span></button>
          <button><span className="ic">💬</span><span className="n">{r.comments}</span></button>
          <button><Icon name="share" size={26}/><span className="n">Share</span></button>
          <button><Icon name="bookmark" size={26}/><span className="n">Save</span></button>
        </div>
        <div style={{position:'absolute', bottom: 12, left: 0, right: 0, display:'flex', justifyContent:'center', gap: 18, zIndex:5}}>
          <button onClick={() => setIdx((idx - 1 + REELS.length) % REELS.length)} style={{background:'rgba(255,255,255,.2)', border:'none', color:'#fff', padding:'8px 16px', borderRadius:9999, fontSize:12, fontWeight:600, backdropFilter:'blur(8px)'}}>← Prev</button>
          <button onClick={() => setIdx((idx + 1) % REELS.length)} style={{background:'rgba(255,255,255,.2)', border:'none', color:'#fff', padding:'8px 16px', borderRadius:9999, fontSize:12, fontWeight:600, backdropFilter:'blur(8px)'}}>Next →</button>
        </div>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [lang, setLang] = React.useState('en');
  const copy = {
    en: { h: 'Welcome to Our Vadodara', s: 'Your neighbourhood, in your pocket.', email: 'Email or phone', pw: 'Password', login: 'Login', google: 'Continue with Google', or: 'Or continue with', guest: 'Continue as guest', nu: "New here?", su: 'Sign up' },
    hi: { h: 'Our Vadodara में स्वागत है', s: 'आपका पड़ोस, आपकी जेब में।', email: 'ईमेल या फ़ोन', pw: 'पासवर्ड', login: 'लॉगिन', google: 'Google से जारी रखें', or: 'या इनसे जारी रखें', guest: 'अतिथि के रूप में जारी रखें', nu: 'नए हैं?', su: 'साइन अप' },
    gu: { h: 'Our Vadodara માં સ્વાગત છે', s: 'તમારું પડોશ, તમારા ખિસ્સામાં.', email: 'ઇમેઇલ કે ફોન', pw: 'પાસવર્ડ', login: 'લૉગિન', google: 'Google સાથે આગળ વધો', or: 'અથવા આની સાથે', guest: 'મહેમાન તરીકે આગળ વધો', nu: 'નવા છો?', su: 'સાઇન અપ' }
  };
  const c = copy[lang];
  const fontFam = lang === 'hi' ? 'Noto Sans Devanagari, sans-serif' : lang === 'gu' ? 'Noto Sans Gujarati, sans-serif' : 'inherit';
  return (
    <div className="login-screen">
      <div className="big-logo"><img src="../../assets/our-vadodara-logo.png" alt=""/></div>
      <div className="lang-toggle">
        <button className={lang==='en'?'active':''} onClick={() => setLang('en')}>EN</button>
        <button className={lang==='hi'?'active':''} onClick={() => setLang('hi')} style={{fontFamily:'Noto Sans Devanagari, sans-serif'}}>हिं</button>
        <button className={lang==='gu'?'active':''} onClick={() => setLang('gu')} style={{fontFamily:'Noto Sans Gujarati, sans-serif'}}>ગુ</button>
      </div>
      <h1 style={{fontFamily: fontFam}}>{c.h}</h1>
      <p className="sub" style={{fontFamily: fontFam}}>{c.s}</p>
      <div style={{width:'100%'}}>
        <input className="input" placeholder={c.email} style={{fontFamily: fontFam}}/>
        <input className="input" placeholder={c.pw} type="password" style={{fontFamily: fontFam}}/>
        <button className="btn btn-primary" onClick={onLogin} style={{fontFamily: fontFam}}>{c.login}</button>
        <div className="divider" style={{fontFamily: fontFam}}>{c.or}</div>
        <button className="btn btn-google" style={{fontFamily: fontFam}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>
          {c.google}
        </button>
        <button className="btn" style={{background:'transparent', color:'var(--ov-fg-muted)', marginTop: 8, fontFamily: fontFam}}>{c.guest}</button>
      </div>
      <div className="signup-link" style={{fontFamily: fontFam}}>{c.nu} <a href="#">{c.su}</a></div>
    </div>
  );
};

const ProfileScreen = ({ onLogout }) => (
  <div style={{padding: '24px 16px'}}>
    <div style={{textAlign:'center', padding: '20px 0'}}>
      <div style={{width: 84, height: 84, borderRadius: 9999, margin: '0 auto 12px', background: 'linear-gradient(135deg, var(--ov-primary-400), var(--ov-primary-600))', color:'#fff', fontSize:32, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', boxShadow: 'var(--ov-shadow-lg)'}}>M</div>
      <div style={{fontSize:18, fontWeight:700}}>Meera Patel <span style={{color:'var(--ov-primary-600)'}}>✓</span></div>
      <div style={{fontSize:12, color:'var(--ov-fg-muted)'}}>📍 Sayajigunj · Joined 2024</div>
    </div>
    <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 8, margin: '16px 0'}}>
      <div style={{background:'#fff', border:'1px solid var(--ov-border)', borderRadius: 12, padding: 12, textAlign:'center'}}><div style={{fontSize:20, fontWeight:700}}>🔥 12</div><div style={{fontSize:10, color:'var(--ov-fg-subtle)', textTransform:'uppercase', letterSpacing:'.06em'}}>Day streak</div></div>
      <div style={{background:'#fff', border:'1px solid var(--ov-border)', borderRadius: 12, padding: 12, textAlign:'center'}}><div style={{fontSize:20, fontWeight:700}}>284</div><div style={{fontSize:10, color:'var(--ov-fg-subtle)', textTransform:'uppercase', letterSpacing:'.06em'}}>Read</div></div>
      <div style={{background:'#fff', border:'1px solid var(--ov-border)', borderRadius: 12, padding: 12, textAlign:'center'}}><div style={{fontSize:20, fontWeight:700}}>47</div><div style={{fontSize:10, color:'var(--ov-fg-subtle)', textTransform:'uppercase', letterSpacing:'.06em'}}>Saved</div></div>
    </div>
    {['🔖 Saved articles','🔔 Notifications','🌐 Language', '🏥 Blood SOS', '⚙️ Settings'].map((l,i) => (
      <div key={i} style={{background:'#fff', border:'1px solid var(--ov-border)', borderRadius:12, padding:'14px 16px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', fontSize:14, fontWeight:500}}>
        <span>{l}</span>
        <span style={{color: 'var(--ov-fg-subtle)'}}>›</span>
      </div>
    ))}
    <button onClick={onLogout} style={{width:'100%', padding: 14, marginTop: 16, background:'transparent', border:'1px solid var(--ov-danger-500)', color: 'var(--ov-danger-500)', borderRadius: 9999, fontWeight:600, fontSize:14, cursor:'pointer'}}>Log out</button>
  </div>
);

Object.assign(window, { ArticleScreen, ReelsScreen, LoginScreen, ProfileScreen, REELS });
