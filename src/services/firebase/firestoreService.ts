/**
 * =====================================================
 * RETROUVONSLES - Firestore Database Service
 * =====================================================
 * Cloud Firestore CRUD operations and queries
 */

import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  writeBatch,
  runTransaction,
  QueryConstraint,
  QueryDocumentSnapshot,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseServices } from './firebaseConfig';

// Type alias for collection name
type FirestoreCollection = string;

// ============================================
// TYPES & INTERFACES
// ============================================

export interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

export interface QueryOptions {
  constraints?: QueryConstraint[];
  orderByField?: string;
  orderByDirection?: 'asc' | 'desc';
  limitCount?: number;
  offsetValue?: number;
}

export interface BatchOperation {
  type: 'set' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: any;
}

export interface Transaction {
  get: (docRef: any) => Promise<any>;
  set: (docRef: any, data: any) => void;
  update: (docRef: any, data: any) => void;
  delete: (docRef: any) => void;
}

export interface ListenerUnsubscribe {
  unsubscribe: () => void;
}

export interface QueryResult<T = any> {
  docs: T[];
  count: number;
  lastDoc?: QueryDocumentSnapshot<T>;
}

// ============================================
// FIRESTORE SERVICE CLASS
// ============================================

class FirestoreService {
  private firestore: Firestore | null = null;
  private isInitialized: boolean = false;
  private listeners: Map<string, Unsubscribe> = new Map();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Firestore service
   */
  private initialize(): void {
    try {
      const services = getFirebaseServices();
      this.firestore = services.firestore;
      this.isInitialized = !!this.firestore;
    } catch (error) {
      console.error('Error initializing Firestore service:', error);
    }
  }

  /**
   * Check if Firestore is available
   */
  isAvailable(): boolean {
    return this.isInitialized && !!this.firestore;
  }

