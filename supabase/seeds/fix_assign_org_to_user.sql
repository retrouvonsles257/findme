-- =====================================================
-- Attribuer ton utilisateur à l'organisation pour voir Ressources et Partenariats
-- Les politiques RLS comparent id_organisation des lignes à celui de l'utilisateur.
-- Si id_organisation est NULL dans utilisateur, tu ne vois rien.
--
-- Choisir UNE des deux options ci-dessous, remplacer la valeur, puis exécuter
-- dans le SQL Editor Supabase (Dashboard > SQL Editor).
-- =====================================================

-- Option 1 : par email (remplacer par l'email de ton compte)
-- UPDATE public.utilisateur
-- SET id_organisation = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- WHERE email = 'ton-email@example.com';

-- Option 2 : par id auth (remplacer par ton auth.users.id)
-- Tu le trouves dans Supabase : Authentication > Users > ton user > UUID
-- UPDATE public.utilisateur
-- SET id_organisation = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- WHERE id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

-- Décommenter et exécuter une seule des deux options ci-dessus.
