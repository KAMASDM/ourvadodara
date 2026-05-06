// NewsFeed.jsx — stories rail, chips, cards, focus (weather)
const SAMPLE_STORIES = [
  { name: 'Metro', img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=200' },
  { name: 'Cricket', img: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200' },
  { name: 'Traffic', img: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200' },
  { name: 'Weather', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200', seen: true },
  { name: 'Festival', img: 'https://images.unsplash.com/photo-1604933834413-4f5d5fbeaeb9?w=200', seen: true },
  { name: 'Market', img: 'https://images.unsplash.com/photo-1534531173927-aeb928d54385?w=200', seen: true },
];

const StoriesRail = () => (
  <div className="stories">
    {SAMPLE_STORIES.map((s, i) => (
      <div className="story" key={i}>
        <div className={`story-ring ${s.seen ? 'seen' : ''}`}>
          <div className="inner"><img src={s.img} alt=""/></div>
        </div>
        <div className="cap">{s.name}</div>
      </div>
    ))}
  </div>
);

const CATEGORIES = [
  { id: 'all', label: 'All News', emoji: '📰' },
  { id: 'local', label: 'Local', emoji: '🏠' },
  { id: 'politics', label: 'Politics', emoji: '🏛️' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'weather', label: 'Weather', emoji: '🌤️' },
  { id: 'health', label: 'Health', emoji: '🏥' },
];

const CategoryChips = ({ active, onChange }) => (
  <div className="chips">
    {CATEGORIES.map(c => (
      <button key={c.id} className={`chip ${active===c.id ? 'active' : ''}`} onClick={() => onChange(c.id)}>
        <span>{c.emoji}</span>{c.label}
      </button>
    ))}
  </div>
);

const FocusCard = () => (
  <div className="focus-card">
    <div className="fhead">
      <div>
        <div className="temp">32°</div>
        <div className="fsub">📍 Vadodara · Sunny, clear skies</div>
      </div>
      <div className="ic">☀️</div>
    </div>
    <div className="stats">
      <div className="cell"><div className="v">65%</div><div className="k">Humidity</div></div>
      <div className="cell"><div className="v">12 km/h</div><div className="k">Wind</div></div>
      <div className="cell"><div className="v">7</div><div className="k">UV Index</div></div>
    </div>
  </div>
);

const BreakingBanner = () => (
  <div className="breaking">
    <span className="pulse"></span>
    <span>BREAKING · Major traffic diversions on RC Dutt Road</span>
  </div>
);

const FeaturedCard = ({ story, onOpen }) => (
  <div className="card-featured" onClick={() => onOpen(story)}>
    <div className="bg" style={{backgroundImage: `url(${story.img})`}}/>
    <div className="scrim"/>
    <div className="content">
      <div className="pills">
        <span className="pill pill-cat" style={{background:'#7c3aed'}}>Local</span>
        <span className="pill pill-trend">↗ Trending</span>
      </div>
      <h2>{story.title}</h2>
      <p>{story.excerpt}</p>
    </div>
  </div>
);

const NewsCard = ({ story, onOpen, saved, onSave }) => (
  <div className="card" onClick={() => onOpen(story)}>
    <div className="card-media">
      <img src={story.img} alt=""/>
      <div className="overlay-pills">
        <span className="pill pill-cat" style={{background: story.catColor || '#7c3aed'}}>{story.category}</span>
        {story.live && <span className="pill pill-live">Live</span>}
      </div>
    </div>
    <div className="card-body">
      <div className="author-row">
        <span className="av">{story.author[0]}</span>
        <span style={{fontWeight:600, color:'var(--ov-fg)'}}>{story.author}</span>
        <span style={{color: 'var(--ov-primary-600)'}}>✓</span>
        <span>· {story.time}</span>
      </div>
      <h3 className="card-title">{story.title}</h3>
      <p className="card-excerpt">{story.excerpt}</p>
      <div className="meta-row">
        <span><Icon name="pin" size={12}/> {story.loc}</span>
        <span><Icon name="eye" size={12}/> {story.views}</span>
        <span><Icon name="msg" size={12}/> {story.comments}</span>
        <div className="act">
          <button onClick={(e) => { e.stopPropagation(); onSave && onSave(story.id); }} className={saved?'saved':''}>
            <Icon name="bookmark" size={16}/>
          </button>
          <button onClick={(e) => e.stopPropagation()}><Icon name="share" size={16}/></button>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { StoriesRail, CategoryChips, FocusCard, BreakingBanner, FeaturedCard, NewsCard, CATEGORIES });
