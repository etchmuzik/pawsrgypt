#!/usr/bin/env python3
"""Translate product names to Arabic and emit UPDATE SQL chunks."""
import json
import re

# Read product data (copied from DB)
PRODUCTS_JSON = "/tmp/products-for-translation.json"

# Protected brand patterns — these stay in English
BRAND_PROTECTIONS = [
    "Royal Canin", "Dog Chow", "Cat Chow", "Dog Bed", "Pets Republic", "Cat fun", "Cat-kota",
    "Max cat", "Vet star", "Royal Cat", "One Cat", "One & Only", "Pro dog",
    "Pet clay", "Benty sandy", "Mera", "KIKI Cat", "Ozzy Cat", "Filos", "Leonardo",
    "SMAX", "WAGS", "Club 4 paws", "Doodzy", "Compy Supreme", "Alpha",
    "chat&chat", "friskies", "Friskies", "Kippy", "nunbei", "Wanpy", "wanpy original",
    "Omni Guard", "Tri Pets", "Orgo organic", "Migma", "Bewi", "Gustosita",
    "Bentonix", "shiko", "vita max litter", "vita day", "vetro", "White brush",
    "Uarone", "Josi", "Sani cat", "King clean", "Ramlah", "OZZO", "gold litter",
    "Clothes", "Coloar", "Accessories",
]

