# City and Translation Guide

## 📍 How to Add New Cities

### Step 1: Update CityContext.jsx

Open `src/context/CityContext.jsx` and add your new city to the CITIES array:

```javascript
export const CITIES = [
  { id: 'vadodara', name: 'Vadodara' },
  { id: 'surat', name: 'Surat' },
  { id: 'rajkot', name: 'Rajkot' },
  
  // Add new cities here:
  { id: 'ahmedabad', name: 'Ahmedabad' },
  { id: 'gandhinagar', name: 'Gandhinagar' },
  { id: 'bhavnagar', name: 'Bhavnagar' },
  { id: 'jamnagar', name: 'Jamnagar' },
  { id: 'junagadh', name: 'Junagadh' },
  { id: 'anand', name: 'Anand' },
];
```

### Important Notes:
- **id**: Must be lowercase, no spaces (used in Firebase paths: `cities/{id}/posts`)
- **name**: Display name shown to users (can have capitals, spaces)

### Step 2: That's It! 🎉

The new cities will automatically appear in:
- ✅ Header city selector (user-facing)
- ✅ Admin panel multi-select checkboxes (all content creation forms)
- ✅ Content management filter dropdown

No other code changes needed!

---

## 🌐 Translation System

### Current Problem
The system translates **English → Hindi/Gujarati**, but you want **Gujarati → Hindi/English**.

### Solution: Auto-Translation from Gujarati

I've updated the system to support **Gujarati as the primary language** with automatic translation to Hindi and English.

### How It Works Now

#### For Admins Creating Content:

1. **Write in Gujarati First**
   - Enter your title in the "Gujarati Title" field
   - Enter your excerpt in the "Gujarati Excerpt" field
   - Enter your content in the "Gujarati Content" field

2. **Click "Auto-Translate" Buttons**
   - "🌐 Auto-Translate Title" - Translates Gujarati title to Hindi + English
   - "🌐 Auto-Translate Excerpt" - Translates Gujarati excerpt to Hindi + English
   - "🌐 Auto-Translate Content" - Translates Gujarati content to Hindi + English

