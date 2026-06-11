// =============================================
// src/components/Admin/LeadManagement.jsx
// Lead management for advertising and digital marketing sales
// =============================================
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { db } from '../../firebase-config';
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  CalendarClock,
  CheckCircle,
  Clock,
  Edit3,
  FileText,
  IndianRupee,
  Mail,
  Megaphone,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  Target,
  Trash2,
  UserRound,
  X
} from 'lucide-react';

const LEAD_PATH = 'leads';
const TEMPLATE_PATH = 'leadMessageTemplates';

const LEAD_STAGES = [
  { id: 'new', label: 'New', tone: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'contacted', label: 'Contacted', tone: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { id: 'qualified', label: 'Qualified', tone: 'bg-violet-100 text-violet-800 border-violet-200' },
  { id: 'proposal', label: 'Proposal Sent', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'negotiation', label: 'Negotiation', tone: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'won', label: 'Won', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'lost', label: 'Lost', tone: 'bg-rose-100 text-rose-800 border-rose-200' },
  { id: 'on_hold', label: 'On Hold', tone: 'bg-slate-100 text-slate-800 border-slate-200' }
];

const SERVICE_TYPES = [
  { id: 'advertising', label: 'Advertisement', icon: Megaphone },
  { id: 'digital_marketing', label: 'Digital Marketing', icon: Target },
  { id: 'combined', label: 'Ads + Digital Marketing', icon: Briefcase }
];

const PACKAGE_OPTIONS = {
  advertising: [
    'Single advertisement',
    'Two advertisement bundle',
    'Monthly banner package',
    'Monthly sponsored content package',
    'Quarterly campaign package',
    'Yearly brand visibility package',
    'Custom advertising plan'
  ],
  digital_marketing: [
    'Social media management',
    'Meta ads management',
    'Google ads management',
    'SEO and content package',
    'Brand launch campaign',
    'Monthly digital growth package',
    'Yearly digital marketing retainer',
    'Custom digital plan'
  ],
  combined: [
    'Launch campaign package',
    'Monthly ads + marketing package',
    'Quarterly growth campaign',
    'Yearly brand partnership',
    'Custom integrated package'
  ]
};

const SOURCES = [
  'Walk-in',
  'Phone call',
  'WhatsApp',
  'Email',
  'Website',
  'Instagram',
  'Facebook',
  'Referral',
  'Existing client',
  'Field sales',
  'Event',
  'Other'
];

const PRIORITIES = [
  { id: 'hot', label: 'Hot', tone: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'warm', label: 'Warm', tone: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'cold', label: 'Cold', tone: 'bg-slate-100 text-slate-700 border-slate-200' }
];

const MESSAGE_TRIGGERS = [
  { id: 'lead_created', label: 'New lead captured' },
  { id: 'lead_updated', label: 'Lead updated' },
  { id: 'stage_contacted', label: 'Stage becomes Contacted' },
  { id: 'stage_qualified', label: 'Stage becomes Qualified' },
  { id: 'stage_proposal', label: 'Stage becomes Proposal Sent' },
  { id: 'stage_negotiation', label: 'Stage becomes Negotiation' },
  { id: 'stage_won', label: 'Stage becomes Won' },
  { id: 'followup_due', label: 'Follow-up date is due' }
];

const MESSAGE_AUDIENCES = [
  { id: 'admin-leads', label: 'Admin lead team' },
  { id: 'all-news', label: 'All app users' },
  { id: 'breaking-news', label: 'Breaking-news subscribers' }
];

const EMPTY_FORM = {
  companyName: '',
  contactName: '',
  phone: '',
  email: '',
  city: 'Vadodara',
  businessCategory: '',
  source: 'WhatsApp',
  serviceType: 'advertising',
  packageInterest: 'Monthly banner package',
  budget: '',
  expectedValue: '',
  stage: 'new',
  priority: 'warm',
  followUpDate: '',
  expectedCloseDate: '',
  assignedTo: '',
  probability: 30,
  communicationPreference: 'WhatsApp',
  lastContactedAt: '',
  requirements: '',
  notes: '',
  lossReason: ''
};

const EMPTY_TEMPLATE = {
  name: '',
  title: '',
  editorMode: 'rich',
  richText: '',
  html: '',
  triggers: ['lead_created'],
  audienceTopic: 'admin-leads',
  enabled: true
};

const getStage = (lead) => lead.stage || lead.status || 'new';
const getStageConfig = (stage) => LEAD_STAGES.find(item => item.id === stage) || LEAD_STAGES[0];
const getPriorityConfig = (priority) => PRIORITIES.find(item => item.id === priority) || PRIORITIES[1];

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Not set';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (value, fallback = 'Not set') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isFollowUpDue = (lead) => {
  const stage = getStage(lead);
  if (!lead.followUpDate || ['won', 'lost'].includes(stage)) return false;
  return new Date(`${lead.followUpDate}T23:59:59`) <= new Date();
};

