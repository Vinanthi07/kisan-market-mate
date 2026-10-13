import type { Lang } from "./i18n";

export type CropCategory =
  "cereals_millets" | "pulses" | "oilseeds" | "vegetables" | "fruits_plantation";

export type CropId =
  // Cereals and millets
  | "paddy"
  | "ragi"
  | "jowar"
  | "maize"
  | "wheat"
  // Pulses
  | "tur_dal"
  | "green_gram"
  | "black_gram"
  | "chickpea"
  // Oilseeds
  | "groundnut"
  | "sunflower"
  | "sesame"
  | "soybean"
  // Vegetables
  | "tomato"
  | "onion"
  | "potato"
  | "chilli"
  | "brinjal"
  | "okra"
  // Fruits and plantation crops
  | "banana"
  | "mango"
  | "grapes"
  | "coconut";

export interface Crop {
  id: CropId;
  name: string;
  category: CropCategory;
  localizedNames: Record<Lang, string>;
  basePrice: number; // ₹ per quintal reference modal price
  trend: number; // Price direction modifier
  shelfNormal: number; // Storage shelf-life in days
  shelfLantana: number; // Research pilot shelf-life hypothesis in days
  perishability: "high" | "medium" | "low";
  storagePerDay: number; // Storage cost ₹/quintal/day
  spoilPer100km: number; // Spoilage rate fraction per 100km
  yieldQ: number; // Expected yield in quintals per acre
  inputCost: number; // Expected cost of cultivation ₹ per acre
}

