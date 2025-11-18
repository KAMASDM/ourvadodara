# Project Architecture - Our Vadodara News

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Core Systems](#core-systems)
5. [Feature Modules](#feature-modules)
6. [Data Flow](#data-flow)
7. [Authentication & Authorization](#authentication--authorization)
8. [State Management](#state-management)
9. [Component Hierarchy](#component-hierarchy)
10. [Database Schema](#database-schema)
11. [PWA & Performance](#pwa--performance)
12. [Internationalization](#internationalization)
13. [Theme System](#theme-system)
14. [Analytics & Monitoring](#analytics--monitoring)
15. [Security](#security)
16. [Deployment](#deployment)

---

## 📊 Executive Summary

**Our Vadodara News** is a modern, full-featured Progressive Web Application (PWA) for local news delivery with real-time updates, multi-city support, and comprehensive content management.

### Key Metrics
- **Lines of Code**: ~25,000+ across 222 JSX components
- **Components**: 100+ React components
- **Languages Supported**: 3 (English, Hindi, Gujarati)
- **Cities Supported**: Dynamic (Firebase-managed)
- **User Roles**: Admin, User, Guest
- **Post Types**: Standard, Stories, Reels, Carousels

### Core Features
- ✅ Real-time news feed with Firebase integration
- ✅ Multi-language support (i18next)
- ✅ Progressive Web App with offline support
- ✅ Admin dashboard with analytics
- ✅ Event management with QR code registration
- ✅ Blood donation SOS system
- ✅ Breaking news management
- ✅ Polls and voting
- ✅ Weather integration
- ✅ Instagram-style media viewer
- ✅ Push notifications
- ✅ Email/Phone verification
- ✅ Today's News Roundup (AI-powered)

---

## 🛠 Technology Stack

### Frontend Framework
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^7.9.3"
}
```

### Build Tool
- **Vite** 7.1.12 (rolldown-vite)
- Lightning-fast HMR (Hot Module Replacement)
- Optimized production builds
- Plugin ecosystem for PWA

### Backend Services (Firebase)
```json
{
  "firebase": "^10.12.2"
}
```

**Firebase Services Used:**
- **Authentication**: Email/Password, Google OAuth, Phone OTP, Anonymous
- **Realtime Database**: All application data
- **Cloud Storage**: Images, videos, media files
- **Cloud Messaging (FCM)**: Push notifications
- **Analytics**: User behavior tracking

### Styling
```json
{
  "tailwindcss": "^3.4.17",
  "postcss": "^8.4.49",
  "autoprefixer": "^10.4.20"
}
```

**Custom Design System:**
- Ivory Light Theme (warmBrown palette)
- Dark Theme (primary palette)
- Instagram-style card layouts
- Glassmorphism effects
- Custom animations

### Internationalization
```json
{
  "i18next": "^25.5.2",
  "react-i18next": "^16.0.0",
  "i18next-browser-languagedetector": "^8.0.2"
}
```

### UI Components & Icons
```json
{
  "lucide-react": "^0.544.0",
  "react-icons": "^5.5.0"
}
```

### Utilities
```json
{
  "date-fns": "^4.1.0",
  "axios": "^1.7.9",
  "qrcode": "^1.5.4",
  "html5-qrcode": "^2.3.8",
  "js-cookie": "^3.0.5"
}
```

### PWA
```json
{
  "vite-plugin-pwa": "^1.0.3",
  "workbox-sw": "^7.3.0"
}
```

---

## 🏗 Application Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   User Interface                     │
│  (React Components - Instagram-style Design)        │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Context Providers Layer                 │
│  Auth • Theme • Language • City • BloodSOS • Toast  │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Custom Hooks Layer                      │
│  useRealtimeData • useAuth • useLanguage            │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Firebase Services                       │
│  Auth • Realtime DB • Storage • Messaging           │
└─────────────────────────────────────────────────────┘
```

### Application Entry Point

**`src/main.jsx`**
```javascript
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- Registers Service Worker for PWA
- Mounts root React component
- Initializes strict mode for development

### Main Application Component

**`src/App.jsx`** (372 lines)

**Context Provider Hierarchy:**
```jsx
<ErrorBoundary>
  <AuthProvider>
    <EnhancedAuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <CityProvider>
            <BloodSOSProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </BloodSOSProvider>
          </CityProvider>
        </LanguageProvider>
      </ThemeProvider>
    </EnhancedAuthProvider>
  </AuthProvider>
</ErrorBoundary>
```

**View Types:**
- `home` - Main news feed
- `news-detail` - Article detail page
- `events` - Events calendar
- `profile` - User profile
- `admin` - Admin dashboard
- `breaking` - Breaking news (admin manage / user view)
- `saved` - Bookmarked posts
- `reels` - Short video viewer
- `qr-scanner` - Event QR code scanner
- `firebase-setup` - Guided Firebase setup
- `admin-upgrade` - Admin role upgrade
- `notifications-settings` - Notification preferences

**State Management:**
```javascript
const [activeTab, setActiveTab] = useState('home')
const [currentView, setCurrentView] = useState({ type: 'home', data: null })
const [showNotifications, setShowNotifications] = useState(false)
const [showLogin, setShowLogin] = useState(false)
const [showSplash, setShowSplash] = useState(true)
const [showGuestPrompt, setShowGuestPrompt] = useState(false)
const [showFirebaseSetup, setShowFirebaseSetup] = useState(false)
```

**Navigation System:**
- URL-based routing with `window.history.pushState`
- Path parsing with URLSearchParams
- Support for deep linking to posts (`/post/:id`)
- Admin routes (`/?admin=upgrade`)
- Setup routes (`/?setup=firebase`)
- QR scanner routes (`/*/scanqr`)

**Layout Responsiveness:**
- Full-width views: admin, firebase-setup, qr-scanner
- Constrained views: max-w-2xl with responsive padding
- Dynamic class application based on view type

---

## 🔐 Core Systems

### 1. Authentication System

**`src/context/Auth/AuthContext.jsx`** (240 lines)

**Supported Authentication Methods:**
1. **Email/Password** - Traditional signup with email verification
2. **Google OAuth** - One-click Google login
3. **Phone OTP** - SMS-based authentication with reCAPTCHA
4. **Anonymous** - Guest mode for browsing

**Authentication Flow:**
```javascript
// Firebase Auth State Listener
onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
  if (firebaseUser) {
    // Load user profile from Realtime DB
    let userProfile = await getUserProfile(firebaseUser.uid)
    
    // Create profile if doesn't exist
    if (!userProfile) {
      await createUserProfile(firebaseUser.uid, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        authMethod: getAuthMethod(firebaseUser),
        authPhone: getAuthContactInfo(firebaseUser).phone,
        authEmail: getAuthContactInfo(firebaseUser).email
      })
    }
    
    // Check profile completion
    const completionStatus = checkProfileCompletion(userProfile)
    setProfileCompletion(completionStatus)
    
    // Set user object with role and permissions
    setUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      role: userProfile?.role || 'user',
      permissions: userProfile?.permissions || {},
      profileComplete: completionStatus.isComplete
    })
  } else {
    setUser(null)
  }
})
```

**User Object Schema:**
```typescript
interface User {
  uid: string
  email: string | null
  phoneNumber: string | null
  displayName: string
  photoURL: string | null
  emailVerified: boolean
  isAnonymous: boolean
  role: 'admin' | 'user' | 'guest'
  permissions: object
  authMethod: 'email' | 'phone' | 'google' | 'anonymous'
  authPhone: string | null
  authEmail: string | null
  profileComplete: boolean
}
```

**Profile Completion Tracking:**
```javascript
// utils/profileHelpers.js
checkProfileCompletion(userProfile) {
  const required = ['displayName', 'email', 'phoneNumber', 'city']
  const missing = required.filter(field => !userProfile[field])
  
  return {
    isComplete: missing.length === 0,
    missingFields: missing
  }
}
```

**Email Verification System:**
- Modal popup after signup
- Real-time polling (3-second intervals) for verification status
- Resend cooldown (60 seconds)
- Direct link to email inbox
- Automatic verification status tracking

**Phone Verification System:**
- reCAPTCHA Enterprise integration
- OTP code generation and validation
- 6-digit numeric code
- 60-second resend cooldown
- Firebase Phone Authentication

**Cross-Verification:**
- Email users can add phone number
- Phone users can add email
- Protected verified fields (readonly with shield badge)

**Context Methods:**
```javascript
{
  user,                      // Current user object
  loading,                   // Auth state loading
  signIn,                    // Email/password login
  signUp,                    // Email/password signup
  signInWithGoogle,          // Google OAuth
  logout,                    // Sign out
  createAdmin,               // Create admin user
  isAdmin,                   // Check admin role
  profileCompletion,         // Profile status
  refreshProfileCompletion   // Re-check profile
}
```

### 2. Theme System

**`src/context/Theme/ThemeContext.jsx`** (55 lines)

**Theme Modes:**
- **Light Mode** - Ivory color palette (warmBrown accents)
- **Dark Mode** - Primary color palette

**Theme Configuration:**
```javascript
// tailwind.config.js
colors: {
  ivory: {
    50: '#fffef9',
    100: '#fffcf0',
    200: '#fff9e0',
    300: '#fff3c7',
    400: '#ffe9a3',
    500: '#ffd97d',
    600: '#f5c55a',
    700: '#e0aa3a',
    800: '#c28920',
    900: '#c2ae70'
  },
  warmBrown: {
    50: '#faf8f5',
    100: '#f5f1eb',
    200: '#e8dfd2',
    300: '#d4c3ab',
    400: '#bca182',
    500: '#a8926f',  // Main accent color
    600: '#8d7556',
    700: '#6f5c43',
    800: '#584a37',
    900: '#443a2f'
  }
}
```

**Custom Utility Classes:**
```css
/* src/index.css */
.bg-ivory-gradient {
  background: linear-gradient(135deg, #fffef9 0%, #fff9e0 100%);
}

.shadow-ivory {
  box-shadow: 0 2px 8px rgba(194, 174, 112, 0.15);
}

.card-ivory-glass {
  background: rgba(255, 254, 249, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(212, 195, 171, 0.2);
}

.text-gradient-ivory {
  background: linear-gradient(135deg, #a8926f 0%, #c2ae70 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

**Theme Toggle:**
```javascript
const { theme, toggleTheme, isDark } = useTheme()

// Automatically applies/removes 'dark' class to <html>
```

**LocalStorage Persistence:**
- Theme preference saved to `localStorage.getItem('theme')`
- Automatically applied on app load
- Default: Dark mode

### 3. Multi-Language System

**`src/context/Language/LanguageContext.jsx`** (45 lines)

**Supported Languages:**
1. **English (en)** - Default
2. **Hindi (hi)** - हिन्दी
3. **Gujarati (gu)** - ગુજરાતી

**i18next Configuration:**
```javascript
// src/utils/i18n.js
i18n
  .use(LanguageDetector)  // Auto-detect browser language
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { ... } },
      hi: { translation: { ... } },
      gu: { translation: { ... } }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })
```

**Translation Keys:**
```javascript
{
  // Navigation
  home: 'Home',
  search: 'Search',
  profile: 'Profile',
  admin: 'Admin',
  
  // Common
  loading: 'Loading...',
  error: 'Something went wrong',
  share: 'Share',
  like: 'Like',
  comment: 'Comment',
  
  // App specific
  appName: 'Our Vadodara',
  breaking: 'Breaking News',
  trending: 'Trending',
  
  // Auth
  auth: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    // ... 20+ more auth keys
  }
}
```

**Usage in Components:**
```javascript
const { t } = useTranslation()
<button>{t('auth.signIn')}</button>  // "Sign In"
```

**Language Switching:**
```javascript
const { currentLanguage, changeLanguage } = useLanguage()
changeLanguage('hi')  // Switch to Hindi
```

**LocalStorage Persistence:**
- Language saved to `localStorage.getItem('language')`
- Applied on mount

### 4. Multi-City System

**`src/context/CityContext.jsx`** (96 lines)

**Dynamic City Loading:**
```javascript
// Load cities from Firebase: /cities-config
useEffect(() => {
  const citiesRef = ref(db, 'cities-config')
  const unsubscribe = onValue(citiesRef, (snapshot) => {
    if (snapshot.exists()) {
      const citiesData = snapshot.val()
      const citiesArray = Object.entries(citiesData).map(([id, data]) => ({
        id,
        name: data.name,
        nameGu: data.nameGu,
        nameHi: data.nameHi,
        logoUrl: data.logoUrl || '',
        description: data.description
      }))
      setCities(citiesArray.sort((a, b) => a.name.localeCompare(b.name)))
    } else {
      setCities(DEFAULT_CITIES)
    }
  })
  return () => unsubscribe()
}, [])
```

**City Schema:**
```typescript
interface City {
  id: string            // 'vadodara'
  name: string          // 'Vadodara'
  nameGu: string        // 'વડોદરા'
  nameHi: string        // 'वडोदरा'
  logoUrl: string       // City logo URL
  description: string   // Brief description
}
```

**Default Cities:**
```javascript
const DEFAULT_CITIES = [
  { id: 'vadodara', name: 'Vadodara', logoUrl: '' },
  { id: 'surat', name: 'Surat', logoUrl: '' },
  { id: 'rajkot', name: 'Rajkot', logoUrl: '' }
]
```

**City-Scoped Data:**
```javascript
// useRealtimeData hook with city scope
const { data } = useRealtimeData('posts', {
  scope: 'city',           // 'city' | 'global' | 'auto'
  fallbackToGlobal: true,  // Use global if city data empty
  cityId: 'vadodara'       // Optional override
})

// Resolves to: cities/vadodara/posts
```

**LocalStorage:**
- Current city saved as JSON object
- Restored on app load

---

## 🔄 Data Flow

### Real-Time Data Hook

**`src/hooks/useRealtimeData.js`** (124 lines)

**Purpose:** Reusable hook for Firebase Realtime Database subscriptions with city-scoping

**Features:**
- Automatic city-scoped paths
- Fallback to global data
- Real-time updates
- Loading and error states
- Source tracking (primary/fallback)
- Debug logging

**Usage:**
```javascript
const { data, isLoading, error, source } = useRealtimeData('posts', {
  scope: 'auto',           // 'auto' | 'city' | 'global'
  fallbackToGlobal: true,  // Fallback if city data empty
  cityId: null,            // Override current city
  debug: false             // Enable console logs
})
```

**Path Resolution:**
```javascript
// scope='city', cityId='vadodara', collectionName='posts'
primaryPath = 'cities/vadodara/posts'
fallbackPath = 'posts'  // if fallbackToGlobal=true

// scope='global'
primaryPath = 'posts'
fallbackPath = null
```

**Return Values:**
```typescript
{
  data: object | null,           // Firebase snapshot data
  isLoading: boolean,            // Loading state
  error: Error | null,           // Error object
  source: 'primary' | 'fallback' | 'empty' | 'error' | 'none'
}
```

**Example - Posts Feed:**
```javascript
// Component
const { data: postsData, isLoading } = useRealtimeData('posts', {
  scope: 'auto',
  fallbackToGlobal: true
})

// Data Structure
{
  'post123': {
    id: 'post123',
    title: 'News Title',
    content: 'News content...',
    likes: 42,
    createdAt: '2024-01-15T10:30:00Z'
  },
  'post456': { ... }
}
```

### Database Write Operations

**Helper Functions in `src/utils/databaseSchema.js`**

**Create Post:**
```javascript
export const createPost = async (postData, userId) => {
  const postsRef = ref(db, 'posts')
  const newPostRef = push(postsRef)
  
  const post = {
    ...postData,
    id: newPostRef.key,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    status: 'draft'
  }
  
  await set(newPostRef, post)
  return { success: true, id: newPostRef.key }
}
```

**Update Post:**
```javascript
export const updatePost = async (postId, updates) => {
  const postRef = ref(db, `posts/${postId}`)
  await update(postRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  })
}
```

**Delete Post:**
```javascript
export const deletePost = async (postId) => {
  const postRef = ref(db, `posts/${postId}`)
  await remove(postRef)
}
```

### Analytics Tracking

**`src/utils/analytics.js`**

**Track Events:**
```javascript
import { analytics } from '../firebase-config'

export const track = (eventName, params = {}) => {
  analytics.track(eventName, {
    ...params,
    timestamp: new Date().toISOString()
  })
}

// Usage
track('post_viewed', { postId: 'post123' })
track('app_start')
track('search_performed', { query: 'vadodara news' })
```

**Session Stats:**
```javascript
export const getSessionStats = () => {
  return {
    sessionDuration: Date.now() - sessionStartTime,
    pagesViewed: pageViews,
    actionsPerformed: actionCount
  }
}
```

---

## 📦 Feature Modules

### 1. News Feed

**`src/pages/Home/HomePage.jsx`** (322 lines)

**Components:**
- `TodaysRoundup` - Daily curated news carousel
- `EnhancedStorySection` - Instagram-style stories
- `BreakingNewsBanner` - Urgent news ticker
- `EnhancedNewsFeed` - Main content feed
- `TrendingTopics` - Popular hashtags
- `WeatherWidget` - Local weather

**Feed Sections:**
```javascript
const sections = [
  { id: 'all', label: 'All News', icon: Newspaper },
  { id: 'top', label: 'Top Stories', icon: TrendingUp },
  { id: 'local', label: 'Local', icon: MapPin },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'polls', label: 'Polls', icon: BarChart }
]
```

**Post Card - Instagram Style:**

**`src/components/Feed/PostCard.jsx`** (321 lines)

**Design Features:**
- Full-width edge-to-edge
- Border top/bottom only (no sides)
- No rounded corners
- Ivory background (`bg-ivory-50`)
- Media full bleed (no padding)
- Double-tap to like
- Heart animation on like
- Natural image aspect ratios

**Card Structure:**
```jsx
<article className="border-y-2 border-warmBrown-200 bg-ivory-50 mb-0">
  {/* Header */}
  <div className="px-4 pt-3">
    <CategoryBadge />
    <h2>{post.title}</h2>
    <AuthorInfo />
  </div>
  
  {/* Media - Full Width */}
  <div className="w-full bg-black">
    <MediaRenderer media={post.media} />
  </div>
  
  {/* Content */}
  <div className="px-4">
    <p>{post.content}</p>
    <Tags tags={post.tags} />
  </div>
  
  {/* Interactions */}
  <div className="px-4 pb-3">
    <LikeButton />
    <CommentButton />
    <ShareButton />
    <BookmarkButton />
  </div>
</article>
```

**Media Renderer:**

**`src/components/Media/MediaRenderer.jsx`** (792 lines)

**Supported Media Types:**
- Single image
- Multiple images (carousel)
- Video (with controls)
- Image + Video mix

**Features:**
- Swipe navigation for carousels
- Lazy loading
- Fullscreen viewer
- Download option
- Play/pause for videos
- Progress indicators

### 2. Today's News Roundup

**`src/components/Feed/TodaysRoundup.jsx`** (394 lines)

**Purpose:** Full-screen carousel showcasing top 10 curated news stories of the day

**Data Source:**
```javascript
// Firebase: /news-roundups/{YYYY-MM-DD}
{
  id: '2024-01-15',
  title: "Today's Top Stories",
  date: '2024-01-15',
  posts: ['post123', 'post456', ...],  // 10 post IDs
  postDetails: {
    'post123': { title: '...', image: '...', category: '...' }
  },
  analytics: { views: 0, clicks: {}, shares: 0 },
  status: 'published',
  isAutoGenerated: true,
  createdAt: '2024-01-15T06:00:00Z'
}
```

**UI Features:**
- Full-screen glassmorphism cards
- Swipe/keyboard navigation
- Progress dots
- Click tracking per post
- Share functionality
- Smooth transitions

**Navigation:**
- Touch swipe (mobile)
- Arrow keys (desktop)
- Progress dot clicks
- Auto-advance option

**Admin Management:**

**`src/components/Admin/RoundupManagement.jsx`** (846 lines)

**Two Modes:**

**1. Auto-Generate:**
```javascript
// AI Scoring Algorithm
const scorePost = (post) => {
  const engagement = (post.likes || 0) * 2 + 
                     (post.comments || 0) * 3 + 
                     (post.shares || 0) * 5
  
  const viewScore = Math.log10((post.views || 0) + 1) * 10
  
  const ageInHours = (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60)
  const recencyBonus = Math.max(0, 24 - ageInHours) * 2
  
  return engagement + viewScore + recencyBonus
}

// Select top 10 posts from last 24 hours
const topPosts = allPosts
  .filter(post => isLast24Hours(post.createdAt))
  .sort((a, b) => scorePost(b) - scorePost(a))
  .slice(0, 10)
```

**2. Manual Selection:**
- Dual panel interface
- Selected posts (left) | Available posts (right)
- Drag to reorder (or move up/down buttons)
- Preview mode before publishing
- Real-time post search
- Category filtering

**Publishing:**
```javascript
const publishRoundup = async () => {
  const roundupData = {
    id: createRoundupId(),  // YYYY-MM-DD
    title: "Today's Top Stories",
    date: new Date().toISOString().split('T')[0],
    posts: selectedPosts.map(p => p.id),
    postDetails: extractPostDetails(selectedPosts),
    analytics: { views: 0, clicks: {}, shares: 0 },
    status: 'published',
    isAutoGenerated: false
  }
  
  await set(ref(db, `news-roundups/${roundupData.id}`), roundupData)
}
```

### 3. Enhanced Dashboard

**`src/components/Admin/EnhancedDashboard.jsx`** (533 lines)

**Real-Time Metrics:**
```javascript
const stats = {
  totalPosts: 0,
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0,
  totalShares: 0,
  engagementRate: 0,
  topPosts: [],
  categoryBreakdown: {}
}
```

**Filters:**

**1. Date Range:**
- Today
- This Week
- This Month
- This Year
- Custom Range (date picker)

**2. Category:**
- All Categories
- Politics
- Sports
- Business
- Technology
- Entertainment
- Local
- (Auto-detected from posts)

**3. Specific Post:**
- Dropdown with post titles
- Shows detailed analytics for single post

**Calculations:**
```javascript
const calculateStats = (posts, filters) => {
  const filteredPosts = posts.filter(post => {
    // Date filter
    const inDateRange = isInDateRange(post.createdAt, filters.dateRange)
    
    // Category filter
    const matchesCategory = filters.category === 'all' || 
                           post.category === filters.category
    
    // Post filter
    const matchesPost = !filters.postId || post.id === filters.postId
    
    return inDateRange && matchesCategory && matchesPost
  })
  
  return {
    totalPosts: filteredPosts.length,
    totalViews: sum(filteredPosts, 'views'),
    totalLikes: sum(filteredPosts, 'likes'),
    totalComments: sum(filteredPosts, 'comments'),
    totalShares: sum(filteredPosts, 'shares'),
    engagementRate: (total_engagement / total_views) * 100,
    topPosts: sortByViews(filteredPosts).slice(0, 5)
  }
}
```

**Category Breakdown:**
```javascript
{
  'politics': { posts: 15, views: 1200, percentage: 25% },
  'sports': { posts: 20, views: 1800, percentage: 37.5% },
  'business': { posts: 10, views: 800, percentage: 16.7% },
  // ...
}
```

**Export Feature:**
```javascript
const handleExportData = () => {
  const exportData = {
    stats,
    filters,
    exportedAt: new Date().toISOString(),
    categoryBreakdown,
    topPosts: stats.topPosts
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analytics-${Date.now()}.json`
  a.click()
}
```

### 4. Events Management

**`src/components/Admin/EnhancedEventManagement.jsx`**

**Event Schema:**
```typescript
interface Event {
  id: string
  title: { en: string, hi: string, gu: string }
  description: { en: string, hi: string, gu: string }
  imageUrl: string
  mediaFiles: string[]
  location: {
    address: string
    coordinates: { lat: number, lng: number }
    venue: string
    city: string
    state: string
  }
  contactInfo: {
    phone: string
    email: string
    website: string
    organizer: string
  }
  dateTime: {
    start: string  // ISO 8601
    end: string
    timezone: string
  }
  category: string
  tags: string[]
  ticketInfo: {
    isFree: boolean
    price: number
    bookingUrl: string
    capacity: number
  }
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  isPublished: boolean
  createdBy: string
  analytics: {
    views: number
    interested: number
    going: number
    shares: number
  }
}
```

**Event Registration:**

**`src/components/Events/EventRegistration.jsx`** (1015 lines)

**Registration Types:**
1. **Free Events** - Direct registration
2. **Paid Events** - External booking URL
3. **QR Code** - On-site check-in with QR scanner

**QR Code Generation:**
```javascript
import QRCode from 'qrcode'

const generateQR = async (registrationId) => {
  const qrData = JSON.stringify({
    type: 'event_registration',
    eventId: event.id,
    registrationId,
    userId: user.uid,
    timestamp: Date.now()
  })
  
  const qrCodeUrl = await QRCode.toDataURL(qrData)
  return qrCodeUrl
}
```

**QR Code Scanner:**

**`src/components/Admin/EventQRScanner.jsx`**

- Uses device camera
- Validates QR data structure
- Checks registration validity
- Marks attendance in Firebase
- Prevents duplicate check-ins

### 5. Blood SOS System

**`src/context/SOS/BloodSOSContext.jsx`**

**SOS Schema:**
```typescript
interface BloodSOS {
  id: string
  userId: string
  userName: string
  userPhone: string
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
  urgency: 'critical' | 'urgent' | 'normal'
  location: {
    city: string
    hospital: string
    address: string
  }
  unitsNeeded: number
  description: string
  status: 'active' | 'fulfilled' | 'cancelled'
  createdAt: string
  expiresAt: string
  respondents: {
    [userId]: {
      name: string
      phone: string
      bloodGroup: string
      respondedAt: string
    }
  }
}
```

**Features:**
- Emergency banner on all pages
- Push notifications to matching blood group users
- Location-based matching
- Auto-expire after 24 hours
- Respondent tracking
- Privacy controls (phone reveal after response)

**`src/components/SOS/BloodSOSBanner.jsx`** (137 lines)

- Fixed top banner when active SOS
- Urgent/Critical visual indicators
- Click to view details and respond
- Real-time status updates

### 6. Breaking News

**`src/components/Breaking/BreakingNewsManager.jsx`** (Admin)

**Breaking News Schema:**
```typescript
interface BreakingNews {
  id: string
  title: { en: string, hi: string, gu: string }
  shortDescription: string
  category: string
  priority: 'urgent' | 'breaking' | 'important'
  isActive: boolean
  expiresAt: string | null  // Auto-deactivate
  createdAt: string
  createdBy: string
  clicks: number
  views: number
}
```

**Admin Features:**
- Create/edit/delete breaking news
- Set expiry time
- Priority levels (affects UI color)
- Multi-language titles
- Analytics (views, clicks)

**`src/components/Breaking/BreakingNewsView.jsx`** (User)

- Scrolling ticker/banner
- Auto-rotate multiple breaking news
- Click to expand full article
- Dismissible

### 7. Polls

**`src/components/Admin/PollManagement.jsx`**

**Poll Schema:**
```typescript
interface Poll {
  id: string
  question: { en: string, hi: string, gu: string }
  description: { en: string, hi: string, gu: string }
  options: Array<{
    id: string
    text: { en: string, hi: string, gu: string }
    votes: number
    voters: string[]  // User IDs
  }>
  category: string
  tags: string[]
  mediaUrl: string
  settings: {
    allowMultipleVotes: boolean
    requireAuth: boolean
    showResults: 'always' | 'after_vote' | 'after_end'
    endDate: string | null
    isActive: boolean
  }
  isPublished: boolean
  analytics: {
    totalVotes: number
    uniqueVoters: number
    views: number
    shares: number
  }
}
```

**Voting Logic:**
```javascript
const castVote = async (pollId, optionId, userId) => {
  const pollRef = ref(db, `polls/${pollId}`)
  const snapshot = await get(pollRef)
  const poll = snapshot.val()
  
  // Check if already voted
  const hasVoted = poll.options.some(opt => 
    opt.voters.includes(userId)
  )
  
  if (hasVoted && !poll.settings.allowMultipleVotes) {
    throw new Error('Already voted')
  }
  
  // Update vote count
  const updates = {}
  updates[`options/${optionIndex}/votes`] = increment(1)
  updates[`options/${optionIndex}/voters/${userId}`] = true
  updates[`analytics/totalVotes`] = increment(1)
  updates[`analytics/uniqueVoters`] = increment(hasVoted ? 0 : 1)
  
  await update(pollRef, updates)
}
```

**Results Display:**
- Real-time vote counts
- Percentage bars
- Total voters count
- Winner highlighting
- Export results to CSV

---

## 📊 Database Schema

### Firebase Realtime Database Structure

```
/
├── users/
│   └── {userId}/
│       ├── displayName
│       ├── email
│       ├── phoneNumber
│       ├── photoURL
│       ├── role: 'admin' | 'user'
│       ├── permissions: {}
│       ├── createdAt
│       ├── lastLoginAt
│       ├── authMethod: 'email' | 'phone' | 'google'
│       ├── emailVerified: boolean
│       ├── phoneVerified: boolean
│       ├── profile/
│       │   ├── bio
│       │   ├── city
│       │   ├── preferences: {}
│       │   └── settings: {}
│       ├── bookmarks: ['postId1', 'postId2']
│       └── interactions/
│           ├── likes: ['postId1']
│           ├── comments: ['commentId1']
│           └── shares: ['postId1']
│
├── posts/
│   └── {postId}/
│       ├── id
│       ├── title
│       ├── content
│       ├── excerpt
│       ├── category: 'politics' | 'sports' | ...
│       ├── tags: ['tag1', 'tag2']
│       ├── media/
│       │   ├── type: 'image' | 'video' | 'carousel'
│       │   ├── url
│       │   └── urls: []
│       ├── author/
│       │   ├── id
│       │   ├── name
│       │   └── photoURL
│       ├── location/
│       │   ├── city
│       │   └── coordinates: {lat, lng}
│       ├── status: 'draft' | 'published' | 'archived'
│       ├── isPinned: boolean
│       ├── isFeatured: boolean
│       ├── isBreaking: boolean
│       ├── analytics/
│       │   ├── views: 0
│       │   ├── likes: 0
│       │   ├── comments: 0
│       │   ├── shares: 0
│       │   └── bookmarks: 0
│       ├── createdAt
│       ├── updatedAt
│       └── publishedAt
│
├── comments/
│   └── {commentId}/
│       ├── id
│       ├── postId
│       ├── userId
│       ├── userName
│       ├── userPhoto
│       ├── text
│       ├── likes: 0
│       ├── replies: []
│       ├── createdAt
│       └── isModerated: boolean
│
├── events/
│   └── {eventId}/
│       ├── [See Event Schema above]
│       └── registrations/
│           └── {userId}/
│               ├── status: 'registered' | 'attended' | 'cancelled'
│               ├── qrCode
│               └── registeredAt
│
├── polls/
│   └── {pollId}/
│       └── [See Poll Schema above]
│
├── breakingNews/
│   └── {breakingId}/
│       └── [See Breaking News Schema above]
│
├── news-roundups/
│   └── {YYYY-MM-DD}/
│       └── [See Roundup Schema above]
│
├── bloodSOS/
│   └── {sosId}/
│       └── [See Blood SOS Schema above]
│
├── cities/
│   └── {cityId}/
│       ├── posts/
│       ├── events/
│       ├── polls/
│       └── breakingNews/
│
└── cities-config/
    └── {cityId}/
        ├── name
        ├── nameGu
        ├── nameHi
        ├── logoUrl
        └── description
```

### Database Rules

```json
{
  "rules": {
    ".read": "auth != null",
    
    "users": {
      "$uid": {
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".read": "true"
      }
    },
    
    "posts": {
      ".read": "true",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    },
    
    "comments": {
      ".read": "true",
      "$commentId": {
        ".write": "auth != null && (
          !data.exists() || 
          data.child('userId').val() === auth.uid ||
          root.child('users').child(auth.uid).child('role').val() === 'admin'
        )"
      }
    },
    
    "news-roundups": {
      ".read": "true",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    },
    
    "breakingNews": {
      ".read": "true",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    },
    
    "events": {
      ".read": "true",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      "$eventId": {
        "registrations": {
          "$uid": {
            ".write": "$uid === auth.uid"
          }
        }
      }
    },
    
    "polls": {
      ".read": "true",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      "$pollId": {
        "options": {
          "$optionIndex": {
            "voters": {
              "$uid": {
                ".write": "$uid === auth.uid"
              }
            }
          }
        }
      }
    },
    
    "bloodSOS": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    
    "cities-config": {
      ".read": "true",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    }
  }
}
```

---

## ⚡ PWA & Performance

### Progressive Web App

**Manifest - `public/manifest.json`:**
```json
{
  "name": "Our Vadodara News",
  "short_name": "Vadodara News",
  "description": "Local news and updates for Vadodara",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#a8926f",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker - `public/sw.js`:**
```javascript
const CACHE_NAME = 'our-vadodara-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone()
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseClone))
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
```

**Install Prompt:**

**`src/components/PWA/InstallPrompt.jsx`** (171 lines)

- Detects installable state
- Shows custom install UI
- Handles beforeinstallprompt event
- Dismissible for 7 days
- Platform-specific instructions (iOS/Android)

### Performance Optimizations

**`src/utils/performance.js`**

**1. Lazy Loading:**
```javascript
import { lazy, Suspense } from 'react'

const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'))
const ReelsPage = lazy(() => import('./pages/Reels/ReelsPage'))

// Usage
<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

**2. Image Optimization:**
```javascript
export const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
}
```

**3. Debouncing/Throttling:**

**`src/hooks/useDebounce.js`:**
```javascript
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

// Usage
const searchTerm = useDebounce(inputValue, 300)
```

**4. Infinite Scroll:**

**`src/hooks/useInfiniteScroll.js`:**
```javascript
export const useInfiniteScroll = (callback, options = {}) => {
  const { threshold = 0.9, rootMargin = '0px' } = options
  const observerRef = useRef(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback()
        }
      },
      { threshold, rootMargin }
    )
    
    if (observerRef.current) {
      observer.observe(observerRef.current)
    }
    
    return () => observer.disconnect()
  }, [callback])
  
  return observerRef
}
```

**5. Performance Monitoring:**
```javascript
export const performanceMonitor = {
  start(label) {
    performance.mark(`${label}-start`)
  },
  
  end(label) {
    performance.mark(`${label}-end`)
    performance.measure(label, `${label}-start`, `${label}-end`)
    const measure = performance.getEntriesByName(label)[0]
    console.log(`${label}: ${measure.duration}ms`)
  }
}

// Usage
performanceMonitor.start('loadPosts')
await fetchPosts()
performanceMonitor.end('loadPosts')
```

---

## 🔒 Security

### Environment Variables

**`.env` (not committed):**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_DATABASE_URL=https://your_db.firebaseio.com
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Validation in `firebase-config.js`:**
```javascript
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_DATABASE_URL'
]

requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
})
```

### Input Sanitization

```javascript
export const sanitizeInput = (input) => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}
```

### XSS Protection

- All user inputs sanitized before display
- React's built-in XSS protection (JSX escaping)
- No dangerouslySetInnerHTML usage
- Content Security Policy headers

### CORS Configuration

**Firebase Storage Rules:**
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```

---

## 🚀 Deployment

### Build Process

```bash
# Install dependencies
npm install

# Development server
npm run dev
# → http://localhost:5173

# Production build
npm run build
# → dist/

# Preview production build
npm run preview
```

### Vite Configuration

**`vite.config.js`:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Our Vadodara News',
        short_name: 'Vadodara News',
        theme_color: '#a8926f',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/database']
        }
      }
    }
  }
})
```

### Firebase Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init
# Select: Hosting, Realtime Database, Storage

# Deploy database rules
firebase deploy --only database

# Deploy storage rules
firebase deploy --only storage

# Build and deploy hosting
npm run build
firebase deploy --only hosting
```

