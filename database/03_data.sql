-- =============================================================================
-- Safree — Application data
-- =============================================================================
-- All rows from the public schema, in foreign-key-safe order.
-- search_vector columns (products/experiences) are intentionally omitted — the
-- BEFORE INSERT triggers recompute them automatically on load.
-- geography values are loaded as EWKT text cast to geography.
--
-- Load AFTER 02_auth_users.sql.
-- =============================================================================

-- profiles (5) ---------------------------------------------------------------
INSERT INTO public.profiles (id,email,full_name,avatar_url,role,email_verified,phone,bio,created_at,updated_at,status,suspended_at,last_active_at,push_subscription,review_manipulation_flag,cookie_consent) VALUES
('5b61b1c9-d7f3-40a2-a0f9-c351ad12138d','moreiralautaro17@gmail.com','Nazareno Antonio Marquesini',NULL,'store','t',NULL,NULL,'2026-05-30 02:29:37.675127+00','2026-05-30 03:00:29.022853+00','active',NULL,NULL,NULL,'f',NULL),
('1070d39b-68ae-469f-8957-976b1eb9314e','neverdevacc@gmail.com','Nazareno Antonio Marquesini',NULL,'store','t',NULL,NULL,'2026-05-30 02:31:30.590976+00','2026-05-30 03:03:40.595529+00','active',NULL,NULL,NULL,'f',NULL),
('5a14637a-6202-44b7-b609-cacbc25e9d6d','cursoarduinonqn@gmail.com','CursoArduinoNQN','/media/avatars/5a14637a-6202-44b7-b609-cacbc25e9d6d.jpg','moderator','t',NULL,NULL,'2026-05-30 05:57:20.527547+00','2026-05-30 06:00:57.601757+00','active',NULL,NULL,NULL,'f',NULL),
('1f8d1154-1813-431e-b82b-6d3bd5b1bb04','lautimore256@gmail.com','Lautaro Manuel Moreira',NULL,'store','t',NULL,NULL,'2026-05-30 00:58:37.784366+00','2026-05-30 06:00:59.568005+00','active',NULL,NULL,NULL,'f',NULL),
('c0957038-c07e-4a88-bc67-516bed5f49e0','nazamarquesuni@gmail.com','Naza Marquesuni','/media/avatars/c0957038-c07e-4a88-bc67-516bed5f49e0.jpg','moderator','t',NULL,NULL,'2026-06-01 15:04:31.080886+00','2026-06-01 15:04:51.591219+00','active',NULL,NULL,NULL,'f',NULL)
ON CONFLICT (id) DO NOTHING;

-- stores (2) -----------------------------------------------------------------
INSERT INTO public.stores (id,owner_id,name,slug,description,subtype,logo_url,banner_url,location_state,location_city,location_coords,stripe_account_id,is_verified,is_active,created_at,updated_at,stripe_onboarding_complete,stripe_charges_enabled,stripe_payouts_enabled,verification_docs,verification_status,verified_at,verification_rejection,rating_avg,review_count,low_rating_flag) VALUES
('807961d0-1e03-4da2-aaea-f7f6af5ed0d2','1f8d1154-1813-431e-b82b-6d3bd5b1bb04','Tienda de prueba 1','tienda-de-prueba-1','Descripcion de prueba.','store',NULL,NULL,'Texas','Austin',NULL,NULL,'f','t','2026-05-30 01:08:02.237802+00','2026-05-30 01:08:02.237802+00','f','f','f','{}','unverified',NULL,NULL,'0.0','0','f'),
('0af185cb-4863-46e9-a1bf-a9937d5935cc','1070d39b-68ae-469f-8957-976b1eb9314e','Tienda de prueba 2','tienda-de-prueba-2','Descripcion de prueba.','coto','/media/stores/0af185cb-4863-46e9-a1bf-a9937d5935cc/logo.png','/media/stores/0af185cb-4863-46e9-a1bf-a9937d5935cc/banner.jpg','Nevada','Carson City',NULL,NULL,'f','t','2026-05-30 03:04:58.591088+00','2026-05-30 05:25:42.161469+00','f','f','f','{}','unverified',NULL,NULL,'0.0','0','f')
ON CONFLICT (id) DO NOTHING;