export const CROPS: Crop[] = [
  // 1. Cereals & Millets
  {
    id: "paddy",
    name: "Paddy / Rice",
    category: "cereals_millets",
    localizedNames: {
      en: "Paddy (Rice)",
      hi: "धान (चावल)",
      kn: "ಭತ್ತ (ಅಕ್ಕಿ)",
      ta: "நெல் (அரிசி)",
      te: "వరి (బియ్యం)",
      mr: "भात (तांदूळ)",
    },
    basePrice: 2280,
    trend: 0.0008,
    shelfNormal: 180,
    shelfLantana: 240,
    perishability: "low",
    storagePerDay: 1.5,
    spoilPer100km: 0.001,
    yieldQ: 22,
    inputCost: 32000,
  },
  {
    id: "ragi",
    name: "Ragi (Finger Millet)",
    category: "cereals_millets",
    localizedNames: {
      en: "Ragi (Finger Millet)",
      hi: "रागी (मडुआ)",
      kn: "ರಾಗಿ",
      ta: "கேழ்வரகு (ராகி)",
      te: "రాగులు",
      mr: "नाचणी",
    },
    basePrice: 3846,
    trend: 0.0012,
    shelfNormal: 365,
    shelfLantana: 420,
    perishability: "low",
    storagePerDay: 1.2,
    spoilPer100km: 0.001,
    yieldQ: 14,
    inputCost: 20000,
  },
  {
    id: "jowar",
    name: "Jowar (Sorghum)",
    category: "cereals_millets",
    localizedNames: {
      en: "Jowar (Sorghum)",
      hi: "ज्वार",
      kn: "ಜೋಳ",
      ta: "சோளம்",
      te: "జొన్నలు",
      mr: "ज्वारी",
    },
    basePrice: 3180,
    trend: 0.001,
    shelfNormal: 240,
    shelfLantana: 300,
    perishability: "low",
    storagePerDay: 1.5,
    spoilPer100km: 0.001,
    yieldQ: 16,
    inputCost: 22000,
  },
  {
    id: "maize",
    name: "Maize (Corn)",
    category: "cereals_millets",
    localizedNames: {
      en: "Maize (Corn)",
      hi: "मक्का",
      kn: "ಮೆಕ್ಕೆಜೋಳ",
      ta: "மக்காச்சோளம்",
      te: "మొక్కజొన్న",
      mr: "मका",
    },
    basePrice: 2150,
    trend: 0.0015,
    shelfNormal: 120,
    shelfLantana: 150,
    perishability: "low",
    storagePerDay: 2,
    spoilPer100km: 0.002,
    yieldQ: 25,
    inputCost: 26000,
  },
  {
    id: "wheat",
    name: "Wheat",
    category: "cereals_millets",
    localizedNames: {
      en: "Wheat",
      hi: "गेहूँ",
      kn: "ಗೋಧಿ",
      ta: "கோதுமை",
      te: "గోధుమలు",
      mr: "गहू",
    },
    basePrice: 2275,
    trend: 0.0006,
    shelfNormal: 210,
    shelfLantana: 270,
    perishability: "low",
    storagePerDay: 1.8,
    spoilPer100km: 0.001,
    yieldQ: 20,
    inputCost: 28000,
  },

  // 2. Pulses
  {
    id: "tur_dal",
    name: "Tur Dal (Pigeon Pea)",
    category: "pulses",
    localizedNames: {
      en: "Tur Dal (Pigeon Pea)",
      hi: "अरहर / तूर दाल",
      kn: "ತೊಗರಿ ಬೇಳೆ",
      ta: "துவரம் பருப்பு",
      te: "కందిపప్పు",
      mr: "तूर डाळ",
    },
    basePrice: 7000,
    trend: 0.002,
    shelfNormal: 240,
    shelfLantana: 300,
    perishability: "low",
    storagePerDay: 3.5,
    spoilPer100km: 0.0015,
    yieldQ: 7,
    inputCost: 24000,
  },
  {
    id: "green_gram",
    name: "Green Gram (Moong)",
    category: "pulses",
    localizedNames: {
      en: "Green Gram (Moong)",
      hi: "मूँग दाल",
      kn: "ಹೆಸರು ಕಾಳು",
      ta: "பாசிப் பருப்பு",
      te: "పెసలు",
      mr: "मूग डाळ",
    },
    basePrice: 8558,
    trend: 0.0018,
    shelfNormal: 180,
    shelfLantana: 240,
    perishability: "low",
    storagePerDay: 4,
    spoilPer100km: 0.0015,
    yieldQ: 6,
    inputCost: 22000,
  },
  {
    id: "black_gram",
    name: "Black Gram (Urad)",
    category: "pulses",
    localizedNames: {
      en: "Black Gram (Urad)",
      hi: "उड़द दाल",
      kn: "ಉದ್ದಿನ ಬೇಳೆ",
      ta: "உளுத்தம் பருப்பு",
      te: "మినుములు",
      mr: "उडीद डाळ",
    },
    basePrice: 6950,
    trend: 0.0014,
    shelfNormal: 180,
    shelfLantana: 240,
    perishability: "low",
    storagePerDay: 3.8,
    spoilPer100km: 0.0015,
    yieldQ: 6,
    inputCost: 21000,
  },
  {
    id: "chickpea",
    name: "Chickpea (Chana / Bengal Gram)",
    category: "pulses",
    localizedNames: {
      en: "Chickpea (Bengal Gram)",
      hi: "चना",
      kn: "ಕಡಲೆ ಕಾಳು",
      ta: "கொண்டைக்கடலை",
      te: "శనగలు",
      mr: "हरभरा",
    },
    basePrice: 5440,
    trend: 0.001,
    shelfNormal: 210,
    shelfLantana: 270,
    perishability: "low",
    storagePerDay: 3,
    spoilPer100km: 0.0015,
    yieldQ: 8,
    inputCost: 23000,
  },

  // 3. Oilseeds
  {
    id: "groundnut",
    name: "Groundnut (Peanut)",
    category: "oilseeds",
    localizedNames: {
      en: "Groundnut (Peanut)",
      hi: "मूंगफली",
      kn: "ಕಡಲೆಕಾಯಿ",
      ta: "வேர்க்கடலை",
      te: "వేరుశనగ",
      mr: "भुईमूग",
    },
    basePrice: 6377,
    trend: 0.001,
    shelfNormal: 120,
    shelfLantana: 150,
    perishability: "medium",
    storagePerDay: 3,
    spoilPer100km: 0.002,
    yieldQ: 9,
    inputCost: 30000,
  },
  {
    id: "sunflower",
    name: "Sunflower",
    category: "oilseeds",
    localizedNames: {
      en: "Sunflower Seed",
      hi: "सूरजमुखी",
      kn: "ಸೂರ್ಯಕಾಂತಿ",
      ta: "சூரியகாந்தி",
      te: "పొద్దుతిరుగుడు",
      mr: "सूर्यफूल",
    },
    basePrice: 6760,
    trend: 0.0015,
    shelfNormal: 120,
    shelfLantana: 150,
    perishability: "medium",
    storagePerDay: 3.2,
    spoilPer100km: 0.002,
    yieldQ: 8,
    inputCost: 26000,
  },
  {
    id: "sesame",
    name: "Sesame (Til)",
    category: "oilseeds",
    localizedNames: {
      en: "Sesame (Til)",
      hi: "तिल",
      kn: "ಎಳ್ಳು",
      ta: "எள்",
      te: "నువ్వులు",
      mr: "तीळ",
    },
    basePrice: 8635,
    trend: 0.0022,
    shelfNormal: 150,
    shelfLantana: 180,
    perishability: "low",
    storagePerDay: 4.5,
    spoilPer100km: 0.001,
    yieldQ: 4,
    inputCost: 20000,
  },
  {
    id: "soybean",
    name: "Soybean",
    category: "oilseeds",
    localizedNames: {
      en: "Soybean",
      hi: "सोयाबीन",
      kn: "ಸೋಯಾಬೀನ್",
      ta: "சோயாபீன்",
      te: "సోయాబీన్",
      mr: "सोयाबीन",
    },
    basePrice: 4600,
    trend: 0.0012,
    shelfNormal: 150,
    shelfLantana: 180,
    perishability: "low",
    storagePerDay: 2.5,
    spoilPer100km: 0.002,
    yieldQ: 10,
    inputCost: 27000,
  },

  // 4. Vegetables
  {
    id: "tomato",
    name: "Tomato",
    category: "vegetables",
    localizedNames: {
      en: "Tomato",
      hi: "टमाटर",
      kn: "ಟೊಮ್ಯಾಟೊ",
      ta: "தக்காளி",
      te: "టమోటా",
      mr: "टोमॅटो",
    },
    basePrice: 1600,
    trend: -0.004,
    shelfNormal: 6,
    shelfLantana: 9,
    perishability: "high",
    storagePerDay: 18,
    spoilPer100km: 0.04,
    yieldQ: 120,
    inputCost: 85000,
  },
  {
    id: "onion",
    name: "Onion",
    category: "vegetables",
    localizedNames: {
      en: "Onion",
      hi: "प्याज़",
      kn: "ಈರುಳ್ಳಿ",
      ta: "வெங்காயம்",
      te: "ఉల్లిపాయ",
      mr: "कांदा",
    },
    basePrice: 2200,
    trend: 0.004,
    shelfNormal: 35,
    shelfLantana: 60,
    perishability: "medium",
    storagePerDay: 6,
    spoilPer100km: 0.012,
    yieldQ: 100,
    inputCost: 72000,
  },
  {
    id: "potato",
    name: "Potato",
    category: "vegetables",
    localizedNames: {
      en: "Potato",
      hi: "आलू",
      kn: "ಆಲೂಗಡ್ಡೆ",
      ta: "உருளைக்கிழங்கு",
      te: "బంగాళాదుంప",
      mr: "बटाटा",
    },
    basePrice: 1750,
    trend: 0.002,
    shelfNormal: 40,
    shelfLantana: 60,
    perishability: "medium",
    storagePerDay: 5,
    spoilPer100km: 0.01,
    yieldQ: 90,
    inputCost: 68000,
  },
  {
    id: "chilli",
    name: "Green Chilli",
    category: "vegetables",
    localizedNames: {
      en: "Green Chilli",
      hi: "हरी मिर्च",
      kn: "ಹಸಿರು ಮೆಣಸಿನಕಾಯಿ",
      ta: "பச்சை மிளகாய்",
      te: "పచ్చి మిరపకాయ",
      mr: "हिरवी मिरची",
    },
    basePrice: 3200,
    trend: -0.002,
    shelfNormal: 8,
    shelfLantana: 11,
    perishability: "high",
    storagePerDay: 15,
    spoilPer100km: 0.035,
    yieldQ: 40,
    inputCost: 55000,
  },
  {
    id: "brinjal",
    name: "Brinjal (Eggplant)",
    category: "vegetables",
    localizedNames: {
      en: "Brinjal (Eggplant)",
      hi: "बैंगन",
      kn: "ಬದನೆಕಾಯಿ",
      ta: "கத்தரிக்காய்",
      te: "వంకాయ",
      mr: "वांगी",
    },
    basePrice: 1400,
    trend: -0.001,
    shelfNormal: 5,
    shelfLantana: 7,
    perishability: "high",
    storagePerDay: 16,
    spoilPer100km: 0.038,
    yieldQ: 80,
    inputCost: 50000,
  },
  {
    id: "okra",
    name: "Okra (Ladyfinger / Bhendi)",
    category: "vegetables",
    localizedNames: {
      en: "Okra (Bhendi)",
      hi: "भिंडी",
      kn: "ಬೆಂಡೆಕಾಯಿ",
      ta: "வெண்டைக்காய்",
      te: "బెండకాయ",
      mr: "भेंडी",
    },
    basePrice: 2100,
    trend: -0.003,
    shelfNormal: 4,
    shelfLantana: 6,
    perishability: "high",
    storagePerDay: 20,
    spoilPer100km: 0.045,
    yieldQ: 45,
    inputCost: 48000,
  },

  // 5. Fruits & Plantation Crops
  {
    id: "banana",
    name: "Banana (Cavendish / Robusta)",
    category: "fruits_plantation",
    localizedNames: {
      en: "Banana",
      hi: "केला",
      kn: "ಬಾಳೆಹಣ್ಣು",
      ta: "வாழைப்பழம்",
      te: "అరటిపండు",
      mr: "केळी",
    },
    basePrice: 1850,
    trend: 0.001,
    shelfNormal: 7,
    shelfLantana: 10,
    perishability: "high",
    storagePerDay: 14,
    spoilPer100km: 0.035,
    yieldQ: 180,
    inputCost: 95000,
  },
  {
    id: "mango",
    name: "Mango",
    category: "fruits_plantation",
    localizedNames: {
      en: "Mango",
      hi: "आम",
      kn: "ಮಾವಿನ ಹಣ್ಣು",
      ta: "மாம்பழம்",
      te: "మామిడిపండు",
      mr: "आंबा",
    },
    basePrice: 4200,
    trend: 0.003,
    shelfNormal: 10,
    shelfLantana: 14,
    perishability: "high",
    storagePerDay: 15,
    spoilPer100km: 0.03,
    yieldQ: 50,
    inputCost: 75000,
  },
  {
    id: "grapes",
    name: "Grapes",
    category: "fruits_plantation",
    localizedNames: {
      en: "Grapes",
      hi: "अंगूर",
      kn: "ದ್ರಾಕ್ಷಿ",
      ta: "திராட்சை",
      te: "ద్రాక్ష",
      mr: "द्राक्षे",
    },
    basePrice: 5500,
    trend: -0.002,
    shelfNormal: 6,
    shelfLantana: 8,
    perishability: "high",
    storagePerDay: 25,
    spoilPer100km: 0.05,
    yieldQ: 80,
    inputCost: 140000,
  },
  {
    id: "coconut",
    name: "Coconut (1000 nuts ~ 12q)",
    category: "fruits_plantation",
    localizedNames: {
      en: "Coconut",
      hi: "नारियल",
      kn: "ತೆಂಗಿನಕಾಯಿ",
      ta: "தேங்காய்",
      te: "కొబ్బరికాయ",
      mr: "नारळ",
    },
    basePrice: 2800,
    trend: 0.0005,
    shelfNormal: 90,
    shelfLantana: 120,
    perishability: "low",
    storagePerDay: 2,
    spoilPer100km: 0.003,
    yieldQ: 60,
    inputCost: 45000,
  },
];

