/**
 * Seed script — run with: npx tsx scripts/seed-products.ts
 * Seeds categories and products into Supabase from petsegypt.com catalog data
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORIES = [
  { name_en: "Dog Dry Food", name_ar: "طعام كلاب جاف", sort_order: 1 },
  { name_en: "Dog Wet Food", name_ar: "طعام كلاب رطب", sort_order: 2 },
  { name_en: "Dog Treats", name_ar: "مكافآت كلاب", sort_order: 3 },
  { name_en: "Dog Pharmacy", name_ar: "صيدلية كلاب", sort_order: 4 },
  { name_en: "Dog Accessories", name_ar: "إكسسوارات كلاب", sort_order: 5 },
  { name_en: "Dog Grooming", name_ar: "عناية بالكلاب", sort_order: 6 },
  { name_en: "Cat Dry Food", name_ar: "طعام قطط جاف", sort_order: 7 },
  { name_en: "Cat Wet Food", name_ar: "طعام قطط رطب", sort_order: 8 },
  { name_en: "Cat Litter", name_ar: "رمل قطط", sort_order: 9 },
  { name_en: "Cat Accessories", name_ar: "إكسسوارات قطط", sort_order: 10 },
  { name_en: "Birds", name_ar: "طيور", sort_order: 11 },
  { name_en: "Small Pets", name_ar: "حيوانات صغيرة", sort_order: 12 },
];

interface ProductSeed {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  brand: string;
  category: string;
  price: number;
  cost_price: number;
  image_url: string;
  is_featured: boolean;
  weight?: string;
  tags: string[];
}

const PRODUCTS: ProductSeed[] = [
  // === DOG DRY FOOD ===
  {
    name_en: "Royal Canin Maxi Adult Dog Dry Food 15kg",
    name_ar: "رويال كانين ماكسي طعام كلاب بالغة جاف 15 كيلو",
    description_en: "Complete and balanced nutrition for large breed adult dogs. Supports joint health and optimal weight.",
    description_ar: "تغذية كاملة ومتوازنة للكلاب البالغة من السلالات الكبيرة. يدعم صحة المفاصل والوزن المثالي.",
    brand: "Royal Canin", category: "Dog Dry Food", price: 5000, cost_price: 4200,
    image_url: "https://petsegypt.com/web/image/product.product/3352/image_1920",
    is_featured: true, weight: "15kg", tags: ["dog", "dry-food", "large-breed"],
  },
  {
    name_en: "Royal Canin Mini Adult Dry Food 4kg",
    name_ar: "رويال كانين ميني طعام كلاب بالغة جاف 4 كيلو",
    description_en: "Tailored nutrition for small breed adult dogs. Highly digestible proteins for optimal stool quality.",
    description_ar: "تغذية مخصصة للكلاب البالغة من السلالات الصغيرة. بروتينات سهلة الهضم لجودة براز مثالية.",
    brand: "Royal Canin", category: "Dog Dry Food", price: 2150, cost_price: 1800,
    image_url: "https://petsegypt.com/web/image/product.product/4561/image_1920",
    is_featured: false, weight: "4kg", tags: ["dog", "dry-food", "small-breed"],
  },
  {
    name_en: "ALPHA Adult Dogs Dry Food 20kg",
    name_ar: "ألفا طعام كلاب بالغة جاف 20 كيلو",
    description_en: "Premium quality dry food for adult dogs of all breeds. Rich in protein and essential nutrients.",
    description_ar: "طعام جاف عالي الجودة للكلاب البالغة من جميع السلالات. غني بالبروتين والعناصر الغذائية الأساسية.",
    brand: "ALPHA", category: "Dog Dry Food", price: 1485, cost_price: 1200,
    image_url: "https://petsegypt.com/web/image/product.product/7272/image_1920",
    is_featured: false, weight: "20kg", tags: ["dog", "dry-food", "economy"],
  },
  {
    name_en: "Vita Day Active Dog Dry Food 20kg",
    name_ar: "فيتا داي طعام كلاب نشطة جاف 20 كيلو",
    description_en: "High energy formula for active dogs. Balanced nutrition to fuel daily activities and maintain muscle mass.",
    description_ar: "تركيبة عالية الطاقة للكلاب النشطة. تغذية متوازنة لتعزيز الأنشطة اليومية والحفاظ على كتلة العضلات.",
    brand: "Vita Day", category: "Dog Dry Food", price: 2900, cost_price: 2400,
    image_url: "https://petsegypt.com/web/image/product.product/6377/image_1920",
    is_featured: false, weight: "20kg", tags: ["dog", "dry-food", "active"],
  },
  {
    name_en: "OZZO High Premium Adult Dog Dry Food With Fresh Chicken 15kg",
    name_ar: "أوزو طعام كلاب بالغة جاف بالدجاج الطازج 15 كيلو",
    description_en: "Made with fresh chicken for superior taste. High premium formula with essential vitamins and minerals.",
    description_ar: "مصنوع من الدجاج الطازج لمذاق فائق. تركيبة عالية الجودة مع فيتامينات ومعادن أساسية.",
    brand: "OZZO", category: "Dog Dry Food", price: 1800, cost_price: 1500,
    image_url: "https://petsegypt.com/web/image/product.product/9201/image_1920",
    is_featured: true, weight: "15kg", tags: ["dog", "dry-food", "chicken"],
  },
  {
    name_en: "Super Canido Adult Dog Dry Food 20kg",
    name_ar: "سوبر كانيدو طعام كلاب بالغة جاف 20 كيلو",
    description_en: "Affordable nutrition for adult dogs. Provides complete daily nutrition with quality ingredients.",
    description_ar: "تغذية بأسعار معقولة للكلاب البالغة. توفر تغذية يومية كاملة بمكونات عالية الجودة.",
    brand: "Super Canido", category: "Dog Dry Food", price: 1300, cost_price: 1050,
    image_url: "https://petsegypt.com/web/image/product.product/6361/image_1920",
    is_featured: false, weight: "20kg", tags: ["dog", "dry-food", "economy"],
  },
  {
    name_en: "Bungee's Dry Food For Adult Dogs All Breeds 16kg",
    name_ar: "بانجيز طعام كلاب بالغة جاف لجميع السلالات 16 كيلو",
    description_en: "All-breed formula with balanced nutrition. Quality ingredients for healthy skin and shiny coat.",
    description_ar: "تركيبة لجميع السلالات مع تغذية متوازنة. مكونات عالية الجودة لبشرة صحية وفراء لامع.",
    brand: "Bungee's", category: "Dog Dry Food", price: 1700, cost_price: 1400,
    image_url: "https://petsegypt.com/web/image/product.product/8722/image_1920",
    is_featured: false, weight: "16kg", tags: ["dog", "dry-food", "all-breed"],
  },
  {
    name_en: "Silver Dry Dog Food With Chicken (+5 Months)",
    name_ar: "سيلفر طعام كلاب جاف بالدجاج (فوق 5 أشهر)",
    description_en: "Budget-friendly dry food for dogs over 5 months. Chicken-based formula with essential nutrients.",
    description_ar: "طعام جاف اقتصادي للكلاب فوق 5 أشهر. تركيبة أساسها الدجاج مع عناصر غذائية أساسية.",
    brand: "Silver", category: "Dog Dry Food", price: 45, cost_price: 35,
    image_url: "https://petsegypt.com/web/image/product.product/9705/image_1920",
    is_featured: false, tags: ["dog", "dry-food", "budget"],
  },

  // === DOG PHARMACY ===
  {
    name_en: "Bravecto Chewable Tablet For Large Dogs 20-40kg",
    name_ar: "برافيكتو أقراص للكلاب الكبيرة 20-40 كيلو",
    description_en: "Long-lasting flea and tick protection. One chewable tablet provides up to 12 weeks of protection.",
    description_ar: "حماية طويلة المدى من البراغيث والقراد. قرص واحد يوفر حماية تصل إلى 12 أسبوعاً.",
    brand: "Bravecto", category: "Dog Pharmacy", price: 2335, cost_price: 2000,
    image_url: "https://petsegypt.com/web/image/product.product/9135/image_1920",
    is_featured: true, tags: ["dog", "pharmacy", "flea-tick"],
  },
  {
    name_en: "Bravecto Chewable Tablet For Medium Dogs 10-20kg",
    name_ar: "برافيكتو أقراص للكلاب المتوسطة 10-20 كيلو",
    description_en: "Flea and tick prevention for medium dogs. One dose lasts up to 12 weeks.",
    description_ar: "حماية من البراغيث والقراد للكلاب المتوسطة. جرعة واحدة تستمر حتى 12 أسبوعاً.",
    brand: "Bravecto", category: "Dog Pharmacy", price: 2115, cost_price: 1800,
    image_url: "https://petsegypt.com/web/image/product.product/8791/image_1920",
    is_featured: false, tags: ["dog", "pharmacy", "flea-tick"],
  },

  // === DOG ACCESSORIES ===
  {
    name_en: "Petmoda Waterproof Bed Double Face Small 55x40",
    name_ar: "بيتمودا سرير مقاوم للماء صغير 55x40",
    description_en: "Double-face waterproof pet bed. Durable and easy to clean. Perfect for small dogs.",
    description_ar: "سرير حيوانات أليفة مقاوم للماء بوجهين. متين وسهل التنظيف. مثالي للكلاب الصغيرة.",
    brand: "Petmoda", category: "Dog Accessories", price: 735, cost_price: 600,
    image_url: "https://petsegypt.com/web/image/product.product/13124/image_1920",
    is_featured: false, tags: ["dog", "bed", "waterproof"],
  },
  {
    name_en: "Interactive Duck-Shaped Dog Treat Dispenser & Puzzle Feeder",
    name_ar: "لعبة توزيع طعام تفاعلية على شكل بطة للكلاب",
    description_en: "Keep your dog mentally stimulated with this fun puzzle feeder. Dispensing treats as they play.",
    description_ar: "حافظ على نشاط كلبك الذهني مع هذه اللعبة التفاعلية. توزع المكافآت أثناء اللعب.",
    brand: "Generic", category: "Dog Accessories", price: 635, cost_price: 500,
    image_url: "https://petsegypt.com/web/image/product.product/13124/image_1920",
    is_featured: false, tags: ["dog", "toy", "puzzle"],
  },

  // === DOG GROOMING ===
  {
    name_en: "Dr. Seidel Shampoo with Chlorhexidine for Cats & Dogs 220ml",
    name_ar: "دكتور سايدل شامبو بالكلورهيكسيدين للقطط والكلاب 220 مل",
    description_en: "Medicated shampoo with chlorhexidine for antibacterial and antifungal protection. Gentle on skin.",
    description_ar: "شامبو طبي بالكلورهيكسيدين للحماية المضادة للبكتيريا والفطريات. لطيف على البشرة.",
    brand: "Dr. Seidel", category: "Dog Grooming", price: 1165, cost_price: 950,
    image_url: "https://petsegypt.com/web/image/product.product/11576/image_1920",
    is_featured: false, tags: ["dog", "cat", "grooming", "shampoo"],
  },

  // === CAT DRY FOOD ===
  {
    name_en: "Royal Canin Indoor 27 Adult Cat Dry Food 400g",
    name_ar: "رويال كانين إندور 27 طعام قطط بالغة جاف 400 جرام",
    description_en: "Specially formulated for indoor cats. Helps reduce stool odour and maintains ideal weight.",
    description_ar: "مصمم خصيصاً للقطط المنزلية. يساعد في تقليل رائحة البراز والحفاظ على الوزن المثالي.",
    brand: "Royal Canin", category: "Cat Dry Food", price: 450, cost_price: 370,
    image_url: "https://petsegypt.com/web/image/product.product/11178/image_1920",
    is_featured: true, weight: "400g", tags: ["cat", "dry-food", "indoor"],
  },
  {
    name_en: "Royal Canin Persian Adult Cat Food 400g",
    name_ar: "رويال كانين بيرشن طعام قطط بالغة 400 جرام",
    description_en: "Tailored nutrition for Persian cats. Supports long coat health and digestive sensitivity.",
    description_ar: "تغذية مخصصة للقطط الفارسية. يدعم صحة الفراء الطويل وحساسية الجهاز الهضمي.",
    brand: "Royal Canin", category: "Cat Dry Food", price: 510, cost_price: 420,
    image_url: "https://petsegypt.com/web/image/product.product/11178/image_1920",
    is_featured: false, weight: "400g", tags: ["cat", "dry-food", "persian"],
  },
  {
    name_en: "Hills Prescription Diet Kidney Care k/d with Chicken",
    name_ar: "هيلز بريسكربشن دايت لرعاية الكلى بالدجاج",
    description_en: "Veterinary diet for cats with kidney issues. Clinically proven to improve quality of life.",
    description_ar: "نظام غذائي بيطري للقطط التي تعاني من مشاكل الكلى. مثبت سريرياً لتحسين جودة الحياة.",
    brand: "Hill's", category: "Cat Dry Food", price: 1910, cost_price: 1600,
    image_url: "https://petsegypt.com/web/image/product.product/11556/image_1920",
    is_featured: false, tags: ["cat", "dry-food", "prescription", "kidney"],
  },
  {
    name_en: "ALPHA Adult Cats Dry Food 20kg",
    name_ar: "ألفا طعام قطط بالغة جاف 20 كيلو",
    description_en: "Economical dry cat food with balanced nutrition. Suitable for all adult cat breeds.",
    description_ar: "طعام قطط جاف اقتصادي مع تغذية متوازنة. مناسب لجميع سلالات القطط البالغة.",
    brand: "ALPHA", category: "Cat Dry Food", price: 2510, cost_price: 2100,
    image_url: "https://petsegypt.com/web/image/product.product/10001/image_1920",
    is_featured: false, weight: "20kg", tags: ["cat", "dry-food", "economy"],
  },
  {
    name_en: "Bewi Cat Delicaties Rich in Chicken",
    name_ar: "بيوي كات ديليكاتيز غني بالدجاج",
    description_en: "Premium cat food rich in chicken. Irresistible taste with premium quality ingredients.",
    description_ar: "طعام قطط متميز غني بالدجاج. طعم لا يقاوم بمكونات عالية الجودة.",
    brand: "Bewi Cat", category: "Cat Dry Food", price: 5200, cost_price: 4400,
    image_url: "https://petsegypt.com/web/image/product.product/10058/image_1920",
    is_featured: true, tags: ["cat", "dry-food", "premium"],
  },
  {
    name_en: "Purina Cat Chow Adult with Salmon 1.5kg",
    name_ar: "بيورينا كات تشاو طعام قطط بالغة بالسلمون 1.5 كيلو",
    description_en: "Balanced nutrition with real salmon. Supports healthy digestion and strong immunity.",
    description_ar: "تغذية متوازنة مع السلمون الحقيقي. يدعم الهضم الصحي والمناعة القوية.",
    brand: "Purina", category: "Cat Dry Food", price: 575, cost_price: 470,
    image_url: "https://petsegypt.com/web/image/product.product/9156/image_1920",
    is_featured: false, weight: "1.5kg", tags: ["cat", "dry-food", "salmon"],
  },
  {
    name_en: "Homie Super Premium Adult Cat Dry Food with Chicken",
    name_ar: "هومي سوبر بريميوم طعام قطط بالغة جاف بالدجاج",
    description_en: "Super premium formula with real chicken. High protein content for active cats.",
    description_ar: "تركيبة سوبر بريميوم بالدجاج الحقيقي. نسبة بروتين عالية للقطط النشطة.",
    brand: "Homie", category: "Cat Dry Food", price: 455, cost_price: 370,
    image_url: "https://petsegypt.com/web/image/product.product/13527/image_1920",
    is_featured: false, tags: ["cat", "dry-food", "chicken"],
  },
  {
    name_en: "Silver Adult Cat Dry Food With Chicken",
    name_ar: "سيلفر طعام قطط بالغة جاف بالدجاج",
    description_en: "Budget-friendly cat food with chicken. Complete nutrition for everyday feeding.",
    description_ar: "طعام قطط اقتصادي بالدجاج. تغذية كاملة للتغذية اليومية.",
    brand: "Silver", category: "Cat Dry Food", price: 275, cost_price: 220,
    image_url: "https://petsegypt.com/web/image/product.product/11423/image_1920",
    is_featured: false, tags: ["cat", "dry-food", "budget"],
  },

  // === CAT WET FOOD ===
  {
    name_en: "Purina Felix As Good As It Looks Wet Cat Food 85g",
    name_ar: "بيورينا فيليكس طعام قطط رطب 85 جرام",
    description_en: "Delicious wet food with tender pieces in jelly. Irresistible taste cats love.",
    description_ar: "طعام رطب لذيذ مع قطع طرية في الجلي. طعم لا يقاوم تحبه القطط.",
    brand: "Purina", category: "Cat Wet Food", price: 55, cost_price: 42,
    image_url: "https://petsegypt.com/web/image/product.product/9149/image_1920",
    is_featured: false, tags: ["cat", "wet-food"],
  },
  {
    name_en: "Groovy Classic Pate Adult Cat Wet Food 400g",
    name_ar: "جروفي كلاسيك باتيه طعام قطط بالغة رطب 400 جرام",
    description_en: "Classic pate texture wet food. Rich and flavorful nutrition for adult cats.",
    description_ar: "طعام رطب بقوام الباتيه الكلاسيكي. تغذية غنية ولذيذة للقطط البالغة.",
    brand: "Groovy", category: "Cat Wet Food", price: 50, cost_price: 38,
    image_url: "https://petsegypt.com/web/image/product.product/9071/image_1920",
    is_featured: false, tags: ["cat", "wet-food", "pate"],
  },
  {
    name_en: "Master Adult Cat Wet Food in Sauce 80g",
    name_ar: "ماستر طعام قطط بالغة رطب بالصوص 80 جرام",
    description_en: "Tender chunks in delicious sauce. Affordable wet food option for everyday meals.",
    description_ar: "قطع طرية في صوص لذيذ. خيار اقتصادي للوجبات اليومية.",
    brand: "Master", category: "Cat Wet Food", price: 32, cost_price: 24,
    image_url: "https://petsegypt.com/web/image/product.product/10556/image_1920",
    is_featured: false, tags: ["cat", "wet-food", "budget"],
  },

  // === CAT LITTER ===
  {
    name_en: "Sanicat Clumping White Duo Vanilla Mandarin 10L",
    name_ar: "سانيكات كلامبينغ وايت فانيلا ماندرين 10 لتر",
    description_en: "Premium clumping cat litter with vanilla and mandarin scent. Superior odour control.",
    description_ar: "رمل قطط متكتل ممتاز برائحة الفانيلا والماندرين. تحكم فائق في الرائحة.",
    brand: "Sanicat", category: "Cat Litter", price: 425, cost_price: 340,
    image_url: "https://petsegypt.com/web/image/product.product/9862/image_1920",
    is_featured: true, tags: ["cat", "litter", "clumping", "scented"],
  },
  {
    name_en: "Cat's Way Clumping Baby Powder Scented 10L",
    name_ar: "كاتس واي رمل متكتل برائحة بودرة الأطفال 10 لتر",
    description_en: "Baby powder scented clumping litter. Excellent absorption and easy cleanup.",
    description_ar: "رمل متكتل برائحة بودرة الأطفال. امتصاص ممتاز وتنظيف سهل.",
    brand: "Cat's Way", category: "Cat Litter", price: 260, cost_price: 200,
    image_url: "https://petsegypt.com/web/image/product.product/11374/image_1920",
    is_featured: false, tags: ["cat", "litter", "clumping"],
  },
  {
    name_en: "Kiki Kat Clumping Scented 20L",
    name_ar: "كيكي كات رمل متكتل معطر 20 لتر",
    description_en: "Large pack clumping cat litter with pleasant scent. Great value for multi-cat homes.",
    description_ar: "عبوة كبيرة من الرمل المتكتل المعطر. قيمة رائعة للمنازل متعددة القطط.",
    brand: "Kiki Kat", category: "Cat Litter", price: 500, cost_price: 400,
    image_url: "https://petsegypt.com/web/image/product.product/9061/image_1920",
    is_featured: false, tags: ["cat", "litter", "clumping", "value"],
  },
  {
    name_en: "Wonder Cat Ultra Clumping 10kg",
    name_ar: "وندر كات رمل فائق التكتل 10 كيلو",
    description_en: "Ultra clumping formula for maximum absorption. Budget-friendly option for everyday use.",
    description_ar: "تركيبة فائقة التكتل لأقصى امتصاص. خيار اقتصادي للاستخدام اليومي.",
    brand: "Wonder Cat", category: "Cat Litter", price: 200, cost_price: 150,
    image_url: "https://petsegypt.com/web/image/product.product/8459/image_1920",
    is_featured: false, weight: "10kg", tags: ["cat", "litter", "budget"],
  },

  // === CAT ACCESSORIES ===
  {
    name_en: "2-in-1 Automatic Pet Feeder with Water Fountain 1.5L",
    name_ar: "وعاء طعام آلي 2 في 1 مع نافورة مياه 1.5 لتر",
    description_en: "Automatic food and water dispenser. Keeps food fresh and water flowing for your pet.",
    description_ar: "موزع طعام ومياه آلي. يحافظ على الطعام طازجاً والمياه متدفقة لحيوانك الأليف.",
    brand: "Generic", category: "Cat Accessories", price: 1250, cost_price: 1000,
    image_url: "https://petsegypt.com/web/image/product.product/11893/image_1920",
    is_featured: true, tags: ["cat", "feeder", "water-fountain"],
  },
  {
    name_en: "Cat House Deluxe Multi-Level Cat Tree Tower",
    name_ar: "برج قطط متعدد المستويات ديلوكس",
    description_en: "Multi-level cat tree with scratching posts, platforms, and cozy hideaway. Perfect for active cats.",
    description_ar: "برج قطط متعدد المستويات مع أعمدة خدش ومنصات ومخبأ مريح. مثالي للقطط النشطة.",
    brand: "Cat House", category: "Cat Accessories", price: 2950, cost_price: 2400,
    image_url: "https://petsegypt.com/web/image/product.product/11790/image_1920",
    is_featured: false, tags: ["cat", "tree", "scratcher"],
  },
  {
    name_en: "Interactive Smart Pet Toy Rolling Ball",
    name_ar: "لعبة كرة ذكية تفاعلية للحيوانات الأليفة",
    description_en: "Self-rolling smart ball that keeps your cat entertained for hours. USB rechargeable.",
    description_ar: "كرة ذكية تتحرك ذاتياً تبقي قطتك مسلية لساعات. قابلة للشحن عبر USB.",
    brand: "Generic", category: "Cat Accessories", price: 225, cost_price: 170,
    image_url: "https://petsegypt.com/web/image/product.product/11828/image_1920",
    is_featured: false, tags: ["cat", "toy", "interactive"],
  },
  {
    name_en: "Groovy Pet Carrier Small",
    name_ar: "جروفي حقيبة حمل حيوانات أليفة صغيرة",
    description_en: "Lightweight and durable pet carrier. Well-ventilated with secure locking system.",
    description_ar: "حقيبة حمل خفيفة ومتينة. جيدة التهوية مع نظام إغلاق آمن.",
    brand: "Groovy", category: "Cat Accessories", price: 460, cost_price: 360,
    image_url: "https://petsegypt.com/web/image/product.product/10186/image_1920",
    is_featured: false, tags: ["cat", "carrier", "travel"],
  },

  // === BIRDS ===
  {
    name_en: "Birdo Golden Mix Parrot Food 500g",
    name_ar: "بيردو جولدن ميكس طعام ببغاوات 500 جرام",
    description_en: "Premium seed mix for parrots. Balanced blend of seeds, grains, and nutrients.",
    description_ar: "مزيج بذور ممتاز للببغاوات. خلطة متوازنة من البذور والحبوب والعناصر الغذائية.",
    brand: "Birdo", category: "Birds", price: 135, cost_price: 100,
    image_url: "https://petsegypt.com/web/image/product.product/11396/image_1920",
    is_featured: false, tags: ["bird", "food", "parrot"],
  },
  {
    name_en: "Golden & Dark Red Bird Cage with Door",
    name_ar: "قفص طيور ذهبي وأحمر داكن مع باب",
    description_en: "Elegant bird cage with spacious interior. Features easy-access door and removable tray.",
    description_ar: "قفص طيور أنيق بمساحة داخلية واسعة. يتميز بباب سهل الوصول وصينية قابلة للإزالة.",
    brand: "Generic", category: "Birds", price: 425, cost_price: 320,
    image_url: "https://petsegypt.com/web/image/product.product/11026/image_1920",
    is_featured: false, tags: ["bird", "cage"],
  },

  // === SMALL PETS ===
  {
    name_en: "3-Way Cat Tunnel Toy",
    name_ar: "لعبة نفق 3 مسارات للقطط",
    description_en: "Three-way collapsible tunnel for cats. Crinkle material and peek holes for extra fun.",
    description_ar: "نفق قابل للطي بثلاثة مسارات للقطط. مادة حفيفة وفتحات للمزيد من المرح.",
    brand: "Generic", category: "Small Pets", price: 375, cost_price: 280,
    image_url: "https://petsegypt.com/web/image/product.product/12230/image_1920",
    is_featured: false, tags: ["cat", "toy", "tunnel"],
  },
  {
    name_en: "Rechargeable Pet Nail Grinder",
    name_ar: "مبرد أظافر حيوانات أليفة قابل للشحن",
    description_en: "Safe and quiet pet nail grinder. USB rechargeable with multiple grinding speeds.",
    description_ar: "مبرد أظافر آمن وهادئ. قابل للشحن عبر USB مع سرعات طحن متعددة.",
    brand: "Generic", category: "Small Pets", price: 295, cost_price: 220,
    image_url: "https://petsegypt.com/web/image/product.product/12740/image_1920",
    is_featured: false, tags: ["pet", "grooming", "nail"],
  },
];

async function seed() {
  console.log("Seeding categories...");

  // Upsert categories
  const categoryMap = new Map<string, string>();

  for (const cat of CATEGORIES) {
    const { data, error } = await supabase
      .from("categories")
      .upsert(
        { ...cat, is_active: true },
        { onConflict: "name_en" }
      )
      .select("id, name_en")
      .single();

    if (error) {
      // Try insert if upsert fails (no unique constraint on name_en)
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("name_en", cat.name_en)
        .single();

      if (existing) {
        categoryMap.set(cat.name_en, existing.id);
        console.log(`  Category exists: ${cat.name_en}`);
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from("categories")
          .insert({ ...cat, is_active: true })
          .select("id")
          .single();

        if (insertErr) {
          console.error(`  Failed to insert category ${cat.name_en}:`, insertErr.message);
        } else if (inserted) {
          categoryMap.set(cat.name_en, inserted.id);
          console.log(`  Created: ${cat.name_en}`);
        }
      }
    } else if (data) {
      categoryMap.set(data.name_en, data.id);
      console.log(`  Upserted: ${data.name_en}`);
    }
  }

  console.log(`\nSeeding ${PRODUCTS.length} products...`);

  let created = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const categoryId = categoryMap.get(p.category);
    if (!categoryId) {
      console.error(`  No category found for: ${p.category}`);
      skipped++;
      continue;
    }

    // Check if product already exists by name
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("name_en", p.name_en)
      .single();

    if (existing) {
      console.log(`  Exists: ${p.name_en}`);
      skipped++;
      continue;
    }

    const sku = `PAWS-${p.name_en.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toUpperCase()}-${Date.now().toString(36).slice(-4)}`;

    const { data: product, error: prodErr } = await supabase
      .from("products")
      .insert({
        sku,
        name_en: p.name_en,
        name_ar: p.name_ar,
        description_en: p.description_en,
        description_ar: p.description_ar,
        category_id: categoryId,
        brand: p.brand,
        unit_type: "piece",
        images: [p.image_url],
        tags: p.tags,
        is_active: true,
        is_featured: p.is_featured,
      })
      .select("id")
      .single();

    if (prodErr) {
      console.error(`  Failed: ${p.name_en} — ${prodErr.message}`);
      skipped++;
      continue;
    }

    if (product) {
      // Create default variant
      const { error: varErr } = await supabase
        .from("product_variants")
        .insert({
          product_id: product.id,
          size: p.weight ?? null,
          price: p.price,
          cost_price: p.cost_price,
          is_active: true,
        });

      if (varErr) {
        console.error(`  Variant failed for ${p.name_en}: ${varErr.message}`);
      }

      created++;
      console.log(`  Created: ${p.name_en} — ${p.price} EGP`);
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
}

seed().catch(console.error);
