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

Le script `supabase/migrations/20260202_add_don_gateway_fields.sql` ajoute des colonnes `provider_reference`, `metadata`, etc.

Tu peux:

- soit l’exécuter via l’éditeur SQL du dashboard Supabase
- soit le gérer via migrations si tu utilises le workflow CLI migrations

