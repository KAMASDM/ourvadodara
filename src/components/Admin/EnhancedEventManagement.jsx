// =============================================
// src/components/Admin/EnhancedEventManagement.jsx
// Comprehensive Event Management System (BookMyShow style)
// =============================================
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Ticket, 
  QrCode,
  Eye,
  Edit3,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  Star,
  DollarSign,
  Image,
  Video,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  UserCheck,
  Mail,
  Phone,
  ExternalLink,
  X,
  Play,
  Camera,
  Link,
  Tag,
  Minus
} from 'lucide-react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase-config';
import { adminStyles } from './adminStyles';

const EnhancedEventManagement = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events'); // events, registrations, analytics, checkin
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'entertainment',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    venue: {
      name: '',
      address: '',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '',
      latitude: '',
      longitude: '',
      googleMapsUrl: '',
      capacity: 100,
      facilities: []
    },
    ticketTypes: [{
      id: 1,
      name: 'General',
      price: 0,
      totalSeats: 100,
      availableSeats: 100,
      benefits: []
    }],
    organizer: {
      name: user?.displayName || '',
      email: user?.email || '',
      phone: '',
      website: ''
    },
    media: {
      images: [],
      videos: [],
      thumbnail: ''
    },
    amenities: [],
    ageRestriction: 'all',
    status: 'draft', // draft, published, cancelled
    registrationRequired: true,
    multipleQRScansAllowed: false,
    maxCapacity: 100,
    tags: [],
    socialLinks: {},
    refundPolicy: 'strict',
    terms: '',
    isApproved: false,
    promoCodes: []
  });

  // Promo code form state
  const [promoCodeForm, setPromoCodeForm] = useState({
    code: '',
    type: 'percentage', // percentage or fixed
    value: 0,
    maxUses: 0, // 0 = unlimited
    usedCount: 0,
    expiresAt: '',
    active: true,
    description: ''
  });

  // Event categories
  const categories = [
    { id: 'entertainment', name: 'Entertainment', icon: '🎭', color: 'bg-purple-100 text-purple-800' },
    { id: 'music', name: 'Music & Concerts', icon: '🎵', color: 'bg-pink-100 text-pink-800' },
    { id: 'sports', name: 'Sports & Fitness', icon: '⚽', color: 'bg-green-100 text-green-800' },
    { id: 'business', name: 'Business & Professional', icon: '💼', color: 'bg-blue-100 text-blue-800' },
    { id: 'education', name: 'Education & Learning', icon: '📚', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'cultural', name: 'Cultural & Arts', icon: '🎨', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'food', name: 'Food & Drink', icon: '🍽️', color: 'bg-orange-100 text-orange-800' },
    { id: 'health', name: 'Health & Wellness', icon: '🏥', color: 'bg-teal-100 text-teal-800' },
    { id: 'technology', name: 'Technology', icon: '💻', color: 'bg-gray-100 text-gray-800' },
    { id: 'community', name: 'Community', icon: '👥', color: 'bg-red-100 text-red-800' }
  ];

  // Amenities options
  const amenitiesOptions = [
    'Parking Available', 'Food & Beverages', 'Air Conditioning', 'WiFi', 
    'Wheelchair Accessible', 'Photography Allowed', 'Video Recording Allowed',
    'Outside Food Allowed', 'Age Appropriate', 'Security Check'
  ];

  useEffect(() => {
    const eventsRef = ref(db, 'events');
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const eventsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setEvents(eventsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } else {
        setEvents([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEventForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEventForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addTicketType = () => {
    const newTicketType = {
      id: Date.now(),
      name: '',
      price: 0,
      totalSeats: 0,
      availableSeats: 0,
      benefits: []
    };
    setEventForm(prev => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, newTicketType]
    }));
  };

  const removeTicketType = (ticketId) => {
    setEventForm(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.filter(ticket => ticket.id !== ticketId)
    }));
  };

  const updateTicketType = (ticketId, field, value) => {
    setEventForm(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.map(ticket => 
        ticket.id === ticketId ? { ...ticket, [field]: value } : ticket
      )
    }));
  };

  // Promo code management functions
  const addPromoCode = () => {
    if (!promoCodeForm.code.trim()) {
      alert('Please enter a promo code');
      return;
    }
    
    const newPromoCode = {
      id: Date.now(),
      ...promoCodeForm,
      code: promoCodeForm.code.toUpperCase(),
      createdAt: new Date().toISOString()
    };
    
    setEventForm(prev => ({
      ...prev,
      promoCodes: [...prev.promoCodes, newPromoCode]
    }));
    
    // Reset form
    setPromoCodeForm({
      code: '',
      type: 'percentage',
      value: 0,
      maxUses: 0,
      usedCount: 0,
      expiresAt: '',
      active: true,
      description: ''
    });
  };

  const removePromoCode = (promoId) => {
    setEventForm(prev => ({
      ...prev,
      promoCodes: prev.promoCodes.filter(promo => promo.id !== promoId)
    }));
  };

  const updatePromoCode = (promoId, field, value) => {
    setEventForm(prev => ({
      ...prev,
      promoCodes: prev.promoCodes.map(promo => 
        promo.id === promoId 
          ? { ...promo, [field]: value }
          : promo
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventData = {
        ...eventForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid,
        registrations: {},
        checkedInUsers: {},
        analytics: {
          views: 0,
          registrations: 0,
          checkins: 0,
          revenue: 0
        }
      };

      let eventId;
      if (editingEvent) {
        eventId = editingEvent.id;
        await update(ref(db, `events/${eventId}`), {
          ...eventData,
          updatedAt: new Date().toISOString()
        });
      } else {
        const eventRef = await push(ref(db, 'events'), eventData);
        eventId = eventRef.key;
      }

      // Save promo codes in the structure expected by frontend
      if (eventForm.promoCodes && eventForm.promoCodes.length > 0) {
        const promoCodesData = {};
        eventForm.promoCodes.forEach(promo => {
          promoCodesData[promo.code] = {
            type: promo.type,
            value: promo.value,
            maxUses: promo.maxUses,
            usedCount: promo.usedCount,
            expiresAt: promo.expiresAt,
            active: promo.active,
            description: promo.description,
            createdAt: promo.createdAt
          };
        });
        
        await update(ref(db, `events/${eventId}/promoCodes`), promoCodesData);
      }

      resetForm();
      setShowCreateForm(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      category: 'entertainment',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      venue: {
        name: '',
        address: '',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '',
        latitude: '',
        longitude: '',
        googleMapsUrl: '',
        capacity: 100,
        facilities: []
      },
      ticketTypes: [{
        id: 1,
        name: 'General',
        price: 0,
        totalSeats: 100,
        availableSeats: 100,
        benefits: []
      }],
      organizer: {
        name: user?.displayName || '',
        email: user?.email || '',
        phone: '',
        website: ''
      },
      media: {
        images: [],
        videos: [],
        thumbnail: ''
      },
      amenities: [],
      ageRestriction: 'all',
      status: 'draft',
      registrationRequired: true,
      multipleQRScansAllowed: false,
      maxCapacity: 100,
      tags: [],
      socialLinks: {},
      refundPolicy: 'strict',
      terms: '',
      isApproved: false,
      promoCodes: []
    });

    setPromoCodeForm({
      code: '',
      type: 'percentage',
      value: 0,
      maxUses: 0,
      usedCount: 0,
      expiresAt: '',
      active: true,
      description: ''
    });
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    
    // Convert promo codes from Firebase structure to form structure
    let promoCodes = [];
    if (event.promoCodes) {
      promoCodes = Object.entries(event.promoCodes).map(([code, data]) => ({
        id: Date.now() + Math.random(), // Generate unique ID for form
        code: code,
        ...data
      }));
    }
    
    setEventForm({
      ...event,
      promoCodes: promoCodes
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await remove(ref(db, `events/${eventId}`));
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const generateScannerURL = (event) => {
    // Generate a clean event name for URL
    const eventSlug = event.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    
    const baseUrl = window.location.origin;
    const scannerUrl = `${baseUrl}/${eventSlug}/scanqr`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(scannerUrl).then(() => {
      alert(`QR Scanner URL copied to clipboard!\n\n${scannerUrl}\n\nShare this URL with event staff for easy QR code scanning.`);
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      prompt('Copy this QR Scanner URL and share it with event staff:', scannerUrl);
    });
  };

  const generateQRCode = (eventId, userId) => {
    // Generate QR code data for check-in
    const qrData = {
      eventId,
      userId,
      timestamp: Date.now(),
      type: 'checkin'
    };
    return btoa(JSON.stringify(qrData));
  };

  const uploadFile = async (file, type) => {
    try {
      setUploadingMedia(true);
      const timestamp = Date.now();
      const fileName = `events/${user.uid}/${timestamp}_${file.name}`;
      const fileRef = storageRef(storage, fileName);
      
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        name: file.name,
        type: type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadPromises = files.map(file => uploadFile(file, 'image'));
      const uploadedImages = await Promise.all(uploadPromises);
      
      setEventForm(prev => ({
        ...prev,
        media: {
          ...prev.media,
          images: [...prev.media.images, ...uploadedImages],
          thumbnail: prev.media.thumbnail || uploadedImages[0]?.url
        }
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadPromises = files.map(file => uploadFile(file, 'video'));
      const uploadedVideos = await Promise.all(uploadPromises);
      
      setEventForm(prev => ({
        ...prev,
        media: {
          ...prev.media,
          videos: [...prev.media.videos, ...uploadedVideos]
        }
      }));
    } catch (error) {
      console.error('Error uploading videos:', error);
    }
  };

  const removeMedia = (mediaUrl, type) => {
    setEventForm(prev => ({
      ...prev,
      media: {
        ...prev.media,
        [type]: prev.media[type].filter(item => item.url !== mediaUrl),
        thumbnail: prev.media.thumbnail === mediaUrl ? '' : prev.media.thumbnail
      }
    }));
  };

  const setThumbnail = (imageUrl) => {
    setEventForm(prev => ({
      ...prev,
      media: {
        ...prev.media,
        thumbnail: imageUrl
      }
    }));
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const renderEventForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={() => {
              setShowCreateForm(false);
              setEditingEvent(null);
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={eventForm.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description *
              </label>
              <textarea
                value={eventForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Describe your event in detail"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Category *
              </label>
              <select
                value={eventForm.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Max Capacity *
              </label>
              <input
                type="number"
                value={eventForm.maxCapacity}
                onChange={(e) => handleInputChange('maxCapacity', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                min="1"
                required
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={eventForm.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={eventForm.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={eventForm.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={eventForm.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Venue Information */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Venue Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  value={eventForm.venue.name}
                  onChange={(e) => handleInputChange('venue.name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Enter venue name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Venue Capacity
                </label>
                <input
                  type="number"
                  value={eventForm.venue.capacity}
                  onChange={(e) => handleInputChange('venue.capacity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Enter venue capacity"
                  min="1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Address *
                </label>
                <textarea
                  value={eventForm.venue.address}
                  onChange={(e) => handleInputChange('venue.address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Enter complete venue address"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={eventForm.venue.city}
                  onChange={(e) => handleInputChange('venue.city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  value={eventForm.venue.pincode}
                  onChange={(e) => handleInputChange('venue.pincode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Enter pincode"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Google Maps URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={eventForm.venue.googleMapsUrl}
                    onChange={(e) => handleInputChange('venue.googleMapsUrl', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="https://maps.google.com/..."
                  />
                  {eventForm.venue.googleMapsUrl && (
                    <a
                      href={eventForm.venue.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Copy the Google Maps link of your venue location for easy navigation
                </p>
              </div>
            </div>

            {/* Venue Facilities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Facilities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Parking', 'AC/Heating', 'WiFi', 'Food Court', 'Restrooms', 'Wheelchair Access', 'Sound System', 'Projection'].map(facility => (
                  <label key={facility} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={eventForm.venue.facilities.includes(facility)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('venue.facilities', [...eventForm.venue.facilities, facility]);
                        } else {
                          handleInputChange('venue.facilities', eventForm.venue.facilities.filter(f => f !== facility));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{facility}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket Types */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ticket Types</h3>
              <button
                type="button"
                onClick={addTicketType}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Ticket Type
              </button>
            </div>

            {eventForm.ticketTypes.map((ticket, index) => (
              <div key={ticket.id} className="border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Ticket Type {index + 1}</h4>
                  {eventForm.ticketTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketType(ticket.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ticket Name *
                    </label>
                    <input
                      type="text"
                      value={ticket.name}
                      onChange={(e) => updateTicketType(ticket.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., General, VIP, Premium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={ticket.price}
                      onChange={(e) => updateTicketType(ticket.id, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Seats *
                    </label>
                    <input
                      type="number"
                      value={ticket.totalSeats}
                      onChange={(e) => {
                        const seats = parseInt(e.target.value) || 0;
                        updateTicketType(ticket.id, 'totalSeats', seats);
                        updateTicketType(ticket.id, 'availableSeats', seats);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Promo Codes */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-green-600" />
                Promo Codes
              </h3>
            </div>

            {/* Add New Promo Code Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Add New Promo Code</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    value={promoCodeForm.code}
                    onChange={(e) => setPromoCodeForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., SAVE20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={promoCodeForm.type}
                    onChange={(e) => setPromoCodeForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={promoCodeForm.value}
                    onChange={(e) => setPromoCodeForm(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={promoCodeForm.type === 'percentage' ? '20' : '100'}
                    min="0"
                    max={promoCodeForm.type === 'percentage' ? '100' : undefined}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Uses (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    value={promoCodeForm.maxUses}
                    onChange={(e) => setPromoCodeForm(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={promoCodeForm.expiresAt}
                    onChange={(e) => setPromoCodeForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={promoCodeForm.description}
                    onChange={(e) => setPromoCodeForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Early Bird Discount"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={addPromoCode}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Promo Code
              </button>
            </div>

            {/* Existing Promo Codes */}
            {eventForm.promoCodes.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Active Promo Codes</h4>
                <div className="space-y-3">
                  {eventForm.promoCodes.map((promo) => (
                    <div key={promo.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <span className="font-mono text-lg font-bold text-blue-600">
                              {promo.code}
                            </span>
                            <span className="text-green-600 font-semibold">
                              {promo.type === 'percentage' ? `${promo.value}% OFF` : `₹${promo.value} OFF`}
                            </span>
                            <span className="text-sm text-gray-500">
                              {promo.maxUses > 0 ? `${promo.usedCount}/${promo.maxUses} uses` : 'Unlimited uses'}
                            </span>
                            {promo.expiresAt && (
                              <span className="text-sm text-gray-500">
                                Expires: {new Date(promo.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {promo.description && (
                            <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => updatePromoCode(promo.id, 'active', !promo.active)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              promo.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {promo.active ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removePromoCode(promo.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Event Media */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2 text-purple-600" />
              Event Media
            </h3>
            
            {/* Image Upload */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Event Images
                </label>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm flex items-center disabled:opacity-50"
                >
                  <Image className="w-4 h-4 mr-1" />
                  {uploadingMedia ? 'Uploading...' : 'Add Images'}
                </button>
              </div>
              
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {eventForm.media.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {eventForm.media.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Event ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setThumbnail(image.url)}
                            className="bg-green-600 text-white p-1 rounded"
                            title="Set as thumbnail"
                          >
                            <Star className={`w-4 h-4 ${eventForm.media.thumbnail === image.url ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMedia(image.url, 'images')}
                            className="bg-red-600 text-white p-1 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Upload */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Event Videos
                </label>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 text-sm flex items-center disabled:opacity-50"
                >
                  <Video className="w-4 h-4 mr-1" />
                  {uploadingMedia ? 'Uploading...' : 'Add Videos'}
                </button>
              </div>
              
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoUpload}
                className="hidden"
              />

              {eventForm.media.videos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {eventForm.media.videos.map((video, index) => (
                    <div key={index} className="relative group">
                      <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center relative">
                        <Play className="w-8 h-8 text-gray-600" />
                        <span className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-75 px-1 rounded">
                          {video.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia(video.url, 'videos')}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Images: JPG, PNG, WebP (Max 5MB each) • Videos: MP4, WebM (Max 50MB each)
            </p>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Amenities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {amenitiesOptions.map(amenity => (
                <label key={amenity} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={eventForm.amenities.includes(amenity)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange('amenities', [...eventForm.amenities, amenity]);
                      } else {
                        handleInputChange('amenities', eventForm.amenities.filter(a => a !== amenity));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={eventForm.registrationRequired}
                  onChange={(e) => handleInputChange('registrationRequired', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Registration Required</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={eventForm.multipleQRScansAllowed}
                  onChange={(e) => handleInputChange('multipleQRScansAllowed', e.target.checked)}
                  className="mr-2"
                />
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700">Multiple QR Scans Allowed</span>
                  <span className="text-xs text-gray-500">Allow participants to enter/exit multiple times with the same QR code</span>
                </div>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingEvent(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  const renderEventCard = (event) => {
    const category = categories.find(c => c.id === event.category);
    const totalRegistrations = Object.keys(event.registrations || {}).length;
    const totalRevenue = event.analytics?.revenue || 0;

    return (
      <div key={event.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${category?.color || 'bg-gray-100 text-gray-800'}`}>
                  {category?.icon} {category?.name}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  event.status === 'published' ? 'bg-green-100 text-green-800' :
                  event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {event.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => generateScannerURL(event)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                title="Get QR Scanner URL"
              >
                <Link className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEdit(event)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Edit Event"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(event.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Delete Event"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              {event.startDate} {event.startTime && `at ${event.startTime}`}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              {event.venue?.name}, {event.venue?.city}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              {totalRegistrations} / {event.maxCapacity} registered
            </div>
            {totalRevenue > 0 && (
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="w-4 h-4 mr-2" />
                ₹{totalRevenue.toLocaleString()} revenue
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {event.ticketTypes && event.ticketTypes.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-500">From: </span>
                  <span className="font-semibold text-gray-900">
                    ₹{Math.min(...event.ticketTypes.map(t => t.price))}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setActiveTab('registrations');
                  // Set selected event for viewing registrations
                }}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Registrations
              </button>
              <button
                onClick={() => {
                  setActiveTab('checkin');
                  // Set selected event for check-in
                }}
                className="text-sm text-green-600 hover:text-green-800 flex items-center"
              >
                <QrCode className="w-4 h-4 mr-1" />
                Check-in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
          <p className="text-gray-600">Create and manage events with comprehensive features</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Event
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'events', name: 'Events', icon: Calendar },
            { id: 'registrations', name: 'Registrations', icon: UserCheck },
            { id: 'checkin', name: 'Check-in Scanner', icon: QrCode },
            { id: 'analytics', name: 'Analytics', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'events' && (
        <div>
          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 mb-4">Create your first event to get started</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredEvents.map(renderEventCard)}
            </div>
          )}
        </div>
      )}

      {/* Other tab content would go here */}
      {activeTab === 'registrations' && (
        <div className="text-center py-12">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Event Registrations</h3>
          <p className="text-gray-500">View and manage event registrations</p>
        </div>
      )}

      {activeTab === 'checkin' && (
        <div className="text-center py-12">
          <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">QR Code Check-in</h3>
          <p className="text-gray-500">Scan attendee QR codes for event check-in</p>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Event Analytics</h3>
          <p className="text-gray-500">View detailed analytics and insights</p>
        </div>
      )}

      {/* Event Form Modal */}
      {showCreateForm && renderEventForm()}
    </div>
  );
};

export default EnhancedEventManagement;