  /**
   * Get document by ID
   */
  async getDocument<T = any>(
    collectionName: FirestoreCollection | string,
    docId: string
  ): Promise<T | null> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return null;
    }

    try {
      const docRef = doc(this.firestore, collectionName, docId);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return null;
      }

      return {
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as T;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      return null;
    }
  }

  /**
   * Get all documents in collection
   */
  async getCollection<T = any>(
    collectionName: FirestoreCollection | string,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return { docs: [], count: 0 };
    }

    try {
      const constraints: QueryConstraint[] = options?.constraints || [];

      if (options?.orderByField) {
        constraints.push(orderBy(options.orderByField, options?.orderByDirection || 'asc'));
      }

      // Note: Firebase Firestore doesn't support offset directly
      // Use pagination with startAt/endAt and the last document instead

      if (options?.limitCount) {
        constraints.push(limit(options.limitCount));
      }

      const q = query(collection(this.firestore, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      return {
        docs,
        count: querySnapshot.size,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] as any,
      };
    } catch (error) {
      console.error(`Error getting collection ${collectionName}:`, error);
      return { docs: [], count: 0 };
    }
  }

  /**
   * Query documents with constraints
   */
  async queryDocuments<T = any>(
    collectionName: FirestoreCollection | string,
    constraints: QueryConstraint[]
  ): Promise<T[]> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return [];
    }

    try {
      const q = query(collection(this.firestore, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Create document with auto-generated ID
   */
  async createDocument(
    collectionName: FirestoreCollection | string,
    data: any
  ): Promise<string | null> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return null;
    }

    try {
      const dataWithTimestamp = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(this.firestore, collectionName), dataWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      return null;
    }
  }

  /**
   * Set document (create or overwrite)
   */
  async setDocument(
    collectionName: FirestoreCollection | string,
    docId: string,
    data: any,
    merge = true
  ): Promise<boolean> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return false;
    }

    try {
      const dataWithTimestamp = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      if (!merge) {
        dataWithTimestamp.createdAt = serverTimestamp();
      }

      const docRef = doc(this.firestore, collectionName, docId);
      await setDoc(docRef, dataWithTimestamp, { merge });
      return true;
    } catch (error) {
      console.error(`Error setting document in ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Update document
   */
  async updateDocument(
    collectionName: FirestoreCollection | string,
    docId: string,
    data: any
  ): Promise<boolean> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return false;
    }

    try {
      const dataWithTimestamp = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      const docRef = doc(this.firestore, collectionName, docId);
      await updateDoc(docRef, dataWithTimestamp);
      return true;
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(
    collectionName: FirestoreCollection | string,
    docId: string
  ): Promise<boolean> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return false;
    }

    try {
      const docRef = doc(this.firestore, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document in ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Increment field value
   */
  async incrementField(
    collectionName: FirestoreCollection | string,
    docId: string,
    fieldName: string,
    incrementValue: number = 1
  ): Promise<boolean> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return false;
    }

    try {
      const docRef = doc(this.firestore, collectionName, docId);
      await updateDoc(docRef, {
        [fieldName]: increment(incrementValue),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error(`Error incrementing field in ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Add element to array field
   */
  async addToArray(
    collectionName: FirestoreCollection | string,
    docId: string,
    fieldName: string,
    value: any
  ): Promise<boolean> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return false;
    }

    try {
      const docRef = doc(this.firestore, collectionName, docId);
      await updateDoc(docRef, {
        [fieldName]: arrayUnion(value),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error(`Error adding to array in ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Remove element from array field
   */
  async removeFromArray(
    collectionName: FirestoreCollection | string,
    docId: string,
    fieldName: string,
    value: any
  ): Promise<boolean> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return false;
    }

    try {
      const docRef = doc(this.firestore, collectionName, docId);
      await updateDoc(docRef, {
        [fieldName]: arrayRemove(value),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error(`Error removing from array in ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Batch write operations
   */
  async batch(operations: BatchOperation[]): Promise<boolean> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return false;
    }

    try {
      const writeBatch_ = writeBatch(this.firestore);

      operations.forEach((op) => {
        const docRef = doc(this.firestore!, op.collection, op.docId);

        switch (op.type) {
          case 'set':
            writeBatch_.set(docRef, {
              ...op.data,
              updatedAt: serverTimestamp(),
            });
            break;
          case 'update':
            writeBatch_.update(docRef, {
              ...op.data,
              updatedAt: serverTimestamp(),
            });
            break;
          case 'delete':
            writeBatch_.delete(docRef);
            break;
        }
      });

      await writeBatch_.commit();
      return true;
    } catch (error) {
      console.error('Error in batch operation:', error);
      return false;
    }
  }

  /**
   * Run transaction
   */
  async transaction<T>(
    callback: (transaction: any) => Promise<T>
  ): Promise<T | null> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return null;
    }

    try {
      return await runTransaction(this.firestore, callback);
    } catch (error) {
      console.error('Error in transaction:', error);
      return null;
    }
  }

  /**
   * Listen to document changes (real-time)
   */
  onDocumentChange<T = any>(
    collectionName: FirestoreCollection | string,
    docId: string,
    callback: (doc: T | null) => void,
    listenerId?: string
  ): Unsubscribe {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return () => {};
    }

    try {
      const docRef = doc(this.firestore, collectionName, docId);
      const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
        if (!docSnapshot.exists()) {
          callback(null);
          return;
        }

        const data = {
          id: docSnapshot.id,
          ...docSnapshot.data(),
        } as T;

        callback(data);
      });

      if (listenerId) {
        this.listeners.set(listenerId, unsubscribe);
      }

      return unsubscribe;
    } catch (error) {
      console.error(`Error listening to document ${docId}:`, error);
      return () => {};
    }
  }

  /**
   * Listen to collection changes (real-time)
   */
  onCollectionChange<T = any>(
    collectionName: FirestoreCollection | string,
    callback: (docs: T[]) => void,
    constraints?: QueryConstraint[],
    listenerId?: string
  ): Unsubscribe {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return () => {};
    }

    try {
      const q = query(collection(this.firestore, collectionName), ...(constraints || []));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];

        callback(docs);
      });

      if (listenerId) {
        this.listeners.set(listenerId, unsubscribe);
      }

      return unsubscribe;
    } catch (error) {
      console.error(`Error listening to collection ${collectionName}:`, error);
      return () => {};
    }
  }

  /**
   * Unsubscribe from listener by ID
   */
  unsubscribeListener(listenerId: string): void {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  /**
   * Get document count
   */
  async getDocumentCount(
    collectionName: FirestoreCollection | string,
    constraints?: QueryConstraint[]
  ): Promise<number> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return 0;
    }

    try {
      const q = query(collection(this.firestore, collectionName), ...(constraints || []));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error(`Error getting document count for ${collectionName}:`, error);
      return 0;
    }
  }

  /**
   * Check if document exists
   */
  async documentExists(
    collectionName: FirestoreCollection | string,
    docId: string
  ): Promise<boolean> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return false;
    }

    try {
      const docRef = doc(this.firestore, collectionName, docId);
      const docSnapshot = await getDoc(docRef);
      return docSnapshot.exists();
    } catch (error) {
      console.error(`Error checking document existence:`, error);
      return false;
    }
  }

  /**
   * Get pagination
   */
  async getPaginatedDocuments<T = any>(
    collectionName: FirestoreCollection | string,
    pageSize: number,
    pageNumber: number,
    constraints?: QueryConstraint[]
  ): Promise<QueryResult<T>> {
    if (!this.firestore) {
      console.warn('Firestore not available');
      return { docs: [], count: 0 };
    }

    try {
      // Firebase Firestore doesn't support offset directly
      // For pagination, use startAt/endAt with the last document from previous page
      const allConstraints = [...(constraints || []), limit(pageSize)];

      const q = query(collection(this.firestore, collectionName), ...allConstraints);
      const querySnapshot = await getDocs(q);

      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      return {
        docs,
        count: querySnapshot.size,
      };
    } catch (error) {
      console.error(`Error getting paginated documents from ${collectionName}:`, error);
      return { docs: [], count: 0 };
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const firestoreService = new FirestoreService();

// ============================================
// EXPORTS
// ============================================

export default firestoreService;
