# FIREBASE INTEGRATION BY MODULE - COMPLETE GUIDE

**Project**: RETROUVONSLES  
**Integration Scope**: All 6 Feature Modules  
**Date**: 2024  
**Version**: 1.0.0

---

## 📋 Table of Contents

1. [Module Overview](#module-overview)
2. [Personnes Module Integration](#personnes-module-integration)
3. [Dossiers Module Integration](#dossiers-module-integration)
4. [Signalements Module Integration](#signalements-module-integration)
5. [Organisations Module Integration](#organisations-module-integration)
6. [Moderation Module Integration](#moderation-module-integration)
7. [IA Analysis Module Integration](#ia-analysis-module-integration)
8. [Database Schema](#database-schema)

---

## Module Overview

| Module | Purpose | Firebase Services | Collections |
|--------|---------|-------------------|-------------|
| **Personnes** | Missing person records | Firestore, Storage, Analytics | personnes, documents |
| **Dossiers** | Case management | Firestore, Storage, Analytics | dossiers_disparition, documents |
| **Signalements** | Reports/sightings | Firestore, Realtime DB, Analytics | signalements, documents |
| **Organisations** | Organization management | Firestore, Storage, Analytics | organisations, documents |
| **Moderation** | Content moderation | Firestore, Analytics | reports, moderation_decisions |
| **IA Analysis** | AI-powered analysis | Firestore, Storage | ia_analysis_results, ia_models |

---

## Personnes Module Integration

### Overview

The Personnes module manages missing person records, including personal information, photos, and related documentation.

### Firestore Collections

**Collection: `personnes`**

```typescript
interface PersonneRecord {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  photoUrl?: string;
  description: string;
  lastSeenLocation: {
    latitude: number;
    longitude: number;
    description: string;
    date: Date;
  };
  category: 'child' | 'adult' | 'elderly' | 'vulnerable';
  status: 'missing' | 'found' | 'deceased' | 'withdrawn';
  distinguishingFeatures?: string[];
  medicalConditions?: string[];
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  caseId?: string; // Reference to dossier
}
```

**Subcollection: `personnes/{id}/documents`**

```typescript
interface DocumentRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: Date;
  documentType: 'photo' | 'report' | 'identification' | 'medical';
}
```

### Storage Paths

```
personnes/
├── {personneId}/
│   ├── avatar.jpg (main photo)
│   ├── photo_1.jpg
│   ├── photo_2.jpg
│   └── documents/
│       ├── birth_certificate.pdf
│       └── medical_report.pdf
```

### Integration Points

#### 1. Create Missing Person Record

```typescript
// src/features/personnes/services/personneService.ts

import { firestoreService, firebaseStorageService, firebaseAnalyticsService } from '@/services/firebase';

export const createMissingPersonne = async (data: PersonneFormData, photoFile?: File) => {
  try {
    // Upload photo if provided
    let photoUrl: string | undefined;
    if (photoFile) {
      const timestamp = Date.now();
      const result = await firebaseStorageService.uploadFile(
        `personnes/${timestamp}/avatar`,
        photoFile
      );
      photoUrl = result.url;
    }

    // Create document
    const personneId = await firestoreService.createDocument('personnes', {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      photoUrl,
      description: data.description,
      lastSeenLocation: data.lastSeenLocation,
      category: data.category,
      status: 'missing',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: getCurrentUserId(),
    });

    // Log analytics event
    firebaseAnalyticsService.logPersonneCreated(personneId, data.category);

    return { success: true, id: personneId };
  } catch (error) {
    console.error('Error creating personne:', error);
    return { success: false, error: error.message };
  }
};
```

#### 2. Search and Filter

```typescript
export const searchPersonnes = async (filters: PersonneFilters) => {
  const constraints = [];

  if (filters.status) {
    constraints.push({ field: 'status', operator: '==', value: filters.status });
  }
  if (filters.category) {
    constraints.push({ field: 'category', operator: '==', value: filters.category });
  }
  if (filters.region) {
    constraints.push({
      field: 'lastSeenLocation.region',
      operator: '==',
      value: filters.region
    });
  }

  const results = await firestoreService.queryDocuments('personnes', constraints);

  // Log search event
  firebaseAnalyticsService.logSearch(`personnes_${filters.category}`, filters);

  return results;
};
```

#### 3. Real-Time Updates

```typescript
export const watchPersonne = (personneId: string, callback: (data: PersonneRecord) => void) => {
  return firestoreService.onDocumentChange(
    'personnes',
    personneId,
    callback,
    `personne_${personneId}`
  );
};
```

#### 4. Update Status

```typescript
export const updatePersonneStatus = async (
  personneId: string,
  newStatus: PersonneStatus
) => {
  const result = await firestoreService.updateDocument('personnes', personneId, {
    status: newStatus,
    updatedAt: new Date(),
  });

  if (result) {
    firebaseAnalyticsService.logPersonneUpdated(personneId);
    if (newStatus === 'found') {
      firebaseAnalyticsService.logPersonneFound(personneId);
    }
  }

  return result;
};
```

### React Component Integration

```typescript
// src/features/personnes/pages/CreatePersonnePage.tsx

import { useState } from 'react';
import { createMissingPersonne } from '../services/personneService';

export function CreatePersonnePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PersonneFormData, photoFile?: File) => {
    setLoading(true);
    setError(null);

    const result = await createMissingPersonne(data, photoFile);

    if (result.success) {
      // Navigate to detail page
      navigate(`/personnes/${result.id}`);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    // Form JSX
  );
}
```

---

## Dossiers Module Integration

### Overview

The Dossiers module manages missing person cases, including investigation details, leads, and case status.

### Firestore Collections

**Collection: `dossiers_disparition`**

```typescript
interface DossierDisparition {
  id: string;
  personneId: string;
  title: string;
  description: string;
  investigationStatus: 'open' | 'closed' | 'suspended' | 'found';
  priority: 'high' | 'medium' | 'low';
  leads: Lead[];
  assignedTo: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  resolution?: string;
}

interface Lead {
  id: string;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  date: Date;
  credibility: 'confirmed' | 'likely' | 'possible' | 'unlikely';
  source: string;
  createdBy: string;
}
```

### Integration Points

#### 1. Create Case/Dossier

```typescript
export const createDossier = async (
  personneId: string,
  dossierData: CreateDossierData
) => {
  const dossierId = await firestoreService.createDocument('dossiers_disparition', {
    personneId,
    ...dossierData,
    investigationStatus: 'open',
    leads: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  firebaseAnalyticsService.logEvent('dossier_created', {
    dossierId,
    personneId,
    priority: dossierData.priority,
  });

  return dossierId;
};
```

#### 2. Add Lead to Dossier

```typescript
export const addLead = async (dossierId: string, lead: Omit<Lead, 'id'>) => {
  const dossier = await firestoreService.getDocument('dossiers_disparition', dossierId);
  const newLead = {
    ...lead,
    id: Date.now().toString(),
  };

  return firestoreService.updateDocument('dossiers_disparition', dossierId, {
    leads: [...(dossier?.leads || []), newLead],
    updatedAt: new Date(),
  });
};
```

#### 3. Update Investigation Status

```typescript
export const updateInvestigationStatus = async (
  dossierId: string,
  newStatus: DossierStatus,
  resolution?: string
) => {
  const updateData: any = {
    investigationStatus: newStatus,
    updatedAt: new Date(),
  };

  if (newStatus === 'closed' && resolution) {
    updateData.closedAt = new Date();
    updateData.resolution = resolution;
  }

  return firestoreService.updateDocument('dossiers_disparition', dossierId, updateData);
};
```

#### 4. Watch Dossier Changes

```typescript
export const watchDossier = (dossierId: string, callback: (data: DossierDisparition) => void) => {
  return firestoreService.onDocumentChange(
    'dossiers_disparition',
    dossierId,
    callback,
    `dossier_${dossierId}`
  );
};
```

---

## Signalements Module Integration

### Overview

The Signalements module handles reports and sightings of missing persons, using both Firestore and Realtime Database for immediate updates.

### Firestore Collections

**Collection: `signalements`**

```typescript
interface Signalement {
  id: string;
  personneId: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    region: string;
  };
  reportedAt: Date;
  createdBy: string;
  status: 'pending' | 'verified' | 'rejected' | 'resolved';
  confidence: number; // 0-100
  evidence?: string[]; // Storage paths
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Realtime Database Paths

```
signalements/
├── {personneId}/
│   └── latest_signalements/
│       └── {signalementId}: {timestamp}
```

### Integration Points

#### 1. Create Signalement

```typescript
export const createSignalement = async (
  personneId: string,
  data: SignalementFormData,
  photos?: File[]
) => {
  try {
    // Upload photos
    const evidencePaths: string[] = [];
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        const result = await firebaseStorageService.uploadFile(
          `signalement_photos/${Date.now()}/${photo.name}`,
          photo
        );
        if (result.url) {
          evidencePaths.push(result.url);
        }
      }
    }

    // Create Firestore document
    const signalementId = await firestoreService.createDocument('signalements', {
      personneId,
      ...data,
      evidence: evidencePaths,
      status: 'pending',
      confidence: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: getCurrentUserId(),
    });

    // Add to Realtime DB for live updates
    await realtimeDatabaseService.setData(
      `signalements/${personneId}/latest_signalements/${signalementId}`,
      Date.now()
    );

    // Log analytics
    firebaseAnalyticsService.logSignalementCreated(signalementId, personneId);

    return { success: true, id: signalementId };
  } catch (error) {
    console.error('Error creating signalement:', error);
    return { success: false, error: error.message };
  }
};
```

#### 2. Get Recent Signalements

```typescript
export const getRecentSignalements = (personneId: string, limit = 20) => {
  return realtimeDatabaseService.onValueChange(
    `signalements/${personneId}/latest_signalements`,
    async (data) => {
      if (!data) return [];

      // Get IDs of latest signalements
      const signalementIds = Object.keys(data)
        .sort((a, b) => data[b] - data[a])
        .slice(0, limit);

      // Fetch full documents from Firestore
      const signalements = await Promise.all(
        signalementIds.map(id =>
          firestoreService.getDocument('signalements', id)
        )
      );

      return signalements.filter(Boolean);
    }
  );
};
```

#### 3. Verify Signalement

```typescript
export const verifySignalement = async (
  signalementId: string,
  isValid: boolean,
  notes?: string
) => {
  const result = await firestoreService.updateDocument('signalements', signalementId, {
    status: isValid ? 'verified' : 'rejected',
    confidence: isValid ? 100 : 0,
    verificationNotes: notes,
    verifiedBy: getCurrentUserId(),
    verifiedAt: new Date(),
    updatedAt: new Date(),
  });

  if (result) {
    if (isValid) {
      firebaseAnalyticsService.logSignalementVerified(signalementId);
    } else {
      firebaseAnalyticsService.logSignalementRejected(signalementId);
    }
  }

  return result;
};
```

---

## Organisations Module Integration

### Overview

The Organisations module manages organization profiles, members, and resources.

### Firestore Collections

**Collection: `organisations`**

```typescript
interface Organisation {
  id: string;
  name: string;
  description: string;
  type: 'government' | 'ngo' | 'community' | 'private';
  logoUrl?: string;
  contact: {
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  members: string[]; // User IDs
  verified: boolean;
  rating: number; // 0-5
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Integration Points

#### 1. Create Organisation

```typescript
export const createOrganisation = async (
  data: OrganisationFormData,
  logoFile?: File
) => {
  let logoUrl: string | undefined;

  if (logoFile) {
    const result = await firebaseStorageService.uploadFile(
      `organisation_logos/${Date.now()}/logo`,
      logoFile
    );
    logoUrl = result.url;
  }

  const orgId = await firestoreService.createDocument('organisations', {
    ...data,
    logoUrl,
    members: [getCurrentUserId()],
    verified: false,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  firebaseAnalyticsService.logEvent('organisation_created', { orgId });

  return orgId;
};
```

#### 2. Add Member

```typescript
export const addMemberToOrganisation = async (
  organisationId: string,
  userId: string
) => {
  const org = await firestoreService.getDocument('organisations', organisationId);

  return firestoreService.updateDocument('organisations', organisationId, {
    members: [...new Set([...(org?.members || []), userId])],
    updatedAt: new Date(),
  });
};
```

---

## Moderation Module Integration

### Overview

The Moderation module handles content moderation, abuse reports, and decision logging.

### Firestore Collections

**Collection: `reports`**

```typescript
interface ModerationReport {
  id: string;
  reportedContentType: 'personne' | 'signalement' | 'dossier' | 'comment';
  reportedContentId: string;
  reason: string;
  description: string;
  reportedBy: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  decision?: 'approved' | 'rejected' | 'removed';
  decisionNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Integration Points

#### 1. Create Moderation Report

```typescript
export const createModerationReport = async (report: ModerationReportData) => {
  const reportId = await firestoreService.createDocument('reports', {
    ...report,
    status: 'pending',
    priority: calculatePriority(report),
    createdAt: new Date(),
    updatedAt: new Date(),
    reportedBy: getCurrentUserId(),
  });

  firebaseAnalyticsService.logEvent('moderation_report_created', {
    reportId,
    reason: report.reason,
    contentType: report.reportedContentType,
  });

  return reportId;
};
```

#### 2. Review and Decide

```typescript
export const reviewModerationReport = async (
  reportId: string,
  decision: ModerationDecision,
  notes: string
) => {
  const result = await firestoreService.updateDocument('reports', reportId, {
    status: 'resolved',
    decision: decision.action,
    decisionNotes: notes,
    reviewedBy: getCurrentUserId(),
    reviewedAt: new Date(),
    updatedAt: new Date(),
  });

  // If removing content, update the source document
  if (decision.action === 'removed') {
    const report = await firestoreService.getDocument('reports', reportId);
    await firestoreService.updateDocument(
      report.reportedContentType === 'personne' ? 'personnes' : 'signalements',
      report.reportedContentId,
      { status: 'removed' }
    );
  }

  return result;
};
```

---

## IA Analysis Module Integration

### Overview

The IA Analysis module integrates AI-powered analysis for matching missing persons with potential leads.

### Firestore Collections

**Collection: `ia_analysis_results`**

```typescript
interface IAAnalysisResult {
  id: string;
  personneId: string;
  signalementId: string;
  matchScore: number; // 0-100
  analysisDetails: {
    photoSimilarity: number;
    locationProximity: number;
    timingAlignement: number;
    otherFactors: Record<string, number>;
  };
  recommendation: 'highly_likely' | 'possible' | 'unlikely';
  generatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  humanVerification?: boolean;
}
```

### Integration Points

#### 1. Trigger IA Analysis

```typescript
export const triggerIAAnalysis = async (personneId: string, signalementId: string) => {
  try {
    // Call AI service (implementation depends on your AI backend)
    const analysisResult = await callAIMatchingService({
      personneId,
      signalementId,
    });

    // Store result in Firestore
    const resultId = await firestoreService.createDocument('ia_analysis_results', {
      personneId,
      signalementId,
      ...analysisResult,
      generatedAt: new Date(),
    });

    firebaseAnalyticsService.logEvent('ia_analysis_completed', {
      personneId,
      signalementId,
      matchScore: analysisResult.matchScore,
    });

    return resultId;
  } catch (error) {
    console.error('Error triggering IA analysis:', error);
    throw error;
  }
};
```

#### 2. Get Analysis Results

```typescript
export const getPersonneAnalysisResults = async (personneId: string) => {
  const results = await firestoreService.queryDocuments('ia_analysis_results', [
    { field: 'personneId', operator: '==', value: personneId }
  ]);

  return results
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10); // Top 10 matches
};
```

---

## Database Schema

### Complete Firestore Structure

```
firestore/
│
├── users/
│   └── {userId}
│       ├── email: string
│       ├── displayName: string
│       ├── role: string
│       ├── organization: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── personnes/
│   └── {personneId}
│       ├── firstName: string
│       ├── lastName: string
│       ├── dateOfBirth: date
│       ├── status: string
│       ├── photoUrl: string
│       ├── description: string
│       ├── lastSeenLocation: geopoint + metadata
│       ├── category: string
│       ├── documents/ (subcollection)
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── dossiers_disparition/
│   └── {dossierId}
│       ├── personneId: string
│       ├── title: string
│       ├── description: string
│       ├── investigationStatus: string
│       ├── priority: string
│       ├── leads: array
│       ├── assignedTo: array
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── signalements/
│   └── {signalementId}
│       ├── personneId: string
│       ├── title: string
│       ├── description: string
│       ├── location: geopoint + metadata
│       ├── status: string
│       ├── confidence: number
│       ├── evidence: array
│       ├── verificationNotes: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── organisations/
│   └── {organisationId}
│       ├── name: string
│       ├── type: string
│       ├── contact: object
│       ├── logoUrl: string
│       ├── members: array
│       ├── verified: boolean
│       ├── rating: number
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── reports/
│   └── {reportId}
│       ├── reportedContentType: string
│       ├── reportedContentId: string
│       ├── reason: string
│       ├── status: string
│       ├── decision: string
│       ├── reviewedBy: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
└── ia_analysis_results/
    └── {resultId}
        ├── personneId: string
        ├── signalementId: string
        ├── matchScore: number
        ├── recommendation: string
        ├── generatedAt: timestamp
        └── reviewedAt: timestamp
```

### Complete Realtime Database Structure

```
realtime_db/
│
├── presence/
│   └── {userId}
│       ├── online: boolean
│       └── timestamp: number
│
├── typing_indicators/
│   └── {userId}: boolean
│
├── signalements/
│   └── {personneId}/
│       └── latest_signalements/
│           └── {signalementId}: timestamp
│
└── notifications/
    └── {userId}/
        └── {notificationId}
            ├── title: string
            ├── body: string
            ├── read: boolean
            └── createdAt: timestamp
```

---

## Security Rules

### Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read own profile
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }

    // Personnes - readable by all, writable by admins
    match /personnes/{personneId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
      match /documents/{document=**} {
        allow read, write: if request.auth != null;
      }
    }

    // Other collections - authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Best Practices per Module

### Personnes Module
- Always verify photo uploads before storing
- Maintain photo quality standards
- Keep personal data minimal (privacy)
- Log all status changes for audit trail

### Dossiers Module
- Use transactions for multi-document updates
- Maintain investigation timeline
- Archive closed cases after period
- Track case assignment changes

### Signalements Module
- Use Realtime DB for live updates
- Implement credibility scoring
- Batch verify multiple signalements
- Clean up old unverified reports

### Organisations Module
- Verify organization details on creation
- Track member permissions
- Maintain rating history
- Log organization changes

### Moderation Module
- Create audit trail for all decisions
- Use batch operations for bulk actions
- Archive resolved reports
- Monitor decision patterns

### IA Analysis Module
- Cache analysis results for performance
- Track AI model versions
- Log human verification feedback
- Monitor false positive rates

---

**Document Version**: 1.0.0  
**Status**: ✅ COMPLETE  
**Integration Coverage**: 100%
