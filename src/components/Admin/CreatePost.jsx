// =============================================
// src/components/Admin/CreatePost.jsx
// Desktop-Optimized Post Creation Interface
// Now with Multi-City Support
// =============================================
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useCity } from '../../context/CityContext';
import { ref, push } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase-config';
import { 
  Save, 
  Eye, 
  Image, 
  Video, 
  Link, 
  Calendar, 
  Tag, 
  MapPin, 
  Clock,
  Send,
  X,
  Plus,
  AlertCircle,
  Languages,
  FileText,
  RefreshCw,
  Check
} from 'lucide-react';
import { categories } from '../../data/categories';
import axios from 'axios';

const MAX_VISIBLE_CITY_PILLS = 12;
const CITY_VALIDATION_MESSAGE = 'Please select at least one city | ઓછામાં ઓછું એક શહેર પસંદ કરો';

const CreatePost = () => {
  const { user } = useAuth();
  const { cities, currentCity } = useCity(); // Use dynamic cities from Firebase
  const [selectedCities, setSelectedCities] = useState([]); // Changed to multi-select
  const [citiesTouched, setCitiesTouched] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  
  // Keep selected cities in sync with available cities and current city preference
  useEffect(() => {
    if (!cities || cities.length === 0) return;

    setSelectedCities(prev => {
      const availableIds = new Set(cities.map(city => city.id));
      const filtered = prev.filter(id => availableIds.has(id));

      if (filtered.length > 0) {
        return filtered.length === prev.length ? prev : filtered;
      }

      const fallbackId = (currentCity && availableIds.has(currentCity.id))
        ? currentCity.id
        : cities[0]?.id;

      return fallbackId ? [fallbackId] : [];
    });
  }, [cities, currentCity]);
  
  // Language labels for the multi-language interface
  const languageLabels = {
    en: 'English',
    hi: 'हिंदी',
    gu: 'ગુજરાતી'
  };
  
  const [formData, setFormData] = useState({
    title: { en: '', hi: '', gu: '' },
    content: { en: '', hi: '', gu: '' },
    excerpt: { en: '', hi: '', gu: '' },
    category: '',
    subcategory: '',
    tags: [],
    location: '',
    media: [],
    externalLink: '',
    isBreaking: false,
    isUrgent: false,
    isFeatured: false,
    publishDate: '',
    scheduledTime: ''
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [preview, setPreview] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const [activeLanguage, setActiveLanguage] = useState('en');
  const multipleImageInputRef = useRef(null);

  const availableCities = useMemo(() => cities || [], [cities]);
  const cityIdSet = useMemo(() => new Set(availableCities.map(city => city.id)), [availableCities]);
  const validSelectedCities = useMemo(
    () => selectedCities.filter(id => cityIdSet.has(id)),
    [selectedCities, cityIdSet]
  );
  const selectedCityNames = useMemo(() => {
    if (availableCities.length === 0) return [];
    const nameMap = new Map(availableCities.map(city => [city.id, city.name]));
    return validSelectedCities.map(id => nameMap.get(id) || id);
  }, [availableCities, validSelectedCities]);
  const displayedCities = useMemo(() => {
    if (availableCities.length === 0) return [];
    return showAllCities ? availableCities : availableCities.slice(0, MAX_VISIBLE_CITY_PILLS);
  }, [availableCities, showAllCities]);
  const citySelectionError = errors.cities || (citiesTouched && validSelectedCities.length === 0 ? CITY_VALIDATION_MESSAGE : null);

  // Debug Firebase configuration on component mount
  useEffect(() => {
    console.log('Firebase Storage Configuration:');
    console.log('Storage instance:', storage);
    console.log('Storage bucket:', storage?.app?.options?.storageBucket);
    console.log('User authenticated:', !!user);
    console.log('User UID:', user?.uid);
  }, [user]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach(media => {
        if (media.previewUrl && media.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(media.previewUrl);
        }
      });
    };
  }, []);

  // Translation function using Google Translate API (via public endpoint)
  // Translates FROM any language TO target language with proper scripts
  // Handles text of any length by chunking into 500 character segments
  const translateText = async (text, targetLang, sourceLang = 'gu') => {
    if (!text.trim()) return '';
    
    try {
      // Split text into chunks of 500 characters (API limit)
      const chunkSize = 500;
      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      
      console.log(`Translating text from ${sourceLang} to ${targetLang} (${chunks.length} chunks, ${text.length} total chars)`);
      console.log(`First chunk preview: "${chunks[0].substring(0, 100)}..."`);
      
      // Translate each chunk using Google Translate API
      const translatedChunks = await Promise.all(
        chunks.map(async (chunk, index) => {
          try {
            // Using Google Translate API via public endpoint
            const response = await axios.post(
              `https://translation.googleapis.com/language/translate/v2?key=AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw`,
              {
                q: chunk,
                source: sourceLang,
                target: targetLang,
                format: 'text'
              },
              {
                timeout: 15000,
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            
            const data = response.data;
            console.log(`Google Translate API response for chunk ${index + 1}:`, data);
            
            if (data && data.data && data.data.translations && data.data.translations[0]) {
              const translation = data.data.translations[0].translatedText;
              console.log(`Chunk ${index + 1} translated successfully:`, translation.substring(0, 100));
              
              // Validate that translation is different from source (actual translation occurred)
              if (translation.trim() === chunk.trim()) {
                console.warn(`Translation returned same text for chunk ${index + 1} - may not have translated`);
              }
              
              return translation;
            } else {
              console.error(`Translation API returned invalid response for chunk ${index + 1}:`, data);
              throw new Error('Invalid API response structure');
            }
          } catch (chunkError) {
            console.error(`Google Translate error for chunk ${index + 1}:`, chunkError.response?.data || chunkError.message);
            
            // Fallback to MyMemory API
            try {
              console.log(`Trying MyMemory fallback for chunk ${index + 1}...`);
              const fallbackResponse = await axios.get(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sourceLang}|${targetLang}`,
                {
                  timeout: 10000,
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }
              );
              
              const fallbackData = fallbackResponse.data;
              console.log(`MyMemory API response for chunk ${index + 1}:`, fallbackData);
              
              if (fallbackData.responseStatus === 200 && fallbackData.responseData && fallbackData.responseData.translatedText) {
                console.log(`MyMemory fallback successful for chunk ${index + 1}`);
                return fallbackData.responseData.translatedText;
              } else {
                throw new Error('MyMemory fallback failed');
              }
            } catch (fallbackError) {
              console.error(`Both translation services failed for chunk ${index + 1}`);
              throw new Error(`Translation failed for chunk ${index + 1}: ${fallbackError.message}`);
            }
          }
        })
      );
      
      // Combine translated chunks
      const translatedText = translatedChunks.join('');
      console.log(`Translation completed: ${text.length} chars -> ${translatedText.length} chars`);
      return translatedText;
      
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback: return original text if translation fails
      console.warn(`Translation failed, using original text as fallback for ${targetLang}`);
      return text;
    }
  };

  // Handle content change immediately (synchronous)
  const handleContentChange = (field, value, lang = 'en') => {
    const updatedContent = { ...formData[field], [lang]: value };
    setFormData(prev => ({ ...prev, [field]: updatedContent }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Manual translation functions for forcing re-translation
  // Translates FROM Gujarati TO Hindi and English
  const handleForceTranslateTitle = async () => {
    const gujaratiTitle = formData.title.gu.trim();
    if (!gujaratiTitle || gujaratiTitle.length < 3) {
      alert('કૃપા કરીને પહેલા ગુજરાતી શીર્ષક દાખલ કરો (ઓછામાં ઓછા 3 અક્ષરો).\nPlease enter a Gujarati title first (minimum 3 characters).');
      return;
    }

    try {
      setTranslating(true);
      console.log('Auto-translating title from Gujarati:', gujaratiTitle);
      console.log('Current title state before translation:', formData.title);
      
      const [hiTranslation, enTranslation] = await Promise.all([
        translateText(gujaratiTitle, 'hi', 'gu'),
        translateText(gujaratiTitle, 'en', 'gu')
      ]);
      
      console.log('Translation results:', { hi: hiTranslation, en: enTranslation });
      
      // Only update if translations are not empty
      if (!hiTranslation || !enTranslation) {
        throw new Error('Translation returned empty strings');
      }
      
      setFormData(prev => {
        const newTitle = {
          gu: prev.title.gu, // Explicitly preserve Gujarati
          hi: hiTranslation,
          en: enTranslation
        };
        console.log('Updating title state:', newTitle);
        return {
          ...prev,
          title: newTitle
        };
      });
      
      console.log('Title translations completed successfully');
      alert('✅ Title auto-translated!\nશીર્ષક સ્વતઃ અનુવાદિત!');
    } catch (error) {
      console.error('Auto-translation failed:', error);
      alert('Translation failed. Please try again.\nઅનુવાદ નિષ્ફળ. ફરી પ્રયાસ કરો.');
    } finally {
      setTranslating(false);
    }
  };

  const handleForceTranslateExcerpt = async () => {
    const gujaratiExcerpt = formData.excerpt.gu.trim();
    if (!gujaratiExcerpt || gujaratiExcerpt.length < 3) {
      alert('કૃપા કરીને પહેલા ગુજરાતી સારાંશ દાખલ કરો (ઓછામાં ઓછા 3 અક્ષરો).\nPlease enter a Gujarati excerpt first (minimum 3 characters).');
      return;
    }

    try {
      setTranslating(true);
      console.log('Auto-translating excerpt from Gujarati:', gujaratiExcerpt);
      console.log('Current excerpt state before translation:', formData.excerpt);
      
      const [hiTranslation, enTranslation] = await Promise.all([
        translateText(gujaratiExcerpt, 'hi', 'gu'),
        translateText(gujaratiExcerpt, 'en', 'gu')
      ]);
      
      console.log('Translation results:', { hi: hiTranslation, en: enTranslation });
      
      // Only update if translations are not empty
      if (!hiTranslation || !enTranslation) {
        throw new Error('Translation returned empty strings');
      }
      
      setFormData(prev => {
        const newExcerpt = {
          gu: prev.excerpt.gu, // Explicitly preserve Gujarati
          hi: hiTranslation,
          en: enTranslation
        };
        console.log('Updating excerpt state:', newExcerpt);
        return {
          ...prev,
          excerpt: newExcerpt
        };
      });
      
      console.log('Excerpt translations completed successfully');
      alert('✅ Excerpt auto-translated!\nસારાંશ સ્વતઃ અનુવાદિત!');
    } catch (error) {
      console.error('Auto-translation failed:', error);
      alert('Translation failed. Please try again.\nઅનુવાદ નિષ્ફળ. ફરી પ્રયાસ કરો.');
    } finally {
      setTranslating(false);
    }
  };

  const handleCityToggle = (cityId) => {
    setCitiesTouched(true);
    setErrors(prev => ({ ...prev, cities: null }));
    setSelectedCities(prev => {
      if (prev.includes(cityId)) {
        return prev.filter(id => id !== cityId);
      }
      return [...prev, cityId];
    });
  };

  const handleSelectCurrentCity = () => {
    if (!currentCity?.id) return;
    setCitiesTouched(true);
    setErrors(prev => ({ ...prev, cities: null }));
    setSelectedCities([currentCity.id]);
  };

  const handleSelectAllCities = () => {
    if (availableCities.length === 0) return;
    setCitiesTouched(true);
    setErrors(prev => ({ ...prev, cities: null }));
    setSelectedCities(availableCities.map(city => city.id));
  };

  const handleClearCities = () => {
    setCitiesTouched(true);
    setSelectedCities([]);
  };

  const getCityNamesString = useCallback((cityIds) => {
    if (!availableCities.length || !cityIds?.length) return 'selected cities';
    const nameMap = new Map(availableCities.map(city => [city.id, city.name]));
    return cityIds.map(id => nameMap.get(id) || id).join(', ');
  }, [availableCities]);

  const handleForceTranslateContent = async () => {
    const gujaratiContent = formData.content.gu.trim();
    if (!gujaratiContent || gujaratiContent.length < 10) {
      alert('કૃપા કરીને પહેલા ગુજરાતી સામગ્રી દાખલ કરો (ઓછામાં ઓછા 10 અક્ષરો).\nPlease enter Gujarati content first (minimum 10 characters).');
      return;
    }

    try {
      setTranslating(true);
      console.log('Auto-translating content from Gujarati:', gujaratiContent.substring(0, 50) + '...');
      console.log('Current content state before translation:', { gu: gujaratiContent.substring(0, 50) });
      
      const [hiTranslation, enTranslation] = await Promise.all([
        translateText(gujaratiContent, 'hi', 'gu'),
        translateText(gujaratiContent, 'en', 'gu')
      ]);
      
      console.log('Translation results:', { 
        hi: hiTranslation?.substring(0, 50), 
        en: enTranslation?.substring(0, 50) 
      });
      
      // Only update if translations are not empty
      if (!hiTranslation || !enTranslation) {
        throw new Error('Translation returned empty strings');
      }
      
      setFormData(prev => {
        const newContent = {
          gu: prev.content.gu, // Explicitly preserve Gujarati
          hi: hiTranslation,
          en: enTranslation
        };
        console.log('Updating content state with translations');
        return {
          ...prev,
          content: newContent
        };
      });
      
      console.log('Content translations completed successfully');
      alert('✅ Content auto-translated!\nસામગ્રી સ્વતઃ અનુવાદિત!');
    } catch (error) {
      console.error('Auto-translation failed:', error);
      alert('Translation failed. Please try again.\nઅનુવાદ નિષ્ફળ. ફરી પ્રયાસ કરો.');
    } finally {
      setTranslating(false);
    }
  };

  const handleTranslateAll = async () => {
    const gujaratiTitle = formData.title.gu.trim();
    const gujaratiExcerpt = formData.excerpt.gu.trim();
    const gujaratiContent = formData.content.gu.trim();
    
    if (!gujaratiTitle && !gujaratiExcerpt && !gujaratiContent) {
      alert('કૃપા કરીને પહેલા ગુજરાતી સામગ્રી દાખલ કરો.\nPlease enter some Gujarati content first.');
      return;
    }

    try {
      setTranslating(true);
      console.log('Auto-translating all Gujarati content to Hindi & English...');
      
      const translationPromises = [];
      
      if (gujaratiTitle && gujaratiTitle.length > 3) {
        translationPromises.push(
          Promise.all([
            translateText(gujaratiTitle, 'hi', 'gu'),
            translateText(gujaratiTitle, 'en', 'gu')
          ]).then(([hi, en]) => ({ type: 'title', hi, en }))
        );
      }
      
      if (gujaratiExcerpt && gujaratiExcerpt.length > 3) {
        translationPromises.push(
          Promise.all([
            translateText(gujaratiExcerpt, 'hi', 'gu'),
            translateText(gujaratiExcerpt, 'en', 'gu')
          ]).then(([hi, en]) => ({ type: 'excerpt', hi, en }))
        );
      }
      
      if (gujaratiContent && gujaratiContent.length > 10) {
        translationPromises.push(
          Promise.all([
            translateText(gujaratiContent, 'hi', 'gu'),
            translateText(gujaratiContent, 'en', 'gu')
          ]).then(([hi, en]) => ({ type: 'content', hi, en }))
        );
      }

      const results = await Promise.all(translationPromises);
      
      setFormData(prev => {
        const newData = { ...prev };
        results.forEach(result => {
          newData[result.type] = {
            ...prev[result.type],
            hi: result.hi,
            en: result.en
          };
        });
        return newData;
      });
      
      console.log('All translations completed:', results);
      alert('✅ All content auto-translated!\nબધી સામગ્રી સ્વતઃ અનુવાદિત!');
    } catch (error) {
      console.error('Batch translation failed:', error);
      alert('Translation failed. Please try again.\nઅનુવાદ નિષ્ફળ. ફરી પ્રયાસ કરો.');
    } finally {
      setTranslating(false);
    }
  };

  // Debounced translation effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const englishTitle = formData.title.en.trim();
      const englishExcerpt = formData.excerpt.en.trim();
      const englishContent = formData.content.en.trim();
      
      if (englishTitle && englishTitle.length > 3 && (!formData.title.hi.trim() || !formData.title.gu.trim())) {
        try {
          setTranslating(true);
          console.log('Translating title:', englishTitle);
          const [hiTranslation, guTranslation] = await Promise.all([
            translateText(englishTitle, 'hi', 'en'),
            translateText(englishTitle, 'gu', 'en')
          ]);
          
          setFormData(prev => ({
            ...prev,
            title: { 
              ...prev.title, 
              hi: prev.title.hi.trim() || hiTranslation, 
              gu: prev.title.gu.trim() || guTranslation 
            }
          }));
        } catch (error) {
          console.error('Title translation failed:', error);
        }
      }
      
      if (englishExcerpt && englishExcerpt.length > 3 && (!formData.excerpt.hi.trim() || !formData.excerpt.gu.trim())) {
        try {
          console.log('Translating excerpt:', englishExcerpt);
          const [hiTranslation, guTranslation] = await Promise.all([
            translateText(englishExcerpt, 'hi', 'en'),
            translateText(englishExcerpt, 'gu', 'en')
          ]);
          
          setFormData(prev => ({
            ...prev,
            excerpt: { 
              ...prev.excerpt, 
              hi: prev.excerpt.hi.trim() || hiTranslation, 
              gu: prev.excerpt.gu.trim() || guTranslation 
            }
          }));
        } catch (error) {
          console.error('Excerpt translation failed:', error);
        }
      }
      
      if (englishContent && englishContent.length > 10 && (!formData.content.hi.trim() || !formData.content.gu.trim())) {
        try {
          console.log('Translating content:', englishContent.substring(0, 50) + '...');
          const [hiTranslation, guTranslation] = await Promise.all([
            translateText(englishContent, 'hi', 'en'),
            translateText(englishContent, 'gu', 'en')
          ]);
          
          setFormData(prev => ({
            ...prev,
            content: { 
              ...prev.content, 
              hi: prev.content.hi.trim() || hiTranslation, 
              gu: prev.content.gu.trim() || guTranslation 
            }
          }));
        } catch (error) {
          console.error('Content translation failed:', error);
        }
      }
      
      setTranslating(false);
    }, 2000); // 2 second debounce for better UX
    
    return () => clearTimeout(timeoutId);
  }, [formData.title.en, formData.excerpt.en, formData.content.en]);

  // Auto-translate from Gujarati
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const gujaratiTitle = formData.title.gu.trim();
      const gujaratiExcerpt = formData.excerpt.gu.trim();
      const gujaratiContent = formData.content.gu.trim();
      
      if (gujaratiTitle && gujaratiTitle.length > 3 && (!formData.title.hi.trim() || !formData.title.en.trim())) {
        try {
          setTranslating(true);
          console.log('Auto-translating title from Gujarati:', gujaratiTitle);
          const [hiTranslation, enTranslation] = await Promise.all([
            translateText(gujaratiTitle, 'hi', 'gu'),
            translateText(gujaratiTitle, 'en', 'gu')
          ]);
          
          setFormData(prev => ({
            ...prev,
            title: { 
              ...prev.title, 
              hi: prev.title.hi.trim() || hiTranslation, 
              en: prev.title.en.trim() || enTranslation 
            }
          }));
        } catch (error) {
          console.error('Gujarati title translation failed:', error);
        }
      }
      
      if (gujaratiExcerpt && gujaratiExcerpt.length > 3 && (!formData.excerpt.hi.trim() || !formData.excerpt.en.trim())) {
        try {
          console.log('Auto-translating excerpt from Gujarati:', gujaratiExcerpt);
          const [hiTranslation, enTranslation] = await Promise.all([
            translateText(gujaratiExcerpt, 'hi', 'gu'),
            translateText(gujaratiExcerpt, 'en', 'gu')
          ]);
          
          setFormData(prev => ({
            ...prev,
            excerpt: { 
              ...prev.excerpt, 
              hi: prev.excerpt.hi.trim() || hiTranslation, 
              en: prev.excerpt.en.trim() || enTranslation 
            }
          }));
        } catch (error) {
          console.error('Gujarati excerpt translation failed:', error);
        }
      }
      
      if (gujaratiContent && gujaratiContent.length > 10 && (!formData.content.hi.trim() || !formData.content.en.trim())) {
        try {
          console.log('Auto-translating content from Gujarati:', gujaratiContent.substring(0, 50) + '...');
          const [hiTranslation, enTranslation] = await Promise.all([
            translateText(gujaratiContent, 'hi', 'gu'),
            translateText(gujaratiContent, 'en', 'gu')
          ]);
          
          setFormData(prev => ({
            ...prev,
            content: { 
              ...prev.content, 
              hi: prev.content.hi.trim() || hiTranslation, 
              en: prev.content.en.trim() || enTranslation 
            }
          }));
        } catch (error) {
          console.error('Gujarati content translation failed:', error);
        }
      }
      
      setTranslating(false);
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [formData.title.gu, formData.excerpt.gu, formData.content.gu]);

  // Auto-translate from Hindi
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const hindiTitle = formData.title.hi.trim();
      const hindiExcerpt = formData.excerpt.hi.trim();
      const hindiContent = formData.content.hi.trim();
      
      if (hindiTitle && hindiTitle.length > 3 && (!formData.title.gu.trim() || !formData.title.en.trim())) {
        try {
          setTranslating(true);
          console.log('Auto-translating title from Hindi:', hindiTitle);
          const [guTranslation, enTranslation] = await Promise.all([
            translateText(hindiTitle, 'gu', 'hi'),
            translateText(hindiTitle, 'en', 'hi')
          ]);
          
          setFormData(prev => ({
            ...prev,
            title: { 
              ...prev.title, 
              gu: prev.title.gu.trim() || guTranslation, 
              en: prev.title.en.trim() || enTranslation 
            }
          }));
        } catch (error) {
          console.error('Hindi title translation failed:', error);
        }
      }
      
      if (hindiExcerpt && hindiExcerpt.length > 3 && (!formData.excerpt.gu.trim() || !formData.excerpt.en.trim())) {
        try {
          console.log('Auto-translating excerpt from Hindi:', hindiExcerpt);
          const [guTranslation, enTranslation] = await Promise.all([
            translateText(hindiExcerpt, 'gu', 'hi'),
            translateText(hindiExcerpt, 'en', 'hi')
          ]);
          
          setFormData(prev => ({
            ...prev,
            excerpt: { 
              ...prev.excerpt, 
              gu: prev.excerpt.gu.trim() || guTranslation, 
              en: prev.excerpt.en.trim() || enTranslation 
            }
          }));
        } catch (error) {
          console.error('Hindi excerpt translation failed:', error);
        }
      }
      
      if (hindiContent && hindiContent.length > 10 && (!formData.content.gu.trim() || !formData.content.en.trim())) {
        try {
          console.log('Auto-translating content from Hindi:', hindiContent.substring(0, 50) + '...');
          const [guTranslation, enTranslation] = await Promise.all([
            translateText(hindiContent, 'gu', 'hi'),
            translateText(hindiContent, 'en', 'hi')
          ]);
          
          setFormData(prev => ({
            ...prev,
            content: { 
              ...prev.content, 
              gu: prev.content.gu.trim() || guTranslation, 
              en: prev.content.en.trim() || enTranslation 
            }
          }));
        } catch (error) {
          console.error('Hindi content translation failed:', error);
        }
      }
      
      setTranslating(false);
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [formData.title.hi, formData.excerpt.hi, formData.content.hi]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleMediaUpload = async (file, type = 'image') => {
    try {
      // Validate file before upload
      if (!file) {
        throw new Error('No file provided');
      }
      
      // Clean filename to avoid issues
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const filePath = `posts/${type}s/${timestamp}_${cleanFileName}`;
      
      console.log(`Uploading ${type} to:`, filePath);
      
      // Create storage reference
      const fileRef = storageRef(storage, filePath);
      
      // Set metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'uploadedBy': user?.uid || 'anonymous',
          'originalName': file.name,
          'uploadTime': new Date().toISOString()
        }
      };
      
      // Upload file with metadata
      console.log('Starting upload...');
      const snapshot = await uploadBytes(fileRef, file, metadata);
      console.log('Upload completed, getting download URL...');
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      return {
        url: downloadURL,
        type: type,
        name: file.name,
        size: file.size,
        path: filePath
      };
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      
      // Handle specific error types
      if (error.code === 'storage/unauthorized') {
        throw new Error('Upload failed: Please sign in to upload files');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload was cancelled');
      } else if (error.code === 'storage/unknown') {
        throw new Error('Upload failed: Please check your internet connection');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
  };

  const handleMultipleMediaSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadProgress({});
    const newMediaItems = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 'file';
      
      // Validate file size (10MB for images, 100MB for videos)
      const maxSize = fileType === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, media: `${file.name} is too large. Max size: ${fileType === 'video' ? '100MB' : '10MB'}` }));
        continue;
      }

      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Create preview for immediate display
        const previewUrl = URL.createObjectURL(file);
        console.log(`Created preview URL for ${file.name}:`, previewUrl);
        
        const mediaItem = {
          file,
          previewUrl,
          type: fileType,
          name: file.name,
          size: file.size,
          uploading: true
        };
        
        newMediaItems.push(mediaItem);
        console.log(`Added media item:`, mediaItem);
        setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));
        
        // Upload to Firebase
        const uploadResult = await handleMediaUpload(file, fileType);
        mediaItem.url = uploadResult.url;
        mediaItem.path = uploadResult.path;
        mediaItem.uploading = false;
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        console.log(`Successfully uploaded: ${file.name}`);
        
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        
        // Remove failed upload from media items
        const itemIndex = newMediaItems.findIndex(item => item.name === file.name);
        if (itemIndex > -1) {
          newMediaItems.splice(itemIndex, 1);
        }
        
        // Show user-friendly error message with specific CORS guidance
        let errorMessage = error.message || `Failed to upload ${file.name}`;
        
        if (error.message && error.message.includes('CORS')) {
          errorMessage = `CORS Error: Please check Firebase Storage rules. ${file.name} could not be uploaded due to cross-origin restrictions.`;
        } else if (error.code === 'storage/unauthorized') {
          errorMessage = `Authentication Error: Please sign in with Google to upload files.`;
        }
        
        setErrors(prev => ({ ...prev, media: errorMessage }));
        
        // Remove progress indicator for failed upload
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }

    // Update mediaFiles state for preview (only successful uploads)
    const successfulUploads = newMediaItems.filter(item => !item.uploading && item.url);
    setMediaFiles(prev => [...prev, ...successfulUploads]);
    
    // Update formData with media information (only successful uploads)
    if (successfulUploads.length > 0) {
      setFormData(prev => ({ 
        ...prev, 
        media: [...prev.media, ...successfulUploads.map(item => ({
          url: item.url,
          type: item.type,
          name: item.name,
          size: item.size,
          path: item.path,
          previewUrl: item.previewUrl
        }))]
      }));
    }
    
    // Clear the input
    if (e.target) {
      e.target.value = '';
    }
    
    // Clear any previous errors if uploads were successful
    if (successfulUploads.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.media;
        return newErrors;
      });
    }
  };

  const removeMediaItem = (index) => {
    // Clean up object URL to prevent memory leaks
    const mediaItem = mediaFiles[index];
    if (mediaItem && mediaItem.previewUrl && mediaItem.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaItem.previewUrl);
    }
    
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({ 
      ...prev, 
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.gu.trim()) newErrors.title = 'Gujarati title is required | ગુજરાતી શીર્ષક જરૂરી છે';
    if (!formData.content.gu.trim()) newErrors.content = 'Gujarati content is required | ગુજરાતી સામગ્રી જરૂરી છે';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.excerpt.gu.trim()) newErrors.excerpt = 'Gujarati excerpt is required | ગુજરાતી સારાંશ જરૂરી છે';
    
    if (validSelectedCities.length === 0) {
      newErrors.cities = CITY_VALIDATION_MESSAGE;
    }

    setCitiesTouched(true);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    const targetCities = validSelectedCities;
    if (targetCities.length === 0) {
      setCitiesTouched(true);
      setErrors(prev => ({ ...prev, cities: CITY_VALIDATION_MESSAGE }));
      alert('Please select at least one city before saving a draft.');
      return;
    }

    setLoading(true);
    try {
      const postData = {
        ...formData,
        status: 'draft',
        authorId: user.uid,
        authorName: user.displayName || user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to all selected cities
      for (const cityId of targetCities) {
        const postsRef = ref(db, `cities/${cityId}/posts`);
        await push(postsRef, postData);
      }

      const cityNames = getCityNamesString(targetCities);
      alert(`Draft saved successfully for: ${cityNames}!`);
      // Reset form
      setFormData({
        title: { en: '', hi: '', gu: '' },
        content: { en: '', hi: '', gu: '' },
        excerpt: { en: '', hi: '', gu: '' },
        category: '', subcategory: '', tags: [], location: '', media: [],
        externalLink: '', isBreaking: false, isUrgent: false, isFeatured: false,
        publishDate: '', scheduledTime: ''
      });
      setMediaFiles([]);
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const targetCities = validSelectedCities;
      if (targetCities.length === 0) {
        setCitiesTouched(true);
        setErrors(prev => ({ ...prev, cities: CITY_VALIDATION_MESSAGE }));
        alert('Please select at least one city before publishing.');
        return;
      }

      const postData = {
        ...formData,
        status: 'published',
        isPublished: true,
        cities: targetCities,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timestamp: Date.now(),
        views: 0,
        likes: 0,
        comments: 0,
        analytics: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0
        }
      };

      // Publish to main posts collection
      const mainPostsRef = ref(db, 'posts');
      const newPostRef = await push(mainPostsRef, postData);
      const newPostId = newPostRef.key;

      // Also publish to city-specific paths
      for (const cityId of targetCities) {
        const cityPostsRef = ref(db, `cities/${cityId}/posts`);
        await push(cityPostsRef, { ...postData, mainPostId: newPostId });
      }

      // Send push notifications via Netlify Function
      try {
        // Get all FCM tokens from Firebase
        const { ref: dbRef, get } = await import('firebase/database');
        const tokensRef = dbRef(db, 'fcmTokens');
        const tokensSnapshot = await get(tokensRef);
        const fcmTokensData = tokensSnapshot.val() || {};
        
        // Filter tokens based on target cities and topics
        const relevantTokens = Object.entries(fcmTokensData)
          .map(([userId, data]) => data)
          .filter(tokenData => {
            if (!tokenData.token || !tokenData.topics) return false;
            
            // Check if user is subscribed to relevant topics
            const topics = Array.isArray(tokenData.topics) ? tokenData.topics : [];
            
            // Check for all-news or breaking-news subscription
            if (topics.includes('all-news') || (post.isBreaking && topics.includes('breaking-news'))) {
              return true;
            }
            
            // Check for city-specific subscriptions
            return targetCities.some(cityId => topics.includes(`city-${cityId}`));
          });

        if (relevantTokens.length > 0) {
          const notificationResponse = await fetch('/.netlify/functions/send-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              post: { ...postData, id: newPostId },
              fcmTokens: relevantTokens,
              cityId: targetCities[0]
            })
          });

          const notificationResult = await notificationResponse.json();
          console.log('Notification result:', notificationResult);
          
          if (notificationResult.successCount > 0) {
            alert(`Post published successfully! Notifications sent to ${notificationResult.successCount} users.`);
          } else {
            alert('Post published successfully! (No active subscribers for notifications)');
          }
        } else {
          alert('Post published successfully! (No active subscribers)');
        }
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        alert('Post published successfully! (Notifications failed to send)');
      }

      // Reset form
      setFormData({
        title: { en: '', hi: '', gu: '' },
        content: { en: '', hi: '', gu: '' },
        excerpt: { en: '', hi: '', gu: '' },
        category: '', subcategory: '', tags: [], location: '', media: [],
        externalLink: '', isBreaking: false, isUrgent: false, isFeatured: false,
        publishDate: '', scheduledTime: ''
      });
      setMediaFiles([]);
      setSelectedCities([]);
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Error publishing post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === formData.category);

  return (
    <div className="w-full">
      <div className="grid grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="col-span-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Post</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* City Multi-Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Target Cities
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {validSelectedCities.length}/{availableCities.length || 0} selected
                  </span>
                </div>
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  {availableCities.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button
                          type="button"
                          onClick={handleSelectCurrentCity}
                          disabled={!currentCity?.id}
                          className={`px-3 py-1.5 rounded-full border transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                            currentCity?.id && validSelectedCities.length === 1 && validSelectedCities[0] === currentCity.id
                              ? 'bg-blue-600 text-white border-blue-600 focus:ring-blue-500'
                              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed'
                          }`}
                        >
                          Use {currentCity?.name || 'current city'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSelectAllCities}
                          disabled={availableCities.length === 0 || availableCities.length === validSelectedCities.length}
                          className="px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Select all ({availableCities.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleClearCities}
                          disabled={validSelectedCities.length === 0}
                          className="px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:border-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Clear selection
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {displayedCities.map(city => {
                          const isSelected = validSelectedCities.includes(city.id);
                          return (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => handleCityToggle(city.id)}
                              className={`flex items-center px-3 py-1.5 text-sm rounded-full border transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 focus:ring-blue-500 shadow-sm'
                                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:border-blue-500'
                              }`}
                            >
                              <Check className={`w-3.5 h-3.5 mr-1.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                              <span>{city.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      {availableCities.length > MAX_VISIBLE_CITY_PILLS && (
                        <button
                          type="button"
                          onClick={() => setShowAllCities(prev => !prev)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {showAllCities ? 'Show fewer cities' : `Show all ${availableCities.length} cities`}
                        </button>
                      )}

                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {selectedCityNames.length > 0 ? (
                          <span>Selected: {selectedCityNames.join(', ')}</span>
                        ) : (
                          <span>No cities selected yet.</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading cities...</p>
                  )}

                  {citySelectionError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>{citySelectionError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Multiple Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Media Files (Images & Videos)
                </label>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 mb-4">
                  <div className="text-center">
                    <div className="flex justify-center space-x-4 mb-4">
                      <Image className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <Video className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Upload multiple images and videos</p>
                      <p className="text-xs text-gray-500">Images: Max 10MB each • Videos: Max 100MB each</p>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => multipleImageInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Select Files
                      </button>
                      <input
                        ref={multipleImageInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleMultipleMediaSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Media Preview Grid */}
                {(mediaFiles.length > 0 || formData.media.length > 0) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mediaFiles.map((media, index) => (
                      <div key={index} className="relative group">
                        <div className="relative rounded-lg overflow-hidden bg-gray-100">
                          {media.type === 'image' ? (
                            <img
                              src={media.previewUrl || media.url}
                              alt={media.name}
                              className="w-full h-32 object-cover"
                              onLoad={() => console.log('Image loaded successfully:', media.name)}
                              onError={(e) => {
                                console.log('Image failed to load:', media.previewUrl || media.url);
                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" font-family="system-ui" font-size="12" fill="%236b7280">Image</text></svg>';
                              }}
                            />
                          ) : media.type === 'video' ? (
                            <div className="relative">
                              <video
                                src={media.previewUrl || media.url}
                                className="w-full h-32 object-cover"
                                controls={false}
                                onError={() => {
                                  console.log('Video failed to load:', media.previewUrl || media.url);
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                                <Video className="h-8 w-8 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-100">
                              <FileText className="h-8 w-8 text-gray-400 mb-2" />
                              <span className="text-xs text-gray-500 text-center px-2">{media.name}</span>
                            </div>
                          )}
                          
                          {/* Upload Progress */}
                          {media.uploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <div className="bg-white rounded-full p-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                              </div>
                            </div>
                          )}
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeMediaItem(index)}
                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 truncate">{media.name}</p>
                          <p className="text-xs text-gray-500">
                            {(media.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {errors.media && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                        <p className="mt-1 text-sm text-red-700">{errors.media}</p>
                        <div className="mt-2 text-xs text-red-600">
                          <p><strong>Troubleshooting tips:</strong></p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Make sure you're signed in to your Google account</li>
                            <li>Check your internet connection</li>
                            <li>Ensure the file is under 10MB for images or 100MB for videos</li>
                            <li>Try refreshing the page and uploading again</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Language Content */}
              <div className="space-y-6">
                {/* Language Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {Object.entries(languageLabels).map(([lang, label]) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveLanguage(lang)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeLanguage === lang
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Language Content Forms */}
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title ({languageLabels[activeLanguage]})
                      {activeLanguage === 'gu' && <span className="text-red-500 ml-1">* જરૂરી</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.title[activeLanguage]}
                      onChange={(e) => handleContentChange('title', e.target.value, activeLanguage)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={`Enter title in ${languageLabels[activeLanguage]}`}
                    />
                    {errors.title && activeLanguage === 'gu' && (
                      <p className="text-red-500 text-sm mt-2">{errors.title}</p>
                    )}
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Excerpt ({languageLabels[activeLanguage]})
                      {activeLanguage === 'gu' && <span className="text-red-500 ml-1">* જરૂરી</span>}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.excerpt[activeLanguage]}
                      onChange={(e) => handleContentChange('excerpt', e.target.value, activeLanguage)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={`Enter excerpt in ${languageLabels[activeLanguage]}`}
                    />
                    {errors.excerpt && activeLanguage === 'gu' && (
                      <p className="text-red-500 text-sm mt-2">{errors.excerpt}</p>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content ({languageLabels[activeLanguage]})
                      {activeLanguage === 'gu' && <span className="text-red-500 ml-1">* જરૂરી</span>}
                    </label>
                    <textarea
                      rows={10}
                      value={formData.content[activeLanguage]}
                      onChange={(e) => handleContentChange('content', e.target.value, activeLanguage)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={`Enter content in ${languageLabels[activeLanguage]}`}
                    />
                    {errors.content && activeLanguage === 'gu' && (
                      <p className="text-red-500 text-sm mt-2">{errors.content}</p>
                    )}
                  </div>

                  {/* Auto-Translation Status */}
                  {activeLanguage === 'gu' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Languages className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-gujarati">
                          <strong>🌐 Auto-Translate:</strong> Write in Gujarati, click buttons below to translate to Hindi & English
                          <br />
                          <span className="text-xs">ગુજરાતીમાં લખો, હિન્દી અને અંગ્રેજીમાં અનુવાદ કરવા બટન ક્લિક કરો</span>
                        </p>
                      </div>
                      
                      {/* Manual Translation Controls */}
                      <div className="border-t border-blue-200 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-blue-600 font-medium">Translation Buttons | અનુવાદ બટનો:</p>
                          {translating && <div className="text-xs text-blue-500">🔄 Translating... | અનુવાદ થઈ રહ્યો છે...</div>}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            onClick={handleForceTranslateTitle}
                            disabled={translating || !formData.title.gu.trim()}
                            className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-md transition-colors"
                            title="Translate Gujarati title to Hindi & English"
                          >
                            <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                            <span>Title | શીર્ષક</span>
                          </button>
                          <button
                            onClick={handleForceTranslateExcerpt}
                            disabled={translating || !formData.excerpt.gu.trim()}
                            className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-md transition-colors"
                            title="Translate Gujarati excerpt to Hindi & English"
                          >
                            <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                            <span>Excerpt | સારાંશ</span>
                          </button>
                          <button
                            onClick={handleForceTranslateContent}
                            disabled={translating || !formData.content.gu.trim()}
                            className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-md transition-colors"
                            title="Translate Gujarati content to Hindi & English"
                          >
                            <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                            <span>Content | સામગ્રી</span>
                          </button>
                          <button
                            onClick={handleTranslateAll}
                            disabled={translating || (!formData.title.gu.trim() && !formData.excerpt.gu.trim() && !formData.content.gu.trim())}
                            className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 text-green-700 rounded-md transition-colors font-medium"
                            title="Translate all Gujarati content at once"
                          >
                            <Languages className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                            <span>All | બધું</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* External Links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video URL
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    External Link
                  </label>
                  <input
                    type="url"
                    value={formData.externalLink}
                    onChange={(e) => handleInputChange('externalLink', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Post Options */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Options</h3>
            
            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Subcategory */}
            {selectedCategory?.subcategories && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select subcategory</option>
                  {selectedCategory.subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Location */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Vadodara, Gujarat"
              />
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add tag..."
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Post Flags */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isBreaking}
                  onChange={(e) => handleInputChange('isBreaking', e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Breaking News</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) => handleInputChange('isUrgent', e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">Urgent</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Featured</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setPreview(!preview)}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview</h3>
              <button
                onClick={() => setPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <article className="prose max-w-none">
                <h1>{formData.title.en || 'No Title'}</h1>
                <p className="lead text-gray-600">{formData.excerpt.en || 'No excerpt'}</p>
                
                {/* Media Preview in Modal */}
                {mediaFiles.length > 0 && (
                  <div className="my-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mediaFiles.slice(0, 4).map((media, index) => (
                        <div key={index} className="rounded-lg overflow-hidden">
                          {media.type === 'image' ? (
                            <img 
                              src={media.previewUrl || media.url} 
                              alt={media.name}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                e.target.src = '/api/placeholder/400/300';
                              }}
                            />
                          ) : media.type === 'video' ? (
                            <video 
                              src={media.previewUrl || media.url}
                              className="w-full h-48 object-cover"
                              controls
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="whitespace-pre-wrap">{formData.content.en || 'No content'}</div>
                
                {/* Show other languages if available */}
                {(formData.title.hi || formData.content.hi) && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">हिंदी (Hindi)</h3>
                    <h2 className="text-xl font-bold mb-2">{formData.title.hi}</h2>
                    {formData.excerpt.hi && <p className="text-gray-600 mb-4">{formData.excerpt.hi}</p>}
                    <div className="whitespace-pre-wrap">{formData.content.hi}</div>
                  </div>
                )}
                
                {(formData.title.gu || formData.content.gu) && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">ગુજરાતી (Gujarati)</h3>
                    <h2 className="text-xl font-bold mb-2">{formData.title.gu}</h2>
                    {formData.excerpt.gu && <p className="text-gray-600 mb-4">{formData.excerpt.gu}</p>}
                    <div className="whitespace-pre-wrap">{formData.content.gu}</div>
                  </div>
                )}
              </article>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;