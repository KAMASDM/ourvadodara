# 🏙️ City Management System - Complete Guide

## Overview
The City Management system allows admins to dynamically add, edit, and delete cities with logos. All changes automatically sync across every component in the app.

---

## 🎯 Features

### ✅ What You Can Do
- **Add Cities**: Create new cities with name, logo, and multi-language support
- **Edit Cities**: Update city names, logos, and descriptions
- **Delete Cities**: Remove cities (content remains in Firebase)
- **Upload Logos**: Add city-specific logos (stored in Firebase Storage)
- **Multi-Language**: Support for English, Gujarati, and Hindi city names
- **Auto-Sync**: Changes instantly reflect in all components

### 🔄 Auto-Syncing Components
When you add/edit a city, it automatically updates in:
- ✅ Create Post (city selector)
- ✅ Create Media Post (city selector)
- ✅ Content Manager (city filter)
- ✅ Event Management (city selector)
- ✅ Poll Management (city selector)
- ✅ Breaking News (city selector)
- ✅ User-facing city selector (header)

---

## 📍 How to Access

### Desktop
1. Open Admin Panel
2. Click **"City Management"** in the sidebar (MapPin icon)
3. View all configured cities

### Mobile
**Note**: City Management is desktop-only for better usability.

---

## ➕ Adding a New City

### Step 1: Click "Add City"
- Located in the top-right corner
- Opens the city creation form

### Step 2: Fill in Details

#### Required Fields
- **City Name (English)** - e.g., "Ahmedabad"
  - This generates the City ID automatically
  - Cannot be changed once created

#### Optional Fields
- **City Name (Gujarati)** - e.g., "અમદાવાદ"
- **City Name (Hindi)** - e.g., "अहमदाबाद"
- **City Logo** - Upload image (PNG/JPG, max 2MB)
  - Recommended: Square image (512x512 or 1024x1024)
  - Used in city selectors and cards
- **Description** - Brief info about the city

### Step 3: Upload Logo (Optional)
1. Click **"Upload Logo"** button
2. Select an image file (PNG, JPG, JPEG, WebP)
3. Preview appears immediately
4. Logo auto-uploads to Firebase Storage
5. Wait for upload to complete (shows loading spinner)

### Step 4: Save
- Click **"Add City"** button
- City is saved to Firebase
- Appears instantly in all components
- Success message confirms creation

---

## ✏️ Editing an Existing City

### Step 1: Find the City
- Scroll through the cities list
- Each city shows:
  - Logo (if uploaded)
  - Name with ID
  - Multi-language names
  - Description

### Step 2: Click Edit Icon
- Blue pencil icon on the right
- Opens edit form with pre-filled data

### Step 3: Make Changes
- **City Name (English)**: Read-only (cannot change ID)
- **Other fields**: Update as needed
- **Logo**: Upload new logo to replace old one

### Step 4: Save Changes
- Click **"Update City"** button
- Changes sync across all components
- Success message confirms update

---

## 🗑️ Deleting a City

### Warning
**Deleting a city does NOT delete its content!** Posts, events, and polls remain in Firebase under `cities/{cityId}/...`. The city just won't appear in selectors.

### Steps
1. Find the city in the list
2. Click the **red trash icon**
3. Confirm deletion in the warning dialog
4. City is removed from `cities-config` in Firebase
5. City disappears from all selectors

### Recovery
To restore a deleted city, re-add it with the **same City ID**:
- Old content will automatically reconnect
- Example: If you delete "Surat" (ID: `surat`) and re-add it, old posts reappear

---

## 🔧 Technical Details

### Firebase Structure

#### City Configuration
```
cities-config/
  vadodara/
    name: "Vadodara"
    nameGu: "વડોદરા"
    nameHi: "वडोदरा"
    logoUrl: "https://firebasestorage.googleapis.com/..."
    description: "Cultural capital of Gujarat"
    createdAt: "2024-01-15T10:30:00.000Z"
    updatedAt: "2024-01-20T15:45:00.000Z"
  
  surat/
    name: "Surat"
    nameGu: "સુરત"
    nameHi: "सूरत"
    logoUrl: "..."
    description: "Diamond city"
    createdAt: "2024-01-15T10:31:00.000Z"
    updatedAt: "2024-01-15T10:31:00.000Z"
```

#### Logo Storage
```
Firebase Storage:
  city-logos/
    vadodara-1705318200000.png
    surat-1705318260000.jpg
    rajkot-1705318320000.png
```

### City ID Generation
```javascript
generateCityId("New Delhi")
// Result: "newdelhi"

Rules:
- Lowercase
- Remove spaces
- Remove special characters
- Only a-z and 0-9
```

