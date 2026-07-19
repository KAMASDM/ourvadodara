import React, { useEffect, useMemo, useState } from 'react';
import { limitToLast, onValue, query, ref, remove, set, update } from 'firebase/database';
import { AlertTriangle, Ban, CheckCircle2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { db } from '../../firebase-config';
import { useAuth } from '../../context/Auth/AuthContext';

const domainKey = domain => btoa(domain).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const formatTime = value => value ? new Date(value).toLocaleString() : 'Unknown';

const RegistrationSecurityPanel = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [domains, setDomains] = useState([]);
  const [flags, setFlags] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribers = [
      onValue(query(ref(db, 'registrationSecurity/audit'), limitToLast(100)), snapshot => {
        setEvents(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)));
      }),
      onValue(ref(db, 'registrationSecurity/disposableDomains'), snapshot => {
        setDomains(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })).filter(item => item.active !== false).sort((a, b) => String(a.domain).localeCompare(String(b.domain))));
      }),
      onValue(ref(db, 'registrationSecurity/flaggedUsers'), snapshot => {
        setFlags(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)));
      })
    ];
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, []);

  const stats = useMemo(() => {
    const recent = events.filter(event => Date.now() - Number(event.createdAt || 0) < 86400000);
    return {
      attempts: recent.length,
      rejected: recent.filter(event => event.type === 'registration_rejected').length,
      suspicious: recent.filter(event => event.suspicious).length,
      openFlags: flags.filter(flag => flag.status !== 'reviewed').length
    };
  }, [events, flags]);

  const addDomain = async event => {
    event.preventDefault();
    const domain = newDomain.trim().toLowerCase().replace(/^@/, '');
    if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)) {
      setError('Enter a valid domain, for example temporarymail.com.');
      return;
    }
    await set(ref(db, `registrationSecurity/disposableDomains/${domainKey(domain)}`), {
      domain,
      active: true,
      addedAt: Date.now(),
      addedBy: user?.uid || null
    });
    setNewDomain('');
    setError('');
  };

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-950 to-blue-950 px-5 py-5 text-white dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10"><ShieldCheck className="h-6 w-6 text-teal-300" /></span><div><h2 className="text-lg font-black">Registration protection</h2><p className="text-sm text-slate-300">CAPTCHA scoring, velocity limits, disposable-email blocking and abuse monitoring</p></div></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-200"><CheckCircle2 className="h-4 w-4" />Protection configured</span>
      </div>

      <div className="grid grid-cols-2 gap-3 p-5 lg:grid-cols-4">
        {[['Attempts (24h)', stats.attempts], ['Rejected (24h)', stats.rejected], ['Suspicious (24h)', stats.suspicious], ['Open flags', stats.openFlags]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</p></div>)}
      </div>

      <div className="grid gap-6 border-t border-slate-200 p-5 dark:border-slate-700 xl:grid-cols-2">
        <div>
          <div className="flex items-center justify-between"><div><h3 className="font-black text-slate-950 dark:text-white">Disposable-domain blacklist</h3><p className="text-sm text-slate-500">Add newly discovered temporary email services here.</p></div><Ban className="h-5 w-5 text-rose-500" /></div>
          <form onSubmit={addDomain} className="mt-4 flex gap-2"><input value={newDomain} onChange={event => { setNewDomain(event.target.value); setError(''); }} placeholder="temporarymail.com" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800" /><button className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" />Add</button></form>
          {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
          <div className="mt-3 max-h-52 space-y-1 overflow-y-auto pr-1">{domains.length ? domains.map(item => <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"><span className="font-semibold">{item.domain}</span><button type="button" onClick={() => remove(ref(db, `registrationSecurity/disposableDomains/${item.id}`))} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40" aria-label={`Remove ${item.domain}`}><Trash2 className="h-4 w-4" /></button></div>) : <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400 dark:border-slate-700">No custom domains. The built-in blacklist remains active.</p>}</div>
        </div>

        <div>
          <div className="flex items-center justify-between"><div><h3 className="font-black text-slate-950 dark:text-white">Flagged accounts</h3><p className="text-sm text-slate-500">Review accounts detected by server-side monitoring.</p></div><AlertTriangle className="h-5 w-5 text-amber-500" /></div>
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">{flags.length ? flags.map(flag => <div key={flag.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{flag.email || flag.uid}</p><p className="mt-0.5 text-xs text-slate-500">{String(flag.reason || 'suspicious').replaceAll('_', ' ')} · {formatTime(flag.createdAt)}</p></div>{flag.status === 'reviewed' ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">Reviewed</span> : <button type="button" onClick={() => update(ref(db, `registrationSecurity/flaggedUsers/${flag.id}`), { status: 'reviewed', reviewedAt: Date.now(), reviewedBy: user?.uid || null })} className="rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-slate-950">Mark reviewed</button>}</div></div>) : <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400 dark:border-slate-700">No accounts are currently flagged.</p>}</div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-700"><h3 className="text-sm font-black text-slate-950 dark:text-white">Recent security events</h3><div className="mt-3 overflow-x-auto"><table className="min-w-[680px] w-full text-left text-xs"><thead className="text-slate-400"><tr><th className="pb-2">Time</th><th className="pb-2">Event</th><th className="pb-2">Domain</th><th className="pb-2">Result</th><th className="pb-2">Score</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{events.slice(0, 15).map(event => <tr key={event.id}><td className="py-2.5 text-slate-500">{formatTime(event.createdAt)}</td><td className="py-2.5 font-semibold">{String(event.type || '').replaceAll('_', ' ')}</td><td className="py-2.5">{event.domain || '—'}</td><td className={`py-2.5 font-bold ${event.suspicious ? 'text-rose-600' : 'text-emerald-600'}`}>{String(event.reason || '').replaceAll('_', ' ')}</td><td className="py-2.5">{Number.isFinite(event.captchaScore) ? event.captchaScore.toFixed(2) : '—'}</td></tr>)}</tbody></table></div></div>
    </section>
  );
};

export default RegistrationSecurityPanel;
