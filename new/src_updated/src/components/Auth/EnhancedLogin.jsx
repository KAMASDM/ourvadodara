// =============================================
// src/components/Auth/EnhancedLogin.jsx
// Modern login — EN/हिं/ગુ toggle, Google OAuth,
// email magic-link, phone OTP, guest mode. Clean state machine.
// =============================================
import React, { useState, useCallback, useMemo } from 'react';
import { Mail, Phone, ArrowRight, ChevronLeft, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/Language/LanguageContext';
import Logo from '../Shared/Logo';

const LANGS = [
  { code: 'en', label: 'English', sample: 'Welcome to Our Vadodara' },
  { code: 'hi', label: 'हिंदी',    sample: 'हमारा वडोदरा में आपका स्वागत है' },
  { code: 'gu', label: 'ગુજરાતી',  sample: 'અમારા વડોદરામાં આપનું સ્વાગત છે' },
];

const I18N = {
  en: { signIn: 'Sign in', subtitle: "Your city's pulse in one tap.",
        google: 'Continue with Google', email: 'Continue with email', phone: 'Continue with phone',
        or: 'or', guest: 'Browse as guest', tos: 'By continuing you agree to our Terms & Privacy.',
        emailLabel: 'Email address', phoneLabel: 'Mobile number', otpLabel: 'Verification code',
        send: 'Send magic link', sendOtp: 'Send OTP', verify: 'Verify', back: 'Back',
        emailSentTitle: 'Check your inbox', emailSentBody: "We've sent a sign-in link to " },
  hi: { signIn: 'साइन इन', subtitle: 'आपके शहर की धड़कन, एक टैप में।',
        google: 'Google से जारी रखें', email: 'ईमेल से जारी रखें', phone: 'फ़ोन से जारी रखें',
        or: 'या', guest: 'अतिथि के रूप में देखें', tos: 'जारी रखकर आप हमारी शर्तें व गोपनीयता से सहमत हैं।',
        emailLabel: 'ईमेल पता', phoneLabel: 'मोबाइल नंबर', otpLabel: 'सत्यापन कोड',
        send: 'लिंक भेजें', sendOtp: 'OTP भेजें', verify: 'सत्यापित करें', back: 'वापस',
        emailSentTitle: 'अपना इनबॉक्स देखें', emailSentBody: 'हमने साइन-इन लिंक भेजा है ' },
  gu: { signIn: 'સાઇન ઇન', subtitle: 'આપના શહેરનો ધબકાર, એક ટેપમાં.',
        google: 'Google સાથે ચાલુ રાખો', email: 'ઈમેઈલ સાથે ચાલુ રાખો', phone: 'ફોન સાથે ચાલુ રાખો',
        or: 'અથવા', guest: 'મહેમાન તરીકે જુઓ', tos: 'ચાલુ રાખીને તમે અમારી શરતો અને ગોપનીયતા સાથે સંમત થાવ છો.',
        emailLabel: 'ઈમેઈલ સરનામું', phoneLabel: 'મોબાઇલ નંબર', otpLabel: 'વેરિફિકેશન કોડ',
        send: 'લિંક મોકલો', sendOtp: 'OTP મોકલો', verify: 'ચકાસો', back: 'પાછળ',
        emailSentTitle: 'તમારું ઇનબોક્સ જુઓ', emailSentBody: 'અમે સાઇન-ઇન લિંક મોકલી છે ' },
};

export default function EnhancedLogin({ onGoogle, onEmailLink, onOtpSend, onOtpVerify, onGuest }) {
  const { currentLanguage, setLanguage } = useLanguage();
  const t = I18N[currentLanguage] || I18N.en;
  const [mode, setMode] = useState('choose');       // choose | email | phone | email-sent | otp
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const handle = useCallback(async (fn) => {
    setBusy(true); setErr(null);
    try { await fn(); } catch (e) { setErr(e?.message || 'Something went wrong'); }
    finally { setBusy(false); }
  }, []);

  const submit = useCallback(async (e) => {
    e.preventDefault();
    if (mode === 'email')      await handle(async () => { await onEmailLink?.(email); setMode('email-sent'); });
    else if (mode === 'phone') await handle(async () => { await onOtpSend?.(phone); setMode('otp'); });
    else if (mode === 'otp')   await handle(async () => { await onOtpVerify?.(phone, otp); });
  }, [mode, email, phone, otp, handle, onEmailLink, onOtpSend, onOtpVerify]);

  const Back = (
    <button type="button" onClick={() => { setMode('choose'); setErr(null); }}
      className="btn-icon absolute top-3 left-3" aria-label={t.back}>
      <ChevronLeft className="w-5 h-5" />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-ivory-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 grid place-items-center px-5 py-8">
      <div className="w-full max-w-sm">
        {/* Language toggle */}
        <div className="flex items-center justify-center gap-1 p-1 bg-white/80 dark:bg-neutral-900/80 backdrop-blur rounded-full border border-neutral-200 dark:border-neutral-800 mx-auto w-fit mb-8" role="tablist" aria-label="Language">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="tab"
              aria-selected={currentLanguage === l.code}
              onClick={() => setLanguage?.(l.code)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all
                ${currentLanguage === l.code
                  ? 'bg-primary-600 text-white shadow-primary-glow'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              style={l.code === 'hi' ? { fontFamily: 'var(--font-hindi)' } : l.code === 'gu' ? { fontFamily: 'var(--font-gujarati)' } : undefined}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="card p-6 sm:p-7 relative">
          {mode !== 'choose' && Back}

          <div className="flex flex-col items-center text-center">
            <Logo className="w-14 h-14" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">{t.signIn}</h1>
            <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400"
               style={currentLanguage === 'hi' ? { fontFamily: 'var(--font-hindi)' } : currentLanguage === 'gu' ? { fontFamily: 'var(--font-gujarati)' } : undefined}>
              {t.subtitle}
            </p>
          </div>

          {err && <div className="mt-4 text-sm px-3 py-2 rounded-lg bg-danger-50 text-danger-700 border border-danger-200">{err}</div>}

          {mode === 'choose' && (
            <div className="mt-6 space-y-2.5">
              <button type="button" disabled={busy} onClick={() => handle(onGoogle)}
                className="btn w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 py-3 font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700">
                <GoogleG /> {t.google}
              </button>
              <button type="button" onClick={() => setMode('email')} className="btn-secondary w-full py-3">
                <Mail className="w-4 h-4" /> {t.email}
              </button>
              <button type="button" onClick={() => setMode('phone')} className="btn-secondary w-full py-3">
                <Phone className="w-4 h-4" /> {t.phone}
              </button>

              <div className="flex items-center gap-3 text-2xs text-neutral-400 my-2">
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                {t.or}
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
              </div>

              <button type="button" onClick={onGuest} className="btn-ghost w-full py-3 justify-center">
                <Sparkles className="w-4 h-4" /> {t.guest}
              </button>
            </div>
          )}

          {mode === 'email' && (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <label className="block">
                <span className="eyebrow mb-1.5 block">{t.emailLabel}</span>
                <input type="email" autoFocus required autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" />
              </label>
              <button type="submit" disabled={busy || !email} className="btn-primary w-full">
                {busy ? 'Sending…' : t.send} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {mode === 'phone' && (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <label className="block">
                <span className="eyebrow mb-1.5 block">{t.phoneLabel}</span>
                <div className="flex gap-2">
                  <span className="input-field !w-20 grid place-items-center font-semibold text-neutral-500">+91</span>
                  <input type="tel" autoFocus required value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210" className="input-field flex-1 tabular-nums" />
                </div>
              </label>
              <button type="submit" disabled={busy || phone.length !== 10} className="btn-primary w-full">
                {busy ? 'Sending…' : t.sendOtp} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {mode === 'otp' && (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <p className="text-sm text-neutral-500 text-center">OTP sent to +91 {phone}</p>
              <label className="block">
                <span className="eyebrow mb-1.5 block">{t.otpLabel}</span>
                <input type="text" inputMode="numeric" autoFocus required value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••" className="input-field text-center tracking-[0.6em] text-lg font-bold tabular-nums" />
              </label>
              <button type="submit" disabled={busy || otp.length !== 6} className="btn-primary w-full">
                {busy ? 'Verifying…' : t.verify} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {mode === 'email-sent' && (
            <div className="mt-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-950 grid place-items-center mx-auto">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="font-bold text-lg">{t.emailSentTitle}</h2>
              <p className="text-sm text-neutral-500">{t.emailSentBody}<b>{email}</b></p>
            </div>
          )}

          <p className="mt-6 text-2xs text-center text-neutral-400 leading-relaxed">{t.tos}</p>
        </div>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.1a6.7 6.7 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" fill="#EA4335"/>
    </svg>
  );
}
