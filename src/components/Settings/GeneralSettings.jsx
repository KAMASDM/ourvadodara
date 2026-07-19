import React from 'react';
import {
  ArrowLeft,
  Bell,
  Bookmark,
  ChevronRight,
  FileText,
  Globe2,
  Mail,
  MapPin,
  Settings,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useCity } from '../../context/CityContext';
import { useLanguage } from '../../context/Language/LanguageContext';

const navigateTo = path => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const SettingsLink = ({ icon, title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-4 text-left transition hover:border-teal-300 hover:bg-teal-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-800 dark:hover:bg-teal-950/30"
  >
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{React.createElement(icon, { className: 'h-5 w-5' })}</span>
    <span className="min-w-0 flex-1"><span className="block font-extrabold text-slate-950 dark:text-white">{title}</span><span className="mt-0.5 block text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</span></span>
    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
  </button>
);

const GeneralSettings = () => {
  const { user } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { currentCity, setCurrentCity, cities } = useCity();

  return (
    <div className="min-h-screen bg-slate-50 pb-24 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-5 sm:py-8">
        <div className="mb-6 flex items-center gap-3">
          <button type="button" onClick={() => navigateTo('/profile')} className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:ring-slate-800" aria-label="Back to profile"><ArrowLeft className="h-5 w-5" /></button>
          <div><p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">Preferences</p><h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">General settings</h1></div>
        </div>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200/80 p-5 dark:border-slate-800">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300"><Settings className="h-5 w-5" /></span><div><h2 className="font-black text-slate-950 dark:text-white">App preferences</h2><p className="text-sm text-slate-500 dark:text-slate-400">Changes are applied immediately on this device.</p></div></div>
          </div>

          <div className="space-y-5 p-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-200"><MapPin className="h-4 w-4 text-teal-600" /> Default city</span>
              <select value={currentCity?.id || ''} onChange={changeEvent => { const city = cities.find(item => item.id === changeEvent.target.value); if (city) setCurrentCity(city); }} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-teal-950">
                {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-200"><Globe2 className="h-4 w-4 text-teal-600" /> App language</span>
              <select value={currentLanguage} onChange={changeEvent => changeLanguage(changeEvent.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-teal-950">
                <option value="en">English</option><option value="hi">हिंदी</option><option value="gu">ગુજરાતી</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 px-1 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Your account</h2>
          <div className="space-y-3">
            <SettingsLink icon={UserRound} title="Edit profile" description={user?.email || 'Update your personal and contact information'} onClick={() => navigateTo('/profile')} />
            <SettingsLink icon={Bookmark} title="Saved news and events" description="Open everything you have bookmarked" onClick={() => navigateTo('/saved')} />
            <SettingsLink icon={Bell} title="Notification preferences" description="Choose which alerts and updates you receive" onClick={() => navigateTo('/notifications-settings')} />
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 px-1 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Support & legal</h2>
          <div className="space-y-3">
            <SettingsLink icon={Mail} title="Contact Us" description="Get support, report a correction or send an enquiry" onClick={() => navigateTo('/contact')} />
            <SettingsLink icon={FileText} title="Terms & Conditions" description="Read the rules for using Our Vadodara" onClick={() => navigateTo('/terms')} />
            <SettingsLink icon={ShieldCheck} title="Privacy Policy" description="Understand how your information is handled" onClick={() => navigateTo('/privacy')} />
          </div>
        </section>

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p className="text-sm leading-6">Your city and language preferences stay on this device. Account and notification settings are protected by your sign-in.</p>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
