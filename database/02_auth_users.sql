-- =============================================================================
-- Safree — User identities (auth.users)
-- =============================================================================
-- 5 users exported from Supabase Auth (GoTrue). These rows satisfy the
-- public.profiles -> auth.users foreign key and carry the credentials needed to
-- rebuild authentication off Supabase.
--
--  * encrypted_password is a bcrypt hash ($2a$10$...). Most auth libraries
--    (Node bcrypt/bcryptjs, PHP password_verify, etc.) can verify these directly,
--    so existing email/password logins keep working.
--  * encrypted_password = NULL  => that user only ever signed in with Google OAuth
--    (see raw_app_meta_data.providers). They have no password until one is set.
--  * raw_user_meta_data holds full_name / avatar_url / OAuth profile.
--
-- ⚠ SENSITIVE: contains real emails and password hashes. Handle like any
--    credentials file (don't commit to a public repo, restrict access).
--
-- Load AFTER 01_schema.sql and BEFORE 03_data.sql.
-- =============================================================================

INSERT INTO auth.users (id,email,encrypted_password,email_confirmed_at,phone,created_at,updated_at,last_sign_in_at,raw_user_meta_data,raw_app_meta_data) VALUES
('1f8d1154-1813-431e-b82b-6d3bd5b1bb04','lautimore256@gmail.com','$2a$10$2P/..fbm5qsALSNIte7YUe1KNaiIA./Yrkr1WYZAgN23FoNI2YapW','2026-05-30 00:58:50.865283+00',NULL,'2026-05-30 00:58:37.784759+00','2026-06-01 15:01:18.644692+00','2026-06-01 15:01:18.603936+00','{"iss": "https://accounts.google.com", "sub": "100031849504807767680", "name": "Lautaro Moreira", "email": "lautimore256@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKj7lOCa-bs-ODJPoecOj0OFH1dbnJmLSmhoDE9buXGoev4Qxg=s96-c", "full_name": "Lautaro Moreira", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKj7lOCa-bs-ODJPoecOj0OFH1dbnJmLSmhoDE9buXGoev4Qxg=s96-c", "provider_id": "100031849504807767680", "email_verified": true, "phone_verified": false}','{"provider": "email", "providers": ["email", "google"]}'),
('1070d39b-68ae-469f-8957-976b1eb9314e','neverdevacc@gmail.com','$2a$10$h8sVkHIA9K1xiJBLJzTyD.s8abb.oOrd6Le2g1YrWZmWgzI6sXgaC','2026-05-30 02:32:24.45793+00',NULL,'2026-05-30 02:31:30.592032+00','2026-06-01 15:02:51.411622+00','2026-06-01 15:02:51.409346+00','{"iss": "https://accounts.google.com", "sub": "110844149543088594297", "name": "Never Dev", "email": "neverdevacc@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJMSnLRZdnwijEWLUYvHB2TmsVp8s40Cwp3nBT99cEdAAM8nQ=s96-c", "full_name": "Never Dev", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJMSnLRZdnwijEWLUYvHB2TmsVp8s40Cwp3nBT99cEdAAM8nQ=s96-c", "provider_id": "110844149543088594297", "email_verified": true, "phone_verified": false}','{"provider": "email", "providers": ["email", "google"]}'),
('5b61b1c9-d7f3-40a2-a0f9-c351ad12138d','moreiralautaro17@gmail.com','$2a$10$GufkTX9iMt1fKGBR4usEjurE5ni.mzm1bioEDe1GqFNBYBedayPPm',NULL,NULL,'2026-05-30 02:29:37.675485+00','2026-05-30 02:29:38.874192+00',NULL,'{"sub": "5b61b1c9-d7f3-40a2-a0f9-c351ad12138d", "email": "moreiralautaro17@gmail.com", "full_name": "Nazareno Antonio Marquesini", "email_verified": false, "phone_verified": false}','{"provider": "email", "providers": ["email"]}'),
('c0957038-c07e-4a88-bc67-516bed5f49e0','nazamarquesuni@gmail.com',NULL,'2026-06-01 15:04:31.103089+00',NULL,'2026-06-01 15:04:31.085445+00','2026-06-01 15:04:31.516248+00','2026-06-01 15:04:31.510979+00','{"iss": "https://accounts.google.com", "sub": "110497691152354494032", "name": "Naza Marquesuni", "email": "nazamarquesuni@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIU4Q97Efw6LcwCCgJCMxnmIOCUOzFsS4mbcZczDnHQtnM37iRr9w=s96-c", "full_name": "Naza Marquesuni", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIU4Q97Efw6LcwCCgJCMxnmIOCUOzFsS4mbcZczDnHQtnM37iRr9w=s96-c", "provider_id": "110497691152354494032", "email_verified": true, "phone_verified": false}','{"provider": "google", "providers": ["google"]}'),
('5a14637a-6202-44b7-b609-cacbc25e9d6d','cursoarduinonqn@gmail.com',NULL,'2026-05-30 05:57:20.559373+00',NULL,'2026-05-30 05:57:20.538738+00','2026-05-30 05:57:21.516039+00','2026-05-30 05:57:21.50598+00','{"iss": "https://accounts.google.com", "sub": "115211191541808286683", "name": "CursoArduinoNQN", "email": "cursoarduinonqn@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLvq1v4g6vHTJhMWmscx6rKDM852WmrPUULGCoNfuUzHeO2mOc=s96-c", "full_name": "CursoArduinoNQN", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLvq1v4g6vHTJhMWmscx6rKDM852WmrPUULGCoNfuUzHeO2mOc=s96-c", "provider_id": "115211191541808286683", "email_verified": true, "phone_verified": false}','{"provider": "google", "providers": ["google"]}')
ON CONFLICT (id) DO NOTHING;
