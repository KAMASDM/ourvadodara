// =============================================
// Firebase Cloud Functions for Our Vadodara News
// =============================================
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('crypto');
const {
  consumeRateLimit,
  getEmailDomain,
  hashValue,
  isDisposableDomain,
  writeSecurityEvent
} = require('./registration-security');

admin.initializeApp();

const VADODARA_COORDINATES = { latitude: 22.3072, longitude: 73.1812 };
let weatherRequestPromise = null;

const indiaDateKey = value => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date(value));

const indiaHour = value => Number(new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23'
}).format(new Date(value)));

const weatherPeriod = item => {
  const instant = item?.data?.instant?.details || {};
  const interval = item?.data?.next_1_hours || item?.data?.next_6_hours || item?.data?.next_12_hours || {};
  return {
    time: item?.time || '',
    temperature: Math.round(Number(instant.air_temperature || 0)),
    humidity: Math.round(Number(instant.relative_humidity || 0)),
    windSpeed: Math.round(Number(instant.wind_speed || 0) * 10) / 10,
    cloudCover: Math.round(Number(instant.cloud_area_fraction || 0)),
    precipitation: Math.round(Number(interval.details?.precipitation_amount || 0) * 10) / 10,
    symbolCode: interval.summary?.symbol_code || 'cloudy'
  };
};