### File Upload Limits
- **Max Size**: 2 MB
- **Formats**: PNG, JPG, JPEG, WebP
- **Recommended**: Square images (1:1 aspect ratio)
- **Optimal Size**: 512x512 or 1024x1024 pixels

---

## 🎨 Using City Logos in Components

### Example: Display City Logo
```jsx
import { useCity } from '../../context/CityContext';

function CityHeader() {
  const { currentCity } = useCity();
  
  return (
    <div className="flex items-center space-x-3">
      {currentCity.logoUrl && (
        <img 
          src={currentCity.logoUrl} 
          alt={`${currentCity.name} logo`}
          className="w-10 h-10 rounded-full object-cover"
        />
      )}
      <h2>{currentCity.name}</h2>
    </div>
  );
}
```

### Example: City Selector with Logos
```jsx
import { useCity } from '../../context/CityContext';

function CitySelector() {
  const { cities, currentCity, setCurrentCity } = useCity();
  
  return (
    <select 
      value={currentCity.id}
      onChange={(e) => {
        const city = cities.find(c => c.id === e.target.value);
        setCurrentCity(city);
      }}
    >
      {cities.map(city => (
        <option key={city.id} value={city.id}>
          {city.name}
        </option>
      ))}
    </select>
  );
}
```

---

## 🌍 Multi-Language Support

### How It Works
Cities have 3 name fields:
- `name` - English (required)
- `nameGu` - Gujarati (optional)
- `nameHi` - Hindi (optional)

### Using in Components
```jsx
import { useLanguage } from '../../context/Language/LanguageContext';
import { useCity } from '../../context/CityContext';

function CityDisplay() {
  const { language } = useLanguage(); // 'en', 'gu', 'hi'
  const { currentCity } = useCity();
  
  const getCityName = () => {
    if (language === 'gu' && currentCity.nameGu) return currentCity.nameGu;
    if (language === 'hi' && currentCity.nameHi) return currentCity.nameHi;
    return currentCity.name; // Fallback to English
  };
  
  return <h1>{getCityName()}</h1>;
}
```

---

## 📊 Default Cities

On first load, if no cities exist in Firebase, these defaults are created:

| ID | English | Gujarati | Hindi |
|----|---------|----------|-------|
| `vadodara` | Vadodara | વડોદરા | वडोदरा |
| `surat` | Surat | સુરત | सूरत |
| `rajkot` | Rajkot | રાજકોટ | राजकोट |

---

## ❓ FAQ

### Q: Can I change a city's ID after creation?
**A:** No. The City ID is generated from the English name and cannot be changed. This prevents breaking links to existing content.

### Q: What happens to posts if I delete a city?
**A:** Posts remain in Firebase under `cities/{cityId}/posts`. They just won't appear in the Content Manager until you re-add the city with the same ID.

### Q: Can I upload SVG logos?
**A:** No, currently only PNG, JPG, JPEG, and WebP are supported. Convert SVG to PNG for best results.

### Q: How do I bulk-add cities?
**A:** Currently, cities must be added one by one through the UI. For bulk import, contact the developer for a Firebase import script.

### Q: Is there a limit on number of cities?
**A:** No hard limit, but performance may degrade with 50+ cities. Consider regional grouping for large-scale deployments.

### Q: Can contributors add cities?
**A:** No, only users with `role: 'admin'` can access City Management.

---

## 🐛 Troubleshooting

### Logo Not Uploading
1. Check file size (must be < 2MB)
2. Verify file format (PNG/JPG)
3. Check Firebase Storage CORS settings
4. Ensure Firebase Storage rules allow admin writes

### City Not Appearing in Selectors
1. Refresh the page (cities auto-sync)
2. Check browser console for errors
3. Verify city exists in Firebase: `cities-config/{cityId}`
4. Ensure `CityContext` is properly initialized

### Changes Not Syncing
1. `CityContext` uses Firebase real-time listeners
2. Changes should be instant (< 1 second)
3. If not syncing, check Firebase connection status
4. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

## 🔐 Security Notes

### Firebase Rules Required
```json
{
  "rules": {
    "cities-config": {
      ".read": true,
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    }
  }
}
```

### Storage Rules Required
```
service firebase.storage {
  match /b/{bucket}/o {
    match /city-logos/{filename} {
      allow read: if true;
      allow write: if request.auth != null && 
                   request.resource.size < 2 * 1024 * 1024 &&
                   request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 🚀 Next Steps

1. Add your cities through the City Management panel
2. Upload logos for branding consistency
3. Cities automatically appear in all components
4. Test by creating posts in different cities
5. Monitor analytics by city in the Dashboard

---

## 📞 Support

For issues or feature requests:
- Check console for errors
- Verify Firebase configuration
- Review this guide's Troubleshooting section
- Contact: admin@ourvadodara.com

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Component**: `src/components/Admin/CityManagement.jsx`
