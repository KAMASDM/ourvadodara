import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  HelpCircle,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Scale,
  Send,
  ShieldCheck
} from 'lucide-react';

const SUPPORT_EMAIL = 'contact@ourvadodara.com';
const UPDATED_ON = '19 July 2026';

const legalPages = {
  terms: {
    eyebrow: 'Legal information',
    title: 'Terms & Conditions',
    description: 'The rules that apply when you access or use the Our Vadodara website, application, content and related services.',
    icon: Scale,
    summary: [
      'Use Our Vadodara lawfully and respectfully.',
      'Keep your account and submitted information accurate.',
      'Event, advertiser and third-party terms may also apply.',
      'Contact us if you believe content violates your rights.'
    ],
    sections: [
      {
        title: '1. Acceptance of these terms',
        body: [
          'By accessing or using Our Vadodara, you agree to these Terms & Conditions and any policies referenced here. If you do not agree, please do not use the service.',
          'These terms apply to visitors, registered readers, event attendees, contributors, advertisers and anyone else who uses the platform.'
        ]
      },
      {
        title: '2. Eligibility and accounts',
        body: [
          'You must be legally capable of entering into an agreement under applicable law. If you use the service for an organisation, you confirm that you are authorised to accept these terms for that organisation.',
          'You are responsible for keeping your login credentials secure and for activity performed through your account. Information supplied during registration, profile completion, enquiries or bookings must be current and accurate. Notify us promptly if you suspect unauthorised access.'
        ]
      },
      {
        title: '3. Platform services',
        body: [
          'Our Vadodara provides local news, breaking updates, videos, events, offers, notifications, community features and advertising or campaign enquiry tools. Features may vary by location, account type, device or availability.',
          'We may add, change, suspend or discontinue a feature when reasonably necessary for maintenance, security, legal compliance or improvement of the service.'
        ]
      },
      {
        title: '4. News, corrections and editorial content',
        body: [
          'News and city information are provided for general informational purposes. We work to keep published material accurate and current, but developing stories may change and errors can occur.',
          'If you identify a factual error, use the Contact Us page and include the article link and supporting details. Editorial decisions, including corrections, updates, labels and removals, remain with Our Vadodara.'
        ]
      },
      {
        title: '5. User submissions and community conduct',
        body: [
          'When you submit comments, enquiry details, event information, feedback, images or other material, you confirm that you have the rights and permissions needed to share it and that it is accurate to the best of your knowledge.',
          'You retain ownership of your content. You grant Our Vadodara a non-exclusive, worldwide, royalty-free licence to host, reproduce, format and display it only as needed to operate, promote and improve the service.',
          'Do not submit unlawful, defamatory, threatening, hateful, fraudulent, misleading, sexually exploitative, privacy-invasive or infringing material. We may moderate or remove content and restrict accounts that breach these rules.'
        ]
      },
      {
        title: '6. Events, registrations, payments and refunds',
        body: [
          'Event descriptions, schedules, prices, capacity, age restrictions and venue rules are supplied by Our Vadodara or the relevant organiser. Review all event-specific conditions before registering.',
          'A paid booking is confirmed only after successful payment and issuance of a confirmation. Cancellation, transfer and refund eligibility are governed by the policy displayed for that event. Organisers may reasonably change schedules, venues or programmes; material changes will be communicated when contact information is available.',
          'Payment processing may be handled by a third-party payment provider under its own terms and privacy policy. Do not share card, UPI PIN or one-time-password details with anyone claiming to be support.'
        ]
      },
      {
        title: '7. Advertisers, offers and external services',
        body: [
          'Advertisements, sponsored content, coupons and offers may be supplied by third parties. Unless expressly stated, their products, claims, fulfilment and customer service are the advertiser’s responsibility.',
          'Links to other websites or services are provided for convenience. We do not control their content, availability, security or policies, and your use of them is subject to their own terms.'
        ]
      },
      {
        title: '8. Intellectual property',
        body: [
          'The Our Vadodara name, branding, interface, original reporting, graphics, software and other platform material are protected by applicable intellectual-property laws. Third-party names and material remain the property of their respective owners.',
          'You may share links and use content for personal, non-commercial reading. You may not republish, sell, systematically extract, train automated systems on, alter attribution from or commercially exploit platform content without prior written permission or another valid legal basis.'
        ]
      },
      {
        title: '9. Prohibited use',
        body: [
          'You must not interfere with platform operation; bypass access or security controls; probe systems without permission; introduce malware; impersonate another person; harvest personal information; use automated scraping at disruptive scale; manipulate engagement; or use the service to violate law or another person’s rights.',
          'Reasonable indexing by public search engines and accessibility tools is not prohibited by this section.'
        ]
      },
      {
        title: '10. Availability and disclaimers',
        body: [
          'The service is provided on an “as available” basis. To the extent permitted by law, we do not promise uninterrupted availability or that every item will always be complete, error-free or suitable for a particular purpose.',
          'Nothing on the platform is professional legal, medical, financial or emergency advice. For urgent situations, contact the appropriate emergency service or qualified professional.'
        ]
      },
      {
        title: '11. Responsibility and limitation of liability',
        body: [
          'Each party remains responsible for loss directly caused by its unlawful conduct, fraud, wilful misconduct or other liability that cannot legally be excluded. To the extent permitted by law, Our Vadodara is not liable for indirect or consequential loss arising from third-party content, external services, user conduct or events beyond our reasonable control.',
          'Nothing in these terms limits rights or remedies that applicable consumer law does not permit us to exclude.'
        ]
      },
      {
        title: '12. Suspension and termination',
        body: [
          'You may stop using the service at any time. We may restrict or terminate access where we reasonably believe an account creates a security risk, violates these terms, infringes rights or exposes users or the platform to harm. Where appropriate, we may give notice or an opportunity to resolve the issue.'
        ]
      },
      {
        title: '13. Governing law and disputes',
        body: [
          'These terms are governed by the laws of India. Subject to any mandatory consumer forum or remedy available under applicable law, courts with jurisdiction in Vadodara, Gujarat will have jurisdiction over disputes.',
          'Before starting formal proceedings, please contact us so both sides can attempt to resolve the concern in good faith.'
        ]
      },
      {
        title: '14. Changes and contact',
        body: [
          'We may revise these terms to reflect service, legal or operational changes. The updated date will appear on this page. Material changes may also be communicated in the app or through available contact details.',
          `Questions about these terms can be sent to ${SUPPORT_EMAIL}.`
        ]
      }
    ]
  },
  privacy: {
    eyebrow: 'Your information',
    title: 'Privacy Policy',
    description: 'How Our Vadodara collects, uses, shares and protects information when you use our website and application.',
    icon: ShieldCheck,
    summary: [
      'We collect only information needed to provide and improve the service.',
      'We do not sell your personal information.',
      'You control profile, notification and communication preferences.',
      'You can request access, correction or deletion.'
    ],
    sections: [
      {
        title: '1. Scope of this policy',
        body: [
          'This policy applies to Our Vadodara’s website, installed web application and related services. It does not govern websites, payment providers, event organisers or other services that publish their own privacy policies.'
        ]
      },
      {
        title: '2. Information you provide',
        body: [
          'Depending on how you use the platform, you may provide your name, email address, phone number, city, profile details, language preferences, enquiry information, event attendee details, emergency contact information, comments, feedback and material submitted for publication.',
          'If you contact us or communicate with an organiser or advertising team through the platform, we may retain the message and related contact details so the request can be handled.'
        ]
      },
      {
        title: '3. Information collected through use',
        body: [
          'We may collect device and browser type, approximate location derived from city selection or network information, app language, viewed or saved content, reactions, followed topics, search activity, event registrations, notification interactions, timestamps, diagnostic logs and security signals.',
          'Push notifications require a device token. Authentication providers may supply account identifiers and verified contact details according to the permissions shown when you sign in.'
        ]
      },
      {
        title: '4. Cookies and local storage',
        body: [
          'We use cookies, browser storage and similar technologies to keep you signed in, remember preferences, support installed-app features, measure performance and protect the service. Blocking essential storage may prevent parts of the platform from working correctly.',
          'Where non-essential analytics or advertising technologies require consent, we will request it as required by applicable law.'
        ]
      },
      {
        title: '5. How we use information',
        body: [
          'We use information to create and secure accounts; provide local news and personalised features; maintain saved items and activity history; deliver alerts; process event registration; respond to enquiries; manage advertising leads; moderate content; detect misuse; troubleshoot errors; analyse aggregate service performance; and comply with legal obligations.',
          'We may use the contact details you provide to deliver a requested service or important account communication. Promotional messages are sent only where permitted, and you can change eligible preferences or unsubscribe.'
        ]
      },
      {
        title: '6. When information is shared',
        body: [
          'We may share limited information with infrastructure, authentication, database, notification, analytics, email, payment and support providers that process data for us under appropriate obligations.',
          'Event attendee information may be shared with the relevant organiser or venue when necessary to issue or validate a booking, communicate essential updates or maintain safety. Advertising enquiry information may be shared with the team handling that enquiry.',
          'We may disclose information when reasonably necessary to comply with law, enforce rights, investigate fraud or protect users, the public or the service. We do not sell personal information.'
        ]
      },
      {
        title: '7. Public information',
        body: [
          'Comments, profile elements or submissions marked for publication may be visible to other users and may be copied outside the platform. Avoid posting phone numbers, addresses, identification documents or other sensitive information in public fields.'
        ]
      },
      {
        title: '8. Retention',
        body: [
          'We keep personal information only for as long as needed for the purpose described in this policy, including account operation, bookings, support, fraud prevention, dispute resolution and legal or financial recordkeeping.',
          'Retention periods differ by record type. When information is no longer needed, we delete it, anonymise it or securely isolate it until deletion is possible. Backup copies may remain for a limited period.'
        ]
      },
      {
        title: '9. Security',
        body: [
          'We use reasonable technical and organisational safeguards such as authentication, access controls, validation, encrypted network connections and service monitoring. No internet service or storage system is completely secure, so we cannot guarantee absolute security.',
          'Use a strong password, protect one-time passwords and sign out of shared devices. Contact us promptly if you believe your account or information has been compromised.'
        ]
      },
      {
        title: '10. Your choices and requests',
        body: [
          'You can update available profile, language, city and notification settings in the application. You may also request access to, correction of or deletion of your personal information, withdraw consent where processing relies on consent, or raise a privacy concern.',
          `Send requests to ${SUPPORT_EMAIL} from the email address associated with your account when possible. We may need to verify your identity and may retain information where law or legitimate recordkeeping requires it.`
        ]
      },
      {
        title: '11. Children’s privacy',
        body: [
          'The general service is not designed to collect personal information from children without appropriate involvement from a parent or guardian. Event eligibility may vary and is displayed on the relevant event page. If you believe a child has provided information improperly, contact us so we can review it.'
        ]
      },
      {
        title: '12. Service providers and data locations',
        body: [
          'Our service providers may process information from locations outside your state or country. Where applicable, we take reasonable steps to use providers and safeguards appropriate to the information and processing involved.'
        ]
      },
      {
        title: '13. Policy changes and contact',
        body: [
          'We may update this policy as the platform or applicable requirements change. We will update the date on this page and provide additional notice for material changes where appropriate.',
          `For privacy questions or requests, email ${SUPPORT_EMAIL} or use the Contact Us page.`
        ]
      }
    ]
  }
};