# Translations applied AFTER brand protection
# Order matters: longer patterns first
TRANSLATIONS = [
    # Multi-word descriptors (must come before single words)
    (r'\bHair ball control\b', 'التحكم بكرات الشعر'),
    (r'\bHair ball\b', 'كرات الشعر'),
    (r'\bHAIR BALL\b', 'كرات الشعر'),
    (r'\bhair ball\b', 'كرات الشعر'),
    (r'\bDry Shampoo Foam\b', 'رغوة شامبو جاف'),
    (r'\bDry Shampoo foam\b', 'رغوة شامبو جاف'),
    (r'\bDry shampoo powder\b', 'بودرة شامبو جاف'),
    (r'\bDry shamopoo powder\b', 'بودرة شامبو جاف'),
    (r'\bDry shampoo\b', 'شامبو جاف'),
    (r'\bDry shamopoo\b', 'شامبو جاف'),
    (r'\bDry Shampoo\b', 'شامبو جاف'),
    (r'\bWet Food\b', 'طعام رطب'),
    (r'\bwet Food\b', 'طعام رطب'),
    (r'\bwet food\b', 'طعام رطب'),
    (r'\bWet food\b', 'طعام رطب'),
    (r'\bDry food\b', 'طعام جاف'),
    (r'\bDry Food\b', 'طعام جاف'),
    (r'\bdry food\b', 'طعام جاف'),
    (r'\bcat dry food\b', 'طعام قطط جاف'),
    (r'\bdog dry food\b', 'طعام كلاب جاف'),
    (r'\bcat food\b', 'طعام قطط'),
    (r'\bCat food\b', 'طعام قطط'),
    (r'\bdog food\b', 'طعام كلاب'),
    (r'\bpet food\b', 'طعام حيوانات'),
    (r'\bActive carbon\b', 'كربون نشط'),
    (r'\bActive litter\b', 'رمل نشط'),
    (r'\bSilica gel\b', 'جل سيليكا'),
    (r'\bin gravy\b', 'في صلصة'),
    (r'\bwith chicken\b', 'بالدجاج'),
    (r'\bwith beef\b', 'باللحم البقري'),
    (r'\bwith duck\b', 'بالبط'),
    (r'\bwith cheken\b', 'بالدجاج'),
    (r'\bwith chiken\b', 'بالدجاج'),
    (r'\bwith ckiken\b', 'بالدجاج'),
    (r'\bwith rabbit\b', 'بالأرنب'),
    (r'\bwith salmon\b', 'بالسلمون'),
    (r'\bwith tuna\b', 'بالتونة'),
    (r'\bwith turkey\b', 'بالرومي'),
    (r'\bwith chicken & turkey\b', 'بالدجاج والرومي'),
    (r'\bchicken & turkey\b', 'دجاج ورومي'),
    (r'\bbeef&chicken\b', 'لحم بقري ودجاج'),
    (r'\bBeef&rich\b', 'لحم بقري وأرز'),
    (r'\bBeef & rich\b', 'لحم بقري وأرز'),
    (r'\bchicken&rice\b', 'دجاج وأرز'),
    (r'\bchiken&rice\b', 'دجاج وأرز'),
    (r'\bbeef&rice\b', 'لحم بقري وأرز'),
    (r'\bliver&rice\b', 'كبد وأرز'),
    (r'\bturkey&rice\b', 'رومي وأرز'),
    (r'\bturky&rice\b', 'رومي وأرز'),
    (r'\bCan wet Food\b', 'علبة طعام رطب'),
    (r'\bPaws Care\b', 'عناية بالأقدام'),
    (r'\bTraning Pads\b', 'مرابح تدريب'),
    (r'\bTraining Pads\b', 'مرابح تدريب'),
    (r'\btraining pads\b', 'مرابح تدريب'),
    (r'\bTrainen spray\b', 'بخاخ تدريب'),
    (r'\bUrine off\b', 'مزيل بول'),
    (r'\bNo scratch\b', 'مانع خربشة'),
    (r'\bAnti - Scratch\b', 'مضاد للخربشة'),
    (r'\bAnti Scratch\b', 'مضاد للخربشة'),
    (r'\bFlea&Tick\b', 'البراغيث والقراد'),
    (r'\bFlea & Tick\b', 'البراغيث والقراد'),
    (r'\ball in one\b', 'متعدد الاستخدامات'),
    (r'\ball breeds\b', 'جميع السلالات'),
    (r'\bLARG ADULT\b', 'بالغ كبير'),
    (r'\bLARGE PUPPY\b', 'جرو كبير'),
    (r'\bSMALL PUPPY\b', 'جرو صغير'),
    (r'\bSMALL ADULT\b', 'بالغ صغير'),
    (r'\bGIANT ADULT\b', 'بالغ عملاق'),
    (r'\bGIANT PUPPY\b', 'جرو عملاق'),
    (r'\bADULT PERSIAN\b', 'بالغ شيرازي'),
    (r'\bDeodorizing pet spray\b', 'بخاخ معطر للحيوانات'),
    (r'\bAdult small Breeds\b', 'بالغ للسلالات الصغيرة'),
    (r'\bAdult larg Breeds\b', 'بالغ للسلالات الكبيرة'),
    (r'\bAdult Larg Breeds\b', 'بالغ للسلالات الكبيرة'),
    (r'\bAdult Cats\b', 'قطط بالغة'),
    (r'\bAdult Dog\b', 'كلب بالغ'),
    (r'\bAdult dog\b', 'كلب بالغ'),
    (r'\badult dogs\b', 'كلاب بالغة'),
    (r'\badult cat\b', 'قطة بالغة'),
    (r'\bAdult cat\b', 'قطة بالغة'),
    (r'\bmini puppy\b', 'جرو ميني'),
    (r'\bBasic adult dog\b', 'كلب بالغ أساسي'),
    (r'\bSuper premium\b', 'سوبر بريميوم'),
    (r'\bsuper premium\b', 'سوبر بريميوم'),
    (r'\bMini Adult\b', 'بالغ ميني'),
    (r'\bMaxi Adult\b', 'بالغ ماكسي'),
    (r'\bGiant Adult\b', 'بالغ عملاق'),
    (r'\bPersian Kitten\b', 'قطة شيرازي صغيرة'),
    (r'\bSterilised Chicken\b', 'دجاج معقم'),
    (r'\bsterilised salmon\b', 'سلمون معقم'),
    (r'\bsterilised chicken\b', 'دجاج معقم'),
    (r'\bsterilized\b', 'معقم'),
    (r'\bsterilised\b', 'معقم'),
    (r'\bSterilised\b', 'معقم'),
    (r'\bSterilized\b', 'معقم'),
    (r'\bSTERALIZED\b', 'معقم'),
    (r'\bsteralized\b', 'معقم'),
    (r'\bHypoallergenic\b', 'مضاد للحساسية'),
    (r'\bHepatic\b', 'للكبد'),
    (r'\bUrinary care\b', 'عناية بالجهاز البولي'),
    (r'\bUrinary\b', 'للجهاز البولي'),
    (r'\bURINARY\b', 'للجهاز البولي'),
    (r'\bDigestive\b', 'للهضم'),
    (r'\bMountian Fresh\b', 'جبلي منعش'),
    (r'\bBaby Powder\b', 'بودرة بيبي'),
    (r'\bBaby powder\b', 'بودرة بيبي'),
    (r'\bbaby powder\b', 'بودرة بيبي'),
    (r'\bBaby baoder\b', 'بيبي بودرة'),
    (r'\bVBaby boder\b', 'بيبي بودرة'),
    (r'\bpet stand\b', 'حامل'),
    (r'\bPet sand\b', 'رمل حيوانات'),
    (r'\bPET SAND\b', 'رمل حيوانات'),
    (r'\bLAVDER\b', 'لافندر'),
    (r'\bCat litter box\b', 'صندوق رمل للقطط'),
    (r'\bcat litter\b', 'رمل قطط'),
    (r'\blittert box\b', 'صندوق رمل'),
    (r'\bMarseillie soap\b', 'صابون مرسيلي'),
    (r'\blow carb\b', 'كارب منخفض'),
    (r'\bsee fish\b', 'سمك بحر'),
    (r'\bBrush massage comb\b', 'فرشاة مساج مشط'),
    (r'\bvanilla mandarin\b', 'فانيليا يوسفي'),
    (r'\bmarcilia soup\b', 'صابون مرسيلي'),
    (r'\bBubble Gum\b', 'علكة'),
    (r'\bTutti Fruti\b', 'توتي فروتي'),
    (r'\bBe Delicious\b', 'لذيذ'),
    (r'\bTroptical twist\b', 'استوائي'),
    (r'\bla dolce vita\b', 'الحياة الحلوة'),
    (r'\bLapetite Mademoiselle\b', 'الآنسة الصغيرة'),
    (r'\bThe Avenger\b', 'المنتقم'),
    (r'\bCanamel Marshmaallow\b', 'كراميل مارشميلو'),
    (r'\bLotita Purple\b', 'لوتيتا بنفسجي'),
    (r'\bKitty Fruiti\b', 'فروتي'),
    (r'\bAloe vera\b', 'صبار'),
    (r'\bmother&baby\b', 'أم وبيبي'),
    (r'\bKitten reach &chicken\b', 'قطة صغيرة غني بالدجاج'),

    # Common words
    (r'\bpuppy\b', 'جرو'),
    (r'\bPuppy\b', 'جرو'),
    (r'\bPUPPY\b', 'جرو'),
    (r'\bkitten\b', 'قطة صغيرة'),
    (r'\bKitten\b', 'قطة صغيرة'),
    (r'\bKITTEN\b', 'قطة صغيرة'),
    (r'\bPersian\b', 'شيرازي'),
    (r'\bAdult\b', 'بالغ'),
    (r'\badult\b', 'بالغ'),
    (r'\bADULT\b', 'بالغ'),
    (r'\bJunior\b', 'صغير'),
    (r'\bJunnior\b', 'صغير'),
    (r'\bMaxi\b', 'ماكسي'),
    (r'\bmini\b', 'ميني'),
    (r'\bMini\b', 'ميني'),
    (r'\bGiant\b', 'عملاق'),
    (r'\bX - small\b', 'اكس سمول'),
    (r'\bX-small\b', 'اكس سمول'),
    (r'\bSmall\b', 'صغير'),
    (r'\bsmall\b', 'صغير'),
    (r'\bSMALL\b', 'صغير'),
    (r'\bMedium\b', 'متوسط'),
    (r'\bmedium\b', 'متوسط'),
    (r'\bLarge\b', 'كبير'),
    (r'\blarge\b', 'كبير'),
    (r'\bLARGE\b', 'كبير'),
    (r'\bLARG\b', 'كبير'),
    (r'\blarg\b', 'كبير'),
    (r'\bGIANT\b', 'عملاق'),
    (r'\bBreeds\b', 'سلالات'),
    (r'\bbreeds\b', 'سلالات'),
    (r'\bDog\b', 'كلب'),
    (r'\bDogs\b', 'كلاب'),
    (r'\bDOG\b', 'كلب'),
    (r'\bCat\b', 'قطة'),
    (r'\bCats\b', 'قطط'),
    (r'\bCAT\b', 'قطة'),
    (r'\bchicken\b', 'دجاج'),
    (r'\bChicken\b', 'دجاج'),
    (r'\bChiken\b', 'دجاج'),
    (r'\bchiken\b', 'دجاج'),
    (r'\bcheken\b', 'دجاج'),
    (r'\bckiken\b', 'دجاج'),
    (r'\bChickenwith\b', 'دجاج بـ'),
    (r'\bchickenwith\b', 'دجاج بـ'),
    (r'\bBeef\b', 'لحم بقري'),
    (r'\bbeef\b', 'لحم بقري'),
    (r'\bSalmon\b', 'سلمون'),
    (r'\bsalmon\b', 'سلمون'),
    (r'\bSalamon\b', 'سلمون'),
    (r'\bTuna\b', 'تونة'),
    (r'\btuna\b', 'تونة'),
    (r'\bShrimp\b', 'جمبري'),
    (r'\bshrimp\b', 'جمبري'),
    (r'\bduck\b', 'بط'),
    (r'\bDuck\b', 'بط'),
    (r'\bRabbit\b', 'أرنب'),
    (r'\brabbit\b', 'أرنب'),
    (r'\bturkey\b', 'رومي'),
    (r'\bturky\b', 'رومي'),
    (r'\bTurkey\b', 'رومي'),
    (r'\bliver\b', 'كبد'),
    (r'\bLiver\b', 'كبد'),
    (r'\brice\b', 'أرز'),
    (r'\bRice\b', 'أرز'),
    (r'\bvegtables\b', 'خضار'),
    (r'\bvegetables\b', 'خضار'),
    (r'\bfish\b', 'سمك'),
    (r'\bFish\b', 'سمك'),
    (r'\bpollo\b', 'دجاج'),
    (r'\bTreats\b', 'مكافآت'),
    (r'\btreats\b', 'مكافآت'),
    (r'\btreatsb\b', 'مكافآت'),
    (r'\bBiscuits\b', 'بسكويت'),
    (r'\bbiscuits\b', 'بسكويت'),
    (r'\bBiscits\b', 'بسكويت'),
    (r'\bCan\b', 'علبة'),
    (r'\bcan\b', 'علبة'),
    (r'\bLemon\b', 'ليمون'),
    (r'\blemon\b', 'ليمون'),
    (r'\bOrange\b', 'برتقال'),
    (r'\borange\b', 'برتقال'),
    (r'\bLavender\b', 'لافندر'),
    (r'\blavender\b', 'لافندر'),
    (r'\bLavanedr\b', 'لافندر'),
    (r'\bLavander\b', 'لافندر'),
    (r'\bStrawberry\b', 'فراولة'),
    (r'\bChocolate\b', 'شوكولاتة'),
    (r'\bVanilla\b', 'فانيليا'),
    (r'\bvanilla\b', 'فانيليا'),
    (r'\bCoffe\b', 'قهوة'),
    (r'\bCoffee\b', 'قهوة'),
    (r'\bCarpaccio\b', 'كارباتشيو'),
    (r'\bshampoo\b', 'شامبو'),
    (r'\bShampoo\b', 'شامبو'),
    (r'\bshamopoo\b', 'شامبو'),
    (r'\bPowder\b', 'بودرة'),
    (r'\bpowder\b', 'بودرة'),
    (r'\bFoam\b', 'رغوة'),
    (r'\bfoam\b', 'رغوة'),
    (r'\bspray\b', 'بخاخ'),
    (r'\bSpray\b', 'بخاخ'),
    (r'\bPerfume\b', 'عطر'),
    (r'\bperfume\b', 'عطر'),
    (r'\bBrush\b', 'فرشاة'),
    (r'\bbrush\b', 'فرشاة'),
    (r'\bComb\b', 'مشط'),
    (r'\bcomb\b', 'مشط'),
    (r'\bmassage\b', 'مساج'),
    (r'\blitter\b', 'رمل'),
    (r'\bLitter\b', 'رمل'),
    (r'\bLITTER\b', 'رمل'),
    (r'\bBentonite\b', 'بنتونايت'),
    (r'\bscented\b', 'معطر'),
    (r'\bBaby\b', 'بيبي'),
    (r'\bbaby\b', 'بيبي'),
    (r'\bSoup\b', 'صابون'),
    (r'\bsoup\b', 'صابون'),
    (r'\bSOUP\b', 'صابون'),
    (r'\bboder\b', 'بودرة'),
    (r'\bbaoder\b', 'بودرة'),
    (r'\bSAND\b', 'رمل'),
    (r'\bSand\b', 'رمل'),
    (r'\bBED\b', 'سرير'),
    (r'\bBed\b', 'سرير'),
    (r'\bbed\b', 'سرير'),
    (r'\bHouse\b', 'منزل'),
    (r'\bhouse\b', 'منزل'),
    (r'\bBox\b', 'صندوق'),
    (r'\bbox\b', 'صندوق'),
    (r'\bcircle\b', 'دائري'),
    (r'\bcave\b', 'كهف'),
    (r'\btower\b', 'برج'),
    (r'\bcloth\b', 'ملابس'),
    (r'\bClothes\b', 'ملابس'),
    (r'\bGloves\b', 'قفازات'),
    (r'\bgloves\b', 'قفازات'),
    (r'\bPads\b', 'مرابح'),
    (r'\bpads\b', 'مرابح'),
    (r'\bMouse\b', 'فأر'),
    (r'\bmouse\b', 'فأر'),
    (r'\belctric\b', 'كهربائي'),
    (r'\belectric\b', 'كهربائي'),
    (r'\bBall\b', 'كرة'),
    (r'\bball\b', 'كرة'),
    (r'\bTraining\b', 'تدريب'),
    (r'\btraining\b', 'تدريب'),
    (r'\bTrainen\b', 'تدريب'),
    (r'\bTraning\b', 'تدريب'),
    (r'\bCleany\b', 'كليني'),
    (r'\bCleany5L\b', 'كليني 5 لتر'),
    (r'\bmother\b', 'أم'),
    (r'\bReach\b', 'غني'),
    (r'\breach\b', 'غني'),
    (r'\brich\b', 'غني'),
    (r'\bRich\b', 'غني'),
    (r'\bFresh\b', 'طازج'),
    (r'\bfresh\b', 'طازج'),
    (r'\bKitty\b', 'قطة'),
    (r'\bkitty\b', 'قطة'),
    (r'\bFruiti\b', 'فروتي'),
    (r'\bFruity\b', 'فروتي'),
    (r'\boud\b', 'عود'),
    (r'\bNatural\b', 'طبيعي'),
    (r'\bnatural\b', 'طبيعي'),
    (r'\bwood\b', 'خشب'),
    (r'\bmax\b', 'ماكس'),
    (r'\bcare\b', 'عناية'),
    (r'\bCare\b', 'عناية'),
    (r'\bclean\b', 'نظيف'),
    (r'\bClean\b', 'نظيف'),
    (r'\bclassic\b', 'كلاسيك'),
    (r'\bClassic\b', 'كلاسيك'),
    (r'\bcomplete\b', 'كامل'),
    (r'\bComplete\b', 'كامل'),
    (r'\blight\b', 'خفيف'),
    (r'\bLight\b', 'خفيف'),
    (r'\borganic\b', 'عضوي'),
    (r'\bOrganic\b', 'عضوي'),
    (r'\bPremium\b', 'بريميوم'),
    (r'\bpremium\b', 'بريميوم'),
    (r'\bwith\b', 'بـ'),
    (r'\bWith\b', 'بـ'),
    (r'\band\b', 'و'),
    (r'\bAnd\b', 'و'),
    (r'\bescape\b', 'إسكيب'),
    (r'\bflavor\b', 'نكهة'),
    (r'\bFlavor\b', 'نكهة'),
    (r'\bflzvor\b', 'نكهة'),
    (r'\bmix\b', 'متنوع'),
    (r'\bMix\b', 'متنوع'),
    (r'\bSponge\b', 'إسفنجة'),
    (r'\bSpong\b', 'إسفنجة'),
    (r'\bstand\b', 'حامل'),
    (r'\bActive\b', 'نشط'),
    (r'\bactive\b', 'نشط'),
    (r'\bpet\b', 'حيوان'),
    (r'\bPet\b', 'حيوان'),
    (r'\bstick\b', 'عصا'),
    (r'\bstik\b', 'عصا'),
    (r'\bsticky\b', 'لاصق'),
    (r'\bPaw\b', 'مخلب'),
    (r'\bPaws\b', 'مخالب'),
    (r'\bPAWS\b', 'باوز'),
    (r'\bcontrol\b', 'التحكم'),
    (r'\bControl\b', 'التحكم'),

    # Units
    (r'\b(\d+(?:\.\d+)?)\s*kg\b', r'\1 كجم'),
    (r'\b(\d+(?:\.\d+)?)\s*Kg\b', r'\1 كجم'),
    (r'\b(\d+(?:\.\d+)?)\s*kG\b', r'\1 كجم'),
    (r'\b(\d+(?:\.\d+)?)\s*KG\b', r'\1 كجم'),
    (r'\b(\d+(?:\.\d+)?)\s*K\b', r'\1 كجم'),
    (r'\b(\d+(?:\.\d+)?)\s*Gm\b', r'\1 جم'),
    (r'\b(\d+(?:\.\d+)?)\s*gm\b', r'\1 جم'),
    (r'\b(\d+(?:\.\d+)?)\s*G\b', r'\1 جم'),
    (r'\b(\d+(?:\.\d+)?)\s*g\b', r'\1 جم'),
    (r'\b(\d+(?:\.\d+)?)\s*ml\b', r'\1 مل'),
    (r'\b(\d+(?:\.\d+)?)\s*ML\b', r'\1 مل'),
    (r'\b(\d+(?:\.\d+)?)\s*L\b', r'\1 لتر'),
    (r'\b(\d+(?:\.\d+)?)\s*l\b', r'\1 لتر'),
    (r'\b(\d+)\s*pics\b', r'\1 قطع'),
    (r'\b(\d+)\s*pic\b', r'\1 قطعة'),
    (r'\b(\d+)\s*متر\b', r'\1 متر'),

    # Common joiners
    (r'&', 'و'),
]


