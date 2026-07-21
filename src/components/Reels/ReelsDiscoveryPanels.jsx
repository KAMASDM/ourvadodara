import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, CalendarDays, CheckCircle2, CloudSun, Droplets, Gift, Sparkles,
  Store, TicketCheck, Users, Vote, Wind
} from 'lucide-react';
import { onValue, ref, runTransaction } from 'firebase/database';
import { db } from '../../firebase-config';
import { useAuth } from '../../context/Auth/AuthContext';
import { getLocalizedText } from '../../utils/textUtils';

const navigateTo = path => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const PanelShell = ({ label, title, description, icon, color = 'emerald', onContinue, children }) => {
  const accents = {
    emerald: 'from-emerald-950 via-slate-950 to-teal-950 text-emerald-200 bg-emerald-400/10 border-emerald-400/20',
    violet: 'from-violet-950 via-slate-950 to-fuchsia-950 text-violet-200 bg-violet-400/10 border-violet-400/20',
    sky: 'from-sky-950 via-slate-950 to-indigo-950 text-sky-200 bg-sky-400/10 border-sky-400/20'
  };
  return (
    <section className={`relative flex h-full min-h-full snap-start snap-always items-center overflow-hidden bg-gradient-to-br ${accents[color]} text-white`}>
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-8 pt-24 sm:px-7 lg:px-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><div className="mb-2 inline-flex items-center gap-1.5 rounded-full border bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">{React.createElement(icon, { className: 'h-3.5 w-3.5' })}{label}</div><h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2><p className="mt-1 max-w-xl text-sm text-white/60">{description}</p></div>
          <button type="button" onClick={onContinue} className="hidden shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15 sm:inline-flex">Continue <ArrowDown className="h-4 w-4" /></button>
        </div>
        {children}
        <button type="button" onClick={onContinue} className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-bold active:scale-95 sm:hidden">Continue watching <ArrowDown className="h-4 w-4" /></button>
      </div>
    </section>
  );
};

const discountLabel = offer => {
  if (offer.discountType === 'fixed') return `₹${offer.discountValue || 0} OFF`;
  if (offer.discountType === 'bogo') return 'BUY 1 GET 1';
  if (offer.discountType === 'freebie') return 'FREE BENEFIT';
  if (offer.discountType === 'custom') return 'SPECIAL OFFER';
  return `${offer.discountValue || 0}% OFF`;
};

const activeOffer = offer => {
  const now = Date.now();
  return offer.active !== false && offer.brandActive !== false && offer.status === 'published'
    && (!offer.startsAt || Date.parse(offer.startsAt) <= now)
    && (!offer.endsAt || Date.parse(offer.endsAt) >= now)
    && (!(Number(offer.totalCouponLimit) > 0) || Number(offer.issuedCount || 0) < Number(offer.totalCouponLimit));
};

export const ReelsOfferPanel = ({ onContinue }) => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    const unsubscribers = [onValue(ref(db, 'offers'), snapshot => setOffers(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value }))))];
    if (user?.uid) unsubscribers.push(onValue(ref(db, `userCoupons/${user.uid}`), snapshot => setCoupons(Object.values(snapshot.val() || {}))));
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [user?.uid]);

  const rankedOffers = useMemo(() => {
    const affinity = coupons.reduce((result, coupon) => {
      const engagement = Number(coupon.useCount || 0) > 0 ? 5 : 1;
      result[coupon.brandId] = (result[coupon.brandId] || 0) + engagement;
      return result;
    }, {});
    return offers.filter(activeOffer).sort((left, right) => {
      const score = offer => Number(affinity[offer.brandId] || 0) * 1_000_000
        + Number(offer.featured === true) * 100_000
        + Number(offer.redeemedCount || 0) * 100
        + Number(offer.issuedCount || 0) * 10
        + Number(offer.createdAt || 0) / 1_000_000_000;
      return score(right) - score(left);
    }).slice(0, 6);
  }, [coupons, offers]);

  return (
    <PanelShell label="Local rewards" title="Trending offers from brands you love" description={coupons.length ? 'Based on brands in your coupon activity, plus what Vadodara is redeeming now.' : 'Popular local offers picked from the most claimed and redeemed deals.'} icon={Sparkles} onContinue={onContinue}>
      {rankedOffers.length ? <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ touchAction: 'pan-x' }}>
        {rankedOffers.map(offer => <button key={offer.id} type="button" onClick={() => navigateTo('/offers')} className="w-[76vw] max-w-[290px] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-white/[0.08] text-left shadow-2xl backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/[0.12] sm:w-72">
          <div className="flex items-center gap-3 p-4"><div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-1">{offer.brandLogoUrl ? <img src={offer.brandLogoUrl} alt="" className="h-full w-full object-contain" /> : <Store className="h-6 w-6 text-emerald-700" />}</div><div className="min-w-0"><p className="truncate text-xs font-bold uppercase tracking-wide text-emerald-300">{offer.brandName}</p><p className="mt-0.5 truncate font-bold">{offer.title}</p></div></div>
          <div className="border-y border-white/10 bg-black/20 px-4 py-4"><p className="text-2xl font-black">{discountLabel(offer)}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-white/60">{offer.description}</p></div>
          <div className="flex items-center justify-between px-4 py-3 text-xs"><span className="inline-flex items-center gap-1 text-white/55"><Users className="h-3.5 w-3.5" />{Number(offer.redeemedCount || 0)} redeemed</span><span className="inline-flex items-center gap-1 font-bold text-emerald-300">Get offer <TicketCheck className="h-4 w-4" /></span></div>
        </button>)}
      </div> : <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center"><Gift className="mx-auto h-9 w-9 text-white/30" /><p className="mt-3 text-sm text-white/60">Fresh offers are coming soon.</p></div>}
    </PanelShell>
  );
};

const normalizeOptions = options => Array.isArray(options) ? options : Object.values(options || {});