const initialForm = {
  name: '',
  email: '',
  phone: '',
  topic: 'General support',
  message: ''
};

const fieldClass = 'mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-900/70 dark:text-white';

const ContactPage = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: '' }));
    setSubmitted(false);
  };

  const submitContact = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (form.phone && !/^\d{10,15}$/.test(form.phone)) nextErrors.phone = 'Enter a valid 10–15 digit phone number.';
    if (form.message.trim().length < 20) nextErrors.message = 'Please provide at least 20 characters so we can help.';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const subject = encodeURIComponent(`[${form.topic}] Message from ${form.name.trim()}`);
    const body = encodeURIComponent([
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Phone: ${form.phone || 'Not provided'}`,
      `Topic: ${form.topic}`,
      '',
      form.message.trim()
    ].join('\n'));
    setSubmitted(true);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <a href={`mailto:${SUPPORT_EMAIL}`} className="group rounded-3xl border border-white/80 bg-white/75 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/70">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Mail className="h-5 w-5" /></span>
          <h2 className="mt-4 font-black text-slate-950 dark:text-white">Email support</h2>
          <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">{SUPPORT_EMAIL}</p>
        </a>
        <div className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><Clock3 className="h-5 w-5" /></span>
          <h2 className="mt-4 font-black text-slate-950 dark:text-white">Support hours</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monday–Saturday<br />10:00 AM–7:00 PM IST</p>
        </div>
        <div className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"><MapPin className="h-5 w-5" /></span>
          <h2 className="mt-4 font-black text-slate-950 dark:text-white">Our location</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Vadodara, Gujarat<br />India</p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
        <form onSubmit={submitContact} noValidate className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8 dark:border-white/10 dark:bg-slate-900/75">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950"><MessageSquareText className="h-5 w-5" /></span>
            <div><h2 className="text-xl font-black text-slate-950 dark:text-white">Send us a message</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Include a post, event or booking reference when relevant.</p></div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full name <span className="text-rose-500">*</span><input value={form.name} onChange={event => updateField('name', event.target.value)} autoComplete="name" className={fieldClass} placeholder="Your name" />{errors.name && <span className="mt-1.5 block text-xs font-semibold text-rose-600">{errors.name}</span>}</label>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email address <span className="text-rose-500">*</span><input type="email" value={form.email} onChange={event => updateField('email', event.target.value)} autoComplete="email" className={fieldClass} placeholder="you@example.com" />{errors.email && <span className="mt-1.5 block text-xs font-semibold text-rose-600">{errors.email}</span>}</label>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone number <span className="font-medium text-slate-400">(optional)</span><input type="tel" inputMode="numeric" pattern="[0-9]*" value={form.phone} onChange={event => updateField('phone', event.target.value.replace(/\D/g, '').slice(0, 15))} autoComplete="tel" className={fieldClass} placeholder="10–15 digit number" />{errors.phone && <span className="mt-1.5 block text-xs font-semibold text-rose-600">{errors.phone}</span>}</label>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">How can we help?<select value={form.topic} onChange={event => updateField('topic', event.target.value)} className={fieldClass}>{['General support', 'Report a correction', 'Event or registration', 'Advertising enquiry', 'Account or privacy', 'Technical issue'].map(topic => <option key={topic}>{topic}</option>)}</select></label>
          </div>
          <label className="mt-5 block text-sm font-bold text-slate-700 dark:text-slate-300">Message <span className="text-rose-500">*</span><textarea value={form.message} onChange={event => updateField('message', event.target.value.slice(0, 2000))} rows="6" className={`${fieldClass} resize-y`} placeholder="Tell us what happened and include any useful link or reference…" /><span className="mt-1.5 flex justify-between text-xs"><span className="font-semibold text-rose-600">{errors.message}</span><span className="text-slate-400">{form.message.length}/2000</span></span></label>
          {submitted && <p role="status" className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5 shrink-0" />Your email application has been opened with the message prepared. Send it from there to complete your request.</p>}
          <button type="submit" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 sm:w-auto"><Send className="h-4 w-4" />Prepare email</button>
          <p className="mt-3 text-xs leading-5 text-slate-400">This form prepares an email in your device’s email application. It does not submit information until you send that email.</p>
        </form>

        <aside className="space-y-4">
          <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl dark:bg-black">
            <HelpCircle className="h-7 w-7 text-teal-300" />
            <h2 className="mt-4 text-xl font-black">Get a faster answer</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>• Share the exact article or event link.</li>
              <li>• Include your booking or enquiry reference.</li>
              <li>• Describe your device and browser for technical issues.</li>
              <li>• Never email passwords, OTPs or payment PINs.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
            <h3 className="flex items-center gap-2 font-black text-amber-950 dark:text-amber-200"><Phone className="h-5 w-5" />Emergency requests</h3>
            <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-300">Our inbox is not an emergency service. Contact the appropriate local emergency authority when immediate help is required.</p>
          </div>
        </aside>
      </section>
    </>
  );
};

const LegalDocument = ({ data }) => (
  <div className="grid gap-7 lg:grid-cols-[250px_minmax(0,1fr)]">
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <div className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">At a glance</h2>
        <ul className="mt-4 space-y-3">{data.summary.map(item => <li key={item} className="flex gap-2 text-sm leading-5 text-slate-600 dark:text-slate-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{item}</li>)}</ul>
      </div>
      <nav aria-label={`${data.title} contents`} className="mt-4 hidden max-h-[48vh] overflow-y-auto rounded-3xl border border-white/80 bg-white/60 p-4 lg:block dark:border-white/10 dark:bg-slate-900/50">
        <p className="px-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">On this page</p>
        <div className="mt-2 space-y-0.5">{data.sections.map((section, index) => <a key={section.title} href={`#section-${index + 1}`} className="block rounded-xl px-2 py-2 text-xs font-semibold leading-4 text-slate-500 transition hover:bg-white hover:text-blue-700 dark:hover:bg-white/10 dark:hover:text-blue-300">{section.title}</a>)}</div>
      </nav>
    </aside>
    <article className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-9 dark:border-white/10 dark:bg-slate-900/75">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm leading-6 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">Please read this document carefully. Headings help navigation but do not limit the meaning of the section text.</div>
      <div className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
        {data.sections.map((section, index) => (
          <section id={`section-${index + 1}`} key={section.title} className="scroll-mt-28 py-7 first:pt-5">
            <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{section.title}</h2>
            <div className="mt-3 space-y-3">{section.body.map(paragraph => <p key={paragraph} className="text-[15px] leading-7 text-slate-600 dark:text-slate-300">{paragraph}</p>)}</div>
          </section>
        ))}
      </div>
    </article>
  </div>
);

const LegalPage = ({ page = 'contact', onBack, onNavigate }) => {
  const isContact = page === 'contact';
  const data = legalPages[page] || legalPages.terms;
  const Icon = isContact ? Mail : data.icon;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = `${isContact ? 'Contact Us' : data.title} | Our Vadodara`;
    return () => { document.title = 'Our Vadodara'; };
  }, [data.title, isContact]);

  const navigate = (destination) => {
    if (onNavigate) {
      onNavigate(destination);
      return;
    }
    window.location.assign(`/${destination}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,.15),transparent_34%),radial-gradient(circle_at_top_right,rgba(96,165,250,.16),transparent_32%)] px-4 pb-28 pt-4 text-slate-900 dark:text-slate-100 sm:px-6 sm:pb-12 sm:pt-6">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200"><ArrowLeft className="h-4 w-4" />Back to home</button>

        <header className="relative my-6 overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-9 text-white shadow-2xl shadow-blue-950/15 sm:px-10 sm:py-12">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15"><Icon className="h-6 w-6 text-teal-300" /></span>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-teal-300">{isContact ? 'We are here to help' : data.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{isContact ? 'Contact Us' : data.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">{isContact ? 'Questions, corrections, event support and business enquiries—all routed to the right Our Vadodara team.' : data.description}</p>
            {!isContact && <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300"><FileText className="h-3.5 w-3.5" />Effective and last updated: {UPDATED_ON}</p>}
          </div>
        </header>

        {isContact ? <ContactPage /> : <LegalDocument data={data} />}

        <footer className="mt-10 rounded-[2rem] border border-white/80 bg-white/65 p-5 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Building2 className="h-5 w-5" /></span><div><p className="font-black text-slate-950 dark:text-white">Our Vadodara</p><p className="text-xs text-slate-500">Vadodara’s city news and community platform</p></div></div>
            <nav aria-label="Legal and support" className="flex flex-wrap gap-2">
              {[['contact', 'Contact Us'], ['terms', 'Terms & Conditions'], ['privacy', 'Privacy Policy']].map(([destination, label]) => <button key={destination} type="button" onClick={() => navigate(destination)} aria-current={page === destination ? 'page' : undefined} className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold transition ${page === destination ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-white/10'}`}>{label}{page !== destination && <ArrowRight className="h-3 w-3" />}</button>)}
            </nav>
          </div>
          <div className="mt-5 flex flex-col gap-2 border-t border-slate-200/80 pt-4 text-xs text-slate-400 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Our Vadodara. All rights reserved.</span><span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5" />Please never share passwords, OTPs or payment PINs.</span></div>
        </footer>
      </div>
    </div>
  );
};

export default LegalPage;
