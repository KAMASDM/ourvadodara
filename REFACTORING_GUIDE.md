# Our Vadodara - Major Refactoring Guide

## Completed Tasks ✅

### Phase 1: Security, Dependencies & Code Quality
- ✅ **Dependencies Updated**: Firebase 10.12.2 and React 19.1.1 already at latest versions
- ✅ **Firebase Security Fixed**: Removed hardcoded credentials from `firebase-config.js`
- ✅ **Unstable Keys Fixed**: Removed `Date.now()` from list keys in `EnhancedNewsFeed.jsx`

### Phase 2: Project Cleanup
- ✅ **Redundant Files Deleted**:
  - `src/pages/Home/HomePage_old.jsx`
  - `src/components/Events/EventsCalendar_Broken.jsx`
  - `src/assets/react.svg`
  - `src/components/Admin/CommentManagement.jsx`
  - `src/components/Admin/PostManager.jsx`
  - `src/components/Post/CreatePost.jsx`

- ✅ **Admin Panel Consolidated**: Updated `AdminLayout.jsx` navigation

## Remaining Tasks 📋

### Phase 2: Auth Consolidation (SKIP for now - working as-is)

**Note**: The current two-context architecture (AuthContext + SimpleEnhancedAuth) is working. Consolidating requires extensive refactoring of 20+ files. Recommend leaving as-is unless causing issues.

### Phase 3: React Router Implementation (HIGH PRIORITY)

#### Step 1: Update App.jsx with Router

Replace the current state-based navigation in `App.jsx` with react-router-dom:

```jsx
import { createBrowserRouter, RouterProvider, Outlet, useNavigate } from 'react-router-dom';

// Create RootLayout component
function RootLayout() {
  const { user } = useEnhancedAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    if (['profile', 'admin'].includes(tab) && !user) {
      setShowLogin(true);
      return false;
    }
    return true;
  };

  return (
    <>
      <Header 
        onNotificationClick={() => setShowNotifications(true)}
        onLoginClick={() => setShowLogin(true)}
      />
      <main className="max-w-md mx-auto pb-20 pt-16 px-4">
        <Outlet /> {/* Render matched route */}
      </main>
      <Navigation onTabChange={handleTabChange} />
      
      <InstallPrompt />
      <NotificationCenter 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      {showLogin && <EnhancedLogin onClose={() => setShowLogin(false)} />}
    </>
  );
}

// Define routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "events", element: <EventsCalendar /> },
      { path: "reels", element: <ReelsPage /> },
      { path: "breaking", element: <BreakingNewsView /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "saved", element: <SavedPosts /> },
      { path: "search", element: <SearchPage /> },
    ]
  },
  { path: "/post/:postId", element: <NewsDetailPage /> },
  { path: "/admin/*", element: <AdminDashboard /> },
  { path: "/event/:eventId/scanqr", element: <EventQRScanner /> },
  { path: "/setup/firebase", element: <FirebaseSetup /> },
  { path: "/setup/admin-upgrade", element: <AdminUpgrade /> },
]);

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  
  useEffect(() => {
    initPWA();
    registerServiceWorker();
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return <RouterProvider router={router} />;
}
```

#### Step 2: Update Navigation.jsx

Replace buttons with NavLink:

```jsx
import { NavLink } from 'react-router-dom';

const Navigation = ({ onTabChange }) => {
  return (
    <nav className="...">
      <NavLink
        to="/"
        onClick={(e) => { if (!onTabChange('home')) e.preventDefault(); }}
        className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-accent' : 'text-gray-600'}`}
      >
        <Home />
        <span>Home</span>
      </NavLink>
      
      <NavLink to="/events" className={({ isActive }) => `...`}>
        <Calendar />
        <span>Events</span>
      </NavLink>
      
      {/* Repeat for other nav items */}
    </nav>
  );
};
```

#### Step 3: Update NewsDetailPage.jsx

Use `useParams` instead of props:

```jsx
import { useParams, useNavigate } from 'react-router-dom';

const NewsDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  // Use postId instead of prop
  useEffect(() => {
    // Fetch post data using postId
  }, [postId]);
  
  const handleBack = () => navigate(-1);
  
  // ... rest of component
};
```

### Phase 4: UI/Theme & Accessibility

#### Update src/index.css

Replace entire file with new theme system:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-background: 249 250 251;
    --color-card: 255 255 255;
    --color-text-primary: 17 24 39;
    --color-text-secondary: 75 85 99;
    --color-border: 229 231 235;
    --color-primary: 59 130 246;
    --color-accent: 239 68 68;
  }
  .dark:root {
    --color-background: 17 24 39;
    --color-card: 31 41 55;
    --color-text-primary: 243 244 246;
    --color-text-secondary: 156 163 175;
    --color-border: 55 65 81;
    --color-primary: 96 165 250;
    --color-accent: 248 113 113;
  }
  body {
    @apply bg-background text-text-primary;
  }
}

@layer components {
  .card {
    @apply bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow;
  }
}
```

