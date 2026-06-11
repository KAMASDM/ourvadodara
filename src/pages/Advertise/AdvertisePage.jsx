// =============================================
// src/pages/Advertise/AdvertisePage.jsx
// Public enquiry landing page for brand campaigns
// =============================================
import React from 'react';
import {
  ArrowRight,
  CalendarClock,
  Instagram,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';
import CampaignAssistantChat from '../../components/Leads/CampaignAssistantChat';

const AdvertisePage = ({ onBack }) => (
  <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#e0f2fe_0,#f8fafc_34%,#fff7ed_100%)] text-slate-950">
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/75 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-3 text-left"
        >
          <img src={logoImage} alt="OurVadodara" className="h-12 w-12 object-contain" />
          <div>
            <p className="text-base font-bold">OurVadodara</p>
            <p className="text-xs font-semibold text-blue-700">Scroll Indie brand solutions</p>
          </div>
        </button>
        <a
          href="https://www.instagram.com/ourvadodara/"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:inline-flex"
        >
          <Instagram className="h-4 w-4" />
          Instagram
        </a>
      </div>
    </header>

    <main className="mx-auto grid min-h-[calc(100vh-138px)] max-w-7xl items-center gap-8 px-4 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-12">
      <section>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Gujarat to pan-India campaigns
        </div>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
          Grow your brand with OurVadodara & Scroll Indie.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Promotions, social media, influencer marketing, production, PR, and offline branding for brands that want local trust and campaign scale.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            { value: '1.1M+', label: 'Audience network' },
            { value: '9', label: 'City pages' },
            { value: '10 AM-7 PM', label: 'Mon-Sat support' }
          ].map(item => (
            <div key={item.label} className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
              <p className="text-2xl font-black text-slate-950">{item.value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('openCampaignAssistant'))}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"
          >
            Start Campaign Chat
            <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="tel:"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Talk to Team
            <Phone className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="hidden rounded-[2rem] border border-white/75 bg-white/70 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl lg:block">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-700">How it works</p>
        <h2 className="mt-3 text-3xl font-black text-slate-950">The assistant captures your lead first, then guides the campaign.</h2>
        <div className="mt-6 grid gap-3">
          {[
            'Share name, contact, brand and city',
            'Choose services or rate cards',
            'Add requirement, budget and timeline',
            'Lead appears in admin Lead Management'
          ].map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{index + 1}</span>
              <span className="text-sm font-semibold text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </section>
    </main>

    <footer className="border-t border-white/70 bg-white/55 px-4 py-5 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-4">
          <span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4" />Mon-Sat | 10 AM-7 PM</span>
          <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />Rate cards shared by sales team</span>
        </div>
        <span>OurVadodara x Scroll Indie</span>
      </div>
    </footer>

    <CampaignAssistantChat defaultOpen showFab fabBottomClass="bottom-4" />
  </div>
);

export default AdvertisePage;
