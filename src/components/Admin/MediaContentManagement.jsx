// =============================================
// src/components/Admin/MediaContentManagement.jsx
// Management interface for stories, reels, and carousel media posts
// =============================================
import React, { useEffect, useMemo, useState } from 'react';
import { ref, remove } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase-config';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { useCity } from '../../context/CityContext';
import {
  AlertCircle,
  AlertTriangle,
  Eye,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Play,
  Search,
  Trash2
} from 'lucide-react';
import MediaContentEditor from './MediaContentEditor';
import { MEDIA_TYPE_CONFIG } from './mediaContentConfig';
import { MEDIA_DATABASE_PATHS } from '../../utils/mediaSchema';

const getTextContent = (content) => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'object') {
    return content.gu || content.hi || content.en || Object.values(content)[0] || '';
  }
  return '';
};

const getPrimaryMediaItem = (item) => {
  if (!item?.mediaContent?.items || item.mediaContent.items.length === 0) {
    return null;
  }
  return item.mediaContent.items[0];
};

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

const MediaContentManagement = () => {
  const { cities } = useCity();
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewItem, setPreviewItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const {
    data: storiesData,
    isLoading: storiesLoading,
    error: storiesError
  } = useRealtimeData(MEDIA_DATABASE_PATHS.STORIES, {
    scope: 'global',
    fallbackToGlobal: false
  });
  const {
    data: reelsData,
    isLoading: reelsLoading,
    error: reelsError
  } = useRealtimeData(MEDIA_DATABASE_PATHS.REELS, {
    scope: 'global',
    fallbackToGlobal: false
  });
  const {
    data: carouselsData,
    isLoading: carouselsLoading,
    error: carouselsError
  } = useRealtimeData(MEDIA_DATABASE_PATHS.CAROUSELS, {
    scope: 'global',
    fallbackToGlobal: false
  });

  useEffect(() => {
    if (cities.length > 0 && selectedCity === '') {
      setSelectedCity('all');
    }
  }, [cities, selectedCity]);

  const mediaItems = useMemo(() => {
    const items = [];

    if (storiesData) {
      Object.entries(storiesData).forEach(([id, value]) => {
        items.push({
          id,
          type: 'story',
          ...value,
          createdAt: value.createdAt || value.publishedAt || value.timestamp
        });
      });
    }

    if (reelsData) {
      Object.entries(reelsData).forEach(([id, value]) => {
        items.push({
          id,
          type: 'reel',
          ...value,
          createdAt: value.createdAt || value.publishedAt || value.timestamp
        });
      });
    }

    if (carouselsData) {
      Object.entries(carouselsData).forEach(([id, value]) => {
        items.push({
          id,
          type: 'carousel',
          ...value,
          createdAt: value.createdAt || value.publishedAt || value.timestamp
        });
      });
    }

    items.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return items;
  }, [storiesData, reelsData, carouselsData]);

  const filteredItems = useMemo(() => {
    return mediaItems.filter((item) => {
      const matchesType = selectedType === 'all' || item.type === selectedType;

      const cityList = Array.isArray(item.cities) && item.cities.length > 0
        ? item.cities
        : item.cityId
          ? [item.cityId]
          : [];
      const matchesCity = selectedCity === 'all' || cityList.includes(selectedCity);

      const titleText = getTextContent(item.title);
      const contentText = getTextContent(item.content);
      const matchesSearch = !searchTerm ||
        titleText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contentText.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesType && matchesCity && matchesSearch;
    });
  }, [mediaItems, selectedType, selectedCity, searchTerm]);

  const loading = storiesLoading || reelsLoading || carouselsLoading;
  const hasError = storiesError || reelsError || carouselsError;

  const resolveCityName = (cityId) => {
    return cities.find((city) => city.id === cityId)?.name || cityId;
  };

  const handleDelete = async (item) => {
    if (!item || deletingId) return;

    const typeConfig = MEDIA_TYPE_CONFIG[item.type];
    if (!typeConfig) return;

    const confirmDelete = window.confirm(
      `Delete this ${typeConfig.label.toLowerCase()}? This cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeletingId(item.id);

    try {
      const mediaEntries = Array.isArray(item.mediaContent?.items)
        ? item.mediaContent.items
        : [];

      const deletionTasks = mediaEntries
        .filter((media) => media?.metadata?.storageRef)
        .map((media) => {
          const fileRef = storageRef(storage, media.metadata.storageRef);
          return deleteObject(fileRef).catch((error) => {
            console.warn('Error deleting media asset:', error);
          });
        });

      if (deletionTasks.length > 0) {
        await Promise.allSettled(deletionTasks);
      }

      await remove(ref(db, `${typeConfig.path}/${item.id}`));
      alert(`${typeConfig.label} deleted successfully`);
    } catch (error) {
      console.error('Error deleting media post:', error);
      alert('Failed to delete media post. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderTypeBadge = (item) => {
    const config = MEDIA_TYPE_CONFIG[item.type];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${config.accent}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Media Content Manager</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review, filter, and manage stories, reels, and carousel posts created via the media creator.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Media Type</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                selectedType === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              All
            </button>
            {Object.entries(MEDIA_TYPE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    selectedType === key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            <MapPin className="inline w-4 h-4 mr-1" /> Filter by City
          </p>
          <select
            value={selectedCity}
            onChange={(event) => setSelectedCity(event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Cities</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Search</p>
          <div className="relative">
            <Search className="absolute top-2.5 left-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search title or content"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {hasError && (
        <div className="flex items-start space-x-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Unable to load some media collections.</p>
            <p className="text-sm">Please verify your Firebase permissions and try again.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No media posts found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Adjust your filters or create a new media post using the "Create Media Post" action.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const primaryMedia = getPrimaryMediaItem(item);
            const isDeleting = deletingId === item.id;
            const cityTags = Array.isArray(item.cities) && item.cities.length > 0
              ? item.cities
              : item.cityId
                ? [item.cityId]
                : [];

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {primaryMedia ? (
                      primaryMedia.type === 'image' ? (
                        <img
                          src={primaryMedia.url || primaryMedia.previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center bg-gray-900/80 text-white">
                          <Play className="w-8 h-8" />
                        </div>
                      )
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {renderTypeBadge(item)}
                      {item.isFeatured && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                          Featured
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {getTextContent(item.title) || 'Untitled media post'}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {getTextContent(item.content) || 'No description provided'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {cityTags.length > 0 ? (
                        cityTags.map((cityId) => (
                          <span
                            key={cityId}
                            className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            {resolveCityName(cityId)}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                          Global
                        </span>
                      )}

                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {formatDate(item.createdAt)}
                      </span>

                      {item.expiresAt && (
                        <span className="text-xs text-red-500">
                          Expires: {formatDate(item.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <button
                    onClick={() => {
                      setPreviewItem(null);
                      setEditingItem(item);
                    }}
                    className="inline-flex items-center px-3 py-2 text-sm rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="inline-flex items-center px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={isDeleting}
                    className="inline-flex items-center px-3 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  {renderTypeBadge(previewItem)}
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {getTextContent(previewItem.title) || 'Untitled media post'}
                  </h2>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Created {formatDate(previewItem.createdAt)}
                </div>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid lg:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Content
                  </h3>
                  {['gu', 'hi', 'en'].map((lang) => (
                    <div key={lang} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {lang === 'gu' && 'Gujarati'}
                        {lang === 'hi' && 'Hindi'}
                        {lang === 'en' && 'English'}
                      </p>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {previewItem.title?.[lang] || '—'}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {previewItem.content?.[lang] || '—'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Media
                  </h3>
                  <div className="space-y-4">
                    {Array.isArray(previewItem.mediaContent?.items) && previewItem.mediaContent.items.length > 0 ? (
                      previewItem.mediaContent.items.map((media) => (
                        <div key={media.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          {media.type === 'image' ? (
                            <img src={media.url} alt={media.filename} className="w-full" />
                          ) : (
                            <video src={media.url} controls className="w-full" />
                          )}
                          {(media.caption?.gu || media.caption?.hi || media.caption?.en) && (
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                              <p className="font-medium">Caption</p>
                              <p>{media.caption?.gu || media.caption?.hi || media.caption?.en}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-48 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-500">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        No media assets attached
                      </div>
                    )}
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 space-y-2 text-sm">
                    <p><span className="font-medium">Category:</span> {previewItem.category || '—'}</p>
                    <p><span className="font-medium">Flags:</span> {[
                      previewItem.isBreaking ? 'Breaking' : null,
                      previewItem.isFeatured ? 'Featured' : null
                    ].filter(Boolean).join(', ') || 'None'}</p>
                    <p><span className="font-medium">City Scope:</span> {
                      Array.isArray(previewItem.cities) && previewItem.cities.length > 0
                        ? previewItem.cities.map(resolveCityName).join(', ')
                        : previewItem.cityId
                          ? resolveCityName(previewItem.cityId)
                          : 'Global'
                    }</p>
                    {previewItem.expiresAt && (
                      <p><span className="font-medium">Expires At:</span> {formatDate(previewItem.expiresAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <MediaContentEditor
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={() => {
            setEditingItem(null);
            alert('Media post updated successfully');
          }}
        />
      )}
    </div>
  );
};

export default MediaContentManagement;