#### Apply Theme Classes

In EnhancedNewsFeed.jsx, PostCard:
```jsx
<article className="bg-card border-b border-card">
```

In HomePage.jsx:
```jsx
<div className="bg-background">
```

#### Add Accessibility Labels

Search for all icon-only buttons and add aria-labels:

```jsx
// Example
<button aria-label="More options">
  <MoreVertical className="w-4 h-4" />
</button>

<button aria-label="Close modal">
  <X className="w-6 h-6" />
</button>
```

### Phase 5: Multi-City Architecture (CRITICAL FEATURE)

#### Step 1: Create CityContext

Create `src/context/CityContext.jsx`:

```jsx
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

const CityContext = createContext();

export const CITIES = [
  { id: 'vadodara', name: 'Vadodara' },
  { id: 'surat', name: 'Surat' },
  { id: 'rajkot', name: 'Rajkot' }
];

export const CityProvider = ({ children }) => {
  const [currentCity, setCurrentCity] = useState(() => {
    try {
      const storedCity = localStorage.getItem('appCity');
      if (storedCity) {
        const parsed = JSON.parse(storedCity);
        return CITIES.find(c => c.id === parsed.id) || CITIES[0];
      }
    } catch (e) {
      // Fallback to default
    }
    return CITIES[0];
  });

  useEffect(() => {
    localStorage.setItem('appCity', JSON.stringify(currentCity));
  }, [currentCity]);

  const value = useMemo(() => ({
    currentCity,
    setCurrentCity,
    cities: CITIES
  }), [currentCity]);

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};
```

#### Step 2: Update App.jsx

Wrap with CityProvider:

```jsx
import { CityProvider } from './context/CityContext';

<ToastProvider>
  <CityProvider>
    <RouterProvider router={router} />
  </CityProvider>
</ToastProvider>
```

#### Step 3: Update Header.jsx

Add city selector:

```jsx
import { useCity, CITIES } from '../context/CityContext';

const Header = ({ ... }) => {
  const { currentCity, setCurrentCity, cities } = useCity();
  
  return (
    <header>
      {/* ... other header content ... */}
      
      <select
        value={currentCity.id}
        onChange={(e) => {
          const newCity = cities.find(c => c.id === e.target.value);
          if (newCity) setCurrentCity(newCity);
        }}
        className="appearance-none bg-transparent px-2 py-1 rounded"
        aria-label="Select city"
      >
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </header>
  );
};
```

#### Step 4: Update useRealtimeData Hook

Modify `src/hooks/useRealtimeData.js`:

```jsx
import { useCity } from '../context/CityContext';

export const useRealtimeData = (collectionName) => {
  const { currentCity } = useCity();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const path = `cities/${currentCity.id}/${collectionName}`;
    const dataRef = ref(db, path);
    
    const unsubscribe = onValue(dataRef, (snapshot) => {
      setData(snapshot.val());
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentCity.id, collectionName]); // Refetch when city changes

  return { data, isLoading };
};
```

#### Step 5: Update All Admin Panels

In CreatePost.jsx, ContentManagement.jsx, EnhancedEventManagement.jsx, etc:

```jsx
import { CITIES, useCity } from '../../context/CityContext';

const CreatePost = () => {
  const [selectedCity, setSelectedCity] = useState(CITIES[0].id);
  
  // Add city selector at top of form
  <select
    value={selectedCity}
    onChange={(e) => setSelectedCity(e.target.value)}
    className="w-full p-2 mb-4 border rounded"
  >
    {CITIES.map(city => (
      <option key={city.id} value={city.id}>{city.name}</option>
    ))}
  </select>
  
  // Update all Firebase paths
  const handlePublish = async () => {
    const postsRef = ref(db, `cities/${selectedCity}/posts`);
    await push(postsRef, postData);
  };
};
```

### Phase 6: User Profile Enhancement

#### Update adminSetup.js

```jsx
const createUserProfile = async (uid, userData) => {
  const defaultData = {
    email: userData.email,
    role: 'user',
    displayName: userData.displayName || 'User',
    createdAt: new Date().toISOString(),
    permissions: {},
    profile: {
      bloodGroup: '',
      dateOfBirth: '',
      location: '',
      phoneNumber: userData.phoneNumber || ''
    }
  };
  // ... rest
};
```

#### Update ProfilePage.jsx

Add editable profile with blood group:

