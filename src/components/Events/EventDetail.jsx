// =============================================
// src/components/Events/EventDetail.jsx
// BookMyShow-style Event Detail Page
// =============================================
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Heart, 
  Share2, 
  Ticket,
  DollarSign,
  Eye,
  Play,
  ExternalLink,
  Info,
  Shield,
  Camera,
  Video,
  CheckCircle,
  Award,
  Navigation,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase-config';
import EventRegistration from './EventRegistration';

const EventDetail = ({ eventId, onBack }) => {
  const { t } = useTranslation();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
          <button
            onClick={onBack}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price) => {
    if (!price || price === 'Free' || price === '0') return 'Free';
    if (typeof price === 'string' && price.startsWith('₹')) return price;
    return `₹${price}`;
  };

  const getEventStatus = () => {
    const now = new Date();
    const eventDate = new Date(event.startDate);
    const daysDiff = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) return { text: 'Past Event', color: 'text-gray-500', bg: 'bg-gray-100' };
    if (daysDiff === 0) return { text: 'Today', color: 'text-red-600', bg: 'bg-red-100' };
    if (daysDiff === 1) return { text: 'Tomorrow', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: `${daysDiff} days to go`, color: 'text-green-600', bg: 'bg-green-100' };
  };

  const status = getEventStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image */}
        {event.media?.images?.length > 0 && (
          <div className="h-96 lg:h-[500px] relative overflow-hidden">
            <img
              src={event.media.images[activeImageIndex]?.url || event.media.thumbnail}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
            
            {/* Image Navigation */}
            {event.media.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {event.media.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`w-3 h-3 rounded-full ${
                      activeImageIndex === index ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Header Actions */}
        <div className="absolute top-0 left-0 right-0 p-4 lg:p-6 flex items-center justify-between z-10">
          <button
            onClick={onBack}
            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
                isBookmarked 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Heart className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Event Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-8 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status.bg} ${status.color}`}>
                {status.text}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-600 text-white">
                {event.category?.toUpperCase()}
              </span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {event.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-lg">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 mr-2" />
                <span>{new Date(event.startDate).toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-6 h-6 mr-2" />
                <span>{event.startTime}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-6 h-6 mr-2" />
                <span>{event.venue?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Event */}
            <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Info className="w-6 h-6 mr-3 text-red-600" />
                About This Event
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>

            {/* Media Gallery */}
            {(event.media?.images?.length > 0 || event.media?.videos?.length > 0) && (
              <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Camera className="w-6 h-6 mr-3 text-red-600" />
                  Event Gallery
                </h2>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {event.media.images?.map((image, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer overflow-hidden rounded-lg"
                      onClick={() => setSelectedMedia({ type: 'image', url: image.url })}
                    >
                      <img
                        src={image.url}
                        alt={`Event ${index + 1}`}
                        className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                  
                  {event.media.videos?.map((video, index) => (
                    <div
                      key={`video-${index}`}
                      className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-900"
                      onClick={() => setSelectedMedia({ type: 'video', url: video.url })}
                    >
                      <div className="w-full h-32 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Venue Information */}
            <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <MapPin className="w-6 h-6 mr-3 text-red-600" />
                Venue Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {event.venue?.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{event.venue?.address}</p>
                </div>

                {event.venue?.facilities?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Venue Facilities</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {event.venue.facilities.map((facility, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          {facility}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {event.venue?.googleMapsUrl && (
                  <div className="pt-4">
                    <a
                      href={event.venue.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                    >
                      <Navigation className="w-5 h-5 mr-2" />
                      Get Directions
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Event Amenities */}
            {event.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Award className="w-6 h-6 mr-3 text-red-600" />
                  Event Amenities
                </h2>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {event.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center text-gray-700">
                      <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Organizer Information */}
            <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Organizer</h2>
              
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-red-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {event.organizer?.name}
                  </h3>
                  
                  <div className="space-y-2">
                    {event.organizer?.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{event.organizer.email}</span>
                      </div>
                    )}
                    {event.organizer?.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{event.organizer.phone}</span>
                      </div>
                    )}
                    {event.organizer?.website && (
                      <div className="flex items-center text-gray-600">
                        <Globe className="w-4 h-4 mr-2" />
                        <a 
                          href={event.organizer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatPrice(event.ticketTypes?.[0]?.price)}
                  {event.ticketTypes?.length > 1 && (
                    <span className="text-lg text-gray-500 font-normal"> onwards</span>
                  )}
                </div>
                <p className="text-gray-600">per person</p>
              </div>

              {event.ticketTypes?.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-gray-900">Available Tickets</h4>
                  {event.ticketTypes.map((ticket, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{ticket.name}</div>
                        <div className="text-sm text-gray-500">
                          {ticket.availableSeats} seats available
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(ticket.price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {event.registrationRequired && (
                <button
                  onClick={() => setShowRegistration(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  Book Tickets
                </button>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Shield className="w-4 h-4 mr-2" />
                  100% Safe & Secure Payments
                </div>
              </div>
            </div>

            {/* Event Stats */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Event Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Registered</span>
                  <span className="font-semibold">
                    {Object.keys(event.registrations || {}).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Capacity</span>
                  <span className="font-semibold">{event.maxCapacity}</span>
                </div>
                {event.venue?.capacity && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Venue Capacity</span>
                    <span className="font-semibold">{event.venue.capacity}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <EventRegistration 
              eventId={event.id}
              onClose={() => setShowRegistration(false)}
            />
          </div>
        </div>
      )}

      {/* Media Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <ArrowLeft className="w-8 h-8" />
            </button>
            
            {selectedMedia.type === 'image' ? (
              <img
                src={selectedMedia.url}
                alt="Event media"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            ) : (
              <video
                src={selectedMedia.url}
                controls
                className="w-full h-auto max-h-[80vh] rounded-lg"
                autoPlay
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;