const buildVadodaraWeather = payload => {
  const timeseries = payload?.properties?.timeseries || [];
  if (!timeseries.length) throw new Error('Weather provider returned no forecast');
  const now = Date.now();
  const currentItem = timeseries.find(item => Date.parse(item.time) >= now - 60 * 60 * 1000) || timeseries[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = indiaDateKey(tomorrow);
  const tomorrowItems = timeseries.filter(item => indiaDateKey(item.time) === tomorrowKey);
  const noonItem = [...tomorrowItems].sort((left, right) => Math.abs(indiaHour(left.time) - 12) - Math.abs(indiaHour(right.time) - 12))[0] || timeseries[24] || currentItem;
  const tomorrowTemperatures = tomorrowItems.map(item => Number(item.data?.instant?.details?.air_temperature)).filter(Number.isFinite);
  const tomorrowPrecipitation = tomorrowItems.reduce((sum, item) => sum + Number((item.data?.next_1_hours || {}).details?.precipitation_amount || 0), 0);
  return {
    city: 'Vadodara',
    provider: 'MET Norway',
    providerUrl: 'https://api.met.no/',
    updatedAt: payload?.properties?.meta?.updated_at || new Date().toISOString(),
    current: weatherPeriod(currentItem),
    tomorrow: {
      ...weatherPeriod(noonItem),
      date: tomorrowKey,
      temperatureMin: tomorrowTemperatures.length ? Math.round(Math.min(...tomorrowTemperatures)) : null,
      temperatureMax: tomorrowTemperatures.length ? Math.round(Math.max(...tomorrowTemperatures)) : null,
      precipitationTotal: Math.round(tomorrowPrecipitation * 10) / 10
    }
  };
};

exports.getVadodaraWeather = functions.https.onCall(async () => {
  const cacheRef = admin.database().ref('weatherForecastCache/vadodara');
  const cached = (await cacheRef.once('value')).val();
  if (cached?.data && Number(cached.expiresAt || 0) > Date.now()) return cached.data;

  if (!weatherRequestPromise) {
    weatherRequestPromise = (async () => {
      const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${VADODARA_COORDINATES.latitude}&lon=${VADODARA_COORDINATES.longitude}`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OurVadodara/1.0 https://ourvadodara.netlify.app'
        }
      });
      if (!response.ok) throw new Error(`Weather provider returned ${response.status}`);
      const data = buildVadodaraWeather(await response.json());
      const providerExpiry = Date.parse(response.headers.get('expires') || '');
      const expiresAt = Number.isFinite(providerExpiry) && providerExpiry > Date.now()
        ? providerExpiry
        : Date.now() + 30 * 60 * 1000;
      await cacheRef.set({ data, fetchedAt: Date.now(), expiresAt });
      return data;
    })().finally(() => { weatherRequestPromise = null; });
  }

  try { return await weatherRequestPromise; }
  catch (error) {
    if (cached?.data) return cached.data;
    throw new functions.https.HttpsError('unavailable', 'Weather is temporarily unavailable');
  }
});

const PUBLIC_LEAD_PATH = 'leads';
const LEAD_TEMPLATE_PATH = 'leadMessageTemplates';
const LEAD_NOTIFICATION_LOG_PATH = 'leadNotificationLogs';
const LEAD_WHATSAPP_LOG_PATH = 'leadWhatsAppLogs';
const BOTNEX_BASE_URL = 'https://app.botnex.io/api/v1';

// datetime-local values created by the admin UI historically reached RTDB
// without a timezone. Cloud Functions run in UTC, while the offer dates are
// entered in India time, which made a newly-created offer appear active in the
// browser but "not started" on the server for another 5.5 hours.
const parseOfferDateTime = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;

  const raw = String(value).trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const isLocalDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(raw);
  const timestamp = Date.parse(isLocalDateTime && !hasTimezone ? `${raw}+05:30` : raw);
  return Number.isFinite(timestamp) ? timestamp : NaN;
};

// Only a positive, finite value creates a stock limit. Zero, blank, missing,
// negative, and legacy "unlimited" values all mean unlimited availability.
const getCouponRedemptionLimit = offer => {
  const rawLimit = offer?.redemptionLimit ?? offer?.maxUses ?? 0;
  const limit = Number(rawLimit);
  return Number.isFinite(limit) && limit > 0 ? limit : null;
};

const BOTNEX_OPERATIONS = {
  connectAccount: {
    endpoint: '/whatsapp/account/connect',
    required: ['user_id', 'whatsapp_business_account_id', 'access_token']
  },
  sendText: {
    endpoint: '/whatsapp/send',
    required: ['phone_number_id', 'phone_number', 'message']
  },
  sendInteractiveButtons: {
    endpoint: '/whatsapp/send/interactive-buttons',
    required: ['phone_number_id', 'phone_number', 'message', 'buttons']
  },
  sendFile: {
    endpoint: '/whatsapp/send/file',
    required: ['phone_number_id', 'phone_number']
  },
  getConversation: {
    endpoint: '/whatsapp/get/conversation',
    required: ['phone_number_id', 'phone_number', 'limit']
  },
  getPostBackList: {
    endpoint: '/whatsapp/get/post-back-list',
    required: ['phone_number_id']
  },
  getMessageStatus: {
    endpoint: '/whatsapp/get/message-status',
    required: ['wa_message_id', 'whatsapp_bot_id']
  },
  listTemplates: {
    endpoint: '/whatsapp/template/list',
    required: ['phone_number_id']
  },
  triggerBotFlow: {
    endpoint: '/whatsapp/trigger-bot',
    required: ['phone_number_id', 'bot_flow_unique_id', 'phone_number']
  },
  getSubscriber: {
    endpoint: '/whatsapp/subscriber/get',
    required: ['phone_number_id', 'phone_number']
  },
  listSubscribers: {
    endpoint: '/whatsapp/subscriber/list',
    required: ['phone_number_id', 'limit']
  },
  createSubscriber: {
    endpoint: '/whatsapp/subscriber/create',
    required: ['phoneNumberID', 'name', 'phoneNumber']
  },
  updateSubscriber: {
    endpoint: '/whatsapp/subscriber/update',
    required: ['phone_number_id', 'phone_number']
  },
  deleteSubscriber: {
    endpoint: '/whatsapp/subscriber/delete',
    required: ['phone_number_id', 'phone_number']
  },
  resetUserInputFlow: {
    endpoint: '/whatsapp/subscriber/reset/user-input-flow',
    required: ['phone_number_id', 'phone_number']
  },
  assignTeamMember: {
    endpoint: '/whatsapp/subscriber/chat/assign-to-team-member',
    required: ['phone_number_id', 'phone_number', 'team_member_id']
  },
  assignCustomFields: {
    endpoint: '/whatsapp/subscriber/chat/assign-custom-fields',
    required: ['phone_number_id', 'phone_number', 'custom_fields']
  },
  listCustomFields: {
    endpoint: '/whatsapp/subscriber/custom-fields/list',
    required: []
  },
  assignLabels: {
    endpoint: '/whatsapp/subscriber/chat/assign-labels',
    required: ['phone_number_id', 'phone_number', 'label_ids']
  },
  removeLabels: {
    endpoint: '/whatsapp/subscriber/chat/remove-labels',
    required: ['phone_number_id', 'phone_number', 'label_ids']
  },
  assignSequence: {
    endpoint: '/whatsapp/subscriber/chat/assign-sequence',
    required: ['phone_number_id', 'phone_number', 'sequence_ids']
  },
  removeSequence: {
    endpoint: '/whatsapp/subscriber/chat/remove-sequence',
    required: ['phone_number_id', 'phone_number', 'sequence_ids']
  },
  addNotes: {
    endpoint: '/whatsapp/subscriber/chat/add-notes',
    required: ['phone_number_id', 'phone_number', 'note_text']
  },
  listLabels: {
    endpoint: '/whatsapp/label/list',
    required: ['phone_number_id']
  },
  createLabel: {
    endpoint: '/whatsapp/label/create',
    required: ['phone_number_id', 'label_name']
  },
  listCatalogs: {
    endpoint: '/whatsapp/catalog/list',
    required: []
  },
  syncCatalog: {
    endpoint: '/whatsapp/catalog/sync',
    required: ['whatsapp_catalog_id']
  },
  listCatalogOrders: {
    endpoint: '/whatsapp/catalog/order/list',
    required: []
  },
  changeCatalogOrderStatus: {
    endpoint: '/whatsapp/catalog/order/status-change',
    required: ['order_unique_id', 'cart_status']
  },
  getDirectLoginUrl: {
    endpoint: '/user/get/direct-login-url',
    required: ['email']
  },
  getDirectLoginUrlOnlyNewUsers: {
    endpoint: '/user/get/direct-login-url/only-new-users',
    required: ['email', 'package_id', 'expired_date']
  }
};

function cleanString(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function cleanOptionalString(value, maxLength = 500) {
  return cleanString(value || '', maxLength);
}

function cleanPhoneNumber(value) {
  const phoneNumber = cleanOptionalString(value, 40).replace(/\D/g, '');
  if (/^[6-9]\d{9}$/.test(phoneNumber)) {
    return `91${phoneNumber}`;
  }
  return phoneNumber;
}

function cleanPhoneNumberId(value) {
  const phoneNumberId = cleanOptionalString(value, 120);
  if (!/^\d{10,30}$/.test(phoneNumberId)) return '';
  return phoneNumberId;
}

async function assertAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userSnapshot = await admin.database().ref(`users/${context.auth.uid}/role`).once('value');
  if (userSnapshot.val() !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access is required');
  }
}

function getBotnexConfig() {
  const apiToken = process.env.BOTNEX_API_TOKEN || '';
  const phoneNumberId = process.env.BOTNEX_PHONE_NUMBER_ID || '';

  if (!apiToken) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Botnex API token is not configured on Firebase Functions'
    );
  }

  return { apiToken, phoneNumberId };
}

async function getBotnexSettings() {
  const snapshot = await admin.database().ref('integrations/botnex').once('value');
  return snapshot.val() || {};
}

function normalizeBotnexParams(operation, params = {}, defaultPhoneNumberId = '') {
  const next = {};
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    next[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
  });

  if (defaultPhoneNumberId) {
    if (!next.phone_number_id) next.phone_number_id = defaultPhoneNumberId;
    if (!next.phoneNumberID) next.phoneNumberID = defaultPhoneNumberId;
  }

  if (next.phone_number) next.phone_number = cleanPhoneNumber(next.phone_number);
  if (next.phoneNumber) next.phoneNumber = cleanPhoneNumber(next.phoneNumber);
  if (operation === 'createSubscriber') {
    if (!next.phoneNumber && next.phone_number) next.phoneNumber = next.phone_number;
    if (!next.phoneNumberID && next.phone_number_id) next.phoneNumberID = next.phone_number_id;
  }

  return next;
}

function validateBotnexParams(config, params) {
  config.required.forEach((field) => {
    if (!params[field]) {
      throw new functions.https.HttpsError('invalid-argument', `${field} is required`);
    }
  });

  if (config.endpoint === '/whatsapp/send/file' && !params.media_url && !params.media_id) {
    throw new functions.https.HttpsError('invalid-argument', 'media_url or media_id is required');
  }
}

async function callBotnex(operation, params = {}, options = {}) {
  const operationConfig = BOTNEX_OPERATIONS[operation];
  if (!operationConfig) {
    throw new functions.https.HttpsError('invalid-argument', 'Unsupported Botnex operation');
  }

  const { apiToken, phoneNumberId } = getBotnexConfig();
  const normalizedParams = normalizeBotnexParams(operation, params, options.phoneNumberId || phoneNumberId);
  validateBotnexParams(operationConfig, normalizedParams);

  const body = new URLSearchParams();
  body.set('apiToken', apiToken);
  Object.entries(normalizedParams).forEach(([key, value]) => body.set(key, value));

  const response = await fetch(`${BOTNEX_BASE_URL}${operationConfig.endpoint}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { status: '0', message: text || 'Invalid Botnex response' };
  }

  if (!response.ok) {
    throw new functions.https.HttpsError(
      'internal',
      data?.message || `Botnex request failed with status ${response.status}`
    );
  }

  return { data, params: normalizedParams };
}

function requirePublicLeadString(data, field, label, maxLength = 160) {
  const value = cleanString(data?.[field], maxLength);
  if (!value) {
    throw new functions.https.HttpsError('invalid-argument', `${label} is required`);
  }
  return value;
}

function publicLeadActivity(message, note = '') {
  return {
    message,
    note,
    at: new Date().toISOString(),
    by: 'Campaign Assistant',
    byUid: 'public-enquiry'
  };
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function stripHtml(value, maxLength = 450) {
  return cleanOptionalString(
    decodeHtmlEntities(value)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' '),
    maxLength
  );
}

function getLocalizedCleanText(value, maxLength = 450) {
  if (!value) return '';
  if (typeof value === 'object') {
    return stripHtml(value.en || value.gu || value.hi || Object.values(value)[0] || '', maxLength);
  }
  return stripHtml(value, maxLength);
}

function interpolateLeadMessage(template, lead) {
  const stage = lead.stage || lead.status || 'new';
  const values = {
    companyName: lead.companyName || 'Lead',
    contactName: lead.contactName || 'Contact',
    city: lead.city || '',
    stage,
    packageInterest: lead.packageInterest || '',
    followUpDate: lead.followUpDate || '',
    assignedTo: lead.assignedTo || '',
    serviceType: lead.serviceType || ''
  };

  return String(template || '').replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || '');
}

function getLeadTriggerIds(beforeLead, afterLead, created) {
  const triggers = created ? ['lead_created'] : ['lead_updated'];
  const beforeStage = beforeLead?.stage || beforeLead?.status || '';
  const afterStage = afterLead?.stage || afterLead?.status || '';

  if (afterStage && afterStage !== beforeStage) {
    triggers.push(`stage_${afterStage}`);
  }

  if (afterLead?.followUpDate && afterLead.followUpDate !== beforeLead?.followUpDate) {
    const dueAt = new Date(`${afterLead.followUpDate}T23:59:59`);
    if (!Number.isNaN(dueAt.getTime()) && dueAt <= new Date()) {
      triggers.push('followup_due');
    }
  }

  return triggers;
}

function getTemplateChannels(template) {
  if (Array.isArray(template.channels) && template.channels.length) {
    return template.channels;
  }

  if (template.sendWhatsApp === true) {
    return template.sendPush === false ? ['whatsapp'] : ['push', 'whatsapp'];
  }

  return ['push'];
}

function getTemplateButtons(template) {
  if (!Array.isArray(template.buttons)) return [];
  return template.buttons
    .map((button) => {
      if (typeof button === 'string') {
        const title = cleanOptionalString(button, 20);
        return title ? { id: title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), title } : null;
      }

      const title = cleanOptionalString(button?.title || button?.label, 20);
      const id = cleanOptionalString(button?.id, 60) || title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      return title ? { id, title } : null;
    })
    .filter(Boolean)
    .slice(0, 3);
}

exports.createPublicLead = functions.https.onCall(async (data) => {
  const contactName = requirePublicLeadString(data, 'contactName', 'Name');
  const companyName = requirePublicLeadString(data, 'companyName', 'Brand name');
  const city = requirePublicLeadString(data, 'city', 'City');
  const phone = cleanOptionalString(data?.phone, 40);
  const email = cleanOptionalString(data?.email, 180);

  if (!phone && !email) {
    throw new functions.https.HttpsError('invalid-argument', 'Phone or email is required');
  }

  const businessCategory = cleanOptionalString(data?.businessCategory, 120);
  const now = new Date().toISOString();

  try {
    const leadRef = admin.database().ref(PUBLIC_LEAD_PATH).push();
    await leadRef.set({
      companyName,
      contactName,
      phone,
      email,
      city,
      businessCategory,
      source: 'Campaign Assistant',
      serviceType: 'combined',
      packageInterest: 'General campaign enquiry',
      budget: null,
      expectedValue: null,
      stage: 'new',
      status: 'new',
      priority: 'warm',
      followUpDate: '',
      expectedCloseDate: '',
      assignedTo: 'Sales Team',
      requirements: '',
      notes: 'Lead captured before assistant flow',
      createdAt: now,
      updatedAt: now,
      createdBy: 'public-enquiry',
      createdByName: 'Campaign Assistant',
      updatedBy: 'public-enquiry',
      updatedByName: 'Campaign Assistant',
      lastActivityAt: now,
      activityLog: [
        publicLeadActivity('Lead captured before bot conversation', `${companyName} from ${city}`)
      ]
    });

    return { success: true, leadId: leadRef.key };
  } catch (error) {
    console.error('Error creating public lead:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create lead');
  }
});

exports.updatePublicLead = functions.https.onCall(async (data) => {
  const leadId = cleanString(data?.leadId, 120);
  if (!leadId || !/^[A-Za-z0-9_-]+$/.test(leadId)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid lead id is required');
  }

  const message = cleanOptionalString(data?.message, 180) || 'Campaign assistant update';
  const note = cleanOptionalString(data?.note, 1200);
  const serviceType = cleanOptionalString(data?.serviceType, 60) || 'combined';
  const packageInterest = cleanOptionalString(data?.packageInterest, 180) || 'General campaign enquiry';
  const priority = ['hot', 'warm', 'cold'].includes(data?.priority) ? data.priority : 'warm';
  const budgetRange = cleanOptionalString(data?.budgetRange, 120);
  const now = new Date().toISOString();

  try {
    const leadRef = admin.database().ref(`${PUBLIC_LEAD_PATH}/${leadId}`);
    const snapshot = await leadRef.once('value');
    if (!snapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'Lead not found');
    }

    const lead = snapshot.val() || {};
    const currentLog = Array.isArray(lead.activityLog) ? lead.activityLog : [];
    await leadRef.update({
      serviceType,
      packageInterest,
      requirements: note || lead.requirements || '',
      notes: budgetRange ? `Budget range: ${budgetRange}` : lead.notes || 'Budget not shared',
      priority,
      updatedAt: now,
      updatedBy: 'public-enquiry',
      updatedByName: 'Campaign Assistant',
      lastActivityAt: now,
      activityLog: [
        ...currentLog,
        publicLeadActivity(message, note)
      ].slice(-30)
    });

    return { success: true };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('Error updating public lead:', error);
    throw new functions.https.HttpsError('internal', 'Unable to update lead');
  }
});

exports.botnexWhatsAppOperation = functions
  .runWith({ secrets: ['BOTNEX_API_TOKEN'] })
  .https.onCall(async (data, context) => {
  await assertAdmin(context);

  const operation = cleanString(data?.operation, 80);
  if (!operation) {
    throw new functions.https.HttpsError('invalid-argument', 'Operation is required');
  }

  try {
    const { data: response, params } = await callBotnex(operation, data?.params || {});
    await admin.database().ref('botnexOperationLogs').push({
      operation,
      status: response?.status ?? null,
      message: typeof response?.message === 'string' ? response.message : '',
      waMessageId: response?.wa_message_id || '',
      phoneNumber: params.phone_number || params.phoneNumber || '',
      createdAt: new Date().toISOString(),
      createdBy: context.auth.uid
    });

    return { success: response?.status === '1' || response?.status === true, response };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('Botnex operation failed:', error);
    throw new functions.https.HttpsError('internal', 'Botnex operation failed');
  }
});

exports.sendLeadWhatsAppMessage = functions
  .runWith({ secrets: ['BOTNEX_API_TOKEN'] })
  .https.onCall(async (data, context) => {
  await assertAdmin(context);

  const leadId = cleanString(data?.leadId, 120);
  const messageType = cleanString(data?.messageType || 'text', 40);
  if (!leadId || !/^[A-Za-z0-9_-]+$/.test(leadId)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid lead id is required');
  }

  try {
    const leadRef = admin.database().ref(`${PUBLIC_LEAD_PATH}/${leadId}`);
    const leadSnapshot = await leadRef.once('value');
    if (!leadSnapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'Lead not found');
    }

    const lead = leadSnapshot.val() || {};
    const phoneNumber = cleanPhoneNumber(data?.phone_number || lead.phone);
    if (!phoneNumber) {
      throw new functions.https.HttpsError('invalid-argument', 'Lead WhatsApp phone number is required');
    }

    let operation = 'sendText';
    const params = { ...(data?.params || {}), phone_number: phoneNumber };
    if (data?.phoneNumberId) params.phone_number_id = cleanString(data.phoneNumberId, 80);

    if (messageType === 'buttons') {
      operation = 'sendInteractiveButtons';
      params.message = cleanString(data?.message || params.message, 900);
      params.buttons = data?.buttons || params.buttons;
    } else if (messageType === 'file') {
      operation = 'sendFile';
      params.media_url = cleanOptionalString(data?.mediaUrl || params.media_url, 1000);
      params.media_id = cleanOptionalString(data?.mediaId || params.media_id, 200);
      params.media_type = cleanOptionalString(data?.mediaType || params.media_type, 40);
      params.media_caption_text = cleanOptionalString(data?.message || params.media_caption_text, 900);
    } else if (messageType === 'botFlow') {
      operation = 'triggerBotFlow';
      params.bot_flow_unique_id = cleanString(data?.botFlowUniqueId || params.bot_flow_unique_id, 180);
    } else {
      operation = 'sendText';
      params.message = cleanString(data?.message || params.message, 1200);
    }

    if (data?.createSubscriber !== false) {
      const subscriberName = cleanOptionalString(lead.contactName || lead.companyName || 'Lead', 160);
      try {
        await callBotnex('createSubscriber', {
          phoneNumber: phoneNumber,
          name: subscriberName,
          phoneNumberID: params.phone_number_id
        });
      } catch (subscriberError) {
        console.log('Botnex subscriber create skipped or failed:', subscriberError.message);
      }
    }

    const { data: response, params: sentParams } = await callBotnex(operation, params);
    const now = new Date().toISOString();
    const adminName = context.auth.token.name || context.auth.token.email || 'Admin';
    const activityLog = Array.isArray(lead.activityLog) ? lead.activityLog : [];
    const responseMessage = typeof response?.message === 'string' ? response.message : 'WhatsApp operation completed';

    await Promise.all([
      leadRef.update({
        lastContactedAt: now.slice(0, 10),
        communicationPreference: 'WhatsApp',
        updatedAt: now,
        updatedBy: context.auth.uid,
        updatedByName: adminName,
        lastActivityAt: now,
        activityLog: [
          ...activityLog,
          {
            message: messageType === 'botFlow' ? 'WhatsApp bot flow triggered' : 'WhatsApp message sent',
            note: responseMessage,
            at: now,
            by: adminName,
            byUid: context.auth.uid
          }
        ].slice(-30)
      }),
      admin.database().ref(LEAD_WHATSAPP_LOG_PATH).push({
        leadId,
        operation,
        messageType,
        phoneNumber,
        request: {
          phone_number_id: sentParams.phone_number_id || sentParams.phoneNumberID || '',
          message: sentParams.message || sentParams.media_caption_text || '',
          media_type: sentParams.media_type || '',
          bot_flow_unique_id: sentParams.bot_flow_unique_id || ''
        },
        response,
        sentAt: now,
        sentBy: context.auth.uid,
        sentByName: adminName
      })
    ]);

    return { success: response?.status === '1' || response?.status === true, response };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('Error sending lead WhatsApp message:', error);
    throw new functions.https.HttpsError('internal', 'Unable to send WhatsApp message');
  }
});