def translate(text: str) -> str:
    """Translate English parts of a product name to Arabic, preserving brand names."""
    if not text:
        return text

    # Collapse double spaces
    text = re.sub(r'\s+', ' ', text).strip()

    # If already all Arabic, prefix with a descriptor — already fine
    if not re.search(r'[a-zA-Z]', text):
        return text

    # Protect brand names with placeholders
    placeholders = {}
    protected = text
    for i, brand in enumerate(BRAND_PROTECTIONS):
        if brand in protected:
            key = f'@@BRAND{i}@@'
            placeholders[key] = brand
            protected = protected.replace(brand, key)

    # Apply translations
    result = protected
    for pattern, replacement in TRANSLATIONS:
        try:
            result = re.sub(pattern, replacement, result)
        except re.error:
            pass

    # Restore brand placeholders
    for key, brand in placeholders.items():
        result = result.replace(key, brand)

    # Clean up
    result = re.sub(r'\s+', ' ', result).strip()
    return result


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def main():
    with open(PRODUCTS_JSON, 'r', encoding='utf-8') as f:
        products = json.load(f)

    print(f'Loaded {len(products)} products.')

    updates = []
    for p in products:
        sku = p['sku']
        name_en = p['name_en']
        name_ar = translate(name_en)
        updates.append({'sku': sku, 'name_ar': name_ar})

    # Emit SQL in chunks of 80 (UPDATE ... FROM VALUES pattern)
    CHUNK = 80
    for ci, i in enumerate(range(0, len(updates), CHUNK), 1):
        chunk = updates[i:i + CHUNK]
        values = ',\n'.join(
            f"('{u['sku']}', '{sql_escape(u['name_ar'])}')" for u in chunk
        )
        sql = f"""UPDATE products SET name_ar = v.name_ar, description_ar = v.name_ar
FROM (VALUES
{values}
) AS v(sku, name_ar)
WHERE products.sku = v.sku;"""
        with open(f'/tmp/translate-chunk-{ci:02d}.sql', 'w', encoding='utf-8') as f:
            f.write(sql)
        print(f'  wrote /tmp/translate-chunk-{ci:02d}.sql ({len(chunk)} rows, {len(sql)} bytes)')

    # Also print a few samples
    print('\n=== Sample translations ===')
    for p in products[:10]:
        print(f'  {p["name_en"]}  →  {translate(p["name_en"])}')


if __name__ == '__main__':
    main()
