import React, { useEffect, useMemo, useState } from 'react';
import { onValue, push, ref, remove, set, update } from 'firebase/database';
import {
  AlertCircle,
  BarChart3,
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle,
  ChevronLeft,
  Clock,
  Download,
  Edit3,
  FileText,
  Filter,
  IndianRupee,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Save,
  Search,
  Send,
  Smartphone,
  Target,
  Trash2,
  Workflow,
  X
} from 'lucide-react';
import { db, functions, httpsCallable } from '../../firebase-config';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';

const LEAD_PATH = 'leads';
const TEMPLATE_PATH = 'leadMessageTemplates';
const BOTNEX_SETTINGS_PATH = 'integrations/botnex';

const STAGES = [
  { id: 'new', label: 'New', tone: 'bg-blue-50 text-blue-700 border-blue-100', probability: 20 },
  { id: 'contacted', label: 'Contacted', tone: 'bg-cyan-50 text-cyan-700 border-cyan-100', probability: 30 },
  { id: 'qualified', label: 'Qualified', tone: 'bg-violet-50 text-violet-700 border-violet-100', probability: 45 },
  { id: 'proposal', label: 'Proposal', tone: 'bg-amber-50 text-amber-700 border-amber-100', probability: 60 },
  { id: 'negotiation', label: 'Negotiation', tone: 'bg-orange-50 text-orange-700 border-orange-100', probability: 75 },
  { id: 'won', label: 'Won', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100', probability: 100 },
  { id: 'lost', label: 'Lost', tone: 'bg-rose-50 text-rose-700 border-rose-100', probability: 0 },
  { id: 'on_hold', label: 'On Hold', tone: 'bg-slate-50 text-slate-700 border-slate-100', probability: 25 }
];

const PRIORITIES = [
  { id: 'hot', label: 'Hot', tone: 'bg-red-50 text-red-700 border-red-100' },
  { id: 'warm', label: 'Warm', tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  { id: 'cold', label: 'Cold', tone: 'bg-slate-50 text-slate-700 border-slate-100' }
];

const SERVICE_TYPES = [
  { id: 'advertising', label: 'Advertisement' },
  { id: 'digital_marketing', label: 'Digital Marketing' },
  { id: 'combined', label: 'Ads + Digital Marketing' }
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
  'Website',
  'WhatsApp',
  'Phone call',
  'Walk-in',
  'Instagram',
  'Facebook',
  'Referral',
  'Field sales',
  'Existing client',
  'Event',
  'Other'
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
  { id: 'stage_negotiation', label: 'Stage becomes Negotiation' },
  { id: 'stage_won', label: 'Stage becomes Won' },
  { id: 'followup_due', label: 'Follow-up due' }
];

const TEMPLATE_STARTERS = [
  {
    id: 'instant',
    label: 'Instant enquiry reply',
    name: 'Instant WhatsApp reply',
    title: 'New enquiry received',
    channels: ['whatsapp'],
    triggers: ['lead_created'],
    whatsAppMessageType: 'buttons',
    buttons: 'View Packages,Talk to Sales,Call Me',
    richText: 'Hi {{contactName}}, thank you for contacting Our Vadodara. We received your enquiry for {{packageInterest}}. Our team will reach out shortly. You can choose an option below so we can help faster.'
  },
  {
    id: 'proposal',
    label: 'Proposal follow-up',
    name: 'Proposal follow-up',
    title: 'Proposal follow-up',
    channels: ['whatsapp'],
    triggers: ['stage_proposal'],
    whatsAppMessageType: 'buttons',
    buttons: 'Looks Good,Need Changes,Talk to Sales',
    richText: 'Hi {{contactName}}, we hope the Our Vadodara proposal for {{companyName}} was helpful. Would you like us to make any changes or help you finalize the campaign?'
  },
  {
    id: 'team',
    label: 'Team alert',
    name: 'New lead team alert',
    title: 'New advertising lead',
    channels: ['push'],
    triggers: ['lead_created'],
    whatsAppMessageType: 'text',
    buttons: 'Interested,Share Packages,Talk to Sales',
    richText: '{{companyName}} from {{city}} submitted an enquiry for {{packageInterest}}. Contact person: {{contactName}}.'
  }
];

const PERSONALIZATION_FIELDS = [
  { label: 'Contact', token: '{{contactName}}' },
  { label: 'Brand', token: '{{companyName}}' },
  { label: 'City', token: '{{city}}' },
  { label: 'Package', token: '{{packageInterest}}' },
  { label: 'Follow-up', token: '{{followUpDate}}' },
  { label: 'Owner', token: '{{assignedTo}}' }
];

const EMPTY_LEAD_FORM = {
  companyName: '',
  contactName: '',
  phone: '',
  email: '',
  city: 'Vadodara',
  businessCategory: '',
  source: 'Website',
  serviceType: 'advertising',
  packageInterest: 'Monthly banner package',
  budget: '',
  expectedValue: '',
  stage: 'new',
  priority: 'warm',
  followUpDate: '',
  expectedCloseDate: '',
  assignedTo: '',
  probability: 20,
  communicationPreference: 'WhatsApp',
  requirements: '',
  notes: '',
  lossReason: ''
};

const EMPTY_TEMPLATE = {
  name: 'Instant WhatsApp reply',
  title: 'New enquiry received',
  editorMode: 'rich',
  richText: 'Hi {{contactName}}, thank you for contacting Our Vadodara. We received your enquiry for {{packageInterest}} and our team will reach out shortly.',
  html: '',
  channels: ['whatsapp'],
  triggers: ['lead_created'],
  audienceTopic: 'admin-leads',
  phoneNumberId: '',
  whatsAppMessageType: 'text',
  botFlowUniqueId: '',
  buttons: 'Interested,Share Packages,Talk to Sales',
  enabled: true
};

const EMPTY_WHATSAPP_FORM = {
  messageType: 'text',
  message: 'Hello {{contactName}}, this is Our Vadodara. We received your enquiry for {{packageInterest}}. How can we help you today?',
  phoneNumberId: '',
  botFlowUniqueId: '',
  mediaUrl: '',
  mediaType: 'image',
  buttons: 'Interested,Share Packages,Talk to Sales'
};

const EMPTY_BOTNEX_SETTINGS = {
  phoneNumberId: '',
  accountLabel: 'Our Vadodara (+919099004346)'
};

const normalizeLead = ([id, lead]) => ({
  id,
  ...lead,
  stage: lead.stage || lead.status || 'new'
});

const getStage = (lead) => lead?.stage || lead?.status || 'new';
const getStageConfig = (stage) => STAGES.find(item => item.id === stage) || STAGES[0];
const getPriorityConfig = (priority) => PRIORITIES.find(item => item.id === priority) || PRIORITIES[1];

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Not set';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const formatDate = (value, fallback = 'Not set') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isDue = (lead) => {
  const stage = getStage(lead);
  if (!lead?.followUpDate || ['won', 'lost'].includes(stage)) return false;
  return new Date(`${lead.followUpDate}T23:59:59`) <= new Date();
};

const getFollowUps = (lead) => Array.isArray(lead?.followUps)
  ? lead.followUps
  : lead?.followUpDate
    ? [{
        id: 'legacy-follow-up',
        parentId: '',
        date: lead.followUpDate,
        note: lead.followUpNote || 'Follow-up scheduled',
        status: 'open',
        createdAt: lead.updatedAt || lead.createdAt || new Date().toISOString(),
        createdByName: lead.updatedByName || 'Marketing'
      }]
    : [];

const getNextOpenFollowUpDate = (followUps) => {
  const openItems = followUps
    .filter(item => item.status !== 'completed' && item.status !== 'cancelled' && item.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  return openItems[0]?.date || '';
};

const makeFollowUpId = () => `fu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const parseCommaButtons = (value) => String(value || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean)
  .slice(0, 3)
  .map(item => ({
    id: item.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || item,
    title: item.slice(0, 20)
  }));

const isValidPhoneNumberId = (value) => !String(value || '').trim() || /^\d{10,30}$/.test(String(value || '').trim());

const interpolateLeadText = (text, lead) => String(text || '').replace(/\{\{(\w+)\}\}/g, (_, key) => {
  const values = {
    companyName: lead?.companyName || '',
    contactName: lead?.contactName || '',
    city: lead?.city || '',
    stage: getStage(lead),
    packageInterest: lead?.packageInterest || '',
    followUpDate: lead?.followUpDate || '',
    assignedTo: lead?.assignedTo || '',
    serviceType: lead?.serviceType || ''
  };
  return values[key] || '';
});

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const MarketingDashboard = () => {
  const { user } = useEnhancedAuth();
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [botnexSettings, setBotnexSettings] = useState(EMPTY_BOTNEX_SETTINGS);
  const [botnexSaving, setBotnexSaving] = useState(false);
  const [botnexMessage, setBotnexMessage] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [leadForm, setLeadForm] = useState(EMPTY_LEAD_FORM);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpParentId, setFollowUpParentId] = useState('');
  const [whatsAppForm, setWhatsAppForm] = useState(EMPTY_WHATSAPP_FORM);
  const [whatsAppSending, setWhatsAppSending] = useState(false);
  const [whatsAppResult, setWhatsAppResult] = useState(null);
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateError, setTemplateError] = useState('');

  useEffect(() => {
    const unsubscribe = onValue(ref(db, LEAD_PATH), (snapshot) => {
      const list = snapshot.val() ? Object.entries(snapshot.val()).map(normalizeLead) : [];
      list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
      setLeads(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, TEMPLATE_PATH), (snapshot) => {
      const list = snapshot.val()
        ? Object.entries(snapshot.val()).map(([id, value]) => ({ id, ...value }))
        : [];
      list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
      setTemplates(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, BOTNEX_SETTINGS_PATH), (snapshot) => {
      setBotnexSettings({ ...EMPTY_BOTNEX_SETTINGS, ...(snapshot.val() || {}) });
    });
    return () => unsubscribe();
  }, []);

  const selectedLead = useMemo(
    () => leads.find(lead => lead.id === selectedLeadId) || null,
    [leads, selectedLeadId]
  );

  const templatePreviewLead = useMemo(() => ({
    companyName: 'Shree Foods',
    contactName: 'Riya Shah',
    city: 'Vadodara',
    packageInterest: 'Monthly banner package',
    followUpDate: new Date().toISOString().slice(0, 10),
    assignedTo: user?.displayName || user?.email || 'Sales team',
    serviceType: 'advertising'
  }), [user]);

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
          lead.businessCategory,
          lead.packageInterest,
          lead.requirements,
          lead.notes
        ].filter(Boolean).join(' ').toLowerCase();

        return (!text || haystack.includes(text))
          && (stageFilter === 'all' || getStage(lead) === stageFilter)
          && (priorityFilter === 'all' || lead.priority === priorityFilter)
          && (serviceFilter === 'all' || lead.serviceType === serviceFilter)
          && (channelFilter === 'all' || (lead.communicationPreference || '').toLowerCase() === channelFilter)
          && (!from || createdAt >= from)
          && (!to || createdAt <= to);
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
  }, [leads, query, stageFilter, priorityFilter, serviceFilter, channelFilter, dateFrom, dateTo, sortBy, sortDirection]);

  const stats = useMemo(() => {
    const active = leads.filter(lead => !['won', 'lost'].includes(getStage(lead)));
    const won = leads.filter(lead => getStage(lead) === 'won').length;
    const closed = leads.filter(lead => ['won', 'lost'].includes(getStage(lead))).length;
    return {
      total: leads.length,
      active: active.length,
      due: leads.filter(isDue).length,
      hot: leads.filter(lead => lead.priority === 'hot').length,
      won,
      winRate: closed ? Math.round((won / closed) * 100) : 0,
      value: active.reduce((sum, lead) => sum + (Number(lead.expectedValue) || Number(lead.budget) || 0), 0)
    };
  }, [leads]);

  const buildActivityEntry = (message, note = '') => ({
    message,
    note,
    at: new Date().toISOString(),
    by: user?.displayName || user?.email || 'Marketing',
    byUid: user?.uid || null
  });

  const updateLeadField = (field, value) => {
    setLeadForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'serviceType') {
        next.packageInterest = PACKAGE_OPTIONS[value]?.[0] || '';
      }
      if (field === 'stage') {
        next.probability = getStageConfig(value).probability;
      }
      return next;
    });
    setLeadError('');
  };

  const openLeadForm = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setLeadForm({
        ...EMPTY_LEAD_FORM,
        ...lead,
        stage: getStage(lead),
        budget: lead.budget ?? '',
        expectedValue: lead.expectedValue ?? '',
        expectedCloseDate: lead.expectedCloseDate || '',
        assignedTo: lead.assignedTo || user?.displayName || user?.email || ''
      });
    } else {
      setEditingLead(null);
      setLeadForm({
        ...EMPTY_LEAD_FORM,
        assignedTo: user?.displayName || user?.email || '',
        packageInterest: PACKAGE_OPTIONS.advertising[2]
      });
    }
    setLeadError('');
    setLeadFormOpen(true);
  };

  const closeLeadForm = () => {
    setLeadFormOpen(false);
    setEditingLead(null);
    setLeadForm(EMPTY_LEAD_FORM);
    setLeadError('');
  };

  const saveLead = async (event) => {
    event.preventDefault();
    if (!leadForm.companyName.trim()) {
      setLeadError('Company or brand name is required.');
      return;
    }
    if (!leadForm.contactName.trim()) {
      setLeadError('Contact person is required.');
      return;
    }
    if (!leadForm.phone.trim() && !leadForm.email.trim()) {
      setLeadError('Add at least a phone number or email.');
      return;
    }

    setLeadSaving(true);
    try {
      const now = new Date().toISOString();
      const previousStage = editingLead ? getStage(editingLead) : null;
      const stageChanged = editingLead && previousStage !== leadForm.stage;
      const activityLog = Array.isArray(editingLead?.activityLog) ? editingLead.activityLog : [];
      const message = editingLead
        ? stageChanged
          ? `Stage changed from ${getStageConfig(previousStage).label} to ${getStageConfig(leadForm.stage).label}`
          : 'Lead updated'
        : 'Lead created';
      const payload = {
        ...leadForm,
        companyName: leadForm.companyName.trim(),
        contactName: leadForm.contactName.trim(),
        phone: leadForm.phone.trim(),
        email: leadForm.email.trim(),
        stage: leadForm.stage,
        status: leadForm.stage,
        budget: leadForm.budget === '' ? null : Number(leadForm.budget),
        expectedValue: leadForm.expectedValue === '' ? null : Number(leadForm.expectedValue),
        probability: leadForm.probability === '' ? getStageConfig(leadForm.stage).probability : Number(leadForm.probability),
        updatedAt: now,
        updatedBy: user?.uid || null,
        updatedByName: user?.displayName || user?.email || 'Marketing',
        lastActivityAt: now,
        activityLog: [...activityLog, buildActivityEntry(message, leadForm.notes.trim())].slice(-40)
      };

      if (editingLead) {
        await update(ref(db, `${LEAD_PATH}/${editingLead.id}`), payload);
      } else {
        const newLeadRef = await push(ref(db, LEAD_PATH), {
          ...payload,
          createdAt: now,
          createdBy: user?.uid || null,
          createdByName: user?.displayName || user?.email || 'Marketing'
        });
        setSelectedLeadId(newLeadRef.key);
      }
      closeLeadForm();
    } catch (error) {
      console.error('Error saving lead:', error);
      setLeadError('Unable to save lead. Please try again.');
    } finally {
      setLeadSaving(false);
    }
  };

  const updateLeadStage = async (lead, stage) => {
    const now = new Date().toISOString();
    const activityLog = Array.isArray(lead.activityLog) ? lead.activityLog : [];
    await update(ref(db, `${LEAD_PATH}/${lead.id}`), {
      stage,
      status: stage,
      probability: getStageConfig(stage).probability,
      updatedAt: now,
      updatedBy: user?.uid || null,
      updatedByName: user?.displayName || user?.email || 'Marketing',
      lastActivityAt: now,
      activityLog: [...activityLog, buildActivityEntry(`Stage changed to ${getStageConfig(stage).label}`)].slice(-40)
    });
  };

  const addLeadNote = async (event) => {
    event.preventDefault();
    if (!selectedLead || !noteText.trim()) return;
    const now = new Date().toISOString();
    const activityLog = Array.isArray(selectedLead.activityLog) ? selectedLead.activityLog : [];
    await update(ref(db, `${LEAD_PATH}/${selectedLead.id}`), {
      notes: selectedLead.notes ? `${selectedLead.notes}\n${noteText.trim()}` : noteText.trim(),
      updatedAt: now,
      lastActivityAt: now,
      activityLog: [...activityLog, buildActivityEntry('Note added', noteText.trim())].slice(-40)
    });
    setNoteText('');
  };

  const scheduleFollowUp = async (event) => {
    event.preventDefault();
    if (!selectedLead || !followUpDate) return;
    const now = new Date().toISOString();
    const activityLog = Array.isArray(selectedLead.activityLog) ? selectedLead.activityLog : [];
    const existingFollowUps = getFollowUps(selectedLead).filter(item => item.id !== 'legacy-follow-up');
    const nextFollowUp = {
      id: makeFollowUpId(),
      parentId: followUpParentId,
      date: followUpDate,
      note: followUpNote.trim() || 'Follow-up scheduled',
      status: 'open',
      createdAt: now,
      createdBy: user?.uid || null,
      createdByName: user?.displayName || user?.email || 'Marketing',
      completedAt: '',
      completedByName: ''
    };
    const followUps = [...existingFollowUps, nextFollowUp];
    await update(ref(db, `${LEAD_PATH}/${selectedLead.id}`), {
      followUpDate: getNextOpenFollowUpDate(followUps),
      followUps,
      updatedAt: now,
      lastActivityAt: now,
      activityLog: [...activityLog, buildActivityEntry('Follow-up scheduled', `${formatDate(followUpDate)}${followUpParentId ? ' as next step' : ''}: ${nextFollowUp.note}`)].slice(-40)
    });
    setFollowUpDate('');
    setFollowUpNote('');
    setFollowUpParentId('');
  };

  const addFollowUpTomorrow = async (lead) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const existingFollowUps = getFollowUps(lead).filter(item => item.id !== 'legacy-follow-up');
    const followUps = [
      ...existingFollowUps,
      {
        id: makeFollowUpId(),
        parentId: '',
        date,
        note: 'Tomorrow',
        status: 'open',
        createdAt: now,
        createdBy: user?.uid || null,
        createdByName: user?.displayName || user?.email || 'Marketing',
        completedAt: '',
        completedByName: ''
      }
    ];
    await update(ref(db, `${LEAD_PATH}/${lead.id}`), {
      followUpDate: getNextOpenFollowUpDate(followUps),
      followUps,
      updatedAt: now,
      activityLog: [
        ...(Array.isArray(lead.activityLog) ? lead.activityLog : []),
        buildActivityEntry('Follow-up scheduled', 'Tomorrow')
      ].slice(-40)
    });
  };

  const updateFollowUpStatus = async (lead, followUpId, status) => {
    const now = new Date().toISOString();
    const followUps = getFollowUps(lead)
      .filter(item => item.id !== 'legacy-follow-up')
      .map(item => item.id === followUpId
        ? {
            ...item,
            status,
            completedAt: status === 'completed' ? now : item.completedAt || '',
            completedByName: status === 'completed' ? user?.displayName || user?.email || 'Marketing' : item.completedByName || ''
          }
        : item);
    const item = followUps.find(entry => entry.id === followUpId);
    await update(ref(db, `${LEAD_PATH}/${lead.id}`), {
      followUps,
      followUpDate: getNextOpenFollowUpDate(followUps),
      updatedAt: now,
      lastActivityAt: now,
      activityLog: [
        ...(Array.isArray(lead.activityLog) ? lead.activityLog : []),
        buildActivityEntry(`Follow-up ${status}`, item ? `${formatDate(item.date)}: ${item.note}` : '')
      ].slice(-40)
    });
  };

  const deleteLead = async (lead) => {
    if (!window.confirm(`Delete lead for ${lead.companyName || 'this company'}?`)) return;
    await remove(ref(db, `${LEAD_PATH}/${lead.id}`));
    if (selectedLeadId === lead.id) setSelectedLeadId('');
  };

  const resetTemplateForm = () => {
    setTemplateForm(EMPTY_TEMPLATE);
    setEditingTemplate(null);
    setTemplateError('');
  };

  const applyTemplateStarter = (starterId) => {
    const starter = TEMPLATE_STARTERS.find(item => item.id === starterId);
    if (!starter) return;
    setTemplateForm(prev => ({
      ...prev,
      ...starter,
      enabled: true,
      editorMode: 'rich',
      sendWhatsApp: starter.channels.includes('whatsapp'),
      sendPush: starter.channels.includes('push')
    }));
  };

  const insertTemplateVariable = (token) => {
    setTemplateForm(prev => ({
      ...prev,
      richText: `${prev.richText}${prev.richText.endsWith(' ') || !prev.richText ? '' : ' '}${token}`
    }));
  };

  const toggleTemplateArray = (field, value) => {
    setTemplateForm(prev => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const next = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
      return { ...prev, [field]: next.length ? next : [value] };
    });
  };

  const openTemplateEditor = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      ...EMPTY_TEMPLATE,
      ...template,
      editorMode: template.editorMode || (template.html ? 'html' : 'rich'),
      channels: Array.isArray(template.channels) && template.channels.length
        ? template.channels
        : template.sendWhatsApp
          ? ['whatsapp']
          : ['push'],
      triggers: Array.isArray(template.triggers) && template.triggers.length ? template.triggers : ['lead_created'],
      buttons: Array.isArray(template.buttons)
        ? template.buttons.map(button => button.title || button.label || button).join(',')
        : template.buttons || EMPTY_TEMPLATE.buttons
    });
    setTemplateError('');
  };

  const saveTemplate = async (event) => {
    event.preventDefault();
    const channels = Array.isArray(templateForm.channels) ? templateForm.channels : [];
    if (!templateForm.name.trim()) {
      setTemplateError('Template name is required.');
      return;
    }
    if (!channels.length) {
      setTemplateError('Select at least one channel.');
      return;
    }
    if (channels.includes('push') && !templateForm.title.trim()) {
      setTemplateError('Push notifications need a title.');
      return;
    }
    if (templateForm.editorMode === 'html' ? !templateForm.html.trim() : !templateForm.richText.trim()) {
      setTemplateError('Add message content.');
      return;
    }
    if (channels.includes('whatsapp') && templateForm.whatsAppMessageType === 'buttons' && parseCommaButtons(templateForm.buttons).length === 0) {
      setTemplateError('Button templates need at least one button.');
      return;
    }
    if (!isValidPhoneNumberId(templateForm.phoneNumberId)) {
      setTemplateError('Phone Number ID must be the numeric WhatsApp Phone Number ID, not the mobile number.');
      return;
    }

    setTemplateSaving(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        ...templateForm,
        name: templateForm.name.trim(),
        title: templateForm.title.trim(),
        richText: templateForm.richText.trim(),
        html: templateForm.html.trim(),
        channels,
        triggers: templateForm.triggers,
        sendWhatsApp: channels.includes('whatsapp'),
        sendPush: channels.includes('push'),
        buttons: parseCommaButtons(templateForm.buttons),
        phoneNumberId: templateForm.phoneNumberId.trim(),
        updatedAt: now,
        updatedBy: user?.uid || null,
        updatedByName: user?.displayName || user?.email || 'Marketing'
      };
      if (editingTemplate) {
        await update(ref(db, `${TEMPLATE_PATH}/${editingTemplate.id}`), payload);
      } else {
        await push(ref(db, TEMPLATE_PATH), {
          ...payload,
          createdAt: now,
          createdBy: user?.uid || null,
          createdByName: user?.displayName || user?.email || 'Marketing'
        });
      }
      resetTemplateForm();
    } catch (error) {
      console.error('Error saving template:', error);
      setTemplateError('Unable to save template. Please try again.');
    } finally {
      setTemplateSaving(false);
    }
  };

  const toggleTemplateEnabled = async (template) => {
    await update(ref(db, `${TEMPLATE_PATH}/${template.id}`), {
      enabled: template.enabled === false,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.uid || null
    });
  };

  const deleteTemplate = async (template) => {
    if (!window.confirm(`Delete message template "${template.name}"?`)) return;
    await remove(ref(db, `${TEMPLATE_PATH}/${template.id}`));
    if (editingTemplate?.id === template.id) resetTemplateForm();
  };

  const sendLeadWhatsApp = async (event) => {
    event.preventDefault();
    if (!selectedLead) return;
    setWhatsAppSending(true);
    setWhatsAppResult(null);
    try {
      const sendLeadWhatsAppMessage = httpsCallable(functions, 'sendLeadWhatsAppMessage');
      const result = await sendLeadWhatsAppMessage({
        leadId: selectedLead.id,
        messageType: whatsAppForm.messageType,
        phoneNumberId: whatsAppForm.phoneNumberId.trim() || botnexSettings.phoneNumberId.trim(),
        message: interpolateLeadText(whatsAppForm.message, selectedLead),
        botFlowUniqueId: whatsAppForm.botFlowUniqueId.trim(),
        mediaUrl: whatsAppForm.mediaUrl.trim(),
        mediaType: whatsAppForm.mediaType,
        buttons: parseCommaButtons(whatsAppForm.buttons)
      });
      setWhatsAppResult({
        type: result.data?.success ? 'success' : 'warning',
        message: result.data?.response?.message || 'WhatsApp operation completed.'
      });
    } catch (error) {
      console.error('WhatsApp send failed:', error);
      setWhatsAppResult({ type: 'error', message: error.message || 'Unable to send WhatsApp message.' });
    } finally {
      setWhatsAppSending(false);
    }
  };

  const saveBotnexSettings = async (event) => {
    event.preventDefault();
    setBotnexSaving(true);
    setBotnexMessage('');
    try {
      await set(ref(db, BOTNEX_SETTINGS_PATH), {
        phoneNumberId: botnexSettings.phoneNumberId.trim(),
        accountLabel: botnexSettings.accountLabel.trim() || EMPTY_BOTNEX_SETTINGS.accountLabel,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || null,
        updatedByName: user?.displayName || user?.email || 'Marketing'
      });
      setBotnexMessage('Botnex setup saved.');
    } catch (error) {
      console.error('Botnex settings save failed:', error);
      setBotnexMessage('Unable to save Botnex setup.');
    } finally {
      setBotnexSaving(false);
    }
  };

  const exportLeadsCsv = () => {
    const header = ['Company', 'Contact', 'Phone', 'Email', 'City', 'Status', 'Priority', 'Service', 'Package', 'Value', 'Follow-up', 'Owner', 'Source'];
    const rows = filteredLeads.map(lead => [
      lead.companyName,
      lead.contactName,
      lead.phone,
      lead.email,
      lead.city,
      getStageConfig(getStage(lead)).label,
      lead.priority,
      lead.serviceType,
      lead.packageInterest,
      lead.expectedValue || lead.budget || '',
      lead.followUpDate,
      lead.assignedTo,
      lead.source
    ]);
    const csv = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketing-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
            <p className="mt-1 text-sm text-slate-500">Leads, follow-ups, message templates, automation, and reporting.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openLeadForm()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Add Lead
            </button>
            <button type="button" onClick={() => { window.location.href = '/admin'; }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" />
              Admin
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-5 px-5 py-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {[
            { label: 'Total Leads', value: stats.total, icon: Briefcase },
            { label: 'Active Pipeline', value: stats.active, icon: Target },
            { label: 'Hot Leads', value: stats.hot, icon: AlertCircle },
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
                  className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold ${activeTab === tab.id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {leadFormOpen && (
          <LeadFormPanel
            form={leadForm}
            editingLead={editingLead}
            error={leadError}
            saving={leadSaving}
            onChange={updateLeadField}
            onClose={closeLeadForm}
            onSubmit={saveLead}
          />
        )}

        {activeTab === 'leads' && !selectedLead && (
          <section className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_145px_145px_145px_145px_145px_150px_120px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" placeholder="Search lead, phone, package..." />
                </div>
                <Select value={stageFilter} onChange={setStageFilter} options={[{ id: 'all', label: 'All status' }, ...STAGES]} />
                <Select value={priorityFilter} onChange={setPriorityFilter} options={[{ id: 'all', label: 'All priority' }, ...PRIORITIES]} />
                <Select value={serviceFilter} onChange={setServiceFilter} options={[{ id: 'all', label: 'All service' }, ...SERVICE_TYPES]} />
                <Select value={channelFilter} onChange={setChannelFilter} options={[{ id: 'all', label: 'All channels' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'email', label: 'Email' }, { id: 'phone', label: 'Phone' }]} />
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
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
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-500">{filteredLeads.length} leads shown</p>
                <div className="flex flex-wrap gap-2">
                  <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <button type="button" onClick={exportLeadsCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Lead</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Priority</th>
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
                      const priority = getPriorityConfig(lead.priority);
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => setSelectedLeadId(lead.id)} className="text-left">
                              <span className="block font-semibold text-slate-950">{lead.companyName || 'Untitled lead'}</span>
                              <span className="mt-1 block text-xs text-slate-500">{lead.contactName || 'No contact'} | {lead.phone || lead.email || 'No contact detail'}</span>
                            </button>
                          </td>
                          <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${stage.tone}`}>{stage.label}</span></td>
                          <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${priority.tone}`}>{priority.label}</span></td>
                          <td className="max-w-xs px-4 py-3 text-slate-600">{lead.packageInterest || '-'}</td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(lead.expectedValue || lead.budget)}</td>
                          <td className={`px-4 py-3 ${isDue(lead) ? 'font-semibold text-rose-600' : 'text-slate-600'}`}>{formatDate(lead.followUpDate)}</td>
                          <td className="px-4 py-3 text-slate-600">{lead.assignedTo || 'Unassigned'}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <select value={getStage(lead)} onChange={(event) => updateLeadStage(lead, event.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                                {STAGES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                              </select>
                              <button type="button" onClick={() => openLeadForm(lead)} className="rounded-md border border-slate-300 p-1.5 text-slate-600"><Edit3 className="h-3.5 w-3.5" /></button>
                              <button type="button" onClick={() => addFollowUpTomorrow(lead)} className="rounded-md border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-700">Follow-up</button>
                              <button type="button" onClick={() => deleteLead(lead)} className="rounded-md border border-rose-200 p-1.5 text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
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
          <LeadDetail
            lead={selectedLead}
            botnexSettings={botnexSettings}
            noteText={noteText}
            followUpDate={followUpDate}
            followUpNote={followUpNote}
            followUpParentId={followUpParentId}
            whatsAppForm={whatsAppForm}
            whatsAppSending={whatsAppSending}
            whatsAppResult={whatsAppResult}
            onBack={() => setSelectedLeadId('')}
            onEdit={() => openLeadForm(selectedLead)}
            onStageChange={(stage) => updateLeadStage(selectedLead, stage)}
            onNoteChange={setNoteText}
            onAddNote={addLeadNote}
            onFollowUpDateChange={setFollowUpDate}
            onFollowUpNoteChange={setFollowUpNote}
            onFollowUpParentChange={setFollowUpParentId}
            onScheduleFollowUp={scheduleFollowUp}
            onFollowUpStatus={(followUpId, status) => updateFollowUpStatus(selectedLead, followUpId, status)}
            onWhatsAppChange={(field, value) => {
              setWhatsAppForm(prev => ({ ...prev, [field]: value }));
              setWhatsAppResult(null);
            }}
            onSendWhatsApp={sendLeadWhatsApp}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesWorkspace
            templateForm={templateForm}
            editingTemplate={editingTemplate}
            templates={templates}
            templateError={templateError}
            templateSaving={templateSaving}
            templatePreviewLead={templatePreviewLead}
            onChange={(field, value) => setTemplateForm(prev => ({ ...prev, [field]: value }))}
            onStarter={applyTemplateStarter}
            onInsertVariable={insertTemplateVariable}
            onToggleArray={toggleTemplateArray}
            onSubmit={saveTemplate}
            onReset={resetTemplateForm}
            onEdit={openTemplateEditor}
            onToggleEnabled={toggleTemplateEnabled}
            onDelete={deleteTemplate}
          />
        )}

        {activeTab === 'automation' && (
          <AutomationWorkspace
            templates={templates}
            botnexSettings={botnexSettings}
            botnexSaving={botnexSaving}
            botnexMessage={botnexMessage}
            onChange={(field, value) => {
              setBotnexSettings(prev => ({ ...prev, [field]: value }));
              setBotnexMessage('');
            }}
            onSubmit={saveBotnexSettings}
          />
        )}

        {activeTab === 'reports' && <ReportsWorkspace leads={leads} stats={stats} />}
      </main>
    </div>
  );
};

const Select = ({ value, onChange, options }) => (
  <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
    {options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
  </select>
);

const LeadFormPanel = ({ form, editingLead, error, saving, onChange, onClose, onSubmit }) => (
  <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-lg font-semibold">{editingLead ? 'Edit Lead' : 'Create Lead'}</h2>
        <p className="text-sm text-slate-500">Capture business details, package interest, owner, and next action.</p>
      </div>
      <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
        <X className="h-4 w-4" />
        Close
      </button>
    </div>
    {error && <p className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>}
    <div className="mt-4 grid gap-4 lg:grid-cols-4">
      <Field label="Company / Brand" value={form.companyName} onChange={(value) => onChange('companyName', value)} required />
      <Field label="Contact Person" value={form.contactName} onChange={(value) => onChange('contactName', value)} required />
      <Field label="Phone" value={form.phone} onChange={(value) => onChange('phone', value)} />
      <Field label="Email" type="email" value={form.email} onChange={(value) => onChange('email', value)} />
      <Field label="City" value={form.city} onChange={(value) => onChange('city', value)} />
      <Field label="Business Category" value={form.businessCategory} onChange={(value) => onChange('businessCategory', value)} />
      <Field label="Owner" value={form.assignedTo} onChange={(value) => onChange('assignedTo', value)} />
      <SelectField label="Source" value={form.source} onChange={(value) => onChange('source', value)} options={SOURCES.map(item => ({ id: item, label: item }))} />
      <SelectField label="Service" value={form.serviceType} onChange={(value) => onChange('serviceType', value)} options={SERVICE_TYPES} />
      <SelectField label="Package" value={form.packageInterest} onChange={(value) => onChange('packageInterest', value)} options={(PACKAGE_OPTIONS[form.serviceType] || []).map(item => ({ id: item, label: item }))} />
      <SelectField label="Status" value={form.stage} onChange={(value) => onChange('stage', value)} options={STAGES} />
      <SelectField label="Priority" value={form.priority} onChange={(value) => onChange('priority', value)} options={PRIORITIES} />
      <Field label="Budget" type="number" value={form.budget} onChange={(value) => onChange('budget', value)} />
      <Field label="Expected Value" type="number" value={form.expectedValue} onChange={(value) => onChange('expectedValue', value)} />
      <Field label="Follow-up Date" type="date" value={form.followUpDate} onChange={(value) => onChange('followUpDate', value)} />
      <Field label="Expected Close" type="date" value={form.expectedCloseDate} onChange={(value) => onChange('expectedCloseDate', value)} />
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <TextArea label="Requirements" value={form.requirements} onChange={(value) => onChange('requirements', value)} rows={4} />
      <TextArea label="Internal Notes" value={form.notes} onChange={(value) => onChange('notes', value)} rows={4} />
    </div>
    {form.stage === 'lost' && (
      <div className="mt-4">
        <TextArea label="Loss Reason" value={form.lossReason} onChange={(value) => onChange('lossReason', value)} rows={3} />
      </div>
    )}
    <div className="mt-5 flex justify-end gap-2">
      <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
      <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save Lead'}
      </button>
    </div>
  </form>
);

const LeadDetail = ({
  lead,
  botnexSettings,
  noteText,
  followUpDate,
  followUpNote,
  followUpParentId,
  whatsAppForm,
  whatsAppSending,
  whatsAppResult,
  onBack,
  onEdit,
  onStageChange,
  onNoteChange,
  onAddNote,
  onFollowUpDateChange,
  onFollowUpNoteChange,
  onFollowUpParentChange,
  onScheduleFollowUp,
  onFollowUpStatus,
  onWhatsAppChange,
  onSendWhatsApp
}) => {
  const stage = getStageConfig(getStage(lead));
  const priority = getPriorityConfig(lead.priority);
  const activities = Array.isArray(lead.activityLog) ? lead.activityLog.slice().reverse() : [];
  const followUps = getFollowUps(lead);
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
            <ChevronLeft className="h-4 w-4" />
            Back to leads
          </button>
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
            <Edit3 className="h-4 w-4" />
            Edit Lead
          </button>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">{lead.companyName || 'Untitled lead'}</h2>
              <p className="mt-1 text-sm text-slate-500">{lead.contactName || 'No contact'} | {lead.city || 'City not set'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${stage.tone}`}>{stage.label}</span>
                <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${priority.tone}`}>{priority.label}</span>
              </div>
            </div>
            <select value={getStage(lead)} onChange={(event) => onStageChange(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {STAGES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile label="Phone" value={lead.phone || 'Not set'} icon={Phone} />
            <InfoTile label="Email" value={lead.email || 'Not set'} icon={Mail} />
            <InfoTile label="Value" value={formatCurrency(lead.expectedValue || lead.budget)} icon={IndianRupee} />
            <InfoTile label="Follow-up" value={formatDate(lead.followUpDate)} icon={Clock} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextPanel title="Requirements" text={lead.requirements || 'No requirements captured yet.'} />
            <TextPanel title="Internal Notes" text={lead.notes || 'No internal notes yet.'} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <form onSubmit={onAddNote} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">Add Note</h3>
            <textarea value={noteText} onChange={(event) => onNoteChange(event.target.value)} rows={4} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Meeting notes, objections, next steps..." />
            <button className="mt-3 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Save Note</button>
          </form>
          <form onSubmit={onScheduleFollowUp} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">Schedule Follow-up</h3>
            <input type="date" value={followUpDate} onChange={(event) => onFollowUpDateChange(event.target.value)} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select value={followUpParentId} onChange={(event) => onFollowUpParentChange(event.target.value)} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Start new follow-up branch</option>
              {followUps.map(item => (
                <option key={item.id} value={item.id}>
                  After {formatDate(item.date)} - {item.note || 'Follow-up'}
                </option>
              ))}
            </select>
            <textarea value={followUpNote} onChange={(event) => onFollowUpNoteChange(event.target.value)} rows={3} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Purpose of follow-up" />
            <button className="mt-3 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Schedule</button>
          </form>
        </div>

        <FollowUpTree followUps={followUps} onStatusChange={onFollowUpStatus} />

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold"><FileText className="h-4 w-4" />Lead History</h3>
          <div className="mt-4 space-y-3">
            {activities.map((activity, index) => (
              <div key={`${activity.at || 'activity'}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">{activity.message}</p>
                {activity.note && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{activity.note}</p>}
                <p className="mt-2 text-xs text-slate-400">{formatDate(activity.at, '')} | {activity.by || 'System'}</p>
              </div>
            ))}
            {activities.length === 0 && <p className="text-sm text-slate-500">No history has been recorded yet.</p>}
          </div>
        </div>
      </div>

      <form onSubmit={onSendWhatsApp} className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-semibold"><Smartphone className="h-4 w-4" />WhatsApp Message</h3>
        {!botnexSettings.phoneNumberId && (
          <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Botnex Phone Number ID is not saved. Add it in Automation before automatic messages can send reliably.
          </p>
        )}
        <SelectField label="Message Type" value={whatsAppForm.messageType} onChange={(value) => onWhatsAppChange('messageType', value)} options={[
          { id: 'text', label: 'Text' },
          { id: 'buttons', label: 'Buttons' },
          { id: 'file', label: 'Media/File' },
          { id: 'botFlow', label: 'Bot Flow' }
        ]} />
        <Field label="Phone Number ID" value={whatsAppForm.phoneNumberId || botnexSettings.phoneNumberId} onChange={(value) => onWhatsAppChange('phoneNumberId', value)} />
        {whatsAppForm.messageType !== 'botFlow' && <TextArea label="Message" value={whatsAppForm.message} onChange={(value) => onWhatsAppChange('message', value)} rows={5} />}
        {whatsAppForm.messageType === 'buttons' && <Field label="Buttons" value={whatsAppForm.buttons} onChange={(value) => onWhatsAppChange('buttons', value)} />}
        {whatsAppForm.messageType === 'botFlow' && <Field label="Bot Flow Unique ID" value={whatsAppForm.botFlowUniqueId} onChange={(value) => onWhatsAppChange('botFlowUniqueId', value)} />}
        {whatsAppForm.messageType === 'file' && (
          <>
            <Field label="Media URL" value={whatsAppForm.mediaUrl} onChange={(value) => onWhatsAppChange('mediaUrl', value)} />
            <SelectField label="Media Type" value={whatsAppForm.mediaType} onChange={(value) => onWhatsAppChange('mediaType', value)} options={[
              { id: 'image', label: 'Image' },
              { id: 'video', label: 'Video' },
              { id: 'document', label: 'Document' }
            ]} />
          </>
        )}
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{interpolateLeadText(whatsAppForm.message, lead) || 'Bot flow message will be triggered.'}</p>
        </div>
        {whatsAppResult && (
          <p className={`mt-3 rounded-lg border px-3 py-2 text-sm font-semibold ${whatsAppResult.type === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : whatsAppResult.type === 'error' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
            {whatsAppResult.message}
          </p>
        )}
        <button disabled={whatsAppSending || !lead.phone} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          <Send className="h-4 w-4" />
          {whatsAppSending ? 'Sending...' : 'Send WhatsApp'}
        </button>
      </form>
    </section>
  );
};

const TemplatesWorkspace = ({
  templateForm,
  editingTemplate,
  templates,
  templateError,
  templateSaving,
  templatePreviewLead,
  onChange,
  onStarter,
  onInsertVariable,
  onToggleArray,
  onSubmit,
  onReset,
  onEdit,
  onToggleEnabled,
  onDelete
}) => (
  <section className="grid gap-5 xl:grid-cols-[470px_minmax(0,1fr)]">
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><MessageSquare className="h-5 w-5" />{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
        {editingTemplate && <button type="button" onClick={onReset} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">New</button>}
      </div>
      {templateError && <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{templateError}</p>}
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Template Starter</label>
        <select onChange={(event) => onStarter(event.target.value)} defaultValue="" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Choose a ready-made template</option>
          {TEMPLATE_STARTERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>
      <Field label="Template Name" value={templateForm.name} onChange={(value) => onChange('name', value)} required />
      <Field label="Push / Email Title" value={templateForm.title} onChange={(value) => onChange('title', value)} />
      <div>
        <p className="mb-2 text-sm font-semibold">Channels</p>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map(channel => {
            const Icon = channel.icon;
            return (
              <button key={channel.id} type="button" onClick={() => onToggleArray('channels', channel.id)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${templateForm.channels.includes(channel.id) ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 text-slate-600'}`}>
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
              <input type="checkbox" checked={templateForm.triggers.includes(trigger.id)} onChange={() => onToggleArray('triggers', trigger.id)} />
              {trigger.label}
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Editor" value={templateForm.editorMode} onChange={(value) => onChange('editorMode', value)} options={[{ id: 'rich', label: 'Rich Text' }, { id: 'html', label: 'HTML' }]} />
        <SelectField label="WhatsApp Type" value={templateForm.whatsAppMessageType} onChange={(value) => onChange('whatsAppMessageType', value)} options={[{ id: 'text', label: 'Text' }, { id: 'buttons', label: 'Buttons' }, { id: 'botFlow', label: 'Bot Flow' }]} />
      </div>
      <div className="flex flex-wrap gap-2">
        {PERSONALIZATION_FIELDS.map(field => (
          <button key={field.token} type="button" onClick={() => onInsertVariable(field.token)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            {field.label}
          </button>
        ))}
      </div>
      {templateForm.editorMode === 'html'
        ? <TextArea label="HTML Body" value={templateForm.html} onChange={(value) => onChange('html', value)} rows={8} />
        : <TextArea label="Message Copy" value={templateForm.richText} onChange={(value) => onChange('richText', value)} rows={8} />}
      {templateForm.whatsAppMessageType === 'buttons' && <Field label="Button Labels" value={templateForm.buttons} onChange={(value) => onChange('buttons', value)} />}
      {templateForm.whatsAppMessageType === 'botFlow' && <Field label="Bot Flow Unique ID" value={templateForm.botFlowUniqueId} onChange={(value) => onChange('botFlowUniqueId', value)} />}
      <Field label="Optional Phone Number ID" value={templateForm.phoneNumberId} onChange={(value) => onChange('phoneNumberId', value)} />
      <p className="text-xs text-slate-500">Leave blank to use Automation settings. Do not enter the customer-facing mobile number here.</p>
      {templateForm.channels.includes('whatsapp') && templateForm.whatsAppMessageType !== 'botFlow' && (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          WhatsApp blocks normal text for first outbound contact. Use a Botnex approved template/bot flow for instant enquiry replies.
        </p>
      )}
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={templateForm.enabled !== false} onChange={(event) => onChange('enabled', event.target.checked)} />
        Template enabled
      </label>
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{interpolateLeadText(templateForm.editorMode === 'html' ? templateForm.html : templateForm.richText, templatePreviewLead)}</p>
      </div>
      <button disabled={templateSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        <Send className="h-4 w-4" />
        {templateSaving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Save Template'}
      </button>
    </form>

    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Template Library</h2>
        <p className="mt-1 text-sm text-slate-500">Templates here are used by lead triggers and manual sends.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {templates.map(template => (
          <div key={template.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${template.enabled === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>{template.enabled === false ? 'Paused' : 'Enabled'}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(template.channels || (template.sendWhatsApp ? ['whatsapp'] : ['push'])).map(channel => <span key={channel} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{channel}</span>)}
                  {(template.triggers || []).map(trigger => <span key={trigger} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{trigger}</span>)}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onEdit(template)} className="rounded-lg border border-slate-300 p-2 text-slate-600"><Edit3 className="h-4 w-4" /></button>
                <button type="button" onClick={() => onToggleEnabled(template)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">{template.enabled === false ? 'Enable' : 'Pause'}</button>
                <button type="button" onClick={() => onDelete(template)} className="rounded-lg border border-rose-200 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{template.richText || template.html || 'No message body.'}</p>
          </div>
        ))}
        {templates.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No templates yet.</div>}
      </div>
    </div>
  </section>
);

const AutomationWorkspace = ({ templates, botnexSettings, botnexSaving, botnexMessage, onChange, onSubmit }) => {
  const hasBotnex = Boolean(botnexSettings.phoneNumberId);
  const hasLeadReply = templates.some(item => item.enabled !== false && item.triggers?.includes('lead_created') && (item.sendWhatsApp || item.channels?.includes('whatsapp')));
  const hasFollowUp = templates.some(item => item.enabled !== false && item.triggers?.includes('followup_due'));
  const hasStage = templates.some(item => item.enabled !== false && item.triggers?.some(trigger => trigger.startsWith('stage_')));
  return (
    <section className="grid gap-5 xl:grid-cols-[470px_minmax(0,1fr)]">
      <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Smartphone className="h-5 w-5 text-emerald-600" />Botnex WhatsApp Setup</h2>
        <p className="mt-1 text-sm text-slate-500">The API token stays in Firebase Functions secrets. Save only the WhatsApp phone number ID here.</p>
        <Field label="WhatsApp Account Label" value={botnexSettings.accountLabel} onChange={(value) => onChange('accountLabel', value)} />
        <Field label="Botnex Phone Number ID" value={botnexSettings.phoneNumberId} onChange={(value) => onChange('phoneNumberId', value)} />
        {botnexMessage && <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{botnexMessage}</p>}
        <button disabled={botnexSaving} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          <Save className="h-4 w-4" />
          {botnexSaving ? 'Saving...' : 'Save Botnex Setup'}
        </button>
      </form>
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { title: 'WhatsApp account', body: hasBotnex ? botnexSettings.accountLabel : 'Phone Number ID is missing.', ready: hasBotnex },
          { title: 'Instant lead reply', body: 'Sends WhatsApp when a new enquiry is captured.', ready: hasBotnex && hasLeadReply },
          { title: 'Follow-up reminders', body: 'Uses templates attached to follow-up due triggers.', ready: hasFollowUp },
          { title: 'Stage automation', body: 'Messages can trigger as leads move through the pipeline.', ready: hasStage }
        ].map(card => (
          <div key={card.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Workflow className={`h-6 w-6 ${card.ready ? 'text-emerald-600' : 'text-amber-600'}`} />
            <h3 className="mt-4 font-semibold">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{card.body}</p>
            <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${card.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{card.ready ? 'Ready' : 'Needs setup'}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

const FollowUpTree = ({ followUps, onStatusChange }) => {
  const roots = followUps.filter(item => !item.parentId || !followUps.some(parent => parent.id === item.parentId));
  if (!followUps.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        No follow-ups have been scheduled yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold"><CalendarClock className="h-4 w-4" />Follow-up Tree</h3>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{followUps.length} total</p>
      </div>
      <div className="mt-4 space-y-3">
        {roots.map(item => (
          <FollowUpNode key={item.id} item={item} allItems={followUps} depth={0} onStatusChange={onStatusChange} />
        ))}
      </div>
    </div>
  );
};

const FollowUpNode = ({ item, allItems, depth, onStatusChange }) => {
  const children = allItems
    .filter(child => child.parentId === item.id)
    .sort((a, b) => new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0));
  const isCompleted = item.status === 'completed';
  const isCancelled = item.status === 'cancelled';
  const isOverdue = !isCompleted && !isCancelled && item.date && new Date(`${item.date}T23:59:59`) < new Date();

  return (
    <div className={depth ? 'ml-5 border-l border-slate-200 pl-4' : ''}>
      <div className={`rounded-lg border p-3 ${isCompleted ? 'border-emerald-100 bg-emerald-50' : isCancelled ? 'border-slate-200 bg-slate-50' : isOverdue ? 'border-rose-100 bg-rose-50' : 'border-slate-100 bg-slate-50'}`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-950">{formatDate(item.date)}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isCompleted ? 'bg-emerald-100 text-emerald-700' : isCancelled ? 'bg-slate-200 text-slate-600' : isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                {isCompleted ? 'Done' : isCancelled ? 'Cancelled' : isOverdue ? 'Overdue' : 'Open'}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.note || 'No note added.'}</p>
            <p className="mt-2 text-xs text-slate-400">Created by {item.createdByName || 'Marketing'}{item.completedAt ? ` | completed ${formatDate(item.completedAt)}` : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.status !== 'completed' && (
              <button type="button" onClick={() => onStatusChange(item.id, 'completed')} className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700">Done</button>
            )}
            {item.status === 'completed' && (
              <button type="button" onClick={() => onStatusChange(item.id, 'open')} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700">Reopen</button>
            )}
            {item.status !== 'cancelled' && (
              <button type="button" onClick={() => onStatusChange(item.id, 'cancelled')} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600">Cancel</button>
            )}
          </div>
        </div>
      </div>
      {children.length > 0 && (
        <div className="mt-3 space-y-3">
          {children.map(child => (
            <FollowUpNode key={child.id} item={child} allItems={allItems} depth={depth + 1} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
};

const ReportsWorkspace = ({ leads, stats }) => {
  const sourceItems = Object.entries(leads.reduce((acc, lead) => {
    const key = lead.source || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).map(([label, value]) => ({ label, value }));
  const serviceItems = Object.entries(leads.reduce((acc, lead) => {
    const key = SERVICE_TYPES.find(item => item.id === lead.serviceType)?.label || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).map(([label, value]) => ({ label, value }));
  const valueByStage = STAGES.map(stage => ({
    label: stage.label,
    value: formatCurrency(leads.filter(lead => getStage(lead) === stage.id).reduce((sum, lead) => sum + (Number(lead.expectedValue) || Number(lead.budget) || 0), 0))
  }));
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Win Rate" value={`${stats.winRate}%`} />
        <MetricCard label="Overdue Follow-ups" value={stats.due} />
        <MetricCard label="Open Pipeline" value={formatCurrency(stats.value)} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ReportCard title="Leads By Status" items={STAGES.map(stage => ({ label: stage.label, value: leads.filter(lead => getStage(lead) === stage.id).length }))} />
        <ReportCard title="Lead Sources" items={sourceItems} />
        <ReportCard title="Service Interest" items={serviceItems} />
        <ReportCard title="Pipeline Value By Status" items={valueByStage} />
      </div>
    </section>
  );
};

const Field = ({ label, value, onChange, type = 'text', required = false }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
    <input required={required} type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
  </label>
);

const SelectField = ({ label, value, onChange, options }) => (
  <label className="mt-3 block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
    <select value={value || ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
      {options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select>
  </label>
);

const TextArea = ({ label, value, onChange, rows = 4 }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
    <textarea value={value || ''} onChange={(event) => onChange(event.target.value)} rows={rows} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
  </label>
);

const InfoTile = ({ label, value, icon }) => {
  const TileIcon = icon;
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"><TileIcon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
};

const TextPanel = ({ title, text }) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
    <h3 className="font-semibold">{title}</h3>
    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{text}</p>
  </div>
);

const MetricCard = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
);

const ReportCard = ({ title, items }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className="mt-4 space-y-3">
      {items.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}
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
