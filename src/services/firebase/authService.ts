/**
 * =====================================================
 * RETROUVONSLES - Firebase Authentication Service
 * =====================================================
 * User authentication and account management
 */

import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  User,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  confirmPasswordReset,
  signInAnonymously,
  applyActionCode,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { getFirebaseServices } from './firebaseConfig';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  photoURL?: string;
}

export interface SignInData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt?: Date;
  lastSignIn?: Date;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export interface AuthError {
  code: string;
  message: string;
  customMessage?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: AuthError;
}

export interface PasswordResetResult {
  success: boolean;
  error?: AuthError;
}

// ============================================
// AUTH SERVICE CLASS
// ============================================

class FirebaseAuthService {
  private auth: Auth | null = null;
  private isInitialized: boolean = false;
  private currentUser: User | null = null;
  private authStateChangeListeners: Array<(user: User | null) => void> = [];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize auth service
   */
  private initialize(): void {
    try {
      const services = getFirebaseServices();
      this.auth = services.auth;
      this.isInitialized = !!this.auth;

      if (this.isInitialized && this.auth) {
        // Set persistence
        setPersistence(this.auth, browserLocalPersistence).catch((error) => {
          console.warn('Error setting persistence:', error);
        });

        // Setup auth state listener
        this.setupAuthStateListener();
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }

  /**
   * Setup auth state change listener
   */
  private setupAuthStateListener(): void {
    if (!this.auth) return;

    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      this.authStateChangeListeners.forEach((callback) => {
        try {
          callback(user);
        } catch (error) {
          console.error('Error in auth state change callback:', error);
        }
      });
    });
  }

