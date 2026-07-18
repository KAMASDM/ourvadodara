import React, { useEffect, useState } from 'react';
import { Gift, Search, TicketCheck } from 'lucide-react';
import { onValue, ref } from 'firebase/database';
import { db, functions, httpsCallable } from '../../firebase-config';
import { useAuth } from '../../context/Auth/AuthContext';

const CouponMarketplace = ({ profileOnly = false }) => {
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [claiming, setClaiming] = useState('');

  useEffect(() => {
    if (profileOnly && !user?.uid) return undefined;
    const path = profileOnly ? `userCoupons/${user.uid}` : 'couponBrands';
    return onValue(ref(db, path), snapshot => {
      const items = Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value }));
      if (profileOnly) setCoupons(items.sort((a, b) => Number(b.issuedAt || 0) - Number(a.issuedAt || 0)));
      else setBrands(items.filter(item => item.active !== false && (!item.endsAt || new Date(item.endsAt) >= new Date())));
    });
  }, [profileOnly, user?.uid]);

  const claim = async (brandId) => {
    if (!user?.uid || user.isAnonymous) {
      window.dispatchEvent(new CustomEvent('showGuestPrompt'));
      return;
    }
    setClaiming(brandId);
    setMessage('');
    try {
      const redeem = httpsCallable(functions, 'redeemBrandCoupon');
      const result = await redeem({ brandId });
      setMessage(`Coupon claimed: ${result.data.code}`);
    } catch (error) {
      setMessage(error?.message?.replace('Firebase: ', '') || 'Unable to claim this offer');
    } finally { setClaiming(''); }
  };

  if (profileOnly) {
    return (
      <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><TicketCheck className="h-5 w-5 text-emerald-600" /> My Coupons</h2>
        {!coupons.length ? <p className="text-sm text-gray-500">You have not claimed any brand offers yet.</p> : <div className="grid gap-3 sm:grid-cols-2">{coupons.map(coupon => <div key={coupon.id} className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-4 dark:bg-emerald-950/20"><p className="font-semibold">{coupon.brandName}</p><p className="mt-2 font-mono text-lg tracking-wider">{coupon.code}</p><p className="mt-1 text-xs capitalize text-gray-500">{coupon.status} {coupon.expiresAt ? `• expires ${new Date(coupon.expiresAt).toLocaleDateString('en-IN')}` : ''}</p></div>)}</div>}
      </section>
    );
  }

  const visible = brands.filter(brand => `${brand.name} ${brand.description} ${brand.category}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <div className="mb-6"><h1 className="flex items-center gap-3 text-3xl font-bold"><Gift className="h-8 w-8 text-emerald-600" /> Brand Offers</h1><p className="mt-2 text-gray-500">Exclusive local offers for Our Vadodara readers. One claim per brand.</p></div>
      <div className="relative mb-6"><Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search brands and offers" className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 dark:border-gray-700 dark:bg-gray-900" /></div>
      {message && <p className="mb-5 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</p>}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{visible.map(brand => <article key={brand.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">{brand.logoUrl && <img src={brand.logoUrl} alt={`${brand.name} logo`} className="h-32 w-full object-contain bg-gray-50 p-5" />}<div className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{brand.category || 'Local brand'}</p><h2 className="mt-1 text-xl font-bold">{brand.name}</h2><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{brand.description}</p><p className="mt-4 text-2xl font-bold text-emerald-700">{brand.offerType === 'fixed' ? `₹${brand.offerValue} off` : `${brand.offerValue}% off`}</p><p className="mt-2 text-xs text-gray-500">{brand.terms || 'Terms apply.'}</p><button type="button" onClick={() => claim(brand.id)} disabled={claiming === brand.id || (Number(brand.redemptionLimit) > 0 && Number(brand.redeemedCount || 0) >= Number(brand.redemptionLimit))} className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{claiming === brand.id ? 'Claiming…' : 'Claim offer'}</button></div></article>)}</div>
      {!visible.length && <p className="py-16 text-center text-gray-500">No active offers found.</p>}
    </main>
  );
};

export default CouponMarketplace;
