import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, BarChart3, CalendarDays, Download, Search, Tag, TicketCheck,
  TrendingUp, UserRoundCheck, Users
} from 'lucide-react';
import { equalTo, onValue, orderByChild, query, ref } from 'firebase/database';
import { db } from '../../firebase-config';

const number = value => Math.max(0, Number(value) || 0);
const percent = (value, total) => total ? Math.round((value / total) * 100) : 0;
const dateTime = value => value
  ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  : '—';
const shortDate = value => value
  ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'No expiry';

const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;

const downloadCsv = (filename, headers, rows) => {
  const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const SortableTable = ({ columns, rows, emptyMessage, rowKey = 'id' }) => {
  const [sort, setSort] = useState({ key: columns[0]?.key, direction: 'asc' });
  const sortedRows = useMemo(() => [...rows].sort((left, right) => {
    const a = left[sort.key];
    const b = right[sort.key];
    const comparison = typeof a === 'number' || typeof b === 'number'
      ? number(a) - number(b)
      : String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true });
    return sort.direction === 'asc' ? comparison : -comparison;
  }), [rows, sort]);

  const changeSort = key => setSort(current => ({
    key,
    direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
  }));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/60">
          <tr>{columns.map(column => (
            <th key={column.key} className={`whitespace-nowrap px-4 py-3 font-bold ${column.align === 'right' ? 'text-right' : ''}`}>
              <button type="button" onClick={() => changeSort(column.key)} className="inline-flex items-center gap-1 hover:text-blue-600">
                {column.label}{sort.key === column.key && <span aria-hidden="true">{sort.direction === 'asc' ? '↑' : '↓'}</span>}
              </button>
            </th>
          ))}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {sortedRows.map(row => (
            <tr key={row[rowKey]} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
              {columns.map(column => <td key={column.key} className={`whitespace-nowrap px-4 py-3 ${column.align === 'right' ? 'text-right' : ''}`}>{column.render ? column.render(row) : row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="px-5 py-12 text-center text-sm text-slate-500">{emptyMessage}</p>}
    </div>
  );
};

const BrandAnalyticsDashboard = ({ brand, onBack }) => {
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('offers');

  useEffect(() => {
    if (!brand?.id) return undefined;
    const offersQuery = query(ref(db, 'offers'), orderByChild('brandId'), equalTo(brand.id));
    const couponsQuery = query(ref(db, 'couponRedemptions'), orderByChild('brandId'), equalTo(brand.id));
    const unsubscribers = [
      onValue(offersQuery, snapshot => setOffers(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })))),
      onValue(couponsQuery, snapshot => setCoupons(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })))),
      onValue(ref(db, 'users'), snapshot => setUsersById(snapshot.val() || {}))
    ];
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [brand?.id]);

  const offerRows = useMemo(() => offers.map(offer => {
    const claimed = number(offer.issuedCount);
    const redeemed = number(offer.redeemedCount);
    const limit = number(offer.totalCouponLimit);
    const offerCoupons = coupons.filter(coupon => coupon.offerId === offer.id);
    return {
      ...offer,
      claimed,
      redeemed,
      conversion: percent(redeemed, claimed),
      uniqueRedeemers: new Set(offerCoupons.filter(coupon => number(coupon.useCount) > 0 || coupon.status === 'redeemed').map(coupon => coupon.userId).filter(Boolean)).size,
      remaining: limit ? Math.max(0, limit - claimed) : Infinity,
      validity: `${shortDate(offer.startsAt)} – ${shortDate(offer.endsAt)}`
    };
  }), [coupons, offers]);

  const customerRows = useMemo(() => {
    const customers = {};
    coupons.forEach(coupon => {
      if (!coupon.userId) return;
      const profile = usersById[coupon.userId] || {};
      const current = customers[coupon.userId] || {
        id: coupon.userId,
        name: profile.displayName || profile.name || profile.username || 'Unnamed user',
        email: profile.email || coupon.userEmail || '—',
        phone: profile.phoneNumber || profile.phone || '—',
        claimed: 0,
        redemptions: 0,
        offerIds: new Set(),
        lastRedeemedAt: 0
      };
      current.claimed += 1;
      current.redemptions += number(coupon.useCount) || (coupon.status === 'redeemed' ? 1 : 0);
      if (coupon.offerId) current.offerIds.add(coupon.offerId);
      current.lastRedeemedAt = Math.max(current.lastRedeemedAt, number(coupon.lastRedeemedAt || coupon.redeemedAt));
      customers[coupon.userId] = current;
    });
    return Object.values(customers)
      .filter(customer => customer.redemptions > 0)
      .map(customer => ({ ...customer, offersRedeemed: customer.offerIds.size }));
  }, [coupons, usersById]);

  const filteredOfferRows = useMemo(() => offerRows.filter(row => `${row.title} ${row.status} ${row.validity}`.toLowerCase().includes(search.toLowerCase())), [offerRows, search]);
  const filteredCustomerRows = useMemo(() => customerRows.filter(row => `${row.name} ${row.email} ${row.phone}`.toLowerCase().includes(search.toLowerCase())), [customerRows, search]);

  const stats = useMemo(() => {
    const claimed = offerRows.reduce((sum, offer) => sum + offer.claimed, 0);
    const redeemed = offerRows.reduce((sum, offer) => sum + offer.redeemed, 0);
    return {
      offers: offerRows.length,
      active: offerRows.filter(offer => offer.status === 'published' && offer.active !== false).length,
      claimed,
      redeemed,
      conversion: percent(redeemed, claimed),
      redeemers: customerRows.length,
      repeatCustomers: customerRows.filter(customer => customer.redemptions > 1).length
    };
  }, [customerRows, offerRows]);

  const exportCurrent = () => {
    if (tab === 'offers') {
      downloadCsv(`${brand.slug}-offers.csv`, ['Offer', 'Status', 'Validity', 'Claimed', 'Redeemed', 'Unique customers', 'Conversion %', 'Remaining'], filteredOfferRows.map(row => [row.title, row.status, row.validity, row.claimed, row.redeemed, row.uniqueRedeemers, row.conversion, row.remaining === Infinity ? 'Unlimited' : row.remaining]));
      return;
    }
    downloadCsv(`${brand.slug}-redeemed-users.csv`, ['User', 'Email', 'Phone', 'Coupons claimed', 'Redemption uses', 'Offers redeemed', 'Last redeemed'], filteredCustomerRows.map(row => [row.name, row.email, row.phone, row.claimed, row.redemptions, row.offersRedeemed, dateTime(row.lastRedeemedAt)]));
  };

  const offerColumns = [
    { key: 'title', label: 'Offer', render: row => <div><p className="max-w-xs truncate font-semibold text-slate-900 dark:text-white">{row.title}</p><p className="text-xs text-slate-500">{row.discountType === 'fixed' ? `₹${row.discountValue} off` : `${row.discountValue || 0}% off`}</p></div> },
    { key: 'status', label: 'Status', render: row => <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.status === 'published' ? 'bg-emerald-100 text-emerald-700' : row.status === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{row.status || 'draft'}</span> },
    { key: 'validity', label: 'Validity' },
    { key: 'claimed', label: 'Claimed', align: 'right' },
    { key: 'redeemed', label: 'Redeemed', align: 'right' },
    { key: 'uniqueRedeemers', label: 'Customers', align: 'right' },
    { key: 'conversion', label: 'Conversion', align: 'right', render: row => <span className="font-bold text-emerald-700">{row.conversion}%</span> },
    { key: 'remaining', label: 'Remaining', align: 'right', render: row => row.remaining === Infinity ? 'Unlimited' : row.remaining }
  ];
  const customerColumns = [
    { key: 'name', label: 'User', render: row => <div><p className="font-semibold text-slate-900 dark:text-white">{row.name}</p><p className="font-mono text-[10px] text-slate-400">{row.id.slice(0, 12)}…</p></div> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'claimed', label: 'Claimed', align: 'right' },
    { key: 'redemptions', label: 'Redemptions', align: 'right' },
    { key: 'offersRedeemed', label: 'Offers', align: 'right' },
    { key: 'lastRedeemedAt', label: 'Last redeemed', render: row => dateTime(row.lastRedeemedAt) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button type="button" onClick={onBack} className="mt-1 grid h-10 w-10 place-items-center rounded-xl border bg-white hover:bg-slate-50 dark:bg-slate-900" aria-label="Back to brands"><ArrowLeft className="h-5 w-5" /></button>
          <img src={brand.logoUrl || '/logo.png'} alt="" className="h-14 w-14 rounded-2xl border bg-white object-contain p-1" />
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Brand analytics</p><h1 className="text-2xl font-black text-slate-900 dark:text-white">{brand.name}</h1><p className="text-sm text-slate-500">{brand.category} · /{brand.slug}</p></div>
        </div>
        <button type="button" onClick={exportCurrent} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50 dark:bg-slate-900"><Download className="h-4 w-4" /> Export CSV</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total offers', stats.offers, Tag, 'text-blue-600'],
          ['Coupons claimed', stats.claimed, TicketCheck, 'text-violet-600'],
          ['Redemption uses', stats.redeemed, TrendingUp, 'text-emerald-600'],
          ['Redemption rate', `${stats.conversion}%`, BarChart3, 'text-amber-600'],
          ['Active offers', stats.active, CalendarDays, 'text-cyan-600'],
          ['Unique redeemers', stats.redeemers, Users, 'text-pink-600'],
          ['Repeat customers', stats.repeatCustomers, UserRoundCheck, 'text-indigo-600'],
          ['Avg. uses / redeemer', stats.redeemers ? (stats.redeemed / stats.redeemers).toFixed(1) : '0.0', BarChart3, 'text-slate-600']
        ].map(([label, value, icon, color]) => <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900">{React.createElement(icon, { className: `h-5 w-5 ${color}` })}<p className="mt-3 text-2xl font-black">{value}</p><p className="text-xs font-medium text-slate-500">{label}</p></div>)}
      </div>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 dark:border-slate-800">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button type="button" onClick={() => setTab('offers')} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'offers' ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-950' : 'text-slate-500'}`}>Offer performance</button>
            <button type="button" onClick={() => setTab('customers')} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'customers' ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-950' : 'text-slate-500'}`}>Redeemed users ({customerRows.length})</button>
          </div>
          <label className="relative min-w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={tab === 'offers' ? 'Search offers' : 'Search users'} className="w-full rounded-xl border bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></label>
        </div>
        {tab === 'offers'
          ? <SortableTable columns={offerColumns} rows={filteredOfferRows} emptyMessage="This brand has not created any offers yet." />
          : <SortableTable columns={customerColumns} rows={filteredCustomerRows} emptyMessage="No users have redeemed this brand’s coupons yet." />}
      </section>

      <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">Customer identities are available only to administrators. Brand portal analytics remain anonymous. Redemption history supplies the brand-affinity signal used to rank new offers for each user.</p>
    </div>
  );
};

export default BrandAnalyticsDashboard;