```jsx
import { useState, useEffect } from 'react';
import { ref, update, get } from 'firebase/database';
import { db } from '../../firebase-config';
import { useCity } from '../../context/CityContext';
import pushNotificationService from '../../utils/pushNotifications';

const ProfilePage = () => {
  const { user } = useAuth();
  const { currentCity } = useCity();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    phoneNumber: '',
    bloodGroup: '',
    dateOfBirth: '',
    location: ''
  });
  const [initialProfile, setInitialProfile] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      const profileRef = ref(db, `users/${user.uid}/profile`);
      get(profileRef).then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setProfileData(data);
          setInitialProfile(data);
        }
      });
    }
  }, [user?.uid]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const profileRef = ref(db, `users/${user.uid}/profile`);
      await update(profileRef, profileData);

      // Handle Blood SOS topic subscription
      const oldBloodGroup = initialProfile?.bloodGroup;
      const newBloodGroup = profileData.bloodGroup;
      const cityId = currentCity.id;

      if (oldBloodGroup !== newBloodGroup) {
        if (oldBloodGroup) {
          const oldTopic = `SOS_${cityId}_${oldBloodGroup.replace('+', 'pos').replace('-', 'neg')}`;
          await pushNotificationService.unsubscribeFromTopic(oldTopic);
        }
        if (newBloodGroup) {
          const newTopic = `SOS_${cityId}_${newBloodGroup.replace('+', 'pos').replace('-', 'neg')}`;
          await pushNotificationService.subscribeToTopic(newTopic);
        }
      }

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setInitialProfile(profileData);
    } catch (err) {
      toast.error('Failed to update profile.');
    }
  };

  return (
    <div>
      {isEditing ? (
        <form>
          {/* Blood Group Selector */}
          <label>Blood Group</label>
          <select 
            value={profileData.bloodGroup} 
            onChange={(e) => setProfileData(p => ({...p, bloodGroup: e.target.value}))}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Blood Group...</option>
            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
          
          {/* Other fields: location, DOB, phone */}
          
          <button onClick={handleSaveProfile}>Save Profile</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      ) : (
        <div>
          <p>Blood Group: {profileData.bloodGroup || 'Not set'}</p>
          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};
```

### Phase 7: Blood SOS Feature

#### Step 1: Update pushNotifications.js

Add unsubscribe method:

```jsx
async unsubscribeFromTopic(topic) {
  const token = await this.getToken();
  if (token) {
    await fetch('/api/fcm/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, topics: [topic] })
    });
  }
}
```

#### Step 2: Create BloodSOSModal

Create `src/components/BloodSOS/BloodSOSModal.jsx`:

```jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useCity } from '../../context/CityContext';
import { db } from '../../firebase-config';
import { ref, push, serverTimestamp } from 'firebase/database';
import { useToast } from '../Common/Toast';
import { Heart, X, Send } from 'lucide-react';

const BloodSOSModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { currentCity } = useCity();
  const toast = useToast();
  const [formData, setFormData] = useState({
    bloodGroup: '',
    location: '',
    hospitalName: '',
    contactNumber: '',
    details: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendSOS = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to send an SOS.');
      return;
    }
    if (!formData.bloodGroup || !formData.location || !formData.hospitalName || !formData.contactNumber) {
      toast.error('Please fill all required fields.');
      return;
    }
    setLoading(true);

    const sosRequest = {
      bloodGroup: formData.bloodGroup,
      location: formData.location,
      hospital: formData.hospitalName,
      contact: formData.contactNumber,
      details: formData.details,
      cityId: currentCity.id,
      requestedBy: user.uid,
      requestedByName: user.displayName || user.email,
      timestamp: serverTimestamp(),
      status: 'pending'
    };

    try {
      const sosRef = ref(db, `bloodSOSRequests/${currentCity.id}`);
      await push(sosRef, sosRequest);

      toast.success('SOS Request Sent!');
      toast.info('Users in your city with this blood group are being notified.');
      setLoading(false);
      onClose();
    } catch (err) {
      toast.error('Failed to send SOS request.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-card">
          <h2 className="text-xl font-bold text-accent flex items-center">
            <Heart className="mr-2" /> Blood SOS Request
          </h2>
          <button onClick={onClose} aria-label="Close modal">
            <X />
          </button>
        </div>
        <form onSubmit={handleSendSOS} className="p-4 space-y-4">
          <p className="text-sm text-secondary">
            This will send a push notification to all users in {currentCity.name} who match the required blood group.
          </p>
          
          {/* Blood Group */}
          <div>
            <label className="block text-sm font-medium text-primary">Blood Group*</label>
            <select 
              value={formData.bloodGroup} 
              onChange={(e) => setFormData(p => ({...p, bloodGroup: e.target.value}))} 
              className="w-full mt-1 p-2 border border-card rounded" 
              required
            >
              <option value="">Select Blood Group...</option>
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
          
          {/* Hospital Name */}
          <div>
            <label className="block text-sm font-medium text-primary">Hospital Name*</label>
            <input 
              type="text" 
              value={formData.hospitalName} 
              onChange={(e) => setFormData(p => ({...p, hospitalName: e.target.value}))} 
              className="w-full mt-1 p-2 border border-card rounded" 
              required 
            />
          </div>
          
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-primary">Location / Area*</label>
            <input 
              type="text" 
              value={formData.location} 
              onChange={(e) => setFormData(p => ({...p, location: e.target.value}))} 
              className="w-full mt-1 p-2 border border-card rounded" 
              placeholder="e.g., Alkapuri" 
              required 
            />
          </div>
          
          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-primary">Contact Number*</label>
            <input 
              type="tel" 
              value={formData.contactNumber} 
              onChange={(e) => setFormData(p => ({...p, contactNumber: e.target.value}))} 
              className="w-full mt-1 p-2 border border-card rounded" 
              required 
            />
          </div>
          
          <div className="bg-red-50 border border-red-200 p-3 rounded-md">
            <h4 className="font-semibold text-red-700">Backend Required</h4>
            <p className="text-sm text-red-600">
              Note: Sending the push notification requires a Firebase Function to listen for writes on `/bloodSOSRequests` and trigger FCM. This form only saves the request to the database.
            </p>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-accent text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : <><Send className="w-4 h-4" /> Send SOS Request</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BloodSOSModal;
```