exports.sendLeadMessageNotifications = functions
  .runWith({ secrets: ['BOTNEX_API_TOKEN'] })
  .database
  .ref('/leads/{leadId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists()) return null;

    const leadId = context.params.leadId;
    const beforeLead = change.before.exists() ? change.before.val() : null;
    const afterLead = change.after.val() || {};
    const created = !change.before.exists();
    const triggerIds = getLeadTriggerIds(beforeLead, afterLead, created);

    try {
      const templatesSnapshot = await admin.database().ref(LEAD_TEMPLATE_PATH).once('value');
      const templates = templatesSnapshot.val() || {};
      const enabledTemplates = Object.entries(templates)
        .map(([id, template]) => ({ id, ...template }))
        .filter(template => template.enabled !== false)
        .filter(template => {
          const templateTriggers = Array.isArray(template.triggers) ? template.triggers : [];
          return templateTriggers.some(trigger => triggerIds.includes(trigger));
        });

      if (enabledTemplates.length === 0) {
        console.log('No lead message templates matched triggers:', triggerIds);
        return null;
      }

      const botnexSettings = await getBotnexSettings();
      const defaultPhoneNumberId = cleanPhoneNumberId(botnexSettings.phoneNumberId);
      const responses = await Promise.all(enabledTemplates.map(async (template) => {
        const rawBody = template.editorMode === 'html' ? template.html : template.richText;
        const title = interpolateLeadMessage(template.title || 'Lead update', afterLead).slice(0, 120);
        const fullBody = stripHtml(interpolateLeadMessage(rawBody || '', afterLead));
        const body = fullBody.slice(0, 240);
        const topic = cleanOptionalString(template.audienceTopic, 80) || 'admin-leads';
        const channels = getTemplateChannels(template);
        const shouldSendPush = template.sendPush !== false && channels.includes('push');
        const shouldSendWhatsApp = template.sendWhatsApp === true || channels.includes('whatsapp');
        const templateResponses = [];

        if (shouldSendPush) {
          const payload = {
            topic,
            notification: {
              title,
              body: body || `${afterLead.companyName || 'A lead'} was updated`
            },
            data: {
              type: 'lead',
              leadId,
              templateId: template.id,
              triggers: triggerIds.join(','),
              url: '/admin',
              timestamp: new Date().toISOString()
            },
            webpush: {
              headers: {
                Urgency: triggerIds.includes('lead_created') || triggerIds.includes('followup_due') ? 'high' : 'normal',
                TTL: '86400'
              },
              notification: {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: `lead-${leadId}-${template.id}`
              },
              fcm_options: {
                link: '/admin'
              }
            }
          };

          const response = await admin.messaging().send(payload);
          await admin.database().ref(LEAD_NOTIFICATION_LOG_PATH).push({
            leadId,
            templateId: template.id,
            topic,
            title,
            body: payload.notification.body,
            triggers: triggerIds,
            response,
            sentAt: new Date().toISOString()
          });
          templateResponses.push({ channel: 'push', response });
        }

        if (shouldSendWhatsApp) {
          const phoneNumber = cleanPhoneNumber(afterLead.phone);
          if (!phoneNumber) {
            console.log('Lead has no WhatsApp phone number, skipping template:', template.id);
            return templateResponses;
          }

          const phoneNumberId = cleanPhoneNumberId(template.phoneNumberId) || defaultPhoneNumberId;
          if (!phoneNumberId) {
            console.log('Botnex phone number id missing, skipping WhatsApp template:', template.id);
            return templateResponses;
          }

          const messageType = cleanOptionalString(template.whatsAppMessageType || 'text', 40);
          const whatsappBody = fullBody || body || `Hi ${afterLead.contactName || 'there'}, thank you for contacting Our Vadodara.`;
          let operation = 'sendText';
          const params = {
            phone_number: phoneNumber,
            phone_number_id: phoneNumberId,
            message: whatsappBody.slice(0, 1200)
          };

          try {
            await callBotnex('createSubscriber', {
              phoneNumber,
              phoneNumberID: phoneNumberId,
              name: cleanOptionalString(afterLead.contactName || afterLead.companyName || 'Lead', 160)
            }, { phoneNumberId });
          } catch (subscriberError) {
            console.log('Botnex subscriber create skipped or failed:', subscriberError.message);
          }

          if (messageType === 'buttons') {
            operation = 'sendInteractiveButtons';
            params.buttons = getTemplateButtons(template);
          } else if (messageType === 'botFlow') {
            operation = 'triggerBotFlow';
            params.bot_flow_unique_id = cleanString(template.botFlowUniqueId, 180);
            delete params.message;
          }

          const { data: response, params: sentParams } = await callBotnex(operation, params, { phoneNumberId });
          const success = response?.status === '1' || response?.status === true;
          const responseMessage = typeof response?.message === 'string'
            ? response.message
            : success
              ? 'WhatsApp message sent'
              : 'WhatsApp message failed';
          await admin.database().ref(LEAD_WHATSAPP_LOG_PATH).push({
            leadId,
            templateId: template.id,
            operation,
            messageType,
            phoneNumber,
            request: {
              phone_number_id: sentParams.phone_number_id || sentParams.phoneNumberID || '',
              message: sentParams.message || '',
              bot_flow_unique_id: sentParams.bot_flow_unique_id || '',
              buttons: sentParams.buttons || ''
            },
            triggers: triggerIds,
            response,
            success,
            automated: true,
            sentAt: new Date().toISOString()
          });
          const leadActivityLog = Array.isArray(afterLead.activityLog) ? afterLead.activityLog : [];
          await admin.database().ref(`${PUBLIC_LEAD_PATH}/${leadId}`).update({
            updatedAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            activityLog: [
              ...leadActivityLog,
              {
                message: success ? 'WhatsApp automation sent' : 'WhatsApp automation failed',
                note: responseMessage,
                at: new Date().toISOString(),
                by: 'Campaign Assistant',
                byUid: 'lead-message-automation'
              }
            ].slice(-40)
          });
          templateResponses.push({ channel: 'whatsapp', response, success });
        }

        return templateResponses;
      }));

      console.log('Lead message automation sent:', responses.flat().length);
      return responses;
    } catch (error) {
      console.error('Error sending lead message notifications:', error);
      return null;
    }
  });

// Send push notification when new news is published (main posts path)
exports.sendNewNewsNotification = functions.database
  .ref('/posts/{postId}')
  .onCreate(async (snapshot, context) => {
    return sendNotificationForNewPost(snapshot.val(), context.params.postId);
  });

// Send push notification when an existing draft is published.
exports.sendPublishedNewsNotification = functions.database
  .ref('/posts/{postId}')
  .onUpdate(async (change, context) => {
    const before = change.before.val() || {};
    const after = change.after.val() || {};

    if (after.notificationSent) {
      console.log('Post notification already sent, skipping update notification');
      return null;
    }

    // Scheduled posts are handled by publishScheduledPosts, which sends the
    // notification after flipping the post live.
    if (before.status === 'scheduled') {
      console.log('Scheduled post publish handled by scheduler, skipping update notification');
      return null;
    }

    if (!isPublishedPost(before) && isPublishedPost(after)) {
      return sendNotificationForNewPost(after, context.params.postId);
    }

    console.log('Post update did not transition to published, skipping notification');
    return null;
  });

// Send push notification when new news is published in a city
exports.sendNewCityNewsNotification = functions.database
  .ref('/cities/{cityId}/posts/{postId}')
  .onCreate(async (snapshot, context) => {
    const cityId = context.params.cityId;
    return sendNotificationForNewPost(snapshot.val(), context.params.postId, cityId);
  });

function isPublishedPost(post = {}) {
  return post.status !== 'draft' && post.status !== 'scheduled' && post.isPublished !== false;
}

