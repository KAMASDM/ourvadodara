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

Registration protection also applies server-side disposable-domain checks, five attempts per hashed IP per hour, domain-velocity monitoring, an account-creation audit and automatic disabling of disposable-email accounts that bypass the normal client flow. Admins can manage custom blocked domains and review security events under **Authentication & Security**.

Deploy the assessment function and the updated rules:

```sh
firebase deploy --only functions:verifyRegistrationChallenge,functions:auditNewRegistration,database
```

Firebase Authentication blocking functions can reject an account before it is written, but require upgrading the project to Firebase Authentication with Identity Platform. Until that upgrade is explicitly approved and tested, `auditNewRegistration` provides the compatibility-safe backstop by immediately disabling bypassed disposable-email accounts without changing existing sign-in providers.

## Coupons

Deploy the coupon callables before publishing offers. Coupon issuance, redemption, audit writes, and privacy-safe brand analytics intentionally happen only through these trusted functions. The analytics callable performs customer-location aggregation on the server and does not return customer records.

```sh
firebase deploy --only functions:claimBrandOffer,functions:redeemOfferCoupon,functions:getBrandCouponAnalytics,functions:redeemBrandCoupon,functions:verifyBrandCoupon,database
```

## Verification email

Paste [firebase-email-verification-template.html](firebase-email-verification-template.html) into Firebase Console → Authentication → Templates → Email address verification. Confirm the authorized action URL and sender domain before sending production email.

## Application email notifications

Application emails use the `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` Firebase Function secrets. Never store SMTP credentials in source files or frontend environment variables.

Transactional emails cover account onboarding and access changes, enquiries, brand/offer workflows, coupons, event payments, registration, and check-in. Editorial breaking-news, daily-digest, and comment-reply emails require the user to enable Email Notifications and the corresponding preference.

Delivery metadata is recorded under `emailDeliveryLogs`; message bodies and SMTP credentials are not stored there.
