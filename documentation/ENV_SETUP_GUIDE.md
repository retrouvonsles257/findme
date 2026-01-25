# 🔐 Guide d'implémentation des Variables d'Environnement

## Fichiers créés/modifiés

✅ **Fichiers de configuration**
- `.env` - Fichier des variables (À compléter avec tes clés)
- `.env.example` - Fichier exemple avec instructions détaillées
- `src/config/env.config.ts` - Configuration centralisée (Mise à jour avec MapTiler et Hugging Face)
- `src/config/map.config.ts` - Configuration maps (MapTiler en primaire)
- `.gitignore` - Mise à jour pour ignorer `.env`

---

## 📍 Où mettre tes clés API

### Étape 1: Remplir le fichier `.env`

Ouvre `/home/ibo/retrouvonsles/.env` et ajoute tes clés:

```bash
# 1️⃣ SUPABASE - Base de données
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOi...

# 2️⃣ FIREBASE - Notifications push
REACT_APP_FIREBASE_API_KEY=AIzaSyD...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# ... autres clés Firebase

# 3️⃣ CLOUDINARY - Stockage images
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your-preset
REACT_APP_CLOUDINARY_API_KEY=your-api-key

# 4️⃣ MAPTILER - Géolocalisation
REACT_APP_MAPTILER_API_KEY=ELOoxmh...

# 5️⃣ HUGGING FACE - AI/ML
REACT_APP_HUGGINGFACE_API_KEY=hf_abCdEf...
```

---

## 🔑 Comment obtenir chaque clé API

### 1️⃣ SUPABASE - Base de données
**Où:** https://app.supabase.com/

1. Sélectionne ton projet
2. Va dans **Settings > API**
3. Copie:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon key** → `REACT_APP_SUPABASE_ANON_KEY`

### 2️⃣ FIREBASE - Push Notifications
**Où:** https://console.firebase.google.com/

1. Sélectionne ton projet
2. **Project Settings** (⚙️ en haut à gauche)
3. Onglet **Your Apps > Web**
4. Copie la section `config`:

```javascript
const config = {
  apiKey: "AIzaSyD..." ,           // → REACT_APP_FIREBASE_API_KEY
  authDomain: "xxx.firebaseapp.com", // → REACT_APP_FIREBASE_AUTH_DOMAIN
  projectId: "xxx",                 // → REACT_APP_FIREBASE_PROJECT_ID
  storageBucket: "xxx.appspot.com", // → REACT_APP_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456",      // → REACT_APP_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456:web:xxx"         // → REACT_APP_FIREBASE_APP_ID
}
```

### 3️⃣ CLOUDINARY - Stockage images
**Où:** https://cloudinary.com/console/

1. Dashboard > **Settings > API Keys**
2. Copie:
   - **Cloud Name** → `REACT_APP_CLOUDINARY_CLOUD_NAME`
   - **API Key** → `REACT_APP_CLOUDINARY_API_KEY`

3. Pour **Upload Preset**:
   - Dashboard > **Upload > Set upload preset**
   - Crée un preset "unsigned"
   - Copie le nom → `REACT_APP_CLOUDINARY_UPLOAD_PRESET`

### 4️⃣ MAPTILER - Géolocalisation
**Où:** https://cloud.maptiler.com/account/keys/

1. Tu verras une liste de clés API
2. Si aucune n'existe, crée une: **Create new API key**
3. Copie la clé → `REACT_APP_MAPTILER_API_KEY`

**Maps disponibles:**
- `streets` (défaut) - Carte routière
- `satellite` - Vue satellite
- `hybrid` - Hybride (routière + satellite)
- `ocean` - Style océan
- `outdoor` - Outdoor
- `winter` - Style hiver

### 5️⃣ HUGGING FACE - AI/ML
**Où:** https://huggingface.co/settings/tokens

1. **Create new token**
2. Scope: Select **"Read"**
3. Copie le token → `REACT_APP_HUGGINGFACE_API_KEY`

**Modèles inclus (optionnel à configurer):**
- **Detection**: `facebook/detr-resnet-50` - Détection d'objets
- **Classification**: `google/vit-base-patch16-224` - Classification d'images
- **NLP**: `bert-base-multilingual-cased` - Traitement multilingue

