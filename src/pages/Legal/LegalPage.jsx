import React from 'react';
import { ArrowLeft, Mail, MapPin } from 'lucide-react';

const content = {
  contact: {
    title: 'Contact Us',
    intro: 'Questions, corrections, advertising enquiries, and support requests are welcome.',
    sections: []
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'These terms govern your use of the Our Vadodara website and installed web application.',
    sections: [
      ['Using the service', 'Use the platform lawfully and do not attempt to disrupt, scrape, reverse engineer, or gain unauthorized access to accounts, systems, or data.'],
      ['Accounts and submissions', 'You are responsible for your account activity and for ensuring information you submit is accurate. We may moderate or remove unlawful, abusive, misleading, or infringing content.'],
      ['News and third-party content', 'News, event, and external-link information is provided for general information. Third-party services and websites have their own terms and availability.'],
      ['Events and purchases', 'Event availability, pricing, refunds, venue rules, and organizer conditions are shown during booking. A registration is confirmed only after any required payment succeeds.'],
      ['Changes and suspension', 'We may update features or these terms and may restrict access when necessary for security, abuse prevention, maintenance, or legal compliance.']
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This policy explains the information Our Vadodara uses to operate and improve the service.',
    sections: [
      ['Information we collect', 'We may process account and contact details, profile information, saved content, reactions, comments, event registrations, device tokens, and basic usage and diagnostic data.'],
      ['How information is used', 'Information is used to authenticate users, personalize content, provide notifications, process enquiries and event registrations, prevent abuse, and understand service performance.'],
      ['Sharing and retention', 'We share data only with service providers and event or campaign teams when needed to deliver a requested service, or when required by law. Records are retained only as long as operationally or legally necessary.'],
      ['Your choices', 'You may update profile and notification preferences in the app. You can request access, correction, or deletion by contacting us.'],
      ['Security', 'We use access controls and validation to protect information, but no internet service can guarantee absolute security. Report suspected account misuse promptly.']
    ]
  }
};

const LegalPage = ({ page = 'contact', onBack }) => {
  const data = content[page] || content.contact;
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <article className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10 dark:border-gray-800 dark:bg-gray-900">
        <button onClick={onBack} className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h1 className="text-3xl font-black text-gray-950 sm:text-4xl dark:text-white">{data.title}</h1>
        <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">{data.intro}</p>
        {page === 'contact' ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a href="mailto:contact@ourvadodara.com" className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700"><Mail className="h-6 w-6 text-blue-600" /><h2 className="mt-3 font-bold dark:text-white">Email</h2><p className="mt-1 text-sm text-gray-500">contact@ourvadodara.com</p></a>
            <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700"><MapPin className="h-6 w-6 text-blue-600" /><h2 className="mt-3 font-bold dark:text-white">Vadodara, Gujarat, India</h2><p className="mt-1 text-sm text-gray-500">Support hours: Mon–Sat, 10 AM–7 PM</p></div>
            <p className="rounded-2xl border border-gray-200 p-5 text-sm text-gray-500 sm:col-span-2 dark:border-gray-700">Include the relevant post, event, account, or enquiry reference so the team can respond quickly.</p>
          </div>
        ) : <div className="mt-9 space-y-8">{data.sections.map(([heading, body]) => <section key={heading}><h2 className="text-xl font-bold dark:text-white">{heading}</h2><p className="mt-2 leading-7 text-gray-600 dark:text-gray-300">{body}</p></section>)}</div>}
        <p className="mt-10 border-t border-gray-200 pt-5 text-sm text-gray-500 dark:border-gray-800">Last updated: 18 July 2026</p>
      </article>
    </main>
  );
};

export default LegalPage;
