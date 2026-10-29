-- The original demo products predate the admin catalog columns. During the
-- admin migration they received the placeholder category `khac`, which makes
-- the grouped storefront unable to place them under an existing category.
-- Only repair untouched placeholder values so later admin edits are preserved.
update public.catalog_products as product
set
  category_slug = mapping.category_slug,
  category_name = mapping.category_name,
  updated_at = now()
from (
  values
    ('p-1', 'trai-cay-tuoi', 'Trái cây tươi'),
    ('p-2', 'trai-cay-tuoi', 'Trái cây tươi'),
    ('p-3', 'thit-hai-san', 'Thịt, hải sản'),
    ('p-4', 'thit-hai-san', 'Thịt, hải sản'),
    ('p-5', 'rau-cu-qua', 'Rau củ quả'),
    ('p-6', 'sua-trung', 'Sữa & trứng'),
    ('p-7', 'trai-cay-tuoi', 'Trái cây tươi'),
    ('p-8', 'rau-cu-qua', 'Rau củ quả'),
    ('p-9', 'rau-cu-qua', 'Rau củ quả'),
    ('p-10', 'rau-cu-qua', 'Rau củ quả'),
    ('p-11', 'thit-hai-san', 'Thịt, hải sản'),
    ('p-12', 'sua-trung', 'Sữa & trứng'),
    ('p-13', 'rau-cu-qua', 'Rau củ quả'),
    ('p-14', 'trai-cay-tuoi', 'Trái cây tươi'),
    ('p-15', 'trai-cay-tuoi', 'Trái cây tươi'),
    ('p-16', 'trai-cay-tuoi', 'Trái cây tươi'),
    ('p-17', 'rau-cu-qua', 'Rau củ quả'),
    ('p-18', 'sua-trung', 'Sữa & trứng'),
    ('p-19', 'trai-cay-tuoi', 'Trái cây tươi'),
    ('p-20', 'trai-cay-tuoi', 'Trái cây tươi'),
    ('p-21', 'rau-cu-qua', 'Rau củ quả'),
    ('p-22', 'rau-cu-qua', 'Rau củ quả')
) as mapping(product_id, category_slug, category_name)
where product.id = mapping.product_id
  and product.category_slug = 'khac';