// Shared function to send notification for new posts
async function sendNotificationForNewPost(post, postId, cityId = null) {
  // City post entries are often mirrors of the canonical /posts entry.
  // The canonical post already targets city topics, so skip mirrored writes.
  if (cityId && post.mainPostId) {
    console.log('City post mirrors main post, skipping duplicate notification');
    return null;
  }

  // Only send notification if post is published and not a draft
  if (!isPublishedPost(post)) {
    console.log('Post is draft or unpublished, skipping notification');
    return null;
  }

  // Get post details
  const title = getLocalizedCleanText(post.title, 90) || 'New Article Published';
  const summary = getLocalizedCleanText(post.excerpt, 160) || getLocalizedCleanText(post.content, 160);
  const body = summary && summary !== title ? summary : 'Tap to read the full story.';
  const category = String(post.category || 'news');
  
  // Get image from different possible locations
  let imageUrl = '';
  if (post.image) {
    imageUrl = post.image;
  } else if (post.media && post.media.length > 0) {
    imageUrl = post.media[0].url || post.media[0].downloadURL || '';
  } else if (post.mediaContent?.items) {
    const items = Array.isArray(post.mediaContent.items) 
      ? post.mediaContent.items 
      : Object.values(post.mediaContent.items);
    if (items.length > 0) {
      imageUrl = items[0].url || items[0].downloadURL || '';
    }
  }

  // Human-friendly category label, e.g. "local-news" -> "Local News"
  const categoryLabel = category
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'News';

  // Build notification payload
  const notificationTitle = post.isBreaking ? `Breaking News: ${title}` : title;

  // Everything the web service worker needs to render a rich notification is
  // duplicated into `data` (FCM data values must be strings). The web SW
  // overrides FCM auto-display, so it renders from these fields; the
  // `notification` block below remains for any native/mobile consumer.
  const payload = {
    notification: {
      title: notificationTitle,
      body: body,
      ...(imageUrl ? { imageUrl } : {})
    },
    data: {
      postId: String(postId),
      type: 'news',
      category: category,
      categoryLabel: categoryLabel,
      cityId: cityId || '',
      title: notificationTitle,
      body: body,
      image: imageUrl || '',
      isBreaking: post.isBreaking ? 'true' : 'false',
      url: `/?post=${postId}`,
      timestamp: new Date().toISOString(),
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    webpush: {
      headers: {
        Urgency: post.isBreaking ? 'high' : 'normal',
        TTL: '86400'
      },
      notification: {
        badge: '/icons/icon-72x72.png',
        icon: imageUrl || '/icons/icon-192x192.png',
        ...(imageUrl ? { image: imageUrl } : {}),
        tag: `news-${postId}`,
        requireInteraction: Boolean(post.isBreaking),
        renotify: Boolean(post.isBreaking),
        vibrate: post.isBreaking ? [200, 100, 200, 100, 200] : [200, 100, 200],
        actions: [
          {
            action: 'view',
            title: 'Read Now',
            icon: '/icons/icon-72x72.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      },
      fcm_options: {
        link: `/?post=${postId}`
      }
    }
  };

  try {
    // Determine which topics to send to
    const topics = [];
    
    // Always send to all-news unless it's breaking
    if (post.isBreaking) {
      topics.push('breaking-news');
    } else {
      topics.push('all-news');
    }
    
    // Add city-specific topic if available
    if (cityId) {
      topics.push(`city-${cityId}`);
    }
    
    // Also send to cities array if present
    if (post.cities && Array.isArray(post.cities)) {
      post.cities.forEach(city => {
        topics.push(`city-${city}`);
      });
    }
    
    // Send to category topic
    if (category) {
      topics.push(`category-${category.toLowerCase().replace(/\s+/g, '-')}`);
    }

    const uniqueTopics = [...new Set(topics.filter(Boolean))];

    console.log(`Sending notification to topics: ${uniqueTopics.join(', ')}`);

    // Send notification to each topic
    const responses = await Promise.all(
      uniqueTopics.map(topic => 
        admin.messaging().send({
          topic: topic,
          ...payload
        }).catch(error => {
          console.error(`Error sending to topic ${topic}:`, error);
          return null;
        })
      )
    );

    console.log('Successfully sent notifications for post:', postId, responses);

    // Update post with notification sent status
    const updatePath = cityId ? `/cities/${cityId}/posts/${postId}` : `/posts/${postId}`;
    await admin.database().ref(updatePath).update({
      notificationSent: true,
      notificationSentAt: admin.database.ServerValue.TIMESTAMP,
      notificationTopics: uniqueTopics
    });

    // Increment badge count for all relevant topics
    for (const topic of uniqueTopics) {
      await incrementBadgeCount(topic);
    }

    return responses;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

// Publish scheduled posts once their scheduled time has arrived.
// UnifiedPostCreator.jsx saves scheduled posts with status: 'scheduled',
// isPublished: false, publishedAt: null (RTDB drops null keys), and a
// scheduledAt ISO timestamp. Nothing else ever flips these to published,
// so without this job scheduled posts stay stuck in the feed forever
// with no publishedAt.
exports.publishScheduledPosts = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const nowIso = new Date().toISOString();

    const snapshot = await admin.database()
      .ref('posts')
      .orderByChild('status')
      .equalTo('scheduled')
      .once('value');

    if (!snapshot.exists()) {
      return null;
    }

    const updates = {};
    const duePosts = [];

    snapshot.forEach(child => {
      const post = child.val();
      const postId = child.key;

      if (!post.scheduledAt || post.scheduledAt > nowIso) {
        return;
      }

      updates[`/posts/${postId}/status`] = 'published';
      updates[`/posts/${postId}/isPublished`] = true;
      updates[`/posts/${postId}/publishedAt`] = nowIso;
      updates[`/posts/${postId}/updatedAt`] = nowIso;

      if (Array.isArray(post.cities)) {
        post.cities.forEach(cityId => {
          updates[`/cities/${cityId}/posts/${postId}/status`] = 'published';
          updates[`/cities/${cityId}/posts/${postId}/isPublished`] = true;
          updates[`/cities/${cityId}/posts/${postId}/publishedAt`] = nowIso;
          updates[`/cities/${cityId}/posts/${postId}/updatedAt`] = nowIso;
        });
      }

      duePosts.push({
        ...post,
        id: postId,
        status: 'published',
        isPublished: true,
        publishedAt: nowIso
      });
    });

    if (Object.keys(updates).length === 0) {
      return null;
    }

    await admin.database().ref().update(updates);
    console.log(`Published ${duePosts.length} scheduled post(s):`, duePosts.map(p => p.id));

    for (const post of duePosts) {
      try {
        await sendNotificationForNewPost(post, post.id);
      } catch (error) {
        console.error(`Error sending notification for scheduled post ${post.id}:`, error);
      }
    }

    return null;
  });

// Send notification for breaking news updates
exports.sendBreakingNewsNotification = functions.database
  .ref('/breakingNews/{newsId}')
  .onCreate(async (snapshot, context) => {
    const news = snapshot.val();
    const newsId = context.params.newsId;

    if (!news.isActive) {
      console.log('Breaking news is not active, skipping notification');
      return null;
    }

    const title = getLocalizedCleanText(news.headline, 90) || 'Breaking News';
    const body = getLocalizedCleanText(news.summary || news.content, 160) || 'Breaking news update';
    const imageUrl = news.mediaUrl || '';

    const payload = {
      notification: {
        title: title,
        body: body,
        ...(imageUrl ? { imageUrl } : {})
      },
      data: {
        newsId: String(newsId),
        postId: String(newsId),
        type: 'breaking',
        category: String(news.category || 'breaking'),
        categoryLabel: 'Breaking News',
        title: title,
        body: body,
        image: imageUrl || '',
        isBreaking: 'true',
        url: `/breaking/${newsId}`,
        priority: 'high'
      },
      webpush: {
        headers: {
          Urgency: 'high',
          TTL: '3600'
        },
        notification: {
          badge: '/icons/icon-72x72.png',
          icon: imageUrl || '/icons/icon-192x192.png',
          ...(imageUrl ? { image: imageUrl } : {}),
          tag: `breaking-${newsId}`,
          requireInteraction: true,
          vibrate: [300, 100, 300, 100, 300],
          renotify: true
        },
        fcm_options: {
          link: `/breaking/${newsId}`
        }
      }
    };

    try {
      const response = await admin.messaging().send({
        topic: 'breaking-news',
        ...payload
      });

      console.log('Successfully sent breaking news notification:', newsId, response);

      // Increment badge count
      await incrementBadgeCount('breaking-news');

      return response;
    } catch (error) {
      console.error('Error sending breaking news notification:', error);
      return null;
    }
  });

// Helper function to increment badge count for users
async function incrementBadgeCount(topic) {
  try {
    // Get all FCM tokens subscribed to the topic
    const tokensSnapshot = await admin.database().ref('/fcmTokens').once('value');
    const tokens = tokensSnapshot.val() || {};

    const updates = {};
    Object.keys(tokens).forEach(userId => {
      const userToken = tokens[userId];
      const userTopics = normalizeTopicList(userToken.topics);
      if (userTopics.includes(topic)) {
        updates[`/users/${userId}/unreadNotifications`] = admin.database.ServerValue.increment(1);
      }
    });

    if (Object.keys(updates).length > 0) {
      await admin.database().ref().update(updates);
      console.log(`Updated badge count for ${Object.keys(updates).length} users`);
    }

    return updates;
  } catch (error) {
    console.error('Error incrementing badge count:', error);
    return null;
  }
}

function normalizeTopicList(topics) {
  if (Array.isArray(topics)) {
    return topics.filter(Boolean);
  }

  if (topics && typeof topics === 'object') {
    return Object.entries(topics)
      .map(([topic, value]) => {
        if (value === true) return topic;
        if (typeof value === 'string') return value;
        return null;
      })
      .filter(Boolean);
  }

  return [];
}

// Subscribe FCM token to topics when stored in database
exports.subscribeTokenToTopics = functions.database
  .ref('/fcmTokens/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const tokenData = change.after.val();
    const previousTokenData = change.before.val();

    // If token was deleted, skip
    if (!tokenData || !tokenData.token) {
      console.log('Token deleted or invalid, skipping subscription');
      return null;
    }

    const { token } = tokenData;
    const topics = normalizeTopicList(tokenData.topics);
    const previousTopics = normalizeTopicList(previousTokenData?.topics);
    const topicsChanged = JSON.stringify([...topics].sort()) !== JSON.stringify([...previousTopics].sort());
    const tokenChanged = token !== previousTokenData?.token;

    if (!tokenChanged && !topicsChanged) {
      console.log('FCM token and topics unchanged, skipping subscription');
      return null;
    }

    try {
      // Subscribe token to all listed topics
      const subscriptionPromises = topics.map(topic =>
        admin.messaging().subscribeToTopic(token, topic)
          .then(() => {
            console.log(`Successfully subscribed ${userId} to topic: ${topic}`);
            return { topic, success: true };
          })
          .catch(error => {
            console.error(`Error subscribing ${userId} to topic ${topic}:`, error);
            return { topic, success: false, error: error.message };
          })
      );

      const results = await Promise.all(subscriptionPromises);
      
      // Update subscription status in database
      await admin.database().ref(`/fcmTokens/${userId}`).update({
        subscriptionResults: results,
        lastSubscribed: admin.database.ServerValue.TIMESTAMP
      });

      console.log(`Token subscription completed for user ${userId}`);
      return results;
    } catch (error) {
      console.error('Error in token subscription:', error);
      return null;
    }
  });

// Clear badge count when user opens the app
exports.clearBadgeCount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    await admin.database().ref(`/users/${userId}`).update({
      unreadNotifications: 0,
      lastReadAt: admin.database.ServerValue.TIMESTAMP
    });

    return { success: true, message: 'Badge count cleared' };
  } catch (error) {
    console.error('Error clearing badge count:', error);
    throw new functions.https.HttpsError('internal', 'Error clearing badge count');
  }
});