export const cropById = (id: CropId): Crop => {
  const found = CROPS.find((c) => c.id === id);
  return found ?? CROPS[0];
};

export const CROP_CATEGORIES: { id: CropCategory; label: Record<Lang, string> }[] = [
  {
    id: "cereals_millets",
    label: {
      en: "Cereals & Millets",
      hi: "अनाज और मोटे अनाज",
      kn: "ಧಾನ್ಯಗಳು ಮತ್ತು ಸಿರಿಧಾನ್ಯಗಳು",
      ta: "தானியங்கள் மற்றும் சிறுதானியங்கள்",
      te: "ధాన్యాలు & చిరుధాన్యాలు",
      mr: "धान्य आणि भरड धान्ये",
    },
  },
  {
    id: "pulses",
    label: {
      en: "Pulses",
      hi: "दालें",
      kn: "ಕಾಳುಗಳು / ಬೇಳೆಗಳು",
      ta: "பருப்பு வகைகள்",
      te: "పప్పుదినుసులు",
      mr: "कडधान्ये",
    },
  },
  {
    id: "oilseeds",
    label: {
      en: "Oilseeds",
      hi: "तिलहन",
      kn: "ಎಣ್ಣೆಕಾಳುಗಳು",
      ta: "எண்ணெய் வித்துக்கள்",
      te: "నూనెగింజలు",
      mr: "गळित धान्ये",
    },
  },
  {
    id: "vegetables",
    label: {
      en: "Vegetables",
      hi: "सब्जियाँ",
      kn: "ತರಕಾರಿಗಳು",
      ta: "காய்கறிகள்",
      te: "కూరగాయలు",
      mr: "भाज्या",
    },
  },
  {
    id: "fruits_plantation",
    label: {
      en: "Fruits & Plantation",
      hi: "फल और बागवानी",
      kn: "ಹಣ್ಣುಗಳು ಮತ್ತು ತೋಟಗಾರಿಕೆ",
      ta: "பழங்கள் & தோட்டப்பயிர்கள்",
      te: "పండ్లు & తోట పంటలు",
      mr: "फळे आणि बागायती पिके",
    },
  },
];

export interface Market {
  id: string;
  names: Partial<Record<Lang, string>> & { en: string };
  state: string;
  district: string;
  lat: number;
  lng: number;
  feePct: number;
  kind: "mandi" | "direct" | "fpo";
  factor: number;
  phone?: string;
  fixedKm?: number;
}

