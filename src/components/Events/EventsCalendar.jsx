import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  Search,
  Share2,
  Ticket,
  Users,
  X
} from 'lucide-react';
import { onValue, ref, remove, set } from 'firebase/database';
import { db } from '../../firebase-config';
import { useAuth } from '../../context/Auth/AuthContext';
import { useLanguage } from '../../context/Language/LanguageContext';
import { getLocalizedText } from '../../utils/textUtils';
import ShareSheet from '../Common/ShareSheet';
import EventRegistration from './EventRegistration';
import {
  getEventCapacity,
  getEventImage,
  getEventPrice,
  getEventStartDate,
  getEventStartTime,
  getRegistrationCount,
  getVenueAddress,
  getVenueName,
  isPublishedEvent,
  normalizeEvent
} from '../../utils/eventUtils';

const DATE_FILTERS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All dates' },
  { id: 'past', label: 'Past events' },
  { id: 'custom', label: 'Custom dates' }
];

const startOfDay = value => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = value => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const getEventDate = event => new Date(getEventStartDate(event));

const EventsCalendar = ({ className = '' }) => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const [events, setEvents] = useState([]);
  const [savedEvents, setSavedEvents] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('upcoming');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [shareData, setShareData] = useState(null);

  useEffect(() => onValue(ref(db, 'events'), snapshot => {
    const nextEvents = Object.entries(snapshot.val() || {})
      .map(([id, event]) => normalizeEvent(event, id))
      .filter(isPublishedEvent);
    setEvents(nextEvents);
    setLoading(false);
  }), []);

  useEffect(() => {
    if (!user?.uid) {
      setSavedEvents(new Set());
      return undefined;
    }
    return onValue(ref(db, `eventBookmarks/${user.uid}`), snapshot => {
      setSavedEvents(new Set(Object.keys(snapshot.val() || {})));
    });
  }, [user?.uid]);

  const categories = useMemo(() => {
    const eventCategories = events.map(event => String(event.category || '').trim().toLowerCase()).filter(Boolean);
    return ['all', ...new Set(eventCategories)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = endOfDay(new Date(today));
    nextWeek.setDate(today.getDate() + 7);
    const nextMonth = endOfDay(new Date(today));
    nextMonth.setMonth(today.getMonth() + 1);
    const searchTerm = query.trim().toLowerCase();

    return events.filter(event => {
      const eventDate = getEventDate(event);
      if (Number.isNaN(eventDate.getTime())) return false;
      const category = String(event.category || '').toLowerCase();
      if (categoryFilter !== 'all' && category !== categoryFilter) return false;

      if (searchTerm) {
        const searchText = [
          getLocalizedText(event.title, currentLanguage),
          getLocalizedText(event.description, currentLanguage),
          category,
          getVenueName(event.venue),
          getVenueAddress(event.venue),
          ...(Array.isArray(event.tags) ? event.tags : Object.values(event.tags || {}))
        ].join(' ').toLowerCase();
        if (!searchText.includes(searchTerm)) return false;
      }

      switch (dateFilter) {
        case 'upcoming': return eventDate >= today;
        case 'today': return eventDate >= today && eventDate <= endOfDay(today);
        case 'tomorrow': return eventDate >= tomorrow && eventDate <= endOfDay(tomorrow);
        case 'week': return eventDate >= today && eventDate <= nextWeek;
        case 'month': return eventDate >= today && eventDate <= nextMonth;
        case 'past': return eventDate < today;
        case 'custom': {
          if (!customDateRange.start || !customDateRange.end) return true;
          return eventDate >= startOfDay(customDateRange.start) && eventDate <= endOfDay(customDateRange.end);
        }
        default: return true;
      }
    }).sort((a, b) => {
      const aTime = getEventDate(a).getTime();
      const bTime = getEventDate(b).getTime();
      return dateFilter === 'past' ? bTime - aTime : aTime - bTime;
    });
  }, [events, categoryFilter, dateFilter, customDateRange, query, currentLanguage]);

  const selectedFilterCount = Number(categoryFilter !== 'all')
    + Number(dateFilter !== 'upcoming');
  const activeFilterCount = selectedFilterCount + Number(Boolean(query.trim()));

  const clearFilters = () => {
    setQuery('');
    setCategoryFilter('all');
    setDateFilter('upcoming');
    setCustomDateRange({ start: '', end: '' });
  };

  const handleSaveEvent = async eventId => {
    if (!user?.uid) {
      document.dispatchEvent(new CustomEvent('showGuestPrompt'));
      return;
    }
    const bookmarkRef = ref(db, `eventBookmarks/${user.uid}/${eventId}`);
    if (savedEvents.has(eventId)) await remove(bookmarkRef);
    else await set(bookmarkRef, { savedAt: Date.now() });
  };

  const openEvent = eventId => {
    window.history.pushState({ view: 'event-detail', eventId }, '', `/events/${encodeURIComponent(eventId)}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className={`min-h-screen pb-24 dark:text-white ${className}`}>
      <div className="mx-auto max-w-7xl px-3 pb-6 pt-0 sm:px-5 sm:pt-4">
        <section className="relative z-0 -mx-3 border-b border-slate-200/80 bg-white/85 px-3 pb-3 pt-0 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85 sm:mx-0 sm:rounded-[1.5rem] sm:border sm:p-3">
          <div className="flex h-14 items-center gap-1.5 rounded-b-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-950 dark:ring-slate-700 sm:rounded-2xl">
            <label className="relative h-full min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-teal-600" />
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search events or venues"
                className="h-full w-full rounded-xl bg-transparent pl-10 pr-2 text-sm font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:bg-teal-50/70 dark:text-white dark:focus:bg-teal-950/40"
              />
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="relative inline-flex h-full shrink-0 items-center gap-2 rounded-xl bg-teal-700 px-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-teal-800 active:scale-[0.98] dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {selectedFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] ring-2 ring-teal-700 dark:ring-teal-600">{selectedFilterCount}</span>}
            </button>
          </div>

          <div className="mt-2 hidden gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex">
            {DATE_FILTERS.slice(0, 5).map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setDateFilter(filter.id)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${dateFilter === filter.id
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'bg-white/70 text-slate-600 ring-1 ring-slate-200 hover:bg-white dark:bg-slate-900/70 dark:text-slate-300 dark:ring-slate-700'}`}
              >{filter.label}</button>
            ))}
          </div>

          <div className="mt-2 hidden gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold capitalize transition ${categoryFilter === category
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-300 dark:hover:bg-rose-950/50'}`}
              >{category === 'all' ? 'All categories' : category}</button>
            ))}
          </div>
        </section>

        <div className="mt-5 flex items-end justify-between gap-3 px-1">
          <div>
            <p className="eyebrow text-slate-500 dark:text-slate-400">Explore</p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950 dark:text-white">{filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found</h2>
          </div>
          {activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="text-sm font-bold text-rose-600 hover:text-rose-700">Reset</button>}
        </div>

        {loading ? (
          <div className="grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map(item => <div key={item} className="liquid-panel h-[430px] animate-pulse rounded-[1.75rem]" />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="liquid-panel mt-4 rounded-[1.75rem] px-6 py-16 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-300"><CalendarDays className="h-7 w-7" /></div>
            <h3 className="mt-4 text-lg font-extrabold text-slate-950 dark:text-white">No matching events</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try another date, category or search term.</p>
            <button type="button" onClick={clearFilters} className="mt-5 rounded-2xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white">Show upcoming events</button>
          </div>
        ) : (
          <div className="grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map(event => (
              <ModernEventCard
                key={event.id}
                event={event}
                language={currentLanguage}
                saved={savedEvents.has(event.id)}
                onOpen={() => openEvent(event.id)}
                onSave={() => handleSaveEvent(event.id)}
                onShare={() => setShareData({
                  title: getLocalizedText(event.title, currentLanguage) || 'Our Vadodara Event',
                  text: getLocalizedText(event.description, currentLanguage) || '',
                  url: `${window.location.origin}/events/${encodeURIComponent(event.id)}`
                })}
                onRegister={() => setSelectedEventId(event.id)}
              />
            ))}
          </div>
        )}
      </div>

      {filtersOpen && (
        <div className="app-modal-layer !p-0 flex items-stretch justify-end bg-slate-950/45 backdrop-blur-sm sm:items-center sm:justify-center sm:!p-4" onClick={() => setFiltersOpen(false)}>
          <div className="h-full w-[min(88vw,380px)] overflow-y-auto rounded-l-[2rem] bg-white p-5 shadow-2xl dark:bg-slate-950 sm:h-auto sm:max-h-[88vh] sm:w-full sm:max-w-2xl sm:rounded-[2rem] sm:p-6" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div><p className="eyebrow text-teal-700 dark:text-teal-300">Refine results</p><h2 className="mt-1 text-xl font-extrabold">Event filters</h2></div>
              <button type="button" onClick={() => setFiltersOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close filters"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">When?</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DATE_FILTERS.map(filter => (
                  <button key={filter.id} type="button" onClick={() => setDateFilter(filter.id)} className={`rounded-2xl px-3 py-3 text-sm font-bold transition ${dateFilter === filter.id ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
                    {filter.label}
                  </button>
                ))}
              </div>
              {dateFilter === 'custom' && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="text-xs font-bold text-slate-500">FROM<input type="date" value={customDateRange.start} onChange={event => setCustomDateRange(previous => ({ ...previous, start: event.target.value }))} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
                  <label className="text-xs font-bold text-slate-500">TO<input type="date" value={customDateRange.end} min={customDateRange.start} onChange={event => setCustomDateRange(previous => ({ ...previous, end: event.target.value }))} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">What are you interested in?</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map(category => (
                  <button key={category} type="button" onClick={() => setCategoryFilter(category)} className={`inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-bold capitalize ${categoryFilter === category ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
                    {categoryFilter === category && <Check className="h-3.5 w-3.5" />}{category === 'all' ? 'Everything' : category}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 flex gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button type="button" onClick={clearFilters} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Reset</button>
              <button type="button" onClick={() => setFiltersOpen(false)} className="flex-[2] rounded-2xl bg-teal-700 px-4 py-3 text-sm font-bold text-white">Show {filteredEvents.length} events</button>
            </div>
          </div>
        </div>
      )}

      {selectedEventId && (
        <div className="app-modal-layer !p-0 flex items-end bg-slate-950/55 backdrop-blur-sm sm:items-center sm:justify-center sm:!p-4" onClick={() => setSelectedEventId(null)}>
          <div className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl dark:bg-slate-950 sm:max-w-4xl sm:rounded-[2rem]" onClick={event => event.stopPropagation()}>
            <button type="button" onClick={() => setSelectedEventId(null)} className="absolute right-4 top-4 z-20 rounded-full bg-white/90 p-2 text-slate-600 shadow-md backdrop-blur dark:bg-slate-900/90 dark:text-white" aria-label="Close registration"><X className="h-5 w-5" /></button>
            <EventRegistration eventId={selectedEventId} event={events.find(event => event.id === selectedEventId)} onClose={() => setSelectedEventId(null)} />
          </div>
        </div>
      )}

      <ShareSheet isOpen={Boolean(shareData)} onClose={() => setShareData(null)} shareData={shareData} />
    </div>
  );
};

const ModernEventCard = ({ event, language, saved, onOpen, onSave, onShare, onRegister }) => {
  const title = getLocalizedText(event.title, language) || 'Untitled event';
  const description = getLocalizedText(event.description, language);
  const eventDate = getEventDate(event);
  const today = startOfDay(new Date());
  const isPast = eventDate < today;
  const isToday = !Number.isNaN(eventDate.getTime()) && eventDate.toDateString() === new Date().toDateString();
  const capacity = Number(getEventCapacity(event)) || 0;
  const registrations = getRegistrationCount(event);
  const soldOut = capacity > 0 && registrations >= capacity;
  const remaining = capacity > 0 ? Math.max(capacity - registrations, 0) : null;
  const image = getEventImage(event);
  const rawPrice = getEventPrice(event);
  const priceValue = typeof rawPrice === 'object' ? Number(rawPrice.amount) : Number(rawPrice);
  const isFree = rawPrice === 'Free' || rawPrice === 'free' || priceValue === 0;
  const priceLabel = isFree ? 'Free' : Number.isFinite(priceValue) ? `₹${priceValue.toLocaleString('en-IN')}` : 'Price TBA';
  const month = Number.isNaN(eventDate.getTime()) ? 'TBA' : eventDate.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
  const day = Number.isNaN(eventDate.getTime()) ? '—' : eventDate.getDate();

  return (
    <article role="link" tabIndex={0} onClick={onOpen} onKeyDown={eventKey => { if (eventKey.key === 'Enter' || eventKey.key === ' ') { eventKey.preventDefault(); onOpen(); } }} className="liquid-panel group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border border-white/70 transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-white/10">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-teal-100 to-rose-100 dark:from-teal-950 dark:to-rose-950">
        {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center text-teal-700 dark:text-teal-300"><CalendarDays className="h-12 w-12" /></div>}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/15" />
        <div className="absolute left-3 top-3 overflow-hidden rounded-2xl bg-white/95 text-center shadow-lg backdrop-blur dark:bg-slate-950/90">
          <div className="bg-rose-600 px-3 py-1 text-[10px] font-black tracking-wider text-white">{month}</div>
          <div className="px-3 py-1 text-xl font-black text-slate-950 dark:text-white">{day}</div>
        </div>
        <div className="absolute right-3 top-3 flex gap-2">
          <button type="button" onClick={eventClick => { eventClick.stopPropagation(); onShare(); }} className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur hover:bg-white dark:bg-slate-950/85 dark:text-white" aria-label="Share event"><Share2 className="h-4 w-4" /></button>
          <button type="button" onClick={eventClick => { eventClick.stopPropagation(); onSave(); }} className={`grid h-9 w-9 place-items-center rounded-full shadow-md backdrop-blur ${saved ? 'bg-teal-700 text-white' : 'bg-white/90 text-slate-700 hover:bg-white dark:bg-slate-950/85 dark:text-white'}`} aria-label={saved ? 'Remove saved event' : 'Save event'}><Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} /></button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex min-w-0 flex-wrap gap-2">
          <span className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">{event.category || 'Event'}</span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white ${soldOut || isPast ? 'bg-slate-600' : isToday ? 'bg-rose-600' : 'bg-teal-700'}`}>{soldOut ? 'Sold out' : isPast ? 'Ended' : isToday ? 'Today' : 'Booking open'}</span>
        </div>
        <h3 className="line-clamp-2 text-lg font-extrabold leading-snug text-slate-950 transition group-hover:text-teal-800 dark:text-white dark:group-hover:text-teal-300">{title}</h3>
        {description && <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{description.replace(/<[^>]*>/g, '')}</p>}

        <div className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-teal-600" /><span className="truncate font-semibold">{Number.isNaN(eventDate.getTime()) ? 'Date to be announced' : eventDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}{getEventStartTime(event) ? ` · ${getEventStartTime(event)}` : ''}</span></div>
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-rose-500" /><span className="truncate">{getVenueName(event.venue)}</span></div>
          <div className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-violet-500" /><span>{remaining === null ? `${registrations} registered` : remaining > 0 ? `${remaining} spots left` : 'No spots left'}</span></div>
        </div>

        <div className="mt-auto flex items-center gap-3 border-t border-slate-200/70 pt-4 dark:border-slate-700/70">
          <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Tickets from</p><p className={`text-lg font-black ${isFree ? 'text-emerald-600' : 'text-slate-950 dark:text-white'}`}>{priceLabel}</p></div>
          {isPast ? (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-500">View details <ChevronRight className="h-4 w-4" /></span>
          ) : (
            <button type="button" disabled={soldOut} onClick={eventClick => { eventClick.stopPropagation(); onRegister(); }} className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 px-4 py-3 text-sm font-extrabold text-white shadow-md shadow-teal-700/20 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700">
              <Ticket className="h-4 w-4" />{soldOut ? 'Sold out' : 'Register'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default EventsCalendar;
