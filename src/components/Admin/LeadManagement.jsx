// =============================================
// src/components/Admin/LeadManagement.jsx
// Lead management for advertising and digital marketing sales
// =============================================
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { db, functions, httpsCallable } from '../../firebase-config';
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  CalendarClock,
  CheckCircle,
  Clock,
  Download,
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
  Smartphone,
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

const TEMPLATE_PURPOSES = [
  {
    id: 'new_lead_welcome',
    label: 'Instant enquiry reply',
    description: 'Send a warm WhatsApp reply as soon as a person submits the enquiry form.',
    name: 'Instant WhatsApp reply',
    title: 'New enquiry received',
    triggers: ['lead_created'],
    channels: ['whatsapp'],
    whatsAppMessageType: 'buttons',
    buttons: 'View Packages,Talk to Sales,Call Me',
    richText: 'Hi {{contactName}}, thank you for contacting Our Vadodara. We received your enquiry for {{packageInterest}} and our team will reach out shortly. You can also choose an option below so we can help faster.'
  },
  {
    id: 'team_alert',
    label: 'Team alert',
    description: 'Notify the internal lead team when a fresh enquiry comes in.',
    name: 'New lead team alert',
    title: 'New advertising lead',
    triggers: ['lead_created'],
    channels: ['push'],
    whatsAppMessageType: 'text',
    buttons: 'Interested,Share Packages,Talk to Sales',
    richText: '{{companyName}} from {{city}} submitted an enquiry for {{packageInterest}}. Contact person: {{contactName}}.'
  },
  {
    id: 'proposal_followup',
    label: 'Proposal follow-up',
    description: 'Send a polite WhatsApp nudge when a lead reaches proposal stage.',
    name: 'Proposal follow-up',
    title: 'Proposal follow-up due',
    triggers: ['stage_proposal'],
    channels: ['whatsapp'],
    whatsAppMessageType: 'buttons',
    buttons: 'Looks Good,Need Changes,Talk to Sales',
    richText: 'Hi {{contactName}}, we hope the Our Vadodara proposal for {{companyName}} was helpful. Would you like us to make any changes or help you finalize the campaign?'
  },
  {
    id: 'followup_reminder',
    label: 'Follow-up reminder',
    description: 'Remind the sales team when a planned follow-up is due.',
    name: 'Follow-up reminder',
    title: 'Lead follow-up due',
    triggers: ['followup_due'],
    channels: ['push'],
    whatsAppMessageType: 'text',
    buttons: 'Interested,Share Packages,Talk to Sales',
    richText: '{{companyName}} has a follow-up due today. Package: {{packageInterest}}. Owner: {{assignedTo}}.'
  }
];

const PERSONALIZATION_FIELDS = [
  { label: 'Contact name', token: '{{contactName}}' },
  { label: 'Brand', token: '{{companyName}}' },
  { label: 'City', token: '{{city}}' },
  { label: 'Package', token: '{{packageInterest}}' },
  { label: 'Follow-up date', token: '{{followUpDate}}' },
  { label: 'Owner', token: '{{assignedTo}}' }
];

const TEMPLATE_TONES = [
  { id: 'friendly', label: 'Friendly' },
  { id: 'premium', label: 'Premium' },
  { id: 'direct', label: 'Direct' },
  { id: 'urgent', label: 'Urgent' }
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
  purpose: 'new_lead_welcome',
  tone: 'friendly',
  name: 'Instant WhatsApp reply',
  title: 'New enquiry received',
  editorMode: 'rich',
  richText: 'Hi {{contactName}}, thank you for contacting Our Vadodara. We received your enquiry for {{packageInterest}} and our team will reach out shortly. You can also choose an option below so we can help faster.',
  html: '',
  triggers: ['lead_created'],
  channels: ['whatsapp'],
  sendPush: false,
  sendWhatsApp: true,
  audienceTopic: 'admin-leads',
  phoneNumberId: '',
  whatsAppMessageType: 'buttons',
  botFlowUniqueId: '',
  buttons: 'View Packages,Talk to Sales,Call Me',
  enabled: true
};

const EMPTY_WHATSAPP_FORM = {
  phoneNumberId: '',
  message: 'Hello {{contactName}}, this is Our Vadodara. We received your advertising enquiry for {{packageInterest}}. How can we help you today?',
  messageType: 'text',
  botFlowUniqueId: '',
  mediaUrl: '',
  mediaType: 'image',
  buttons: 'Interested,Share Packages,Talk to Sales'
};

