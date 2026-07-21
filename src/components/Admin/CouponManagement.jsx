import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Copy, ExternalLink, ImagePlus, KeyRound, Plus, Store, Tags } from 'lucide-react';
import { onValue, ref } from 'firebase/database';
import { db, functions, httpsCallable } from '../../firebase-config';

const DEFAULT_CATEGORIES = ['Food & Dining', 'Fashion', 'Beauty & Wellness', 'Entertainment', 'Shopping', 'Travel', 'Health', 'Education', 'Automotive', 'Home Services', 'Technology'];

const EMPTY_BRAND = {
  name: '', slug: '', address: '', phone: '', email: '', logoUrl: '',
  loginEmail: '', password: '', category: DEFAULT_CATEGORIES[0], customCategory: ''
};

const slugify = value => String(value || '').toLowerCase().trim()
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const CouponManagement = () => {
  const [brands, setBrands] = useState([]);
  const [accounts, setAccounts] = useState({});
  const [savedCategories, setSavedCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_BRAND);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => onValue(ref(db, 'brandsPublic'), snapshot => {
    setBrands(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })));
  }), []);
  useEffect(() => onValue(ref(db, 'brandAccounts'), snapshot => setAccounts(snapshot.val() || {})), []);
  useEffect(() => onValue(ref(db, 'couponCategories'), snapshot => {
    setSavedCategories(Object.values(snapshot.val() || {}).map(category => category.name).filter(Boolean));
  }), []);

  const categories = useMemo(
    () => [...new Set([...DEFAULT_CATEGORIES, ...savedCategories])].sort((a, b) => a.localeCompare(b)),
    [savedCategories]
  );

  const handleLogoUpload = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Please choose an image smaller than 5 MB.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const logoDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Unable to read the selected image.'));
        reader.readAsDataURL(file);
      });
      setForm(current => ({ ...current, logoUrl: logoDataUrl }));
    } catch (uploadError) {
      setError(uploadError?.message || 'Unable to upload the brand logo.');
    } finally {
      setUploading(false);
    }
  };

  const submitBrand = async event => {
    event.preventDefault();
    const category = form.category === '__custom__' ? form.customCategory.trim() : form.category;
    if (!category) {
      setError('Enter the new category name.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess(null);
    try {
      const createBrand = httpsCallable(functions, 'adminCreateBrand');
      const result = await createBrand({ ...form, category, slug: form.slug || slugify(form.name) });
      setSuccess({ ...result.data, name: form.name, loginEmail: form.loginEmail, password: form.password });
      setForm(EMPTY_BRAND);
      setShowForm(false);
    } catch (createError) {
      const isAccountConflict = createError?.code === 'functions/already-exists';
      setError(isAccountConflict
        ? 'This portal URL or brand login email is already in use. Choose a different portal URL/login email and try again.'
        : createError?.message?.replace('Firebase: ', '') || 'Unable to create brand.');
    } finally {
      setSaving(false);
    }
  };

  const copyPortal = async slug => navigator.clipboard.writeText(`${window.location.origin}/${slug}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Building2 className="h-7 w-7 text-blue-600" /> Brands & Coupons</h1>
          <p className="mt-1 text-sm text-gray-500">Create secure brand portals. Brands manage their own offers, scanning, and anonymous analytics.</p>
        </div>
        <button type="button" onClick={() => { setShowForm(current => !current); setError(''); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Create brand
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">{success.name} was created successfully.</p>
          <p className="mt-1">Login: {success.loginEmail}</p>
          <p className="mt-1">Temporary password: <span className="font-mono font-semibold">{success.password}</span></p>
          <p className="mt-1 text-xs">Copy these credentials now; the password cannot be viewed again.</p>
          <a className="mt-2 inline-flex items-center gap-1 font-semibold underline" href={success.portalUrl} target="_blank" rel="noreferrer">Open {success.portalUrl} <ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
      )}

      {showForm && (
        <form onSubmit={submitBrand} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-2 dark:border-gray-800 dark:bg-gray-900">
          <div className="md:col-span-2">
            <h2 className="text-lg font-bold">New brand account</h2>
            <p className="text-sm text-gray-500">The password is sent directly to Firebase Authentication and is never stored in the database.</p>
          </div>

          <label className="text-sm font-medium">Brand name
            <input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value, slug: !current.slug || current.slug === slugify(current.name) ? slugify(event.target.value) : current.slug }))} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-gray-950" />
          </label>
          <label className="text-sm font-medium">Portal URL
            <div className="mt-1 flex overflow-hidden rounded-xl border"><span className="bg-gray-50 px-3 py-2.5 text-gray-500 dark:bg-gray-800">/</span><input required value={form.slug} onChange={event => setForm(current => ({ ...current, slug: slugify(event.target.value) }))} className="min-w-0 flex-1 px-3 py-2.5 dark:bg-gray-950" /></div>
          </label>
          <label className="text-sm font-medium md:col-span-2">Brand address
            <textarea required rows="2" value={form.address} onChange={event => setForm(current => ({ ...current, address: event.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-gray-950" />
          </label>
          <label className="text-sm font-medium">Brand phone
            <input required type="tel" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-gray-950" />
          </label>
          <label className="text-sm font-medium">Public brand email
            <input required type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-gray-950" />
          </label>
          <label className="text-sm font-medium">Category
            <select value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-gray-950">
              {categories.map(category => <option key={category} value={category}>{category}</option>)}
              <option value="__custom__">+ Add a new category</option>
            </select>
          </label>
          {form.category === '__custom__' && <label className="text-sm font-medium">New category
            <input required value={form.customCategory} onChange={event => setForm(current => ({ ...current, customCategory: event.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-gray-950" placeholder="e.g. Pet Care" />
          </label>}
          <label className="text-sm font-medium">Brand login ID (email)
            <input required type="email" autoComplete="off" value={form.loginEmail} onChange={event => setForm(current => ({ ...current, loginEmail: event.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-gray-950" />
          </label>
          <label className="text-sm font-medium">Temporary password
            <input required minLength="8" type="password" autoComplete="new-password" value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2.5 dark:bg-gray-950" />
          </label>
          <label className="md:col-span-2 text-sm font-medium">Brand logo
            <div className="mt-1 flex items-center gap-4 rounded-xl border border-dashed p-4">
              {form.logoUrl ? <img src={form.logoUrl} alt="Brand logo preview" className="h-16 w-16 rounded-xl object-contain" /> : <div className="grid h-16 w-16 place-items-center rounded-xl bg-gray-100"><ImagePlus className="h-6 w-6 text-gray-400" /></div>}
              <input required={!form.logoUrl} type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="text-sm" />
              {uploading && <span className="text-sm text-blue-600">Uploading…</span>}
            </div>
          </label>
          {error && <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          <div className="flex justify-end gap-2 md:col-span-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2.5">Cancel</button>
            <button disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50"><KeyRound className="h-4 w-4" /> {saving ? 'Creating…' : 'Create brand & login'}</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 dark:bg-gray-900"><Store className="h-5 w-5 text-blue-600" /><p className="mt-3 text-3xl font-bold">{brands.length}</p><p className="text-sm text-gray-500">Brands</p></div>
        <div className="rounded-2xl border bg-white p-5 dark:bg-gray-900"><Tags className="h-5 w-5 text-purple-600" /><p className="mt-3 text-3xl font-bold">{categories.length}</p><p className="text-sm text-gray-500">Categories</p></div>
        <div className="rounded-2xl border bg-white p-5 dark:bg-gray-900"><KeyRound className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-3xl font-bold">{brands.filter(brand => accounts[brand.id]?.active !== false).length}</p><p className="text-sm text-gray-500">Active portals</p></div>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-white dark:bg-gray-900">
        <div className="border-b px-5 py-4"><h2 className="font-bold">Brand portals</h2></div>
        <div className="divide-y">
          {brands.map(brand => (
            <div key={brand.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <img src={brand.logoUrl || '/logo.png'} alt="" className="h-12 w-12 rounded-xl border object-contain" />
              <div className="min-w-48 flex-1"><p className="font-semibold">{brand.name}</p><p className="text-sm text-gray-500">{brand.category} · {brand.phone}</p></div>
              <div className="text-sm"><p className="font-medium">{accounts[brand.id]?.loginEmail || 'Account pending'}</p><p className="text-gray-500">/{brand.slug}</p></div>
              <button type="button" onClick={() => copyPortal(brand.slug)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Copy className="h-4 w-4" /> Copy portal</button>
              <a href={`/${brand.slug}`} target="_blank" rel="noreferrer" className="rounded-lg border p-2" aria-label={`Open ${brand.name} portal`}><ExternalLink className="h-4 w-4" /></a>
            </div>
          ))}
          {!brands.length && <p className="px-5 py-12 text-center text-gray-500">No brands created yet.</p>}
        </div>
      </section>
    </div>
  );
};

export default CouponManagement;