  /**
   * Register auth state change listener
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateChangeListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.authStateChangeListeners = this.authStateChangeListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser || (this.auth?.currentUser || null);
  }

  /**
   * Get current user profile
   */
  getCurrentUserProfile(): UserProfile | null {
    const user = this.getCurrentUser();
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      metadata: {
        creationTime: user.metadata?.creationTime,
        lastSignInTime: user.metadata?.lastSignInTime,
      },
    };
  }

  /**
   * Sign up with email and password
   */
  async signUp(data: SignUpData): Promise<AuthResult> {
    if (!this.auth) {
      return {
        success: false,
        error: {
          code: 'auth/not-initialized',
          message: 'Auth service not initialized',
        },
      };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        data.email,
        data.password
      );

      // Update profile with display name and photo URL
      if (data.displayName || data.firstName || data.lastName) {
        const displayName = data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
        await updateProfile(userCredential.user, {
          displayName: displayName || undefined,
          photoURL: data.photoURL || undefined,
        });
      }

      return {
        success: true,
        user: userCredential.user,
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<AuthResult> {
    if (!this.auth) {
      return {
        success: false,
        error: {
          code: 'auth/not-initialized',
          message: 'Auth service not initialized',
        },
      };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        data.email,
        data.password
      );

      return {
        success: true,
        user: userCredential.user,
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Sign in anonymously
   */
  async signInAnonymously(): Promise<AuthResult> {
    if (!this.auth) {
      return {
        success: false,
        error: {
          code: 'auth/not-initialized',
          message: 'Auth service not initialized',
        },
      };
    }

    try {
      const userCredential = await signInAnonymously(this.auth);
      return {
        success: true,
        user: userCredential.user,
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<AuthResult> {
    if (!this.auth) {
      return {
        success: false,
        error: {
          code: 'auth/not-initialized',
          message: 'Auth service not initialized',
        },
      };
    }

    try {
      await signOut(this.auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<PasswordResetResult> {
    if (!this.auth) {
      return {
        success: false,
        error: {
          code: 'auth/not-initialized',
          message: 'Auth service not initialized',
        },
      };
    }

    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(oobCode: string, newPassword: string): Promise<PasswordResetResult> {
    if (!this.auth) {
      return {
        success: false,
        error: {
          code: 'auth/not-initialized',
          message: 'Auth service not initialized',
        },
      };
    }

    try {
      await confirmPasswordReset(this.auth, oobCode, newPassword);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Verify password reset code
   */
  async verifyPasswordResetCode(oobCode: string): Promise<string | null> {
    if (!this.auth) {
      return null;
    }

    try {
      const email = await verifyPasswordResetCode(this.auth, oobCode);
      return email;
    } catch (error) {
      console.error('Error verifying password reset code:', error);
      return null;
    }
  }

  /**
   * Update profile
   */
  async updateUserProfile(data: {
    displayName?: string;
    photoURL?: string;
  }): Promise<AuthResult> {
    const user = this.getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: {
          code: 'auth/no-current-user',
          message: 'No current user',
        },
      };
    }

    try {
      await updateProfile(user, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });

      // Refresh user
      await user.reload();

      return {
        success: true,
        user: user,
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Update email
   */
  async updateUserEmail(newEmail: string): Promise<AuthResult> {
    const user = this.getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: {
          code: 'auth/no-current-user',
          message: 'No current user',
        },
      };
    }

    try {
      await updateEmail(user, newEmail);
      await user.reload();

      return {
        success: true,
        user: user,
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Update password
   */
  async updateUserPassword(newPassword: string): Promise<AuthResult> {
    const user = this.getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: {
          code: 'auth/no-current-user',
          message: 'No current user',
        },
      };
    }

    try {
      await updatePassword(user, newPassword);
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<AuthResult> {
    const user = this.getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: {
          code: 'auth/no-current-user',
          message: 'No current user',
        },
      };
    }

    try {
      await sendEmailVerification(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Verify email with action code
   */
  async verifyEmailWithCode(actionCode: string): Promise<AuthResult> {
    if (!this.auth) {
      return {
        success: false,
        error: {
          code: 'auth/not-initialized',
          message: 'Auth service not initialized',
        },
      };
    }

    try {
      await applyActionCode(this.auth, actionCode);

      // Refresh user to get updated state
      const user = this.getCurrentUser();
      if (user) {
        await user.reload();
      }

      return {
        success: true,
        user: user || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error),
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  /**
   * Check if user email is verified
   */
  isEmailVerified(): boolean {
    const user = this.getCurrentUser();
    return user?.emailVerified || false;
  }

  /**
   * Check if user is anonymous
   */
  isAnonymous(): boolean {
    const user = this.getCurrentUser();
    return user?.isAnonymous || false;
  }

  /**
   * Get user ID token
   */
  async getUserIdToken(forceRefresh = false): Promise<string | null> {
    const user = this.getCurrentUser();
    if (!user) return null;

    try {
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Handle Firebase auth errors
   */
  private handleAuthError(error: any): AuthError {
    const code = error.code || 'unknown-error';
    let customMessage = '';

    switch (code) {
      case 'auth/email-already-in-use':
        customMessage = 'This email is already registered';
        break;
      case 'auth/invalid-email':
        customMessage = 'Invalid email format';
        break;
      case 'auth/weak-password':
        customMessage = 'Password is too weak (minimum 6 characters)';
        break;
      case 'auth/user-not-found':
        customMessage = 'User not found';
        break;
      case 'auth/wrong-password':
        customMessage = 'Invalid password';
        break;
      case 'auth/too-many-requests':
        customMessage = 'Too many login attempts. Please try again later';
        break;
      case 'auth/operation-not-allowed':
        customMessage = 'This operation is not allowed';
        break;
      case 'auth/account-exists-with-different-credential':
        customMessage = 'An account already exists with this email';
        break;
      default:
        customMessage = error.message || 'An authentication error occurred';
    }

    return {
      code,
      message: error.message || 'Unknown error',
      customMessage,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const firebaseAuthService = new FirebaseAuthService();

// ============================================
// EXPORTS
// ============================================

export default firebaseAuthService;