### 6️⃣ PUSH NOTIFICATIONS - VAPID Keys
**Génère via web-push:**

```bash
# Méthode 1: CLI
npm install -g web-push
web-push generate-vapid-keys

# Méthode 2: En ligne
# https://web-push-codelab.glitch.me/
```

Copie la **public key** → `REACT_APP_PUSH_VAPID_PUBLIC_KEY`

---

## 🚀 Structure d'utilisation dans le projet

### Architecture des configurations

```
.env (fichier privé) 
  ↓
src/config/env.config.ts (centre de validation)
  ↓
src/config/*.config.ts (fichiers service)
  ├── supabase.config.ts
  ├── firebase.config.ts
  ├── cloudinary.config.ts
  ├── map.config.ts
  └── ia.config.ts
  ↓
Features et Services utilisent les configs
```

### Dans le code

```typescript
// ✅ Correct - utiliser envConfig
import { envConfig } from '@/config/env.config';

const supabaseUrl = envConfig.REACT_APP_SUPABASE_URL;
const huggingfaceKey = envConfig.REACT_APP_HUGGINGFACE_API_KEY;

// ❌ Incorrect - accéder directement à process.env
// process.env.REACT_APP_SUPABASE_URL
```

---

## ✅ Checklist de configuration

- [ ] Créer compte Supabase et copier URL + anon key
- [ ] Créer compte Firebase et copier les 6 valeurs
- [ ] Créer compte Cloudinary et copier 3 valeurs
- [ ] Créer compte MapTiler et copier API key
- [ ] Créer token Hugging Face et copier
- [ ] Générer VAPID keys pour push notifications
- [ ] Remplir le fichier `.env`
- [ ] Tester: `npm start` - pas d'erreur dans la console
- [ ] Vérifier `.env` est dans `.gitignore` ✅
- [ ] Ne jamais commit `.env` à Git

---

## 🧪 Test de configuration

Après remplir le `.env`, redémarre le serveur:

```bash
# Arrête le serveur actuel (Ctrl+C)

# Relance
npm start
```

**Vérifications:**
1. Pas d'erreur dans la console
2. Pas de warning "Environment variable ... is not set"
3. Les services commencent à fonctionner

---

## 📚 Modèles Hugging Face recommandés

### Pour détection d'objets (missing persons, etc.)
- `facebook/detr-resnet-50` - Très bon pour détection (personnes, voitures, etc.)
- `facebook/detr-resnet-101` - Plus puissant mais plus lent

### Pour classification (type d'incident)
- `google/vit-base-patch16-224` - Vision Transformer
- `microsoft/resnet-50` - ResNet standard

### Pour NLP (description texte)
- `bert-base-multilingual-cased` - Multilingue (français + autres)
- `flaubert/flaubert_base_cased` - Français spécifiquement
- `xlm-roberta-base` - Plus de langues

---

## 🔒 Sécurité

**NE JAMAIS:**
- Commit `.env` à Git
- Partager tes clés API
- Mettre les clés dans le code source
- Utiliser des clés de production en développement

**Bonnes pratiques:**
- Régénère les clés si elles sont compromises
- Utilise des API keys "read-only" quand possible
- Rotate les clés périodiquement
- Utilise des secrets managers en production

---

## 🌍 Déploiement (Production)

Sur **Vercel/Netlify/Railway**, ajoute les variables d'environnement:

### Vercel
1. Project Settings > Environment Variables
2. Ajoute chaque clé
3. Sélectionne: Production / Preview / Development

### Netlify
1. Site Settings > Build & Deploy > Environment
2. Ajoute les variables

### Exemple pour Vercel
```
REACT_APP_SUPABASE_URL=https://...
REACT_APP_FIREBASE_API_KEY=AIzaSy...
# etc.
```

---

## 📖 Ressources

- [Supabase Docs](https://supabase.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [MapTiler Docs](https://docs.maptiler.com/)
- [Hugging Face API](https://huggingface.co/docs/api-inference)
- [Web Push Notifications](https://firebase.google.com/docs/cloud-messaging)

---

**Besoin d'aide?** Consulte `.env.example` pour les instructions détaillées par clé.