-- categories (14) ------------------------------------------------------------
INSERT INTO public.categories (id,name,slug,parent_id,type,icon_url,sort_order) VALUES
('11111111-0001-0001-0001-000000000001','Optics','optics',NULL,'product',NULL,'1'),
('11111111-0001-0001-0001-000000000002','Apparel','apparel',NULL,'product',NULL,'2'),
('11111111-0001-0001-0001-000000000003','Archery','archery',NULL,'product',NULL,'3'),
('11111111-0001-0001-0001-000000000004','Camping Gear','camping-gear',NULL,'product',NULL,'4'),
('11111111-0001-0001-0001-000000000005','Fishing Gear','fishing-gear',NULL,'product',NULL,'5'),
('11111111-0001-0001-0001-000000000006','Outdoor Knives','outdoor-knives',NULL,'product',NULL,'6'),
('11111111-0001-0001-0001-000000000007','Navigation','navigation',NULL,'product',NULL,'7'),
('11111111-0001-0001-0001-000000000008','Accessories','accessories',NULL,'product',NULL,'8'),
('11111111-0001-0001-0001-000000000009','Deer Hunting','deer-hunting',NULL,'experience',NULL,'1'),
('11111111-0001-0001-0001-000000000010','Hog Hunting','hog-hunting',NULL,'experience',NULL,'2'),
('11111111-0001-0001-0001-000000000011','Turkey Hunting','turkey-hunting',NULL,'experience',NULL,'3'),
('11111111-0001-0001-0001-000000000012','Duck Hunting','duck-hunting',NULL,'experience',NULL,'4'),
('11111111-0001-0001-0001-000000000013','Fishing Lodge','fishing-lodge',NULL,'experience',NULL,'5'),
('11111111-0001-0001-0001-000000000014','Exotics','exotics',NULL,'experience',NULL,'6')
ON CONFLICT (id) DO NOTHING;

-- species (27) ---------------------------------------------------------------
INSERT INTO public.species (id,name,slug,type,image_url,is_custom,created_by_store_id,is_approved) VALUES
('25ff81b5-ca5e-41ae-8a97-45b329382608','Whitetail Deer','whitetail-deer','game',NULL,'f',NULL,'t'),
('f9d420e4-c8c2-470d-b862-432871c9b9c4','Mule Deer','mule-deer','game',NULL,'f',NULL,'t'),
('f516152a-9829-4326-a01c-3f2622f74cca','Elk','elk','game',NULL,'f',NULL,'t'),
('1fbb128a-2d82-45de-90e5-c10533266e02','Moose','moose','game',NULL,'f',NULL,'t'),
('ef75236b-8155-4384-b147-b9e3458f84b5','Bear','bear','game',NULL,'f',NULL,'t'),
('3e681707-dbd2-4395-b949-44fad1915644','Wild Boar','wild-boar','game',NULL,'f',NULL,'t'),
('70d57ac6-0983-422c-ab3b-a5274e92d732','Antelope','antelope','game',NULL,'f',NULL,'t'),
('33be5dfe-c7f9-4078-b2c2-fce8a3f40a14','Bighorn Sheep','bighorn-sheep','game',NULL,'f',NULL,'t'),
('ce85577f-dffb-4d8f-a3bb-7edf40cd4c5b','Mountain Lion','mountain-lion','game',NULL,'f',NULL,'t'),
('55ac1887-1cd3-437b-8204-a4320a105d7d','Alligator','alligator','game',NULL,'f',NULL,'t'),
('31925b7b-c661-45be-955f-861155d5e2b8','Turkey','turkey','bird',NULL,'f',NULL,'t'),
('983c86f6-ebe7-4d6a-8e33-14cb06862a42','Duck','duck','bird',NULL,'f',NULL,'t'),
('773b8ba3-40f6-474e-afd3-7d4dd88e52ba','Pheasant','pheasant','bird',NULL,'f',NULL,'t'),
('aa70da55-42aa-47b8-b9b7-6b54f96a88d8','Quail','quail','bird',NULL,'f',NULL,'t'),
('ab293f49-b856-480d-8827-17a5ceca0ea2','Dove','dove','bird',NULL,'f',NULL,'t'),
('97a59605-e080-4c93-8256-2ef6742141f7','Goose','goose','bird',NULL,'f',NULL,'t'),
('aaed50f8-1b06-415a-9140-794be13ae26b','Trout','trout','fish',NULL,'f',NULL,'t'),
('a6b0eb45-2f67-4ff3-8452-3bd04c480b53','Salmon','salmon','fish',NULL,'f',NULL,'t'),
('f820c4f5-33ba-4304-b919-bf157122596a','Bass','bass','fish',NULL,'f',NULL,'t'),
('5e4a75e7-2241-48e5-9dab-9d2cc1c127c4','Walleye','walleye','fish',NULL,'f',NULL,'t'),
('8896d8ce-f6a3-4861-8988-cfb75a1dbfa5','Catfish','catfish','fish',NULL,'f',NULL,'t'),
('be164d23-d21e-48ec-871f-4015a7d7bf56','Striped Bass','striped-bass','fish',NULL,'f',NULL,'t'),
('56e9b8c6-f66c-43af-8f76-16c45b218425','Redfish','redfish','fish',NULL,'f',NULL,'t'),
('2407eae9-2ca0-42cc-9510-d633c5824688','Snook','snook','fish',NULL,'f',NULL,'t'),
('2419316c-1064-4afc-9c75-52ec05ca362f','Tarpon','tarpon','fish',NULL,'f',NULL,'t'),
('8cf5ecf7-6888-431b-9e97-1424f365a4a9','Flounder','flounder','fish',NULL,'f',NULL,'t'),
('70f0f674-b259-4058-849e-df03ea31397a','Especie personalizada de prueba','especie-personalizada-de-prueba','game',NULL,'t','0af185cb-4863-46e9-a1bf-a9937d5935cc','f')
ON CONFLICT (id) DO NOTHING;

