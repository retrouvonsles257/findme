# 🤖 Guide d'intégration Hugging Face

## Configuration

### 1. Obtenir l'API Key

1. Va sur https://huggingface.co/settings/tokens
2. Crée un nouveau token: **Create new token**
3. Donne-lui un nom (ex: "RETROUVONSLES-ML")
4. Scope: Sélectionne **"Read"** (suffisant pour l'inférence)
5. Copie le token complet dans `.env`:

```env
REACT_APP_HUGGINGFACE_API_KEY=hf_abCdEfGhIjKlMnOpQrStUvWxYz...
```

---

## 📊 Modèles configurés

Trois modèles par défaut sont configurés pour différentes tâches:

### 1. DÉTECTION D'OBJETS
**Variable:** `REACT_APP_HUGGINGFACE_MODEL_DETECTION`
**Par défaut:** `facebook/detr-resnet-50`

**Utilité:** Détecte et localise les objets dans une image
- Personnes disparues dans les photos
- Véhicules signalés
- Objets volés

**Autres options:**
```javascript
"facebook/detr-resnet-101"      // Plus puissant, plus lent
"yolos-base"                     // Plus rapide, légèrement moins précis
"hustvl/yolos-small"            // Minimal
```

### 2. CLASSIFICATION D'IMAGES
**Variable:** `REACT_APP_HUGGINGFACE_MODEL_CLASSIFICATION`
**Par défaut:** `google/vit-base-patch16-224`

**Utilité:** Catégorise le contenu d'une image
- Type d'incident (accident, vol, etc.)
- Niveau de gravité
- Catégories de rapports

**Autres options:**
```javascript
"microsoft/resnet-50"           // ResNet classique
"openai/clip-vit-base-patch32"  // Vision-Language (peut lire du texte)
"facebook/convnext-base"        // Plus moderne, plus lent
```

### 3. NLP / TEXTE
**Variable:** `REACT_APP_HUGGINGFACE_MODEL_NLP`
**Par défaut:** `bert-base-multilingual-cased`

**Utilité:** Traitement du texte multilingue
- Analyse des descriptions de rapports
- Extraction de mots-clés
- Classification du sentiment

**Autres options:**
```javascript
"flaubert/flaubert_base_cased"              // Français optimisé
"xlm-roberta-base"                          // 100+ langues
"sentence-transformers/paraphrase-mpnet-base-v2" // Similarité texte
"distiluse-base-multilingual-cased-v2"    // Plus rapide, moins lourd
```

---

## 🔧 Configuration avancée

### Changer de modèle

**Option 1: Via `.env`**
```env
REACT_APP_HUGGINGFACE_MODEL_DETECTION=yolos-base
REACT_APP_HUGGINGFACE_MODEL_CLASSIFICATION=facebook/convnext-large-tv2
REACT_APP_HUGGINGFACE_MODEL_NLP=flaubert/flaubert_large_cased
```

**Option 2: Dynamiquement dans le code**
```typescript
import { envConfig } from '@/config/env.config';

const modelToUse = process.env.NODE_ENV === 'production' 
  ? 'facebook/detr-resnet-101'  // Plus puissant en prod
  : 'yolos-small';              // Plus léger en dev
```

---

## 📝 Utilisation dans le code

### Exemple: Détection d'objets

```typescript
import { envConfig } from '@/config/env.config';

async function detectObjectsInImage(imageUrl: string) {
  const response = await fetch(
    `${envConfig.REACT_APP_ML_SERVICE_ENDPOINT}${envConfig.REACT_APP_HUGGINGFACE_MODEL_DETECTION}`,
    {
      headers: { Authorization: `Bearer ${envConfig.REACT_APP_HUGGINGFACE_API_KEY}` },
      method: "POST",
      body: JSON.stringify({ 
        inputs: imageUrl,
        parameters: { threshold: 0.5 }
      }),
    }
  );
  
  const result = await response.json();
  return result; // [ { label, score, box: {x, y, w, h} }, ... ]
}
```

### Exemple: Classification

```typescript
async function classifyImage(imageUrl: string) {
  const response = await fetch(
    `${envConfig.REACT_APP_ML_SERVICE_ENDPOINT}${envConfig.REACT_APP_HUGGINGFACE_MODEL_CLASSIFICATION}`,
    {
      headers: { Authorization: `Bearer ${envConfig.REACT_APP_HUGGINGFACE_API_KEY}` },
      method: "POST",
      body: JSON.stringify({ inputs: imageUrl }),
    }
  );
  
  const result = await response.json();
  return result; // [ { label, score }, ... ]
}
```

### Exemple: Analyse textuelle

```typescript
async function analyzeText(text: string) {
  const response = await fetch(
    `${envConfig.REACT_APP_ML_SERVICE_ENDPOINT}${envConfig.REACT_APP_HUGGINGFACE_MODEL_NLP}`,
    {
      headers: { Authorization: `Bearer ${envConfig.REACT_APP_HUGGINGFACE_API_KEY}` },
      method: "POST",
      body: JSON.stringify({ inputs: text }),
    }
  );
  
  const result = await response.json();
  return result;
}
```

---

## ⚡ Limitations et considérations

### Délai d'inférence
- **Premier appel:** 30-60 secondes (le modèle se charge)
- **Appels suivants:** 2-10 secondes (en cache)
- **Solution:** Cache les résultats sur le client

### Limitations de taille
- **Images:** Max 50MB (généralement)
- **Texte:** Max 512 tokens pour la plupart des modèles

### Disponibilité
- API peut être occupée pendant les pics
- Ajoute des retry avec backoff exponentiel

```typescript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## 🎯 Cas d'usage recommandés

### Pour RETROUVONSLES

#### Signalements (Rapports citoyens)
1. **Détection:** Identifier les personnages/objets dans la photo
2. **Classification:** Catégoriser le type de rapport
3. **NLP:** Analyser la description textuelle

```typescript
async function analyzeSignalement(image: File, description: string) {
  // 1. Détecte objets
  const detections = await detectObjects(image);
  
  // 2. Classifie le type
  const classification = await classifyImage(image);
  
  // 3. Analyse le texte
  const textAnalysis = await analyzeText(description);
  
  return {
    objects: detections,
    category: classification,
    sentiment: textAnalysis,
  };
}
```

#### Modération (Vérification)
- Détection de contenu inapproprié
- Identification de doublons
- Vérification d'authenticité

---

## 🚀 Optimisations

### Caching
```typescript
const cache = new Map();

async function cachedInference(key: string, fn: () => Promise<any>) {
  if (cache.has(key)) return cache.get(key);
  const result = await fn();
  cache.set(key, result);
  return result;
}
```

### Batch Processing
```typescript
async function batchDetect(images: string[]) {
  const requests = images.map(img => detectObjects(img));
  return Promise.all(requests);
}
```

### Workers (Arrière-plan)
```typescript
// Utilise Web Workers pour ne pas bloquer l'UI
const worker = new Worker('ml-worker.js');
worker.postMessage({ image, model: 'detection' });
worker.onmessage = (e) => console.log('Result:', e.data);
```

---

## 📊 Modèles alternatifs spécialisés

### Pour recherche de personnes disparues
```javascript
"facebook/detr-resnet-50"           // Bonne détection de personnes
"openai/clip-vit-base-patch32"      // Peut matcher des descriptions
"sentence-transformers/all-MiniLM-L6-v2" // Recherche par similarité
```

### Pour détection fraude
```javascript
"xlm-roberta-base"                  // Détecte patterns suspects
"distilbert-base-uncased-finetuned-sst-2-english" // Sentiment malveillant
```

### Pour classification rapide
```javascript
"yolos-small"                       // Détection légère
"google/vit-tiny-patch16-224"       // Ultra-léger
```

---

## 🔐 Sécurité

**Point sensible:** Votre API key est exposée au client (React)

**Solutions:**
1. **Proxy backend** (recommandé)
   ```typescript
   // Client appelle ton backend
   const response = await fetch('/api/ml/detect', { body: image });
   
   // Backend appelle Hugging Face avec la vraie clé
   ```

2. **API Key restricte**
   - Utilise des tokens en lecture seule
   - Limite l'utilisation par rate limiting
   - Monitore l'utilisation

3. **Envoi d'images**
   - Compresse les images avant envoi
   - Utilise JPEG (plus léger que PNG)
   - Ajoute du CORS si nécessaire

---

## 📈 Coûts

**Hugging Face API Inference:**
- Gratuit jusqu'à **30,000 appels/mois** (tiers gratuit)
- Payant après: ~$0.001-0.01 par requête selon le modèle
- Pour RETROUVONSLES initial: gratuit suffira

**Estimation:**
- 100 rapports/jour = ~3,000/mois ✅ (dans les limites gratuites)
- 1,000 rapports/jour = ~30,000/mois ⚠️ (limite gratuite)
- Plus: passer en API Pro

---

## 🐛 Debugging

### Vérifier l'API key
```typescript
async function testHuggingFaceKey() {
  const response = await fetch(
    'https://api-inference.huggingface.co/api/users/me',
    {
      headers: {
        Authorization: `Bearer ${envConfig.REACT_APP_HUGGINGFACE_API_KEY}`
      }
    }
  );
  
  const result = await response.json();
  console.log('API Key valid:', result);
}
```

### Test modèle
```typescript
async function testModel(modelId: string) {
  try {
    const response = await fetch(
      `${envConfig.REACT_APP_ML_SERVICE_ENDPOINT}${modelId}`,
      {
        headers: { Authorization: `Bearer ${envConfig.REACT_APP_HUGGINGFACE_API_KEY}` },
        method: "POST",
        body: JSON.stringify({ inputs: "https://example.com/image.jpg" }),
      }
    );
    console.log('Model response:', await response.json());
  } catch (error) {
    console.error('Model error:', error);
  }
}
```

---

## 📚 Ressources

- [Hugging Face API Docs](https://huggingface.co/docs/api-inference)
- [Modèles disponibles](https://huggingface.co/models)
- [API Explorer](https://huggingface.co/inference-api)
- [Pricing](https://huggingface.co/pricing)

---

**Prêt? Ajoute ton API key dans `.env` et commence à intégrer! 🚀**
