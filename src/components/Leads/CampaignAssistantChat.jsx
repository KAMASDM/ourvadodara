// =============================================
// src/components/Leads/CampaignAssistantChat.jsx
// Floating campaign enquiry chatbot with lead capture
// =============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  ChevronLeft,
  FileText,
  Globe2,
  Megaphone,
  MessageCircle,
  Minus,
  Phone,
  Send,
  Target,
  Users,
  Video,
  X
} from 'lucide-react';
import { functions, httpsCallable } from '../../firebase-config';

const SERVICES = [
  {
    id: 'promotions',
    label: 'Promotions & Advertising',
    shortLabel: 'Promotions',
    serviceType: 'advertising',
    packageInterest: 'Promotions and advertising rate card',
    icon: Megaphone,
    pdfName: 'Promotions Rate Card',
    summary: 'We help with brand promotions, product launches, store launches, and festival campaigns.'
  },
  {
    id: 'social_media',
    label: 'Social Media Management',
    shortLabel: 'Social Media',
    serviceType: 'digital_marketing',
    packageInterest: 'Social media management pricing',
    icon: Globe2,
    pdfName: 'SMM Pricing PDF',
    summary: 'We plan, design, publish, and manage content for brands that need consistent digital growth.'
  },
  {
    id: 'influencer',
    label: 'Influencer Marketing',
    shortLabel: 'Influencer',
    serviceType: 'digital_marketing',
    packageInterest: 'Influencer marketing rate card',
    icon: Users,
    pdfName: 'Influencer Rate Card',
    summary: 'We connect brands with relevant creators for local, regional, and campaign-led influencer activations.'
  },
  {
    id: 'pr',
    label: 'PR & Event Coverage',
    shortLabel: 'PR',
    serviceType: 'advertising',
    packageInterest: 'PR and media coverage packages',
    icon: FileText,
    pdfName: 'PR / Media Packages PDF',
    summary: 'We cover launches, events, announcements, and public relations stories across our media network.'
  },
  {
    id: 'shoots',
    label: 'Photo/Video Shoots',
    shortLabel: 'Shoots',
    serviceType: 'digital_marketing',
    packageInterest: 'Photo/video production package',
    icon: Video,
    pdfName: 'Production Package PDF',
    summary: 'We create campaign videos, product shoots, reels, interviews, and branded content assets.'
  },
  {
    id: 'offline',
    label: 'Offline Branding',
    shortLabel: 'Offline',
    serviceType: 'advertising',
    packageInterest: 'Offline branding packages',
    icon: Building2,
    pdfName: 'Offline Branding PDF',
    summary: 'We support city visibility through hoardings, offline branding, local activations, and campaign placements.'
  },
  {
    id: 'talent',
    label: 'Celebrity / Talent Requirement',
    shortLabel: 'Talent',
    serviceType: 'combined',
    packageInterest: 'Celebrity and talent requirement',
    icon: BadgeCheck,
    pdfName: 'Talent Requirement Details',
    summary: 'We help source creators, public figures, anchors, celebrities, and campaign faces based on brand needs.'
  },
  {
    id: 'brand_launch',
    label: 'Brand Launch Campaigns',
    shortLabel: 'Brand Launch',
    serviceType: 'combined',
    packageInterest: 'Brand launch campaign package',
    icon: Target,
    pdfName: 'Brand Launch Campaign Deck',
    summary: 'We build launch campaigns using media coverage, social promotion, creators, production, and on-ground visibility.'
  }
];

const EMPTY_LEAD_FORM = {
  contactName: '',
  phone: '',
  email: '',
  brandName: '',
  city: '',
  businessCategory: ''
};

const EMPTY_REQUIREMENT_FORM = {
  requirement: '',
  budget: '',
  timeline: ''
};

const splitServices = (page) => SERVICES.slice(page * 3, page * 3 + 3);