export const MARKETS: Market[] = [
  // Karnataka
  {
    id: "ypr",
    names: { en: "Yeshwanthpur APMC", kn: "ಯಶವಂತಪುರ ಎಪಿಎಂಸಿ", hi: "यशवंतपुर मंडी" },
    state: "Karnataka",
    district: "Bengaluru Urban",
    lat: 13.02,
    lng: 77.55,
    feePct: 2.0,
    kind: "mandi",
    factor: 1.08,
  },
  {
    id: "klr",
    names: { en: "Kolar APMC", kn: "ಕೋಲಾರ ಎಪಿಎಂಸಿ", hi: "कोलार मंडी" },
    state: "Karnataka",
    district: "Kolar",
    lat: 13.14,
    lng: 78.13,
    feePct: 1.5,
    kind: "mandi",
    factor: 1.0,
  },
  {
    id: "cbp",
    names: { en: "Chikkaballapur APMC", kn: "ಚಿಕ್ಕಬಳ್ಳಾಪುರ ಎಪಿಎಂಸಿ", hi: "चिकबल्लापुर मंडी" },
    state: "Karnataka",
    district: "Chikkaballapur",
    lat: 13.43,
    lng: 77.73,
    feePct: 1.5,
    kind: "mandi",
    factor: 0.97,
  },
  {
    id: "mys",
    names: { en: "Bandipalya (Mysuru) APMC", kn: "ಬಂಡಿಪಾಳ್ಯ ಮೈಸೂರು ಎಪಿಎಂಸಿ", hi: "मैसूर मंडी" },
    state: "Karnataka",
    district: "Mysuru",
    lat: 12.28,
    lng: 76.66,
    feePct: 1.5,
    kind: "mandi",
    factor: 0.99,
  },
  {
    id: "hbl",
    names: { en: "Amargol (Hubballi) APMC", kn: "ಅಮರಗೋಳ ಹುಬ್ಬಳ್ಳಿ ಎಪಿಎಂಸಿ", hi: "हुबली मंडी" },
    state: "Karnataka",
    district: "Dharwad",
    lat: 15.39,
    lng: 75.1,
    feePct: 1.5,
    kind: "mandi",
    factor: 1.03,
  },
  {
    id: "bgm",
    names: { en: "Belagavi APMC", kn: "ಬೆಳಗಾವಿ ಎಪಿಎಂಸಿ", hi: "बेलगावी मंडी" },
    state: "Karnataka",
    district: "Belagavi",
    lat: 15.86,
    lng: 74.5,
    feePct: 1.5,
    kind: "mandi",
    factor: 1.01,
  },
  {
    id: "tmk",
    names: { en: "Tumakuru APMC", kn: "ತುಮಕೂರು ಎಪಿಎಂಸಿ", hi: "तुमकुरु मंडी" },
    state: "Karnataka",
    district: "Tumakuru",
    lat: 13.34,
    lng: 77.1,
    feePct: 1.5,
    kind: "mandi",
    factor: 0.98,
  },

  // Tamil Nadu
  {
    id: "kyb",
    names: { en: "Koyambedu Wholesale", ta: "கோயம்பேடு மொத்த சந்தை", hi: "कोयम्बेडु मंडी" },
    state: "Tamil Nadu",
    district: "Chennai",
    lat: 13.07,
    lng: 80.19,
    feePct: 2.0,
    kind: "mandi",
    factor: 1.12,
  },
  {
    id: "odc",
    names: { en: "Oddanchatram Market", ta: "ஒட்டன்சத்திரம் சந்தை", hi: "ओड्डनछत्रम मंडी" },
    state: "Tamil Nadu",
    district: "Dindigul",
    lat: 10.48,
    lng: 77.75,
    feePct: 1.0,
    kind: "mandi",
    factor: 1.02,
  },
  {
    id: "cbe",
    names: { en: "Coimbatore MGR Market", ta: "கோயம்புத்தூர் எம்ஜிஆர் சந்தை", hi: "कोयंबटूर मंडी" },
    state: "Tamil Nadu",
    district: "Coimbatore",
    lat: 11.02,
    lng: 76.96,
    feePct: 1.5,
    kind: "mandi",
    factor: 1.04,
  },
  {
    id: "hsr",
    names: { en: "Hosur Uzhavar Sandhai", ta: "ஓசூர் உழவர் சந்தை", hi: "होसुर मंडी" },
    state: "Tamil Nadu",
    district: "Krishnagiri",
    lat: 12.74,
    lng: 77.83,
    feePct: 1.0,
    kind: "mandi",
    factor: 1.01,
  },

  // Maharashtra
  {
    id: "lsg",
    names: { en: "Lasalgaon APMC", mr: "लासलगाव बाजार समिती", hi: "लासलगांव मंडी" },
    state: "Maharashtra",
    district: "Nashik",
    lat: 20.15,
    lng: 74.23,
    feePct: 1.0,
    kind: "mandi",
    factor: 1.06,
  },
  {
    id: "pne",
    names: {
      en: "Gultekdi (Pune) Market Yard",
      mr: "गुलटेकडी (पुणे) मार्केट यार्ड",
      hi: "पुणे मंडी",
    },
    state: "Maharashtra",
    district: "Pune",
    lat: 18.49,
    lng: 73.86,
    feePct: 2.0,
    kind: "mandi",
    factor: 1.1,
  },
  {
    id: "nsk",
    names: { en: "Nashik APMC", mr: "नाशिक बाजार समिती", hi: "नासिक मंडी" },
    state: "Maharashtra",
    district: "Nashik",
    lat: 20.0,
    lng: 73.79,
    feePct: 1.5,
    kind: "mandi",
    factor: 1.03,
  },
  {
    id: "slp",
    names: { en: "Solapur APMC", mr: "सोलापूर बाजार समिती", hi: "सोलापुर मंडी" },
    state: "Maharashtra",
    district: "Solapur",
    lat: 17.66,
    lng: 75.91,
    feePct: 1.5,
    kind: "mandi",
    factor: 0.98,
  },

  // Andhra Pradesh
  {
    id: "mdp",
    names: { en: "Madanapalle Tomato Yard", te: "మదనపల్లె మార్కెట్ యార్డ్", hi: "मदनपल्ले यार्ड" },
    state: "Andhra Pradesh",
    district: "Annamayya / Chittoor",
    lat: 13.55,
    lng: 78.5,
    feePct: 1.0,
    kind: "mandi",
    factor: 1.04,
  },
  {
    id: "knl",
    names: { en: "Kurnool APMC", te: "కర్నూలు మార్కెట్ యార్డ్", hi: "कुरनूल मंडी" },
    state: "Andhra Pradesh",
    district: "Kurnool",
    lat: 15.83,
    lng: 78.04,
    feePct: 1.5,
    kind: "mandi",
    factor: 0.99,
  },
  {
    id: "gnt",
    names: { en: "Guntur Chilli Yard", te: "గుంటూరు మిర్చి యార్డ్", hi: "गुंटूर यार्ड" },
    state: "Andhra Pradesh",
    district: "Guntur",
    lat: 16.3,
    lng: 80.44,
    feePct: 1.5,
    kind: "mandi",
    factor: 1.02,
  },

  // Telangana
  {
    id: "bwp",
    names: {
      en: "Bowenpally (Hyderabad) Market",
      te: "బోయిన్‌పల్లి మార్కెట్",
      hi: "बोवेनपल्ली मंडी",
    },
    state: "Telangana",
    district: "Hyderabad",
    lat: 17.47,
    lng: 78.48,
    feePct: 2.0,
    kind: "mandi",
    factor: 1.09,
  },
  {
    id: "wgl",
    names: {
      en: "Enumamula (Warangal) Grain Yard",
      te: "ఏనుమాముల మార్కెట్ యార్డ్",
      hi: "वारंगल मंडी",
    },
    state: "Telangana",
    district: "Warangal",
    lat: 17.98,
    lng: 79.62,
    feePct: 1.5,
    kind: "mandi",
    factor: 1.01,
  },

  // Direct Buyers / FPOs (Pre-seeded demo entries)
  {
    id: "d-fpo",
    names: { en: "Kolar Horticultural FPO", kn: "ಕೋಲಾರ ತೋಟಗಾರಿಕಾ ಎಫ್‌ಪಿಒ", hi: "कोलार एफपीओ" },
    state: "Karnataka",
    district: "Kolar",
    lat: 13.13,
    lng: 78.14,
    feePct: 0,
    kind: "fpo",
    factor: 1.03,
    fixedKm: 6,
    phone: "+919845012345",
  },
  {
    id: "d-app",
    names: { en: "FreshCart Direct Collection Centre", hi: "फ्रेशकार्ट सीधा खरीद केंद्र" },
    state: "Karnataka",
    district: "Bengaluru Rural",
    lat: 13.25,
    lng: 77.6,
    feePct: 0,
    kind: "direct",
    factor: 1.05,
    fixedKm: 12,
    phone: "+919845098765",
  },
];

