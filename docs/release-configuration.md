# Release configuration

The new server-backed features require the Firebase Functions and Realtime Database rules to be deployed with the web application.

## Event payments

Set the Razorpay credentials as Firebase Functions secrets. Never put the secret in a `VITE_` variable or the Realtime Database.

```sh
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase deploy --only functions:createEventPaymentOrder,functions:verifyEventPayment
```

Paid registrations stay unconfirmed until Razorpay's response passes the server-side HMAC signature check. The admin **Event Payments** module reads the resulting order and payment audit records.

## Registration protection

Create a reCAPTCHA Enterprise website key, enable the reCAPTCHA Enterprise API for the Firebase project, and set the public key as `VITE_RECAPTCHA_SITE_KEY` when building. The server assessment uses the Functions service account and rejects scores below `0.5`.

Deploy the assessment function and the updated rules:

```sh
firebase deploy --only functions:verifyRegistrationChallenge,database
```

## Coupons

Deploy `redeemBrandCoupon` and `verifyBrandCoupon` before publishing offers. Coupon issuance, one-per-brand enforcement, consumption, and audit writes intentionally happen only through these trusted functions.

```sh
firebase deploy --only functions:redeemBrandCoupon,functions:verifyBrandCoupon,database
```

## Verification email

Paste [firebase-email-verification-template.html](firebase-email-verification-template.html) into Firebase Console → Authentication → Templates → Email address verification. Confirm the authorized action URL and sender domain before sending production email.
