import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, CheckCircle2, Clock3, Gift, MapPin, QrCode as QrCodeIcon,
  Search, ShieldCheck, Sparkles, Store, Tag, TicketCheck, X
} from 'lucide-react';
import { onValue, ref } from 'firebase/database';
import QRCode from 'qrcode';
import { db, functions, httpsCallable } from '../../firebase-config';
import { useAuth } from '../../context/Auth/AuthContext';

const DEFAULT_CATEGORIES = ['Food & Dining', 'Fashion', 'Beauty & Wellness', 'Entertainment', 'Shopping', 'Travel', 'Health', 'Education', 'Automotive', 'Home Services', 'Technology'];

const positiveLimit = value => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const isSoldOut = offer => {
  const limit = positiveLimit(offer.totalCouponLimit ?? offer.redemptionLimit);
  return limit !== null && Number(offer.issuedCount ?? offer.redeemedCount ?? 0) >= limit;
};

const isPubliclyAvailable = offer => {
  const now = Date.now();
  const approvalReady = !offer.workflowStatus || offer.workflowStatus === 'published';
  return offer.active !== false && offer.brandActive !== false && approvalReady && (!offer.status || offer.status === 'published')
    && (!offer.startsAt || Date.parse(offer.startsAt) <= now)
    && (!offer.endsAt || Date.parse(offer.endsAt) >= now);
};

const discountLabel = offer => {
  const type = offer.discountType || offer.offerType;
  const value = offer.discountValue ?? offer.offerValue;
  if (type === 'fixed') return `₹${value} OFF`;
  if (type === 'bogo') return 'BUY 1 GET 1';
  if (type === 'freebie') return 'FREE BENEFIT';
  if (type === 'custom') return 'SPECIAL OFFER';
  return `${value}% OFF`;
};

const formatDate = value => value
  ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'No expiry';

const CouponQRCode = ({ coupon, size = 208 }) => {
  const [image, setImage] = useState('');

  useEffect(() => {
    const payload = JSON.stringify({ type: 'ov-coupon', couponId: coupon.id, code: coupon.code });
    QRCode.toDataURL(payload, {
      width: size * 2,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#0f172a', light: '#ffffff' }
    }).then(setImage).catch(() => setImage(''));
  }, [coupon.code, coupon.id, size]);

  return image
    ? <img src={image} alt={`Scannable QR code for ${coupon.offerTitle || coupon.brandName}`} style={{ width: size, height: size }} className="mx-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200" />
    : <div style={{ width: size, height: size }} className="mx-auto grid place-items-center rounded-2xl bg-white ring-1 ring-slate-200"><QrCodeIcon className="h-10 w-10 text-slate-300" /></div>;
};