export const marketName = (m: Market, lang: Lang) => m.names[lang] ?? m.names.en;

/** Comprehensive extensible Location Hierarchy */
export interface VillageLocality {
  name: string;
  lat: number;
  lng: number;
}

export interface SubdistrictTaluk {
  name: string;
  villages: VillageLocality[];
}

export interface DistrictInfo {
  name: string;
  lat: number;
  lng: number;
  taluks: SubdistrictTaluk[];
}

export interface StateInfo {
  name: string;
  districts: DistrictInfo[];
}

export const LOCATION_DATA: Record<string, StateInfo> = {
  Karnataka: {
    name: "Karnataka",
    districts: [
      {
        name: "Kolar",
        lat: 13.14,
        lng: 78.13,
        taluks: [
          {
            name: "Kolar",
            villages: [
              { name: "Vokkaleri", lat: 13.08, lng: 78.15 },
              { name: "Sugatur", lat: 13.18, lng: 78.09 },
              { name: "Holur", lat: 13.22, lng: 78.18 },
            ],
          },
          {
            name: "Bangarapet",
            villages: [
              { name: "Kamasamudram", lat: 12.92, lng: 78.25 },
              { name: "Budikote", lat: 12.98, lng: 78.18 },
            ],
          },
          {
            name: "Malur",
            villages: [
              { name: "Tekal", lat: 13.02, lng: 78.01 },
              { name: "Lakkur", lat: 12.97, lng: 77.89 },
            ],
          },
          {
            name: "Srinivaspur",
            villages: [
              { name: "Ronur", lat: 13.38, lng: 78.22 },
              { name: "Yeldur", lat: 13.41, lng: 78.31 },
            ],
          },
        ],
      },
      {
        name: "Bengaluru Rural",
        lat: 13.28,
        lng: 77.53,
        taluks: [
          {
            name: "Devanahalli",
            villages: [
              { name: "Vijayapura", lat: 13.29, lng: 77.8 },
              { name: "Kundana", lat: 13.25, lng: 77.62 },
            ],
          },
          {
            name: "Doddaballapur",
            villages: [
              { name: "Sasalu", lat: 13.38, lng: 77.46 },
              { name: "Tubagere", lat: 13.35, lng: 77.61 },
            ],
          },
          {
            name: "Hosakote",
            villages: [
              { name: "Sulibele", lat: 13.15, lng: 77.83 },
              { name: "Nandagudi", lat: 13.18, lng: 77.93 },
            ],
          },
        ],
      },
      {
        name: "Mysuru",
        lat: 12.3,
        lng: 76.64,
        taluks: [
          {
            name: "Nanjangud",
            villages: [
              { name: "Hullahalli", lat: 12.18, lng: 76.6 },
              { name: "Kowlande", lat: 12.08, lng: 76.77 },
            ],
          },
          {
            name: "T. Narasipura",
            villages: [
              { name: "Bannur", lat: 12.33, lng: 76.86 },
              { name: "Mugur", lat: 12.2, lng: 76.95 },
            ],
          },
        ],
      },
      {
        name: "Chikkaballapur",
        lat: 13.43,
        lng: 77.73,
        taluks: [
          {
            name: "Chintamani",
            villages: [
              { name: "Muragamalla", lat: 13.39, lng: 78.11 },
              { name: "Batlahalli", lat: 13.48, lng: 78.23 },
            ],
          },
          {
            name: "Sidlaghatta",
            villages: [
              { name: "Jangamakote", lat: 13.26, lng: 77.86 },
              { name: "Dibburahalli", lat: 13.51, lng: 77.92 },
            ],
          },
        ],
      },
    ],
  },
  "Tamil Nadu": {
    name: "Tamil Nadu",
    districts: [
      {
        name: "Krishnagiri",
        lat: 12.52,
        lng: 78.21,
        taluks: [
          {
            name: "Hosur",
            villages: [
              { name: "Bagalur", lat: 12.82, lng: 77.95 },
              { name: "Berigai", lat: 12.79, lng: 78.05 },
            ],
          },
          {
            name: "Denkanikottai",
            villages: [
              { name: "Thally", lat: 12.58, lng: 77.67 },
              { name: "Anchetty", lat: 12.36, lng: 77.74 },
            ],
          },
        ],
      },
      {
        name: "Dindigul",
        lat: 10.36,
        lng: 77.98,
        taluks: [
          {
            name: "Oddanchatram",
            villages: [
              { name: "Ambilikai", lat: 10.51, lng: 77.78 },
              { name: "Virupachi", lat: 10.45, lng: 77.85 },
            ],
          },
        ],
      },
      {
        name: "Coimbatore",
        lat: 11.02,
        lng: 76.96,
        taluks: [
          {
            name: "Pollachi",
            villages: [
              { name: "Kinathukadavu", lat: 10.82, lng: 77.02 },
              { name: "Anamalai", lat: 10.58, lng: 76.93 },
            ],
          },
        ],
      },
    ],
  },
  Maharashtra: {
    name: "Maharashtra",
    districts: [
      {
        name: "Nashik",
        lat: 20.0,
        lng: 73.79,
        taluks: [
          {
            name: "Niphad",
            villages: [
              { name: "Lasalgaon", lat: 20.15, lng: 74.23 },
              { name: "Pimpalgaon Baswant", lat: 20.17, lng: 73.98 },
            ],
          },
          {
            name: "Dindori",
            villages: [
              { name: "Vani", lat: 20.32, lng: 73.9 },
              { name: "Janori", lat: 20.11, lng: 73.88 },
            ],
          },
        ],
      },
      {
        name: "Pune",
        lat: 18.52,
        lng: 73.86,
        taluks: [
          {
            name: "Junnar",
            villages: [
              { name: "Alephata", lat: 19.19, lng: 74.12 },
              { name: "Otur", lat: 19.26, lng: 73.97 },
            ],
          },
          {
            name: "Khed",
            villages: [
              { name: "Chakan", lat: 18.76, lng: 73.85 },
              { name: "Rajgurunagar", lat: 18.86, lng: 73.88 },
            ],
          },
        ],
      },
    ],
  },
  "Andhra Pradesh": {
    name: "Andhra Pradesh",
    districts: [
      {
        name: "Chittoor",
        lat: 13.22,
        lng: 79.1,
        taluks: [
          {
            name: "Madanapalle",
            villages: [
              { name: "Kurabalakota", lat: 13.65, lng: 78.48 },
              { name: "Nimmanapalle", lat: 13.57, lng: 78.61 },
            ],
          },
          {
            name: "Palamaner",
            villages: [
              { name: "Baireddipalle", lat: 13.12, lng: 78.63 },
              { name: "V Kota", lat: 12.95, lng: 78.58 },
            ],
          },
        ],
      },
      {
        name: "Guntur",
        lat: 16.3,
        lng: 80.44,
        taluks: [
          {
            name: "Tenali",
            villages: [
              { name: "Duggirala", lat: 16.33, lng: 80.63 },
              { name: "Kollipara", lat: 16.28, lng: 80.72 },
            ],
          },
        ],
      },
    ],
  },
  Telangana: {
    name: "Telangana",
    districts: [
      {
        name: "Warangal",
        lat: 17.97,
        lng: 79.59,
        taluks: [
          {
            name: "Narsampet",
            villages: [
              { name: "Chennaraopet", lat: 17.88, lng: 79.88 },
              { name: "Duggondi", lat: 17.95, lng: 79.79 },
            ],
          },
        ],
      },
      {
        name: "Hyderabad / Rangareddy",
        lat: 17.38,
        lng: 78.48,
        taluks: [
          {
            name: "Shamshabad",
            villages: [
              { name: "Kothur", lat: 17.15, lng: 78.28 },
              { name: "Shadnagar", lat: 17.06, lng: 78.21 },
            ],
          },
        ],
      },
    ],
  },
};