3. **Review & Edit**
   - Check the auto-translated Hindi and English versions
   - Edit them manually if needed (they're just suggestions)
   - Auto-translation helps but you can override anything

4. **Publish**
   - Click "Publish" to save all three language versions
   - Users can switch languages and see the content in their preferred language

### Translation API

**Service Used**: MyMemory Translation API (Free)
- Free tier: 1000 requests/day
- No API key required
- Supports Gujarati ↔ Hindi ↔ English

**Language Codes**:
- `gu` - Gujarati (ગુજરાતી)
- `hi` - Hindi (हिंदी)
- `en` - English

### Example Workflow

```
Admin enters in Gujarati:
Title (gu): "વડોદરામાં વરસાદી માહોલ"
Excerpt (gu): "આજે વડોદરામાં ભારે વરસાદની શક્યતા છે"
Content (gu): "હવામાન વિભાગે આજે વડોદરામાં ભારે વરસાદની આગાહી કરી છે..."

↓ Click "Auto-Translate" ↓

System auto-fills:
Title (hi): "वडोदरा में बारिश का माहौल"
Title (en): "Rainy Weather in Vadodara"

Excerpt (hi): "आज वडोदरा में भारी बारिश की संभावना है"
Excerpt (en): "Heavy rain expected in Vadodara today"

Content (hi): "मौसम विभाग ने आज वडोदरा में भारी बारिश की भविष्यवाणी की है..."
Content (en): "Weather department predicted heavy rain in Vadodara today..."

↓ Admin reviews/edits if needed ↓

✅ Publish to multiple cities
```

### Translation Features

✅ **Auto-Translate from Gujarati** (Primary Language)
- Gujarati → Hindi
- Gujarati → English

✅ **Manual Override**
- Don't like the auto-translation? Just edit it manually
- Auto-translation is a helper, not mandatory

✅ **Smart Fallback**
- If translation API fails, shows the original Gujarati text
- Better than showing nothing

✅ **Batch Translation**
- Translate title, excerpt, and content separately
- Or translate all at once before publishing

### API Limitations

**Free Tier Limits**:
- 1000 requests per day
- Each field (title/excerpt/content) counts as 2 requests (gu→hi, gu→en)
- So roughly 166 full articles per day

**If Translation Fails**:
- Original Gujarati text is shown
- Manual translation can be entered
- System continues to work normally

### Upgrading Translation Service

If you need more translations, consider:

1. **Google Cloud Translation API**
   - Cost: $20 per million characters
   - More accurate
   - Higher limits
   - Requires API key and billing

2. **Azure Translator**
   - Cost: $10 per million characters
   - Good Gujarati support
   - Requires Azure account

3. **LibreTranslate (Self-hosted)**
   - Free and open-source
   - Host on your own server
   - Unlimited translations
   - Lower accuracy

---

## 📱 User Experience

### How Users See Content

1. **User opens app**
   - Default language: English (or browser language)

2. **User selects city**
   - Header dropdown: "Vadodara" → sees only Vadodara content

3. **User selects language**
   - Header dropdown: "ગુજરાતી" (Gujarati)
   - All content switches to Gujarati
   - Buttons, labels, navigation all in Gujarati

4. **User reads article**
   - If article has Gujarati version → shows Gujarati
   - If no Gujarati version → shows English (fallback)

### Language Fallback Logic

```
User selects: Gujarati
  ↓
Check if post has Gujarati title/content
  ↓
YES → Show Gujarati version
NO → Show English version (fallback)
```

---

## 🔧 Technical Details

### Database Structure (Multi-Language)

```json
cities/
  vadodara/
    posts/
      post-abc123/
        title: {
          en: "Breaking News",
          hi: "तत्काल समाचार",
          gu: "તાત્કાલિક સમાચાર"
        },
        excerpt: {
          en: "Important update...",
          hi: "महत्वपूर्ण अपडेट...",
          gu: "મહત્વપૂર્ણ અપડેટ..."
        },
        content: {
          en: "Full article in English...",
          hi: "हिंदी में पूर्ण लेख...",
          gu: "ગુજરાતીમાં સંપૂર્ણ લેખ..."
        }
```

### Translation API Call

```javascript
// From Gujarati to Hindi
const response = await axios.get(
  `https://api.mymemory.translated.net/get?q=${gujaratiText}&langpair=gu|hi`
);

// From Gujarati to English
const response = await axios.get(
  `https://api.mymemory.translated.net/get?q=${gujaratiText}&langpair=gu|en`
);
```

### Components Using Translation

1. **CreatePost.jsx** - Main post creation with auto-translate
2. **MediaPostCreator.jsx** - Stories/Reels with translation
3. **EnhancedEventManagement.jsx** - Events in multiple languages
4. **PollManagement.jsx** - Polls with translation
5. **BreakingNewsManager.jsx** - Breaking news translation

---

## 🚀 Quick Reference

### Add a City
```javascript
// File: src/context/CityContext.jsx
{ id: 'cityname', name: 'City Name' }
```

### Translate Content
1. Write in Gujarati first
2. Click "🌐 Auto-Translate" button
3. Review translations
4. Publish

### Change Primary Language
If you want to change from Gujarati to another language:

1. Update `CreatePost.jsx` line ~105:
```javascript
// Change from:
langpair=gu|${targetLang}

// To (for Hindi primary):
langpair=hi|${targetLang}
```

2. Update UI labels to reflect new primary language

---

## ❓ FAQ

**Q: Can I add 50 cities at once?**
A: Yes! Just add all of them to the CITIES array. No performance impact.

**Q: What if translation API is down?**
A: Content is saved in Gujarati. Users can still read it. Translations can be added manually later.

**Q: Can I edit translations manually?**
A: Yes! Auto-translate is just a helper. You can manually edit any field.

**Q: Do I need to translate every post?**
A: No. If you only write in Gujarati, users selecting other languages will see Gujarati text. But for better UX, translations are recommended.

**Q: Can I use Google Translate instead?**
A: Yes! Update the API endpoint in `CreatePost.jsx` translateText() function. You'll need a Google Cloud API key.

**Q: Does translation work for images/videos?**
A: No. Only text (title, excerpt, content) is translated. Media files are language-independent.

---

**Last Updated**: October 30, 2025  
**Status**: ✅ Fully Functional
