# Déploiement des Edge Functions de dons (Mock -> Live)

Ce projet inclut 3 Edge Functions pour gérer les dons et préparer l’intégration **Orange Money + MTN MoMo (Cameroun)**.

## Fonctions

- `donations-create` : crée un don et initie un paiement (en dev: **mock**)
- `donations-mock-confirm` : confirme un paiement **mock** (dev)
- `donations-webhook` : endpoint **webhook** (live) appelé par la passerelle

## Déploiement

```bash
cd supabase
supabase functions deploy donations-create --project-ref <TON_PROJECT_REF>
supabase functions deploy donations-mock-confirm --project-ref <TON_PROJECT_REF>
supabase functions deploy donations-webhook --project-ref <TON_PROJECT_REF>
```

**Important (éviter 401 sur les dons)** : après déploiement, désactiver la **vérification JWT** pour ces fonctions dans le Dashboard Supabase, sinon le gateway renverra 401 (surtout pour les dons anonymes).  
Dashboard → Edge Functions → sélectionner la fonction → **Settings** → **Enforce JWT verification** = **Off**.  
En local, c’est déjà désactivé via `config.toml` (`verify_jwt = false`).

## Secrets (Mock/Dev)

Optionnel (par défaut, le mode est mock):

```bash
supabase secrets set DONATIONS_MODE=mock --project-ref <TON_PROJECT_REF>
```

## Secrets (Live)

Pour activer le live:

```bash
supabase secrets set DONATIONS_MODE=live --project-ref <TON_PROJECT_REF>
```

### CinetPay (recommandé pour Orange Money + MTN MoMo)

La fonction `donations-create` sait initier un paiement via **CinetPay** si ces secrets sont présents:

```bash
supabase secrets set CINETPAY_APIKEY=... --project-ref <TON_PROJECT_REF>
supabase secrets set CINETPAY_SITE_ID=... --project-ref <TON_PROJECT_REF>
```

Pour vérifier le header `x-token` (HMAC) côté webhook (recommandé):

```bash
supabase secrets set CINETPAY_SECRET_KEY=... --project-ref <TON_PROJECT_REF>
```

### Sécuriser le webhook (recommandé)

```bash
supabase secrets set DONATIONS_WEBHOOK_SECRET=<UN_SECRET_LONG> --project-ref <TON_PROJECT_REF>
```

### Clés gateway (à renseigner plus tard)

Chaque passerelle (agrégateur / API Orange / MTN) aura ses propres secrets.
Tu pourras les ajouter ici sans changer le code front (objectif: **ajouter les clés et passer en live**).

Exemples (noms indicatifs — à adapter selon le gateway choisi):

```bash
supabase secrets set MTN_MOMO_API_KEY=... --project-ref <TON_PROJECT_REF>
supabase secrets set ORANGE_MONEY_API_KEY=... --project-ref <TON_PROJECT_REF>
```

## Migration SQL (optionnelle mais recommandée)

- `supabase/migrations/20260202_add_don_gateway_fields.sql` : colonnes `provider_reference`, `metadata`, `id_utilisateur`, etc.
- `supabase/migrations/20260212_don_recu_pdf_url.sql` : colonne `recu_pdf_url` (lien vers reçu PDF, optionnel).

Exécution : éditeur SQL du dashboard Supabase ou workflow CLI migrations.

---

## Dépannage

### La création de don échoue (donations-create)

- **Erreur "Invalid montant" / "Le montant doit être un multiple de 5"**  
  Pour la devise XAF, le montant doit être un entier multiple de 5 (ex. 5000, 10000). Vérifier le payload envoyé par le front (champ `montant` en nombre, pas en string avec décimales).

- **Erreur "Failed to create donation" (500)**  
  Vérifier les logs de la fonction dans le Dashboard Supabase → Edge Functions → donations-create → Logs. Causes fréquentes : table `don` manquante ou schéma incomplet (ex. colonnes `provider_reference`, `id_utilisateur`), erreur d’insert. Exécuter les migrations `20260202` et `20260212` si besoin.

- **Erreur "Supabase env not configured"**  
  Les variables `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont normalement injectées par Supabase. En local avec `supabase functions serve`, vérifier que le fichier `.env` ou les secrets locaux sont bien chargés.

- **CinetPay (mode live)**  
  Vérifier que `CINETPAY_APIKEY`, `CINETPAY_SITE_ID` sont définis et que le téléphone donateur est fourni. En mode mock, ces secrets sont optionnels.

### Le webhook ne met pas à jour le don

- **CinetPay**  
  Le webhook reçoit du form-data. Vérifier que l’URL de notification (notify_url) pointe vers `https://<project>.supabase.co/functions/v1/donations-webhook`. Tester avec un outil type ngrok en local : `ngrok http 54321` puis notifier l’URL ngrok dans CinetPay (pour les tests).

- **Signature / x-token**  
  Si `DONATIONS_WEBHOOK_SECRET` ou `CINETPAY_SECRET_KEY` sont définis, le webhook attend une signature valide. Vérifier les headers (`x-webhook-signature`, `x-token`) selon la doc du gateway.

- **Idempotence**  
  Si le don a déjà un statut final (`reussi`, `echoue`, `annule`, `rembourse`), le webhook répond 200 sans modifier le don (évite les doublons).

### Logs et monitoring

- **Logs Edge Functions**  
  Dashboard Supabase → Edge Functions → sélectionner la fonction → onglet Logs. Filtrer par date pour retrouver une requête précise.

- **Journal d’audit**  
  Les événements "don créé" et "webhook don" sont enregistrés dans la table `journal_activite` (type_action `autre`, action_detaillee `don_created` / `don_statut_webhook`). Utile pour tracer les créations et les mises à jour de statut.

