// =============================================
// src/components/Admin/CityManagement.jsx
// City Management - Add, Edit, Delete Cities
// Cities are stored in Firebase and auto-sync everywhere
// =============================================
import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase-config';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Upload,
  Image,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';

const FALLBACK_CITY_LOGO = '/logo.png';

const CityManagement = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    logoUrl: '',
    nameGu: '', // Gujarati name
    nameHi: '', // Hindi name
    description: ''
  });

  const fileInputRef = useRef(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Load cities from Firebase
  useEffect(() => {
    const citiesRef = ref(db, 'cities-config');
    const unsubscribe = onValue(citiesRef, (snapshot) => {
      if (snapshot.exists()) {
        const citiesData = snapshot.val();
        const citiesArray = Object.entries(citiesData).map(([id, data]) => ({
          id,
          ...data
        }));
        setCities(citiesArray.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        // Initialize with default cities if none exist
        const defaultCities = {
          vadodara: { name: 'Vadodara', nameGu: 'વડોદરા', nameHi: 'वडोदरा', logoUrl: '', description: '' },
          surat: { name: 'Surat', nameGu: 'સુરત', nameHi: 'सूरत', logoUrl: '', description: '' },
          rajkot: { name: 'Rajkot', nameGu: 'રાજકોટ', nameHi: 'राजकोट', logoUrl: '', description: '' }
        };
        set(ref(db, 'cities-config'), defaultCities);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const generateCityId = (name) => {
    return name.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const handleLogoUpload = async (file) => {
    if (!file) return null;

    try {
      setUploadingLogo(true);
      const timestamp = Date.now();
      const fileName = `city-logos/${formData.id || generateCityId(formData.name)}-${timestamp}.${file.name.split('.').pop()}`;
      const logoRef = storageRef(storage, fileName);
      
      await uploadBytes(logoRef, file);
      const downloadURL = await getDownloadURL(logoRef);
      
      setFormData(prev => ({ ...prev, logoUrl: downloadURL }));
      setLogoPreview(downloadURL);
      setUploadingLogo(false);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error uploading logo. Please try again.');
      setUploadingLogo(false);
      return null;
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('Logo size should be less than 2MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload
      handleLogoUpload(file);
    }
  };

  const handleAddCity = () => {
    setShowAddForm(true);
    setEditingCity(null);
    setFormData({
      id: '',
      name: '',
      logoUrl: '',
      nameGu: '',
      nameHi: '',
      description: ''
    });
    setLogoPreview(null);
  };

  const handleEditCity = (city) => {
    setEditingCity(city.id);
    setShowAddForm(true);
    setFormData({
      id: city.id,
      name: city.name,
      logoUrl: city.logoUrl || '',
      nameGu: city.nameGu || '',
      nameHi: city.nameHi || '',
      description: city.description || ''
    });
    setLogoPreview(city.logoUrl || null);
  };

  const handleSaveCity = async () => {
    if (!formData.name.trim()) {
      alert('City name is required');
      return;
    }

    try {
      setSaving(true);
      const cityId = editingCity || generateCityId(formData.name);
      
      // Check if city ID already exists (only for new cities)
      if (!editingCity && cities.some(c => c.id === cityId)) {
        alert('A city with this name already exists');
        setSaving(false);
        return;
      }

      const cityData = {
        name: formData.name,
        nameGu: formData.nameGu || formData.name,
        nameHi: formData.nameHi || formData.name,
        logoUrl: formData.logoUrl || '',
        description: formData.description || '',
        createdAt: editingCity ? cities.find(c => c.id === cityId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await set(ref(db, `cities-config/${cityId}`), cityData);
      
      alert(`City ${editingCity ? 'updated' : 'added'} successfully!`);
      setShowAddForm(false);
      setEditingCity(null);
      setFormData({ id: '', name: '', logoUrl: '', nameGu: '', nameHi: '', description: '' });
      setLogoPreview(null);
      setSaving(false);
    } catch (error) {
      console.error('Error saving city:', error);
      alert('Error saving city. Please try again.');
      setSaving(false);
    }
  };

  const handleDeleteCity = async (cityId) => {
    const city = cities.find(c => c.id === cityId);
    if (!city) return;

    if (window.confirm(`Are you sure you want to delete "${city.name}"?\n\nWARNING: This will not delete the city's content, but the city will no longer appear in selectors.`)) {
      try {
        await remove(ref(db, `cities-config/${cityId}`));
        alert('City deleted successfully');
      } catch (error) {
        console.error('Error deleting city:', error);
        alert('Error deleting city');
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCity(null);
    setFormData({ id: '', name: '', logoUrl: '', nameGu: '', nameHi: '', description: '' });
    setLogoPreview(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">City Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Add and manage cities for your news platform</p>
        </div>
        {!showAddForm && (
          <button
            onClick={handleAddCity}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add City</span>
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Cities auto-sync across all components!</p>
            <p>When you add or edit a city here, it automatically appears in:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Create Post (city selector)</li>
              <li>Create Media Post (city selector)</li>
              <li>Content Manager (city filter)</li>
              <li>Events, Polls, Breaking News (all city selectors)</li>
              <li>User-facing city selector (header)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingCity ? 'Edit City' : 'Add New City'}
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* City Name (English) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City Name (English) *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter city name in English"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={editingCity} // Can't change name once created
              />
              {editingCity && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  City ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{formData.id}</code> (Cannot be changed)
                </p>
              )}
            </div>

            {/* Multi-language Names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City Name (Gujarati - ગુજરાતી)
                </label>
                <input
                  type="text"
                  value={formData.nameGu}
                  onChange={(e) => setFormData({ ...formData, nameGu: e.target.value })}
                  placeholder="ગુજરાતીમાં શહેરનું નામ"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City Name (Hindi - हिंदी)
                </label>
                <input
                  type="text"
                  value={formData.nameHi}
                  onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
                  placeholder="हिंदी में शहर का नाम"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* City Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City Logo (Optional)
              </label>
              <div className="flex items-start space-x-4">
                {/* Logo Preview */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = FALLBACK_CITY_LOGO;
                        }}
                      />
                    ) : (
                      <Image className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload Logo</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Recommended: Square image, max 2MB. PNG or JPG format.
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description about the city..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCity}
                disabled={saving || uploadingLogo || !formData.name.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editingCity ? 'Update City' : 'Add City'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cities List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configured Cities ({cities.length})
          </h2>
        </div>

        {cities.length === 0 ? (
          <div className="p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No cities added yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first city to get started</p>
            <button
              onClick={handleAddCity}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add City</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {cities.map((city) => (
              <div key={city.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start space-x-4">
                  {/* City Logo */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                      {city.logoUrl ? (
                        <img
                          src={city.logoUrl}
                          alt={`${city.name} logo`}
                          className="w-full h-full object-contain"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = FALLBACK_CITY_LOGO;
                          }}
                        />
                      ) : (
                        <MapPin className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* City Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {city.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">{city.id}</code></span>
                      {city.nameGu && <span>ગુજરાતી: {city.nameGu}</span>}
                      {city.nameHi && <span>हिंदी: {city.nameHi}</span>}
                    </div>
                    {city.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {city.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <Check className="w-3 h-3" />
                      <span>Active in all components</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditCity(city)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit city"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCity(city.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete city"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CityManagement;
