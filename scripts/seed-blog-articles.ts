/**
 * Seed script — run with: npx tsx scripts/seed-blog-articles.ts
 * Inserts 10 SEO-optimized Arabic/bilingual blog articles into Supabase
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const NOW = new Date().toISOString();

const articles = [
  {
    slug: "best-dog-food-egypt-2026",
    title_en: "Best Dog Food in Egypt 2026 (Complete Guide)",
    title_ar: "أفضل أكل كلاب في مصر 2026 (دليل شامل)",
    excerpt_en:
      "A complete guide to the best dog food brands available in Egypt in 2026, including Royal Canin, Purina Pro Plan, and Josera — with a quick comparison and buying tips.",
    excerpt_ar:
      "دليل شامل لأفضل أنواع أكل الكلاب المتاحة في مصر في 2026، يشمل رويال كانين وبيورينا برو بلان وجوسيرا — مع مقارنة سريعة ونصائح الشراء.",
    content_en:
      "Quick Answer: The best dog food brands in Egypt right now are Royal Canin, Purina Pro Plan, and Josera.\n\nWhy Does Food Choice Matter?\n\nThe food you choose directly affects your dog's digestion, energy levels, and coat health. A quality diet is the foundation of a long, healthy life.\n\nQuick Comparison\n\nRoyal Canin: Breed-specific formulas with targeted nutrition for each dog size and life stage.\nPurina Pro Plan: Excellent nutritional balance backed by veterinary research.\nJosera: Strong value for money with high-quality ingredients.\n\nCommon Mistakes to Avoid\n\nChoosing the cheapest option without checking ingredients. Switching foods abruptly — always transition over 7-10 days. Ignoring the ingredient list and choosing based on packaging alone.\n\nFrequently Asked Questions\n\nIs Royal Canin the best? It is excellent for specific health conditions and breed sizes. For general adult dogs, Purina Pro Plan is a strong competitor.\n\nWhere to Buy?\n\nAlways choose a trusted source that guarantees product authenticity and proper storage.",
    content_ar:
      "الإجابة السريعة: أفضل أكل كلاب في مصر حاليًا هو Royal Canin وPurina Pro Plan وJosera.\n\nليه الاختيار مهم؟\n\nالأكل بيأثر مباشرة على صحة هضم الكلب ومستوى نشاطه وشكل فروه. التغذية الجيدة هي أساس حياة طويلة وصحية.\n\nمقارنة سريعة بين الأنواع الأفضل\n\nRoyal Canin: تركيبات مخصصة حسب السلالة والحجم والمرحلة العمرية.\nPurina Pro Plan: توازن غذائي ممتاز مدعوم بأبحاث بيطرية.\nJosera: قيمة قوية مقابل السعر مع مكونات عالية الجودة.\n\nأخطاء شائعة يجب تجنبها\n\nاختيار الأرخص دون فحص المكونات. تغيير الأكل فجأة — يجب التحويل تدريجيًا على مدار 7-10 أيام. تجاهل قائمة المكونات والاختيار بناءً على التغليف فقط.\n\nأسئلة شائعة\n\nهل Royal Canin هو الأفضل دائمًا؟ ممتاز للحالات الصحية الخاصة والسلالات المحددة. لكلاب البالغين بشكل عام، Purina Pro Plan منافس قوي.\n\nمنين تشتري؟\n\nاختار دائمًا مصدرًا موثوقًا يضمن أصالة المنتج والتخزين الصحيح.",
    author: "PAWS Egypt",
    is_published: true,
    published_at: NOW,
  },
  {
    slug: "best-cat-food-egypt",
    title_en: "Best Cat Food in Egypt (Vet-Recommended Brands)",
    title_ar: "أفضل أكل قطط في مصر",
    excerpt_en:
      "A guide to the top cat food brands in Egypt including Whiskas and Purina, with advice on dry vs wet food and feeding by life stage.",
    excerpt_ar:
      "دليل لأفضل أنواع أكل القطط في مصر يشمل ويسكاس وبيورينا، مع نصائح عن الأكل الجاف والمبلل والتغذية حسب العمر.",
    content_en:
      "Quick Answer: The top cat food brands available in Egypt are Whiskas and Purina.\n\nTypes of Cat Food\n\nDry food (kibble): Convenient, supports dental health, and has a long shelf life.\nWet food (pouches/cans): Higher moisture content, great for hydration and palatability.\n\nBest Choice by Life Stage\n\nKittens: Combine wet and dry food for nutrients and hydration.\nAdult cats: Dry food as the base, with occasional wet food for variety.\nSenior cats: Wet food is often easier to chew and digest.\n\nCommon Mistake\n\nFeeding only one food type forever. Rotating between wet and dry improves nutrition and keeps your cat interested in eating.\n\nFrequently Asked Questions\n\nIs Whiskas enough on its own? It's a good baseline, but rotating with higher-protein options gives better long-term results.",
    content_ar:
      "الإجابة السريعة: أفضل أنواع أكل القطط المتاحة في مصر هي Whiskas وPurina.\n\nأنواع أكل القطط\n\nالأكل الجاف (Dry food): مريح ويدعم صحة الأسنان وله مدة صلاحية طويلة.\nالأكل المبلل (Wet food): يحتوي على نسبة رطوبة أعلى، رائع للترطيب والشهية.\n\nالأفضل حسب العمر\n\nقطط صغيرة: امزج الأكل المبلل والجاف للحصول على المغذيات والترطيب معًا.\nقطط بالغة: الأكل الجاف كأساس مع الأكل المبلل بشكل دوري للتنويع.\nقطط كبيرة في السن: الأكل المبلل غالبًا أسهل في المضغ والهضم.\n\nخطأ شائع\n\nتقديم نوع واحد فقط طول الوقت. التنويع بين الجاف والمبلل يحسن التغذية ويبقي قطتك مهتمة بالأكل.\n\nأسئلة شائعة\n\nهل Whiskas كافي وحده؟ جيد كأساس، لكن التنويع مع خيارات أعلى بروتينًا يعطي نتائج أفضل على المدى الطويل.",
    author: "PAWS Egypt",
    is_published: true,
    published_at: NOW,
  },
  {
    slug: "how-to-choose-pet-food",
    title_en: "How to Choose the Right Food for Your Pet",
    title_ar: "إزاي تختار أكل صح لحيوانك؟",
    excerpt_en:
      "Learn how to select the best pet food based on your animal's age, activity level, and health status — the three factors that matter most.",
    excerpt_ar:
      "تعرف على كيفية اختيار أفضل أكل لحيوانك بناءً على عمره ومستوى نشاطه وحالته الصحية — الثلاثة عوامل الأكثر أهمية.",
    content_en:
      "Quick Answer: Choose pet food based on your animal's age, activity level, and health condition.\n\nThe 3 Most Important Factors\n\n1. Protein content: Look for a named meat source (chicken, beef, fish) as the first ingredient. High protein supports muscle health and energy.\n\n2. Ingredient quality: Avoid foods with excessive fillers like corn syrup, artificial colors, or unnamed meat by-products.\n\n3. Nutritional balance: The food should meet AAFCO or similar nutritional standards for your pet's life stage.\n\nFrequently Asked Questions\n\nDoes price indicate quality? Not always — some mid-range brands offer excellent nutrition. Read the ingredient list rather than judging by price alone.",
    content_ar:
      "الإجابة السريعة: اختار أكل حيوانك بناءً على عمره ومستوى نشاطه وحالته الصحية.\n\nأهم 3 عوامل في اختيار الأكل الصح\n\n1. محتوى البروتين: دور على مصدر لحم مسمى (دجاج، لحم بقر، سمك) كأول مكون في القائمة. البروتين العالي يدعم صحة العضلات والطاقة.\n\n2. جودة المكونات: تجنب الأكل اللي فيه حشوات زيادة زي شراب الذرة أو ألوان صناعية أو مواد مجهولة المصدر.\n\n3. التوازن الغذائي: الأكل لازم يلبي المعايير الغذائية المناسبة لمرحلة حياة حيوانك.\n\nأسئلة شائعة\n\nهل السعر دليل على الجودة؟ مش دايمًا — بعض الماركات المتوسطة السعر بتوفر تغذية ممتازة. اقرأ قائمة المكونات بدل ما تحكم على السعر بس.",
    author: "PAWS Egypt",
    is_published: true,
    published_at: NOW,
  },
  {
    slug: "cheap-vs-expensive-pet-food",
    title_en: "Cheap vs Expensive Pet Food: Which Is Worth It?",
    title_ar: "الأكل الرخيص ولا الغالي؟ أيهما يستحق؟",
    excerpt_en:
      "Is expensive pet food really better? We break down the real differences between budget and premium brands and explain why investing in quality pays off.",
    excerpt_ar:
      "هل الأكل الغالي أفضل فعلًا؟ نشرح الفروق الحقيقية بين الماركات الاقتصادية والمميزة ولماذا الاستثمار في الجودة يستحق.",
    content_en:
      "Quick Answer: Premium pet food is generally better value in the long run, even though it costs more upfront.\n\nWhy Premium Usually Wins\n\nHigher quality ingredients mean better digestion and nutrient absorption. Fewer health issues over time translate to lower vet bills. Premium brands typically have more consistent quality control.\n\nPractical Example\n\nRoyal Canin vs generic store brand: Royal Canin uses breed-specific formulations with tested ingredient ratios. Generic brands often rely on cheaper fillers that provide little nutritional value.\n\nThe Bottom Line\n\nInvesting in your pet's nutrition is an investment in their health. A slightly higher monthly food cost can save significantly on veterinary care over your pet's lifetime.",
    content_ar:
      "الإجابة: الأكل الغالي بشكل عام قيمة أفضل على المدى الطويل، حتى لو تكلفته أعلى في البداية.\n\nليه الغالي بيكسب في الغالب؟\n\nمكونات أعلى جودة تعني هضمًا أفضل وامتصاصًا أفضل للمغذيات. مشاكل صحية أقل على المدى البعيد تعني فواتير بيطرية أقل. الماركات المميزة عادةً تتحكم في الجودة بشكل أكثر اتساقًا.\n\nمثال عملي\n\nRoyal Canin مقابل الماركات العادية: رويال كانين يستخدم تركيبات خاصة بكل سلالة مع نسب مكونات مُختبرة. الماركات العادية كثيرًا ما تعتمد على حشوات أرخص بقيمة غذائية قليلة.\n\nالخلاصة\n\nالاستثمار في تغذية حيوانك هو استثمار في صحته. تكلفة شهرية أعلى قليلًا للأكل يمكن أن توفر مبالغ كبيرة من تكاليف الرعاية البيطرية على مدى حياة حيوانك.",
    author: "PAWS Egypt",
    is_published: true,
    published_at: NOW,
  },
  {
    slug: "why-dog-wont-eat",
    title_en: "Why Won't My Dog Eat? Causes & Solutions",
    title_ar: "ليه كلبك مش عايز ياكل؟ الأسباب والحلول",
    excerpt_en:
      "If your dog is refusing food, it could be due to a food change, stress, or a health issue. Learn how to identify the cause and fix it.",
    excerpt_ar:
      "إذا كان كلبك يرفض الأكل، قد يكون بسبب تغيير الطعام أو التوتر أو مشكلة صحية. تعرف على كيفية تحديد السبب وحله.",
    content_en:
      "Common Causes of a Dog Refusing Food\n\n1. Sudden food change: Dogs have sensitive digestive systems. Switching foods abruptly causes stomach upset and food refusal.\n2. Stress or anxiety: Changes in environment, new pets, or loud noises can reduce appetite.\n3. Health issue: Dental pain, nausea, or illness can cause food refusal that requires veterinary attention.\n\nThe Solution\n\nTry switching to a high-quality, palatable food like Purina Pro Plan, which many dogs find more appealing. Transition slowly by mixing 25% new food with 75% old food, gradually increasing over a week.\n\nFrequently Asked Questions\n\nIs it normal for dogs to skip meals occasionally? Yes, sometimes — but if refusal lasts more than 2 days, consult a veterinarian.",
    content_ar:
      "أسباب شائعة لرفض الكلب الأكل\n\n1. تغيير مفاجئ في الأكل: كلاب عندها جهاز هضمي حساس. تغيير الأكل فجأة بيسبب اضطراب في المعدة ورفض للطعام.\n2. توتر أو قلق: التغييرات في البيئة أو حيوانات جديدة أو أصوات عالية ممكن تقلل الشهية.\n3. مشكلة صحية: ألم الأسنان أو الغثيان أو المرض ممكن يسببوا رفض الأكل وده بيحتاج اهتمام بيطري.\n\nالحل\n\nجرب التحويل لأكل عالي الجودة وشهي زي Purina Pro Plan اللي كتير من الكلاب بتجده أكثر جاذبية. تحول ببطء عن طريق خلط 25% أكل جديد مع 75% قديم، وزود النسبة تدريجيًا على مدار أسبوع.\n\nأسئلة شائعة\n\nهل طبيعي الكلب يتخطى وجبات أحيانًا؟ أيوه أحيانًا — لكن لو الرفض استمر أكتر من يومين، استشر طبيب بيطري.",
    author: "PAWS Egypt",
    is_published: true,
    published_at: NOW,
  },
  {
    slug: "cat-nutrition-guide-egypt",
    title_en: "Complete Cat Nutrition Guide for Egypt",
    title_ar: "دليل تغذية القطط الكامل في مصر",
    excerpt_en:
      "Everything you need to know about feeding cats in Egypt — from meal frequency and portion sizes to adjusting nutrition by age and health condition.",
    excerpt_ar:
      "كل ما تحتاج معرفته عن إطعام القطط في مصر — من تكرار الوجبات وحجم الحصص إلى تعديل التغذية حسب العمر والحالة الصحية.",
    content_en:
      "Basic Feeding Guideline\n\nFeed adult cats 2-3 times per day. Kittens under 6 months need 3-4 meals daily due to their faster metabolism and growth demands.\n\nFeeding by Age\n\nKittens (under 1 year): Require kitten-specific formulas with higher protein and fat for growth. Feed more frequently.\nAdult cats (1-7 years): Standard adult maintenance food, 2-3 times daily.\nSenior cats (7+ years): Lower calorie formulas, sometimes with joint or kidney support.\n\nFrequently Asked Questions\n\nDo cats need dietary variety? Yes — rotating between flavors and textures prevents dietary boredom and nutritional gaps.",
    content_ar:
      "الأساس الغذائي\n\nأطعم القطط البالغة 2-3 مرات يوميًا. القطط الصغيرة تحت 6 شهور محتاجة 3-4 وجبات يوميًا بسبب الأيض الأسرع واحتياجات النمو.\n\nالتغذية حسب العمر\n\nقطط صغيرة (تحت سنة): تحتاج تركيبات خاصة بالقطط الصغيرة بها بروتين ودهون أعلى للنمو. تُطعم بشكل أكثر تكرارًا.\nقطط بالغة (1-7 سنوات): أكل صيانة للبالغين القياسي، 2-3 مرات يوميًا.\nقطط كبيرة في السن (7 سنوات فأكثر): تركيبات أقل سعرات حرارية، أحيانًا مع دعم للمفاصل أو الكلى.\n\nأسئلة شائعة\n\nهل القطط تحتاج تنوعًا غذائيًا؟ نعم — التنويع بين النكهات والقوام يمنع الملل الغذائي ويملأ الثغرات الغذائية.",
    author: "PAWS Egypt",
    is_published: true,
    published_at: NOW,
  },
  {
    slug: "dry-vs-wet-food",
    title_en: "Dry vs Wet Pet Food: Which Is Better?",
    title_ar: "الفرق بين الأكل الجاف والمبلل: أيهما أفضل؟",
    excerpt_en:
      "Dry and wet pet food each have different benefits. Here is how to decide which is right for your cat or dog, and why combining both is often the best approach.",
    excerpt_ar:
      "الأكل الجاف والمبلل لكل منهما فوائد مختلفة. إليك كيفية تحديد الأنسب لقطتك أو كلبك، ولماذا الجمع بينهما هو الأفضل في الغالب.",
    content_en:
      "Quick Answer: Both types have real benefits. The best approach is usually a combination of both.\n\nDry Food Benefits\n\nSupports dental health by reducing tartar buildup. Easy to store and measure. More calorie-dense, so smaller portions are needed.\n\nWet Food Benefits\n\nHigher moisture content helps prevent urinary issues, especially in cats. More palatable for picky eaters. Easier to chew for senior pets or those with dental problems.\n\nProduct Examples\n\nWiskas pouches are a popular wet food option. Purina Pro Plan dry food is a trusted complete kibble.\n\nThe Bottom Line\n\nBalance is best. Combine dry food as the dietary base with wet food a few times a week for hydration and variety.",
    content_ar:
      "الإجابة السريعة: لكلا النوعين فوائد حقيقية. أفضل نهج عادةً هو الجمع بينهما.\n\nفوائد الأكل الجاف\n\nيدعم صحة الأسنان عن طريق تقليل تراكم الجير. سهل التخزين والقياس. أعلى كثافة سعرات حرارية، لذا الحصص أصغر.\n\nفوائد الأكل المبلل\n\nمحتوى رطوبة أعلى يساعد في منع مشاكل المسالك البولية، خاصةً في القطط. أكثر شهية لمن يأكل بصعوبة. أسهل في المضغ للحيوانات الكبيرة أو ذات مشاكل الأسنان.\n\nأمثلة على المنتجات\n\nأكياس Whiskas خيار شائع للأكل المبلل. Purina Pro Plan الجاف كيبل متكامل موثوق به.\n\nالخلاصة\n\nالتوازن هو الأفضل. اجمع الأكل الجاف كأساس غذائي مع الأكل المبلل بضع مرات أسبوعيًا للترطيب والتنويع.",
    author: "PAWS Egypt",
    is_published: true,
    published_at: NOW,
  },
  {
    slug: "pet-care-essentials",
    title_en: "Pet Care Essentials: The Complete Beginner's Guide",
    title_ar: "أساسيات العناية بالحيوانات الأليفة: الدليل الكامل للمبتدئين",
    excerpt_en:
      "New pet owner? Start here. This guide covers the three pillars of pet health — nutrition, hygiene, and activity — so your pet thrives from day one.",
    excerpt_ar:
      "مالك حيوان أليف جديد؟ ابدأ من هنا. هذا الدليل يغطي الركائز الثلاث لصحة الحيوان — التغذية والنظافة والنشاط — لكي يزدهر حيوانك من اليوم الأول.",
    content_en:
      "The Three Pillars of Pet Health\n\n1. Nutrition: Feed species-appropriate, life-stage-appropriate food from reputable brands. Avoid table scraps and toxic human foods.\n\n2. Hygiene: Regular grooming, dental care, and clean living spaces prevent illness and infections. Bathe dogs monthly and brush teeth weekly.\n\n3. Activity: Dogs need daily walks and play. Cats need stimulation through toys and climbing structures. Mental engagement is as important as physical exercise.\n\nKey Reminder\n\nHealth starts with routine. Consistent feeding times, regular vet check-ups, and daily interaction build a healthy, happy pet.",
    content_ar:
      "الركائز الثلاث لصحة الحيوان الأليف\n\n1. التغذية: أطعم حيوانك طعامًا مناسبًا لنوعه ومرحلة حياته من ماركات موثوقة. تجنب بقايا الطعام والأطعمة البشرية السامة للحيوانات.\n\n2. النظافة: العناية المنتظمة وتنظيف الأسنان والمساحات المعيشية النظيفة تمنع الأمراض والعدوى. استحم الكلاب شهريًا وفرش الأسنان أسبوعيًا.\n\n3. النشاط: الكلاب تحتاج نزهات يومية ولعب. القطط تحتاج تحفيزًا من خلال الألعاب وهياكل التسلق. التفاعل الذهني بنفس أهمية التمارين الجسدية.\n\nتذكير مهم\n\nالصحة تبدأ من الروتين. أوقات تغذية ثابتة وفحوصات بيطرية منتظمة وتفاعل يومي تبني حيوانًا صحيًا وسعيدًا.",
    author: "PAWS Egypt",
    is_published: true,
    published_at: NOW,
  },
  {
    slug: "how-to-know-food-is-right",
    title_en: "How to Tell If Your Pet's Food Is Working",
    title_ar: "إزاي تعرف إن الأكل مناسب لحيوانك؟",
    excerpt_en:
      "Your pet's body tells you a lot about whether their food is right. Learn the signs of good nutrition and when it is time to switch foods.",
    excerpt_ar:
      "جسم حيوانك يخبرك الكثير عما إذا كان طعامه مناسبًا. تعرف على علامات التغذية الجيدة ومتى حان وقت تغيير الأكل.",
    content_en:
      "Signs That Food Is Working Well\n\nHigh energy and alertness: A well-nourished pet is active and engaged, not lethargic.\nHealthy coat: Shiny, smooth fur with no excessive shedding or dull patches.\nGood digestion: Firm stools, no vomiting, and regular bowel movements indicate proper gut health.\n\nSigns It May Be Time to Switch\n\nDull, dry coat. Frequent loose stools or digestive upset. Weight loss or gain without change in portion size. Persistent low energy or lethargy.\n\nFrequently Asked Questions\n\nWhen should I change the food? When you notice ongoing health signs that suggest the current food is not meeting your pet's needs — and always consult your vet before switching.",
    content_ar:
      "علامات أن الأكل يعمل بشكل جيد\n\nطاقة عالية وانتباه: الحيوان المغذى جيدًا يكون نشيطًا ومتفاعلًا، مش كسولًا.\nفرو صحي: فرو لامع وناعم بدون تساقط مفرط أو بقع خافتة.\nهضم جيد: براز متماسك وعدم القيء وحركات أمعاء منتظمة تدل على صحة جهاز الهضم.\n\nعلامات قد تدل على وقت التغيير\n\nفرو خافت وجاف. إسهال متكرر أو اضطراب هضمي. فقدان وزن أو زيادته دون تغيير في حجم الحصة. طاقة منخفضة مستمرة أو خمول.\n\nأسئلة شائعة\n\nمتى أغير الأكل؟ عندما تلاحظ علامات صحية مستمرة تشير إلى أن الأكل الحالي لا يلبي احتياجات حيوانك — واستشر طبيبك البيطري دائمًا قبل التغيير.",
    author: "PAWS Egypt",
    is_published: true,
    published_at: NOW,
  },
  {
    slug: "best-place-to-buy-pet-food-egypt",
    title_en: "Best Place to Buy Pet Food in Egypt",
    title_ar: "أفضل مكان لشراء أكل الحيوانات في مصر",
    excerpt_en:
      "Online shopping for pet food in Egypt offers better selection, competitive prices, and home delivery. Here is what to look for in a trusted supplier.",
    excerpt_ar:
      "التسوق أونلاين لأكل الحيوانات في مصر يوفر تشكيلة أفضل وأسعارًا تنافسية وتوصيل للمنزل. إليك ما تبحث عنه في مورد موثوق.",
    content_en:
      "Quick Answer: Online shopping from a trusted source is the best option for buying pet food in Egypt.\n\nAdvantages of Shopping Online\n\nConvenience: Order from home without carrying heavy bags. Wider selection: Access to international brands not always available in local pet stores. Home delivery: Fresh products delivered directly to your door. Better prices: Online suppliers often offer competitive pricing and bundle deals.\n\nWhat to Look for in a Supplier\n\nAuthentic products from official brand distributors. Proper storage and temperature-controlled shipping for sensitive items. Clear return and refund policy. Positive customer reviews and transparent product information.\n\nKey Takeaway\n\nChoose a source that offers quality, speed, and trust. Your pet deserves consistent access to the best nutrition available.",
    content_ar:
      "الإجابة السريعة: التسوق أونلاين من مصدر موثوق هو أفضل خيار لشراء أكل الحيوانات في مصر.\n\nمميزات التسوق أونلاين\n\nالراحة: اطلب من المنزل بدون حمل أكياس ثقيلة. تشكيلة أوسع: الوصول لماركات دولية مش دايمًا متاحة في محلات الحيوانات المحلية. توصيل للمنزل: منتجات طازجة توصل مباشرةً لبابك. أسعار أفضل: الموردون أونلاين غالبًا يقدموا أسعارًا تنافسية وعروض تجميعية.\n\nما تبحث عنه في المورد\n\nمنتجات أصلية من موزعين رسميين للماركات. تخزين صحيح وشحن بدرجة حرارة مناسبة للمنتجات الحساسة. سياسة إرجاع واسترداد واضحة. تقييمات إيجابية من العملاء ومعلومات منتج شفافة.\n\nالخلاصة\n\nاختار مصدرًا يوفر الجودة والسرعة والثقة. حيوانك يستحق وصولًا ثابتًا لأفضل تغذية متاحة.",
    author: "PAWS Egypt",
    is_published: true,
    published_at: NOW,
  },
];

async function main() {
  console.log(`Inserting ${articles.length} blog articles into Supabase...`);

  const { data, error } = await supabase
    .from("blog_posts")
    .insert(articles)
    .select("id, slug");

  if (error) {
    console.error("Error inserting articles:", error.message);
    process.exit(1);
  }

  console.log(`Successfully inserted ${data?.length ?? 0} articles:`);
  data?.forEach((row: { id: string; slug: string }) =>
    console.log(`  ✓ ${row.slug} (${row.id})`)
  );
}

main();
