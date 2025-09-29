// =============================================
// src/utils/firebaseSetup.js  
// Firebase Database Setup and Sample Data
// =============================================

import { ref, set } from '../firebase-config';
import { db } from '../firebase-config';

// Sample posts data for Our Vadodara News
const samplePosts = {
  post1: {
    id: 'post1',
    title: 'વડોદરા મેટ્રો પ્રોજેક્ટનો બીજો તબક્કો મંજૂર',
    content: 'વડોદરા મેટ્રો રેલ પ્રોજેક્ટનો બીજો તબક્કો ગુજરાત સરકાર દ્વારા મંજૂર કરવામાં આવ્યો છે. આ તબક્કામાં શહેરના પૂર્વ ભાગને જોડવામાં આવશે.',
    summary: 'વડોદરા મેટ્રોનો બીજો તબક્કો મંજૂર, પૂર્વ ભાગ સાથે કનેક્ટિવિટી',
    author: 'Our Vadodara News',
    publishedAt: '2025-09-28T10:00:00Z',
    category: 'transport',
    imageUrl: '',
    likes: 45,
    views: 1250,
    comments: 12,
    isBreaking: false,
    tags: ['મેટ્રો', 'પરિવહન', 'વિકાસ'],
    readTime: 3
  },
  post2: {
    id: 'post2',
    title: 'સયાજી હોસ્પિટલમાં નવી ઇમર્જન્સી સેવા શરૂ',
    content: 'સયાજી હોસ્પિટલમાં 24/7 ઇમર્જન્સી સેવા શરૂ કરવામાં આવી છે. નવી સુવિધાઓ અને આધુનિક ઉપકરણો સાથે દર્દીઓને વધુ સારી સેવા મળશે.',
    summary: 'સયાજી હોસ્પિટલમાં 24/7 ઇમર્જન્સી સેવા અને આધુનિક સુવિધાઓ',
    author: 'Our Vadodara News',
    publishedAt: '2025-09-28T08:30:00Z',
    category: 'health',
    imageUrl: '',
    likes: 67,
    views: 2100,
    comments: 18,
    isBreaking: true,
    tags: ['આરોગ્ય', 'હોસ્પિટલ', 'ઇમર્જન્સી'],
    readTime: 2
  },
  post3: {
    id: 'post3',
    title: 'નવરાત્રિ ઉત્સવની તૈયારીઓ સાયબાગમાં',
    content: 'સાયબાગ ગાર્ડનમાં નવરાત્રિ ઉત્સવની તૈયારીઓ શરૂ થઈ ગઈ છે. આ વર્ષે પણ ભવ્ય ગરબા અને સાંસ્કૃતિક કાર્યક્રમોનું આયોજન કરવામાં આવશે.',
    summary: 'સાયબાગમાં નવરાત્રિની ભવ્ય તૈયારીઓ, ગરબા અને સાંસ્કૃતિક કાર્યક્રમો',
    author: 'Our Vadodara News',
    publishedAt: '2025-09-28T06:00:00Z',
    category: 'culture',
    imageUrl: '',
    likes: 89,
    views: 3200,
    comments: 25,
    isBreaking: false,
    tags: ['નવરાત્રિ', 'ત્યોહાર', 'સંસ્કૃતિ'],
    readTime: 4
  },
  post4: {
    id: 'post4',
    title: 'વડોદરામાં IT કંપનીઓ માટે નવા અવસરો',
    content: 'વડોદરા શહેરમાં IT સેક્ટરમાં નવા રોજગારના અવસરો ઉભા થયા છે. મુખ્ય IT કંપનીઓ અહીં તેમની શાખાઓ સ્થાપવાની યોજના બનાવી રહી છે.',
    summary: 'વડોદરામાં IT સેક્ટરમાં નવા રોજગારના અવસરો અને કંપનીઓની શાખાઓ',
    author: 'Our Vadodara News',
    publishedAt: '2025-09-28T14:15:00Z',
    category: 'business',
    imageUrl: '',
    likes: 34,
    views: 890,
    comments: 8,
    isBreaking: false,
    tags: ['IT', 'રોજગાર', 'વ્યવસાય'],
    readTime: 3
  },
  post5: {
    id: 'post5',
    title: 'વડોદરા પોલીસ દ્વારા સાયબર ક્રાઇમ જાગૃતિ મહિમ',
    content: 'વડોદરા પોલીસ દ્વારા સાયબર ક્રાઇમ સામે જાગૃતિ મહિમ શરૂ કરવામાં આવી છે. નાગરિકોને ઓનલાઇન ફ્રોડથી બચવાની માહિતી આપવામાં આવશે.',
    summary: 'વડોદરા પોલીસની સાયબર ક્રાઇમ જાગૃતિ મહિમ, ઓનલાઇન ફ્રોડથી સુરક્ષા',
    author: 'Our Vadodara News',
    publishedAt: '2025-09-27T16:45:00Z',
    category: 'safety',
    imageUrl: '',
    likes: 52,
    views: 1580,
    comments: 15,
    isBreaking: false,
    tags: ['પોલીસ', 'સાયબર સિક્યુરિટી', 'જાગૃતિ'],
    readTime: 2
  }
};

// Function to populate sample data
export const populateSampleData = async () => {
  try {
    console.log('Populating sample data...');
    
    // Add sample posts
    await set(ref(db, 'posts'), samplePosts);
    
    console.log('Sample data populated successfully!');
    return true;
  } catch (error) {
    console.error('Error populating sample data:', error);
    return false;
  }
};

// Security rules for Firebase Realtime Database
export const securityRules = {
  "rules": {
    "news": {
      ".read": true,
      ".write": "auth != null"
    },
    "categories": {
      ".read": true,
      ".write": "auth != null"
    },
    "comments": {
      ".read": true,
      ".write": "auth != null",
      "$commentId": {
        ".validate": "newData.hasChildren(['author', 'content', 'timestamp'])"
      }
    },
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "analytics": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".write": "auth != null"
    }
  }
};

// Temporary rules for sample data population (DEVELOPMENT ONLY)
export const temporaryRules = {
  "rules": {
    ".read": true,
    ".write": true
  }
};

export default { populateSampleData, securityRules, temporaryRules };