// Subscribe user to FCM topics
exports.subscribeToTopics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { token, topics = [] } = data;
  const userId = context.auth.uid;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'FCM token is required');
  }

  try {
    // Default topics everyone should be subscribed to
    const defaultTopics = ['all-news', 'breaking-news'];
    const allTopics = [...new Set([...defaultTopics, ...topics])];

    // Subscribe to each topic
    const subscriptionPromises = allTopics.map(topic =>
      admin.messaging().subscribeToTopic(token, topic)
    );

    await Promise.all(subscriptionPromises);

    // Save token and topics to database
    await admin.database().ref(`/fcmTokens/${userId}`).set({
      token: token,
      topics: allTopics,
      subscribedAt: admin.database.ServerValue.TIMESTAMP,
      lastUpdated: admin.database.ServerValue.TIMESTAMP
    });

    console.log(`User ${userId} subscribed to topics:`, allTopics);

    return { 
      success: true, 
      message: 'Successfully subscribed to topics',
      topics: allTopics 
    };
  } catch (error) {
    console.error('Error subscribing to topics:', error);
    throw new functions.https.HttpsError('internal', 'Error subscribing to topics');
  }
});

// Unsubscribe user from FCM topics
exports.unsubscribeFromTopics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { token, topics = [] } = data;
  const userId = context.auth.uid;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'FCM token is required');
  }

  try {
    const unsubscriptionPromises = topics.map(topic =>
      admin.messaging().unsubscribeFromTopic(token, topic)
    );

    await Promise.all(unsubscriptionPromises);

    // Update database
    const tokenRef = admin.database().ref(`/fcmTokens/${userId}`);
    const tokenSnapshot = await tokenRef.once('value');
    const tokenData = tokenSnapshot.val();

    if (tokenData) {
      const updatedTopics = tokenData.topics.filter(t => !topics.includes(t));
      await tokenRef.update({
        topics: updatedTopics,
        lastUpdated: admin.database.ServerValue.TIMESTAMP
      });
    }

    console.log(`User ${userId} unsubscribed from topics:`, topics);

    return { 
      success: true, 
      message: 'Successfully unsubscribed from topics' 
    };
  } catch (error) {
    console.error('Error unsubscribing from topics:', error);
    throw new functions.https.HttpsError('internal', 'Error unsubscribing from topics');
  }
});

// Create a Razorpay order using server-side event pricing. Configure
// RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the Functions environment.
exports.createEventPaymentOrder = functions.runWith({ secrets: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'] }).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Please sign in to pay');
  const { eventId, selectedTickets = {}, promoCode = '' } = data || {};
  if (!eventId) throw new functions.https.HttpsError('invalid-argument', 'Event is required');

  const eventSnapshot = await admin.database().ref(`events/${eventId}`).once('value');
  const event = eventSnapshot.val();
  if (!event || event.status !== 'published') throw new functions.https.HttpsError('not-found', 'Published event not found');
  const tickets = Array.isArray(event.ticketTypes) ? event.ticketTypes : Object.values(event.ticketTypes || {});
  let total = 0;
  let quantity = 0;
  for (const [ticketId, rawQty] of Object.entries(selectedTickets)) {
    const qty = Math.max(0, Math.floor(Number(rawQty) || 0));
    if (!qty) continue;
    const ticket = tickets.find(item => String(item.id) === String(ticketId));
    if (!ticket || qty > Number(ticket.availableSeats || 0)) throw new functions.https.HttpsError('failed-precondition', 'Selected tickets are no longer available');
    total += Number(ticket.price || 0) * qty;
    quantity += qty;
  }
  if (!quantity || quantity > Number(event.maxTicketsPerUser || 10)) throw new functions.https.HttpsError('invalid-argument', 'Invalid ticket quantity');

  if (promoCode) {
    const promo = event.promoCodes?.[String(promoCode).toUpperCase()];
    const valid = promo?.active !== false && (!promo?.expiresAt || new Date(promo.expiresAt) >= new Date()) && (!Number(promo?.maxUses) || Number(promo.usedCount || 0) < Number(promo.maxUses));
    if (!valid) throw new functions.https.HttpsError('failed-precondition', 'Promo code is not valid');
    total = promo.type === 'fixed' ? Math.max(0, total - Number(promo.value || 0)) : Math.max(0, total - total * Number(promo.value || 0) / 100);
  }

  const amount = Math.round(total * 100);
  if (amount < 100) throw new functions.https.HttpsError('failed-precondition', 'No online payment is required');
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new functions.https.HttpsError('failed-precondition', 'Payment gateway is not configured');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency: 'INR', receipt: `${eventId.slice(-12)}-${Date.now()}`, notes: { eventId, userId: context.auth.uid } })
  });
  const order = await response.json();
  if (!response.ok) throw new functions.https.HttpsError('internal', order?.error?.description || 'Unable to create payment order');
  await admin.database().ref(`eventPayments/${order.id}`).set({ eventId, userId: context.auth.uid, amount, currency: 'INR', status: 'created', createdAt: admin.database.ServerValue.TIMESTAMP });
  return { orderId: order.id, amount, currency: 'INR', keyId };
});

