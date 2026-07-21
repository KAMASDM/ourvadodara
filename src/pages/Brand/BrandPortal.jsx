import React, { useEffect, useMemo, useRef, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { updatePassword } from 'firebase/auth';
import {
  BarChart3, Camera, CheckCircle2, Clock3, LogIn, LogOut, Plus, QrCode,
  Save, ScanLine, Store, Tag, TicketCheck, XCircle, KeyRound
} from 'lucide-react';
import { db, firebaseAuth, functions, httpsCallable } from '../../firebase-config';
import { useAuth } from '../../context/Auth/AuthContext';

const DAYS = [
  { value: 0, label: 'Sun' }, { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' }, { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
];

const EMPTY_OFFER = {
  title: '', description: '', terms: '', discountType: 'percentage', discountValue: 10,
  minimumPurchase: 0, maximumDiscount: 0, startsAt: '', endsAt: '', totalCouponLimit: 0,
  perUserClaimLimit: 1, maxUsesPerCoupon: 1, couponValidityDays: 0, validDays: [],
  dailyStartTime: '', dailyEndTime: '', status: 'draft'
};

const toDateTimeInput = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const toOfferForm = offer => ({
  ...EMPTY_OFFER, ...offer,
  startsAt: toDateTimeInput(offer.startsAt),
  endsAt: toDateTimeInput(offer.endsAt),
  validDays: Array.isArray(offer.validDays) ? offer.validDays.map(Number) : []
});

const cleanFunctionError = error => String(error?.message || 'Something went wrong').replace(/^Firebase:\s*/i, '');

const BrandLogin = ({ brand, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async event => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try { await onLogin(email.trim(), password); }
    catch { setError('Invalid brand login ID or password.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-7 shadow-2xl">
        <div className="flex items-center gap-4">
          <img src={brand.logoUrl || '/logo.png'} alt={`${brand.name} logo`} className="h-16 w-16 rounded-2xl border object-contain" />
          <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Brand partner portal</p><h1 className="text-2xl font-bold text-slate-950">{brand.name}</h1></div>
        </div>
        <p className="mt-6 text-sm text-slate-500">Sign in with the credentials issued by Our Vadodara.</p>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="mt-5 block text-sm font-semibold text-slate-700">Login ID
          <input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border px-4 py-3" autoComplete="username" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">Password
          <input required type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border px-4 py-3" autoComplete="current-password" />
        </label>
        <button disabled={submitting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-50"><LogIn className="h-4 w-4" /> {submitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
};

const OfferEditor = ({ offer, onClose, onSaved }) => {
  const [form, setForm] = useState(() => offer ? toOfferForm(offer) : EMPTY_OFFER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const toggleDay = day => setForm(current => ({
    ...current,
    validDays: current.validDays.includes(day) ? current.validDays.filter(item => item !== day) : [...current.validDays, day]
  }));

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saveOffer = httpsCallable(functions, 'saveBrandOffer');
      await saveOffer({
        offerId: offer?.id || null,
        offer: {
          ...form,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null
        }
      });
      onSaved();
    } catch (saveError) {
      setError(cleanFunctionError(saveError));
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl border bg-white p-6 shadow-sm dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{offer ? 'Edit offer' : 'Create an offer'}</h2><p className="text-sm text-slate-500">Zero means unlimited wherever indicated.</p></div><button type="button" onClick={onClose} className="rounded-xl border px-3 py-2 text-sm">Cancel</button></div>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold md:col-span-2">Offer title<input required value={form.title} onChange={event => setField('title', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-slate-950" /></label>
        <label className="text-sm font-semibold md:col-span-2">Description<textarea required rows="3" value={form.description} onChange={event => setField('description', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-slate-950" /></label>
        <label className="text-sm font-semibold">Discount type<select value={form.discountType} onChange={event => setField('discountType', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-slate-950"><option value="percentage">Percentage off</option><option value="fixed">Fixed amount off</option><option value="bogo">Buy one, get one</option><option value="freebie">Free item/service</option><option value="custom">Custom benefit</option></select></label>
        <label className="text-sm font-semibold">Discount value {form.discountType === 'percentage' ? '(%)' : '(₹)'}<input type="number" min="0" max={form.discountType === 'percentage' ? '100' : undefined} step="0.01" value={form.discountValue} disabled={['bogo', 'freebie', 'custom'].includes(form.discountType)} onChange={event => setField('discountValue', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 disabled:bg-slate-100 dark:bg-slate-950" /></label>
        <label className="text-sm font-semibold">Minimum purchase (₹)<input type="number" min="0" value={form.minimumPurchase} onChange={event => setField('minimumPurchase', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-slate-950" /></label>
        <label className="text-sm font-semibold">Maximum discount (₹, 0 = none)<input type="number" min="0" value={form.maximumDiscount} onChange={event => setField('maximumDiscount', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-slate-950" /></label>
        <label className="text-sm font-semibold">Starts at<input type="datetime-local" value={form.startsAt} onChange={event => setField('startsAt', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-slate-950" /></label>
        <label className="text-sm font-semibold">Ends at<input type="datetime-local" value={form.endsAt} onChange={event => setField('endsAt', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-slate-950" /></label>
      </div>

      <fieldset className="rounded-2xl border p-4"><legend className="px-2 font-bold">Coupon limits</legend><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold">Total coupons<input type="number" min="0" value={form.totalCouponLimit} onChange={event => setField('totalCouponLimit', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /><span className="mt-1 block text-xs font-normal text-slate-500">0 = unlimited</span></label>
        <label className="text-sm font-semibold">Claims per user<input type="number" min="1" value={form.perUserClaimLimit} onChange={event => setField('perUserClaimLimit', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        <label className="text-sm font-semibold">Uses per coupon<input type="number" min="1" value={form.maxUsesPerCoupon} onChange={event => setField('maxUsesPerCoupon', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        <label className="text-sm font-semibold">Valid after claim (days)<input type="number" min="0" value={form.couponValidityDays} onChange={event => setField('couponValidityDays', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /><span className="mt-1 block text-xs font-normal text-slate-500">0 = until offer ends</span></label>
      </div></fieldset>

      <fieldset className="rounded-2xl border p-4"><legend className="px-2 font-bold">Redemption schedule</legend>
        <p className="mb-3 text-xs text-slate-500">Leave all days unselected to allow every day.</p>
        <div className="flex flex-wrap gap-2">{DAYS.map(day => <button key={day.value} type="button" onClick={() => toggleDay(day.value)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${form.validDays.includes(day.value) ? 'bg-emerald-600 text-white' : 'border bg-white'}`}>{day.label}</button>)}</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Daily start time<input type="time" value={form.dailyStartTime} onChange={event => setField('dailyStartTime', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /></label><label className="text-sm font-semibold">Daily end time<input type="time" value={form.dailyEndTime} onChange={event => setField('dailyEndTime', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /></label></div>
      </fieldset>

      <label className="block text-sm font-semibold">Terms and conditions<textarea rows="4" value={form.terms} onChange={event => setField('terms', event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-slate-950" /></label>
      <div className="flex flex-wrap items-end justify-between gap-4"><label className="text-sm font-semibold">Status<select value={form.status} onChange={event => setField('status', event.target.value)} className="ml-3 rounded-xl border px-3 py-2"><option value="draft">Draft</option><option value="published">Published</option><option value="paused">Paused</option></select></label><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save offer'}</button></div>
    </form>
  );
};

const CouponScanner = () => {
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const lastCodeRef = useRef('');
  const processingRef = useRef(false);

  const stopScanner = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => stopScanner, []);

  const redeem = async rawCode => {
    if (!rawCode || processingRef.current || rawCode === lastCodeRef.current) return;
    lastCodeRef.current = rawCode;
    processingRef.current = true;
    setProcessing(true);
    setError('');
    setResult(null);
    try {
      const redeemCoupon = httpsCallable(functions, 'redeemOfferCoupon');
      const response = await redeemCoupon({ code: rawCode });
      setResult(response.data);
      setCode('');
    } catch (redeemError) {
      setError(cleanFunctionError(redeemError));
    } finally {
      setProcessing(false);
      processingRef.current = false;
      window.setTimeout(() => { lastCodeRef.current = ''; }, 2500);
    }
  };

  const startScanner = async () => {
    setError('');
    if (!('BarcodeDetector' in window)) {
      setError('Automatic QR scanning is not supported by this browser. Enter the code manually below.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const scanFrame = async () => {
        const video = videoRef.current;
        if (!video || !streamRef.current) return;
        if (video.readyState >= 2) {
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          const codes = await detector.detect(canvas).catch(() => []);
          if (codes[0]?.rawValue) await redeem(codes[0].rawValue);
        }
        frameRef.current = requestAnimationFrame(scanFrame);
      };
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setError('Camera access was unavailable. Check permission or enter the coupon code manually.');
      stopScanner();
    }
  };

  const discountLabel = data => data.discountType === 'percentage' ? `${data.discountValue}% off` : data.discountType === 'fixed' ? `₹${data.discountValue} off` : data.discountType === 'bogo' ? 'Buy one, get one' : data.discountType === 'freebie' ? 'Free item/service' : 'Custom benefit';

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <section className="rounded-3xl border bg-white p-5 shadow-sm dark:bg-slate-900">
        <div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-xl font-bold"><ScanLine className="h-5 w-5 text-emerald-600" /> Coupon scanner</h2><p className="text-sm text-slate-500">No customer name, email, or phone is exposed.</p></div>{scanning ? <button onClick={stopScanner} className="rounded-xl bg-red-600 px-4 py-2 text-white">Stop camera</button> : <button onClick={startScanner} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-white"><Camera className="h-4 w-4" /> Start camera</button>}</div>
        <div className="relative mt-5 aspect-video overflow-hidden rounded-2xl bg-slate-950"><video ref={videoRef} muted playsInline className="h-full w-full object-cover" />{!scanning && <div className="absolute inset-0 grid place-items-center text-center text-white/60"><div><QrCode className="mx-auto h-12 w-12" /><p className="mt-2 text-sm">Camera preview</p></div></div>}<div className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-emerald-400" /></div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="mt-4 flex gap-2"><input value={code} onChange={event => setCode(event.target.value)} onKeyDown={event => event.key === 'Enter' && redeem(code)} placeholder="Paste QR value or enter OV- code" className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 font-mono" /><button disabled={!code.trim() || processing} onClick={() => redeem(code)} className="rounded-xl bg-emerald-600 px-5 font-bold text-white disabled:opacity-50">{processing ? 'Checking…' : 'Redeem'}</button></div>
      </section>
      <aside className="rounded-3xl border bg-white p-5 shadow-sm dark:bg-slate-900">
        <h3 className="font-bold">Last scan</h3>
        {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-red-800"><XCircle className="h-8 w-8" /><p className="mt-2 font-bold">Not redeemed</p><p className="mt-1 text-sm">{error}</p></div>}
        {result && <div className="mt-4 rounded-2xl bg-emerald-50 p-5 text-emerald-900"><CheckCircle2 className="h-9 w-9" /><p className="mt-3 text-lg font-bold">Coupon redeemed</p><p className="mt-1 font-semibold">{result.offerTitle}</p><p className="mt-3 text-3xl font-black">{discountLabel(result)}</p>{result.minimumPurchase > 0 && <p className="mt-2 text-sm">Minimum purchase ₹{result.minimumPurchase}</p>}<p className="mt-3 text-xs">Use {result.useCount} of {result.maxUses}</p></div>}
        {!error && !result && <div className="mt-8 text-center text-slate-400"><TicketCheck className="mx-auto h-12 w-12" /><p className="mt-2 text-sm">Scan a customer coupon to validate it.</p></div>}
      </aside>
    </div>
  );
};

const BrandSecurity = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async event => {
    event.preventDefault();
    if (password.length < 8 || password !== confirmPassword) {
      setMessage('Passwords must match and contain at least 8 characters.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await updatePassword(firebaseAuth.currentUser, password);
      setPassword('');
      setConfirmPassword('');
      setMessage('Password updated successfully.');
    } catch {
      setMessage('For security, sign out and sign in again before changing the password.');
    } finally { setSaving(false); }
  };

  return <form onSubmit={submit} className="mx-auto max-w-xl rounded-3xl border bg-white p-6 shadow-sm dark:bg-slate-900"><KeyRound className="h-8 w-8 text-emerald-600" /><h1 className="mt-3 text-2xl font-black">Change password</h1><p className="mt-1 text-sm text-slate-500">Replace the temporary password issued by Our Vadodara.</p>{message && <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">{message}</p>}<label className="mt-5 block text-sm font-semibold">New password<input required minLength="8" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-slate-950" /></label><label className="mt-4 block text-sm font-semibold">Confirm password<input required minLength="8" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-slate-950" /></label><button disabled={saving} className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 font-bold text-white disabled:opacity-50 dark:bg-emerald-600">{saving ? 'Updating…' : 'Update password'}</button></form>;
};

const BrandPortal = ({ slug }) => {
  const { user, loading, signIn, logout } = useAuth();
  const [brand, setBrand] = useState(null);
  const [brandLoading, setBrandLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [editingOffer, setEditingOffer] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => onValue(ref(db, `brandSlugs/${slug}`), async snapshot => {
    const slugData = snapshot.val();
    if (!slugData?.brandId) { setBrand(null); setBrandLoading(false); return; }
    return onValue(ref(db, `brandsPublic/${slugData.brandId}`), brandSnapshot => {
      setBrand(brandSnapshot.exists() ? { id: slugData.brandId, ...brandSnapshot.val() } : null);
      setBrandLoading(false);
    }, { onlyOnce: true });
  }), [slug]);

  useEffect(() => {
    if (!brand?.id || user?.brandId !== brand.id) return undefined;
    const unsubscribeOffers = onValue(ref(db, 'offers'), snapshot => {
      setOffers(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })).filter(offer => offer.brandId === brand.id).sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0)));
    });
    const unsubscribeRedemptions = onValue(ref(db, `brandRedemptionFeed/${brand.id}`), snapshot => {
      setRedemptions(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })).sort((a, b) => Number(b.redeemedAt || 0) - Number(a.redeemedAt || 0)));
    });
    return () => { unsubscribeOffers(); unsubscribeRedemptions(); };
  }, [brand?.id, user?.brandId]);

  const stats = useMemo(() => {
    const issued = offers.reduce((sum, offer) => sum + Number(offer.issuedCount || 0), 0);
    const redeemed = offers.reduce((sum, offer) => sum + Number(offer.redeemedCount || 0), 0);
    return { issued, redeemed, conversion: issued ? Math.round(redeemed / issued * 100) : 0, active: offers.filter(offer => offer.status === 'published').length };
  }, [offers]);

  if (loading || brandLoading) return <div className="grid min-h-screen place-items-center bg-slate-950 text-white">Loading brand portal…</div>;
  if (!brand) return <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-center text-white"><div><Store className="mx-auto h-12 w-12 text-white/40" /><h1 className="mt-4 text-2xl font-bold">Brand portal not found</h1><a href="/offers" className="mt-5 inline-block underline">Browse offers</a></div></div>;
  if (!user) return <BrandLogin brand={brand} onLogin={signIn} />;
  if (user.role !== 'brand' || user.brandId !== brand.id) return <div className="grid min-h-screen place-items-center bg-slate-950 px-4"><div className="max-w-md rounded-3xl bg-white p-7 text-center"><XCircle className="mx-auto h-12 w-12 text-red-500" /><h1 className="mt-3 text-xl font-bold">Wrong account for this portal</h1><p className="mt-2 text-sm text-slate-500">Sign out and use the credentials issued for {brand.name}.</p><button onClick={logout} className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 font-bold text-white">Sign out</button></div></div>;

  const tabs = [{ id: 'dashboard', label: 'Dashboard', icon: BarChart3 }, { id: 'offers', label: 'Offers', icon: Tag }, { id: 'scanner', label: 'Scan coupon', icon: ScanLine }, { id: 'security', label: 'Password', icon: KeyRound }];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b bg-white px-4 py-3 dark:bg-slate-900"><div className="mx-auto flex max-w-7xl items-center gap-3"><img src={brand.logoUrl || '/logo.png'} alt="" className="h-11 w-11 rounded-xl border object-contain" /><div className="min-w-0 flex-1"><p className="truncate font-bold">{brand.name}</p><p className="text-xs text-slate-500">Our Vadodara partner portal</p></div><button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><LogOut className="h-4 w-4" /> Sign out</button></div></header>
      <nav className="border-b bg-white dark:bg-slate-900"><div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">{tabs.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => { setTab(item.id); setShowEditor(false); }} className={`inline-flex min-w-fit items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${tab === item.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'}`}><Icon className="h-4 w-4" /> {item.label}</button>; })}</div></nav>

      <main className="mx-auto max-w-7xl p-4 py-6 lg:p-8">
        {tab === 'dashboard' && <div className="space-y-6"><div><h1 className="text-3xl font-black">Performance overview</h1><p className="mt-1 text-slate-500">Aggregated coupon activity only—customer identity is never shown.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Active offers', stats.active], ['Coupons claimed', stats.issued], ['Redemptions', stats.redeemed], ['Redemption rate', `${stats.conversion}%`]].map(([label, value]) => <div key={label} className="rounded-3xl border bg-white p-5 shadow-sm dark:bg-slate-900"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div><section className="rounded-3xl border bg-white p-5 dark:bg-slate-900"><h2 className="font-bold">Recent anonymous redemptions</h2><div className="mt-4 divide-y">{redemptions.slice(0, 10).map(item => <div key={item.id} className="flex items-center gap-3 py-3"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.offerTitle}</p><p className="text-xs text-slate-500">Coupon •••• {item.couponCodeSuffix}</p></div><time className="text-xs text-slate-500">{new Date(item.redeemedAt).toLocaleString('en-IN')}</time></div>)}{!redemptions.length && <p className="py-8 text-center text-sm text-slate-500">No coupons redeemed yet.</p>}</div></section></div>}

        {tab === 'offers' && (showEditor ? <OfferEditor offer={editingOffer} onClose={() => setShowEditor(false)} onSaved={() => { setShowEditor(false); setEditingOffer(null); }} /> : <div className="space-y-5"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-black">Offers</h1><p className="text-slate-500">Configure validity, limits, schedules, and discount rules.</p></div><button onClick={() => { setEditingOffer(null); setShowEditor(true); }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white"><Plus className="h-4 w-4" /> New offer</button></div><div className="grid gap-4 lg:grid-cols-2">{offers.map(offer => <article key={offer.id} className="rounded-3xl border bg-white p-5 shadow-sm dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${offer.status === 'published' ? 'bg-emerald-100 text-emerald-700' : offer.status === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{offer.status}</span><h2 className="mt-3 text-xl font-bold">{offer.title}</h2></div><button onClick={() => { setEditingOffer(offer); setShowEditor(true); }} className="rounded-xl border px-3 py-2 text-sm font-semibold">Edit</button></div><p className="mt-2 line-clamp-2 text-sm text-slate-500">{offer.description}</p><div className="mt-5 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xl font-bold">{offer.issuedCount || 0}</p><p className="text-xs text-slate-500">Claimed</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xl font-bold">{offer.redeemedCount || 0}</p><p className="text-xs text-slate-500">Redeemed</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xl font-bold">{offer.totalCouponLimit > 0 ? offer.totalCouponLimit : '∞'}</p><p className="text-xs text-slate-500">Limit</p></div></div></article>)}{!offers.length && <div className="rounded-3xl border border-dashed bg-white p-12 text-center lg:col-span-2"><Tag className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold">Create your first offer</p></div>}</div></div>)}
        {tab === 'scanner' && <CouponScanner />}
        {tab === 'security' && <BrandSecurity />}
      </main>
    </div>
  );
};

export default BrandPortal;
