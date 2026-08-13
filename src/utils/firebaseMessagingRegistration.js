let registrationPromise = null;

export const getFirebaseMessagingRegistration = async () => {
  if (!('serviceWorker' in navigator)) return null;
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope'
    }).then(registration => navigator.serviceWorker.ready.then(() => registration));
  }
  return registrationPromise;
};
