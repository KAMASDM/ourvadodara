# Firebase Storage CORS Error Fix Guide

## The Problem
You're seeing CORS (Cross-Origin Resource Sharing) errors when uploading files to Firebase Storage from localhost. This happens because Firebase Storage has strict security rules by default.

## Quick Fixes (Choose One)

### Option 1: Update Firebase Storage Rules (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `ourvadodara-a4002`
3. Navigate to **Storage** > **Rules**
4. Replace the existing rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all users for published content
    match /posts/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to upload images and videos
    match /posts/images/{fileName} {
      allow read: if true;
      allow write: if request.auth != null 
                   && request.resource.size < 10 * 1024 * 1024 // 10MB limit
                   && request.resource.contentType.matches('image/.*');
    }
    
    match /posts/videos/{fileName} {
      allow read: if true;
      allow write: if request.auth != null 
                   && request.resource.size < 100 * 1024 * 1024 // 100MB limit
                   && request.resource.contentType.matches('video/.*');
    }
    
    // Allow authenticated users to upload files
    match /posts/files/{fileName} {
      allow read: if true;
      allow write: if request.auth != null 
                   && request.resource.size < 50 * 1024 * 1024; // 50MB limit
    }
    
    // Default: deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

5. Click **Publish** to save the rules

### Option 2: Enable CORS for Development (Temporary)
If you need a quick temporary fix:

1. Go to **Storage** > **Settings** (gear icon)
2. Look for CORS settings
3. Add your development domain: `http://localhost:5177`

### Option 3: Check Authentication
Make sure users are properly authenticated:

1. Verify Google Sign-In is working
2. Check that `user.uid` exists when uploading
3. Test with a signed-in user

## Environment Variables Check
Make sure your `.env` file has the correct Firebase Storage bucket:

```
VITE_FIREBASE_STORAGE_BUCKET=ourvadodara-a4002.appspot.com
```

## Testing the Fix

1. **Sign in** to the application with Google
2. Go to **Admin** > **Create Post**
3. Try uploading an image or video
4. Check the browser console for any remaining errors

## Additional Debugging

If you're still having issues:

1. **Check Browser Network Tab:**
   - Look for failed requests to `firebasestorage.googleapis.com`
   - Check if the request has proper authentication headers

2. **Verify Firebase Project:**
   - Ensure you're using the correct project ID
   - Check that Storage is enabled in Firebase Console

3. **File Size and Type:**
   - Images should be under 10MB
   - Videos should be under 100MB
   - Supported formats: JPG, PNG, GIF, MP4, WebM, etc.

## Security Notes

The storage rules above:
- ✅ Allow public read access to uploaded content
- ✅ Require authentication for uploads
- ✅ Limit file sizes to prevent abuse
- ✅ Validate file types for security
- ❌ Deny all other access by default

## Need Help?

If you're still experiencing issues:

1. Check the Firebase Console logs
2. Verify your project settings match the environment variables
3. Try uploading with a fresh browser session
4. Contact Firebase Support if the problem persists

---

**Note:** After updating Storage rules, it may take a few minutes for changes to take effect globally.