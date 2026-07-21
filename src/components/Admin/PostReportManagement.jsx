import React, { useEffect, useMemo, useState } from 'react';
import { onValue, ref, update } from 'firebase/database';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  EyeOff,
  Flag,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle
} from 'lucide-react';
import { db } from '../../firebase-config';
import { useAuth } from '../../context/Auth/AuthContext';
import { getLocalizedText } from '../../utils/textUtils';

const REASON_LABELS = {
  spam: 'Spam',
  harassment: 'Harassment',
  hate_speech: 'Hate speech',
  misinformation: 'Misinformation',
  violence: 'Violence',
  inappropriate: 'Inappropriate content',
  copyright: 'Copyright violation',
  other: 'Other'
};

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  dismissed: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
};

const formatDate = value => {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return 'Unknown date';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const PostReportManagement = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState({});
  const [busyReportId, setBusyReportId] = useState(null);

  useEffect(() => {
    const unsubscribeReports = onValue(
      ref(db, 'contentReports'),
      snapshot => {
        const nextReports = Object.entries(snapshot.val() || {})
          .flatMap(([contentId, reportsByUser]) => Object.entries(reportsByUser || {})
            .map(([reporterId, report]) => ({
              id: `${contentId}/${reporterId}`,
              contentId,
              reporterId,
              ...report
            })))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setReports(nextReports);
        setLoading(false);
        setLoadError('');
      },
      error => {
        console.error('Error loading content reports:', error);
        setLoadError('Unable to load post reports. Check the Firebase database rules.');
        setLoading(false);
      }
    );
    const unsubscribePosts = onValue(ref(db, 'posts'), snapshot => setPosts(snapshot.val() || {}));

    return () => {
      unsubscribeReports();
      unsubscribePosts();
    };
  }, []);

  const counts = useMemo(() => ({
    pending: reports.filter(report => (report.status || 'pending') === 'pending').length,
    reviewing: reports.filter(report => report.status === 'reviewing').length,
    resolved: reports.filter(report => report.status === 'resolved').length,
    dismissed: reports.filter(report => report.status === 'dismissed').length
  }), [reports]);

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return reports.filter(report => {
      const status = report.status || 'pending';
      const post = posts[report.contentId];
      const title = report.contentTitle || getLocalizedText(post?.title) || 'Untitled post';
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesReason = reasonFilter === 'all' || report.reason === reasonFilter;
      const matchesSearch = !normalizedSearch || [
        title,
        report.description,
        report.reporterName,
        report.reporterEmail,
        report.contentId
      ].some(value => String(value || '').toLowerCase().includes(normalizedSearch));
      return matchesStatus && matchesReason && matchesSearch;
    });
  }, [posts, reasonFilter, reports, searchTerm, statusFilter]);

  const getPostPaths = report => {
    const post = posts[report.contentId];
    const cityIds = Array.isArray(post?.cities) && post.cities.length > 0
      ? post.cities
      : post?.cityId
        ? [post.cityId]
        : [];
    return [`posts/${report.contentId}`, ...cityIds.map(cityId => `cities/${cityId}/posts/${report.contentId}`)];
  };

  const addReportResolutionUpdates = (updates, targetReport, status, resolution) => {
    const now = new Date().toISOString();
    const affectedReports = resolution === 'post_hidden' || resolution === 'post_removed'
      ? reports.filter(report => report.contentId === targetReport.contentId && ['pending', 'reviewing'].includes(report.status || 'pending'))
      : [targetReport];

    affectedReports.forEach(report => {
      const basePath = `contentReports/${report.id}`;
      updates[`${basePath}/status`] = status;
      updates[`${basePath}/resolution`] = resolution;
      updates[`${basePath}/adminNote`] = notes[targetReport.id]?.trim() || '';
      updates[`${basePath}/reviewedBy`] = user.uid;
      updates[`${basePath}/reviewedByName`] = user.displayName || user.email || 'Admin';
      updates[`${basePath}/reviewedAt`] = now;
      updates[`${basePath}/updatedAt`] = now;
    });
  };

  const handleAction = async (report, action) => {
    const post = posts[report.contentId];
    const title = report.contentTitle || getLocalizedText(post?.title) || 'this post';

    if (action === 'dismiss' && !window.confirm(`Dismiss the report for “${title}” as no violation?`)) return;
    if (action === 'hide' && !window.confirm(`Unpublish “${title}”? The post will be hidden from public feeds but can be republished later.`)) return;
    if (action === 'remove' && !window.confirm(`Permanently remove “${title}”? This cannot be undone.`)) return;

    setBusyReportId(report.id);
    try {
      const updates = {};
      const now = new Date().toISOString();

      if (action === 'review') {
        updates[`contentReports/${report.id}/status`] = 'reviewing';
        updates[`contentReports/${report.id}/reviewStartedBy`] = user.uid;
        updates[`contentReports/${report.id}/reviewStartedAt`] = now;
        updates[`contentReports/${report.id}/updatedAt`] = now;
      } else if (action === 'dismiss') {
        addReportResolutionUpdates(updates, report, 'dismissed', 'no_violation');
      } else if (action === 'hide') {
        if (!post) throw new Error('POST_NOT_FOUND');
        getPostPaths(report).forEach(path => {
          updates[`${path}/status`] = 'draft';
          updates[`${path}/isPublished`] = false;
          updates[`${path}/updatedAt`] = now;
        });
        addReportResolutionUpdates(updates, report, 'resolved', 'post_hidden');
      } else if (action === 'remove') {
        if (!post) throw new Error('POST_NOT_FOUND');
        getPostPaths(report).forEach(path => { updates[path] = null; });
        addReportResolutionUpdates(updates, report, 'resolved', 'post_removed');
      }

      await update(ref(db), updates);
      setNotes(previous => ({ ...previous, [report.id]: '' }));
    } catch (error) {
      console.error('Error taking report action:', error);
      alert(error.message === 'POST_NOT_FOUND'
        ? 'This post is no longer available. You can dismiss the report to close it.'
        : 'Unable to update this report. Please try again.');
    } finally {
      setBusyReportId(null);
    }
  };

  if (loading) {
    return <div className="grid min-h-[45vh] place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-rose-600 dark:text-rose-300">
            <ShieldCheck className="h-4 w-4" /> Content safety
          </div>
          <h1 className="mt-2 text-3xl font-black">Post Reports</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Review user reports and take action on posts that violate publishing standards.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
          {reports.length} total reports
        </span>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{loadError}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { id: 'pending', label: 'Pending', count: counts.pending, icon: AlertTriangle, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
          { id: 'reviewing', label: 'Reviewing', count: counts.reviewing, icon: Clock3, tone: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
          { id: 'resolved', label: 'Action taken', count: counts.resolved, icon: CheckCircle2, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
          { id: 'dismissed', label: 'Dismissed', count: counts.dismissed, icon: XCircle, tone: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' }
        ].map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" onClick={() => setStatusFilter(item.id)} className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${statusFilter === item.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${item.tone}`}><Icon className="h-5 w-5" /></span>
                <span className="text-2xl font-black">{item.count}</span>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">{item.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_190px_190px]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search post, reporter, description…" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-blue-950" />
        </label>
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Action taken</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select value={reasonFilter} onChange={event => setReasonFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
          <option value="all">All reasons</option>
          {Object.entries(REASON_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {filteredReports.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <Flag className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-4 text-lg font-bold">No matching reports</h2>
          <p className="mt-1 text-sm text-slate-500">There are no reports in this queue.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => {
            const post = posts[report.contentId];
            const title = report.contentTitle || getLocalizedText(post?.title) || 'Untitled or removed post';
            const status = report.status || 'pending';
            const isClosed = status === 'resolved' || status === 'dismissed';
            const isBusy = busyReportId === report.id;

            return (
              <article key={report.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>{status === 'resolved' ? 'Action taken' : status}</span>
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{REASON_LABELS[report.reason] || report.reason}</span>
                      <span className="text-xs text-slate-500">{formatDate(report.createdAt)}</span>
                    </div>

                    <h2 className="mt-3 text-xl font-black leading-snug text-slate-950 dark:text-white">{title}</h2>
                    <p className="mt-1 break-all text-xs text-slate-400">Post ID: {report.contentId}</p>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Reporter details</p>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4" />{report.reporterName || 'Anonymous user'}</span>
                        {report.reporterEmail && <span>{report.reporterEmail}</span>}
                        <span className="text-xs text-slate-400">UID: {report.reporterId}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Additional details</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{report.description || 'No additional details provided.'}</p>
                    </div>

                    {isClosed && (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
                        <p className="font-bold text-emerald-800 dark:text-emerald-200">Resolution: {(report.resolution || status).replaceAll('_', ' ')}</p>
                        {report.adminNote && <p className="mt-1 text-emerald-700 dark:text-emerald-300">{report.adminNote}</p>}
                        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">By {report.reviewedByName || 'Admin'} · {formatDate(report.reviewedAt)}</p>
                      </div>
                    )}
                  </div>

                  <aside className="border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40 lg:border-l lg:border-t-0">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Moderation actions</p>
                    <a href={`/post/${report.contentId}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                      <ExternalLink className="h-4 w-4" /> View post
                    </a>

                    {!isClosed && (
                      <>
                        <textarea value={notes[report.id] || ''} onChange={event => setNotes(previous => ({ ...previous, [report.id]: event.target.value.slice(0, 500) }))} rows={3} placeholder="Admin note (optional)" className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-blue-950" />
                        <div className="mt-3 grid gap-2">
                          {status === 'pending' && (
                            <button type="button" disabled={isBusy} onClick={() => handleAction(report, 'review')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"><Clock3 className="h-4 w-4" /> Mark reviewing</button>
                          )}
                          <button type="button" disabled={isBusy || !post} onClick={() => handleAction(report, 'hide')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50"><EyeOff className="h-4 w-4" /> Unpublish post</button>
                          <button type="button" disabled={isBusy} onClick={() => handleAction(report, 'dismiss')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><XCircle className="h-4 w-4" /> Dismiss report</button>
                          <button type="button" disabled={isBusy || !post} onClick={() => handleAction(report, 'remove')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Remove post</button>
                        </div>
                      </>
                    )}
                  </aside>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PostReportManagement;