const normalizeLead = ([id, value]) => ({
  id,
  ...value,
  stage: value.stage || value.status || 'new',
  priority: value.priority === 'high' ? 'hot' : value.priority === 'low' ? 'cold' : value.priority || 'warm'
});

const LeadManagement = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE);
  const [showForm, setShowForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [templateErrors, setTemplateErrors] = useState({});
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    const leadsRef = ref(db, LEAD_PATH);
    const unsubscribe = onValue(leadsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(normalizeLead) : [];
      list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
      setLeads(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const templatesRef = ref(db, TEMPLATE_PATH);
    const unsubscribe = onValue(templatesRef, (snapshot) => {
      const data = snapshot.val();
      const list = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];
      list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
      setTemplates(list);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const activeStages = new Set(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'on_hold']);
    const activeLeads = leads.filter(lead => activeStages.has(getStage(lead)));
    return {
      total: leads.length,
      active: activeLeads.length,
      hot: leads.filter(lead => lead.priority === 'hot').length,
      won: leads.filter(lead => getStage(lead) === 'won').length,
      pipelineValue: activeLeads.reduce((sum, lead) => sum + (Number(lead.expectedValue) || Number(lead.budget) || 0), 0),
      followUpsDue: leads.filter(isFollowUpDue).length
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const text = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const stage = getStage(lead);
      const matchesStage = stageFilter === 'all' || stage === stageFilter;
      const matchesService = serviceFilter === 'all' || lead.serviceType === serviceFilter;
      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
      const haystack = [
        lead.companyName,
        lead.contactName,
        lead.phone,
        lead.email,
        lead.city,
        lead.businessCategory,
        lead.packageInterest,
        lead.requirements,
        lead.notes
      ].filter(Boolean).join(' ').toLowerCase();
      return matchesStage && matchesService && matchesPriority && (!text || haystack.includes(text));
    });
  }, [leads, query, stageFilter, serviceFilter, priorityFilter]);

  const updateField = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'serviceType') {
        next.packageInterest = PACKAGE_OPTIONS[value]?.[0] || '';
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null, contact: null, submit: null }));
  };

  const updateTemplateField = (field, value) => {
    setTemplateForm(prev => ({ ...prev, [field]: value }));
    setTemplateErrors(prev => ({ ...prev, [field]: null, submit: null }));
  };

  const toggleTemplateTrigger = (triggerId) => {
    setTemplateForm(prev => {
      const triggers = Array.isArray(prev.triggers) ? prev.triggers : [];
      const nextTriggers = triggers.includes(triggerId)
        ? triggers.filter(item => item !== triggerId)
        : [...triggers, triggerId];
      return { ...prev, triggers: nextTriggers.length ? nextTriggers : [triggerId] };
    });
    setTemplateErrors(prev => ({ ...prev, triggers: null, submit: null }));
  };

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM, assignedTo: user?.displayName || user?.email || '' });
    setEditingLead(null);
    setErrors({});
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const resetTemplateForm = () => {
    setTemplateForm(EMPTY_TEMPLATE);
    setEditingTemplate(null);
    setTemplateErrors({});
  };

  const openTemplateForm = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        ...EMPTY_TEMPLATE,
        ...template,
        triggers: Array.isArray(template.triggers) && template.triggers.length ? template.triggers : ['lead_created']
      });
    } else {
      resetTemplateForm();
    }
    setShowTemplateForm(true);
  };

  const openEditForm = (lead) => {
    const stage = getStage(lead);
    setEditingLead(lead);
    setFormData({
      ...EMPTY_FORM,
      ...lead,
      stage,
      budget: lead.budget ?? '',
      expectedValue: lead.expectedValue ?? '',
      expectedCloseDate: lead.expectedCloseDate || '',
      assignedTo: lead.assignedTo || user?.displayName || user?.email || ''
    });
    setErrors({});
    setShowForm(true);
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.companyName.trim()) nextErrors.companyName = 'Company or brand name is required';
    if (!formData.contactName.trim()) nextErrors.contactName = 'Contact person is required';
    if (!formData.phone.trim() && !formData.email.trim()) nextErrors.contact = 'Phone or email is required';
    if (!formData.packageInterest.trim()) nextErrors.packageInterest = 'Select package interest';
    if (formData.stage === 'lost' && !formData.lossReason.trim()) nextErrors.lossReason = 'Add a reason for lost leads';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateTemplateForm = () => {
    const nextErrors = {};
    if (!templateForm.name.trim()) nextErrors.name = 'Template name is required';
    if (!templateForm.title.trim()) nextErrors.title = 'Notification title is required';
    if (templateForm.editorMode === 'html' && !templateForm.html.trim()) nextErrors.body = 'HTML message is required';
    if (templateForm.editorMode === 'rich' && !templateForm.richText.trim()) nextErrors.body = 'Rich text message is required';
    if (!Array.isArray(templateForm.triggers) || templateForm.triggers.length === 0) nextErrors.triggers = 'Select at least one trigger';
    setTemplateErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildActivityEntry = (message, note) => ({
    message,
    note: note || '',
    at: new Date().toISOString(),
    by: user?.displayName || user?.email || 'Admin',
    byUid: user?.uid || null
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const adminName = user?.displayName || user?.email || 'Admin';
      const previousStage = editingLead ? getStage(editingLead) : null;
      const message = editingLead
        ? previousStage !== formData.stage
          ? `Stage changed from ${getStageConfig(previousStage).label} to ${getStageConfig(formData.stage).label}`
          : 'Lead updated'
        : 'Lead created';
      const activityLog = Array.isArray(editingLead?.activityLog)
        ? editingLead.activityLog
        : Array.isArray(editingLead?.history)
          ? editingLead.history.map(item => ({
              message: 'Note added',
              note: item.text || item.note || '',
              at: item.at || now,
              by: item.by || 'Admin',
              byUid: item.byUid || null
            }))
          : [];

      const payload = {
        ...formData,
        stage: formData.stage,
        status: formData.stage,
        budget: formData.budget === '' ? null : Number(formData.budget),
        expectedValue: formData.expectedValue === '' ? null : Number(formData.expectedValue),
        probability: formData.probability === '' ? null : Number(formData.probability),
        updatedAt: now,
        updatedBy: user?.uid || null,
        updatedByName: adminName,
        lastActivityAt: now
      };

      const nextActivity = [...activityLog, buildActivityEntry(message, formData.notes.trim())].slice(-30);

      if (editingLead) {
        await update(ref(db, `${LEAD_PATH}/${editingLead.id}`), {
          ...payload,
          activityLog: nextActivity
        });
      } else {
        await push(ref(db, LEAD_PATH), {
          ...payload,
          createdAt: now,
          createdBy: user?.uid || null,
          createdByName: adminName,
          activityLog: nextActivity
        });
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving lead:', error);
      setErrors({ submit: 'Unable to save lead. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSubmit = async (event) => {
    event.preventDefault();
    if (!validateTemplateForm()) return;

    setTemplateSaving(true);
    try {
      const now = new Date().toISOString();
      const adminName = user?.displayName || user?.email || 'Admin';
      const payload = {
        ...templateForm,
        name: templateForm.name.trim(),
        title: templateForm.title.trim(),
        richText: templateForm.richText.trim(),
        html: templateForm.html.trim(),
        triggers: templateForm.triggers,
        updatedAt: now,
        updatedBy: user?.uid || null,
        updatedByName: adminName
      };

      if (editingTemplate) {
        await update(ref(db, `${TEMPLATE_PATH}/${editingTemplate.id}`), payload);
      } else {
        await push(ref(db, TEMPLATE_PATH), {
          ...payload,
          createdAt: now,
          createdBy: user?.uid || null,
          createdByName: adminName
        });
      }

      resetTemplateForm();
      setShowTemplateForm(false);
    } catch (error) {
      console.error('Error saving message template:', error);
      setTemplateErrors({ submit: 'Unable to save message template. Please try again.' });
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleQuickStage = async (lead, stage) => {
    const now = new Date().toISOString();
    const activityLog = Array.isArray(lead.activityLog) ? lead.activityLog : [];
    try {
      await update(ref(db, `${LEAD_PATH}/${lead.id}`), {
        stage,
        status: stage,
        updatedAt: now,
        updatedBy: user?.uid || null,
        updatedByName: user?.displayName || user?.email || 'Admin',
        lastActivityAt: now,
        activityLog: [
          ...activityLog,
          buildActivityEntry(`Stage changed to ${getStageConfig(stage).label}`, '')
        ].slice(-30)
      });
    } catch (error) {
      console.error('Error updating lead stage:', error);
    }
  };

  const handleQuickActivity = async (lead, message, updates = {}) => {
    const now = new Date().toISOString();
    const activityLog = Array.isArray(lead.activityLog) ? lead.activityLog : [];
    try {
      await update(ref(db, `${LEAD_PATH}/${lead.id}`), {
        ...updates,
        updatedAt: now,
        updatedBy: user?.uid || null,
        updatedByName: user?.displayName || user?.email || 'Admin',
        lastActivityAt: now,
        activityLog: [
          ...activityLog,
          buildActivityEntry(message, updates.notes || '')
        ].slice(-30)
      });
    } catch (error) {
      console.error('Error adding lead activity:', error);
    }
  };

  const handleDelete = async (lead) => {
    if (!window.confirm(`Delete lead for ${lead.companyName}?`)) return;
    await remove(ref(db, `${LEAD_PATH}/${lead.id}`));
  };

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Delete message template "${template.name}"?`)) return;
    await remove(ref(db, `${TEMPLATE_PATH}/${template.id}`));
  };

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage advertisement enquiries, package sales, digital marketing leads, and follow-ups.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openTemplateForm()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50 dark:border-blue-900 dark:bg-gray-900 dark:text-blue-300"
          >
            <MessageSquare className="h-4 w-4" />
            Message Template
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          { label: 'Total Leads', value: stats.total, icon: Briefcase, tone: 'text-blue-600 bg-blue-50' },
          { label: 'Active Pipeline', value: stats.active, icon: BarChart3, tone: 'text-violet-600 bg-violet-50' },
          { label: 'Hot Leads', value: stats.hot, icon: Target, tone: 'text-red-600 bg-red-50' },
          { label: 'Won', value: stats.won, icon: CheckCircle, tone: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pipeline Value', value: formatCurrency(stats.pipelineValue), icon: IndianRupee, tone: 'text-amber-600 bg-amber-50' },
          { label: 'Follow-ups Due', value: stats.followUpsDue, icon: CalendarClock, tone: 'text-rose-600 bg-rose-50' }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
                  <p className="mt-2 truncate text-2xl font-bold text-gray-950 dark:text-white">{item.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${item.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-semibold">{editingLead ? 'Edit Lead' : 'Add New Lead'}</h2>
              <p className="text-sm text-gray-500">Capture client details, sales intent, proposal value, and next action.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              aria-label="Close lead form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 p-5 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Client Details</h3>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Company / Brand *</label>
              <input
                value={formData.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder="e.g. ABC Jewellers"
              />
              {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Contact Person *</label>
              <input
                value={formData.contactName}
                onChange={(e) => updateField('contactName', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Decision maker name"
              />
              {errors.contactName && <p className="mt-1 text-xs text-red-600">{errors.contactName}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Business Category</label>
              <input
                value={formData.businessCategory}
                onChange={(e) => updateField('businessCategory', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Retail, education, real estate..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone / WhatsApp</label>
              <input
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder="+91..."
              />
              {errors.contact && <p className="mt-1 text-xs text-red-600">{errors.contact}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">City</label>
              <input
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Interest & Package</h3>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Lead Source</label>
              <select
                value={formData.source}
                onChange={(e) => updateField('source', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              >
                {SOURCES.map(source => <option key={source} value={source}>{source}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Service Interest</label>
              <select
                value={formData.serviceType}
                onChange={(e) => updateField('serviceType', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              >
                {SERVICE_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Package Interest *</label>
              <select
                value={formData.packageInterest}
                onChange={(e) => updateField('packageInterest', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              >
                {(PACKAGE_OPTIONS[formData.serviceType] || []).map(item => <option key={item} value={item}>{item}</option>)}
              </select>
              {errors.packageInterest && <p className="mt-1 text-xs text-red-600">{errors.packageInterest}</p>}
            </div>

            <div className="lg:col-span-3">
              <label className="mb-1.5 block text-sm font-medium">Requirement Summary</label>
              <textarea
                rows={3}
                value={formData.requirements}
                onChange={(e) => updateField('requirements', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Campaign objective, target audience, preferred ad slots, social media needs..."
              />
            </div>

            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Sales Tracking</h3>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Budget Mentioned</label>
              <input
                type="number"
                min="0"
                value={formData.budget}
                onChange={(e) => updateField('budget', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder="INR"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Expected Deal Value</label>
              <input
                type="number"
                min="0"
                value={formData.expectedValue}
                onChange={(e) => updateField('expectedValue', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder="INR"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Expected Close Date</label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => updateField('expectedCloseDate', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Pipeline Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => updateField('stage', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              >
                {LEAD_STAGES.map(stage => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => updateField('priority', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              >
                {PRIORITIES.map(priority => <option key={priority.id} value={priority.id}>{priority.label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Next Follow-up</label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => updateField('followUpDate', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Assigned To</label>
              <input
                value={formData.assignedTo}
                onChange={(e) => updateField('assignedTo', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Win Probability</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => updateField('probability', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder="0-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Preferred Communication</label>
              <select
                value={formData.communicationPreference}
                onChange={(e) => updateField('communicationPreference', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              >
                {['WhatsApp', 'Phone call', 'Email', 'In-person meeting'].map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Last Contacted</label>
              <input
                type="date"
                value={formData.lastContactedAt}
                onChange={(e) => updateField('lastContactedAt', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            {formData.stage === 'lost' && (
              <div className="lg:col-span-3">
                <label className="mb-1.5 block text-sm font-medium">Lost Reason *</label>
                <input
                  value={formData.lossReason}
                  onChange={(e) => updateField('lossReason', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Budget, no response, competitor, not relevant..."
                />
                {errors.lossReason && <p className="mt-1 text-xs text-red-600">{errors.lossReason}</p>}
              </div>
            )}

            <div className="lg:col-span-3">
              <label className="mb-1.5 block text-sm font-medium">Latest Notes / Conversation Summary</label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Client requirement, proposal sent, objections, next action..."
              />
            </div>

            {errors.submit && (
              <div className="lg:col-span-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {errors.submit}
              </div>
            )}

            <div className="flex justify-end gap-3 lg:col-span-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingLead ? 'Update Lead' : 'Create Lead'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Lead Message Automation
            </h2>
            <p className="text-sm text-gray-500">
              Create rich text or HTML push messages and choose the lead triggers that send them.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openTemplateForm()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Message
          </button>
        </div>

        {showTemplateForm && (
          <form onSubmit={handleTemplateSubmit} className="grid gap-5 border-b border-gray-200 p-5 dark:border-gray-700 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Template Name *</label>
              <input
                value={templateForm.name}
                onChange={(e) => updateTemplateField('name', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Hot lead alert"
              />
              {templateErrors.name && <p className="mt-1 text-xs text-red-600">{templateErrors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Push Title *</label>
              <input
                value={templateForm.title}
                onChange={(e) => updateTemplateField('title', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder="New advertising lead"
              />
              {templateErrors.title && <p className="mt-1 text-xs text-red-600">{templateErrors.title}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Audience Topic</label>
              <select
                value={templateForm.audienceTopic}
                onChange={(e) => updateTemplateField('audienceTopic', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              >
                {MESSAGE_AUDIENCES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="mb-2 block text-sm font-medium">Editor Mode</label>
              <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
                {[
                  { id: 'rich', label: 'Rich text' },
                  { id: 'html', label: 'HTML' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => updateTemplateField('editorMode', mode.id)}
                    className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                      templateForm.editorMode === mode.id ? 'bg-white text-blue-700 shadow-sm dark:bg-gray-900' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="mb-1.5 block text-sm font-medium">
                {templateForm.editorMode === 'html' ? 'HTML Message *' : 'Rich Text Message *'}
              </label>
              <textarea
                rows={templateForm.editorMode === 'html' ? 8 : 5}
                value={templateForm.editorMode === 'html' ? templateForm.html : templateForm.richText}
                onChange={(e) => updateTemplateField(templateForm.editorMode === 'html' ? 'html' : 'richText', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                placeholder={templateForm.editorMode === 'html' ? '<strong>{{companyName}}</strong> needs follow-up.' : '{{companyName}} from {{city}} needs a follow-up. Package: {{packageInterest}}'}
              />
              <p className="mt-1 text-xs text-gray-500">
                Variables: {'{{companyName}}'}, {'{{contactName}}'}, {'{{city}}'}, {'{{stage}}'}, {'{{packageInterest}}'}, {'{{followUpDate}}'}
              </p>
              {templateErrors.body && <p className="mt-1 text-xs text-red-600">{templateErrors.body}</p>}
            </div>

            <div className="lg:col-span-3">
              <label className="mb-2 block text-sm font-medium">Send Triggers *</label>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {MESSAGE_TRIGGERS.map(trigger => (
                  <label key={trigger.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                    <input
                      type="checkbox"
                      checked={templateForm.triggers.includes(trigger.id)}
                      onChange={() => toggleTemplateTrigger(trigger.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span>{trigger.label}</span>
                  </label>
                ))}
              </div>
              {templateErrors.triggers && <p className="mt-1 text-xs text-red-600">{templateErrors.triggers}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={templateForm.enabled}
                onChange={(e) => updateTemplateField('enabled', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              Enabled
            </label>

            {templateErrors.submit && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-3">
                <AlertCircle className="h-4 w-4" />
                {templateErrors.submit}
              </div>
            )}

            <div className="flex justify-end gap-3 lg:col-span-3">
              <button
                type="button"
                onClick={() => {
                  resetTemplateForm();
                  setShowTemplateForm(false);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={templateSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {templateSaving ? 'Saving...' : editingTemplate ? 'Update Message' : 'Create Message'}
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-3 p-5 xl:grid-cols-2">
          {templates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 xl:col-span-2">
              No message templates yet. Create one to automate lead push updates.
            </div>
          ) : templates.map(template => (
            <div key={template.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-950 dark:text-white">{template.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${template.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {template.enabled ? 'Enabled' : 'Paused'}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {template.editorMode === 'html' ? 'HTML' : 'Rich text'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">{template.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                    {template.editorMode === 'html' ? template.html : template.richText}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(template.triggers || []).map(trigger => (
                      <span key={trigger} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {MESSAGE_TRIGGERS.find(item => item.id === trigger)?.label || trigger}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openTemplateForm(template)}
                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                    aria-label={`Edit message template ${template.name}`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(template)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    aria-label={`Delete message template ${template.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="grid gap-3 xl:grid-cols-[1fr_180px_220px_160px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Search brand, person, phone, package, requirement..."
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="all">All Stages</option>
            {LEAD_STAGES.map(stage => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="all">All Services</option>
            {SERVICE_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="all">All Priority</option>
            {PRIORITIES.map(priority => <option key={priority.id} value={priority.id}>{priority.label}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-lg font-semibold">No leads found</h3>
            <p className="mt-1 text-sm text-gray-500">Create a lead or adjust your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLeads.map((lead) => {
              const stage = getStageConfig(getStage(lead));
              const priority = getPriorityConfig(lead.priority);
              const service = SERVICE_TYPES.find(type => type.id === lead.serviceType);
              const ServiceIcon = service?.icon || Briefcase;
              const due = isFollowUpDue(lead);

              return (
                <div key={lead.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-semibold text-gray-950 dark:text-white">{lead.companyName}</h3>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${stage.tone}`}>
                          {stage.label}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${priority.tone}`}>
                          {priority.label}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4" />{lead.contactName || 'No contact name'}</span>
                        <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" />{lead.phone || 'No phone'}</span>
                        {lead.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" />{lead.email}</span>}
                        <span className="inline-flex items-center gap-1.5"><ServiceIcon className="h-4 w-4" />{service?.label || lead.serviceType || 'Service not set'}</span>
                        <span className="inline-flex items-center gap-1.5"><IndianRupee className="h-4 w-4" />{formatCurrency(lead.expectedValue || lead.budget)}</span>
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-4">
                        <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Package</p>
                          <p className="mt-1 font-medium">{lead.packageInterest || 'Not set'}</p>
                        </div>
                        <div className={`rounded-lg p-3 text-sm ${due ? 'bg-rose-50 text-rose-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Follow-up</p>
                          <p className="mt-1 inline-flex items-center gap-1 font-medium"><Clock className="h-4 w-4" />{formatDate(lead.followUpDate, 'No follow-up')}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Close Target</p>
                          <p className="mt-1 font-medium">{formatDate(lead.expectedCloseDate, 'Not set')}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Source / Owner</p>
                          <p className="mt-1 font-medium">{lead.source || 'Unknown'} / {lead.assignedTo || 'Unassigned'}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-3">
                        <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Probability</p>
                          <p className="mt-1 font-medium">{lead.probability ?? 0}%</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Preferred Channel</p>
                          <p className="mt-1 font-medium">{lead.communicationPreference || 'Not set'}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Last Contacted</p>
                          <p className="mt-1 font-medium">{formatDate(lead.lastContactedAt, 'Not contacted')}</p>
                        </div>
                      </div>

                      {lead.requirements && <p className="mt-3 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">{lead.requirements}</p>}
                      {lead.notes && <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{lead.notes}</p>}
                      {Array.isArray(lead.activityLog) && lead.activityLog.length > 0 && (
                        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <FileText className="h-3.5 w-3.5" />
                            Recent Activity
                          </p>
                          <div className="space-y-2">
                            {lead.activityLog.slice(-3).reverse().map((activity, index) => (
                              <div key={`${activity.at || 'activity'}-${index}`} className="text-gray-600 dark:text-gray-300">
                                <span className="font-medium text-gray-900 dark:text-white">{activity.message}</span>
                                {activity.note && <span className="text-gray-500"> - {activity.note}</span>}
                                <span className="ml-2 text-xs text-gray-400">{formatDate(activity.at, '')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <button
                        type="button"
                        onClick={() => handleQuickActivity(lead, 'Lead contacted', {
                          stage: getStage(lead) === 'new' ? 'contacted' : getStage(lead),
                          status: getStage(lead) === 'new' ? 'contacted' : getStage(lead),
                          lastContactedAt: new Date().toISOString().slice(0, 10)
                        })}
                        className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        Contacted
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          handleQuickActivity(lead, 'Follow-up scheduled for tomorrow', {
                            followUpDate: tomorrow.toISOString().slice(0, 10)
                          });
                        }}
                        className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
                      >
                        Follow-up
                      </button>
                      <select
                        value={getStage(lead)}
                        onChange={(e) => handleQuickStage(lead, e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      >
                        {LEAD_STAGES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => openEditForm(lead)}
                        className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                        aria-label={`Edit lead for ${lead.companyName}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lead)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                        aria-label={`Delete lead for ${lead.companyName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadManagement;