### Hosting Providers

**Recommended:**
1. **Firebase Hosting** - Integrated with Firebase services
2. **Vercel** - Zero-config deployment
3. **Netlify** - Continuous deployment from Git

**Firebase Hosting Config - `firebase.json`:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "database": {
    "rules": "database.rules.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

---

## 📝 Component Reference

### Core Components (Selection)

| Component | Path | Lines | Purpose |
|-----------|------|-------|---------|
| App | src/App.jsx | 372 | Main app component, routing |
| HomePage | src/pages/Home/HomePage.jsx | 322 | Home feed page |
| PostCard | src/components/Feed/PostCard.jsx | 321 | Instagram-style news card |
| EnhancedNewsFeed | src/components/Feed/EnhancedNewsFeed.jsx | 760 | Main feed component |
| TodaysRoundup | src/components/Feed/TodaysRoundup.jsx | 394 | Daily news carousel |
| RoundupManagement | src/components/Admin/RoundupManagement.jsx | 846 | Admin roundup manager |
| EnhancedDashboard | src/components/Admin/EnhancedDashboard.jsx | 533 | Real-time analytics |
| EventsCalendar | src/components/Events/EventsCalendar.jsx | 698 | Events listing |
| EventRegistration | src/components/Events/EventRegistration.jsx | 1015 | Event registration |
| MediaRenderer | src/components/Media/MediaRenderer.jsx | 792 | Multi-media display |
| InstagramCarousel | src/components/Media/InstagramCarousel.jsx | 354 | Swipeable image carousel |
| ProfilePage | src/pages/Profile/ProfilePage.jsx | - | User profile |
| AdminDashboard | src/pages/Admin/AdminDashboard.jsx | - | Admin panel |
| NewsDetailPage | src/pages/NewsDetail/NewsDetailPage.jsx | - | Article detail view |
| ReelsPage | src/pages/Reels/ReelsPage.jsx | - | Short videos |

### Utility Functions

| Function | Path | Purpose |
|----------|------|---------|
| formatTime | src/utils/helpers.js | Human-readable dates |
| truncateText | src/utils/helpers.js | Text truncation |
| compressImage | src/utils/helpers.js | Image optimization |
| shareContent | src/utils/helpers.js | Native share API |
| validateEmail | src/utils/helpers.js | Email validation |
| track | src/utils/analytics.js | Event tracking |
| getUserProfile | src/utils/adminSetup.js | Load user data |
| createUserProfile | src/utils/adminSetup.js | Create user record |
| checkProfileCompletion | src/utils/profileHelpers.js | Profile validation |

---

## 📊 Summary Statistics

### Codebase Metrics
- **Total Components**: 222 JSX files
- **Total Lines**: ~25,000+
- **Contexts**: 7 (Auth, EnhancedAuth, Theme, Language, City, BloodSOS, Toast)
- **Custom Hooks**: 6+ (useRealtimeData, useDebounce, useInfiniteScroll, etc.)
- **Pages**: 6 main pages
- **Admin Components**: 15+
- **Utility Modules**: 10+

### Feature Coverage
- ✅ **Authentication**: Email, Phone, Google, Anonymous
- ✅ **Content Types**: Posts, Stories, Reels, Carousels
- ✅ **Admin Features**: Dashboard, Content Management, Analytics
- ✅ **User Features**: Feed, Bookmarks, Comments, Sharing
- ✅ **Special Features**: Events, Polls, Blood SOS, Breaking News
- ✅ **Media**: Images, Videos, Carousels, Full-screen viewer
- ✅ **Localization**: English, Hindi, Gujarati
- ✅ **PWA**: Offline support, Install prompt, Push notifications
- ✅ **Theme**: Light (Ivory), Dark modes
- ✅ **Analytics**: Real-time tracking, Export data

### Technology Highlights
- **Frontend**: React 19.1.1, Vite 7.1.12
- **Backend**: Firebase 10.12.2 (Auth, Database, Storage, Messaging)
- **Styling**: Tailwind CSS 3.4.17 + Custom Ivory theme
- **i18n**: i18next 25.5.2
- **Icons**: Lucide React 0.544.0
- **PWA**: vite-plugin-pwa 1.0.3

---

## 🎯 Key Architectural Decisions

### 1. **Why Firebase Realtime Database over Firestore?**
- Real-time updates without additional listeners
- Simpler pricing model for read-heavy apps
- Better performance for frequently updated data (likes, views)
- Easier offline synchronization

### 2. **Why Context API over Redux?**
- Simpler setup for moderate state complexity
- Built-in React feature (no external deps)
- Sufficient for app size
- Better performance with selective re-renders

### 3. **Why Tailwind CSS?**
- Rapid prototyping
- Consistent design system
- Small production bundle (purge unused)
- Easy theme customization
- Responsive design utilities

### 4. **Why Vite over Create React App?**
- 10x faster dev server startup
- Lightning-fast HMR
- Better tree-shaking
- ESM-first approach
- Modern tooling

### 5. **Why Instagram-style Layout?**
- Familiar UX for users
- Better mobile experience
- Immersive media viewing
- Higher engagement
- Modern aesthetic

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Live streaming support
- [ ] Advanced AI content moderation
- [ ] WhatsApp integration for sharing
- [ ] Telegram bot for notifications
- [ ] Voice news (text-to-speech)
- [ ] Augmented reality for events
- [ ] Blockchain verification for news authenticity
- [ ] Advanced analytics dashboard
- [ ] Monetization (ads, subscriptions)
- [ ] Multi-tenant (white-label cities)

### Technical Improvements
- [ ] Migrate to TypeScript
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Implement CI/CD pipeline
- [ ] Add Storybook for component docs
- [ ] Performance budgets
- [ ] Lighthouse score optimization
- [ ] Accessibility audit (WCAG AA)
- [ ] SEO optimization
- [ ] Server-side rendering (SSR)
- [ ] Edge caching (CloudFlare)

---

## 📚 Additional Documentation

- [Admin Guide](ADMIN_GUIDE.md) - Administrator manual
- [City Management Guide](CITY_MANAGEMENT_GUIDE.md) - Multi-city setup
- [Firebase Setup](FIREBASE_SETUP.md) - Backend configuration
- [Ivory Theme Guide](IVORY_THEME_GUIDE.md) - Design system
- [Quick Start](README.md) - Getting started

---

**Last Updated**: January 2024  
**Version**: 2.0.0  
**Author**: Development Team  
**License**: Proprietary