/** Flattened STATES dictionary for quick backward compatibility */
export const STATES: Record<string, Record<string, [number, number]>> = {
  Karnataka: {
    Kolar: [13.14, 78.13],
    "Bengaluru Rural": [13.28, 77.53],
    "Bengaluru Urban": [12.97, 77.59],
    Mysuru: [12.3, 76.64],
    Chikkaballapur: [13.43, 77.73],
    Dharwad: [15.46, 75.0],
    Belagavi: [15.86, 74.5],
    Tumakuru: [13.34, 77.1],
  },
  "Tamil Nadu": {
    Krishnagiri: [12.52, 78.21],
    Dindigul: [10.36, 77.98],
    Coimbatore: [11.02, 76.96],
    Chennai: [13.08, 80.27],
  },
  Maharashtra: {
    Nashik: [20.0, 73.79],
    Pune: [18.52, 73.86],
    Solapur: [17.66, 75.91],
    Ahmednagar: [19.09, 74.74],
  },
  "Andhra Pradesh": {
    Chittoor: [13.22, 79.1],
    Kurnool: [15.83, 78.04],
    Guntur: [16.3, 80.44],
  },
  Telangana: {
    Hyderabad: [17.38, 78.48],
    Rangareddy: [17.23, 78.27],
    Warangal: [17.97, 79.59],
  },
};

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/** 60-day deterministic price series generator simulating realistic APMC trends */
export function priceSeries(crop: Crop, m: Market, days = 60): number[] {
  const seed = hash(crop.id + m.id);
  const mf = m.factor * (0.95 + (seed % 100) / 1000);
  return Array.from({ length: days }, (_, i) => {
    const t = i - days + 1;
    const wave = 0.04 * Math.sin((i + seed) / 6);
    const noise = (((seed * (i + 7)) % 97) / 97 - 0.5) * 0.03;
    return Math.round(crop.basePrice * mf * (1 + crop.trend * t + wave + noise));
  });
}

export const PRICE_DATE = new Date().toISOString().slice(0, 10);

/** Mandi Price Record for the KisanMandi Dashboard */
export interface MandiPriceRecord {
  id: string;
  cropId: CropId;
  cropName: string;
  marketId: string;
  marketName: string;
  state: string;
  district: string;
  arrivalDate: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  priceUnit: "₹ / quintal";
  sourceName: string;
  retrievalTimestamp: string;
  freshnessStatus: "live" | "demo" | "cached";
  isDemo: boolean;
}

/** Generate current mandi price table records */
export function getMandiPriceRecords(
  filterCrop?: CropId,
  filterState?: string,
): MandiPriceRecord[] {
  const records: MandiPriceRecord[] = [];
  const cropsToInclude = filterCrop ? [cropById(filterCrop)] : CROPS.slice(0, 8);
  const marketsToInclude = filterState
    ? MARKETS.filter((m) => m.state === filterState && m.kind === "mandi")
    : MARKETS.filter((m) => m.kind === "mandi");

  const today = new Date().toISOString().slice(0, 10);
  const timestamp = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  cropsToInclude.forEach((c) => {
    marketsToInclude.forEach((m) => {
      const s = priceSeries(c, m, 7);
      const modal = s[s.length - 1];
      const min = Math.round(modal * 0.92);
      const max = Math.round(modal * 1.08);

      records.push({
        id: `${c.id}-${m.id}`,
        cropId: c.id,
        cropName: c.name,
        marketId: m.id,
        marketName: m.names.en,
        state: m.state,
        district: m.district,
        arrivalDate: today,
        minPrice: min,
        maxPrice: max,
        modalPrice: modal,
        priceUnit: "₹ / quintal",
        sourceName: "Agmarknet / DMI (Directorate of Marketing & Inspection)",
        retrievalTimestamp: `Today, ${timestamp}`,
        freshnessStatus: "demo",
        isDemo: true,
      });
    });
  });

  return records;
}

/** Pre-seeded Direct Buyers */
export interface BuyerListing {
  id: string;
  name: string;
  type: "fpo" | "retail_aggregator" | "processor" | "exporter";
  crop: CropId;
  cropName: string;
  pricePerQuintal: number;
  weeklyRequirementQ: number;
  location: string;
  phone: string;
  whatsapp: string;
  verifiedFpo: boolean;
  qualityDescription: string;
  isDemo: boolean;
}

