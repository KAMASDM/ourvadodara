// =============================================
// src/components/Events/EventRegistration.jsx
// Event Registration System for Users
// =============================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Ticket, 
  Star,
  DollarSign,
  Share2,
  Heart,
  User,
  Mail,
  Phone,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  QrCode,
  ArrowLeft,
  Plus,
  Minus,
  Gift,
  Tag,
  Shield
} from 'lucide-react';
import { ref, onValue, push, update, get } from 'firebase/database';
import { db } from '../../firebase-config';
import QRCode from 'qrcode';

const EventRegistration = ({ eventId, onClose }) => {
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [step, setStep] = useState(1); // 1: details, 2: tickets, 3: info, 4: payment, 5: confirmation
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Registration form data
  const [registrationData, setRegistrationData] = useState({
    attendees: [{
      id: 1,
      name: user?.displayName || '',
      email: user?.email || '',
      phone: '',
      age: '',
      dietary: ''
    }],
    selectedTickets: {},
    totalAmount: 0,
    promoCode: '',
    discount: 0,
    finalAmount: 0,
    paymentMethod: 'card',
    agreeTerms: false,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    specialRequests: ''
  });

  useEffect(() => {
    if (eventId) {
      const eventRef = ref(db, `events/${eventId}`);
      const unsubscribe = onValue(eventRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setEvent({ id: eventId, ...data });
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [eventId]);

  const calculateTotal = () => {
    let total = 0;
    Object.entries(registrationData.selectedTickets).forEach(([ticketTypeId, quantity]) => {
      const ticketType = event.ticketTypes.find(t => t.id.toString() === ticketTypeId);
      if (ticketType) {
        total += ticketType.price * quantity;
      }
    });

    const discount = registrationData.discount;
    const finalAmount = Math.max(0, total - discount);

    setRegistrationData(prev => ({
      ...prev,
      totalAmount: total,
      finalAmount: finalAmount
    }));
  };

  useEffect(() => {
    if (event) {
      calculateTotal();
    }
  }, [event, registrationData.selectedTickets, registrationData.discount]);

  const updateTicketQuantity = (ticketTypeId, change) => {
    if (!event || !event.ticketTypes || event.ticketTypes.length === 0) {
      setError('Event ticket information is not available');
      return;
    }

    const currentQuantity = registrationData.selectedTickets[ticketTypeId] || 0;
    const newQuantity = Math.max(0, currentQuantity + change);
    
    const ticketType = event.ticketTypes.find(t => t.id.toString() === ticketTypeId.toString());
    if (!ticketType) {
      setError('Ticket type not found');
      return;
    }
    
    if (newQuantity > ticketType.availableSeats) {
      setError(`Only ${ticketType.availableSeats} tickets available for ${ticketType.name}`);
      return;
    }

    setRegistrationData(prev => ({
      ...prev,
      selectedTickets: {
        ...prev.selectedTickets,
        [ticketTypeId]: newQuantity
      }
    }));
    setError('');
  };

  const addAttendee = () => {
    const newAttendee = {
      id: Date.now(),
      name: '',
      email: '',
      phone: '',
      age: '',
      dietary: ''
    };
    setRegistrationData(prev => ({
      ...prev,
      attendees: [...prev.attendees, newAttendee]
    }));
  };

  const removeAttendee = (attendeeId) => {
    setRegistrationData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a.id !== attendeeId)
    }));
  };

  const updateAttendee = (attendeeId, field, value) => {
    setRegistrationData(prev => ({
      ...prev,
      attendees: prev.attendees.map(attendee =>
        attendee.id === attendeeId ? { ...attendee, [field]: value } : attendee
      )
    }));
  };

  const applyPromoCode = async () => {
    if (!registrationData.promoCode) return;

    try {
      // In a real app, you'd validate promo codes against a database
      const promoCodesRef = ref(db, `events/${eventId}/promoCodes/${registrationData.promoCode}`);
      const snapshot = await get(promoCodesRef);
      
      if (snapshot.exists()) {
        const promoData = snapshot.val();
        if (promoData.active && new Date(promoData.expiresAt) > new Date()) {
          const discount = promoData.type === 'percentage' 
            ? (registrationData.totalAmount * promoData.value) / 100
            : promoData.value;
          
          setRegistrationData(prev => ({
            ...prev,
            discount: Math.min(discount, prev.totalAmount)
          }));
          setError('');
        } else {
          setError('Promo code is expired or inactive');
        }
      } else {
        setError('Invalid promo code');
      }
    } catch (err) {
      setError('Failed to apply promo code');
    }
  };

  const generateQRCode = async (registrationId) => {
    try {
      const qrData = {
        eventId: event.id,
        registrationId: registrationId,
        userId: user.uid,
        timestamp: Date.now(),
        type: 'checkin'
      };

      const qrString = JSON.stringify(qrData);
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrCodeDataUrl);
    } catch (err) {
      console.error('QR Code generation failed:', err);
    }
  };

  const submitRegistration = async () => {
    setRegistering(true);
    setError('');

    try {
      // Validate required fields
      if (registrationData.attendees.some(a => !a.name || !a.email)) {
        throw new Error('Please fill in all required attendee information');
      }

      if (Object.values(registrationData.selectedTickets).every(qty => qty === 0)) {
        throw new Error('Please select at least one ticket');
      }

      if (!registrationData.agreeTerms) {
        throw new Error('Please agree to the terms and conditions');
      }

      // Create registration record
      const registrationRecord = {
        eventId: event.id,
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        attendees: registrationData.attendees,
        tickets: registrationData.selectedTickets,
        totalAmount: registrationData.totalAmount,
        discount: registrationData.discount,
        finalAmount: registrationData.finalAmount,
        promoCode: registrationData.promoCode,
        paymentMethod: registrationData.paymentMethod,
        emergencyContact: registrationData.emergencyContact,
        specialRequests: registrationData.specialRequests,
        registeredAt: new Date().toISOString(),
        status: 'confirmed',
        checkedIn: false,
        paymentStatus: registrationData.finalAmount === 0 ? 'free' : 'paid'
      };

      // Save to database
      const registrationRef = await push(ref(db, `events/${eventId}/registrations`), registrationRecord);
      const newRegistrationId = registrationRef.key;
      setRegistrationId(newRegistrationId);

      // Update ticket availability
      for (const [ticketTypeId, quantity] of Object.entries(registrationData.selectedTickets)) {
        if (quantity > 0) {
          const ticketRef = ref(db, `events/${eventId}/ticketTypes`);
          const ticketSnapshot = await get(ticketRef);
          const tickets = ticketSnapshot.val();
          
          if (tickets) {
            const ticketArray = Array.isArray(tickets) ? tickets : Object.values(tickets);
            const ticketIndex = ticketArray.findIndex(t => t.id.toString() === ticketTypeId);
            
            if (ticketIndex !== -1) {
              const updatedTickets = [...ticketArray];
              updatedTickets[ticketIndex] = {
                ...updatedTickets[ticketIndex],
                availableSeats: updatedTickets[ticketIndex].availableSeats - quantity
              };
              
              await update(ref(db, `events/${eventId}`), {
                ticketTypes: updatedTickets
              });
            }
          }
        }
      }

      // Update analytics
      const analyticsRef = ref(db, `events/${eventId}/analytics`);
      const analyticsSnapshot = await get(analyticsRef);
      const currentAnalytics = analyticsSnapshot.val() || {};
      
      await update(analyticsRef, {
        registrations: (currentAnalytics.registrations || 0) + 1,
        revenue: (currentAnalytics.revenue || 0) + registrationData.finalAmount
      });

      // Generate QR Code
      await generateQRCode(newRegistrationId);

      setSuccess(true);
      setStep(5);

    } catch (err) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const downloadTicket = () => {
    // Create a simple ticket as HTML and trigger download
    const ticketHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Event Ticket - ${event.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .ticket { border: 2px solid #000; padding: 20px; max-width: 600px; margin: 0 auto; }
          .qr-code { text-align: center; margin: 20px 0; }
          .event-details { margin: 20px 0; }
          .attendee-info { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <h1>${event.title}</h1>
          <div class="event-details">
            <p><strong>Date:</strong> ${event.startDate} ${event.startTime}</p>
            <p><strong>Venue:</strong> ${event.venue.name}, ${event.venue.address}</p>
            <p><strong>Registration ID:</strong> ${registrationId}</p>
          </div>
          <div class="attendee-info">
            <h3>Attendees:</h3>
            ${registrationData.attendees.map(attendee => `
              <p>${attendee.name} - ${attendee.email}</p>
            `).join('')}
          </div>
          <div class="qr-code">
            <p><strong>QR Code for Check-in:</strong></p>
            <img src="${qrCodeUrl}" alt="QR Code" />
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([ticketHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket_${event.title}_${registrationId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Event Not Found</h3>
        <p className="text-gray-500">The requested event could not be found.</p>
      </div>
    );
  }

  const totalTickets = Object.values(registrationData.selectedTickets).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          {onClose && (
            <button
              onClick={onClose}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event Registration</h1>
            <p className="text-gray-600">{event.title}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Step {step} of 5</div>
          <div className="flex items-center space-x-2 mt-1">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-3 h-3 rounded-full ${
                  stepNum <= step ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Event Details */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {event.images && event.images.length > 0 && (
              <img
                src={event.images[0]}
                alt={event.title}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-medium">{event.startDate}</div>
                      <div className="text-sm">{event.startTime} - {event.endTime}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-medium">{event.venue.name}</div>
                      <div className="text-sm">{event.venue.address}, {event.venue.city}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-medium">Capacity: {event.maxCapacity}</div>
                      <div className="text-sm">
                        {Object.keys(event.registrations || {}).length} registered
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Organizer</h3>
                  <div className="space-y-1 text-gray-600">
                    <div>{event.organizer.name}</div>
                    <div className="text-sm">{event.organizer.email}</div>
                    {event.organizer.phone && (
                      <div className="text-sm">{event.organizer.phone}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
              </div>

              {event.amenities && event.amenities.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {event.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Continue to Tickets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Ticket Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Select Tickets</h2>
            
            {!event || !event.ticketTypes || event.ticketTypes.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tickets Available</h3>
                <p className="text-gray-600">This event doesn't have ticket information configured yet.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {event.ticketTypes.map((ticketType) => (
                <div key={ticketType.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{ticketType.name}</h3>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {ticketType.price === 0 ? 'Free' : `₹${ticketType.price}`}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {ticketType.availableSeats} seats available
                      </div>
                      {ticketType.benefits && ticketType.benefits.length > 0 && (
                        <div className="mt-2">
                          {ticketType.benefits.map((benefit, index) => (
                            <div key={index} className="text-sm text-gray-600 flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                              {benefit}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateTicketQuantity(ticketType.id, -1)}
                        disabled={!registrationData.selectedTickets[ticketType.id] || registrationData.selectedTickets[ticketType.id] === 0}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <span className="w-8 text-center font-semibold">
                        {registrationData.selectedTickets[ticketType.id] || 0}
                      </span>
                      
                      <button
                        onClick={() => updateTicketQuantity(ticketType.id, 1)}
                        disabled={ticketType.availableSeats === 0}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}

            {/* Promo Code */}
            <div className="border-t pt-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Promo Code</h3>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={registrationData.promoCode}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, promoCode: e.target.value }))}
                  placeholder="Enter promo code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={applyPromoCode}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2">
                {Object.entries(registrationData.selectedTickets).map(([ticketTypeId, quantity]) => {
                  if (quantity === 0) return null;
                  const ticketType = event.ticketTypes.find(t => t.id.toString() === ticketTypeId);
                  return (
                    <div key={ticketTypeId} className="flex justify-between text-sm">
                      <span>{ticketType.name} x {quantity}</span>
                      <span>₹{(ticketType.price * quantity).toLocaleString()}</span>
                    </div>
                  );
                })}
                
                {registrationData.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{registrationData.discount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{registrationData.finalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={totalTickets === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Continue to Attendee Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Attendee Information */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Attendee Information</h2>
              <button
                onClick={addAttendee}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Attendee
              </button>
            </div>

            <div className="space-y-6">
              {registrationData.attendees.map((attendee, index) => (
                <div key={attendee.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Attendee {index + 1}</h3>
                    {registrationData.attendees.length > 1 && (
                      <button
                        onClick={() => removeAttendee(attendee.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={attendee.name}
                        onChange={(e) => updateAttendee(attendee.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={attendee.email}
                        onChange={(e) => updateAttendee(attendee.id, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={attendee.phone}
                        onChange={(e) => updateAttendee(attendee.id, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        value={attendee.age}
                        onChange={(e) => updateAttendee(attendee.id, 'age', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="120"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Emergency Contact */}
            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={registrationData.emergencyContact.name}
                    onChange={(e) => setRegistrationData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={registrationData.emergencyContact.phone}
                    onChange={(e) => setRegistrationData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <select
                    value={registrationData.emergencyContact.relationship}
                    onChange={(e) => setRegistrationData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select relationship</option>
                    <option value="parent">Parent</option>
                    <option value="spouse">Spouse</option>
                    <option value="sibling">Sibling</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Information</h2>

            {registrationData.finalAmount === 0 ? (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Event</h3>
                <p className="text-gray-600">No payment required for this event.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="card"
                        checked={registrationData.paymentMethod === 'card'}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="mr-3"
                      />
                      <CreditCard className="w-5 h-5 mr-2" />
                      Credit/Debit Card
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="upi"
                        checked={registrationData.paymentMethod === 'upi'}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="mr-3"
                      />
                      <Phone className="w-5 h-5 mr-2" />
                      UPI Payment
                    </label>
                  </div>
                </div>

                {/* Payment form would go here in a real implementation */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-800 text-sm">
                      Payment processing is simulated for this demo. In a real app, integrate with payment gateways like Razorpay or Stripe.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Final Order Summary</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(registrationData.selectedTickets).map(([ticketTypeId, quantity]) => {
                  if (quantity === 0) return null;
                  const ticketType = event.ticketTypes.find(t => t.id.toString() === ticketTypeId);
                  return (
                    <div key={ticketTypeId} className="flex justify-between">
                      <span>{ticketType.name} x {quantity}</span>
                      <span>₹{(ticketType.price * quantity).toLocaleString()}</span>
                    </div>
                  );
                })}
                
                {registrationData.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount Applied</span>
                    <span>-₹{registrationData.discount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="border-t pt-2 flex justify-between font-semibold text-base">
                  <span>Total Amount</span>
                  <span>₹{registrationData.finalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mt-6">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={registrationData.agreeTerms}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                  className="mt-1 mr-3"
                  required
                />
                <span className="text-sm text-gray-600">
                  I agree to the <button className="text-blue-600 hover:underline">terms and conditions</button> and understand the <button className="text-blue-600 hover:underline">refund policy</button> for this event.
                </span>
              </label>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(3)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={submitRegistration}
                disabled={registering || !registrationData.agreeTerms}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {registering ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    {registrationData.finalAmount === 0 ? 'Complete Registration' : 'Complete Payment'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && success && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your registration for "{event.title}" has been confirmed.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm space-y-2">
                <div><strong>Registration ID:</strong> {registrationId}</div>
                <div><strong>Event Date:</strong> {event.startDate} {event.startTime}</div>
                <div><strong>Venue:</strong> {event.venue.name}</div>
                <div><strong>Total Amount:</strong> ₹{registrationData.finalAmount.toLocaleString()}</div>
              </div>
            </div>

            {qrCodeUrl && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Your Event QR Code</h3>
                <div className="flex justify-center mb-3">
                  <img src={qrCodeUrl} alt="Event QR Code" className="w-48 h-48 border border-gray-200 rounded-lg" />
                </div>
                <p className="text-sm text-gray-600">
                  Present this QR code at the event entrance for quick check-in
                </p>
              </div>
            )}

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={downloadTicket}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Ticket
              </button>
              
              <button
                onClick={() => {
                  const shareData = {
                    title: `Registered for ${event.title}`,
                    text: `I just registered for ${event.title} on ${event.startDate}!`,
                    url: window.location.href
                  };
                  
                  if (navigator.share) {
                    navigator.share(shareData);
                  } else {
                    // Fallback for browsers that don't support Web Share API
                    navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                  }
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <p>A confirmation email has been sent to your registered email address.</p>
              <p className="mt-1">For any queries, contact the event organizer at {event.organizer.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventRegistration;