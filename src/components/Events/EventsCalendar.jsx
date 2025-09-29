// =============================================
// src/components/Events/EventsCalendar.jsx
// Local events and calendar integration
// =============================================
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  ExternalLink,
  Bookmark,
  Share2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EventsCalendar = ({ className = '' }) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [savedEvents, setSavedEvents] = useState(new Set());

  // Mock events data
  const mockEvents = [
    {
      id: 1,
      title: 'Navratri Festival',
      description: 'Traditional Gujarati folk dance and music celebration',
      date: '2025-10-15',
      time: '19:00',
      endTime: '23:00',
      location: 'VUDA Ground, Vadodara',
      category: 'cultural',
      attendees: 5000,
      price: 'Free',
      organizer: 'Vadodara Cultural Society',
      image: '/images/events/navratri.jpg',
      rating: 4.8,
      isPopular: true
    },
    {
      id: 2,
      title: 'Tech Startup Meetup',
      description: 'Networking event for local entrepreneurs and tech enthusiasts',
      date: '2025-10-18',
      time: '18:30',
      endTime: '21:00',
      location: 'MSU Innovation Hub',
      category: 'business',
      attendees: 150,
      price: '₹500',
      organizer: 'Vadodara Startup Community',
      image: '/images/events/tech-meetup.jpg',
      rating: 4.5,
      isPopular: false
    },
    {
      id: 3,
      title: 'Food Festival',
      description: 'Taste the best of Gujarati and international cuisines',
      date: '2025-10-20',
      time: '17:00',
      endTime: '22:00',
      location: 'Sayaji Garden',
      category: 'food',
      attendees: 2500,
      price: '₹200',
      organizer: 'Vadodara Food Club',
      image: '/images/events/food-festival.jpg',
      rating: 4.7,
      isPopular: true
    },
    {
      id: 4,
      title: 'Marathon 2025',
      description: 'Annual city marathon promoting health and fitness',
      date: '2025-10-25',
      time: '06:00',
      endTime: '10:00',
      location: 'Starting from Race Course Ground',
      category: 'sports',
      attendees: 3000,
      price: '₹300',
      organizer: 'Vadodara Runners Club',
      image: '/images/events/marathon.jpg',
      rating: 4.6,
      isPopular: true
    }
  ];

  const categories = [
    { id: 'all', name: t('events.categories.all', 'All Events'), color: 'gray' },
    { id: 'cultural', name: t('events.categories.cultural', 'Cultural'), color: 'purple' },
    { id: 'business', name: t('events.categories.business', 'Business'), color: 'blue' },
    { id: 'food', name: t('events.categories.food', 'Food'), color: 'orange' },
    { id: 'sports', name: t('events.categories.sports', 'Sports'), color: 'green' },
    { id: 'education', name: t('events.categories.education', 'Education'), color: 'indigo' }
  ];

  useEffect(() => {
    setEvents(mockEvents);
  }, []);

  const filteredEvents = events.filter(event => 
    categoryFilter === 'all' || event.category === categoryFilter
  );

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateString = date.toISOString().split('T')[0];
    return filteredEvents.filter(event => event.date === dateString);
  };

  const toggleSaveEvent = (eventId) => {
    const newSavedEvents = new Set(savedEvents);
    if (newSavedEvents.has(eventId)) {
      newSavedEvents.delete(eventId);
    } else {
      newSavedEvents.add(eventId);
    }
    setSavedEvents(newSavedEvents);
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : 'gray';
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
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('events.title', 'Local Events')}
            </h3>
          </div>
          <button className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-sm">{t('events.addEvent', 'Add Event')}</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCategoryFilter(category.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === category.id
                  ? `bg-${category.color}-500 text-white`
                  : `bg-${category.color}-100 text-${category.color}-800 dark:bg-${category.color}-900 dark:text-${category.color}-200 hover:bg-${category.color}-200 dark:hover:bg-${category.color}-800`
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth(currentDate).map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isSelected = date && selectedDate && 
              date.toDateString() === selectedDate.toDateString();
            const isToday = date && date.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                onClick={() => date && setSelectedDate(date)}
                className={`min-h-[60px] p-1 border dark:border-gray-700 rounded cursor-pointer transition-colors ${
                  !date 
                    ? 'bg-gray-50 dark:bg-gray-900' 
                    : isSelected
                      ? 'bg-blue-500 text-white'
                      : isToday
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {date && (
                  <div>
                    <div className="text-sm font-medium mb-1">
                      {date.getDate()}
                    </div>
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded mb-1 bg-${getCategoryColor(event.category)}-100 text-${getCategoryColor(event.category)}-800 dark:bg-${getCategoryColor(event.category)}-900 dark:text-${getCategoryColor(event.category)}-200 truncate`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="border-t dark:border-gray-700 p-3 max-h-48 overflow-y-auto">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
            {t('events.eventsOn', 'Events on')} {selectedDate.toLocaleDateString()}
          </h4>
          
          {getEventsForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              {t('events.noEventsSelected', 'No events on this date')}
            </p>
          ) : (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map((event) => (
                <div key={event.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-semibold text-gray-900 dark:text-white">
                          {event.title}
                        </h5>
                        {event.isPopular && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {event.description}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSaveEvent(event.id)}
                      className={`p-1 rounded transition-colors ${
                        savedEvents.has(event.id)
                          ? 'text-blue-500 hover:text-blue-600'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(event.time)} - {formatTime(event.endTime)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees.toLocaleString()} attending</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{event.price}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getCategoryColor(event.category)}-100 text-${getCategoryColor(event.category)}-800 dark:bg-${getCategoryColor(event.category)}-900 dark:text-${getCategoryColor(event.category)}-200`}>
                      {categories.find(c => c.id === event.category)?.name}
                    </span>
                    <div className="flex space-x-2">
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="text-blue-500 hover:text-blue-600">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventsCalendar;