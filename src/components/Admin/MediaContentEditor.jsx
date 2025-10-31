// =============================================
// src/components/Admin/MediaContentEditor.jsx
// Edit an existing media post with translations & city targeting
// =============================================
import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { ref, update } from 'firebase/database';
import { db } from '../../firebase-config';
import { useCity } from '../../context/CityContext';
import { MEDIA_TYPE_CONFIG } from './mediaContentConfig';
import { formatFileSize } from '../../utils/mediaSchema';
import {
  ArrowDown,
  ArrowUp,
  Languages,
  MapPin,
  RefreshCw,
  Save,
  X
} from 'lucide-react';

const languageLabels = {
  gu: 'Gujarati (ગુજરાતી)',
  hi: 'Hindi (हिंदी)',
  en: 'English'
};

const cloneMediaItems = (items = []) =>
  items.map((media) => ({
    ...media,
    caption: {
      gu: media.caption?.gu || '',
      hi: media.caption?.hi || '',
      en: media.caption?.en || ''
    }
  }));

const MediaContentEditor = ({ item, onClose, onSave }) => {
  const typeConfig = MEDIA_TYPE_CONFIG[item.type];
  const { cities } = useCity();

  const [activeLanguage, setActiveLanguage] = useState('gu');
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: {
      gu: item.title?.gu || '',
      hi: item.title?.hi || '',
      en: item.title?.en || ''
    },
    content: {
      gu: item.content?.gu || '',
      hi: item.content?.hi || '',
      en: item.content?.en || ''
    },
    excerpt: item.excerpt
      ? {
          gu: item.excerpt?.gu || '',
          hi: item.excerpt?.hi || '',
          en: item.excerpt?.en || ''
        }
      : null,
    category: item.category || '',
    isBreaking: !!item.isBreaking,
    isFeatured: !!item.isFeatured
  });

  const [selectedCities, setSelectedCities] = useState(() => {
    if (Array.isArray(item.cities) && item.cities.length > 0) {
      return item.cities;
    }
    if (item.cityId) {
      return [item.cityId];
    }
    return [];
  });

  const [mediaItems, setMediaItems] = useState(() => cloneMediaItems(item.mediaContent?.items || []));

  const citySummary = useMemo(() => {
    if (selectedCities.length === 0) return 'Global';
    return selectedCities
      .map((cityId) => cities.find((city) => city.id === cityId)?.name || cityId)
      .join(', ');
  }, [selectedCities, cities]);

  const translateText = async (text, targetLang) => {
    if (!text.trim()) return '';
    try {
      const response = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=gu|${targetLang}`,
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      const translated = response.data?.responseData?.translatedText;
      return translated || text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  };

  const handleTranslate = async (fields) => {
    const tasks = fields.map(async (field) => {
      const baseText = formData[field].gu?.trim();
      if (!baseText) return null;
      const [hi, en] = await Promise.all([
        translateText(baseText, 'hi'),
        translateText(baseText, 'en')
      ]);
      return { field, hi, en };
    });

    try {
      setTranslating(true);
      const results = await Promise.all(tasks);
      setFormData((prev) => {
        const next = { ...prev };
        results.filter(Boolean).forEach(({ field, hi, en }) => {
          next[field] = {
            ...next[field],
            hi,
            en
          };
        });
        return next;
      });
    } finally {
      setTranslating(false);
    }
  };

  const updateCaption = (mediaId, language, value) => {
    setMediaItems((prev) =>
      prev.map((media) =>
        media.id === mediaId
          ? {
              ...media,
              caption: {
                ...media.caption,
                [language]: value
              }
            }
          : media
      )
    );
  };

  const moveMediaItem = (mediaId, direction) => {
    setMediaItems((prev) => {
      const index = prev.findIndex((media) => media.id === mediaId);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[targetIndex]] = [copy[targetIndex], copy[index]];
      return copy;
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const path = typeConfig?.path;
      if (!path) {
        throw new Error('Unknown media type');
      }

      const payload = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        isBreaking: formData.isBreaking,
        isFeatured: formData.isFeatured,
        mediaContent: {
          ...(item.mediaContent || {}),
          items: mediaItems
        },
        cities: selectedCities,
        cityId: selectedCities.length > 0 ? selectedCities[0] : null,
        updatedAt: new Date().toISOString()
      };

      if (formData.excerpt) {
        payload.excerpt = formData.excerpt;
      }

      await update(ref(db, `${path}/${item.id}`), payload);
      onSave?.(payload);
    } catch (error) {
      console.error('Error updating media post:', error);
      alert('Failed to update media post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-3">
              {typeConfig && (
                <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${typeConfig.accent}`}>
                  <typeConfig.icon className="w-3 h-3 mr-1" />
                  {typeConfig.label}
                </span>
              )}
              <h2 className="text-xl klimat-semibold text-gray-900 dark:text-gray-100">Edit Media Post</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cities: {citySummary}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" /> Assign Cities
            </p>
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              {cities.map((city) => (
                <label key={city.id} className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={selectedCities.includes(city.id)}
                    onChange={(event) => {
                      setSelectedCities((prev) => {
                        if (event.target.checked) {
                          return [...new Set([...prev, city.id])];
                        }
                        return prev.filter((id) => id !== city.id);
                      });
                    }}
                  />
                  <span>{city.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Selected: {citySummary}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Languages</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(languageLabels).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setActiveLanguage(code)}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    activeLanguage === code
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title ({languageLabels[activeLanguage]})
              </label>
              <input
                type="text"
                value={formData.title[activeLanguage]}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: {
                      ...prev.title,
                      [activeLanguage]: event.target.value
                    }
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content ({languageLabels[activeLanguage]})
              </label>
              <textarea
                rows={6}
                value={formData.content[activeLanguage]}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    content: {
                      ...prev.content,
                      [activeLanguage]: event.target.value
                    }
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              />
            </div>

            {formData.excerpt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Excerpt ({languageLabels[activeLanguage]})
                </label>
                <textarea
                  rows={3}
                  value={formData.excerpt[activeLanguage]}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      excerpt: {
                        ...prev.excerpt,
                        [activeLanguage]: event.target.value
                      }
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
              </div>
            )}
          </div>

          {activeLanguage === 'gu' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-700 dark:text-blue-200">Auto-translate Gujarati content to Hindi & English</p>
                {translating && <span className="text-xs text-blue-500">Translating…</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleTranslate(['title'])}
                  disabled={translating || !formData.title.gu.trim()}
                  className="px-3 py-2 text-xs rounded-md bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 disabled:opacity-50"
                >
                  Title
                </button>
                <button
                  type="button"
                  onClick={() => handleTranslate(['content'])}
                  disabled={translating || !formData.content.gu.trim()}
                  className="px-3 py-2 text-xs rounded-md bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 disabled:opacity-50"
                >
                  Content
                </button>
                {formData.excerpt && (
                  <button
                    type="button"
                    onClick={() => handleTranslate(['excerpt'])}
                    disabled={translating || !formData.excerpt.gu.trim()}
                    className="px-3 py-2 text-xs rounded-md bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 disabled:opacity-50"
                  >
                    Excerpt
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleTranslate(['title', 'content', ...(formData.excerpt ? ['excerpt'] : [])])}
                  disabled={translating}
                  className="px-3 py-2 text-xs rounded-md bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-700 disabled:opacity-50"
                >
                  Translate All
                </button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: event.target.value
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Local News"
              />
            </div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.isBreaking}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      isBreaking: event.target.checked
                    }))
                  }
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2">Breaking</span>
              </label>
              <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      isFeatured: event.target.checked
                    }))
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2">Featured</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Media Items</h3>
            {mediaItems.length === 0 ? (
              <div className="flex items-center justify-center h-40 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-500">
                No media assets found.
              </div>
            ) : (
              <div className="space-y-4">
                {mediaItems.map((media, index) => {
                  const displaySize = media.size || media.metadata?.size;
                  const mediaType = media.type || (media.url?.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image');
                  return (
                    <div
                      key={media.id || `${media.filename}-${index}`}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                            {mediaType === 'video' ? 'Video' : 'Image'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{media.filename || 'Untitled'}</span>
                          {displaySize && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(displaySize)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => moveMediaItem(media.id, 'up')}
                            disabled={index === 0}
                            className="p-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveMediaItem(media.id, 'down')}
                            disabled={index === mediaItems.length - 1}
                            className="p-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2">
                        <div className="bg-black flex items-center justify-center">
                          {mediaType === 'video' ? (
                            <video src={media.url} controls className="w-full" />
                          ) : (
                            <img src={media.url} alt={media.filename} className="w-full object-contain" />
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          {Object.entries(languageLabels).map(([lang, label]) => (
                            <div key={lang}>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Caption ({label})
                              </label>
                              <input
                                type="text"
                                value={media.caption?.[lang] || ''}
                                onChange={(event) => updateCaption(media.id, lang, event.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaContentEditor;