const CouponPass = ({ coupon, onClose }) => {
  const remainingUses = Math.max(0, Number(coupon.maxUses || 1) - Number(coupon.useCount || 0));
  const inactive = coupon.status === 'redeemed' || coupon.status === 'cancelled' || remainingUses === 0;

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 px-5 pb-16 pt-5 text-white sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow-sm">
              {coupon.brandLogoUrl ? <img src={coupon.brandLogoUrl} alt="" className="h-full w-full object-contain" /> : <Store className="h-6 w-6 text-emerald-700" />}
            </div>
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-emerald-100">{coupon.brandName}</p><h2 className="line-clamp-2 text-xl font-black leading-tight">{coupon.offerTitle || 'Brand coupon'}</h2></div>
          </div>
          {onClose && <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 transition hover:bg-white/25" aria-label="Close coupon"><X className="h-5 w-5" /></button>}
        </div>
      </div>

      <div className="relative -mt-10 px-5 pb-6 sm:px-7 sm:pb-7">
        <div className="rounded-[1.6rem] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700 sm:p-5">
          <div className={inactive ? 'opacity-40 grayscale' : ''}><CouponQRCode coupon={coupon} /></div>
          <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Scan at the brand counter</p>
          <p className="mt-1 break-all text-center font-mono text-lg font-black tracking-wider text-slate-900 dark:text-white">{coupon.code}</p>
        </div>

        <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 border-t border-dashed border-slate-300 dark:border-slate-700" /><TicketCheck className="h-4 w-4 text-emerald-600" /><span className="h-px flex-1 border-t border-dashed border-slate-300 dark:border-slate-700" /></div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">Valid until</p><p className="mt-1 font-bold">{formatDate(coupon.expiresAt)}</p></div>
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">Uses remaining</p><p className="mt-1 font-bold">{remainingUses} of {coupon.maxUses || 1}</p></div>
        </div>
        <div className={`mt-4 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold ${inactive ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
          {inactive ? <TicketCheck className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {inactive ? 'This coupon is no longer active' : 'Verified Our Vadodara coupon'}
        </div>
      </div>
    </article>
  );
};

const CouponModal = ({ coupon, onClose }) => coupon ? (
  <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/70 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Coupon QR code" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-[2rem]"><CouponPass coupon={coupon} onClose={onClose} /></div>
  </div>
) : null;

const MyCoupons = ({ coupons }) => {
  const [selected, setSelected] = useState(null);
  return (
    <main className="min-h-screen bg-slate-50 px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 dark:bg-slate-950 sm:px-6 lg:pb-10">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-emerald-950 px-5 py-7 text-white sm:px-8"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300"><TicketCheck className="h-4 w-4" /> Coupon wallet</p><h1 className="mt-2 text-3xl font-black">My Coupons</h1><p className="mt-2 max-w-xl text-sm text-slate-300">Open a coupon and let the brand scan its QR code at checkout.</p></div>
        {!coupons.length ? <div className="mt-5 rounded-[2rem] border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900"><Gift className="mx-auto h-11 w-11 text-slate-300" /><p className="mt-3 font-semibold text-slate-600 dark:text-slate-300">No coupons in your wallet yet</p></div> : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">{coupons.map(coupon => (
            <button key={coupon.id} type="button" onClick={() => setSelected(coupon)} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-4 p-5">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-200 dark:bg-white">{coupon.brandLogoUrl ? <img src={coupon.brandLogoUrl} alt="" className="h-full w-full object-contain" /> : <Store className="h-6 w-6 text-emerald-600" />}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold uppercase tracking-wide text-emerald-600">{coupon.brandName}</p><h2 className="mt-1 line-clamp-2 font-bold leading-snug">{coupon.offerTitle}</h2><p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(coupon.expiresAt)}</p></div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-white group-hover:bg-emerald-600"><QrCodeIcon className="h-5 w-5" /></div>
              </div>
              <div className="border-t border-dashed border-slate-200 bg-slate-50 px-5 py-3 text-center text-sm font-bold text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300">Tap to show QR code</div>
            </button>
          ))}</div>
        )}
      </section>
      <CouponModal coupon={selected} onClose={() => setSelected(null)} />
    </main>
  );
};

const OfferCard = ({ offer, coupon, claiming, onAction }) => {
  const soldOut = isSoldOut(offer);
  const logo = offer.brandLogoUrl || offer.logoUrl;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10 dark:border-slate-800 dark:bg-slate-900">
      <div className="relative bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-5 pb-5 pt-5 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">{logo ? <img src={logo} alt="" className="h-full w-full object-contain" /> : <Store className="h-6 w-6 text-emerald-600" />}</div><div className="min-w-0"><p className="truncate font-bold text-slate-900 dark:text-white">{offer.brandName || offer.name}</p><p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><Tag className="h-3 w-3" /> {offer.category || 'Local offer'}</p></div></div>
          {offer.featured && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700"><Sparkles className="h-3 w-3" /> Featured</span>}
        </div>
        <div className="mt-5 inline-flex rounded-xl bg-slate-950 px-3 py-2 text-2xl font-black tracking-tight text-white shadow-sm dark:bg-emerald-600">{discountLabel(offer)}</div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h2 className="text-xl font-black leading-snug text-slate-900 dark:text-white">{offer.title || offer.name}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{offer.description || 'Enjoy this exclusive local offer.'}</p>
        <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
          {Number(offer.minimumPurchase) > 0 && <p className="flex items-center gap-2"><Gift className="h-4 w-4 text-emerald-600" /> Minimum purchase ₹{Number(offer.minimumPurchase).toLocaleString('en-IN')}</p>}
          {offer.endsAt && <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-600" /> Valid until {formatDate(offer.endsAt)}</p>}
          {(offer.dailyStartTime || offer.dailyEndTime) && <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-600" /> Redeem {offer.dailyStartTime || '00:00'}–{offer.dailyEndTime || '23:59'}</p>}
          {offer.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" /> <span className="line-clamp-1">{offer.address}</span></p>}
        </div>
        <p className="mt-4 line-clamp-2 flex-1 border-t border-dashed border-slate-200 pt-3 text-[11px] leading-5 text-slate-400 dark:border-slate-700">{offer.terms || 'Terms and conditions apply.'}</p>
        <button type="button" onClick={() => onAction(offer, coupon)} disabled={!coupon && (claiming || soldOut)} className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 ${coupon ? 'bg-slate-950 text-white hover:bg-emerald-700 dark:bg-emerald-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
          {coupon ? <><QrCodeIcon className="h-4 w-4" /> View QR coupon</> : claiming ? 'Creating coupon…' : soldOut ? 'Sold out' : <><TicketCheck className="h-4 w-4" /> Claim coupon</>}
        </button>
      </div>
    </article>
  );
};

const CouponMarketplace = ({ profileOnly = false }) => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [legacyOffers, setLegacyOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [savedCategories, setSavedCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [message, setMessage] = useState('');
  const [claiming, setClaiming] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  useEffect(() => {
    const unsubscribers = [];
    if (user?.uid) unsubscribers.push(onValue(ref(db, `userCoupons/${user.uid}`), snapshot => {
      setCoupons(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })).sort((a, b) => Number(b.issuedAt || 0) - Number(a.issuedAt || 0)));
    }));
    if (!profileOnly) {
      unsubscribers.push(onValue(ref(db, 'offers'), snapshot => {
        setOffers(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value, source: 'offers' })));
      }));
      unsubscribers.push(onValue(ref(db, 'couponBrands'), snapshot => {
        setLegacyOffers(Object.entries(snapshot.val() || {}).map(([id, value]) => ({
          id, ...value, source: 'legacy', title: value.name,
          discountType: value.offerType, discountValue: value.offerValue, brandName: value.name
        })));
      }));
      unsubscribers.push(onValue(ref(db, 'couponCategories'), snapshot => {
        setSavedCategories(Object.values(snapshot.val() || {}).map(item => item.name).filter(Boolean));
      }));
    }
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [profileOnly, user?.uid]);

  const categories = useMemo(() => [...new Set([...DEFAULT_CATEGORIES, ...savedCategories, ...offers.map(offer => offer.category).filter(Boolean), ...legacyOffers.map(offer => offer.category).filter(Boolean)])].sort((a, b) => a.localeCompare(b)), [savedCategories, offers, legacyOffers]);
  const visible = useMemo(() => [...offers, ...legacyOffers].filter(isPubliclyAvailable).filter(offer => category === 'all' || offer.category === category).filter(offer => `${offer.title} ${offer.brandName} ${offer.description} ${offer.category}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => Number(b.featured || 0) - Number(a.featured || 0) || Number(b.createdAt || 0) - Number(a.createdAt || 0)), [offers, legacyOffers, category, query]);
  const couponsByOffer = useMemo(() => coupons.reduce((result, coupon) => ({ ...result, [coupon.offerId || coupon.brandId]: coupon }), {}), [coupons]);

  const claim = async (offer, existingCoupon) => {
    if (existingCoupon) { setSelectedCoupon(existingCoupon); return; }
    if (!user?.uid || user.isAnonymous) { window.dispatchEvent(new CustomEvent('showGuestPrompt')); return; }
    setClaiming(offer.id);
    setMessage('');
    try {
      const callable = httpsCallable(functions, offer.source === 'legacy' ? 'redeemBrandCoupon' : 'claimBrandOffer');
      const result = await callable(offer.source === 'legacy' ? { brandId: offer.id } : { offerId: offer.id });
      const coupon = {
        id: result.data.couponId || result.data.redemptionId,
        offerId: offer.id,
        code: result.data.code,
        expiresAt: result.data.expiresAt,
        status: 'issued', useCount: 0, maxUses: offer.maxUsesPerCoupon || 1,
        brandName: offer.brandName || offer.name,
        brandLogoUrl: offer.brandLogoUrl || offer.logoUrl || '',
        offerTitle: offer.title || offer.name
      };
      setSelectedCoupon(coupon);
      setMessage('Coupon added to your wallet. Show its QR code at checkout.');
    } catch (error) {
      setMessage(String(error?.message || 'Unable to claim this offer').replace(/^Firebase:\s*/i, ''));
    } finally { setClaiming(''); }
  };

  if (profileOnly) return <MyCoupons coupons={coupons} />;

  return (
    <main className="min-h-screen bg-slate-50 px-3 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-4 dark:bg-slate-950 sm:px-5 sm:pt-6 lg:pb-12">
      <div className="mx-auto max-w-7xl">
        <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-950 px-5 py-8 text-white shadow-xl shadow-emerald-950/15 sm:px-8 sm:py-10">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" /><div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-emerald-300/15 blur-2xl" />
          <div className="relative"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-200"><Sparkles className="h-4 w-4" /> Our Vadodara Offers</p><h1 className="mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">Great local deals.<br />One scan away.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100 sm:text-base">Claim an offer, receive a secure QR coupon, and let the brand scan it when you purchase.</p></div>
        </header>

        <section className="relative z-10 -mt-3 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:mx-5 sm:p-4">
          <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search offers or brands" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950" /></div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">{['all', ...categories].map(item => <button type="button" key={item} onClick={() => setCategory(item)} className={`min-w-fit rounded-full px-4 py-2 text-xs font-bold transition ${category === item ? 'bg-slate-950 text-white shadow-sm dark:bg-emerald-600' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300'}`}>{item === 'all' ? 'All offers' : item}</button>)}</div>
        </section>

        {message && <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {message}</div>}
        <div className="mt-6 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Discover savings</p><h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{category === 'all' ? 'Offers near you' : category}</h2></div><p className="text-sm font-semibold text-slate-400">{visible.length} {visible.length === 1 ? 'offer' : 'offers'}</p></div>

        <div className="mt-4 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map(offer => <OfferCard key={`${offer.source}-${offer.id}`} offer={offer} coupon={couponsByOffer[offer.id]} claiming={claiming === offer.id} onAction={claim} />)}</div>
        {!visible.length && <div className="mt-5 rounded-[2rem] border border-dashed border-slate-300 bg-white py-20 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900"><Gift className="mx-auto h-12 w-12 text-slate-300" /><p className="mt-3 font-semibold">No active offers in this category.</p></div>}
      </div>
      <CouponModal coupon={selectedCoupon} onClose={() => setSelectedCoupon(null)} />
    </main>
  );
};

export default CouponMarketplace;