export const DEMO_BUYERS: BuyerListing[] = [
  {
    id: "b1",
    name: "Kolar Farmer Producers Co.",
    type: "fpo",
    crop: "tomato",
    cropName: "Tomato",
    pricePerQuintal: 1750,
    weeklyRequirementQ: 80,
    location: "Kolar APMC Outer Yard, Karnataka",
    phone: "+919845012341",
    whatsapp: "+919845012341",
    verifiedFpo: true,
    qualityDescription: "Grade A firm red tomatoes, crates only, minimal transit damage",
    isDemo: true,
  },
  {
    id: "b2",
    name: "Deccan Agro Processors",
    type: "processor",
    crop: "onion",
    cropName: "Onion",
    pricePerQuintal: 2350,
    weeklyRequirementQ: 120,
    location: "Yeshwanthpur Industrial Area, Bengaluru",
    phone: "+919845012342",
    whatsapp: "+919845012342",
    verifiedFpo: false,
    qualityDescription: "Medium to large dry onions, moisture content < 14%",
    isDemo: true,
  },
  {
    id: "b3",
    name: "Southern Feeds & Oil Mills",
    type: "processor",
    crop: "maize",
    cropName: "Maize",
    pricePerQuintal: 2280,
    weeklyRequirementQ: 250,
    location: "Dharwad APMC Bypass, Karnataka",
    phone: "+919845012343",
    whatsapp: "+919845012343",
    verifiedFpo: true,
    qualityDescription: "Yellow maize, feed grade, moisture under 12%, no fungus",
    isDemo: true,
  },
  {
    id: "b4",
    name: "Krishnagiri Cold Storage & Exports",
    type: "exporter",
    crop: "mango",
    cropName: "Mango",
    pricePerQuintal: 4600,
    weeklyRequirementQ: 90,
    location: "Hosur SIPCOT, Tamil Nadu",
    phone: "+919845012344",
    whatsapp: "+919845012344",
    verifiedFpo: false,
    qualityDescription: "Alphonso / Totapuri tree-ripened, uniform grading",
    isDemo: true,
  },
  {
    id: "b5",
    name: "Niphad Onion Export Consortium",
    type: "fpo",
    crop: "onion",
    cropName: "Onion",
    pricePerQuintal: 2420,
    weeklyRequirementQ: 160,
    location: "Lasalgaon Yard 2, Maharashtra",
    phone: "+919845012345",
    whatsapp: "+919845012345",
    verifiedFpo: true,
    qualityDescription: "Garwa variety cured bulbs, sorting certificate provided",
    isDemo: true,
  },
];

/** Organic Fertilizer & Manure Marketplace models */
export interface FertilizerListing {
  id: string;
  title: string;
  sellerName: string;
  sellerType: "farmer" | "fpo" | "rural_entrepreneur" | "certified_unit";
  category:
    "vermicompost" | "farmyard_manure" | "jeevamrutha" | "bio_fertilizer" | "poultry_manure";
  feedstockMethod: string;
  quantityAvailable: number;
  unit: "kg" | "quintal" | "tonne" | "litre";
  price: number;
  priceUnit: string;
  location: string;
  batchDate: string;
  packaging: string;
  deliveryOption: "self_pickup" | "transporter_share" | "seller_delivery";
  description: string;
  isDemo: boolean;
}

export const DEMO_FERTILIZERS: FertilizerListing[] = [
  {
    id: "f1",
    title: "Matured Earthworm Vermicompost (Eudrilus eugeniae)",
    sellerName: "Cauvery Organic Farmer Group",
    sellerType: "fpo",
    category: "vermicompost",
    feedstockMethod:
      "Desi cow dung + sugarcane bagasse aged for 65 days with African nightcrawlers",
    quantityAvailable: 40,
    unit: "quintal",
    price: 650,
    priceUnit: "₹ / quintal (₹6.5/kg)",
    location: "Mandya, Karnataka",
    batchDate: "2026-09-28",
    packaging: "50 kg HDPE moisture-proof bags with inner liner",
    deliveryOption: "transporter_share",
    description:
      "Dark brown, friable, earthy aroma. No weed seeds. Neutral pH 7.2. Nitrogen ~1.8%.",
    isDemo: true,
  },
  {
    id: "f2",
    title: "Fresh Desi Cow Jeevamrutha Concentrate",
    sellerName: "Shree Gir Gomata Natural Farm",
    sellerType: "farmer",
    category: "jeevamrutha",
    feedstockMethod:
      "Indigenous Gir cow dung, urine, jaggery, pulse flour and undisturbed forest soil inoculum, fermented 9 days",
    quantityAvailable: 300,
    unit: "litre",
    price: 18,
    priceUnit: "₹ / litre",
    location: "Kolar, Karnataka",
    batchDate: "2026-10-06",
    packaging: "35 L and 50 L food-grade carboys with gas-release vents",
    deliveryOption: "self_pickup",
    description:
      "Active microbial liquid bio-stimulant for fertigation / drip lines. Dilute 1:10 with irrigation water.",
    isDemo: true,
  },
  {
    id: "f3",
    title: "Well-Rotted Pit Farmyard Manure (FYM)",
    sellerName: "Kalleshappa G. & Sons",
    sellerType: "farmer",
    category: "farmyard_manure",
    feedstockMethod: "Deep pit decomposed cattle dung and paddy straw composted over 6 months",
    quantityAvailable: 8,
    unit: "tonne",
    price: 2400,
    priceUnit: "₹ / tonne",
    location: "Doddaballapur, Karnataka",
    batchDate: "2026-08-15",
    packaging: "Loose tractor trolley load or bulk polybags",
    deliveryOption: "seller_delivery",
    description:
      "Thoroughly decomposed crumbly manure. High humus content to improve moisture retention in red sandy loams.",
    isDemo: true,
  },
  {
    id: "f4",
    title: "Phosphate Solubilizing & Azotobacter Bio-Fertilizer",
    sellerName: "Sahaja Krishi Kendra",
    sellerType: "certified_unit",
    category: "bio_fertilizer",
    feedstockMethod:
      "Lignite carrier-based beneficial soil bacterial cultures (PSB + Azotobacter chroococcum)",
    quantityAvailable: 25,
    unit: "quintal",
    price: 1200,
    priceUnit: "₹ / quintal",
    location: "Tumakuru, Karnataka",
    batchDate: "2026-09-10",
    packaging: "1 kg pouches packed in 25 kg master cartons",
    deliveryOption: "transporter_share",
    description:
      "Seed treatment and root dip for millets, pulses and vegetables to enhance biological nitrogen fixation and phosphorus uptake.",
    isDemo: true,
  },
];

/** Farmer Training & Extension Workshops */
export interface WorkshopSession {
  id: string;
  title: string;
  category:
    | "mandi_awareness"
    | "cost_accounting"
    | "organic_manure"
    | "post_harvest_storage"
    | "lantana_safety";
  organizer: string;
  date: string;
  time: string;
  mode: "offline" | "hybrid" | "online";
  locationOrLink: string;
  seatsTotal: number;
  seatsBooked: number;
  description: string;
  isDemo: boolean;
}

