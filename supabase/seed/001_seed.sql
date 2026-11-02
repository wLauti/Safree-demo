-- Seed categories
INSERT INTO categories (id, name, slug, type, sort_order) VALUES
  (uuid_generate_v4(), 'Firearms', 'firearms', 'product', 1),
  (uuid_generate_v4(), 'Ammunition', 'ammunition', 'product', 2),
  (uuid_generate_v4(), 'Optics & Sights', 'optics-sights', 'product', 3),
  (uuid_generate_v4(), 'Hunting Apparel', 'hunting-apparel', 'product', 4),
  (uuid_generate_v4(), 'Fishing Gear', 'fishing-gear', 'product', 5),
  (uuid_generate_v4(), 'Knives & Tools', 'knives-tools', 'product', 6),
  (uuid_generate_v4(), 'Deer Hunting', 'deer-hunting', 'experience', 1),
  (uuid_generate_v4(), 'Hog Hunting', 'hog-hunting', 'experience', 2),
  (uuid_generate_v4(), 'Turkey Hunting', 'turkey-hunting', 'experience', 3),
  (uuid_generate_v4(), 'Duck Hunting', 'duck-hunting', 'experience', 4),
  (uuid_generate_v4(), 'Fishing Lodge', 'fishing-lodge', 'experience', 5),
  (uuid_generate_v4(), 'Exotics', 'exotics', 'experience', 6);

-- Seed species
INSERT INTO species (id, name, slug, type) VALUES
  (uuid_generate_v4(), 'White-tailed Deer', 'white-tailed-deer', 'game'),
  (uuid_generate_v4(), 'Feral Hog', 'feral-hog', 'game'),
  (uuid_generate_v4(), 'Wild Turkey', 'wild-turkey', 'bird'),
  (uuid_generate_v4(), 'Mallard Duck', 'mallard-duck', 'bird'),
  (uuid_generate_v4(), 'Axis Deer', 'axis-deer', 'game'),
  (uuid_generate_v4(), 'Aoudad', 'aoudad', 'game'),
  (uuid_generate_v4(), 'Nilgai', 'nilgai', 'game'),
  (uuid_generate_v4(), 'Largemouth Bass', 'largemouth-bass', 'fish'),
  (uuid_generate_v4(), 'Catfish', 'catfish', 'fish'),
  (uuid_generate_v4(), 'Redfish', 'redfish', 'fish'),
  (uuid_generate_v4(), 'Dove', 'dove', 'bird'),
  (uuid_generate_v4(), 'Quail', 'quail', 'bird');
