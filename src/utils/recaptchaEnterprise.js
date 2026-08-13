const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeXXPsrAAAAAJEpQ2J-1TPTTmNvE5G8U1GSWsVQ';
let loaderPromise = null;

export const loadRecaptchaEnterprise = () => {
  if (window.grecaptcha?.enterprise) return Promise.resolve(window.grecaptcha.enterprise);
  if (!loaderPromise) {
    loaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(SITE_KEY)}`;
      script.async = true;
      script.defer = true;
      script.onload = () => window.grecaptcha?.enterprise
        ? window.grecaptcha.enterprise.ready(() => resolve(window.grecaptcha.enterprise))
        : reject(new Error('Security verification failed to initialize'));
      script.onerror = () => reject(new Error('Security verification could not be loaded'));
      document.head.appendChild(script);
    }).catch(error => { loaderPromise = null; throw error; });
  }
  return loaderPromise;
};

export const RECAPTCHA_ENTERPRISE_SITE_KEY = SITE_KEY;