const BOTNEX_OPERATION_GROUPS = [
  {
    label: 'Messages',
    operations: [
      { id: 'sendText', label: 'Send text' },
      { id: 'sendInteractiveButtons', label: 'Send buttons' },
      { id: 'sendFile', label: 'Send file/media' },
      { id: 'triggerBotFlow', label: 'Trigger bot flow' }
    ]
  },
  {
    label: 'Subscribers',
    operations: [
      { id: 'getSubscriber', label: 'Get subscriber' },
      { id: 'listSubscribers', label: 'List subscribers' },
      { id: 'createSubscriber', label: 'Create subscriber' },
      { id: 'updateSubscriber', label: 'Update subscriber' },
      { id: 'deleteSubscriber', label: 'Delete subscriber' },
      { id: 'resetUserInputFlow', label: 'Reset input flow' }
    ]
  },
  {
    label: 'Labels & CRM',
    operations: [
      { id: 'listLabels', label: 'List labels' },
      { id: 'createLabel', label: 'Create label' },
      { id: 'assignLabels', label: 'Assign labels' },
      { id: 'removeLabels', label: 'Remove labels' },
      { id: 'assignSequence', label: 'Assign sequence' },
      { id: 'removeSequence', label: 'Remove sequence' },
      { id: 'addNotes', label: 'Add note' },
      { id: 'assignCustomFields', label: 'Assign custom fields' },
      { id: 'listCustomFields', label: 'List custom fields' },
      { id: 'assignTeamMember', label: 'Assign team member' }
    ]
  },
  {
    label: 'Templates & Reports',
    operations: [
      { id: 'listTemplates', label: 'List templates' },
      { id: 'getConversation', label: 'Get conversation' },
      { id: 'getPostBackList', label: 'Get postbacks' },
      { id: 'getMessageStatus', label: 'Get message status' },
      { id: 'listCatalogs', label: 'List catalogs' },
      { id: 'listCatalogOrders', label: 'List catalog orders' },
      { id: 'changeCatalogOrderStatus', label: 'Change order status' }
    ]
  }
];

const EMPTY_BOTNEX_FORM = {
  operation: 'listTemplates',
  phoneNumberId: '',
  phoneNumber: '',
  message: '',
  buttons: 'Yes,No',
  mediaUrl: '',
  mediaId: '',
  mediaType: 'image',
  botFlowUniqueId: '',
  limit: 10,
  offset: 0,
  labelIds: '',
  sequenceIds: '',
  labelName: '',
  noteText: '',
  teamMemberId: '',
  waMessageId: '',
  whatsappBotId: '',
  customFields: '{ "lead_source": "Our Vadodara" }',
  extraJson: '{}'
};

const EMPTY_BOTNEX_SETTINGS = {
  phoneNumberId: '',
  accountLabel: 'Our Vadodara (+919099004346)'
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

const interpolateLeadText = (text, lead) => String(text || '').replace(/\{\{(\w+)\}\}/g, (_, key) => {
  const values = {
    companyName: lead?.companyName || '',
    contactName: lead?.contactName || '',
    city: lead?.city || '',
    stage: getStage(lead || {}),
    packageInterest: lead?.packageInterest || '',
    followUpDate: lead?.followUpDate || '',
    assignedTo: lead?.assignedTo || '',
    serviceType: lead?.serviceType || ''
  };
  return values[key] || '';
});

const parseCommaButtons = (value) => String(value || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean)
  .slice(0, 3)
  .map(item => ({ id: item.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || item, title: item.slice(0, 20) }));

const parseJsonObject = (value, fallback = {}) => {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
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
  const [sortBy, setSortBy] = useState('updated_desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [whatsAppLead, setWhatsAppLead] = useState(null);
  const [whatsAppForm, setWhatsAppForm] = useState(EMPTY_WHATSAPP_FORM);
  const [whatsAppSending, setWhatsAppSending] = useState(false);
  const [whatsAppResult, setWhatsAppResult] = useState(null);
  const [botnexForm, setBotnexForm] = useState(EMPTY_BOTNEX_FORM);
  const [botnexLoading, setBotnexLoading] = useState(false);
  const [botnexResult, setBotnexResult] = useState(null);
  const [botnexSettings, setBotnexSettings] = useState(EMPTY_BOTNEX_SETTINGS);
  const [botnexSettingsSaving, setBotnexSettingsSaving] = useState(false);
  const [botnexSettingsMessage, setBotnexSettingsMessage] = useState('');

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

  useEffect(() => {
    const settingsRef = ref(db, 'integrations/botnex');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      setBotnexSettings({
        ...EMPTY_BOTNEX_SETTINGS,
        ...(snapshot.val() || {})
      });
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
    const result = leads.filter((lead) => {
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
    return result.sort((a, b) => {
      if (sortBy === 'value_desc') return (Number(b.expectedValue || b.budget) || 0) - (Number(a.expectedValue || a.budget) || 0);
      if (sortBy === 'company_asc') return (a.companyName || '').localeCompare(b.companyName || '');
      if (sortBy === 'followup_asc') return new Date(a.followUpDate || '9999-12-31') - new Date(b.followUpDate || '9999-12-31');
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });
  }, [leads, query, stageFilter, serviceFilter, priorityFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = useMemo(
    () => filteredLeads.slice((page - 1) * pageSize, page * pageSize),
    [filteredLeads, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [query, stageFilter, serviceFilter, priorityFilter, sortBy, pageSize]);

  useEffect(() => {
    setPage(current => Math.min(current, totalPages));
  }, [totalPages]);

  const templatePreviewLead = useMemo(() => ({
    companyName: 'Shree Foods',
    contactName: 'Riya Shah',
    city: 'Vadodara',
    stage: 'new',
    packageInterest: 'Monthly banner package',
    followUpDate: new Date().toISOString().slice(0, 10),
    assignedTo: user?.displayName || user?.email || 'Sales team',
    serviceType: 'advertising'
  }), [user]);

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

  const toggleTemplateChannel = (channelId) => {
    setTemplateForm(prev => {
      const channels = Array.isArray(prev.channels) ? prev.channels : [];
      const nextChannels = channels.includes(channelId)
        ? channels.filter(item => item !== channelId)
        : [...channels, channelId];
      return {
        ...prev,
        channels: nextChannels.length ? nextChannels : [channelId],
        sendPush: nextChannels.includes('push'),
        sendWhatsApp: nextChannels.includes('whatsapp')
      };
    });
    setTemplateErrors(prev => ({ ...prev, channels: null, submit: null }));
  };

  const applyTemplatePurpose = (purposeId) => {
    const purpose = TEMPLATE_PURPOSES.find(item => item.id === purposeId);
    if (!purpose) return;

    setTemplateForm(prev => ({
      ...prev,
      purpose: purpose.id,
      name: purpose.name,
      title: purpose.title,
      richText: purpose.richText,
      html: '',
      editorMode: 'rich',
      triggers: purpose.triggers,
      channels: purpose.channels,
      sendPush: purpose.channels.includes('push'),
      sendWhatsApp: purpose.channels.includes('whatsapp'),
      whatsAppMessageType: purpose.whatsAppMessageType,
      buttons: purpose.buttons
    }));
    setTemplateErrors({});
  };

  const insertTemplateVariable = (token) => {
    setTemplateForm(prev => ({
      ...prev,
      richText: `${prev.richText}${prev.richText.endsWith(' ') || !prev.richText ? '' : ' '}${token}`
    }));
    setTemplateErrors(prev => ({ ...prev, body: null, submit: null }));
  };

  const updateWhatsAppField = (field, value) => {
    setWhatsAppForm(prev => ({ ...prev, [field]: value }));
    setWhatsAppResult(null);
  };

  const updateBotnexField = (field, value) => {
    setBotnexForm(prev => ({ ...prev, [field]: value }));
    setBotnexResult(null);
  };

  const updateBotnexSetting = (field, value) => {
    setBotnexSettings(prev => ({ ...prev, [field]: value }));
    setBotnexSettingsMessage('');
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
    setTemplateForm({ ...EMPTY_TEMPLATE });
    setEditingTemplate(null);
    setTemplateErrors({});
  };

  const openTemplateForm = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        ...EMPTY_TEMPLATE,
        ...template,
        triggers: Array.isArray(template.triggers) && template.triggers.length ? template.triggers : ['lead_created'],
        channels: Array.isArray(template.channels) && template.channels.length
          ? template.channels
          : template.sendWhatsApp
            ? ['whatsapp']
            : ['push'],
        sendPush: template.sendPush !== false && (!template.channels || template.channels.includes('push')),
        sendWhatsApp: template.sendWhatsApp === true || template.channels?.includes('whatsapp'),
        buttons: Array.isArray(template.buttons)
          ? template.buttons.map(button => (typeof button === 'string' ? button : button.title || button.label || '')).filter(Boolean).join(',')
          : template.buttons || EMPTY_TEMPLATE.buttons
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

  const openWhatsAppForm = (lead) => {
    setWhatsAppLead(lead);
    setWhatsAppForm({
      ...EMPTY_WHATSAPP_FORM,
      phoneNumberId: botnexSettings.phoneNumberId || ''
    });
    setWhatsAppResult(null);
  };

  const buildBotnexParams = () => {
    const phoneNumberId = botnexForm.phoneNumberId.trim() || botnexSettings.phoneNumberId.trim();
    const params = {
      ...parseJsonObject(botnexForm.extraJson),
      phone_number_id: phoneNumberId,
      phoneNumberID: phoneNumberId,
      phone_number: botnexForm.phoneNumber.trim(),
      phoneNumber: botnexForm.phoneNumber.trim(),
      message: botnexForm.message.trim(),
      buttons: parseCommaButtons(botnexForm.buttons),
      media_url: botnexForm.mediaUrl.trim(),
      media_id: botnexForm.mediaId.trim(),
      media_type: botnexForm.mediaType,
      bot_flow_unique_id: botnexForm.botFlowUniqueId.trim(),
      limit: String(botnexForm.limit || 10),
      offset: String(botnexForm.offset || 0),
      label_ids: botnexForm.labelIds.trim(),
      sequence_ids: botnexForm.sequenceIds.trim(),
      label_name: botnexForm.labelName.trim(),
      note_text: botnexForm.noteText.trim(),
      team_member_id: botnexForm.teamMemberId.trim(),
      wa_message_id: botnexForm.waMessageId.trim(),
      whatsapp_bot_id: botnexForm.whatsappBotId.trim(),
      custom_fields: parseJsonObject(botnexForm.customFields)
    };

    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
      if (Array.isArray(params[key]) && params[key].length === 0) {
        delete params[key];
      }
    });

    return params;
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
    const channels = Array.isArray(templateForm.channels) ? templateForm.channels : [];
    if (!templateForm.name.trim()) nextErrors.name = 'Template name is required';
    if (channels.length === 0) nextErrors.channels = 'Select at least one delivery channel';
    if (channels.includes('push') && !templateForm.title.trim()) nextErrors.title = 'Push title is required for team notifications';
    if (!templateForm.richText.trim()) nextErrors.body = 'Message copy is required';
    if (channels.includes('whatsapp') && !templateForm.phoneNumberId.trim() && !botnexSettings.phoneNumberId.trim()) {
      nextErrors.phoneNumberId = 'Add the WhatsApp Account Phone Number ID here or in Botnex setup';
    }
    if (channels.includes('whatsapp') && templateForm.whatsAppMessageType === 'buttons' && parseCommaButtons(templateForm.buttons).length === 0) {
      nextErrors.buttons = 'Add at least one button label';
    }
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
      const channels = Array.isArray(templateForm.channels) && templateForm.channels.length ? templateForm.channels : ['push'];
      const payload = {
        ...templateForm,
        name: templateForm.name.trim(),
        title: templateForm.title.trim(),
        richText: templateForm.richText.trim(),
        html: '',
        editorMode: 'rich',
        triggers: templateForm.triggers,
        channels,
        sendPush: channels.includes('push'),
        sendWhatsApp: channels.includes('whatsapp'),
        phoneNumberId: templateForm.phoneNumberId.trim(),
        whatsAppMessageType: templateForm.whatsAppMessageType,
        botFlowUniqueId: templateForm.botFlowUniqueId.trim(),
        buttons: parseCommaButtons(templateForm.buttons),
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

  const handleSendLeadWhatsApp = async (event) => {
    event.preventDefault();
    if (!whatsAppLead) return;

    setWhatsAppSending(true);
    setWhatsAppResult(null);
    try {
      const sendLeadWhatsAppMessage = httpsCallable(functions, 'sendLeadWhatsAppMessage');
      const result = await sendLeadWhatsAppMessage({
        leadId: whatsAppLead.id,
        messageType: whatsAppForm.messageType,
        phoneNumberId: whatsAppForm.phoneNumberId.trim() || botnexSettings.phoneNumberId.trim(),
        message: interpolateLeadText(whatsAppForm.message, whatsAppLead),
        botFlowUniqueId: whatsAppForm.botFlowUniqueId.trim(),
        mediaUrl: whatsAppForm.mediaUrl.trim(),
        mediaType: whatsAppForm.mediaType,
        buttons: parseCommaButtons(whatsAppForm.buttons)
      });

      setWhatsAppResult({
        type: result.data?.success ? 'success' : 'warning',
        message: result.data?.response?.message || 'WhatsApp operation completed',
        response: result.data?.response
      });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      setWhatsAppResult({
        type: 'error',
        message: error.message || 'Unable to send WhatsApp message'
      });
    } finally {
      setWhatsAppSending(false);
    }
  };

  const handleSaveBotnexSettings = async (event) => {
    event.preventDefault();
    setBotnexSettingsSaving(true);
    setBotnexSettingsMessage('');

    try {
      await set(ref(db, 'integrations/botnex'), {
        phoneNumberId: botnexSettings.phoneNumberId.trim(),
        accountLabel: botnexSettings.accountLabel.trim() || EMPTY_BOTNEX_SETTINGS.accountLabel,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || null,
        updatedByName: user?.displayName || user?.email || 'Admin'
      });
      setBotnexSettingsMessage('Botnex setup saved.');
    } catch (error) {
      console.error('Error saving Botnex settings:', error);
      setBotnexSettingsMessage('Unable to save Botnex setup.');
    } finally {
      setBotnexSettingsSaving(false);
    }
  };

  const handleRunBotnexOperation = async (event) => {
    event.preventDefault();
    setBotnexLoading(true);
    setBotnexResult(null);
    try {
      const botnexWhatsAppOperation = httpsCallable(functions, 'botnexWhatsAppOperation');
      const result = await botnexWhatsAppOperation({
        operation: botnexForm.operation,
        params: buildBotnexParams()
      });

      setBotnexResult({
        type: result.data?.success ? 'success' : 'warning',
        response: result.data?.response
      });
    } catch (error) {
      console.error('Botnex operation failed:', error);
      setBotnexResult({
        type: 'error',
        response: { message: error.message || 'Botnex operation failed' }
      });
    } finally {
      setBotnexLoading(false);
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

  const exportLeads = () => {
    const columns = [
      ['Company', lead => lead.companyName],
      ['Contact', lead => lead.contactName],
      ['Phone', lead => lead.phone],
      ['Email', lead => lead.email],
      ['City', lead => lead.city],
      ['Service', lead => lead.serviceType],
      ['Package', lead => lead.packageInterest],
      ['Stage', lead => getStageConfig(getStage(lead)).label],
      ['Priority', lead => getPriorityConfig(lead.priority).label],
      ['Value', lead => lead.expectedValue || lead.budget || 0],
      ['Source', lead => lead.source],
      ['Owner', lead => lead.assignedTo],
      ['Follow-up', lead => lead.followUpDate],
      ['Created', lead => lead.createdAt]
    ];
    const escapeCsv = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [
      columns.map(([label]) => escapeCsv(label)).join(','),
      ...filteredLeads.map(lead => columns.map(([, getter]) => escapeCsv(getter(lead))).join(','))
    ].join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `our-vadodara-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
            onClick={exportLeads}
            disabled={!filteredLeads.length}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
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

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              Botnex WhatsApp Operations
            </h2>
            <p className="text-sm text-gray-500">
              Send WhatsApp messages, manage subscribers, labels, templates, bot flows, and conversation lookups.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveBotnexSettings} className="grid gap-4 border-b border-gray-200 bg-emerald-50/40 p-5 dark:border-gray-700 dark:bg-emerald-950/10 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1.5 block text-sm font-medium">WhatsApp Account</label>
            <input
              value={botnexSettings.accountLabel}
              onChange={(e) => updateBotnexSetting('accountLabel', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="Our Vadodara (+919099004346)"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Botnex Phone Number ID</label>
            <input
              value={botnexSettings.phoneNumberId}
              onChange={(e) => updateBotnexSetting('phoneNumberId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="Paste Botnex phone_number_id"
            />
            {botnexSettingsMessage && <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{botnexSettingsMessage}</p>}
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={botnexSettingsSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 lg:w-auto"
            >
              <CheckCircle className="h-4 w-4" />
              {botnexSettingsSaving ? 'Saving...' : 'Save Setup'}
            </button>
          </div>
        </form>

        <form onSubmit={handleRunBotnexOperation} className="grid gap-4 p-5 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Operation</label>
            <select
              value={botnexForm.operation}
              onChange={(e) => updateBotnexField('operation', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              {BOTNEX_OPERATION_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.operations.map(operation => (
                    <option key={operation.id} value={operation.id}>{operation.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Phone Number ID</label>
            <input
              value={botnexForm.phoneNumberId}
              onChange={(e) => updateBotnexField('phoneNumberId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder={botnexSettings.phoneNumberId ? `Saved: ${botnexSettings.phoneNumberId}` : 'Paste phone_number_id'}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Subscriber Phone</label>
            <input
              value={botnexForm.phoneNumber}
              onChange={(e) => updateBotnexField('phoneNumber', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="919099004346"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Limit / Offset</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="1"
                value={botnexForm.limit}
                onChange={(e) => updateBotnexField('limit', e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
              <input
                type="number"
                min="0"
                value={botnexForm.offset}
                onChange={(e) => updateBotnexField('offset', e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Message / Caption</label>
            <textarea
              rows={3}
              value={botnexForm.message}
              onChange={(e) => updateBotnexField('message', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="Message text for send operations"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Buttons</label>
            <input
              value={botnexForm.buttons}
              onChange={(e) => updateBotnexField('buttons', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="Yes,No,Call me"
            />
            <label className="mb-1.5 mt-3 block text-sm font-medium">Bot Flow ID</label>
            <input
              value={botnexForm.botFlowUniqueId}
              onChange={(e) => updateBotnexField('botFlowUniqueId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Media</label>
            <input
              value={botnexForm.mediaUrl}
              onChange={(e) => updateBotnexField('mediaUrl', e.target.value)}
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="https://..."
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={botnexForm.mediaId}
                onChange={(e) => updateBotnexField('mediaId', e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                placeholder="media_id"
              />
              <select
                value={botnexForm.mediaType}
                onChange={(e) => updateBotnexField('mediaType', e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                {['image', 'video', 'audio', 'document'].map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Labels / Sequences</label>
            <input
              value={botnexForm.labelIds}
              onChange={(e) => updateBotnexField('labelIds', e.target.value)}
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="label ids: 1,4,5"
            />
            <input
              value={botnexForm.sequenceIds}
              onChange={(e) => updateBotnexField('sequenceIds', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="sequence ids"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Label / Note / Team</label>
            <input
              value={botnexForm.labelName}
              onChange={(e) => updateBotnexField('labelName', e.target.value)}
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="new label name"
            />
            <input
              value={botnexForm.noteText}
              onChange={(e) => updateBotnexField('noteText', e.target.value)}
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="note text"
            />
            <input
              value={botnexForm.teamMemberId}
              onChange={(e) => updateBotnexField('teamMemberId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="team member id"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Message Status</label>
            <input
              value={botnexForm.waMessageId}
              onChange={(e) => updateBotnexField('waMessageId', e.target.value)}
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="wa_message_id"
            />
            <input
              value={botnexForm.whatsappBotId}
              onChange={(e) => updateBotnexField('whatsappBotId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="whatsapp_bot_id"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Custom Fields JSON</label>
            <textarea
              rows={4}
              value={botnexForm.customFields}
              onChange={(e) => updateBotnexField('customFields', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div className="lg:col-span-4">
            <label className="mb-1.5 block text-sm font-medium">Extra Parameters JSON</label>
            <textarea
              rows={3}
              value={botnexForm.extraJson}
              onChange={(e) => updateBotnexField('extraJson', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-800"
              placeholder='{ "order_unique_id": "...", "cart_status": "Approved" }'
            />
          </div>

          {botnexResult && (
            <div className={`rounded-lg border px-3 py-3 text-sm lg:col-span-4 ${
              botnexResult.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap font-mono text-xs">{JSON.stringify(botnexResult.response, null, 2)}</pre>
            </div>
          )}

          <div className="flex justify-end lg:col-span-4">
            <button
              type="submit"
              disabled={botnexLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {botnexLoading ? 'Running...' : 'Run Operation'}
            </button>
          </div>
        </form>
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
              Create customer WhatsApp replies and team alerts from simple campaign-style templates.
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
          <form onSubmit={handleTemplateSubmit} className="grid gap-5 border-b border-gray-200 p-5 dark:border-gray-700 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">Start with a goal</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {TEMPLATE_PURPOSES.map(purpose => (
                    <button
                      key={purpose.id}
                      type="button"
                      onClick={() => applyTemplatePurpose(purpose.id)}
                      className={`rounded-lg border p-4 text-left transition ${
                        templateForm.purpose === purpose.id
                          ? 'border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 dark:bg-blue-950/30 dark:text-blue-100'
                          : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="block text-sm font-semibold">{purpose.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">{purpose.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Template Name *</label>
                  <input
                    value={templateForm.name}
                    onChange={(e) => updateTemplateField('name', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Instant WhatsApp reply"
                  />
                  {templateErrors.name && <p className="mt-1 text-xs text-red-600">{templateErrors.name}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Tone</label>
                  <select
                    value={templateForm.tone}
                    onChange={(e) => updateTemplateField('tone', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                  >
                    {TEMPLATE_TONES.map(tone => <option key={tone.id} value={tone.id}>{tone.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Send when *</label>
                <div className="grid gap-2 md:grid-cols-2">
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

              <div>
                <label className="mb-2 block text-sm font-medium">Send through *</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { id: 'whatsapp', title: 'WhatsApp to customer', copy: 'Best for enquiry replies and sales follow-ups.' },
                    { id: 'push', title: 'Team push notification', copy: 'Best for internal alerts and reminders.' }
                  ].map(channel => (
                    <label key={channel.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
                      templateForm.channels?.includes(channel.id) ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={templateForm.channels?.includes(channel.id)}
                        onChange={() => toggleTemplateChannel(channel.id)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600"
                      />
                      <span>
                        <span className="block text-sm font-semibold">{channel.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-gray-500">{channel.copy}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {templateErrors.channels && <p className="mt-1 text-xs text-red-600">{templateErrors.channels}</p>}
              </div>

              {templateForm.channels?.includes('whatsapp') && (
                <div className="grid gap-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/10 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">WhatsApp Account Phone Number ID *</label>
                    <input
                      value={templateForm.phoneNumberId}
                      onChange={(e) => updateTemplateField('phoneNumberId', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800"
                      placeholder={botnexSettings.phoneNumberId ? 'Uses saved Botnex setup if blank' : 'Paste Botnex phone_number_id'}
                    />
                    {templateErrors.phoneNumberId && <p className="mt-1 text-xs text-red-600">{templateErrors.phoneNumberId}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">WhatsApp Style</label>
                    <select
                      value={templateForm.whatsAppMessageType}
                      onChange={(e) => updateTemplateField('whatsAppMessageType', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <option value="text">Simple message</option>
                      <option value="buttons">Message with quick buttons</option>
                      <option value="botFlow">Start a Botnex bot flow</option>
                    </select>
                  </div>
                  {templateForm.whatsAppMessageType === 'botFlow' ? (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Bot Flow ID</label>
                      <input
                        value={templateForm.botFlowUniqueId}
                        onChange={(e) => updateTemplateField('botFlowUniqueId', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800"
                        placeholder="bot_flow_unique_id"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Quick Buttons</label>
                      <input
                        value={templateForm.buttons}
                        onChange={(e) => updateTemplateField('buttons', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800"
                        placeholder="View Packages,Talk to Sales,Call Me"
                        disabled={templateForm.whatsAppMessageType !== 'buttons'}
                      />
                      {templateErrors.buttons && <p className="mt-1 text-xs text-red-600">{templateErrors.buttons}</p>}
                    </div>
                  )}
                </div>
              )}

              {templateForm.channels?.includes('push') && (
                <div className="grid gap-4 rounded-lg border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/10 md:grid-cols-2">
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
                    <label className="mb-1.5 block text-sm font-medium">Team Audience</label>
                    <select
                      value={templateForm.audienceTopic}
                      onChange={(e) => updateTemplateField('audienceTopic', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                    >
                      {MESSAGE_AUDIENCES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium">Message *</label>
                <textarea
                  rows={7}
                  value={templateForm.richText}
                  onChange={(e) => updateTemplateField('richText', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Write the message your customer or team should receive..."
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {PERSONALIZATION_FIELDS.map(field => (
                    <button
                      key={field.token}
                      type="button"
                      onClick={() => insertTemplateVariable(field.token)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-300"
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
                {templateErrors.body && <p className="mt-1 text-xs text-red-600">{templateErrors.body}</p>}
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
            </div>

            <aside className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Preview</p>
                <h3 className="mt-1 text-base font-semibold text-gray-950 dark:text-white">
                  {templateForm.channels?.includes('push') ? templateForm.title || 'Push title' : 'WhatsApp message'}
                </h3>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                {interpolateLeadText(templateForm.richText, templatePreviewLead) || 'Your message preview will appear here.'}
              </div>
              {templateForm.channels?.includes('whatsapp') && templateForm.whatsAppMessageType === 'buttons' && (
                <div className="flex flex-wrap gap-2">
                  {parseCommaButtons(templateForm.buttons).map(button => (
                    <span key={button.id} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {button.title}
                    </span>
                  ))}
                </div>
              )}
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                Automatic WhatsApp messages will be sent only when this template is enabled, the trigger matches, and the lead has a phone number.
              </div>
            </aside>

            {templateErrors.submit && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 xl:col-span-2">
                <AlertCircle className="h-4 w-4" />
                {templateErrors.submit}
              </div>
            )}

            <div className="flex justify-end gap-3 xl:col-span-2">
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
              No message templates yet. Create one to automate WhatsApp replies or team alerts.
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
                    {(Array.isArray(template.channels) && template.channels.length ? template.channels : template.sendWhatsApp ? ['whatsapp'] : ['push']).map(channel => (
                      <span key={channel} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        channel === 'whatsapp' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {channel === 'whatsapp' ? 'WhatsApp' : 'Push'}
                      </span>
                    ))}
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
        <div className="grid gap-3 xl:grid-cols-[1fr_160px_200px_150px_180px]">
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            aria-label="Sort leads"
          >
            <option value="updated_desc">Recently updated</option>
            <option value="value_desc">Highest value</option>
            <option value="company_asc">Company A–Z</option>
            <option value="followup_asc">Next follow-up</option>
          </select>
        </div>
      </div>

      {whatsAppLead && (
        <div className="rounded-xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-900 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4 dark:border-emerald-900">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                WhatsApp: {whatsAppLead.companyName}
              </h2>
              <p className="text-sm text-gray-500">{whatsAppLead.contactName} - {whatsAppLead.phone || 'No phone number'}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setWhatsAppLead(null);
                setWhatsAppResult(null);
              }}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              aria-label="Close WhatsApp composer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSendLeadWhatsApp} className="grid gap-4 p-5 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Message Type</label>
              <select
                value={whatsAppForm.messageType}
                onChange={(e) => updateWhatsAppField('messageType', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="text">Text message</option>
                <option value="buttons">Interactive buttons</option>
                <option value="file">File / media</option>
                <option value="botFlow">Bot flow</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone Number ID</label>
              <input
                value={whatsAppForm.phoneNumberId}
                onChange={(e) => updateWhatsAppField('phoneNumberId', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                placeholder="Uses function config if blank"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Bot Flow ID</label>
              <input
                value={whatsAppForm.botFlowUniqueId}
                onChange={(e) => updateWhatsAppField('botFlowUniqueId', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                disabled={whatsAppForm.messageType !== 'botFlow'}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Buttons</label>
              <input
                value={whatsAppForm.buttons}
                onChange={(e) => updateWhatsAppField('buttons', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                disabled={whatsAppForm.messageType !== 'buttons'}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Media Type</label>
              <select
                value={whatsAppForm.mediaType}
                onChange={(e) => updateWhatsAppField('mediaType', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                disabled={whatsAppForm.messageType !== 'file'}
              >
                {['image', 'video', 'audio', 'document'].map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="lg:col-span-4">
              <label className="mb-1.5 block text-sm font-medium">Message</label>
              <textarea
                rows={4}
                value={whatsAppForm.message}
                onChange={(e) => updateWhatsAppField('message', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
              <p className="mt-1 text-xs text-gray-500">
                Variables: {'{{companyName}}'}, {'{{contactName}}'}, {'{{city}}'}, {'{{stage}}'}, {'{{packageInterest}}'}, {'{{followUpDate}}'}
              </p>
            </div>
            <div className="lg:col-span-4">
              <label className="mb-1.5 block text-sm font-medium">Media URL</label>
              <input
                value={whatsAppForm.mediaUrl}
                onChange={(e) => updateWhatsAppField('mediaUrl', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                placeholder="Public HTTPS media URL"
                disabled={whatsAppForm.messageType !== 'file'}
              />
            </div>

            {whatsAppResult && (
              <div className={`rounded-lg border px-3 py-2 text-sm lg:col-span-4 ${
                whatsAppResult.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}>
                {whatsAppResult.message}
              </div>
            )}

            <div className="flex justify-end gap-3 lg:col-span-4">
              <button
                type="button"
                onClick={() => setWhatsAppLead(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={whatsAppSending || !whatsAppLead.phone}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {whatsAppSending ? 'Sending...' : 'Send WhatsApp'}
              </button>
            </div>
          </form>
        </div>
      )}

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
            {paginatedLeads.map((lead) => {
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
                        onClick={() => openWhatsAppForm(lead)}
                        disabled={!lead.phone}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Smartphone className="h-4 w-4" />
                        WhatsApp
                      </button>
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
        {!loading && filteredLeads.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredLeads.length)} of {filteredLeads.length}
            </p>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                aria-label="Leads per page"
              >
                {[10, 25, 50].map(size => <option key={size} value={size}>{size} / page</option>)}
              </select>
              <button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-700">Previous</button>
              <span className="text-sm font-medium">{page} / {totalPages}</span>
              <button type="button" onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-700">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadManagement;
