import React, { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { onValue, push, ref, remove, set, update } from 'firebase/database';
import { db, functions, httpsCallable } from '../../firebase-config';
import { useAuth } from '../../context/Auth/AuthContext';

const EMPTY = { name: '', category: '', logoUrl: '', description: '', offerType: 'percentage', offerValue: 10, terms: '', startsAt: '', endsAt: '', redemptionLimit: 0, active: true };

const CouponManagement = () => {
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => onValue(ref(db, 'couponBrands'), snapshot => setBrands(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })))), []);
  useEffect(() => onValue(ref(db, 'couponRedemptions'), snapshot => setRedemptions(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })))), []);
  const stats = useMemo(() => ({ issued: redemptions.length, used: redemptions.filter(item => item.status === 'redeemed').length, active: brands.filter(item => item.active !== false).length }), [brands, redemptions]);

  const saveBrand = async event => {
    event.preventDefault();
    const data = { ...form, offerValue: Number(form.offerValue), redemptionLimit: Number(form.redemptionLimit), updatedAt: Date.now(), updatedBy: user?.uid || '' };
    if (editingId) await update(ref(db, `couponBrands/${editingId}`), data);
    else await set(push(ref(db, 'couponBrands')), { ...data, redeemedCount: 0, createdAt: Date.now() });
    setForm(EMPTY); setEditingId(''); setShowForm(false);
  };

  const verify = async consume => {
    setError(''); setVerification(null);
    try { const call = httpsCallable(functions, 'verifyBrandCoupon'); const result = await call({ code, consume }); setVerification(result.data); }
    catch (verifyError) { setError(verifyError?.message || 'Unable to verify coupon'); }
  };

  const exportCsv = () => {
    const esc = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [['Code', 'Brand', 'Customer', 'Status', 'Issued', 'Redeemed'], ...redemptions.map(item => [item.code, item.brandName, item.userEmail, item.status, item.issuedAt, item.redeemedAt])].map(row => row.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'coupon-redemptions.csv'; link.click(); URL.revokeObjectURL(url);
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Coupons & Brand Discounts</h1><p className="text-gray-500">Manage offers, verify customer codes, and review redemptions.</p></div><div className="flex gap-2"><button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2"><Download className="h-4 w-4" /> Export CSV</button><button onClick={() => { setForm(EMPTY); setEditingId(''); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white"><Plus className="h-4 w-4" /> Add brand</button></div></div>
    <div className="grid gap-4 sm:grid-cols-3">{[['Active brands', stats.active], ['Coupons issued', stats.issued], ['Redeemed', stats.used]].map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</div>
    <section className="rounded-xl border bg-white p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Coupon verification portal</h2><div className="flex flex-wrap gap-2"><div className="relative min-w-64 flex-1"><Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" /><input value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="OV-XXXXXXXXXX" className="w-full rounded-lg border py-2 pl-10 pr-3 font-mono" /></div><button onClick={() => verify(false)} disabled={!code} className="rounded-lg border px-4 py-2">Verify</button><button onClick={() => verify(true)} disabled={!code} className="rounded-lg bg-emerald-600 px-4 py-2 text-white">Verify & redeem</button></div>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}{verification && <p className={`mt-3 rounded-lg p-3 text-sm ${verification.valid ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{verification.valid ? 'Valid' : 'Not valid'} — {verification.brandName} — {verification.code} — {verification.status}</p>}</section>
    {showForm && <form onSubmit={saveBrand} className="grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-2"><h2 className="md:col-span-2 text-lg font-semibold">{editingId ? 'Edit' : 'Add'} brand offer</h2>{[['name', 'Brand name'], ['category', 'Category'], ['logoUrl', 'Logo URL'], ['description', 'Offer description'], ['offerValue', 'Offer value'], ['redemptionLimit', 'Redemption limit (0 = unlimited)'], ['startsAt', 'Starts at'], ['endsAt', 'Ends at'], ['terms', 'Terms']].map(([field, label]) => <label key={field} className={field === 'description' || field === 'terms' ? 'md:col-span-2' : ''}><span className="mb-1 block text-sm font-medium">{label}</span><input required={field === 'name' || field === 'description'} type={field.includes('At') ? 'datetime-local' : ['offerValue', 'redemptionLimit'].includes(field) ? 'number' : 'text'} value={form[field]} onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))} className="w-full rounded-lg border px-3 py-2" /></label>)}<label><span className="mb-1 block text-sm font-medium">Offer type</span><select value={form.offerType} onChange={event => setForm(current => ({ ...current, offerType: event.target.value }))} className="w-full rounded-lg border px-3 py-2"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label><label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={event => setForm(current => ({ ...current, active: event.target.checked }))} /> Active</label><div className="flex justify-end gap-2 md:col-span-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2">Cancel</button><button className="rounded-lg bg-blue-600 px-4 py-2 text-white">Save offer</button></div></form>}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{brands.map(brand => <article key={brand.id} className="rounded-xl border bg-white p-5"><div className="flex justify-between"><div><h3 className="font-bold">{brand.name}</h3><p className="text-sm text-gray-500">{brand.category}</p></div><span className={`h-fit rounded-full px-2 py-1 text-xs ${brand.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{brand.active !== false ? 'Active' : 'Inactive'}</span></div><p className="mt-3 text-sm">{brand.description}</p><p className="mt-3 font-semibold text-emerald-700">{brand.offerType === 'fixed' ? `₹${brand.offerValue}` : `${brand.offerValue}%`} off · {brand.redeemedCount || 0}/{brand.redemptionLimit || '∞'} claimed</p><div className="mt-4 flex gap-2"><button onClick={() => { setForm({ ...EMPTY, ...brand }); setEditingId(brand.id); setShowForm(true); }} className="rounded-lg border px-3 py-1.5 text-sm">Edit</button><button onClick={() => window.confirm(`Delete ${brand.name}?`) && remove(ref(db, `couponBrands/${brand.id}`))} className="rounded-lg border border-red-200 px-3 py-1.5 text-red-600"><Trash2 className="h-4 w-4" /></button></div></article>)}</section>
  </div>;
};

export default CouponManagement;
