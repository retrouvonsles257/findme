# FIREBASE SERVICES - QUICK START GUIDE

**Get started with Firebase in 5 minutes!**

---

## Step 1: Initialize Firebase

```typescript
// src/App.tsx
import { initializeFirebase } from '@/services/firebase';

function App() {
  useEffect(() => {
    initializeFirebase();
  }, []);
  
  return <YourApp />;
}
```

## Step 2: Authenticate User

```typescript
import { firebaseAuthService } from '@/services/firebase';

// Sign up
await firebaseAuthService.signUp({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  displayName: 'John Doe'
});

// Sign in
await firebaseAuthService.signIn({
  email: 'user@example.com',
  password: 'SecurePassword123!'
});

// Check auth state
firebaseAuthService.onAuthStateChange((user) => {
  if (user) console.log('User:', user.uid);
});

// Sign out
await firebaseAuthService.signOut();
```

## Step 3: Create Data (Firestore)

```typescript
import { firestoreService } from '@/services/firebase';

// Create document
const docId = await firestoreService.createDocument('personnes', {
  firstName: 'Jean',
  lastName: 'Dupont',
  status: 'missing',
  createdAt: new Date()
});

// Read document
const data = await firestoreService.getDocument('personnes', docId);

// Update document
await firestoreService.updateDocument('personnes', docId, {
  status: 'found'
});

// Delete document
await firestoreService.deleteDocument('personnes', docId);
```

## Step 4: Upload Files

```typescript
import { firebaseStorageService } from '@/services/firebase';

// Upload file
const result = await firebaseStorageService.uploadFile(
  'personnes/photos/123.jpg',
  photoFile
);
console.log('File URL:', result.url);

// Download file
const download = await firebaseStorageService.downloadFile(
  'personnes/photos/123.jpg'
);

// Delete file
await firebaseStorageService.deleteFile('personnes/photos/123.jpg');
```

## Step 5: Track Events

```typescript
import { firebaseAnalyticsService } from '@/services/firebase';

// Log custom event
firebaseAnalyticsService.logEvent('personne_created', {
  personneId: '123',
  category: 'missing_child'
});

// Log page view
firebaseAnalyticsService.logPageView('personnes_list', '/personnes');

// Set user
firebaseAnalyticsService.setUserId('user_123');
```

---

## Common Patterns

### Real-Time Updates

```typescript
// Listen to document changes
const unsubscribe = firestoreService.onDocumentChange(
  'personnes',
  docId,
  (data) => {
    console.log('Updated:', data);
  }
);

// Stop listening
unsubscribe();
```

### Query Documents

```typescript
// Search
const results = await firestoreService.queryDocuments('personnes', [
  { field: 'status', operator: '==', value: 'missing' },
  { field: 'category', operator: '==', value: 'child' }
]);
```

### Batch Operations

```typescript
// Multiple operations at once
await firestoreService.batch([
  { type: 'create', collection: 'personnes', data: {...} },
  { type: 'update', collection: 'personnes', id: 'id1', data: {...} },
  { type: 'delete', collection: 'personnes', id: 'id2' }
]);
```

### Upload with Progress

```typescript
const task = firebaseStorageService.uploadFileWithProgress(
  'files/large.pdf',
  file,
  (progress) => {
    console.log(`${progress.percentage}% uploaded`);
  }
);
```

---

## Environment Setup

Create `.env.local`:
```
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_DATABASE_URL=your_db_url
```

---

## Next Steps

📚 **Full Documentation**: See `FIREBASE_IMPLEMENTATION_COMPLETE.md`  
🔧 **Module Integration**: See `FIREBASE_INTEGRATION_BY_MODULE.md`  
📊 **Status Report**: See `FIREBASE_IMPLEMENTATION_FINAL_REPORT.md`  

---

**Ready to go! Happy coding! 🚀**
