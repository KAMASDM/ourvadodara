// =============================================
// src/components/Maps/NewsMap.jsx
// Interactive map showing news locations
// =============================================
import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Layers, 
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation2,
  AlertCircle,
  Calendar,
  Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NewsMap = ({ className = '' }) => {
  const { t } = useTranslation();
  const [mapCenter, setMapCenter] = useState({ lat: 22.3072, lng: 73.1812 }); // Vadodara coordinates
  const [zoomLevel, setZoomLevel] = useState(12);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [newsMarkers, setNewsMarkers] = useState([]);

  // Mock news locations data
  const mockNewsLocations = [
    {
      id: 1,
      title: 'Traffic Jam on NH-8',
      description: 'Heavy traffic reported near Koyali junction due to road construction',
      lat: 22.2587,
      lng: 73.1567,
      type: 'traffic',
      category: 'alert',
      timestamp: '2025-09-28T14:30:00Z',
      intensity: 'high',
      affectedUsers: 5000
    },
    {
      id: 2,
      title: 'Festival Celebration at VUDA Ground',
      description: 'Navratri preparations begin with cultural programs',
      lat: 22.3178,
      lng: 73.1896,
      type: 'event',
      category: 'culture',
      timestamp: '2025-09-28T18:00:00Z',
      intensity: 'medium',
      affectedUsers: 2500
    },
    {
      id: 3,
      title: 'New Metro Station Opening',
      description: 'Vadodara Metro Phase 2 inaugurates eastern corridor',
      lat: 22.3344,
      lng: 73.2089,
      type: 'development',
      category: 'infrastructure',
      timestamp: '2025-09-28T10:00:00Z',
      intensity: 'low',
      affectedUsers: 1000
    },
    {
      id: 4,
      title: 'Hospital Emergency Services',
      description: 'New emergency wing opened at Sayaji Hospital',
      lat: 22.2969,
      lng: 73.2081,
      type: 'healthcare',
      category: 'health',
      timestamp: '2025-09-28T09:00:00Z',
      intensity: 'medium',
      affectedUsers: 8000
    },
    {
      id: 5,
      title: 'Local Market Fire Incident',
      description: 'Small fire at Mandvi market, no casualties reported',
      lat: 22.3126,
      lng: 73.1734,
      type: 'emergency',
      category: 'alert',
      timestamp: '2025-09-28T16:15:00Z',
      intensity: 'high',
      affectedUsers: 500
    }
  ];

  const filterTypes = [
    { id: 'all', name: t('map.filters.all', 'All News'), color: 'gray' },
    { id: 'traffic', name: t('map.filters.traffic', 'Traffic'), color: 'red' },
    { id: 'event', name: t('map.filters.events', 'Events'), color: 'purple' },
    { id: 'development', name: t('map.filters.development', 'Development'), color: 'blue' },
    { id: 'healthcare', name: t('map.filters.healthcare', 'Healthcare'), color: 'green' },
    { id: 'emergency', name: t('map.filters.emergency', 'Emergency'), color: 'orange' }
  ];

  useEffect(() => {
    setNewsMarkers(mockNewsLocations);
  }, []);

  const filteredMarkers = newsMarkers.filter(marker => 
    filterType === 'all' || marker.type === filterType
  );

  const getMarkerColor = (type, intensity) => {
    const colors = {
      traffic: intensity === 'high' ? 'bg-red-500' : 'bg-red-400',
      event: intensity === 'high' ? 'bg-purple-500' : 'bg-purple-400',
      development: intensity === 'high' ? 'bg-blue-500' : 'bg-blue-400',
      healthcare: intensity === 'high' ? 'bg-green-500' : 'bg-green-400',
      emergency: intensity === 'high' ? 'bg-orange-500' : 'bg-orange-400'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'traffic': return '🚗';
      case 'event': return '🎉';
      case 'development': return '🏗️';
      case 'healthcare': return '🏥';
      case 'emergency': return '🚨';
      default: return '📍';
    }
  };

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    setMapCenter({ lat: marker.lat, lng: marker.lng });
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 18));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 8));
  };

  const centerOnVadodara = () => {
    setMapCenter({ lat: 22.3072, lng: 73.1812 });
    setZoomLevel(12);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('map.title', 'News Map')}
            </h3>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">{t('map.filters.title', 'Filters')}</span>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            {filterTypes.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterType === filter.id
                    ? `bg-${filter.color}-500 text-white`
                    : `bg-${filter.color}-100 text-${filter.color}-800 dark:bg-${filter.color}-900 dark:text-${filter.color}-200 hover:bg-${filter.color}-200 dark:hover:bg-${filter.color}-800`
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
            {/* Map Container */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-600">
        {/* Map Background (Simulated) */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900">
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }} />
          
          {/* City Label */}
          <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Vadodara, Gujarat
            </span>
          </div>
        </div>

        {/* News Markers */}
        {filteredMarkers.map((marker) => (
          <div
            key={marker.id}
            onClick={() => handleMarkerClick(marker)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group`}
            style={{
              left: `${((marker.lng - 73.1) * 400) + 200}px`,
              top: `${((22.4 - marker.lat) * 300) + 100}px`
            }}
          >
            {/* Marker */}
            <div className={`w-8 h-8 ${getMarkerColor(marker.type, marker.intensity)} rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <span className="text-sm">{getMarkerIcon(marker.type)}</span>
            </div>
            
            {/* Pulse Animation for High Intensity */}
            {marker.intensity === 'high' && (
              <div className={`absolute inset-0 ${getMarkerColor(marker.type, marker.intensity)} rounded-full animate-ping opacity-75`} />
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                {marker.title}
              </div>
            </div>
          </div>
        ))}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={zoomIn}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={centerOnVadodara}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Navigation2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Zoom Level Indicator */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400">
          Zoom: {zoomLevel}
        </div>
      </div>

      {/* Selected Marker Details */}
      {selectedMarker && (
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 ${getMarkerColor(selectedMarker.type, selectedMarker.intensity)} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
              <span className="text-lg">{getMarkerIcon(selectedMarker.type)}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {selectedMarker.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {selectedMarker.description}
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(selectedMarker.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{selectedMarker.affectedUsers.toLocaleString()} affected</span>
                </div>
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span className="capitalize">{selectedMarker.intensity} priority</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-4 border-t dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {t('map.legend', 'Map Legend')}
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {filterTypes.slice(1).map((type) => (
            <div key={type.id} className="flex items-center space-x-2">
              <div className={`w-3 h-3 bg-${type.color}-500 rounded-full`} />
              <span className="text-gray-600 dark:text-gray-400">{type.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsMap;