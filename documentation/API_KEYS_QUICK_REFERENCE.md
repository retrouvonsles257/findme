# 🔑 Quick Links - Obtenir tes clés API

## Dashboard des services

| Service | Lien | Clé | Temps |
|---------|------|-----|-------|
| **Supabase** | https://app.supabase.com/ | 2 clés | 2 min |
| **Firebase** | https://console.firebase.google.com/ | 6 clés | 5 min |
| **Cloudinary** | https://cloudinary.com/console/ | 3 clés | 3 min |
| **MapTiler** | https://cloud.maptiler.com/account/keys/ | 1 clé | 2 min |
| **Hugging Face** | https://huggingface.co/settings/tokens | 1 clé | 2 min |
| **Web Push VAPID** | https://web-push-codelab.glitch.me/ | 2 clés | 1 min |

**⏱️ Temps total: ~15 minutes**

---

## 🔗 Chemins directs vers les clés

### Supabase
```
Dashboard → Ton projet → Settings → API
```
- ✅ Copie: **Project URL** → `.env` `REACT_APP_SUPABASE_URL`
- ✅ Copie: **anon key** → `.env` `REACT_APP_SUPABASE_ANON_KEY`

### Firebase
```
Console → Ton projet → ⚙️ Project Settings → Your Apps → Web
```
- ✅ Copie **Config** JSON entier

Mapping:
```
apiKey              → REACT_APP_FIREBASE_API_KEY
authDomain          → REACT_APP_FIREBASE_AUTH_DOMAIN
projectId           → REACT_APP_FIREBASE_PROJECT_ID
storageBucket       → REACT_APP_FIREBASE_STORAGE_BUCKET
messagingSenderId   → REACT_APP_FIREBASE_MESSAGING_SENDER_ID
appId               → REACT_APP_FIREBASE_APP_ID
```

### Cloudinary
```
Dashboard → Settings → API Keys
```
- ✅ Copie: **Cloud Name** → `.env` `REACT_APP_CLOUDINARY_CLOUD_NAME`
- ✅ Copie: **API Key** → `.env` `REACT_APP_CLOUDINARY_API_KEY`

**Upload Preset:**
```
Dashboard → Upload → Set upload preset → Create "unsigned"
```
- ✅ Copie le nom → `.env` `REACT_APP_CLOUDINARY_UPLOAD_PRESET`

### MapTiler
```
Compte → Keys → Copie une clé existante ou crée nouvelle
```
- ✅ Copie la clé → `.env` `REACT_APP_MAPTILER_API_KEY`

### Hugging Face
```
Settings → Tokens → Create new token → Scope: "Read"
```
- ✅ Copie le token complet → `.env` `REACT_APP_HUGGINGFACE_API_KEY`

### Push VAPID Keys
```
Méthode 1: https://web-push-codelab.glitch.me/
Méthode 2: npm install -g web-push && web-push generate-vapid-keys
```
- ✅ Copie **Public Key** → `.env` `REACT_APP_PUSH_VAPID_PUBLIC_KEY`

---

## 📋 Template de remplissage

Copie-colle ce template dans `.env`:

```env
# ============ À REMPLIR ============

# SUPABASE
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=

# FIREBASE (6 valeurs)
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=

# CLOUDINARY
REACT_APP_CLOUDINARY_CLOUD_NAME=
REACT_APP_CLOUDINARY_UPLOAD_PRESET=
REACT_APP_CLOUDINARY_API_KEY=

# MAPTILER
REACT_APP_MAPTILER_API_KEY=

# HUGGING FACE
REACT_APP_HUGGINGFACE_API_KEY=

# PUSH NOTIFICATIONS
REACT_APP_PUSH_VAPID_PUBLIC_KEY=

# ============ DÉJÀ CONFIGURÉ ============
NODE_ENV=development
DEBUG_MODE=true
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_API_TIMEOUT=30000
REACT_APP_HUGGINGFACE_MODEL_DETECTION=facebook/detr-resnet-50
REACT_APP_HUGGINGFACE_MODEL_CLASSIFICATION=google/vit-base-patch16-224
REACT_APP_HUGGINGFACE_MODEL_NLP=bert-base-multilingual-cased
REACT_APP_ML_SERVICE_ENDPOINT=https://api-inference.huggingface.co/models/
ENABLE_FACIAL_RECOGNITION=true
ENABLE_GEOLOCATION=true
ENABLE_NOTIFICATIONS=true
ENABLE_ANALYTICS=false
ENABLE_PUSH_NOTIFICATIONS=true
```

---

## ✅ Ordre de création recommandé

1. **Supabase** (Database) - ~2 min
   - Crée un projet si tu n'en as pas
   - Copie 2 clés

2. **Cloudinary** (Images) - ~3 min
   - Gratuit 25GB/mois
   - Idéal pour stocker photos de rapports

3. **MapTiler** (Géolocalisation) - ~2 min
   - Meilleur choix que Mapbox/Google Maps
   - 600 requêtes/jour gratuit

4. **Hugging Face** (IA) - ~2 min
   - API Token en lecture seule
   - 30k appels/mois gratuit

5. **Firebase** (Notifications) - ~5 min
   - Crée un projet si tu n'en as pas
   - Copie 6 valeurs

6. **Web Push VAPID** (Optionnel pour les notifs) - ~1 min

---

## 🧪 Test après remplissage

```bash
# 1. Arrête le serveur (Ctrl+C)
# 2. Relance
npm start

# 3. Ouvre la console (F12 → Console)
# 4. Cherche les warnings "Environment variable ... is not set"
# 5. S'il n'y a pas de warnings → ✅ Succès!
```

---

## 🆘 Si tu bloques

### "API Key not working"
- Vérifie que tu as copié correctement (pas d'espaces)
- Teste dans Postman: `curl -H "Authorization: Bearer YOUR_KEY" https://api-url`

### "Service not found"
- Vérifie que le compte est actif
- Redémarre le serveur après remplissage du `.env`

### "CORS errors"
- Normal en dev (React ↔ API externe)
- Solution: créer un backend proxy (plus tard)

### "Rate limit exceeded"
- Tu as dépassé le quota gratuit
- Passe au tier payant ou attends demain

---

## 📞 Support officiel

- **Supabase**: https://supabase.com/support
- **Firebase**: https://firebase.google.com/support
- **Cloudinary**: https://support.cloudinary.com/
- **MapTiler**: https://docs.maptiler.com/
- **Hugging Face**: https://huggingface.co/docs

---

**Une fois toutes les clés remplies, ton projet est prêt à fonctionner! 🚀**
