# RETROUVONSLES - Supabase Services Quick Start

## 5-Minute Setup

### 1. Initialize Services

```typescript
import { initializeSupabaseFromEnv } from '@/services/supabase';

// Initialize on app startup (in App.tsx or main.tsx)
initializeSupabaseFromEnv();
```

### 2. Authentication

```typescript
import { supabaseAuthService } from '@/services/supabase';

// Login
const result = await supabaseAuthService.login({
  email: 'user@example.com',
  password: 'password123'
});

if (result.error) {
  console.error('Login failed:', result.error.message);
} else {
  console.log('Logged in:', result.data?.user.nom_complet);
}

// Logout
await supabaseAuthService.logout();
```

### 3. Database Operations

```typescript
import { DatabaseService } from '@/services/supabase';
import type { Personne } from '@/@types/database.types';

const db = DatabaseService.getInstance();

// Get single record
const { data: personne } = await db.getOne<Personne>('personnes', personneId);

// Get multiple records
const { data: personnes, count } = await db.getMany<Personne>(
  'personnes',
  { limit: 10, offset: 0 },
  { statut: 'ACTIF' }
);

// Create record
const { data: newPersonne } = await db.create<Personne>('personnes', {
  nom_complet: 'John Doe',
  prenom: 'John',
  date_naissance: '1990-01-01'
});

// Update record
const { data: updated } = await db.update<Personne>(
  'personnes',
  personneId,
  { nom_complet: 'Jane Doe' }
);

// Delete record
await db.delete('personnes', personneId);
```

### 4. File Storage

```typescript
import { StorageService, STORAGE_BUCKETS } from '@/services/supabase';
import { uploadUserPhoto, uploadDocument } from '@/services/supabase/storageHelpers';

const storage = StorageService.getInstance();

// Upload and compress photo
const result = await uploadUserPhoto(userId, photoFile);
if (result) {
  console.log('Avatar URL:', result.avatar.publicUrl);
  console.log('Thumbnail URL:', result.thumbnail.publicUrl);
}

// Upload document
const docResult = await uploadDocument(userId, documentFile, 'identification');
if (docResult) {
  console.log('Document URL:', docResult.publicUrl);
}

// Get file URL
const publicUrl = storage.getPublicUrl(STORAGE_BUCKETS.PHOTOS, 'path/to/photo.jpg');

// Delete file
await storage.deleteFile(STORAGE_BUCKETS.PHOTOS, 'path/to/photo.jpg');
```

### 5. Real-time Updates

```typescript
import { RealtimeSubscriptionsManager } from '@/services/supabase';

const subscriptions = RealtimeSubscriptionsManager.getInstance();

// Subscribe to table changes
const subscriptionId = subscriptions.subscribe({
  table: 'personnes',
  event: 'UPDATE',
  autoReconnect: true,
  onEvent: (event) => {
    console.log('Updated:', event.record);
  },
  onError: (error) => {
    console.error('Subscription error:', error);
  }
});

// Unsubscribe when done
await subscriptions.unsubscribe(subscriptionId);

// Cleanup on app shutdown
await subscriptions.unsubscribeAll();
```

## Common Patterns

### Search with Pagination

```typescript
const db = DatabaseService.getInstance();

const { data: results, count } = await db.getMany(
  'personnes',
  {
    limit: 20,
    offset: 0,
    orderBy: 'created_at',
    ascending: false
  },
  {
    statut: 'ACTIF',
    type_personne: 'DISPARU'
  }
);

console.log(`Found ${count} records`);
```

### Batch Operations

```typescript
const db = DatabaseService.getInstance();

// Create multiple records
const { data: created, error } = await db.batchCreate(
  'dossiers',
  dossiersArray
);

if (!error) {
  console.log(`Created ${created?.length} dossiers`);
}

// Update multiple records
const { data: updated } = await db.batchUpdate(
  'personnes',
  [
    { id: '123', data: { statut: 'ACTIF' } },
    { id: '456', data: { statut: 'ACTIF' } }
  ]
);

// Delete multiple records
await db.batchDelete('personnes', ['123', '456', '789']);
```

### Error Handling

```typescript
const result = await db.getOne('personnes', id);

if (result.error) {
  switch (result.error.code) {
    case 'NOT_FOUND':
      console.error('Record not found');
      break;
    case 'UNAUTHORIZED':
      console.error('Access denied');
      break;
    default:
      console.error('Error:', result.error.message);
  }
} else {
  console.log('Success:', result.data);
}
```

### File Validation

```typescript
import { validateFile } from '@/services/supabase/storageHelpers';

const validation = validateFile(file, {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  allowedExtensions: ['jpg', 'jpeg', 'png']
});

if (!validation.valid) {
  console.error('Validation failed:', validation.error);
  return;
}

// File is valid, proceed with upload
```

## Environment Setup

Create `.env.local`:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## Type Definitions

```typescript
// Import types as needed
import type {
  Personne,
  Utilisateur,
  Dossier,
  LienFiliation,
  Organisation,
  UUID
} from '@/@types/database.types';

import type {
  AuthResult,
  AuthError
} from '@/services/supabase';

import type {
  DatabaseResult,
  StorageResult,
  UploadedFile
} from '@/services/supabase';
```

## Debugging

Enable detailed logging:

```typescript
// Services already log all operations
// Check console output for:
// [Supabase client initialized successfully]
// [Realtime Event] UPDATE personnes {...}
// [Auth Error] Login failed: Invalid credentials

// For custom debugging:
const result = await db.getOne('personnes', id);
console.log('Result:', result);
if (result.error) {
  console.error('Error details:', {
    code: result.error.code,
    message: result.error.message,
    details: result.error.details
  });
}
```

## Performance Tips

1. **Use Batch Operations**: For multiple records, use batch methods
2. **Pagination**: Always paginate large result sets
3. **Reuse Instances**: Services are singletons, reuse them
4. **Cache Results**: Cache frequently accessed data
5. **Real-time Selectively**: Only subscribe to tables you need

## Troubleshooting

### "Supabase client not initialized"
```typescript
// Make sure to call before using services
initializeSupabaseFromEnv();
```

### "Missing REACT_APP_SUPABASE_URL"
```typescript
// Add environment variables to .env.local
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-key
```

### File Upload Fails
```typescript
// Check file validation
const validation = validateFile(file);
if (!validation.valid) {
  console.error(validation.error);
}

// Increase max file size if needed
uploadUserPhoto(userId, file); // Default 5MB
```

### Real-time Not Working
```typescript
// Check subscription was created
const subscriptionId = subscriptions.subscribe({...});
console.log('Subscription ID:', subscriptionId);

// Verify table name and permissions
const active = subscriptions.getActiveSubscriptions();
console.log('Active subscriptions:', active);
```

## Next Steps

1. Review [SUPABASE_SERVICES_COMPLETE.md](./SUPABASE_SERVICES_COMPLETE.md) for detailed API reference
2. Check [src/services/supabase](./src/services/supabase) source files for implementation details
3. Look at existing component usage in the project
4. Set up error tracking and monitoring

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://github.com/supabase/supabase-js)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase Realtime Guide](https://supabase.com/docs/guides/realtime)
