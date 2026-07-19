import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Camera,
  Check,
  ExternalLink,
  Globe2,
  Info,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
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
  getTicketTypes,
  getVenueAddress,
  getVenueName,
  normalizeEvent
} from '../../utils/eventUtils';

const stripHtml = value => String(value || '').replace(/<[^>]*>/g, '').trim();
const asList = value => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return Object.values(value);
  return [value];
};

const formatPrice = value => {
  if (String(value).toLowerCase() === 'free' || Number(value) === 0) return 'Free';
  const amount = Number(value);
  return Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : 'Price TBA';
};

const withProtocol = value => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const Section = ({ icon: Icon, title, children }) => (
  <section className="border-b border-slate-200/80 py-6 last:border-0 dark:border-slate-800 sm:py-8">
    <div className="mb-4 flex items-center gap-3">
      {Icon && <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300"><Icon className="h-4.5 w-4.5" /></span>}
      <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">{title}</h2>
    </div>
    {children}
  </section>
);

const EventDetail = ({ eventId, onBack }) => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return undefined;
    }
    return onValue(ref(db, `events/${eventId}`), snapshot => {
      setEvent(snapshot.exists() ? normalizeEvent(snapshot.val(), eventId) : null);
      setLoading(false);
    });
  }, [eventId]);

  useEffect(() => {
    if (!user?.uid || !eventId) {
      setIsBookmarked(false);
      return undefined;
    }
    return onValue(ref(db, `eventBookmarks/${user.uid}/${eventId}`), snapshot => setIsBookmarked(snapshot.exists()));
  }, [user?.uid, eventId]);

  const toggleBookmark = async () => {
    if (!user?.uid) {
      document.dispatchEvent(new CustomEvent('showGuestPrompt'));
      return;
    }
    const bookmarkRef = ref(db, `eventBookmarks/${user.uid}/${eventId}`);
    if (isBookmarked) await remove(bookmarkRef);
    else await set(bookmarkRef, { savedAt: Date.now() });
  };

  const detail = useMemo(() => {
    if (!event) return null;
    const title = getLocalizedText(event.title, currentLanguage) || 'Untitled event';
    const description = stripHtml(getLocalizedText(event.description, currentLanguage));
    const date = new Date(getEventStartDate(event));
    const validDate = !Number.isNaN(date.getTime());
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const isPast = validDate && date < startOfToday;
    const isToday = validDate && date.toDateString() === new Date().toDateString();
    const tickets = getTicketTypes(event);
    const capacity = Number(getEventCapacity(event)) || 0;
    const registrations = getRegistrationCount(event);
    const soldOutByTickets = tickets.length > 0 && tickets.every(ticket => Number(ticket.availableSeats ?? ticket.totalSeats ?? 0) <= 0);
    const soldOut = soldOutByTickets || (capacity > 0 && registrations >= capacity);
    const price = getEventPrice(event);
    const media = event.media || {};
    const images = asList(media.images)
      .map(image => typeof image === 'string' ? { url: image } : image)
      .filter(image => image?.url);
    const videos = asList(media.videos)
      .map(video => typeof video === 'string' ? { url: video } : video)
      .filter(video => video?.url);
    const heroImage = getEventImage(event) || images[0]?.url || '';
    const canBook = !isPast && !soldOut && event.registrationRequired !== false;
    const dateLabel = validDate
      ? date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : 'Date to be announced';
    const address = getVenueAddress(event.venue);
    const venueName = getVenueName(event.venue);
    const directionsUrl = event.venue?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venueName, address].filter(Boolean).join(', '))}`;

    return {
      title, description, date, isPast, isToday, tickets, capacity, registrations, soldOut,
      price, images, videos, heroImage, canBook, dateLabel, address, venueName, directionsUrl
    };
  }, [event, currentLanguage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-[420px] rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px]"><div className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800" /><div className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800" /></div>
        </div>
      </div>
    );
  }

  if (!event || !detail) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center dark:bg-slate-950">
        <div><CalendarDays className="mx-auto h-12 w-12 text-slate-400" /><h1 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">Event not found</h1><p className="mt-2 text-slate-500">This event may have been removed or is no longer available.</p><button type="button" onClick={onBack} className="mt-6 rounded-2xl bg-teal-700 px-6 py-3 font-bold text-white">Browse events</button></div>
      </div>
    );
  }

  const statusLabel = detail.soldOut ? 'Sold out' : detail.isPast ? 'Event ended' : detail.isToday ? 'Happening today' : 'Booking open';
  const bookingLabel = detail.soldOut ? 'Sold out' : detail.isPast ? 'Event ended' : event.registrationRequired === false ? 'Registration not required' : 'Book tickets';
  const mobileBookingLabel = detail.soldOut ? 'Sold out' : detail.isPast ? 'Ended' : event.registrationRequired === false ? 'No booking needed' : 'Book tickets';
  const category = String(event.category || 'Event');
  const amenities = asList(event.amenities);
  const facilities = asList(event.venue?.facilities);
  const highlights = [...new Set([...amenities, ...facilities])];
  const organizer = event.organizer || {};
  const organizerVisible = organizer.name || organizer.email || organizer.phone || organizer.website;
  const availableSeats = detail.capacity > 0 ? Math.max(detail.capacity - detail.registrations, 0) : null;

  const openRegistration = () => {
    if (detail.canBook) setShowRegistration(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900 dark:bg-slate-950 dark:text-white lg:pb-10">
      <header className="relative overflow-hidden bg-slate-950">
        {detail.heroImage && <div className="absolute inset-0"><img src={detail.heroImage} alt="" className="h-full w-full scale-110 object-cover opacity-30 blur-2xl" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/60" /></div>}

        <div className="absolute left-3 top-[calc(12px+env(safe-area-inset-top))] z-20 lg:left-6 lg:top-6">
          <button type="button" onClick={onBack} className="grid h-11 w-11 place-items-center rounded-full bg-slate-950/65 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-slate-900" aria-label="Back to events"><ArrowLeft className="h-5 w-5" /></button>
        </div>
        <div className="absolute right-3 top-[calc(12px+env(safe-area-inset-top))] z-20 flex gap-2 lg:right-6 lg:top-6">
          <button type="button" onClick={toggleBookmark} className={`grid h-11 w-11 place-items-center rounded-full ring-1 ring-white/20 backdrop-blur transition ${isBookmarked ? 'bg-rose-600 text-white' : 'bg-slate-950/65 text-white hover:bg-slate-900'}`} aria-label={isBookmarked ? 'Remove saved event' : 'Save event'}><Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} /></button>
          <button type="button" onClick={() => setShareOpen(true)} className="grid h-11 w-11 place-items-center rounded-full bg-slate-950/65 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-slate-900" aria-label="Share event"><Share2 className="h-5 w-5" /></button>
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-6 px-0 pb-7 pt-0 sm:px-5 sm:pb-10 sm:pt-20 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-center lg:px-8 lg:py-16">
          <button type="button" onClick={() => detail.heroImage && setSelectedMedia({ type: 'image', url: detail.heroImage })} className="group relative aspect-[16/10] w-full overflow-hidden bg-slate-900 text-left sm:rounded-3xl lg:aspect-[4/5] lg:shadow-2xl lg:ring-1 lg:ring-white/15" aria-label="View event poster">
            {detail.heroImage ? <img src={detail.heroImage} alt={`${detail.title} poster`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-teal-900 to-rose-900 text-white"><CalendarDays className="h-16 w-16 opacity-70" /></div>}
            {detail.heroImage && <span className="absolute bottom-3 right-3 hidden items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-bold text-white backdrop-blur sm:inline-flex"><Camera className="h-3.5 w-3.5" /> View poster</span>}
          </button>

          <div className="px-4 sm:px-0">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white ring-1 ring-white/15">{category}</span>
              <span className={`rounded-full px-3 py-1.5 text-xs font-black ${detail.soldOut || detail.isPast ? 'bg-slate-700 text-slate-200' : detail.isToday ? 'bg-rose-600 text-white' : 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/25'}`}>{statusLabel}</span>
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">{detail.title}</h1>
            <div className="mt-5 space-y-3 text-sm text-slate-200 sm:text-base">
              <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" /><div><p className="font-bold text-white">{detail.dateLabel}</p><p className="mt-0.5 text-slate-400">{getEventStartTime(event) || 'Time to be announced'}{event.endTime ? ` – ${event.endTime}` : ''}</p></div></div>
              <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" /><div><p className="font-bold text-white">{detail.venueName}</p>{detail.address && <p className="mt-0.5 text-slate-400">{detail.address}</p>}</div></div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-slate-200">
              {event.ageRestriction && <span className="rounded-lg bg-white/10 px-3 py-2 ring-1 ring-white/10">{event.ageRestriction === 'all' ? 'All age groups' : `${event.ageRestriction}+ years`}</span>}
              {event.language && <span className="rounded-lg bg-white/10 px-3 py-2 ring-1 ring-white/10">{asList(event.language).join(', ')}</span>}
              {event.duration && <span className="rounded-lg bg-white/10 px-3 py-2 ring-1 ring-white/10">{event.duration}</span>}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-3 py-4 sm:px-5 sm:py-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="rounded-[1.75rem] bg-white px-5 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 sm:px-7">
          <Section icon={Info} title="About the event">
            <p className="whitespace-pre-line text-[15px] leading-7 text-slate-600 dark:text-slate-300 sm:text-base">{detail.description || 'More information about this event will be available soon.'}</p>
            {asList(event.tags).length > 0 && <div className="mt-5 flex flex-wrap gap-2">{asList(event.tags).map(tag => <span key={String(tag)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">#{String(tag).replace(/^#/, '')}</span>)}</div>}
          </Section>

          {highlights.length > 0 && (
            <Section icon={Sparkles} title="Event highlights">
              <div className="grid gap-3 sm:grid-cols-2">{highlights.map(item => <div key={String(item)} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800/70 dark:text-slate-200"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Check className="h-3.5 w-3.5" /></span>{item}</div>)}</div>
            </Section>
          )}

          <Section icon={MapPin} title="Venue">
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="bg-gradient-to-br from-teal-50 to-sky-50 p-5 dark:from-teal-950/40 dark:to-slate-900 sm:p-6">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">{detail.venueName}</h3>
                {detail.address && <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">{detail.address}</p>}
                <a href={detail.directionsUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-teal-700 px-4 py-2.5 text-sm font-extrabold text-teal-800 transition hover:bg-teal-700 hover:text-white dark:border-teal-500 dark:text-teal-300"><Navigation className="h-4 w-4" /> Get directions <ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
            </div>
          </Section>

          {(detail.images.length > 1 || detail.videos.length > 0) && (
            <Section icon={Camera} title="Gallery">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {detail.images.map((image, index) => <button key={`${image.url}-${index}`} type="button" onClick={() => setSelectedMedia({ type: 'image', url: image.url })} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100"><img src={image.url} alt={`Event gallery ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></button>)}
                {detail.videos.map((video, index) => <button key={`${video.url}-${index}`} type="button" onClick={() => setSelectedMedia({ type: 'video', url: video.url })} className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-slate-900 text-white"><Play className="h-10 w-10 fill-current" /><span className="absolute bottom-2 left-3 text-xs font-bold">Watch video</span></button>)}
              </div>
            </Section>
          )}

          {(event.terms || event.refundPolicy || event.ageRestriction) && (
            <Section icon={ShieldCheck} title="Know before you go">
              <div className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {event.ageRestriction && <div className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-teal-600" /><p>{event.ageRestriction === 'all' ? 'This event is suitable for all age groups.' : `Guests must be ${event.ageRestriction} years or older.`}</p></div>}
                {event.terms && <div className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-teal-600" /><p>{stripHtml(event.terms)}</p></div>}
                {event.refundPolicy && <div className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-teal-600" /><p>Refund policy: {String(event.refundPolicy).replace(/_/g, ' ')}.</p></div>}
              </div>
            </Section>
          )}

          {organizerVisible && (
            <Section icon={Users} title="Hosted by">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-rose-50 text-xl font-black text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">{String(organizer.name || 'O').charAt(0).toUpperCase()}</div>
                <div className="min-w-0"><h3 className="text-lg font-black text-slate-950 dark:text-white">{organizer.name || 'Event organizer'}</h3><div className="mt-3 flex flex-wrap gap-2">
                  {organizer.email && <a href={`mailto:${organizer.email}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Mail className="h-3.5 w-3.5" /> Email</a>}
                  {organizer.phone && <a href={`tel:${organizer.phone}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Phone className="h-3.5 w-3.5" /> Call</a>}
                  {organizer.website && <a href={withProtocol(organizer.website)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Globe2 className="h-3.5 w-3.5" /> Website</a>}
                </div></div>
              </div>
            </Section>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6 overflow-hidden rounded-[1.75rem] bg-white shadow-lg ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Tickets from</p>
              <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{formatPrice(detail.price)}</p>
              {detail.tickets.length > 0 && <div className="mt-5 space-y-2">{detail.tickets.slice(0, 4).map((ticketType, index) => <div key={ticketType.id || index} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><div className="min-w-0"><p className="truncate text-sm font-extrabold">{ticketType.name || `Ticket ${index + 1}`}</p>{ticketType.availableSeats !== undefined && <p className="text-xs text-slate-500">{ticketType.availableSeats} available</p>}</div><p className="shrink-0 font-black">{formatPrice(ticketType.price)}</p></div>)}</div>}
              <button type="button" disabled={!detail.canBook} onClick={openRegistration} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700"><Ticket className="h-5 w-5" />{bookingLabel}</button>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure registration</div>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-center justify-between"><span className="text-slate-500">Registered</span><span className="font-black">{detail.registrations}</span></div>
              {availableSeats !== null && <div className="mt-2 flex items-center justify-between"><span className="text-slate-500">Spots remaining</span><span className="font-black text-emerald-600">{availableSeats}</span></div>}
            </div>
          </div>
        </aside>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3"><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tickets from</p><p className="truncate text-xl font-black text-slate-950 dark:text-white">{formatPrice(detail.price)}</p></div><button type="button" disabled={!detail.canBook} onClick={openRegistration} className="inline-flex min-w-0 max-w-[65%] items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-rose-600/20 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700"><Ticket className="h-4 w-4 shrink-0" /><span className="truncate">{mobileBookingLabel}</span></button></div>
      </div>

      {showRegistration && (
        <div className="fixed inset-0 z-[100] flex items-end bg-slate-950/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4" onClick={() => setShowRegistration(false)}>
          <div className="relative max-h-[95vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl dark:bg-slate-950 sm:max-w-4xl sm:rounded-[2rem]" onClick={clickEvent => clickEvent.stopPropagation()}>
            <button type="button" onClick={() => setShowRegistration(false)} className="absolute right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur dark:bg-slate-900/90 dark:text-white" aria-label="Close registration"><X className="h-5 w-5" /></button>
            <EventRegistration eventId={event.id} event={event} onClose={() => setShowRegistration(false)} />
          </div>
        </div>
      )}

      <ShareSheet isOpen={shareOpen} onClose={() => setShareOpen(false)} shareData={{ title: detail.title, text: detail.description, url: `${window.location.origin}/events/${encodeURIComponent(eventId)}` }} />

      {selectedMedia && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/95 p-4" onClick={() => setSelectedMedia(null)}>
          <button type="button" onClick={() => setSelectedMedia(null)} className="absolute right-4 top-[calc(16px+env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white" aria-label="Close media"><X className="h-6 w-6" /></button>
          <div className="w-full max-w-5xl" onClick={clickEvent => clickEvent.stopPropagation()}>{selectedMedia.type === 'image' ? <img src={selectedMedia.url} alt="Event media" className="mx-auto max-h-[86vh] max-w-full rounded-2xl object-contain" /> : <video src={selectedMedia.url} controls autoPlay playsInline className="mx-auto max-h-[86vh] w-full rounded-2xl" />}</div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
