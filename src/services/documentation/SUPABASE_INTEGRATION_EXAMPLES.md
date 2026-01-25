# RETROUVONSLES - Supabase Services Integration Examples

This document provides real-world integration examples for the RETROUVONSLES project.

## Table of Contents
1. [User Authentication Flow](#user-authentication-flow)
2. [Search & Filter Persons](#search--filter-persons)
3. [Create & Manage Dossiers](#create--manage-dossiers)
4. [File Management](#file-management)
5. [Real-time Notifications](#real-time-notifications)
6. [Organization Management](#organization-management)
7. [Batch Operations](#batch-operations)

---

## User Authentication Flow

### Complete Login Flow

```typescript
// pages/auth/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAuthService } from '@/services/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await supabaseAuthService.login({
      email,
      password
    });

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      
      // Handle specific error codes
      if (result.error.code === 'UNAUTHORIZED') {
        setError('Email ou mot de passe incorrect');
      } else if (result.error.code === 'LOGIN_ERROR') {
        setError('Erreur de connexion. Veuillez réessayer.');
      }
    } else {
      // Navigation handled by auth state
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Connexion en cours...' : 'Se connecter'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### Registration with Profile Creation

```typescript
// pages/auth/RegisterPage.tsx
import { useState } from 'react';
import { supabaseAuthService } from '@/services/supabase';
import type { RegisterData } from '@/@types/auth.types';
import { TypeCompte } from '@/@types/enums.types';

export function RegisterPage() {
  const [formData, setFormData] = useState<Partial<RegisterData>>({
    email: '',
    password: '',
    nom_complet: '',
    telephone: '',
    type_compte: TypeCompte.GRAND_PUBLIC
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await supabaseAuthService.register(formData as RegisterData);

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
      // Show verification email message
      console.log('User registered. Verification email sent.');
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input
        type="email"
        value={formData.email || ''}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={formData.password || ''}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Mot de passe"
        required
      />
      <input
        type="text"
        value={formData.nom_complet || ''}
        onChange={(e) => setFormData({ ...formData, nom_complet: e.target.value })}
        placeholder="Nom complet"
        required
      />
      <input
        type="tel"
        value={formData.telephone || ''}
        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
        placeholder="Téléphone"
      />
      <select
        value={formData.type_compte || ''}
        onChange={(e) => setFormData({ ...formData, type_compte: e.target.value as TypeCompte })}
      >
        <option value={TypeCompte.GRAND_PUBLIC}>Citoyen</option>
        <option value={TypeCompte.AUTORITE}>Autorité</option>
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Inscription en cours...' : "S'inscrire"}
      </button>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">Inscription réussie! Vérifiez votre email.</div>}
    </form>
  );
}
```

---

## Search & Filter Persons

### Search with Autocomplete

```typescript
// components/PersonneSearch.tsx
import { useState, useEffect } from 'react';
import { DatabaseService } from '@/services/supabase';
import type { Personne } from '@/@types/database.types';

export function PersonneSearch() {
  const db = DatabaseService.getInstance();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Personne[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      const result = await db.searchPersonnes(query, 10);
      setLoading(false);

      if (!result.error && result.data) {
        setResults(result.data);
      }
    };

    // Debounce search
    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [query, db]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher une personne..."
      />
      {loading && <div>Recherche en cours...</div>}
      <ul>
        {results.map((personne) => (
          <li key={personne.id}>
            {personne.nom_complet} ({personne.prenom})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Persons List with Pagination & Filters

```typescript
// pages/PersonnesList.tsx
import { useState, useEffect } from 'react';
import { DatabaseService } from '@/services/supabase';
import type { Personne } from '@/@types/database.types';
import { StatutPersonne } from '@/@types/enums.types';

export function PersonnesList() {
  const db = DatabaseService.getInstance();
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [statut, setStatut] = useState<StatutPersonne | 'ALL'>(StatutPersonne.DISPARU);

  const pageSize = 20;

  useEffect(() => {
    const loadPersonnes = async () => {
      setLoading(true);

      const filters: Record<string, any> = {};
      if (statut !== 'ALL') {
        filters.statut_personne = statut;
      }

      const result = await db.getMany<Personne>(
        'personnes',
        {
          limit: pageSize,
          offset: page * pageSize,
          orderBy: 'nom_complet'
        },
        filters
      );

      setLoading(false);

      if (!result.error) {
        setPersonnes(result.data || []);
        setCount(result.count || 0);
      }
    };

    loadPersonnes();
  }, [db, page, statut]);

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div>
      <div className="filters">
        <label>
          Statut:
          <select value={statut} onChange={(e) => { setStatut(e.target.value as any); setPage(0); }}>
            <option value="ALL">Tous</option>
            <option value={StatutPersonne.DISPARU}>Disparu</option>
            <option value={StatutPersonne.RETROUVE}>Retrouvé</option>
            <option value={StatutPersonne.AUTRES}>Autres</option>
          </select>
        </label>
      </div>

      {loading && <div>Chargement...</div>}

      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Date de naissance</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {personnes.map((p) => (
            <tr key={p.id}>
              <td>{p.nom_complet}</td>
              <td>{p.prenom}</td>
              <td>{new Date(p.date_naissance).toLocaleDateString()}</td>
              <td>{p.statut_personne}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
          Précédent
        </button>
        <span>Page {page + 1} / {totalPages}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
          Suivant
        </button>
      </div>
    </div>
  );
}
```

---

## Create & Manage Dossiers

### Create Dossier with Files

```typescript
// components/CreateDossierForm.tsx
import { useState } from 'react';
import { DatabaseService, StorageService, STORAGE_BUCKETS } from '@/services/supabase';
import { uploadDocument, uploadEvidence } from '@/services/supabase/storageHelpers';
import type { Dossier } from '@/@types/database.types';

export function CreateDossierForm({ personneId }: { personneId: string }) {
  const db = DatabaseService.getInstance();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [evidence, setEvidence] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Upload documents
      const uploadedDocs = [];
      for (const doc of documents) {
        const result = await uploadDocument(personneId, doc);
        if (result) uploadedDocs.push(result.path);
      }

      // Upload evidence
      const uploadedEvidence = [];
      for (const file of evidence) {
        const result = await uploadEvidence(personneId, file);
        if (result) uploadedEvidence.push(result.path);
      }

      // Create dossier record
      const dossierResult = await db.create<Dossier>('dossiers', {
        id_personne: personneId as any,
        titre,
        description,
        documents_paths: uploadedDocs,
        evidence_paths: uploadedEvidence,
        date_creation: new Date().toISOString(),
        statut: 'OUVERT'
      } as any);

      if (dossierResult.error) {
        setError(dossierResult.error.message);
      } else {
        // Reset form
        setTitre('');
        setDescription('');
        setDocuments([]);
        setEvidence([]);
        alert('Dossier créé avec succès!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        placeholder="Titre du dossier"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      
      <div>
        <label>Documents:</label>
        <input
          type="file"
          multiple
          onChange={(e) => setDocuments(Array.from(e.target.files || []))}
          accept=".pdf,.doc,.docx"
        />
      </div>

      <div>
        <label>Preuves/Médias:</label>
        <input
          type="file"
          multiple
          onChange={(e) => setEvidence(Array.from(e.target.files || []))}
          accept="image/*,video/*,audio/*"
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Création en cours...' : 'Créer le dossier'}
      </button>

      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### Update Dossier Status

```typescript
// components/DossierActions.tsx
import { DatabaseService } from '@/services/supabase';
import type { UUID } from '@/@types/database.types';

export function DossierActions({ dossierId }: { dossierId: UUID }) {
  const db = DatabaseService.getInstance();

  const updateStatus = async (newStatus: string) => {
    const result = await db.update('dossiers', dossierId, {
      statut: newStatus,
      date_modification: new Date().toISOString()
    });

    if (result.error) {
      alert('Erreur: ' + result.error.message);
    } else {
      alert('Dossier mis à jour');
    }
  };

  return (
    <div>
      <button onClick={() => updateStatus('EN_COURS')}>En cours</button>
      <button onClick={() => updateStatus('FERME')}>Fermer</button>
      <button onClick={() => updateStatus('RESOLU')}>Résolu</button>
    </div>
  );
}
```

---

## File Management

### Upload User Photo with Avatar & Thumbnail

```typescript
// components/PhotoUpload.tsx
import { useState } from 'react';
import { uploadUserPhoto, validateFile } from '@/services/supabase/storageHelpers';
import type { UUID } from '@/@types/database.types';

export function PhotoUpload({ userId }: { userId: UUID }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validation = validateFile(file, {
      maxSizeBytes: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const result = await uploadUserPhoto(userId, file);
    setUploading(false);

    if (result) {
      setAvatarUrl(result.avatar.publicUrl);
      console.log('Avatar uploaded:', result.avatar.publicUrl);
      console.log('Thumbnail:', result.thumbnail.publicUrl);
    } else {
      alert('Erreur lors de l\'upload');
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        disabled={uploading}
      />
      {preview && <img src={preview} alt="Preview" width={150} />}
      {uploading && <div>Upload en cours...</div>}
      {avatarUrl && <img src={avatarUrl} alt="Avatar" width={100} />}
    </div>
  );
}
```

### Gallery with File Management

```typescript
// components/DocumentGallery.tsx
import { useState, useEffect } from 'react';
import { StorageService, STORAGE_BUCKETS } from '@/services/supabase';
import type { UUID } from '@/@types/database.types';

export function DocumentGallery({ userId }: { userId: UUID }) {
  const storage = StorageService.getInstance();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      const result = await storage.listUserFiles(STORAGE_BUCKETS.DOCUMENTS, userId);
      if (!result.error) {
        setFiles(result.data || []);
      }
      setLoading(false);
    };

    loadFiles();
  }, [storage, userId]);

  const handleDelete = async (filePath: string) => {
    if (confirm('Êtes-vous sûr?')) {
      await storage.deleteFile(STORAGE_BUCKETS.DOCUMENTS, filePath);
      setFiles(files.filter(f => f.path !== filePath));
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h3>Mes documents ({files.length})</h3>
      <div className="gallery">
        {files.map((file) => (
          <div key={file.path} className="document">
            <a href={file.publicUrl} target="_blank" rel="noopener noreferrer">
              {file.path.split('/').pop()}
            </a>
            <button onClick={() => handleDelete(file.path)}>Supprimer</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Real-time Notifications

### Subscribe to Live Updates

```typescript
// contexts/RealtimeContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { RealtimeSubscriptionsManager } from '@/services/supabase';
import type { RealtimeEvent } from '@/services/supabase';

interface RealtimeContextType {
  events: RealtimeEvent[];
  subscribe: (table: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const subscriptions = RealtimeSubscriptionsManager.getInstance();

  const subscribe = (table: string) => {
    subscriptions.subscribe({
      table,
      event: '*',
      autoReconnect: true,
      onEvent: (event) => {
        // Limit to last 100 events
        setEvents((prev) => [event, ...prev].slice(0, 100));
      }
    });
  };

  useEffect(() => {
    return () => {
      subscriptions.cleanup();
    };
  }, [subscriptions]);

  return (
    <RealtimeContext.Provider value={{ events, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used within RealtimeProvider');
  return context;
}
```

### Display Live Notifications

```typescript
// components/LiveNotifications.tsx
import { useEffect, useState } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';

export function LiveNotifications() {
  const { events } = useRealtime();

  return (
    <div className="notifications">
      <h3>Live Updates</h3>
      {events.slice(0, 5).map((event, i) => (
        <div key={i} className={`event event-${event.type}`}>
          <strong>{event.type}</strong> {event.table}
          <p>{JSON.stringify(event.record).substring(0, 100)}...</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Organization Management

### Create Organization with Members

```typescript
// components/CreateOrganization.tsx
import { useState } from 'react';
import { DatabaseService } from '@/services/supabase';
import type { Organisation, Utilisateur } from '@/@types/database.types';

export function CreateOrganization() {
  const db = DatabaseService.getInstance();
  const [orgName, setOrgName] = useState('');
  const [members, setMembers] = useState<Array<{ email: string; role: string }>>([]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create organization
      const orgResult = await db.create<Organisation>('organisations', {
        nom: orgName,
        date_creation: new Date().toISOString()
      } as any);

      if (orgResult.error || !orgResult.data) {
        alert('Erreur: ' + orgResult.error?.message);
        return;
      }

      // Create member records
      const memberRecords = members.map(m => ({
        email: m.email,
        role: m.role,
        id_organisation: orgResult.data.id
      }));

      const membersResult = await db.batchCreate<Utilisateur>(
        'utilisateurs',
        memberRecords as any
      );

      if (!membersResult.error) {
        alert('Organisation créée avec succès!');
        setOrgName('');
        setMembers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreate}>
      <input
        type="text"
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        placeholder="Nom de l'organisation"
        required
      />

      <div className="members">
        {members.map((m, i) => (
          <div key={i}>
            <input value={m.email} placeholder="Email" readOnly />
            <select
              value={m.role}
              onChange={(e) => {
                const newMembers = [...members];
                newMembers[i].role = e.target.value;
                setMembers(newMembers);
              }}
            >
              <option>ADMIN</option>
              <option>MEMBER</option>
            </select>
            <button
              type="button"
              onClick={() => setMembers(members.filter((_, idx) => idx !== i))}
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setMembers([...members, { email: '', role: 'MEMBER' }])}>
        Ajouter un membre
      </button>

      <button type="submit" disabled={loading}>
        {loading ? 'Création...' : 'Créer'}
      </button>
    </form>
  );
}
```

---

## Batch Operations

### Bulk Update Status

```typescript
// components/BulkActions.tsx
import { useState } from 'react';
import { DatabaseService } from '@/services/supabase';
import type { UUID } from '@/@types/database.types';

export function BulkActions({ selectedIds }: { selectedIds: UUID[] }) {
  const db = DatabaseService.getInstance();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);

    const updates = selectedIds.map(id => ({
      id,
      data: { statut: newStatus, date_modification: new Date().toISOString() }
    }));

    const result = await db.batchUpdate('personnes', updates);

    setLoading(false);

    if (result.error) {
      alert('Erreur: ' + result.error.message);
    } else {
      alert(`${result.data?.length || 0} enregistrements mis à jour`);
    }
  };

  return (
    <div>
      <h3>Actions sur {selectedIds.length} éléments</h3>
      <button onClick={() => updateStatus('ACTIF')} disabled={loading}>
        Activer
      </button>
      <button onClick={() => updateStatus('INACTIF')} disabled={loading}>
        Désactiver
      </button>
      <button onClick={() => db.batchDelete('personnes', selectedIds)} disabled={loading}>
        Supprimer
      </button>
    </div>
  );
}
```

---

## Conclusion

These examples demonstrate real-world usage patterns for all RETROUVONSLES Supabase services. Adapt these examples to your specific needs and combine with your UI framework (React, Vue, etc.).

For more details, see:
- [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md)
- [SUPABASE_SERVICES_COMPLETE.md](./SUPABASE_SERVICES_COMPLETE.md)
