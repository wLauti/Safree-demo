-- Sprint 2 MVP categories (NO firearms or ammo)
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

INSERT INTO categories (id, name, slug, type, sort_order) VALUES
  ('11111111-0001-0001-0001-000000000001', 'Optics',          'optics',          'product',    1),
  ('11111111-0001-0001-0001-000000000002', 'Apparel',         'apparel',         'product',    2),
  ('11111111-0001-0001-0001-000000000003', 'Archery',         'archery',         'product',    3),
  ('11111111-0001-0001-0001-000000000004', 'Camping Gear',    'camping-gear',    'product',    4),
  ('11111111-0001-0001-0001-000000000005', 'Fishing Gear',    'fishing-gear',    'product',    5),
  ('11111111-0001-0001-0001-000000000006', 'Outdoor Knives',  'outdoor-knives',  'product',    6),
  ('11111111-0001-0001-0001-000000000007', 'Navigation',      'navigation',      'product',    7),
  ('11111111-0001-0001-0001-000000000008', 'Accessories',     'accessories',     'product',    8),
  -- Experience categories
  ('11111111-0001-0001-0001-000000000009', 'Deer Hunting',    'deer-hunting',    'experience', 1),
  ('11111111-0001-0001-0001-000000000010', 'Hog Hunting',     'hog-hunting',     'experience', 2),
  ('11111111-0001-0001-0001-000000000011', 'Turkey Hunting',  'turkey-hunting',  'experience', 3),
  ('11111111-0001-0001-0001-000000000012', 'Duck Hunting',    'duck-hunting',    'experience', 4),
  ('11111111-0001-0001-0001-000000000013', 'Fishing Lodge',   'fishing-lodge',   'experience', 5),
  ('11111111-0001-0001-0001-000000000014', 'Exotics',         'exotics',         'experience', 6);
