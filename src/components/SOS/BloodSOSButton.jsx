// =============================================
// src/components/SOS/BloodSOSButton.jsx
// Floating action button + modal for creating Blood SOS requests
// =============================================
import React, { useMemo, useState } from 'react';
import { LifeBuoy, X, AlertCircle } from 'lucide-react';
import { useBloodSOS } from '../../context/SOS/BloodSOSContext';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';

const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];

const BloodSOSButton = ({ onRequireLogin }) => {
  const { user } = useEnhancedAuth();
  const {
    createSOSRequest,
    isSubmitting,
    myActiveRequest,
    currentCity,
    markRequestFulfilled,
    hasActiveSOS
  } = useBloodSOS();

  const [isOpen, setIsOpen] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [shareContact, setShareContact] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const cityName = currentCity?.name || 'your city';

  const canCreateRequest = useMemo(() => !myActiveRequest, [myActiveRequest]);

  const resetForm = () => {
    setBloodGroup('');
    setLocation('');
    setNotes('');
    setShareContact(true);
    setFormError('');
  };

  const handleOpenModal = () => {
    if (!user) {
      if (onRequireLogin) {
        onRequireLogin();
      }
      return;
    }
    setFormError('');
    setFormSuccess('');
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    resetForm();
    setFormSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canCreateRequest) {
      setFormError('You already have an active SOS request. Please mark it fulfilled before creating another.');
      return;
    }

    const trimmedLocation = location.trim();
    const trimmedNotes = notes.trim();

    setFormError('');
    setFormSuccess('');

    try {
      await createSOSRequest({
        bloodGroup,
        location: trimmedLocation,
        shareContact,
        notes: trimmedNotes
      });

      setFormSuccess('SOS request shared with matching donors in your city. Stay available for calls.');
      resetForm();

      // Keep modal open to surface success + allow quick exit
      setTimeout(() => {
        setIsOpen(false);
      }, 1600);
    } catch (error) {
      setFormError(error.message || 'Unable to create SOS request right now.');
    }
  };

  const handleFulfilment = async () => {
    if (!myActiveRequest) return;
    try {
      await markRequestFulfilled(myActiveRequest.id);
      setFormSuccess('Marked as fulfilled. Thank you for updating the community.');
    } catch (error) {
      setFormError(error.message || 'Failed to update the SOS status.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className={`fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-xl transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-500/30 ${hasActiveSOS ? 'shadow-red-500/70 animate-pulse' : 'shadow-red-500/40'}`}
        aria-label="Raise Blood SOS request"
      >
        <LifeBuoy className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-lg rounded-3xl border border-red-200/50 bg-white/95 p-6 shadow-2xl shadow-red-500/30 dark:border-red-500/30 dark:bg-gray-900/95">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Close blood SOS modal"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-200">
                <LifeBuoy className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Blood SOS Request</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Alert donors in {cityName}. Keep your phone reachable once you submit the request.
                </p>
              </div>
            </div>

            {myActiveRequest && (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:border-red-500/60 dark:bg-red-900/30 dark:text-red-200">
                <p>
                  You already have an active SOS for <span className="font-semibold">{myActiveRequest.bloodGroup}</span> at <span className="font-semibold">{myActiveRequest.location}</span>.
                </p>
                <p className="mt-1">Please update it once the requirement is fulfilled.</p>
                <button
                  type="button"
                  onClick={handleFulfilment}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-600"
                >
                  Mark as fulfilled
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="sos-blood-group" className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Required blood group
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="sos-blood-group"
                  value={bloodGroup}
                  onChange={(event) => setBloodGroup(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  disabled={isSubmitting || !canCreateRequest}
                  required
                >
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sos-location" className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Hospital / donation location
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="sos-location"
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="e.g. Sterling Hospital, Race Course Road"
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  disabled={isSubmitting || !canCreateRequest}
                  required
                />
              </div>

              <div>
                <label htmlFor="sos-notes" className="text-sm font-semibold text-gray-800 dark:text-gray-100">Additional details (optional)</label>
                <textarea
                  id="sos-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Add ward number, contact person or other useful info"
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  disabled={isSubmitting || !canCreateRequest}
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl bg-gray-50/80 p-3 text-sm text-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={shareContact}
                  onChange={(event) => setShareContact(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                  disabled={isSubmitting || !canCreateRequest}
                />
                <span>
                  I consent to share my contact information with matching donors in {cityName} so they can reach me directly.
                </span>
              </label>

              {!shareContact && (
                <p className="flex items-center gap-2 text-xs font-medium text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  Without contact details, donors may not be able to reach you quickly.
                </p>
              )}

              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:border-red-500/60 dark:bg-red-900/30 dark:text-red-100">
                  <AlertCircle className="h-4 w-4" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:border-green-500/60 dark:bg-green-900/30 dark:text-green-200">
                  {formSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-400"
                disabled={isSubmitting || !canCreateRequest}
              >
                {isSubmitting ? 'Sharing SOS…' : 'Send SOS alert'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BloodSOSButton;