-- products (1) ---------------------------------------------------------------
INSERT INTO public.products (id,store_id,category_id,title,description,price,compare_at_price,images,stock,sku,status,species_ids,created_at,updated_at,condition,state_location,video_url,shipping_notes,views,rejection_reason,slug,rejection_category,featured,view_count,moderation_flags,reviewed_by,reviewed_at) VALUES
('d9dd3b1a-2d54-4540-a492-d5cbeedca0f4','807961d0-1e03-4da2-aaea-f7f6af5ed0d2','11111111-0001-0001-0001-000000000006','Cuchillo Kukri','Esta usado pero poco. Casi nuevo.','500.00',NULL,'{/media/products/807961d0-1e03-4da2-aaea-f7f6af5ed0d2/1780103828082.jpg}','10',NULL,'active','{}','2026-05-30 01:18:36.313487+00','2026-05-30 02:34:48.509081+00','used','Texas','https://youtu.be/TAOoAAKGGpY','2 a 3 dias de envio','0',NULL,'cuchillo-kukri-1780103914529',NULL,'f','0','[]','1070d39b-68ae-469f-8957-976b1eb9314e','2026-05-30 02:34:46.239+00')
ON CONFLICT (id) DO NOTHING;

-- experiences (1) ------------------------------------------------------------
INSERT INTO public.experiences (id,store_id,category_id,title,description,price_per_person,max_guests,images,location_name,location_state,location_coords,duration_days,status,species_ids,amenities,created_at,updated_at,type,slug,location_city,terrain_description,video_url,min_booking_days,avg_rating,review_count,addon_prices,cancellation_policy,rejection_reason,rejection_category,featured,view_count,moderation_flags,reviewed_by,reviewed_at) VALUES
('d1aa6c7a-bf98-4337-a70a-9329519ebd0a','0af185cb-4863-46e9-a1bf-a9937d5935cc',NULL,'Experiencia de ejemplo','Descripcion de ejemplo','250.00','2','{/media/experiences/1780120451492-c6k920636l8.jpg,/media/experiences/1780120453287-0bhs8azyd1f.jpg,/media/experiences/1780120454474-7hxevappwb.webp}',NULL,'Texas','SRID=4326;POINT(-100.55424167680424 31.352918025619616)'::geography,'3','active','{70d57ac6-0983-422c-ab3b-a5274e92d732,f820c4f5-33ba-4304-b919-bf157122596a,ef75236b-8155-4384-b147-b9e3458f84b5,33be5dfe-c7f9-4078-b2c2-fce8a3f40a14,8896d8ce-f6a3-4861-8988-cfb75a1dbfa5}','{guide,equipment,meals}','2026-05-30 05:54:21.280327+00','2026-05-30 06:03:11.109576+00','hunt','experiencia-de-ejemplo','Carson City','Descripcion del terreno de ejemplo','https://youtu.be/miJm3re0kmQ','3','0.0','0','{}','moderate',NULL,NULL,'f','0','[{"check": "price_range", "status": "pass", "message": "Price within normal range for category."}, {"check": "keyword_filter", "status": "pass", "message": "Description passes keyword filter."}, {"check": "image_count", "status": "pass", "message": "Images pass basic content check."}]','5a14637a-6202-44b7-b609-cacbc25e9d6d','2026-05-30 06:03:08.598+00')
ON CONFLICT (id) DO NOTHING;

