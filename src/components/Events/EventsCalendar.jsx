// =============================================
// src/components/Events/EventsCalendar.jsx
// Local events and calendar integration with better UI
// =============================================
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Star,
  Filter,
  Share2,
  Ticket,
  Bookmark,
  X
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase-config';
import EventRegistration from './EventRegistration';
import EventCard from './EventCard';
import { useTranslation } from 'react-i18next';

const EventsCalendar = ({ className = '' }) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [viewMode, setViewMode] = useState('month');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [savedEvents, setSavedEvents] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Mock events data
  const mockEvents = [
    {
      id: 1,
      title: 'Navratri Festival 2025',
      description: 'Traditional Gujarati folk dance and music celebration',
      date: '2025-11-15',
      time: '19:00',
      venue: 'Sayajibaug Gardens, Vadodara',
      organizer: 'Cultural Society',
      category: 'Festival',
      price: 0,
      capacity: 1000,
      registered: 350,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      rating: 4.8,
      tags: ['Traditional', 'Dance', 'Music'],
      ticketTypes: [
        {
          id: 1,
          name: 'General Entry',
          price: 0,
          totalSeats: 1000,
          availableSeats: 650,
          benefits: ['Entry to all dance performances', 'Traditional snacks', 'Cultural activities']
        }
      ]
    },
    {
      id: 2,
      title: 'Tech Meetup Vadodara',
      description: 'Monthly tech meetup for developers and entrepreneurs',
      date: '2025-11-08',
      time: '18:30',
      venue: 'MS University',
      organizer: 'Dev Community',
      category: 'Technology',
      price: 100,
      capacity: 150,
      registered: 89,
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      rating: 4.5,
      tags: ['Tech', 'Networking'],
      ticketTypes: [
        {
          id: 1,
          name: 'Regular Pass',
          price: 100,
          totalSeats: 100,
          availableSeats: 61,
          benefits: ['Access to all sessions', 'Networking tea', 'Certificate of participation']
        },
        {
          id: 2,
          name: 'Student Pass',
          price: 50,
          totalSeats: 50,
          availableSeats: 11,
          benefits: ['Access to all sessions', 'Student networking', 'Certificate of participation']
        }
      ]
    },
    {
      id: 3,
      title: 'Food Festival Gujarat',
      description: 'Authentic Gujarati cuisine festival',
      date: '2025-11-20',
      time: '11:00',
      venue: 'Inox Road',
      organizer: 'Food Association',
      category: 'Food',
      price: 50,
      capacity: 500,
      registered: 200,
      image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',
      rating: 4.7,
      tags: ['Food', 'Cultural'],
      ticketTypes: [
        {
          id: 1,
          name: 'Food Explorer',
          price: 50,
          totalSeats: 300,
          availableSeats: 100,
          benefits: ['Access to all food stalls', 'Complimentary water', 'Recipe booklet']
        },
        {
          id: 2,
          name: 'VIP Foodie',
          price: 150,
          totalSeats: 100,
          availableSeats: 50,
          benefits: ['Priority access', 'Chef interactions', 'Premium tasting menu', 'Recipe booklet', 'Goodie bag']
        },
        {
          id: 3,
          name: 'Family Pack (4 people)',
          price: 180,
          totalSeats: 100,
          availableSeats: 50,
          benefits: ['Entry for 4 people', 'Family seating area', 'Kids activities', 'Recipe booklet']
        }
      ]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Events', color: 'blue' },
    { id: 'Festival', name: 'Festivals', color: 'orange' },
    { id: 'Technology', name: 'Tech', color: 'purple' },
    { id: 'Food', name: 'Food', color: 'green' },
    { id: 'Sports', name: 'Sports', color: 'red' },
    { id: 'Music', name: 'Music', color: 'pink' }
  ];

  const dateFilters = [
    { id: 'all', name: 'All Dates' },
    { id: 'today', name: 'Today' },
    { id: 'tomorrow', name: 'Tomorrow' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'past', name: 'Past Events' },
    { id: 'custom', name: 'Custom Range' }
  ];

  useEffect(() => {
    // Load events from Firebase
    const eventsRef = ref(db, 'events');
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const eventsData = snapshot.val();
        const eventsArray = Object.entries(eventsData).map(([id, event]) => ({
          id,
          ...event
        }));
        setEvents([...eventsArray, ...mockEvents]);
      } else {
        setEvents(mockEvents);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredEvents = events.filter(event => {
    // Category filter
    const categoryMatch = categoryFilter === 'all' || event.category === categoryFilter;
    
    // Date filter
    const eventDate = new Date(event.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    let dateMatch = true;
    
    switch (dateFilter) {
      case 'today':
        dateMatch = eventDate.toDateString() === today.toDateString();
        break;
      case 'tomorrow':
        dateMatch = eventDate.toDateString() === tomorrow.toDateString();
        break;
      case 'week':
        dateMatch = eventDate >= today && eventDate <= nextWeek;
        break;
      case 'month':
        dateMatch = eventDate >= today && eventDate <= nextMonth;
        break;
      case 'past':
        dateMatch = eventDate < today;
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          dateMatch = eventDate >= startDate && eventDate <= endDate;
        }
        break;
      default:
        dateMatch = true;
    }
    
    return categoryMatch && dateMatch;
  });

  const activeCategoryName = categories.find(category => category.id === categoryFilter)?.name || '';
  const activeDateLabel = dateFilters.find(filter => filter.id === dateFilter)?.name || '';
  const hasCustomRange = Boolean(customDateRange.start && customDateRange.end);
  const hasActiveFilters =
    categoryFilter !== 'all' ||
    dateFilter !== 'all' ||
    (dateFilter === 'custom' && hasCustomRange);

  const formatCustomRangeLabel = () => {
    if (!hasCustomRange) {
      return 'Custom Range';
    }

    const start = new Date(customDateRange.start).toLocaleDateString();
    const end = new Date(customDateRange.end).toLocaleDateString();
    return `${start} → ${end}`;
  };

  const clearFilters = () => {
    setCategoryFilter('all');
    setDateFilter('all');
    setCustomDateRange({ start: '', end: '' });
  };

  const handleSaveEvent = (eventId) => {
    setSavedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 ${className}`}>
      <div className="px-4 pt-8 pb-6 sm:pt-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-br from-white/95 via-white to-gray-50 dark:from-gray-900/95 dark:via-gray-900 dark:to-gray-950 shadow-sm shadow-gray-200/50 dark:shadow-black/40 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {t('events.title', 'Local Events')}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Discover curated experiences across Vadodara every week.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-br from-white/95 via-white to-gray-50 dark:from-gray-900/95 dark:via-gray-900 dark:to-gray-950 shadow-sm shadow-gray-200/50 dark:shadow-black/40 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Refine Events</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose categories and dates to tailor your feed.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-red-50/80 dark:hover:bg-red-500/10 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFiltersOpen(prev => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                  aria-expanded={filtersOpen}
                  aria-controls="events-filters-panel"
                >
                  <Filter className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                  <span>{filtersOpen ? 'Hide filters' : 'Show filters'}</span>
                </button>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categoryFilter !== 'all' && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-200 px-3 py-1.5 text-xs font-medium">
                    <span>{activeCategoryName}</span>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('all')}
                      className="p-0.5 rounded-full hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      aria-label="Clear category filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {dateFilter !== 'all' && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-200 px-3 py-1.5 text-xs font-medium">
                    <span>{dateFilter === 'custom' ? formatCustomRangeLabel() : activeDateLabel}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDateFilter('all');
                        setCustomDateRange({ start: '', end: '' });
                      }}
                      className="p-0.5 rounded-full hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      aria-label="Clear date filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {filtersOpen && (
              <div id="events-filters-panel" className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/85 dark:bg-gray-900/85 backdrop-blur p-6 shadow-inner shadow-gray-200/40 dark:shadow-black/20">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide">
                    Filter by Category
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setCategoryFilter(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          categoryFilter === category.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/85 dark:bg-gray-900/85 backdrop-blur p-6 shadow-inner shadow-gray-200/40 dark:shadow-black/20">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide">
                    Filter by Date
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {dateFilters.map((date) => (
                      <button
                        key={date.id}
                        onClick={() => {
                          setDateFilter(date.id);
                          if (date.id !== 'custom') {
                            setCustomDateRange({ start: '', end: '' });
                          }
                          if (date.id === 'custom') {
                            setFiltersOpen(true);
                          }
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          dateFilter === date.id
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {date.name}
                      </button>
                    ))}
                  </div>

                  {dateFilter === 'custom' && (
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
                        <input
                          type="date"
                          value={customDateRange.start}
                          onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-inner"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
                        <input
                          type="date"
                          value={customDateRange.end}
                          onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-inner"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full mx-auto px-4 pb-24 md:max-w-7xl sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Events Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No events match your current filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredEvents.map((event) => {
              const eventDate = new Date(event.date);
              const isExpired = eventDate < new Date();
              const isToday = eventDate.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={event.id}
                  className="rounded-3xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-b from-white/95 via-white to-gray-50 dark:from-gray-900/95 dark:via-gray-900 dark:to-gray-950 shadow-sm shadow-gray-200/40 dark:shadow-black/30 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="relative">
                    {/* Event Image */}
                    <div className="relative h-48 md:h-56">
                      <img
                        src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Status Badge */}
                      <div className="absolute top-4 left-4">
                        {isExpired ? (
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Expired
                          </span>
                        ) : isToday ? (
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Today
                          </span>
                        ) : (
                          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Upcoming
                          </span>
                        )}
                      </div>
                      
                      {/* Bookmark Button */}
                      <button
                        onClick={() => handleSaveEvent(event.id)}
                        className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 bg-opacity-90 hover:bg-opacity-100 rounded-lg transition-all shadow-md"
                      >
                        <Bookmark 
                          className={`w-5 h-5 ${
                            savedEvents.has(event.id) 
                              ? 'text-blue-600 fill-current' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`} 
                        />
                      </button>
                    </div>
                    
                    {/* Event Content */}
                    <div className="p-6">
                      {/* Category and Rating */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                          {event.category}
                        </span>
                        {event.rating && (
                          <div className="flex items-center bg-yellow-50 dark:bg-yellow-900 px-2 py-1 rounded-lg">
                            <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                              {event.rating}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Event Title */}
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                        {event.title}
                      </h3>
                      
                      {/* Event Description */}
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {event.description}
                      </p>

                      {/* Event Details Grid */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-50 dark:bg-blue-900 rounded-lg">
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white block">
                              {eventDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                            <span className="text-sm text-gray-500">{event.time}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-50 dark:bg-green-900 rounded-lg">
                            <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white block">
                              {typeof event.venue === 'string' ? event.venue : event.venue?.name || 'Venue TBD'}
                            </span>
                            {typeof event.venue === 'object' && event.venue?.address && (
                              <span className="text-sm text-gray-500">{event.venue.address}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-50 dark:bg-purple-900 rounded-lg">
                            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white block">
                              {event.registered || 0} attending
                            </span>
                            <span className="text-sm text-gray-500">
                              {event.capacity ? `${event.capacity} capacity` : 'Unlimited'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      {event.tags && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {event.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Price and Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {(event.price === 0 || event.price === '0') ? (
                              <span className="text-green-600">Free</span>
                            ) : (
                              <span>₹{typeof event.price === 'number' ? event.price : event.price?.amount || 'TBD'}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 text-blue-600 text-xs">
                            <Ticket className="w-3 h-3" />
                            <span>Registration Required</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {/* Share functionality */}}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                            title="Share Event"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setShowRegistration(true);
                            }}
                            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                              isExpired
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                            }`}
                            disabled={isExpired}
                          >
                            {isExpired ? 'Expired' : 'Register Now'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Registration Modal */}
      {showRegistration && selectedEventId && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              setShowRegistration(false);
              setSelectedEventId(null);
            }
          }}
        >
          <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-b from-white/95 via-white to-gray-50 dark:from-gray-900/95 dark:via-gray-900 dark:to-gray-950 shadow-xl shadow-gray-200/40 dark:shadow-black/40 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowRegistration(false);
                setSelectedEventId(null);
              }}
              className="absolute top-4 right-4 z-10 p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <EventRegistration 
              eventId={selectedEventId}
              event={events.find(e => e.id === selectedEventId)}
              onClose={() => {
                setShowRegistration(false);
                setSelectedEventId(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsCalendar;