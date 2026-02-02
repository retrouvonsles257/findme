# Dons (Donations) — Proposition d’implémentation “réelle” (focus citoyen)

Ce document résume la proposition d’implémentation des dons dans RetrouvonsLes, en suivant une approche **fiable** (statuts basés sur confirmation serveur via webhook) et en se concentrant d’abord sur l’expérience **citoyen**.

## 1) Problème actuel (à corriger)

- Le front peut créer un don en base puis marquer le paiement “réussi” côté client (“simulé”).
- En production, **le statut de paiement ne doit jamais être décidé par le client** : il doit venir du **serveur** via **webhook** du provider de paiement.

## 2) Socle technique recommandé (Supabase)

### 2.1 Schéma DB (table `don`) — compléments conseillés
Ajouter au minimum :
- `id_utilisateur` **nullable** (UUID → `utilisateur.id`) : rattacher un don à un citoyen connecté.
- `provider` (text/enum) : ex `stripe`, `paypal`, `mobile_money_gateway`, …
- `provider_reference` (text) : id transaction/paiement (ex PaymentIntent, OrderID, etc.)
- `checkout_url` (text) : URL de paiement si redirection.
- `receipt_url` / `recu_pdf_url` (text) : lien reçu (si disponible).
- `metadata` (jsonb) : infos techniques (device, campagne, source, …).
- `updated_at` (timestamptz) : suivi simple.

Conserver :
- `nom_donateur/email_donateur/telephone_donateur` pour les dons **hors connexion** et/ou **anonymes**.

### 2.2 Edge Functions (pattern “propre”)

#### A) `donations_create` (création + démarrage paiement)
Entrée : montant/devise/type/méthode + (si connecté) userId (ou récup via session).
Actions :
1. crée une ligne `don` en DB avec `statut_paiement = en_attente`
2. crée une session/intent côté provider
3. renvoie au front `checkout_url` (ou un token)

#### B) `donations_webhook` (source de vérité)
Entrée : événement provider (paiement réussi/échoué…).
Actions :
1. vérifie signature webhook (obligatoire)
2. met à jour `don.statut_paiement`, `date_traitement`, `provider_reference`, etc.
3. déclenche post-traitements :
   - reçu (PDF/numéro), email, remerciement
   - badge donateur (si user lié)
   - notification in-app (si user lié)

## 3) UX citoyen (ce que je propose en priorité)

### 3.1 Une section “Dons / Soutenir” dans l’espace citizen
Ajouter une entrée dans la sidebar citoyen :
- `Soutenir` / `Dons`

Page `CitizenDonate` :
- montants suggérés + montant libre
- type : `ponctuel` (MVP) ; `mensuel/annuel` en phase suivante
- informations donateur :
  - pré-remplies si connecté (mais modifiables)
  - option “anonyme”
- bouton “Payer” :
  - appelle `donations_create`
  - redirection vers `checkout_url`

### 3.2 “Mes dons” (citoyen connecté)
Page `CitizenMyDonations` (ou section dans profil) :
- liste des dons du user (`don.id_utilisateur = auth.uid()`)
- filtre par statut/date
- accès reçu (si généré)
- badge “Donateur” (minimal pour MVP)

> Sans `id_utilisateur` en DB, “mes dons” devient fragile (matching par email). À éviter.

### 3.3 Sollicitations non intrusives (conforme doc)
Pour le MVP, limiter à 2–3 points d’entrée :
- menu “Soutenir”
- page détail dossier (CTA discret)
- après un événement positif (ex: signalement validé) avec **cooldown** (ex 1 fois / trimestre)

Stocker le cooldown dans `utilisateur.preferences_notification` ou équivalent.

## 4) Paiements : stratégie réaliste par phases

### Phase 1 (MVP “vrai”)
- 1 provider principal (souvent carte bancaire)
- webhooks OK
- “Mes dons” + badge simple

### Phase 2
- Mobile Money (Orange/MTN) via gateway/agrégateur, avec webhooks asynchrones.

### Phase 3
- Récurrence (mensuel/annuel) = abonnement (billing) + annulation + relances.

### Phase 4
- Reçu fiscal PDF, emails automatiques, reporting transparence trimestriel.

## 5) Sécurité / conformité (essentiel)
- Jamais de “paiement réussi” décidé par le front.
- Vérification de signature webhook.
- Idempotence (un webhook peut arriver plusieurs fois).
- Journalisation (`journal_activite`) pour audit.
- Pas de stockage de données carte (PCI géré par provider).

