// =============================================
// src/data/newsData.js
// =============================================
export const sampleNews = [
  {
    id: '1',
    title: {
      en: 'Vadodara Smart City Project Reaches New Milestone',
      hi: 'वडोदरा स्मार्ट सिटी प्रोजेक्ट एक नए मुकाम पर पहुंचा',
      gu: 'વડોદરા સ્માર્ટ સિટી પ્રોજેક્ટ નવા લક્ષ્ય સુધી પહોંચ્યો'
    },
    content: {
      en: 'The Vadodara Smart City project has achieved significant progress with the completion of Phase 1 infrastructure development...',
      hi: 'वडोदरा स्मार्ट सिटी प्रोजेक्ट में फेज 1 के इंफ्रास्ट्रक्चर डेवलपमेंट के पूरा होने के साथ महत्वपूर्ण प्रगति हुई है...',
      gu: 'વડોદરા સ્માર્ટ સિટી પ્રોજેક્ટમાં ફેઝ 1 ના ઇન્ફ્રાસ્ટ્રક્ચર ડેવલપમેન્ટ પૂર્ણ થવા સાથે નોંધપાત્ર પ્રગતિ થઈ છે...'
    },
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600',
    category: 'local',
    tags: ['smart city', 'infrastructure', 'development'],
    author: 'Our Vadodara Team',
    publishedAt: new Date('2024-01-15T10:00:00Z'),
    likes: 45,
    comments: 12,
    views: 1250,
    shares: 8,
    isBreaking: false,
  },
  {
    id: '2',
    title: {
      en: 'Breaking: Major Traffic Changes on RC Dutt Road',
      hi: 'तत्काल: आरसी दत्त रोड पर प्रमुख ट्रैफिक बदलाव',
      gu: 'તાત્કાલિક: આરસી દત્ત રોડ પર મુખ્ય ટ્રાફિક ફેરફારો'
    },
    content: {
      en: 'Due to ongoing metro construction work, significant traffic diversions have been implemented on RC Dutt Road...',
      hi: 'चल रहे मेट्रो निर्माण कार्य के कारण, आरसी दत्त रोड पर महत्वपूर्ण ट्रैफिक डाइवर्शन लागू किए गए हैं...',
      gu: 'ચાલુ મેટ્રો બાંધકામ કાર્યને કારણે, આરસી દત્ત રોડ પર નોંધપાત્ર ટ્રાફિક ડાઇવર્શન લાગુ કરવામાં આવ્યું છે...'
    },
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600',
    category: 'local',
    tags: ['traffic', 'metro', 'construction'],
    author: 'Traffic Reporter',
    publishedAt: new Date('2024-01-16T08:30:00Z'),
    likes: 23,
    comments: 8,
    views: 890,
    shares: 5,
    isBreaking: true,
  },
  {
    id: '3',
    title: {
      en: 'Baroda Cricket Association Announces New Tournament',
      hi: 'बरोडा क्रिकेट एसोसिएशन ने नए टूर्नामेंट की घोषणा की',
      gu: 'બરોડા ક્રિકેટ એસોસિએશને નવી ટુર્નામેન્ટની જાહેરાત કરી'
    },
    content: {
      en: 'The Baroda Cricket Association has announced a new inter-district cricket tournament featuring local talent...',
      hi: 'बरोडा क्रिकेट एसोसिएशन ने स्थानीय प्रतिभा को शामिल करते हुए एक नया अंतर-जिला क्रिकेट टूर्नामेंट की घोषणा की है...',
      gu: 'બરોડા ક્રિકેટ એસોસિએશને સ્થાનિક પ્રતિભાને દર્શાવતી નવી આંતર-જિલ્લા ક્રિકેટ ટુર્નામેન્ટની જાહેરાત કરી છે...'
    },
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600',
    category: 'sports',
    tags: ['cricket', 'tournament', 'local sports'],
    author: 'Sports Desk',
    publishedAt: new Date('2024-01-14T15:20:00Z'),
    likes: 67,
    comments: 15,
    views: 2100,
    shares: 12,
    isBreaking: false,
  }
];

export const breakingNews = sampleNews.filter(news => news.isBreaking);