exports.verifyEventPayment = functions.runWith({ secrets: ['RAZORPAY_KEY_SECRET'] }).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Please sign in to verify payment');
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = data || {};
  if (!orderId || !paymentId || !signature) throw new functions.https.HttpsError('invalid-argument', 'Incomplete payment response');
  const paymentSnapshot = await admin.database().ref(`eventPayments/${orderId}`).once('value');
  const payment = paymentSnapshot.val();
  if (!payment || payment.userId !== context.auth.uid) throw new functions.https.HttpsError('permission-denied', 'Payment does not belong to this user');
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${orderId}|${paymentId}`).digest('hex');
  if (String(signature).length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)))) throw new functions.https.HttpsError('permission-denied', 'Payment signature is invalid');
  await admin.database().ref(`eventPayments/${orderId}`).update({ paymentId, status: 'verified', verifiedAt: admin.database.ServerValue.TIMESTAMP });
  return { verified: true, orderId, paymentId, amount: payment.amount };
});

const getAccountProfile = async uid => {
  const snapshot = await admin.database().ref(`users/${uid}`).once('value');
  return snapshot.val() || {};
};

const requireAdminAccount = async context => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Admin sign-in required');
  const profile = await getAccountProfile(context.auth.uid);
  const legacyAdmin = await admin.database().ref(`admins/${context.auth.uid}`).once('value');
  if (context.auth.token.role !== 'admin' && profile.role !== 'admin' && !legacyAdmin.exists()) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  return profile;
};

const requireBrandAccount = async context => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Brand sign-in required');
  const profile = await getAccountProfile(context.auth.uid);
  if (profile.role !== 'brand' || !profile.brandId) {
    throw new functions.https.HttpsError('permission-denied', 'Brand access required');
  }
  const account = (await admin.database().ref(`brandAccounts/${profile.brandId}`).once('value')).val();
  if (!account || account.authUid !== context.auth.uid || account.active === false) {
    throw new functions.https.HttpsError('permission-denied', 'This brand account is inactive');
  }
  return { brandId: profile.brandId, profile, account };
};

const slugifyBrand = value => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 60);

const RESERVED_BRAND_SLUGS = new Set([
  'admin', 'marketing', 'contact', 'terms', 'privacy', 'roundup', 'advertise',
  'enquiry', 'brand-solutions', 'offers', 'coupons', 'search', 'breaking',
  'reels', 'events', 'saved', 'profile', 'settings', 'notifications-settings',
  'activity', 'login', 'signup'
]);

const normalizePositiveLimit = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
};

const normalizeOfferInput = input => {
  const discountTypes = new Set(['percentage', 'fixed', 'bogo', 'freebie', 'custom']);
  const statusTypes = new Set(['draft', 'published', 'paused']);
  const discountType = discountTypes.has(input?.discountType) ? input.discountType : 'percentage';
  const rawDiscountValue = Math.max(0, Number(input?.discountValue) || 0);
  const validDays = Array.isArray(input?.validDays)
    ? input.validDays.map(Number).filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
    : [];
  const startAt = input?.startsAt ? new Date(input.startsAt).toISOString() : null;
  const endAt = input?.endsAt ? new Date(input.endsAt).toISOString() : null;
  if (startAt && endAt && Date.parse(endAt) <= Date.parse(startAt)) {
    throw new functions.https.HttpsError('invalid-argument', 'Offer end date must be after its start date');
  }

  return {
    title: String(input?.title || '').trim().slice(0, 120),
    description: String(input?.description || '').trim().slice(0, 2000),
    terms: String(input?.terms || '').trim().slice(0, 3000),
    discountType,
    discountValue: discountType === 'percentage' ? Math.min(100, rawDiscountValue) : rawDiscountValue,
    minimumPurchase: Math.max(0, Number(input?.minimumPurchase) || 0),
    maximumDiscount: Math.max(0, Number(input?.maximumDiscount) || 0),
    startsAt: startAt,
    endsAt: endAt,
    totalCouponLimit: normalizePositiveLimit(input?.totalCouponLimit),
    perUserClaimLimit: normalizePositiveLimit(input?.perUserClaimLimit, 1),
    maxUsesPerCoupon: normalizePositiveLimit(input?.maxUsesPerCoupon, 1),
    couponValidityDays: normalizePositiveLimit(input?.couponValidityDays),
    validDays,
    dailyStartTime: /^\d{2}:\d{2}$/.test(input?.dailyStartTime || '') ? input.dailyStartTime : '',
    dailyEndTime: /^\d{2}:\d{2}$/.test(input?.dailyEndTime || '') ? input.dailyEndTime : '',
    status: statusTypes.has(input?.status) ? input.status : 'draft',
    featured: input?.featured === true
  };
};

const getIndiaDateParts = timestamp => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date(timestamp));
  const value = type => parts.find(part => part.type === type)?.value || '';
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: dayMap[value('weekday')], time: `${value('hour')}:${value('minute')}` };
};

const getOfferAvailabilityError = (offer, now = Date.now(), { claiming = false } = {}) => {
  if (!offer || offer.active === false || offer.brandActive === false || offer.status === 'paused') return 'This offer is currently unavailable';
  if (claiming && offer.status !== 'published') return 'This offer is not published';
  const starts = parseOfferDateTime(offer.startsAt, 0);
  const ends = parseOfferDateTime(offer.endsAt, Infinity);
  if (!Number.isFinite(starts) || Number.isNaN(ends)) return 'This offer has invalid validity dates';
  if (now < starts) return 'This offer has not started yet';
  if (now > ends) return 'This offer has expired';

  // Users may save an active offer at any time. Day/time windows describe when
  // the coupon can be redeemed at the store and are enforced by the scanner.
  if (!claiming) {
    const india = getIndiaDateParts(now);
    if (Array.isArray(offer.validDays) && offer.validDays.length && !offer.validDays.map(Number).includes(india.day)) {
      return 'This coupon is not valid today';
    }
    if (offer.dailyStartTime && offer.dailyEndTime) {
      const isOvernightWindow = offer.dailyStartTime > offer.dailyEndTime;
      const inWindow = isOvernightWindow
        ? india.time >= offer.dailyStartTime || india.time <= offer.dailyEndTime
        : india.time >= offer.dailyStartTime && india.time <= offer.dailyEndTime;
      if (!inWindow) return 'This coupon is not valid at this time';
    } else if (offer.dailyStartTime && india.time < offer.dailyStartTime) {
      return 'This coupon is not valid at this time';
    } else if (offer.dailyEndTime && india.time > offer.dailyEndTime) {
      return 'This coupon is not valid at this time';
    }
  }
  return '';
};

const uploadBrandLogoDataUrl = async (value, uploaderUid) => {
  const logoValue = String(value || '').trim();
  if (!logoValue.startsWith('data:')) return { logoUrl: logoValue, storagePath: '' };

  const match = logoValue.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    throw new functions.https.HttpsError('invalid-argument', 'Brand logo must be a PNG, JPEG, WebP, or GIF image');
  }
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
    throw new functions.https.HttpsError('invalid-argument', 'Brand logo must be smaller than 5 MB');
  }

  const extensionByType = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
  const contentType = match[1].toLowerCase();
  const storagePath = `brand-logos/${uploaderUid}/${Date.now()}-${crypto.randomUUID()}.${extensionByType[contentType]}`;
  const downloadToken = crypto.randomUUID();
  const bucket = admin.storage().bucket();
  await bucket.file(storagePath).save(buffer, {
    resumable: false,
    metadata: { contentType, metadata: { firebaseStorageDownloadTokens: downloadToken } }
  });
  const logoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;
  return { logoUrl, storagePath };
};

exports.adminCreateBrand = functions.https.onCall(async (data, context) => {
  await requireAdminAccount(context);
  const name = String(data?.name || '').trim().slice(0, 120);
  const slug = slugifyBrand(data?.slug || name);
  const loginEmail = String(data?.loginEmail || '').trim().toLowerCase();
  const password = String(data?.password || '');
  const categoryName = String(data?.category || '').trim().slice(0, 80);
  const categoryId = slugifyBrand(categoryName);
  if (!name || !slug || !loginEmail.includes('@') || password.length < 8 || !categoryName) {
    throw new functions.https.HttpsError('invalid-argument', 'Brand name, category, login email, and an 8-character password are required');
  }
  if (RESERVED_BRAND_SLUGS.has(slug)) {
    throw new functions.https.HttpsError('invalid-argument', 'Choose a different brand URL; this one is reserved');
  }

  const slugRef = admin.database().ref(`brandSlugs/${slug}`);
  const reservation = await slugRef.transaction(current => {
    const staleReservation = current?.reserved === true && Date.now() - Number(current.reservedAt || 0) > 10 * 60 * 1000;
    return !current || staleReservation
      ? { reserved: true, reservedAt: Date.now(), reservedBy: context.auth.uid }
      : undefined;
  });
  if (!reservation.committed) {
    throw new functions.https.HttpsError('already-exists', 'This brand URL is already in use');
  }

  let authUser;
  let createdAuthUser = false;
  let uploadedLogoPath = '';
  try {
    try {
      authUser = await admin.auth().createUser({ email: loginEmail, password, displayName: name, emailVerified: true, disabled: false });
      createdAuthUser = true;
    } catch (createAuthError) {
      if (createAuthError?.code !== 'auth/email-already-exists') throw createAuthError;

      // A failed brand-creation attempt can leave a very recent Auth user even
      // though no profile/brand was committed. Recover only that narrow case;
      // established customer/admin accounts must never be converted to brands.
      const existingAuthUser = await admin.auth().getUserByEmail(loginEmail);
      const existingProfile = (await admin.database().ref(`users/${existingAuthUser.uid}`).once('value')).val();
      const createdAt = Date.parse(existingAuthUser.metadata?.creationTime || '');
      const isRecentOrphan = !existingProfile && Number.isFinite(createdAt) && Date.now() - createdAt < 60 * 60 * 1000;
      if (!isRecentOrphan) {
        throw new functions.https.HttpsError(
          'already-exists',
          'This brand login email already belongs to an existing account. Use a different login email.'
        );
      }
      authUser = await admin.auth().updateUser(existingAuthUser.uid, {
        password, displayName: name, emailVerified: true, disabled: false
      });
    }
    const uploadedLogo = await uploadBrandLogoDataUrl(data?.logoUrl, context.auth.uid);
    uploadedLogoPath = uploadedLogo.storagePath;
    const brandRef = admin.database().ref('brandsPublic').push();
    const brandId = brandRef.key;
    const now = Date.now();
    const publicBrand = {
      id: brandId, name, slug, category: categoryName, categoryId,
      address: String(data?.address || '').trim().slice(0, 500),
      phone: String(data?.phone || '').trim().slice(0, 40),
      email: String(data?.email || '').trim().toLowerCase().slice(0, 160),
      logoUrl: uploadedLogo.logoUrl, active: true, createdAt: now, updatedAt: now
    };
    const updates = {};
    updates[`brandsPublic/${brandId}`] = publicBrand;
    updates[`brandSlugs/${slug}`] = { brandId, name, logoUrl: publicBrand.logoUrl, active: true };
    updates[`brandAccounts/${brandId}`] = { authUid: authUser.uid, loginEmail, active: true, createdAt: now, createdBy: context.auth.uid };
    updates[`users/${authUser.uid}`] = { email: loginEmail, displayName: name, role: 'brand', brandId, profileComplete: true, createdAt: new Date(now).toISOString(), permissions: { canManageOffers: true, canRedeemCoupons: true, canViewBrandAnalytics: true } };
    updates[`couponCategories/${categoryId}`] = { id: categoryId, name: categoryName, createdAt: now, createdBy: context.auth.uid };
    await admin.database().ref().update(updates);
    return { brandId, slug, portalUrl: `/${slug}` };
  } catch (error) {
    if (createdAuthUser && authUser?.uid) await admin.auth().deleteUser(authUser.uid).catch(() => {});
    if (uploadedLogoPath) await admin.storage().bucket().file(uploadedLogoPath).delete({ ignoreNotFound: true }).catch(() => {});
    await slugRef.remove().catch(() => {});
    if (error instanceof functions.https.HttpsError) throw error;
    if (error?.code === 'auth/email-already-exists') throw new functions.https.HttpsError('already-exists', 'That brand login email is already in use');
    throw new functions.https.HttpsError('internal', error?.message || 'Unable to create brand');
  }
});

exports.adminUpdateBrand = functions.https.onCall(async (data, context) => {
  await requireAdminAccount(context);
  const brandId = String(data?.brandId || '').trim();
  if (!brandId) throw new functions.https.HttpsError('invalid-argument', 'Brand is required');

  const [brandSnapshot, accountSnapshot] = await Promise.all([
    admin.database().ref(`brandsPublic/${brandId}`).once('value'),
    admin.database().ref(`brandAccounts/${brandId}`).once('value')
  ]);
  const existingBrand = brandSnapshot.val();
  const existingAccount = accountSnapshot.val();
  if (!existingBrand || !existingAccount?.authUid) {
    throw new functions.https.HttpsError('not-found', 'Brand account was not found');
  }

  const name = String(data?.name || '').trim().slice(0, 120);
  const slug = slugifyBrand(data?.slug || name);
  const categoryName = String(data?.category || '').trim().slice(0, 80);
  const categoryId = slugifyBrand(categoryName);
  const loginEmail = String(data?.loginEmail || existingAccount.loginEmail || '').trim().toLowerCase();
  const password = String(data?.password || '');
  const active = data?.active !== false;
  if (!name || !slug || !categoryName || !loginEmail.includes('@')) {
    throw new functions.https.HttpsError('invalid-argument', 'Brand name, category, portal URL, and login email are required');
  }
  if (password && password.length < 8) {
    throw new functions.https.HttpsError('invalid-argument', 'A new password must contain at least 8 characters');
  }
  if (RESERVED_BRAND_SLUGS.has(slug)) {
    throw new functions.https.HttpsError('invalid-argument', 'Choose a different brand URL; this one is reserved');
  }

  const slugChanged = slug !== existingBrand.slug;
  const newSlugRef = admin.database().ref(`brandSlugs/${slug}`);
  let reservedNewSlug = false;
  let uploadedLogoPath = '';
  let authUpdated = false;
  let previousAuthUser;

  try {
    if (slugChanged) {
      const reservation = await newSlugRef.transaction(current => {
        const staleReservation = current?.reserved === true && Date.now() - Number(current.reservedAt || 0) > 10 * 60 * 1000;
        return !current || staleReservation || current?.brandId === brandId
          ? { reserved: true, reservedAt: Date.now(), reservedBy: context.auth.uid, brandId }
          : undefined;
      });
      if (!reservation.committed) {
        throw new functions.https.HttpsError('already-exists', 'This brand URL is already in use');
      }
      reservedNewSlug = true;
    }

    const uploadedLogo = await uploadBrandLogoDataUrl(data?.logoUrl || existingBrand.logoUrl, context.auth.uid);
    uploadedLogoPath = uploadedLogo.storagePath;
    previousAuthUser = await admin.auth().getUser(existingAccount.authUid);
    const authChanges = { email: loginEmail, displayName: name, disabled: !active };
    if (password) authChanges.password = password;
    await admin.auth().updateUser(existingAccount.authUid, authChanges);
    authUpdated = true;

    const now = Date.now();
    const updatedBrand = {
      ...existingBrand,
      id: brandId,
      name,
      slug,
      category: categoryName,
      categoryId,
      address: String(data?.address || '').trim().slice(0, 500),
      phone: String(data?.phone || '').trim().slice(0, 40),
      email: String(data?.email || '').trim().toLowerCase().slice(0, 160),
      logoUrl: uploadedLogo.logoUrl,
      active,
      updatedAt: now
    };
    const offersSnapshot = await admin.database().ref('offers').orderByChild('brandId').equalTo(brandId).once('value');
    const updates = {};
    updates[`brandsPublic/${brandId}`] = updatedBrand;
    updates[`brandSlugs/${slug}`] = { brandId, name, logoUrl: updatedBrand.logoUrl, active };
    if (slugChanged) updates[`brandSlugs/${existingBrand.slug}`] = null;
    updates[`brandAccounts/${brandId}/loginEmail`] = loginEmail;
    updates[`brandAccounts/${brandId}/active`] = active;
    updates[`brandAccounts/${brandId}/updatedAt`] = now;
    updates[`users/${existingAccount.authUid}/email`] = loginEmail;
    updates[`users/${existingAccount.authUid}/displayName`] = name;
    updates[`couponCategories/${categoryId}`] = { id: categoryId, name: categoryName, createdAt: now, createdBy: context.auth.uid };
    offersSnapshot.forEach(offerSnapshot => {
      const offerPath = `offers/${offerSnapshot.key}`;
      updates[`${offerPath}/brandName`] = name;
      updates[`${offerPath}/brandSlug`] = slug;
      updates[`${offerPath}/brandLogoUrl`] = updatedBrand.logoUrl;
      updates[`${offerPath}/category`] = categoryName;
      updates[`${offerPath}/categoryId`] = categoryId;
      updates[`${offerPath}/brandActive`] = active;
      updates[`${offerPath}/updatedAt`] = now;
    });
    await admin.database().ref().update(updates);
    return { brandId, slug, portalUrl: `/${slug}`, loginEmail, active };
  } catch (error) {
    if (uploadedLogoPath) await admin.storage().bucket().file(uploadedLogoPath).delete({ ignoreNotFound: true }).catch(() => {});
    if (reservedNewSlug) {
      await newSlugRef.transaction(current => current?.reservedBy === context.auth.uid ? null : current).catch(() => {});
    }
    if (authUpdated && previousAuthUser) {
      await admin.auth().updateUser(existingAccount.authUid, {
        email: previousAuthUser.email,
        displayName: previousAuthUser.displayName || existingBrand.name,
        disabled: previousAuthUser.disabled
      }).catch(() => {});
    }
    if (error instanceof functions.https.HttpsError) throw error;
    if (error?.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'That brand login email is already in use');
    }
    throw new functions.https.HttpsError('internal', error?.message || 'Unable to update brand');
  }
});

exports.saveBrandOffer = functions.https.onCall(async (data, context) => {
  const { brandId } = await requireBrandAccount(context);
  const brand = (await admin.database().ref(`brandsPublic/${brandId}`).once('value')).val();
  if (!brand?.active) throw new functions.https.HttpsError('failed-precondition', 'Brand is inactive');
  const offer = normalizeOfferInput(data?.offer || {});
  if (!offer.title || !offer.description) throw new functions.https.HttpsError('invalid-argument', 'Offer title and description are required');

  const requestedId = String(data?.offerId || '');
  const offerRef = requestedId ? admin.database().ref(`offers/${requestedId}`) : admin.database().ref('offers').push();
  const existing = requestedId ? (await offerRef.once('value')).val() : null;
  if (requestedId && (!existing || existing.brandId !== brandId)) throw new functions.https.HttpsError('permission-denied', 'Offer does not belong to this brand');
  const now = Date.now();
  const record = {
    ...existing, ...offer, id: offerRef.key, brandId, brandName: brand.name, brandSlug: brand.slug,
    brandLogoUrl: brand.logoUrl || '', category: brand.category, categoryId: brand.categoryId,
    brandActive: brand.active !== false,
    active: offer.status === 'published', issuedCount: Number(existing?.issuedCount || 0),
    redeemedCount: Number(existing?.redeemedCount || 0), createdAt: existing?.createdAt || now, updatedAt: now
  };
  await offerRef.set(record);
  return { offerId: offerRef.key };
});

exports.claimBrandOffer = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.firebase?.sign_in_provider === 'anonymous') {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in with a verified account to claim offers');
  }
  const offerId = String(data?.offerId || '');
  const offerRef = admin.database().ref(`offers/${offerId}`);
  const initialOffer = (await offerRef.once('value')).val();
  const availabilityError = getOfferAvailabilityError(initialOffer, Date.now(), { claiming: true });
  if (availabilityError) throw new functions.https.HttpsError('failed-precondition', availabilityError);

  const claimCountRef = admin.database().ref(`offerClaimCountsByUser/${context.auth.uid}/${offerId}`);
  const perUserLimit = normalizePositiveLimit(initialOffer.perUserClaimLimit, 1);
  const claimResult = await claimCountRef.transaction(count => {
    const current = Math.max(0, Number(count) || 0);
    return current >= perUserLimit ? undefined : current + 1;
  });
  if (!claimResult.committed) throw new functions.https.HttpsError('already-exists', 'You have reached the claim limit for this offer');

  const claimedOffer = initialOffer;
  const totalLimit = normalizePositiveLimit(initialOffer.totalCouponLimit);
  const issuedCountRef = offerRef.child('issuedCount');
  const stockResult = await issuedCountRef.transaction(current => {
    // A missing counter is zero. Transacting only on this value also avoids
    // treating an RTDB transaction's initial null cache value as a missing offer.
    const issuedCount = Math.max(0, Number(current) || 0);
    if (totalLimit && issuedCount >= totalLimit) return;
    return issuedCount + 1;
  });
  if (!stockResult.committed) {
    await claimCountRef.transaction(count => Math.max(0, (Number(count) || 1) - 1));
    throw new functions.https.HttpsError('failed-precondition', 'This offer is unavailable or sold out');
  }

  const couponRef = admin.database().ref('couponRedemptions').push();
  const code = `OV-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const now = Date.now();
  const validityExpiry = claimedOffer.couponValidityDays ? now + Number(claimedOffer.couponValidityDays) * 86400000 : Infinity;
  const offerExpiry = parseOfferDateTime(claimedOffer.endsAt, Infinity);
  const expiresAtMs = Math.min(validityExpiry, offerExpiry);
  const expiresAt = Number.isFinite(expiresAtMs) ? new Date(expiresAtMs).toISOString() : null;
  const coupon = {
    id: couponRef.key, offerId, brandId: claimedOffer.brandId, userId: context.auth.uid, code,
    status: 'issued', issuedAt: now, expiresAt, useCount: 0,
    maxUses: normalizePositiveLimit(claimedOffer.maxUsesPerCoupon, 1)
  };
  const userCoupon = {
    ...coupon, userId: null, brandName: claimedOffer.brandName, brandLogoUrl: claimedOffer.brandLogoUrl || '',
    offerTitle: claimedOffer.title, description: claimedOffer.description, discountType: claimedOffer.discountType,
    discountValue: claimedOffer.discountValue, minimumPurchase: claimedOffer.minimumPurchase || 0,
    maximumDiscount: claimedOffer.maximumDiscount || 0, terms: claimedOffer.terms || ''
  };
  const updates = {};
  updates[`couponRedemptions/${couponRef.key}`] = coupon;
  updates[`userCoupons/${context.auth.uid}/${couponRef.key}`] = userCoupon;
  updates[`couponAudit/${couponRef.key}/issued`] = { action: 'issued', at: now, actor: context.auth.uid };
  try {
    await admin.database().ref().update(updates);
  } catch (error) {
    await Promise.all([
      claimCountRef.transaction(count => Math.max(0, (Number(count) || 1) - 1)),
      offerRef.child('issuedCount').transaction(count => Math.max(0, (Number(count) || 1) - 1))
    ]).catch(() => {});
    throw new functions.https.HttpsError('internal', 'Unable to issue the coupon. Please try again.');
  }
  return { couponId: couponRef.key, code, expiresAt, offerTitle: claimedOffer.title };
});