export const DEMO_WORKSHOPS: WorkshopSession[] = [
  {
    id: "w1",
    title: "Reading Mandi Spreads & Timing Truck Freight",
    category: "mandi_awareness",
    organizer: "APMC Krishi Sahayata & FPO Federation",
    date: "2026-10-24",
    time: "10:30 AM - 1:00 PM",
    mode: "offline",
    locationOrLink: "Kolar APMC Farmers Hall, Market Yard, Kolar",
    seatsTotal: 40,
    seatsBooked: 26,
    description:
      "Learn how to calculate true net revenue after loading, transit spoilage and market gate deductions before dispatching your crop.",
    isDemo: true,
  },
  {
    id: "w2",
    title: "On-Farm Waste Composting & Safe Soil Conditioning",
    category: "organic_manure",
    organizer: "Krishi Vigyan Kendra (KVK) Extension Wing",
    date: "2026-11-02",
    time: "2:00 PM - 5:00 PM",
    mode: "offline",
    locationOrLink: "KVK Demonstration Farm, Chikkaballapur Road",
    seatsTotal: 35,
    seatsBooked: 18,
    description:
      "Hands-on demonstration of NADEP compost pits, moisture monitoring, pit turning schedules and biological accelerators.",
    isDemo: true,
  },
  {
    id: "w3",
    title: "Post-Harvest Grain Protection & Storage Hygiene",
    category: "post_harvest_storage",
    organizer: "Indian Institute of Food Processing Technology (Extension Partner)",
    date: "2026-11-12",
    time: "11:00 AM - 12:30 PM",
    mode: "online",
    locationOrLink: "Live Video Workshop (Free access for registered farmers)",
    seatsTotal: 100,
    seatsBooked: 44,
    description:
      "Best practices in hermetic grain storage bags, safe moisture testing (<12%), warehouse rodent proofing and avoiding unverified home chemical formulations.",
    isDemo: true,
  },
];

/** Transport Vehicle Specifications & Options */
export interface TransportVehicleOption {
  id: string;
  name: string;
  capacityKg: number;
  capacityQuintals: number;
  estimatedBaseRatePerKm: number;
  idealFor: string;
}

export const TRANSPORT_VEHICLES: TransportVehicleOption[] = [
  {
    id: "pickup",
    name: "Mini Pickup (e.g., Mahindra Bolero / Dost)",
    capacityKg: 1000,
    capacityQuintals: 10,
    estimatedBaseRatePerKm: 18,
    idealFor: "1 to 10 quintals of vegetables, fruits or bagged pulses",
  },
  {
    id: "ace",
    name: "Small Commercial (Tata Ace / Chota Hathi)",
    capacityKg: 750,
    capacityQuintals: 7.5,
    estimatedBaseRatePerKm: 14,
    idealFor: "Short distance market runs (under 50 km) for small harvests",
  },
  {
    id: "truck_407",
    name: "Light Truck (Tata 407 / Eicher 1049)",
    capacityKg: 3500,
    capacityQuintals: 35,
    estimatedBaseRatePerKm: 28,
    idealFor: "Group shipments, FPO aggregate dispatches to distant terminal mandis",
  },
  {
    id: "tractor",
    name: "Tractor Trolley",
    capacityKg: 5000,
    capacityQuintals: 50,
    estimatedBaseRatePerKm: 32,
    idealFor: "Bulk cereal grains, paddy bags and onions to local APMC within 30 km",
  },
];

/** Lantana Eco-Guard Verified Scientific References & Study Summaries */
export interface ResearchStudySummary {
  citation: string;
  pmcId: string;
  doi: string;
  journal: string;
  authors: string;
  year: number;
  studyType:
    "Laboratory Fumigant & Contact Bioassay" | "Essential Oil Chemical Composition & Bioassay";
  testedPests: string[];
  keyVerifiedFindings: string;
  crucialLimitations: string;
  regulatoryStatus: string;
}

export const LANTANA_RESEARCH_STUDIES: ResearchStudySummary[] = [
  {
    citation:
      "Rajashekar Y, Ravindra KV, Bakthavatsalam N. (2014) Leaves of Lantana camara Linn. (Verbenaceae) as a potential insecticide for the management of three species of stored grain insect pests. Journal of Food Science and Technology, 51(11):3494-3499.",
    pmcId: "PMC4571242",
    doi: "10.1007/s13197-012-0884-8",
    journal: "Journal of Food Science and Technology",
    authors: "Y. Rajashekar, K. V. Ravindra, N. Bakthavatsalam",
    year: 2014,
    studyType: "Laboratory Fumigant & Contact Bioassay",
    testedPests: [
      "Sitophilus oryzae (Rice weevil)",
      "Callosobruchus chinensis (Adzuki / pulse beetle)",
      "Tribolium castaneum (Rust red flour beetle)",
    ],
    keyVerifiedFindings:
      "Methanol extract from dried Lantana camara leaves exhibited laboratory fumigant and contact toxicity. In fumigant assays, LC50 values were 128 μl/L (S. oryzae), 130.3 μl/L (C. chinensis), and 178.7 μl/L (T. castaneum). In grain treatment assays under controlled lab conditions, 500 mg/L over 7 days exposure suppressed F1 progeny emergence.",
    crucialLimitations:
      "All experiments were conducted in small closed glass laboratory containers (320 ml and 850 ml). The study did NOT test open farm storage, bulk warehouses, rodent repellency, or human/livestock food safety over long-term consumption.",
    regulatoryStatus:
      "Unregistered experimental research. Not approved as a commercial pesticide or grain protectant.",
  },
  {
    citation:
      "Aisha K, Visakh NU, Pathrose B, Mori N, Baeshen RS, Shawer R. (2024) Extraction, Chemical Composition and Insecticidal Activities of Lantana camara Linn. Leaf Essential Oils against Tribolium castaneum, Lasioderma serricorne and Callosobruchus chinensis. Molecules, 29(2):344.",
    pmcId: "PMC10819012",
    doi: "10.3390/molecules29020344",
    journal: "Molecules",
    authors:
      "Kolapparamban Aisha, Naduvilthara U. Visakh, Berin Pathrose, Nicola Mori, Rowida S. Baeshen, Rady Shawer",
    year: 2024,
    studyType: "Essential Oil Chemical Composition & Bioassay",
    testedPests: [
      "Tribolium castaneum (Red flour beetle)",
      "Lasioderma serricorne (Cigarette beetle)",
      "Callosobruchus chinensis (Pulse beetle)",
    ],
    keyVerifiedFindings:
      "Hydrodistillation of Lantana camara leaves yielded 0.24 ± 0.01% essential oil. GC-MS/MS identified major phytochemicals: caryophyllene (69.96%), isoledene (12%), and α-copaene (4.11%). The oil demonstrated laboratory fumigant toxicity (24-hour LC50 of 16.70 mg/L air for T. castaneum, 4.141 mg/L air for L. serricorne, 6.245 mg/L air for C. chinensis) and repellency without inhibiting paddy seed germination in lab dish assays.",
    crucialLimitations:
      "Extracted using specialized Clevenger hydrodistillation apparatus. Low oil yield (0.24%) requires large volumes of raw biomass. Study was confined to in-vitro laboratory chambers and did NOT establish safety for human food contact, inhalation by workers, or safe household storage.",
    regulatoryStatus:
      "Scientific publication on chemical volatile properties; no regulatory approval for agricultural food grain fumigation.",
  },
];
