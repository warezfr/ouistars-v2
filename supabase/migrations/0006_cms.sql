-- Migration 0006 : CMS de contenu du site + comptes admin (mono-agence).
-- Le site public lit le contenu « publié » ; le back-office (admin authentifié)
-- gère la création/édition. Repli statique côté front si Supabase absent.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ————— Comptes administrateurs (adossés à Supabase Auth) —————
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'ops',      -- admin | ops | readonly
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Renvoie vrai si l'utilisateur courant est un admin actif (admin | ops).
CREATE OR REPLACE FUNCTION is_active_admin() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles p
    WHERE p.id = auth.uid() AND p.active = true
  );
$$;

CREATE OR REPLACE FUNCTION can_write_cms() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('admin', 'ops')
  );
$$;

-- ————— Entrées de contenu (collections génériques) —————
-- collection : 'service' | 'partner' | 'address' | 'faq' | 'testimonial' |
--              'team' | 'feature' | 'step' | 'counter' | 'slider' |
--              'blog_post' | 'news' | 'static_page' | 'policy' | 'country' |
--              'photo' | 'video' | 'package' | 'destination' | 'route' | ...
CREATE TABLE IF NOT EXISTS cms_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL,
  slug TEXT,
  title TEXT,                              -- libellé lisible (liste back-office)
  status TEXT NOT NULL DEFAULT 'published',-- draft | published
  position INT NOT NULL DEFAULT 0,
  locale TEXT NOT NULL DEFAULT 'fr',
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cms_entries_collection ON cms_entries (collection, position);
CREATE INDEX IF NOT EXISTS idx_cms_entries_status ON cms_entries (status);

-- ————— Contenus « singleton » (About, CTA, réglages généraux, SEO) —————
CREATE TABLE IF NOT EXISTS cms_singletons (
  key TEXT PRIMARY KEY,                     -- 'about' | 'cta' | 'general' | 'seo'
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ————— RLS —————
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_singletons ENABLE ROW LEVEL SECURITY;

-- admin_profiles : chacun voit son profil ; les admins voient tout.
DROP POLICY IF EXISTS admin_profiles_self ON admin_profiles;
CREATE POLICY admin_profiles_self ON admin_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_active_admin());

DROP POLICY IF EXISTS admin_profiles_manage ON admin_profiles;
CREATE POLICY admin_profiles_manage ON admin_profiles
  FOR ALL TO authenticated
  USING (can_write_cms()) WITH CHECK (can_write_cms());

-- cms_entries : lecture publique du publié ; écriture réservée aux admins.
DROP POLICY IF EXISTS cms_entries_public_read ON cms_entries;
CREATE POLICY cms_entries_public_read ON cms_entries
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR is_active_admin());

DROP POLICY IF EXISTS cms_entries_write ON cms_entries;
CREATE POLICY cms_entries_write ON cms_entries
  FOR ALL TO authenticated
  USING (can_write_cms()) WITH CHECK (can_write_cms());

-- cms_singletons : lecture publique ; écriture admin.
DROP POLICY IF EXISTS cms_singletons_public_read ON cms_singletons;
CREATE POLICY cms_singletons_public_read ON cms_singletons
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS cms_singletons_write ON cms_singletons;
CREATE POLICY cms_singletons_write ON cms_singletons
  FOR ALL TO authenticated
  USING (can_write_cms()) WITH CHECK (can_write_cms());

-- ————— Promotion du premier compte en admin —————
-- Après avoir créé un utilisateur dans Supabase Auth (e-mail + mot de passe),
-- exécuter (en remplaçant l'e-mail) :
--   INSERT INTO admin_profiles (id, email, display_name, role)
--   SELECT id, email, 'Administrateur', 'admin' FROM auth.users
--   WHERE email = 'admin@ouistars.com'
--   ON CONFLICT (id) DO UPDATE SET role = 'admin', active = true;
