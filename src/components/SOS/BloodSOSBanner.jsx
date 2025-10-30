// =============================================
// src/components/SOS/BloodSOSBanner.jsx
// Active Blood SOS indicator shown across the app
// =============================================
import React from 'react';
import { LifeBuoy, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useBloodSOS } from '../../context/SOS/BloodSOSContext';

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const created = new Date(timestamp).getTime();
  if (Number.isNaN(created)) return '';

  const diffMinutes = Math.round((Date.now() - created) / 60000);
  if (diffMinutes <= 0) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
  return new Date(timestamp).toLocaleDateString();
};

const BloodSOSBanner = () => {
  const { activeRequests, loading, myActiveRequest, markRequestFulfilled } = useBloodSOS();

  if (loading || !activeRequests.length) {
    return null;
  }

  return (
    <div className="px-4 pt-4">
      <div className="mx-auto max-w-md md:max-w-2xl rounded-3xl border border-red-400/50 bg-red-50/90 p-5 shadow-lg shadow-red-400/20 dark:border-red-500/40 dark:bg-red-900/30">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500 text-white shadow-md shadow-red-500/40">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold uppercase tracking-widest text-red-600 dark:text-red-200">Active Blood SOS</span>
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" aria-hidden="true"></span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-100">
              Someone nearby urgently needs blood. If you match the group, please connect and help.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {activeRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-2xl border border-red-400/40 bg-white/90 p-4 shadow-inner shadow-red-400/20 dark:border-red-500/30 dark:bg-gray-900/90"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-200">{request.bloodGroup}</span>
                    <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-red-500 dark:text-red-300">
                      <Clock className="h-4 w-4" />
                      {formatRelativeTime(request.createdAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-sm font-medium text-gray-900 dark:text-red-50">
                    <MapPin className="mt-0.5 h-4 w-4 text-red-500" />
                    <span>{request.location}</span>
                  </div>
                  {request.notes && (
                    <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:bg-red-500/20 dark:text-red-100">
                      “{request.notes}”
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-red-500 dark:text-red-200">
                  <p>Requested by {request.createdByName || 'member'}</p>
                </div>
              </div>

              {request.shareContact && request.contactDetails && (
                <div className="mt-3 grid gap-3 rounded-xl bg-red-500/5 px-3 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-100 sm:grid-cols-2">
                  {request.contactDetails.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${request.contactDetails.phone}`} className="underline decoration-dotted">
                        {request.contactDetails.phone}
                      </a>
                    </div>
                  )}
                  {request.contactDetails.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${request.contactDetails.email}`} className="underline decoration-dotted">
                        {request.contactDetails.email}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {myActiveRequest?.id === request.id && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-medium text-red-600 dark:text-red-200">
                    Once your requirement is fulfilled, mark it so we can clear the alert for others.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await markRequestFulfilled(request.id);
                      } catch (error) {
                        console.error('Failed to mark SOS as fulfilled:', error);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-600"
                  >
                    Mark as fulfilled
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BloodSOSBanner;
