// =============================================
// src/data/categories.js
// =============================================
export const categoryData = {
  politics: {
    description: {
      en: 'Stay updated with the latest political developments in Vadodara and Gujarat',
      hi: 'वडोदरा और गुजरात की नवीनतम राजनीतिक घटनाओं से अपडेट रहें',
      gu: 'વડોદરા અને ગુજરાતના તાજા રાજકીય વિકાસથી અપડેટ રહો'
    },
    trending: ['election', 'municipal', 'budget', 'policy'],
    relatedCategories: ['local', 'business']
  },
  sports: {
    description: {
      en: 'Get the latest sports news from Vadodara and beyond',
      hi: 'वडोदरा और अन्य जगहों की नवीनतम खेल समाचार प्राप्त करें',
      gu: 'વડોદરા અને અન્ય સ્થળોવાથી તાજા રમતગમતના સમાચાર મેળવો'
    },
    trending: ['cricket', 'football', 'tournament', 'baroda'],
    relatedCategories: ['local', 'entertainment']
  },
  entertainment: {
    description: {
      en: 'Discover entertainment news, events, and cultural happenings',
      hi: 'मनोरंजन समाचार, कार्यक्रम और सांस्कृतिक घटनाओं की खोज करें',
      gu: 'મનોરંજન સમાચાર, કાર્યક્રમો અને સાંસ્કૃતિક ઘટનાઓ શોધો'
    },
    trending: ['bollywood', 'events', 'festivals', 'movies'],
    relatedCategories: ['local', 'sports']
  },
  business: {
    description: {
      en: 'Business news, market updates, and economic developments',
      hi: 'व्यापारिक समाचार, बाज़ार अपडेट और आर्थिक विकास',
      gu: 'વ્યાપાર સમાચાર, બજાર અપડેટ અને આર્થિક વિકાસ'
    },
    trending: ['market', 'industry', 'startup', 'economy'],
    relatedCategories: ['technology', 'politics']
  },
  technology: {
    description: {
      en: 'Latest technology news, innovations, and digital updates',
      hi: 'नवीनतम तकनीकी समाचार, नवाचार और डिजिटल अपडेट',
      gu: 'તાજા ટેકનોલોજી સમાચાર, નવાચાર અને ડિજિટલ અપડેટ'
    },
    trending: ['digital', 'innovation', 'startup', 'AI'],
    relatedCategories: ['business', 'local']
  },
  local: {
    description: {
      en: 'Local Vadodara news, community updates, and city developments',
      hi: 'स्थानीय वडोदरा समाचार, समुदायिक अपडेट और शहर का विकास',
      gu: 'સ્થાનિક વડોદરા સમાચાર, સમુદાયિક અપડેટ અને શહેરનો વિકાસ'
    },
    trending: ['smart city', 'infrastructure', 'transport', 'development'],
    relatedCategories: ['politics', 'business']
  },
  weather: {
    description: {
      en: 'Weather updates, forecasts, and climate information for Vadodara',
      hi: 'वडोदरा के लिए मौसम अपडेट, पूर्वानुमान और जलवायु जानकारी',
      gu: 'વડોદરા માટે હવામાન અપડેટ, આગાહી અને આબોહવા માહિતી'
    },
    trending: ['forecast', 'monsoon', 'temperature', 'alert'],
    relatedCategories: ['local']
  },
  india: {
    description: {
      en: 'National news, politics, and developments from across India',
      hi: 'राष्ट्रीय समाचार, राजनीति और पूरे भारत से विकास',
      gu: 'રાષ્ટ્રીય સમાચાર, રાજકારણ અને સમગ્ર ભારતથી વિકાસ'
    },
    trending: ['parliament', 'government', 'states', 'national'],
    relatedCategories: ['politics', 'world']
  },
  world: {
    description: {
      en: 'International news, global events, and world affairs',
      hi: 'अंतर्राष्ट्रीय समाचार, वैश्विक घटनाएँ और विश्व मामले',
      gu: 'આંતરરાષ્ટ્રીય સમાચાર, વૈશ્વિક ઘટનાઓ અને વિશ્વ બાબતો'
    },
    trending: ['global', 'international', 'diplomacy', 'countries'],
    relatedCategories: ['india', 'politics']
  },
  science: {
    description: {
      en: 'Scientific discoveries, research, and technological breakthroughs',
      hi: 'वैज्ञानिक खोजें, अनुसंधान और तकनीकी सफलताएं',
      gu: 'વૈજ્ઞાનિક શોધો, સંશોધન અને તકનીકી સફળતાઓ'
    },
    trending: ['research', 'discovery', 'innovation', 'experiments'],
    relatedCategories: ['technology', 'space', 'health']
  },
  space: {
    description: {
      en: 'Space exploration, astronomy, and cosmic discoveries',
      hi: 'अंतरिक्ष अन्वेषण, खगोल विज्ञान और ब्रह्मांडीय खोजें',
      gu: 'અવકાશ સંશોધન, ખગોળશાસ્ત્ર અને બ્રહ્માંડીય શોધો'
    },
    trending: ['ISRO', 'NASA', 'satellites', 'planets', 'astronomy'],
    relatedCategories: ['science', 'technology']
  },
  health: {
    description: {
      en: 'Health news, medical breakthroughs, and wellness information',
      hi: 'स्वास्थ्य समाचार, चिकित्सा सफलताएं और कल्याण जानकारी',
      gu: 'આરોગ્ય સમાચાર, તબીબી સફળતાઓ અને સુખાકારી માહિતી'
    },
    trending: ['medical', 'wellness', 'healthcare', 'fitness', 'hospitals'],
    relatedCategories: ['science', 'local']
  }
};

// Export array of category names for compatibility
export const categories = Object.keys(categoryData).map(key => ({
  id: key,
  name: key.charAt(0).toUpperCase() + key.slice(1),
  value: key
}));

// Export default
export default categoryData;