export const ReelsPollPanel = ({ onContinue }) => {
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [voting, setVoting] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => onValue(ref(db, 'polls'), snapshot => {
    const active = Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value }))
      .filter(item => item.isPublished && item.settings?.isActive)
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    setPoll(active[0] || null);
  }), []);

  const options = normalizeOptions(poll?.options);
  const hasVoted = Boolean(user?.uid && options.some(option => (option.voters || []).includes(user.uid)));
  const showResults = hasVoted || poll?.settings?.showResults === 'always' || poll?.settings?.showResults === 'before_vote';

  const vote = async optionId => {
    if (!user?.uid || user.isAnonymous) {
      document.dispatchEvent(new CustomEvent('showGuestPrompt'));
      return;
    }
    setVoting(optionId);
    setMessage('');
    try {
      const result = await runTransaction(ref(db, `polls/${poll.id}`), current => {
        if (!current?.settings?.isActive) return;
        const currentOptions = normalizeOptions(current.options);
        if (currentOptions.some(option => (option.voters || []).includes(user.uid))) return;
        const updatedOptions = currentOptions.map(option => option.id === optionId ? { ...option, votes: Number(option.votes || 0) + 1, voters: [...(option.voters || []), user.uid] } : option);
        const totalVotes = Number(current.totalVotes || 0) + 1;
        return { ...current, options: updatedOptions, totalVotes, analytics: { ...(current.analytics || {}), totalVotes } };
      });
      setMessage(result.committed ? 'Your vote is in!' : 'You have already voted in this poll.');
    } catch {
      setMessage('Could not submit your vote. Please try again.');
    } finally { setVoting(''); }
  };

  const question = getLocalizedText(poll?.question, 'en') || poll?.question?.default || 'What do you think?';
  const totalVotes = Number(poll?.totalVotes || 0);
  return (
    <PanelShell label="Take a break" title="Vote in today’s quick poll" description="A little pause from the scroll—add your voice to Vadodara’s conversation." icon={Vote} color="violet" onContinue={onContinue}>
      {poll ? <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-sm sm:p-7">
        <div className="flex items-start justify-between gap-4"><h3 className="text-xl font-black leading-snug sm:text-2xl">{question}</h3><span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">{totalVotes} votes</span></div>
        <div className="mt-5 space-y-3">{options.map(option => {
          const votes = Number(option.votes || 0);
          const share = totalVotes ? Math.round(votes / totalVotes * 100) : 0;
          const label = getLocalizedText(option.text, 'en') || option.text?.default || String(option.text || 'Option');
          return showResults ? <div key={option.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/15 p-4"><div className="absolute inset-y-0 left-0 bg-violet-400/20 transition-all" style={{ width: `${share}%` }} /><div className="relative flex justify-between gap-3 font-semibold"><span>{label}</span><span>{share}%</span></div></div>
            : <button key={option.id} type="button" disabled={Boolean(voting)} onClick={() => vote(option.id)} className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-left font-semibold transition hover:border-violet-300/50 hover:bg-white/10 disabled:opacity-50">{label}</button>;
        })}</div>
        {message && <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-violet-200"><CheckCircle2 className="h-4 w-4" />{message}</p>}
      </div> : <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center"><Vote className="mx-auto h-9 w-9 text-white/30" /><p className="mt-3 text-sm text-white/60">The next community poll is being prepared.</p></div>}
    </PanelShell>
  );
};

const FORECAST_CACHE_KEY = 'reels_tomorrow_weather_vadodara';

export const ReelsWeatherPanel = ({ onContinue }) => {
  const [forecast, setForecast] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        const cached = JSON.parse(sessionStorage.getItem(FORECAST_CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.savedAt < 30 * 60 * 1000) { setForecast(cached.data); return; }
        const key = import.meta.env.VITE_OPENWEATHER_API_KEY;
        if (!key) throw new Error('Weather service is not configured');
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=Vadodara&appid=${encodeURIComponent(key)}&units=metric`);
        if (!response.ok) throw new Error('Forecast unavailable');
        const json = await response.json();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const targetDate = tomorrow.toISOString().slice(0, 10);
        const entries = (json.list || []).filter(item => String(item.dt_txt || '').startsWith(targetDate));
        const selected = entries.sort((a, b) => Math.abs(new Date(a.dt_txt).getHours() - 12) - Math.abs(new Date(b.dt_txt).getHours() - 12))[0];
        if (!selected) throw new Error('Forecast unavailable');
        const data = { date: tomorrow, temp: Math.round(selected.main.temp), feels: Math.round(selected.main.feels_like), humidity: selected.main.humidity, wind: Math.round(selected.wind.speed), condition: selected.weather?.[0]?.description || 'Clear', icon: selected.weather?.[0]?.icon };
        sessionStorage.setItem(FORECAST_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
        setForecast(data);
      } catch { setUnavailable(true); }
    };
    load();
  }, []);

  return (
    <PanelShell label="Plan ahead" title="Tomorrow in Vadodara" description="A quick look at tomorrow’s weather before you continue watching." icon={CloudSun} color="sky" onContinue={onContinue}>
      {forecast ? <div className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.08] shadow-2xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8"><div className="flex items-center gap-4">{forecast.icon ? <img src={`https://openweathermap.org/img/wn/${forecast.icon}@2x.png`} alt="" className="h-20 w-20" /> : <CloudSun className="h-16 w-16 text-sky-200" />}<div><p className="text-5xl font-black">{forecast.temp}°</p><p className="mt-1 capitalize text-sky-200">{forecast.condition}</p></div></div><div className="text-right"><p className="flex items-center justify-end gap-2 text-sm text-white/60"><CalendarDays className="h-4 w-4" />{new Date(forecast.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p><p className="mt-2 text-sm">Feels like {forecast.feels}°C</p></div></div>
        <div className="grid grid-cols-2 border-t border-white/10 bg-black/15"><div className="flex items-center justify-center gap-3 border-r border-white/10 p-4"><Droplets className="h-5 w-5 text-sky-300" /><div><p className="font-black">{forecast.humidity}%</p><p className="text-xs text-white/50">Humidity</p></div></div><div className="flex items-center justify-center gap-3 p-4"><Wind className="h-5 w-5 text-sky-300" /><div><p className="font-black">{forecast.wind} m/s</p><p className="text-xs text-white/50">Wind</p></div></div></div>
      </div> : <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center"><CloudSun className="mx-auto h-10 w-10 text-white/30" /><p className="mt-3 text-sm text-white/60">{unavailable ? 'Tomorrow’s forecast is temporarily unavailable.' : 'Loading tomorrow’s forecast…'}</p></div>}
    </PanelShell>
  );
};
