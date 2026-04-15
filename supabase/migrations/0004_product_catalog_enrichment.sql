-- PAWS Egypt — Product catalog enrichment (2026-04-15)
-- Applied live to Supabase on the same day. Recorded here for reproducibility.
--
-- Changes:
--   1. Deactivate 4 "Delivary" placeholder products (delivery fee rows from POS,
--      not real products — hidden from the public shop)
--   2. Apply Arabic translations to 261 product names/descriptions via the
--      rule-based translator in scripts/translate-products.py. Translations:
--      - Brand names kept in English (Royal Canin, WAGS, Pets Republic, etc.)
--      - Descriptors translated (Adult → بالغ, Dog → كلب, Chicken → دجاج…)
--      - Units localized (kg → كجم, ml → مل, L → لتر)
--      - 76 products were already in Arabic and left unchanged.
--   3. Assign category-based placeholder images to all 337 active products
--      using royalty-free Unsplash photos. Royal Canin / Bewi / Bravecto /
--      Auto-feeder products get known-good petsegypt.com CDN images.
--
-- To regenerate translations: `python3 scripts/translate-products.py`

-- 1. Deactivate Delivary placeholder rows
UPDATE products SET is_active = false WHERE brand = 'Delivary';

-- 2. Arabic translations — applied in chunks via the translator script.
--    See scripts/translate-products.py for the full dictionary.
--    The actual UPDATE statements are too large to inline here cleanly;
--    re-run the script against a fresh DB to reapply.

-- 3. Category placeholder images
UPDATE products
SET images = ARRAY['https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&q=80&auto=format&fit=crop']
WHERE is_active = true
  AND (images IS NULL OR array_length(images, 1) IS NULL OR array_length(images, 1) = 0)
  AND category_id = (SELECT id FROM categories WHERE name_en = 'Food & Treats');

UPDATE products
SET images = ARRAY['https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=800&q=80&auto=format&fit=crop']
WHERE is_active = true
  AND (images IS NULL OR array_length(images, 1) IS NULL OR array_length(images, 1) = 0)
  AND category_id = (SELECT id FROM categories WHERE name_en = 'Accessories');

UPDATE products
SET images = ARRAY['https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=800&q=80&auto=format&fit=crop']
WHERE is_active = true
  AND (images IS NULL OR array_length(images, 1) IS NULL OR array_length(images, 1) = 0)
  AND category_id = (SELECT id FROM categories WHERE name_en = 'Grooming');

UPDATE products
SET images = ARRAY['https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=800&q=80&auto=format&fit=crop']
WHERE is_active = true
  AND (images IS NULL OR array_length(images, 1) IS NULL OR array_length(images, 1) = 0)
  AND category_id = (SELECT id FROM categories WHERE name_en = 'Toys');

UPDATE products
SET images = ARRAY['https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&q=80&auto=format&fit=crop']
WHERE is_active = true
  AND (images IS NULL OR array_length(images, 1) IS NULL OR array_length(images, 1) = 0)
  AND category_id = (SELECT id FROM categories WHERE name_en = 'Health & Wellness');

UPDATE products
SET images = ARRAY['https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=800&q=80&auto=format&fit=crop']
WHERE is_active = true
  AND (images IS NULL OR array_length(images, 1) IS NULL OR array_length(images, 1) = 0)
  AND category_id = (SELECT id FROM categories WHERE name_en = 'Beds & Furniture');

-- 4. Upgrade specific high-value products to use petsegypt.com CDN images
UPDATE products
SET images = ARRAY['https://petsegypt.com/web/image/product.product/3352/image_1920']
WHERE sku IN ('PS-0001', 'PS-0002', 'PS-0003', 'PS-0004', 'PS-0005');

UPDATE products
SET images = ARRAY['https://petsegypt.com/web/image/product.product/10058/image_1920']
WHERE brand = 'Bewi Cat' OR name_en ILIKE '%Bewi%';

UPDATE products
SET images = ARRAY['https://petsegypt.com/web/image/product.product/9135/image_1920']
WHERE name_en ILIKE '%Bravecto%' OR brand = 'Bravecto';

UPDATE products
SET images = ARRAY['https://petsegypt.com/web/image/product.product/11893/image_1920']
WHERE name_en ILIKE '%Feeder%' OR name_en ILIKE '%Fountain%';
