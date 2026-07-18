import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Download } from 'lucide-react';
import { onValue, ref } from 'firebase/database';
import { db } from '../../firebase-config';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  useEffect(() => onValue(ref(db, 'eventPayments'), snapshot => setPayments(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)))), []);
  const verified = useMemo(() => payments.filter(payment => payment.status === 'verified'), [payments]);
  const exportCsv = () => {
    const esc = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [['Order ID', 'Payment ID', 'Event ID', 'User ID', 'Amount INR', 'Status', 'Created'], ...payments.map(payment => [payment.id, payment.paymentId, payment.eventId, payment.userId, Number(payment.amount || 0) / 100, payment.status, payment.createdAt])].map(row => row.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'event-payments.csv'; link.click(); URL.revokeObjectURL(url);
  };
  return <div className="space-y-6"><div className="flex flex-wrap justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><CreditCard className="h-6 w-6 text-emerald-600" /> Event Payments</h1><p className="text-gray-500">Razorpay orders and server-verified payment records.</p></div><button onClick={exportCsv} disabled={!payments.length} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 disabled:opacity-40"><Download className="h-4 w-4" /> Export CSV</button></div><div className="grid gap-4 sm:grid-cols-3">{[['Orders', payments.length], ['Verified', verified.length], ['Verified revenue', `₹${verified.reduce((sum, payment) => sum + Number(payment.amount || 0) / 100, 0).toLocaleString('en-IN')}`]].map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</div><div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-full divide-y text-sm"><thead className="bg-gray-50"><tr>{['Order', 'Payment', 'Event', 'Amount', 'Status', 'Registration'].map(label => <th key={label} className="px-4 py-3 text-left">{label}</th>)}</tr></thead><tbody className="divide-y">{payments.map(payment => <tr key={payment.id}><td className="px-4 py-3 font-mono text-xs">{payment.id}</td><td className="px-4 py-3 font-mono text-xs">{payment.paymentId || '—'}</td><td className="px-4 py-3">{payment.eventId}</td><td className="px-4 py-3">₹{(Number(payment.amount || 0) / 100).toLocaleString('en-IN')}</td><td className="px-4 py-3 capitalize">{payment.status}</td><td className="px-4 py-3">{payment.registrationId || '—'}</td></tr>)}</tbody></table>{!payments.length && <p className="p-10 text-center text-gray-500">No payment orders yet. Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the Functions environment before enabling paid events.</p>}</div></div>;
};

export default PaymentManagement;