-- product_specs (1) ----------------------------------------------------------
INSERT INTO public.product_specs (id,product_id,key,value,sort_order) VALUES
('bce6a0ea-0b08-4ad1-a4e5-6f66142e8916','d9dd3b1a-2d54-4540-a492-d5cbeedca0f4','Peso','80 kilos','0')
ON CONFLICT (id) DO NOTHING;

-- shipping_rates (2) ---------------------------------------------------------
INSERT INTO public.shipping_rates (id,name,description,price,estimated_days_min,estimated_days_max,is_active,sort_order,created_at) VALUES
('bf086a81-e8bd-42cd-a641-48abfacfb22d','Standard Shipping','5–7 business days via USPS','9.99','5','7','t','1','2026-05-30 00:26:41.76795+00'),
('6362c361-f7ad-4402-b8de-a9afa0f128c7','Expedited Shipping','2–3 business days via UPS','19.99','2','3','t','2','2026-05-30 00:26:41.76795+00')
ON CONFLICT (id) DO NOTHING;

-- prohibited_keywords (18) ---------------------------------------------------
INSERT INTO public.prohibited_keywords (id,keyword,category,created_at) VALUES
('59c889d5-0e10-45a3-a275-a6010437d955','glock','firearm','2026-05-30 00:39:07.262391+00'),
('ea72cf09-5a77-4c8b-ad75-ecafcba9be35','ar-15','firearm','2026-05-30 00:39:07.262391+00'),
('f09bb836-bcf2-49c4-90ca-bd0fc6bfbbc1','ar15','firearm','2026-05-30 00:39:07.262391+00'),
('869ffc86-dd48-4ea8-895d-5a29eea1d8d5','rifle','firearm','2026-05-30 00:39:07.262391+00'),
('58a7446c-1fa0-42ae-ae62-77d1f9099aec','handgun','firearm','2026-05-30 00:39:07.262391+00'),
('f2cb023c-0eff-4a69-9619-554f4d6841f5','pistol','firearm','2026-05-30 00:39:07.262391+00'),
('96e26bd0-9367-4d92-b7de-5a0e61d48240','ammunition','firearm','2026-05-30 00:39:07.262391+00'),
('d0ba8ed1-2dfb-4f6f-8722-32db83de56ce','firearm','firearm','2026-05-30 00:39:07.262391+00'),
('dbd3d5f1-a40f-449b-925a-d5f550cf3cce','silencer','firearm','2026-05-30 00:39:07.262391+00'),
('8847ba14-fdce-42db-acc2-4e2aaab6b000','suppressor','firearm','2026-05-30 00:39:07.262391+00'),
('77ab0711-1d6a-4690-a9c9-6bf9479b7742','snow leopard','cites_species','2026-05-30 00:39:07.262391+00'),
('c79439af-c5f7-441b-812a-699e43f92eb7','tiger','cites_species','2026-05-30 00:39:07.262391+00'),
('4a3ea748-cd6d-4b43-96f8-581ccc7d7a2f','rhinoceros','cites_species','2026-05-30 00:39:07.262391+00'),
('0e0377e2-81b5-4846-9040-b10f1eec6899','elephant ivory','cites_species','2026-05-30 00:39:07.262391+00'),
('beb7cdf4-16a4-460e-9754-ff523b4a1ca4','gorilla','cites_species','2026-05-30 00:39:07.262391+00'),
('a5de87c5-8512-475c-aed4-199dc4d719d4','orangutan','cites_species','2026-05-30 00:39:07.262391+00'),
('dcc6a1f5-4dfa-45b6-b7d5-51f2e3135389','sea turtle','cites_species','2026-05-30 00:39:07.262391+00'),
('76d62cec-4fe2-4269-8271-f39612cc8e0d','pangolin','cites_species','2026-05-30 00:39:07.262391+00')
ON CONFLICT (id) DO NOTHING;

