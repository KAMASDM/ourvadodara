import React, { useEffect, useMemo, useState } from 'react';
import { ref, onValue, update, push } from 'firebase/database';
import {
  BarChart3,
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle,
  ChevronLeft,
  Clock,
  FileText,
  Filter,
  IndianRupee,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Send,
  Smartphone,
  Target,
  UserRound,
  Workflow,
} from 'lucide-react';
import { db } from '../../firebase-config';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';

const LEAD_PATH = 'leads';
const TEMPLATE_PATH = 'leadMessageTemplates';

const STAGES = [
  { id: 'new', label: 'New', tone: 'bg-blue-50 text-blue-700 border-blue-100' },
  { id: 'contacted', label: 'Contacted', tone: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  { id: 'qualified', label: 'Qualified', tone: 'bg-violet-50 text-violet-700 border-violet-100' },
  { id: 'proposal', label: 'Proposal', tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  { id: 'negotiation', label: 'Negotiation', tone: 'bg-orange-50 text-orange-700 border-orange-100' },
  { id: 'won', label: 'Won', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { id: 'lost', label: 'Lost', tone: 'bg-rose-50 text-rose-700 border-rose-100' },
  { id: 'on_hold', label: 'On Hold', tone: 'bg-slate-50 text-slate-700 border-slate-100' }
];

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
  { id: 'push', label: 'Push', icon: Bell },
  { id: 'email', label: 'Email', icon: Mail }
];

const TRIGGERS = [
  { id: 'lead_created', label: 'New lead captured' },
  { id: 'lead_updated', label: 'Lead updated' },
  { id: 'stage_contacted', label: 'Stage becomes Contacted' },
  { id: 'stage_qualified', label: 'Stage becomes Qualified' },
  { id: 'stage_proposal', label: 'Stage becomes Proposal' },
  { id: 'followup_due', label: 'Follow-up due' }
];

const EMPTY_TEMPLATE = {
  name: '',
  title: '',
  channels: ['whatsapp'],
  triggers: ['lead_created'],
  richText: '',
  enabled: true
};

const getStage = (lead) => lead.stage || lead.status || 'new';
const getStageConfig = (stage) => STAGES.find(item => item.id === stage) || STAGES[0];
const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  if (!amount) return '0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};
const formatDate = (value, fallback = '-') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const isDue = (lead) => lead.followUpDate && new Date(`${lead.followUpDate}T23:59:59`) <= new Date();

const normalizeLead = ([id, lead]) => ({
  id,
  ...lead,
  stage: lead.stage || lead.status || 'new'
});

const MarketingDashboard = () => {
  const { user } = useEnhancedAuth();
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE);
  const [templateSaving, setTemplateSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, LEAD_PATH), (snapshot) => {
      const list = snapshot.val() ? Object.entries(snapshot.val()).map(normalizeLead) : [];
      setLeads(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, TEMPLATE_PATH), (snapshot) => {
      const list = snapshot.val()
        ? Object.entries(snapshot.val()).map(([id, value]) => ({ id, ...value }))
        : [];
      setTemplates(list);
    });
    return () => unsubscribe();
  }, []);

  const selectedLead = useMemo(
    () => leads.find(lead => lead.id === selectedLeadId) || null,
    [leads, selectedLeadId]
  );

  const filteredLeads = useMemo(() => {
    const text = query.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return leads
      .filter((lead) => {
        const createdAt = new Date(lead.createdAt || lead.updatedAt || 0);
        const haystack = [
          lead.companyName,
          lead.contactName,
          lead.phone,
          lead.email,
          lead.city,
          lead.packageInterest,
          lead.requirements,
          lead.notes
        ].filter(Boolean).join(' ').toLowerCase();

        const matchesText = !text || haystack.includes(text);
        const matchesStage = stageFilter === 'all' || getStage(lead) === stageFilter;
        const matchesChannel = channelFilter === 'all' || (lead.communicationPreference || '').toLowerCase() === channelFilter;
        const matchesFrom = !from || createdAt >= from;
        const matchesTo = !to || createdAt <= to;
        return matchesText && matchesStage && matchesChannel && matchesFrom && matchesTo;
      })
      .sort((a, b) => {
        const aValue = sortBy === 'value'
          ? Number(a.expectedValue || a.budget || 0)
          : new Date(a[sortBy] || a.updatedAt || a.createdAt || 0).getTime();
        const bValue = sortBy === 'value'
          ? Number(b.expectedValue || b.budget || 0)
          : new Date(b[sortBy] || b.updatedAt || b.createdAt || 0).getTime();
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [leads, query, stageFilter, channelFilter, dateFrom, dateTo, sortBy, sortDirection]);

  const stats = useMemo(() => {
    const active = leads.filter(lead => !['won', 'lost'].includes(getStage(lead)));
    return {
      total: leads.length,
      active: active.length,
      due: leads.filter(isDue).length,
      won: leads.filter(lead => getStage(lead) === 'won').length,
      value: active.reduce((sum, lead) => sum + (Number(lead.expectedValue) || Number(lead.budget) || 0), 0)
    };
  }, [leads]);

  const updateLeadStage = async (lead, stage) => {
    const now = new Date().toISOString();
    const activityLog = Array.isArray(lead.activityLog) ? lead.activityLog : [];
    await update(ref(db, `${LEAD_PATH}/${lead.id}`), {
      stage,
      status: stage,
      updatedAt: now,
      updatedBy: user?.uid || null,
      updatedByName: user?.displayName || user?.email || 'Marketing',
      lastActivityAt: now,
      activityLog: [
        ...activityLog,
        {
          message: `Stage changed to ${getStageConfig(stage).label}`,
          note: '',
          at: now,
          by: user?.displayName || user?.email || 'Marketing',
          byUid: user?.uid || null
        }
      ].slice(-40)
    });
  };

  const addFollowUpTomorrow = async (lead) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const now = new Date().toISOString();
    const activityLog = Array.isArray(lead.activityLog) ? lead.activityLog : [];
    await update(ref(db, `${LEAD_PATH}/${lead.id}`), {
      followUpDate: tomorrow.toISOString().slice(0, 10),
      updatedAt: now,
      lastActivityAt: now,
      activityLog: [
        ...activityLog,
        {
          message: 'Follow-up scheduled',
          note: 'Tomorrow',
          at: now,
          by: user?.displayName || user?.email || 'Marketing',
          byUid: user?.uid || null
        }
      ].slice(-40)
    });
  };

  const toggleTemplateArray = (field, value) => {
    setTemplateForm(prev => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const next = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
      return { ...prev, [field]: next.length ? next : [value] };
    });
  };

  const saveTemplate = async (event) => {
    event.preventDefault();
    setTemplateSaving(true);
    const now = new Date().toISOString();
    try {
      const channels = templateForm.channels;
      await push(ref(db, TEMPLATE_PATH), {
        ...templateForm,
        editorMode: 'rich',
        html: '',
        sendWhatsApp: channels.includes('whatsapp'),
        sendPush: channels.includes('push'),
        updatedAt: now,
        createdAt: now,
        createdBy: user?.uid || null,
        createdByName: user?.displayName || user?.email || 'Marketing'
      });
      setTemplateForm(EMPTY_TEMPLATE);
    } finally {
      setTemplateSaving(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-950">Marketing access required</h1>
          <p className="mt-2 text-sm text-slate-500">Please sign in with an admin account.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'leads', label: 'Leads', icon: Briefcase },
    { id: 'templates', label: 'Templates', icon: MessageSquare },
    { id: 'automation', label: 'Automation', icon: Workflow },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Our Vadodara</p>
            <h1 className="text-2xl font-bold">Marketing Lead Management</h1>
            <p className="mt-1 text-sm text-slate-500">Leads, follow-ups, templates, automation, and sales reporting.</p>
          </div>
          <button
            type="button"
            onClick={() => { window.location.href = '/admin'; }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Admin
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-5 px-5 py-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Total Leads', value: stats.total, icon: Briefcase },
            { label: 'Active Pipeline', value: stats.active, icon: Target },
            { label: 'Due Follow-ups', value: stats.due, icon: CalendarClock },
            { label: 'Won Leads', value: stats.won, icon: CheckCircle },
            { label: 'Pipeline Value', value: formatCurrency(stats.value), icon: IndianRupee }
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                    <p className="mt-2 truncate text-2xl font-bold">{item.value}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid gap-2 md:grid-cols-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedLeadId('');
                  }}
                  className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold ${
                    activeTab === tab.id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'leads' && !selectedLead && (
          <section className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_170px_170px_150px_150px_160px_130px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
                    placeholder="Search lead, phone, package..."
                  />
                </div>
                <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="all">All status</option>
                  {STAGES.map(stage => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                </select>
                <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="all">All channels</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="updatedAt">Sort updated</option>
                  <option value="createdAt">Sort captured</option>
                  <option value="followUpDate">Sort follow-up</option>
                  <option value="value">Sort value</option>
                </select>
                <button type="button" onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
                  <Filter className="h-4 w-4" />
                  {sortDirection === 'asc' ? 'Asc' : 'Desc'}
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Lead</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Package</th>
                      <th className="px-4 py-3">Value</th>
                      <th className="px-4 py-3">Follow-up</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map(lead => {
                      const stage = getStageConfig(getStage(lead));
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => setSelectedLeadId(lead.id)} className="text-left">
                              <span className="block font-semibold text-slate-950">{lead.companyName || 'Untitled lead'}</span>
                              <span className="mt-1 block text-xs text-slate-500">{lead.contactName || 'No contact'} · {lead.phone || lead.email || 'No contact detail'}</span>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${stage.tone}`}>{stage.label}</span>
                          </td>
                          <td className="max-w-xs px-4 py-3 text-slate-600">{lead.packageInterest || '-'}</td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(lead.expectedValue || lead.budget)}</td>
                          <td className={`px-4 py-3 ${isDue(lead) ? 'font-semibold text-rose-600' : 'text-slate-600'}`}>{formatDate(lead.followUpDate)}</td>
                          <td className="px-4 py-3 text-slate-600">{lead.assignedTo || 'Unassigned'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <select
                                value={getStage(lead)}
                                onChange={(event) => updateLeadStage(lead, event.target.value)}
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                              >
                                {STAGES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                              </select>
                              <button type="button" onClick={() => addFollowUpTomorrow(lead)} className="rounded-md border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-700">Follow-up</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredLeads.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No leads match the current filters.</div>}
            </div>
          </section>
        )}

        {activeTab === 'leads' && selectedLead && (
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-4">
              <button type="button" onClick={() => setSelectedLeadId('')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
                <ChevronLeft className="h-4 w-4" />
                Back to leads
              </button>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedLead.companyName}</h2>
                    <p className="mt-1 text-sm text-slate-500">{selectedLead.contactName} · {selectedLead.city || 'City not set'}</p>
                  </div>
                  <select value={getStage(selectedLead)} onChange={(event) => updateLeadStage(selectedLead, event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    {STAGES.map(stage => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                  </select>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <InfoTile label="Phone" value={selectedLead.phone || '-'} icon={Smartphone} />
                  <InfoTile label="Email" value={selectedLead.email || '-'} icon={Mail} />
                  <InfoTile label="Value" value={formatCurrency(selectedLead.expectedValue || selectedLead.budget)} icon={IndianRupee} />
                  <InfoTile label="Follow-up" value={formatDate(selectedLead.followUpDate)} icon={Clock} />
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <TextPanel title="Requirements" text={selectedLead.requirements || 'No requirements captured yet.'} />
                  <TextPanel title="Notes" text={selectedLead.notes || 'No internal notes yet.'} />
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-base font-semibold"><FileText className="h-4 w-4" />Lead History</h3>
              <div className="mt-4 space-y-3">
                {(Array.isArray(selectedLead.activityLog) ? selectedLead.activityLog : []).slice().reverse().map((activity, index) => (
                  <div key={`${activity.at || 'activity'}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="font-semibold text-slate-900">{activity.message}</p>
                    {activity.note && <p className="mt-1 text-sm text-slate-600">{activity.note}</p>}
                    <p className="mt-2 text-xs text-slate-400">{formatDate(activity.at, '')} · {activity.by || 'System'}</p>
                  </div>
                ))}
                {(!Array.isArray(selectedLead.activityLog) || selectedLead.activityLog.length === 0) && (
                  <p className="text-sm text-slate-500">No history has been recorded yet.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'templates' && (
          <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            <form onSubmit={saveTemplate} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><Plus className="h-5 w-5" />Create Template</h2>
              <input value={templateForm.name} onChange={(event) => setTemplateForm(prev => ({ ...prev, name: event.target.value }))} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Template name" />
              <input value={templateForm.title} onChange={(event) => setTemplateForm(prev => ({ ...prev, title: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Push/email title" />
              <div>
                <p className="mb-2 text-sm font-semibold">Channels</p>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map(channel => {
                    const Icon = channel.icon;
                    return (
                      <button key={channel.id} type="button" onClick={() => toggleTemplateArray('channels', channel.id)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${templateForm.channels.includes(channel.id) ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 text-slate-600'}`}>
                        <Icon className="h-4 w-4" />
                        {channel.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Triggers</p>
                <div className="grid gap-2">
                  {TRIGGERS.map(trigger => (
                    <label key={trigger.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <input type="checkbox" checked={templateForm.triggers.includes(trigger.id)} onChange={() => toggleTemplateArray('triggers', trigger.id)} />
                      {trigger.label}
                    </label>
                  ))}
                </div>
              </div>
              <textarea value={templateForm.richText} onChange={(event) => setTemplateForm(prev => ({ ...prev, richText: event.target.value }))} required rows={6} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Hi {{contactName}}, thank you for contacting Our Vadodara..." />
              <button disabled={templateSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                <Send className="h-4 w-4" />
                {templateSaving ? 'Saving...' : 'Save Template'}
              </button>
            </form>
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-semibold">Template Library</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {templates.map(template => (
                  <div key={template.id} className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{template.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${template.enabled === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>{template.enabled === false ? 'Paused' : 'Enabled'}</span>
                      {(template.channels || (template.sendWhatsApp ? ['whatsapp'] : ['push'])).map(channel => <span key={channel} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{channel}</span>)}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{template.richText || template.html}</p>
                  </div>
                ))}
                {templates.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No templates yet.</div>}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'automation' && (
          <section className="grid gap-5 lg:grid-cols-3">
            {[
              { title: 'New lead reply', body: 'Sends an automatic WhatsApp reply when a lead is captured.', status: templates.some(item => item.triggers?.includes('lead_created') && item.sendWhatsApp) ? 'Configured' : 'Needs template' },
              { title: 'Follow-up reminders', body: 'Alerts the team when follow-up dates are due.', status: templates.some(item => item.triggers?.includes('followup_due')) ? 'Configured' : 'Needs template' },
              { title: 'Stage automation', body: 'Messages can trigger when a lead moves to contacted, qualified, or proposal.', status: templates.some(item => item.triggers?.some(trigger => trigger.startsWith('stage_'))) ? 'Configured' : 'Optional' }
            ].map(card => (
              <div key={card.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <Workflow className="h-6 w-6 text-blue-600" />
                <h3 className="mt-4 font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{card.body}</p>
                <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{card.status}</span>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'reports' && (
          <section className="grid gap-5 lg:grid-cols-2">
            <ReportCard title="Leads By Status" items={STAGES.map(stage => ({ label: stage.label, value: leads.filter(lead => getStage(lead) === stage.id).length }))} />
            <ReportCard title="Lead Sources" items={Object.entries(leads.reduce((acc, lead) => ({ ...acc, [lead.source || 'Unknown']: (acc[lead.source || 'Unknown'] || 0) + 1 }), {})).map(([label, value]) => ({ label, value }))} />
          </section>
        )}
      </main>
    </div>
  );
};

const InfoTile = ({ label, value, icon: Icon }) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"><Icon className="h-3.5 w-3.5" />{label}</p>
    <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
  </div>
);

const TextPanel = ({ title, text }) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
    <h3 className="font-semibold">{title}</h3>
    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{text}</p>
  </div>
);

const ReportCard = ({ title, items }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className="mt-4 space-y-3">
      {items.map(item => (
        <div key={item.label} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
          <span className="text-slate-600">{item.label}</span>
          <span className="font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

export default MarketingDashboard;