#### Step 3: Add SOS Button to Header

In `Header.jsx`:

```jsx
import { useState } from 'react';
import BloodSOSModal from '../BloodSOS/BloodSOSModal';
import { Heart } from 'lucide-react';

const Header = ({ ... }) => {
  const [showSOSModal, setShowSOSModal] = useState(false);
  
  return (
    <header>
      {/* ... other header content ... */}
      
      <button
        onClick={() => setShowSOSModal(true)}
        className="p-2 bg-accent text-white rounded-lg transition-colors duration-200 animate-pulse"
        title="Blood SOS Request"
        aria-label="Send Blood SOS request"
      >
        <Heart className="w-5 h-5" />
      </button>
      
      {showSOSModal && (
        <BloodSOSModal 
          isOpen={showSOSModal} 
          onClose={() => setShowSOSModal(false)} 
        />
      )}
    </header>
  );
};
```

## Firebase Backend Setup Required

To make the Blood SOS feature fully functional, you need to create a Firebase Cloud Function:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendBloodSOSNotification = functions.database
  .ref('/bloodSOSRequests/{cityId}/{requestId}')
  .onCreate(async (snapshot, context) => {
    const sosRequest = snapshot.val();
    const { bloodGroup, hospital, location, cityId, requestedByName } = sosRequest;
    
    // Format topic name (e.g., SOS_vadodara_Apos for A+ blood group)
    const topicName = `SOS_${cityId}_${bloodGroup.replace('+', 'pos').replace('-', 'neg')}`;
    
    const message = {
      notification: {
        title: `🆘 Blood Emergency - ${bloodGroup} Needed`,
        body: `${hospital}, ${location}. Requested by ${requestedByName}. Tap to view details.`,
      },
      data: {
        type: 'blood_sos',
        bloodGroup,
        hospital,
        location,
        cityId,
        requestId: context.params.requestId
      },
      topic: topicName
    };
    
    try {
      const response = await admin.messaging().send(message);
      console.log('Blood SOS notification sent:', response);
      
      // Update request status
      await snapshot.ref.update({ notificationSent: true, sentAt: admin.database.ServerValue.TIMESTAMP });
      
      return response;
    } catch (error) {
      console.error('Error sending Blood SOS notification:', error);
      await snapshot.ref.update({ notificationError: error.message });
      throw error;
    }
  });
```

## Testing Checklist

- [ ] Test navigation with react-router-dom
- [ ] Test city switching and data filtering
- [ ] Test profile editing and blood group selection
- [ ] Test Blood SOS modal submission
- [ ] Test accessibility with screen reader
- [ ] Test theme switching (light/dark)
- [ ] Test on mobile devices
- [ ] Test admin panel with city selector
- [ ] Verify Firebase paths are city-scoped

## Notes

- **Console.logs**: Over 100+ console.log statements remain. Consider using a script to remove them or replace with proper logging library.
- **Auth Consolidation**: Skipped due to complexity. Current two-context approach works but could be cleaner.
- **Performance**: The city-scoped data will improve performance by reducing data fetched.
- **Scalability**: Easy to add more cities by updating the CITIES array.

## Priority Order for Implementation

1. **Phase 5 (Multi-City)** - Most impactful feature
2. **Phase 3 (Router)** - Better architecture
3. **Phase 7 (Blood SOS)** - Unique social feature
4. **Phase 4 (Theme/A11y)** - UX improvements
5. **Phase 6 (Profile)** - Supports Blood SOS

---

**Last Updated**: October 30, 2025