-- integration_keys (14) ------------------------------------------------------
-- NOTE: these are app settings/secret slots. In this export every value is blank
-- except the commission rate — the real secrets lived in environment variables
-- (.env.local / Vercel), NOT in the database.
INSERT INTO public.integration_keys (id,service,key_encrypted,created_at,updated_at) VALUES
('8bf460f5-9c99-4305-8157-8b9a83a4ff2b','stripe_commission_rate','5','2026-05-30 00:26:41.76795+00','2026-05-30 00:26:41.76795+00'),
('ccf21b11-0003-43a0-afd2-40e154e4bbc8','mapbox_token','','2026-05-30 00:38:08.669479+00','2026-05-30 00:38:08.669479+00'),
('ccf2f1a1-5ffc-4f8b-bdb8-17f97717ba82','stripe_publishable_key','','2026-05-30 00:39:07.262391+00','2026-05-30 00:39:07.262391+00'),
('76f41e0e-7663-4686-b122-1e999b216e66','stripe_secret_key','','2026-05-30 00:39:07.262391+00','2026-05-30 00:39:07.262391+00'),
('4d824132-e1f9-49f8-aecd-8149d14010d6','stripe_webhook_secret','','2026-05-30 00:39:07.262391+00','2026-05-30 00:39:07.262391+00'),
('7863f626-78c7-4ae5-b56b-2411ec15e33c','google_oauth_client_id','','2026-05-30 00:39:07.262391+00','2026-05-30 00:39:07.262391+00'),
('d488f583-6931-4ce8-8d6d-8635e839f299','google_oauth_client_secret','','2026-05-30 00:39:07.262391+00','2026-05-30 00:39:07.262391+00'),
('cbec53d6-a00a-41ab-9f24-d76cf966d620','resend_api_key','','2026-05-30 00:39:07.262391+00','2026-05-30 00:39:07.262391+00'),
('c5990f72-35cb-4dd2-a82c-c46a722c2b37','email_from_address','','2026-05-30 00:39:07.262391+00','2026-05-30 00:39:07.262391+00'),
('346f0a96-922b-4fd4-8e0b-57055e8f6cd2','email_from_name','','2026-05-30 00:39:07.262391+00','2026-05-30 00:39:07.262391+00'),
('db4d93aa-295d-4387-ae4a-b39aa66863e1','vapid_public_key','','2026-05-30 00:39:07.262391+00','2026-05-30 00:39:07.262391+00'),
('e148cabd-1b2a-4247-aea0-01882ab837f6','vapid_private_key','','2026-05-30 00:39:07.262391+00','2026-05-30 00:39:07.262391+00'),
('c1db193b-4d51-4b6f-9a1c-863fbf71286c','analytics_id','','2026-05-30 00:39:07.262391+00','2026-05-30 00:39:07.262391+00'),
('774ab9d3-8a65-4cb7-91f9-bef822f3036f','allowed_origins','','2026-05-30 00:39:07.262391+00','2026-05-30 00:39:07.262391+00')
ON CONFLICT (id) DO NOTHING;

-- audit_log (2) --------------------------------------------------------------
INSERT INTO public.audit_log (id,actor_id,actor_role,action,target_type,target_id,metadata,created_at) VALUES
('6f35f204-955e-4c30-9716-0199ed8f652b','1070d39b-68ae-469f-8957-976b1eb9314e','admin','listing_override_approved','product','d9dd3b1a-2d54-4540-a492-d5cbeedca0f4','{"status": "active"}','2026-05-30 02:34:48.860546+00'),
('6c8fb634-50f1-4118-ac85-69a56e08bf3d','5a14637a-6202-44b7-b609-cacbc25e9d6d','moderator','listing_approved','experience','d1aa6c7a-bf98-4337-a70a-9329519ebd0a','{"title": "Experiencia de ejemplo"}','2026-05-30 06:03:12.896599+00')
ON CONFLICT (id) DO NOTHING;

-- notifications (1) ----------------------------------------------------------
INSERT INTO public.notifications (id,user_id,type,title,body,ref_type,ref_id,is_read,created_at) VALUES
('fc2b827e-e6bb-4fe6-8d59-97f5704e470b','1070d39b-68ae-469f-8957-976b1eb9314e','listing_approved','Listing Approved!','Your experience "Experiencia de ejemplo" is now live on Safree.','experience','d1aa6c7a-bf98-4337-a70a-9329519ebd0a','t','2026-05-30 06:03:11.828758+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Empty tables (no rows at export time): availability, cart_items, orders,
-- bookings, disputes, reviews, product_qa, saved_items, shipping_addresses,
-- content_flags, hero_slides, featured_content.
-- =============================================================================