exports.redeemOfferCoupon = functions.https.onCall(async (data, context) => {
  const { brandId } = await requireBrandAccount(context);
  let code = String(data?.code || '').trim();
  try {
    const parsed = JSON.parse(code);
    if (parsed?.type === 'ov-coupon') code = String(parsed.code || '');
  } catch { /* Manual coupon codes are valid input too. */ }
  code = code.trim().toUpperCase();
  if (!code) throw new functions.https.HttpsError('invalid-argument', 'Coupon code is required');

  const matches = (await admin.database().ref('couponRedemptions').orderByChild('code').equalTo(code).once('value')).val() || {};
  const [couponId, initialCoupon] = Object.entries(matches)[0] || [];
  if (!initialCoupon || initialCoupon.brandId !== brandId) throw new functions.https.HttpsError('not-found', 'Coupon is not valid for this brand');
  const offer = (await admin.database().ref(`offers/${initialCoupon.offerId}`).once('value')).val();
  if (!offer) throw new functions.https.HttpsError('not-found', 'Offer no longer exists');

  let updatedCoupon;
  let redemptionError = 'Coupon could not be redeemed';
  const couponRef = admin.database().ref(`couponRedemptions/${couponId}`);
  const result = await couponRef.transaction(current => {
    if (!current || current.brandId !== brandId) return;
    const now = Date.now();
    const useCount = Math.max(0, Number(current.useCount) || 0);
    const maxUses = normalizePositiveLimit(current.maxUses, 1);
    if (current.status === 'cancelled') { redemptionError = 'Coupon is cancelled'; return; }
    if (current.expiresAt && now > Date.parse(current.expiresAt)) { redemptionError = 'Coupon has expired'; return; }
    if (useCount >= maxUses || current.status === 'redeemed') { redemptionError = 'Coupon usage limit has been reached'; return; }
    const availabilityError = getOfferAvailabilityError(offer, now);
    if (availabilityError) { redemptionError = availabilityError; return; }
    const nextUseCount = useCount + 1;
    updatedCoupon = { ...current, useCount: nextUseCount, status: nextUseCount >= maxUses ? 'redeemed' : 'issued', lastRedeemedAt: now };
    return updatedCoupon;
  });
  if (!result.committed || !updatedCoupon) throw new functions.https.HttpsError('failed-precondition', redemptionError);

  const redeemedAt = updatedCoupon.lastRedeemedAt;
  const feedRef = admin.database().ref(`brandRedemptionFeed/${brandId}`).push();
  const updates = {};
  updates[`userCoupons/${updatedCoupon.userId}/${couponId}/useCount`] = updatedCoupon.useCount;
  updates[`userCoupons/${updatedCoupon.userId}/${couponId}/status`] = updatedCoupon.status;
  updates[`userCoupons/${updatedCoupon.userId}/${couponId}/lastRedeemedAt`] = redeemedAt;
  updates[`brandRedemptionFeed/${brandId}/${feedRef.key}`] = {
    id: feedRef.key, offerId: offer.id, offerTitle: offer.title, redeemedAt,
    couponCodeSuffix: code.slice(-4), useNumber: updatedCoupon.useCount
  };
  updates[`couponAudit/${couponId}/${feedRef.key}`] = { action: 'redeemed', at: redeemedAt, actor: context.auth.uid };
  updates[`offers/${offer.id}/redeemedCount`] = admin.database.ServerValue.increment(1);
  await admin.database().ref().update(updates);
  return {
    success: true, offerTitle: offer.title, discountType: offer.discountType,
    discountValue: offer.discountValue, minimumPurchase: offer.minimumPurchase || 0,
    maximumDiscount: offer.maximumDiscount || 0, useCount: updatedCoupon.useCount,
    maxUses: updatedCoupon.maxUses, status: updatedCoupon.status, redeemedAt
  };
});

