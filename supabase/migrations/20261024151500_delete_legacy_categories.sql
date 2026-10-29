-- Delete legacy vegetable categories so only the 8 Japanese categories + Promotion exist
delete from public.categories
where slug in (
  'rau-cu-qua', 'trai-cay-tuoi', 'thit-hai-san', 'thuc-pham-che-bien', 'sua-trung',
  'do-kho-gia-vi', 'do-uong', 'banh-keo-an-vat', 'thuc-pham-huu-co', 'combo-tiet-kiem'
);
