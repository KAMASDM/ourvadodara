// =============================================
// src/components/Events/EventCard.jsx
// BookMyShow-style Event Card Component
// =============================================
import React, { useState } from 'react';
import { 
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
  Bookmark,
  Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EventCard = ({ 
  event, 
  variant = 'card', // card, list, featured
  onRegister, 
  onBookmark, 
  onShare,
  isBookmarked = false,
  className = '' 
}) => {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const getEventStatus = () => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const daysDiff = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) return { text: 'Past Event', color: 'text-gray-500', bg: 'bg-gray-100' };
    if (daysDiff === 0) return { text: 'Today', color: 'text-red-600', bg: 'bg-red-100' };
    if (daysDiff === 1) return { text: 'Tomorrow', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (daysDiff <= 7) return { text: `${daysDiff} days left`, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: `${daysDiff} days left`, color: 'text-green-600', bg: 'bg-green-100' };
  };

  const status = getEventStatus();
  
  const formatPrice = (price) => {
    if (!price || price === 'Free' || price === '0') return 'Free';
    if (typeof price === 'string' && price.startsWith('₹')) return price;
    return `₹${price}`;
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return showFullDescription ? text : text.substring(0, maxLength) + '...';
  };

  if (variant === 'featured') {
    return (
      <div className={`relative overflow-hidden rounded-2xl shadow-2xl group cursor-pointer transform hover:scale-105 transition-all duration-300 ${className}`}>
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={event.media?.thumbnail || event.image || '/images/events/default.jpg'}
            alt={event.title}
            className="w-full h-full object-cover"
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 p-8 h-full flex flex-col justify-end text-white">
          {/* Status Badge */}
          <div className="absolute top-6 left-6 flex space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status.bg} ${status.color} bg-opacity-90`}>
              {status.text}
            </span>
            {event.isPopular && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-600 text-white flex items-center">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Popular
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-6 right-6 flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmark?.(event.id);
              }}
              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                isBookmarked 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Heart className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare?.(event);
              }}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Event Info */}
          <div className="mb-4">
            <span className="text-red-400 text-sm font-medium mb-2 block">
              {event.category?.toUpperCase()}
            </span>
            <h3 className="text-3xl font-bold mb-3 leading-tight">
              {event.title}
            </h3>
            
            <div className="flex items-center space-x-6 mb-4 text-gray-200">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{event.location}</span>
              </div>
            </div>

            {/* Price and Register */}
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">
                {formatPrice(event.price)}
              </div>
              {event.registrationRequired && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegister?.(event.id);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors shadow-lg"
                >
                  Book Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100 dark:border-gray-700 ${className}`}>
        <div className="flex space-x-6">
          {/* Event Image */}
          <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 relative">
            <img
              src={event.media?.thumbnail || event.image || '/images/events/default.jpg'}
              alt={event.title}
              className="w-full h-full object-cover"
              onLoad={() => setImageLoaded(true)}
            />
            {event.media?.videos?.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <Play className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-red-600 text-sm font-medium">
                  {event.category?.toUpperCase()}
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {event.title}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                  {status.text}
                </span>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
              {truncateText(event.description)}
              {event.description?.length > 120 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-red-600 ml-1 font-medium"
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                </button>
              )}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {event.time}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {event.location}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(event.price)}
                </span>
                {event.registrationRequired && (
                  <button
                    onClick={() => onRegister?.(event.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Register
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default card variant (BookMyShow style)
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group ${className}`}>
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img
          src={event.media?.thumbnail || event.image || '/images/events/default.jpg'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Overlay with video play button */}
        {event.media?.videos?.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white rounded-full p-3">
              <Play className="w-6 h-6 text-gray-800" />
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
            {status.text}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex space-x-2">
          {event.isPopular && (
            <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Popular
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark?.(event.id);
            }}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              isBookmarked 
                ? 'bg-red-600 text-white' 
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Event Content */}
      <div className="p-5">
        {/* Category */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-red-600 text-sm font-semibold uppercase tracking-wide">
            {event.category}
          </span>
          {event.venue?.googleMapsUrl && (
            <a
              href={event.venue.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{new Date(event.date).toLocaleDateString('en-IN', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
            {event.time && (
              <>
                <Clock className="w-4 h-4 ml-4 mr-2 flex-shrink-0" />
                <span>{event.time}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          
          {event.attendees !== undefined && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{event.attendees} attending</span>
              {event.maxAttendees && (
                <span className="text-gray-400"> / {event.maxAttendees}</span>
              )}
            </div>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(event.price)}
            </span>
            {event.price !== 'Free' && event.ticketTypes?.length > 1 && (
              <span className="text-sm text-gray-500">onwards</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare?.(event);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            
            {event.registrationRequired && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRegister?.(event.id);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Book
              </button>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {(event.amenities?.length > 0 || event.venue?.facilities?.length > 0) && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
            >
              <Info className="w-3 h-3 mr-1" />
              View amenities & facilities
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;