const CampaignAssistantChat = ({
  defaultOpen = false,
  showFab = true,
  className = '',
  fabBottomClass = 'bottom-[94px] lg:bottom-6'
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadId, setLeadId] = useState(null);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      title: 'Hi, I am your Campaign Assistant.',
      text: 'Before I suggest services or rate cards, please share a few details so our team can help you properly.'
    }
  ]);
  const [leadForm, setLeadForm] = useState(EMPTY_LEAD_FORM);
  const [requirementForm, setRequirementForm] = useState(EMPTY_REQUIREMENT_FORM);
  const [errors, setErrors] = useState({});
  const [servicePage, setServicePage] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  const visibleServices = useMemo(() => splitServices(servicePage), [servicePage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing, formMode, open]);

  useEffect(() => () => window.clearTimeout(typingTimerRef.current), []);

  useEffect(() => {
    const openAssistant = () => setOpen(true);
    window.addEventListener('openCampaignAssistant', openAssistant);
    return () => window.removeEventListener('openCampaignAssistant', openAssistant);
  }, []);

  const addBotReply = (userText, botMessage) => {
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setTyping(true);
    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      setMessages(prev => [...prev, botMessage]);
      setTyping(false);
    }, 520);
  };

  const appendLeadActivity = async (message, note = '', service = selectedService) => {
    if (!leadId) return;
    const updatePublicLead = httpsCallable(functions, 'updatePublicLead');
    await updatePublicLead({
      leadId,
      message,
      note,
      serviceType: service?.serviceType || 'combined',
      packageInterest: service?.packageInterest || 'General campaign enquiry',
      priority: formMode === 'talk' ? 'hot' : 'warm',
      budgetRange: requirementForm.budget
    });
  };

  const validateLeadForm = () => {
    const nextErrors = {};
    if (!leadForm.contactName.trim()) nextErrors.contactName = 'Name is required';
    if (!leadForm.phone.trim() && !leadForm.email.trim()) nextErrors.contact = 'Phone or email is required';
    if (!leadForm.brandName.trim()) nextErrors.brandName = 'Brand name is required';
    if (!leadForm.city.trim()) nextErrors.city = 'City is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitLeadCapture = async (event) => {
    event.preventDefault();
    if (!validateLeadForm()) return;

    setSaving(true);
    try {
      const createPublicLead = httpsCallable(functions, 'createPublicLead');
      const result = await createPublicLead({
        companyName: leadForm.brandName.trim(),
        contactName: leadForm.contactName.trim(),
        phone: leadForm.phone.trim(),
        email: leadForm.email.trim(),
        city: leadForm.city.trim(),
        businessCategory: leadForm.businessCategory.trim()
      });

      const nextLeadId = result.data?.leadId;
      if (!nextLeadId) {
        throw new Error('Lead id missing from createPublicLead response');
      }

      setLeadId(nextLeadId);
      setLeadCaptured(true);
      setMessages(prev => [
        ...prev,
        { sender: 'user', text: `${leadForm.contactName} from ${leadForm.brandName}` },
        {
          sender: 'bot',
          title: `Thanks, ${leadForm.contactName.split(' ')[0] || 'there'}.`,
          text: 'I have shared your basic details with our team. Now tell me what you would like to explore.',
          actions: [
            { label: 'About Us', value: 'about' },
            { label: 'Services', value: 'services' },
            { label: 'Get Rate Card', value: 'rate_card' },
            { label: 'Talk to Team', value: 'talk' }
          ]
        }
      ]);
      setErrors({});
    } catch (error) {
      console.error('Error capturing lead:', error);
      setErrors({ submit: 'Unable to save your details. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const validateRequirementForm = () => {
    const nextErrors = {};
    if (!requirementForm.requirement.trim()) nextErrors.requirement = 'Requirement is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitRequirement = async (event) => {
    event.preventDefault();
    if (!validateRequirementForm()) return;
    setSaving(true);
    try {
      const service = selectedService || SERVICES[0];
      const note = [
        requirementForm.requirement.trim(),
        formMode === 'rate_card' ? `Requested PDF: ${service.pdfName}` : '',
        requirementForm.budget ? `Budget: ${requirementForm.budget}` : '',
        requirementForm.timeline ? `Timeline: ${requirementForm.timeline}` : ''
      ].filter(Boolean).join('\n');

      await appendLeadActivity(formMode === 'rate_card' ? 'Rate card requested' : 'Requirement shared', note, service);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          title: 'Done. I have updated your enquiry.',
          text: 'Our sales team will connect shortly. Office timings: Mon-Sat | 10 AM-7 PM.'
        }
      ]);
      setRequirementForm(EMPTY_REQUIREMENT_FORM);
      setFormMode(null);
    } catch (error) {
      console.error('Error updating lead:', error);
      setErrors({ submit: 'Unable to update your enquiry. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleBotAction = async (action, service = null) => {
    if (!leadCaptured) return;

    if (action === 'about') {
      addBotReply('About Us', {
        sender: 'bot',
        title: 'Sure. Here is the quick version.',
        text: 'OurVadodara is Gujarat\'s leading hyperlocal media network with 1.1M+ audience across 9 city pages. Scroll Indie is our evolved media identity for larger campaigns and pan-India collaborations.',
        actions: [
          { label: 'View Services', value: 'services' },
          { label: 'Get Rate Card', value: 'rate_card' },
          { label: 'Talk to Team', value: 'talk' }
        ],
        links: true
      });
      return;
    }

    if (action === 'services') {
      setServicePage(0);
      addBotReply('Services', {
        sender: 'bot',
        title: 'Perfect. What kind of help do you need?',
        text: 'Choose one service below. I will explain what it includes and show the next steps.',
        serviceMenu: true
      });
      return;
    }

    if (action === 'rate_card') {
      setServicePage(0);
      addBotReply('Get Rate Card', {
        sender: 'bot',
        title: 'Of course. Which rate card should I arrange?',
        text: 'Pick a service and share your requirement. Our team will send the right PDF and package information.',
        rateCardMenu: true
      });
      return;
    }

    if (action === 'talk') {
      setSelectedService(service);
      setFormMode('talk');
      await appendLeadActivity('Talk to team requested', service?.label || 'General enquiry', service);
      addBotReply('Talk to Team', {
        sender: 'bot',
        title: 'Absolutely. I have marked this for the sales team.',
        text: 'Add your requirement, budget, and timeline below so the team can call with the right recommendation.'
      });
      return;
    }

    if (action === 'service_selected' && service) {
      setSelectedService(service);
      await appendLeadActivity(`Interested in ${service.label}`, service.summary, service);
      addBotReply(service.label, {
        sender: 'bot',
        title: `Great choice: ${service.label}`,
        text: `${service.summary} What would you like to do next?`,
        actions: [
          { label: 'View Rate Card', value: 'view_rate_card', service },
          { label: 'Share Requirement', value: 'share_requirement', service },
          { label: 'Talk to Team', value: 'talk', service }
        ]
      });
      return;
    }

    if (action === 'view_rate_card' && service) {
      setSelectedService(service);
      setFormMode('rate_card');
      addBotReply(`View ${service.pdfName}`, {
        sender: 'bot',
        title: 'I can help with that.',
        text: `Add the requirement below. The team will send the ${service.pdfName} and guide you on the best package.`
      });
      return;
    }

    if (action === 'share_requirement' && service) {
      setSelectedService(service);
      setFormMode('requirement');
      addBotReply('Share Requirement', {
        sender: 'bot',
        title: 'Nice. Let us understand the campaign first.',
        text: 'Share your requirement, budget range, and timeline. This helps the team recommend the right plan.'
      });
    }
  };

  const renderServiceButtons = (asRateCard = false) => (
    <div className="grid gap-2 sm:grid-cols-3">
      {visibleServices.map((service) => {
        const Icon = service.icon;
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => handleBotAction(asRateCard ? 'view_rate_card' : 'service_selected', service)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            <Icon className="h-4 w-4 text-blue-600" />
            {service.shortLabel}
          </button>
        );
      })}
      <div className="flex gap-2 sm:col-span-3">
        {servicePage > 0 && (
          <button
            type="button"
            onClick={() => setServicePage(prev => Math.max(0, prev - 1))}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>
        )}
        {(servicePage + 1) * 3 < SERVICES.length && (
          <button
            type="button"
            onClick={() => setServicePage(prev => prev + 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            More services
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  const chatWindow = open && (
    <section className={`fixed bottom-4 right-3 z-[70] flex h-[min(680px,calc(100vh-2rem))] w-[calc(100vw-1.5rem)] max-w-[430px] flex-col overflow-hidden rounded-[1.7rem] border border-white/75 bg-white shadow-2xl shadow-slate-950/20 lg:right-6 ${className}`}>
      <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/30">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold">Campaign Assistant</p>
            <p className="text-xs text-slate-300">OurVadodara x Scroll Indie</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-bold text-emerald-200 sm:inline-flex">Online</span>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-300 hover:bg-white/10" aria-label="Minimize Campaign Assistant">
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
        {messages.map((message, index) => (
          <div key={`${message.sender}-${index}`} className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.sender === 'bot' && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div className={`max-w-[84%] rounded-3xl px-4 py-3 shadow-sm ${message.sender === 'user' ? 'rounded-br-md bg-blue-600 text-white' : 'rounded-bl-md bg-white text-slate-800'}`}>
              {message.title && <p className={`font-bold ${message.sender === 'user' ? 'text-white' : 'text-slate-950'}`}>{message.title}</p>}
              <p className={`mt-1 whitespace-pre-line text-sm leading-6 ${message.sender === 'user' ? 'text-white' : 'text-slate-600'}`}>{message.text}</p>

              {message.links && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href="https://www.instagram.com/ourvadodara/" target="_blank" rel="noreferrer" className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">Visit Instagram</a>
                  <a href="/" className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">Visit Website</a>
                </div>
              )}

              {message.actions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.actions.map(action => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => handleBotAction(action.value, action.service)}
                      className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {message.serviceMenu && <div className="mt-3">{renderServiceButtons(false)}</div>}
              {message.rateCardMenu && <div className="mt-3">{renderServiceButtons(true)}</div>}
            </div>
            {message.sender === 'user' && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white shadow-sm">
                You
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div className="flex items-end gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-3xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
              </div>
            </div>
          </div>
        )}

        {!leadCaptured && (
          <form onSubmit={submitLeadCapture} className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-slate-950">Your details</p>
            <p className="mt-1 text-xs text-slate-500">This creates a lead in admin before the assistant starts.</p>
            <div className="mt-4 grid gap-3">
              <div>
                <input value={leadForm.contactName} onChange={(e) => setLeadForm(prev => ({ ...prev, contactName: e.target.value }))} placeholder="Your name *" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100" />
                {errors.contactName && <p className="mt-1 text-xs text-red-600">{errors.contactName}</p>}
              </div>
              <div>
                <input value={leadForm.brandName} onChange={(e) => setLeadForm(prev => ({ ...prev, brandName: e.target.value }))} placeholder="Brand name *" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100" />
                {errors.brandName && <p className="mt-1 text-xs text-red-600">{errors.brandName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input value={leadForm.phone} onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100" />
                  {errors.contact && <p className="mt-1 text-xs text-red-600">{errors.contact}</p>}
                </div>
                <input value={leadForm.email} onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" type="email" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input value={leadForm.city} onChange={(e) => setLeadForm(prev => ({ ...prev, city: e.target.value }))} placeholder="City *" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100" />
                  {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
                </div>
                <input value={leadForm.businessCategory} onChange={(e) => setLeadForm(prev => ({ ...prev, businessCategory: e.target.value }))} placeholder="Category" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100" />
              </div>
            </div>
            {errors.submit && <p className="mt-2 text-xs font-semibold text-red-600">{errors.submit}</p>}
            <button type="submit" disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Start Chat'}
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}

        {formMode && leadCaptured && (
          <form onSubmit={submitRequirement} className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">
                  {formMode === 'rate_card' ? 'Send me the rate card' : formMode === 'talk' ? 'Talk to team' : 'Share requirement'}
                </p>
                <p className="mt-1 text-xs text-slate-500">{selectedService?.label || 'Brand enquiry'}</p>
              </div>
              <button type="button" onClick={() => setFormMode(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close requirement form">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <div>
                <textarea value={requirementForm.requirement} onChange={(e) => setRequirementForm(prev => ({ ...prev, requirement: e.target.value }))} rows={3} placeholder="Requirement *" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100" />
                {errors.requirement && <p className="mt-1 text-xs text-red-600">{errors.requirement}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={requirementForm.budget} onChange={(e) => setRequirementForm(prev => ({ ...prev, budget: e.target.value }))} placeholder="Budget range" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100" />
                <input value={requirementForm.timeline} onChange={(e) => setRequirementForm(prev => ({ ...prev, timeline: e.target.value }))} placeholder="Timeline" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100" />
              </div>
            </div>
            {errors.submit && <p className="mt-2 text-xs font-semibold text-red-600">{errors.submit}</p>}
            <button type="submit" disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Submitting...' : 'Submit'}
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
        <div ref={chatEndRef} />
      </div>
    </section>
  );

  return (
    <>
      {showFab && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`fixed right-4 z-[65] flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-slate-900/25 transition hover:-translate-y-0.5 hover:bg-blue-700 active:scale-95 lg:right-6 ${fabBottomClass}`}
          aria-label="Open Campaign Assistant"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">Campaign Assistant</span>
        </button>
      )}
      {chatWindow}
    </>
  );
};

export default CampaignAssistantChat;