exports.redeemBrandCoupon = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.firebase?.sign_in_provider === 'anonymous') throw new functions.https.HttpsError('unauthenticated', 'Sign in with a verified account to claim offers');
  const brandId = String(data?.brandId || '');
  if (!brandId) throw new functions.https.HttpsError('invalid-argument', 'Brand is required');
  const brandRef = admin.database().ref(`couponBrands/${brandId}`);
  const userClaimRef = admin.database().ref(`couponClaimsByUser/${context.auth.uid}/${brandId}`);
  const existing = await userClaimRef.once('value');
  if (existing.exists()) throw new functions.https.HttpsError('already-exists', 'You have already claimed this brand offer');

  let brand;
  let unavailableReason = 'This offer is unavailable';
  const result = await brandRef.transaction(current => {
    if (!current) {
      unavailableReason = 'This offer no longer exists';
      return;
    }

    const now = Date.now();
    const starts = parseOfferDateTime(current.startsAt, 0);
    const ends = parseOfferDateTime(current.endsAt, Infinity);
    const redemptionLimit = getCouponRedemptionLimit(current);
    const redeemedCount = Math.max(0, Number(current.redeemedCount) || 0);

    if (!Number.isFinite(starts) || Number.isNaN(ends)) {
      unavailableReason = 'This offer has an invalid availability date';
      return;
    }
    if (current.active === false) {
      unavailableReason = 'This offer is currently inactive';
      return;
    }
    if (now < starts) {
      unavailableReason = 'This offer has not started yet';
      return;
    }
    if (now > ends) {
      unavailableReason = 'This offer has expired';
      return;
    }
    if (redemptionLimit !== null && redeemedCount >= redemptionLimit) {
      unavailableReason = 'This offer is sold out';
      return;
    }

    brand = current;
    return { ...current, redeemedCount: redeemedCount + 1, updatedAt: now };
  });
  if (!result.committed || !brand) throw new functions.https.HttpsError('failed-precondition', unavailableReason);

  // Recheck inside a claim transaction to close simultaneous duplicate requests.
  const claimLock = await userClaimRef.transaction(current => current ? undefined : { lockedAt: admin.database.ServerValue.TIMESTAMP });
  if (!claimLock.committed) {
    await brandRef.child('redeemedCount').transaction(count => Math.max(0, Number(count || 1) - 1));
    throw new functions.https.HttpsError('already-exists', 'You have already claimed this brand offer');
  }
  const code = `OV-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  const redemptionRef = admin.database().ref('couponRedemptions').push();
  const redemption = { id: redemptionRef.key, brandId, brandName: brand.name || '', userId: context.auth.uid, userEmail: context.auth.token.email || '', code, status: 'issued', issuedAt: admin.database.ServerValue.TIMESTAMP, expiresAt: brand.endsAt || null };
  await Promise.all([
    redemptionRef.set(redemption),
    userClaimRef.set({ redemptionId: redemptionRef.key, code, claimedAt: admin.database.ServerValue.TIMESTAMP }),
    admin.database().ref(`userCoupons/${context.auth.uid}/${redemptionRef.key}`).set(redemption),
    admin.database().ref(`couponAudit/${redemptionRef.key}`).push({ action: 'issued', at: admin.database.ServerValue.TIMESTAMP, actor: context.auth.uid })
  ]);
  return { redemptionId: redemptionRef.key, code, brandName: brand.name || '', expiresAt: brand.endsAt || null };
});

exports.verifyBrandCoupon = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  const adminUser = await admin.database().ref(`users/${context.auth.uid}/role`).once('value');
  const legacyAdmin = await admin.database().ref(`admins/${context.auth.uid}`).once('value');
  if (context.auth.token.role !== 'admin' && adminUser.val() !== 'admin' && !legacyAdmin.exists()) throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  const code = String(data?.code || '').trim().toUpperCase();
  const snapshot = await admin.database().ref('couponRedemptions').orderByChild('code').equalTo(code).once('value');
  const matches = snapshot.val() || {};
  const [id, coupon] = Object.entries(matches)[0] || [];
  if (!coupon) throw new functions.https.HttpsError('not-found', 'Coupon code was not found');
  if (data?.consume) {
    if (coupon.status === 'redeemed') throw new functions.https.HttpsError('already-exists', 'Coupon was already redeemed');
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw new functions.https.HttpsError('failed-precondition', 'Coupon has expired');
    const updates = { status: 'redeemed', redeemedAt: admin.database.ServerValue.TIMESTAMP, redeemedBy: context.auth.uid };
    await Promise.all([
      admin.database().ref(`couponRedemptions/${id}`).update(updates),
      admin.database().ref(`userCoupons/${coupon.userId}/${id}`).update(updates),
      admin.database().ref(`couponAudit/${id}`).push({ action: 'redeemed', at: admin.database.ServerValue.TIMESTAMP, actor: context.auth.uid })
    ]);
    return { ...coupon, ...updates, valid: true };
  }
  return { ...coupon, valid: coupon.status === 'issued' && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date()) };
});

exports.verifyRegistrationChallenge = functions.https.onCall(async (data, context) => {
  const token = String(data?.token || '');
  const email = String(data?.email || '').trim().toLowerCase();
  const registrationType = data?.registrationType === 'anonymous' ? 'anonymous' : 'email';
  const domain = registrationType === 'anonymous' ? 'anonymous' : getEmailDomain(email);
  if (!token) throw new functions.https.HttpsError('invalid-argument', 'Security challenge is required');
  if (registrationType === 'email' && (!email || !domain || !email.includes('@'))) throw new functions.https.HttpsError('invalid-argument', 'A valid email address is required');

  const forwardedFor = context.rawRequest?.headers?.['x-forwarded-for'];
  const ipAddress = String(context.rawRequest?.ip || (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || 'unknown').split(',')[0].trim();
  const ipHash = hashValue(ipAddress);
  const userAgent = String(context.rawRequest?.headers?.['user-agent'] || '').slice(0, 240);
  const database = admin.database();

  if (registrationType === 'email' && await isDisposableDomain(database, domain)) {
    await writeSecurityEvent(database, { type: 'registration_rejected', reason: 'disposable_email', domain, ipHash, userAgent, suspicious: true });
    throw new functions.https.HttpsError('permission-denied', 'Temporary or disposable email addresses are not allowed.');
  }

  const [ipLimited, domainLimited] = await Promise.all([
    consumeRateLimit(database, 'ip', ipAddress, 5),
    registrationType === 'email' ? consumeRateLimit(database, 'domain', domain, 25) : Promise.resolve(false)
  ]);
  const expiredHour = Math.floor(Date.now() / 3600000) - 49;
  database.ref(`registrationSecurity/rateLimits/${expiredHour}`).remove().catch(() => {});
  if (ipLimited || domainLimited) {
    await writeSecurityEvent(database, { type: 'registration_rejected', reason: ipLimited ? 'ip_rate_limit' : 'domain_velocity', domain, ipHash, userAgent, suspicious: true });
    throw new functions.https.HttpsError('resource-exhausted', 'Too many registration attempts. Please try again later.');
  }

  const projectId = process.env.GCLOUD_PROJECT || admin.app().options.projectId;
  const siteKey = process.env.RECAPTCHA_SITE_KEY || '6LeXXPsrAAAAAJEpQ2J-1TPTTmNvE5G8U1GSWsVQ';
  const accessToken = await admin.app().options.credential.getAccessToken();
  const response = await fetch(`https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: { token, siteKey, expectedAction: 'REGISTER' } })
  });
  const assessment = await response.json();
  if (!response.ok) throw new functions.https.HttpsError('internal', 'Security verification is unavailable');
  const score = Number(assessment.riskAnalysis?.score || 0);
  const valid = assessment.tokenProperties?.valid === true && assessment.tokenProperties?.action === 'REGISTER' && score >= 0.5;
  await writeSecurityEvent(database, {
    type: valid ? 'registration_challenge_passed' : 'registration_rejected',
    reason: valid ? (score < 0.7 ? 'low_confidence_allowed' : 'challenge_passed') : 'captcha_failed',
    domain,
    registrationType,
    ipHash,
    userAgent,
    captchaScore: score,
    suspicious: !valid || score < 0.7
  });
  return { valid, suspicious: score < 0.7 };
});

// Compatibility-safe backstop. Direct Firebase Auth calls cannot bypass the
// disposable-domain policy: accounts that evade the registration preflight are
// disabled immediately and recorded for admin review. A true before-create
// rejection can replace this after the project enables Identity Platform.
exports.auditNewRegistration = functions.auth.user().onCreate(async user => {
  const database = admin.database();
  const domain = user.email ? getEmailDomain(user.email) : user.phoneNumber ? 'phone' : user.isAnonymous ? 'anonymous' : 'provider';
  const disposable = user.email ? await isDisposableDomain(database, domain) : false;
  const providerIds = (user.providerData || []).map(provider => provider.providerId);
  const domainVelocityExceeded = ['anonymous', 'phone', 'provider'].includes(domain) ? false : await consumeRateLimit(database, 'createdDomain', domain, 40);
  const suspicious = disposable || domainVelocityExceeded;

  if (disposable) {
    await admin.auth().updateUser(user.uid, { disabled: true });
    await admin.auth().revokeRefreshTokens(user.uid);
  }
  if (suspicious) {
    await database.ref(`registrationSecurity/flaggedUsers/${user.uid}`).set({
      uid: user.uid,
      email: user.email || null,
      domain,
      providerIds,
      reason: disposable ? 'disposable_email' : 'unusual_domain_velocity',
      disabled: disposable,
      status: 'open',
      createdAt: Date.now()
    });
  }
  await writeSecurityEvent(database, {
    type: 'account_created',
    uid: user.uid,
    domain,
    providerIds,
    reason: suspicious ? (disposable ? 'disposable_email' : 'unusual_domain_velocity') : 'normal',
    suspicious
  });
  return null;
});
