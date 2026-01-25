# Multi-Step Registration Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RETROUVONSLES Frontend                           │
│                     Multi-Step Registration System                      │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                         UI Layer (React Components)                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐   │
│  │  RegisterPage   │    │ LoginPage       │    │ VerifyEmailPage  │   │
│  │                 │    │                 │    │                  │   │
│  │ • Email input   │    │ • Email/Pass    │    │ • Email display  │   │
│  │ • Password      │    │   login         │    │ • Resend option  │   │
│  │ • Full name     │    │ • OAuth buttons │    │ • Verify status  │   │
│  │ • Phone         │    │                 │    │                  │   │
│  │ • Submit        │    │                 │    │                  │   │
│  │ • OAuth buttons │    │                 │    │                  │   │
│  └────────┬────────┘    └────────┬────────┘    └────────┬─────────┘   │
│           │                      │                       │              │
│           │ manual signup        │ login redirect        │ email verify │
│           │ or OAuth redirect    │                       │ redirect     │
│           │                      │                       │              │
│  ┌────────▼────────────────────────────────────────────────────────┐   │
│  │        CompleteProfilePage (NEW)                               │   │
│  │                                                                  │   │
│  │ • Email field (read-only, pre-filled)                          │   │
│  │ • Nom field (required, pre-filled if OAuth)                    │   │
│  │ • Prenom field (required, pre-filled if OAuth)                 │   │
│  │ • Telephone field (optional)                                   │   │
│  │ • Form validation                                              │   │
│  │ • Success state with auto-redirect                             │   │
│  └──────────────────┬──────────────────────────────────────────────┘   │
│                     │                                                    │
│                     │ profile completed                                 │
│                     ▼                                                    │
│  ┌─────────────────────────────────────┐                              │
│  │    Redirect to /auth/login          │                              │
│  └─────────────────────────────────────┘                              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     Service Layer (Business Logic)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │        supabaseAuthService (Auth Service)               │           │
│  ├─────────────────────────────────────────────────────────┤           │
│  │                                                         │           │
│  │ register(data)                                          │           │
│  │ ├─ Create Supabase auth account                        │           │
│  │ ├─ Call RPC create_user_profile                        │           │
│  │ └─ Return user + session                               │           │
│  │                                                         │           │
│  │ login(credentials)                                      │           │
│  │ ├─ Sign in with email/password                         │           │
│  │ ├─ Retrieve full user profile                          │           │
│  │ └─ Return user + session                               │           │
│  │                                                         │           │
│  │ handleOAuthSignup(provider) ←─── NEW                   │           │
│  │ ├─ Call supabase.auth.signInWithOAuth()                │           │
│  │ ├─ Redirect to provider login                          │           │
│  │ └─ Supabase handles callback                           │           │
│  │                                                         │           │
│  │ completeProfile(data) ←─── NEW                         │           │
│  │ ├─ Validate required fields                            │           │
│  │ ├─ Call RPC create_user_profile                        │           │
│  │ ├─ Retrieve updated profile                            │           │
│  │ └─ Return completed User                               │           │
│  │                                                         │           │
│  │ getOAuthProviderData() ←─── NEW                        │           │
│  │ ├─ Get current session from Supabase                   │           │
│  │ ├─ Extract user_metadata from OAuth                    │           │
│  │ ├─ Parse full_name into nom/prenom                     │           │
│  │ └─ Return provider data                                │           │
│  │                                                         │           │
│  │ logout()                                                │           │
│  │ ├─ Sign out from Supabase                              │           │
│  │ └─ Clear session                                       │           │
│  │                                                         │           │
│  │ requestPasswordReset(email)                             │           │
│  │ resendVerificationEmail(email)                          │           │
│  │ resetPassword(token, password)                          │           │
│  │ getCurrentSession()                                     │           │
│  │                                                         │           │
│  └─────────────────────────────────────────────────────────┘           │
│                         │                  │                           │
│              Calls Supabase API              │                           │
│                                              │                           │
└──────────────────────────┬───────────────────┼──────────────────────────┘
                           │                   │
                           ▼                   ▼
         ┌─────────────────────────────────────────────┐
         │     Supabase Platform (Backend)              │
         ├─────────────────────────────────────────────┤
         │                                             │
         │ ┌───────────────────────────────────────┐   │
         │ │  Supabase Auth                        │   │
         │ ├───────────────────────────────────────┤   │
         │ │ • Email/Password authentication       │   │
         │ │ • OAuth provider integration:         │   │
         │ │   - Google OAuth 2.0                  │   │
         │ │   - Facebook OAuth 2.0                │   │
         │ │   - GitHub (optional)                 │   │
         │ │ • Session management                  │   │
         │ │ • Email verification                  │   │
         │ │ • Password reset                      │   │
         │ └───────────────────────────────────────┘   │
         │                                             │
         │ ┌───────────────────────────────────────┐   │
         │ │  PostgreSQL Database                  │   │
         │ ├───────────────────────────────────────┤   │
         │ │                                       │   │
         │ │  auth.users                           │   │
         │ │  ├─ id (UUID)                         │   │
         │ │  ├─ email                             │   │
         │ │  ├─ encrypted_password                │   │
         │ │  ├─ email_confirmed_at                │   │
         │ │  ├─ user_metadata {                   │   │
         │ │  │   full_name, picture, provider     │   │
         │ │  │ }                                  │   │
         │ │  └─ app_metadata { provider }         │   │
         │ │                                       │   │
         │ │  utilisateur (Public Table)           │   │
         │ │  ├─ id (UUID, FK auth.users.id)       │   │
         │ │  ├─ email                             │   │
         │ │  ├─ nom (NOT NULL)                    │   │
         │ │  ├─ prenom (NOT NULL)                 │   │
         │ │  ├─ telephone (optional)              │   │
         │ │  ├─ adresse (optional)                │   │
         │ │  ├─ ville (optional)                  │   │
         │ │  ├─ region (optional)                 │   │
         │ │  ├─ date_naissance (optional)         │   │
         │ │  ├─ photo_profil (optional)           │   │
         │ │  ├─ statut_compte                     │   │
         │ │  ├─ type_compte                       │   │
         │ │  └─ created_at                        │   │
         │ │                                       │   │
         │ │  utilisateur_role                     │   │
         │ │  ├─ id_utilisateur (FK)               │   │
         │ │  ├─ id_role (FK)                      │   │
         │ │  └─ created_at                        │   │
         │ │                                       │   │
         │ └───────────────────────────────────────┘   │
         │                                             │
         │ ┌───────────────────────────────────────┐   │
         │ │  RPC Functions                        │   │
         │ ├───────────────────────────────────────┤   │
         │ │                                       │   │
         │ │ create_user_profile(                  │   │
         │ │   p_user_id UUID,                     │   │
         │ │   p_email TEXT,                       │   │
         │ │   p_nom TEXT,                         │   │
         │ │   p_prenom TEXT,                      │   │
         │ │   p_type_compte TEXT,                 │   │
         │ │   p_telephone TEXT,                   │   │
         │ │   p_adresse TEXT,                     │   │
         │ │   p_ville TEXT,                       │   │
         │ │   p_region TEXT,                      │   │
         │ │   p_date_naissance DATE,              │   │
         │ │   p_organisation_id UUID              │   │
         │ │ )                                     │   │
         │ │                                       │   │
         │ │ Returns: utilisateur record           │   │
         │ │                                       │   │
         │ └───────────────────────────────────────┘   │
         │                                             │
         └─────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Manual Signup Flow
```
User Registration Sequence:
───────────────────────────

┌──────────────┐
│ User visits  │
│ /auth/register
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ RegisterPage             │
│ ├─ Email input           │
│ ├─ Password input        │
│ ├─ Name input            │
│ └─ Phone input (optional)│
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ User clicks              │
│ "Create account"         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ handleRegister()                 │
│ ├─ Validate form                 │
│ ├─ dispatch(registerThunk())     │
│ └─ registerThunk({...})          │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ supabaseAuthService.register()   │
│ ├─ auth.signUp()                 │
│ │  └─ Create auth account        │
│ ├─ Call RPC create_user_profile()│
│ │  └─ Create utilisateur entry   │
│ └─ Return user + session         │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Supabase Backend         │
│ ├─ Create auth.users     │
│ ├─ Create utilisateur    │
│ ├─ Send confirm email    │
│ └─ Return user record    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Navigate to              │
│ /auth/verify-email       │
│ state: { email }         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ User checks email        │
│ Clicks confirmation link │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Supabase callback        │
│ ├─ Verify token         │
│ ├─ Mark email confirmed │
│ ├─ Create session       │
│ └─ Redirect to          │
│   /auth/complete-profile│
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ CompleteProfilePage              │
│ ├─ Get session                   │
│ ├─ Pre-fill email (read-only)    │
│ ├─ Show empty nom/prenom         │
│ ├─ Optional telephone field      │
│ └─ Form ready for input          │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ User fills form          │
│ ├─ Enter nom             │
│ ├─ Enter prenom          │
│ ├─ Optionally phone      │
│ └─ Click Submit          │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ handleComplete()         │
│ ├─ Validate fields       │
│ ├─ completeProfile()     │
│ └─ Call RPC              │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Supabase RPC             │
│ ├─ Update utilisateur    │
│ ├─ Set nom/prenom        │
│ ├─ Set telephone         │
│ └─ Return record         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Success state            │
│ ├─ Show checkmark        │
│ ├─ Confirmation message  │
│ ├─ 2 second timer        │
│ └─ Auto-redirect         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Navigate to              │
│ /auth/login              │
│ Account ready for login  │
└──────────────────────────┘
```

### OAuth Signup Flow
```
OAuth Registration Sequence:
────────────────────────────

┌──────────────┐
│ User visits  │
│ /auth/register
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ RegisterPage             │
│ ├─ OAuth buttons visible │
│ └─ Manual form also shown│
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ User clicks              │
│ "Sign up with Google"    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ handleOAuthSignup()      │
│ └─ 'google' parameter    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ supabaseAuthService                  │
│   .handleOAuthSignup('google')        │
│ └─ auth.signInWithOAuth({             │
│     provider: 'google',               │
│     redirectTo: '/auth/complete-profile'
│   })                                  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Supabase OAuth Handler           │
│ ├─ Generate OAuth request        │
│ └─ Redirect to Google login      │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Google OAuth Provider    │
│ ├─ User consent screen   │
│ ├─ User authentication   │
│ └─ Authorization grant   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Google callback to       │
│ Supabase OAuth endpoint  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Supabase                         │
│ ├─ Verify OAuth token           │
│ ├─ Create/update auth.users     │
│ │  with provider data:          │
│ │  - email                      │
│ │  - full_name (in metadata)    │
│ │  - picture (in metadata)      │
│ │  - provider (google)          │
│ ├─ Generate session             │
│ ├─ Create utilisateur entry     │
│ │  (optional, depends on RPC)   │
│ └─ Redirect to redirect_to URL  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Browser redirect to      │
│ /auth/complete-profile   │
│ ✓ Session set as cookie  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ CompleteProfilePage                  │
│ ├─ useEffect: Get session            │
│ │  ├─ getSession() from Supabase     │
│ │  └─ session.user.id found          │
│ ├─ useEffect: Get provider data      │
│ │  ├─ session.user.email             │
│ │  ├─ session.user_metadata:         │
│ │  │  ├─ full_name: "Jean Dupont"   │
│ │  │  └─ picture: "url/to/pic"      │
│ │  └─ Parse full_name → nom/prenom  │
│ ├─ Pre-fill form                     │
│ │  ├─ email: user@gmail.com          │
│ │  ├─ prenom: Jean                   │
│ │  ├─ nom: Dupont                    │
│ │  └─ picture: (optional display)    │
│ └─ Form ready, user can edit         │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ User reviews form        │
│ ├─ Can edit any field    │
│ ├─ Email is read-only    │
│ └─ Click Submit          │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ handleComplete()         │
│ ├─ Validate fields       │
│ ├─ Get userId from       │
│ │  session               │
│ ├─ completeProfile({     │
│ │   userId,              │
│ │   nom,                 │
│ │   prenom,              │
│ │   telephone            │
│ │ })                     │
│ └─ Call RPC              │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Supabase RPC                         │
│ └─ create_user_profile({             │
│     p_user_id: UUID,                 │
│     p_nom: string,                   │
│     p_prenom: string,                │
│     p_telephone: string,             │
│     ...                              │
│   })                                 │
├─ Update utilisateur record          │
└─ Return updated record              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Success state            │
│ ├─ Show checkmark        │
│ ├─ Confirmation message  │
│ ├─ 2 second timer        │
│ └─ Auto-redirect         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Navigate to              │
│ /auth/login              │
│ Account ready for login  │
│ ✓ Can login with Google  │
│ ✓ Or email password      │
└──────────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    React Router                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  /auth/register ──────────┐                            │
│                           │                            │
│                           ▼                            │
│                  ┌──────────────────┐                  │
│                  │ RegisterPage     │                  │
│                  │ ├─ Manual signup │                  │
│                  │ ├─ OAuth buttons │                  │
│                  │ └─ Validation    │                  │
│                  └─────┬────────┬───┘                  │
│                        │        │                      │
│        Manual signup   │        │ OAuth signup         │
│                        │        │                      │
│                        ▼        ▼                      │
│         registerThunk()     handleOAuthSignup()       │
│                │                    │                 │
│                └────────┬───────────┘                 │
│                         ▼                             │
│           ┌─────────────────────────┐                │
│           │ supabaseAuthService     │                │
│           │ ├─ register()           │                │
│           │ ├─ handleOAuthSignup()  │                │
│           │ ├─ completeProfile()    │                │
│           │ └─ getOAuthProviderData │                │
│           └────────────┬────────────┘                │
│                        │                             │
│                        ▼                             │
│        ┌───────────────────────────────┐            │
│        │ Supabase Auth & Database      │            │
│        │ ├─ auth.signUp()              │            │
│        │ ├─ auth.signInWithOAuth()     │            │
│        │ ├─ RPC: create_user_profile() │            │
│        │ └─ Session management        │            │
│        └────────────┬────────────────┘             │
│                     │                              │
│    Manual: Email confirmation link                │
│    OAuth: Redirect back to app                    │
│                     │                              │
│                     ▼                              │
│    /auth/complete-profile ─────────────┐         │
│                                        │         │
│                                        ▼         │
│                       ┌────────────────────────┐ │
│                       │ CompleteProfilePage    │ │
│                       │ ├─ Pre-fill from state │ │
│                       │ ├─ Get session         │ │
│                       │ ├─ Form validation     │ │
│                       │ └─ Submit handler      │ │
│                       └─────────┬──────────────┘ │
│                                 │                │
│                                 ▼                │
│                      handleComplete()            │
│                             │                   │
│                             ▼                   │
│            completeProfile({userId, ...})      │
│                             │                   │
│                             ▼                   │
│              Supabase RPC: create_user_profile()│
│                             │                   │
│                             ▼                   │
│                    Profile created              │
│                             │                   │
│                             ▼                   │
│           Navigate to /auth/login                │
│           (Ready for login with credentials)    │
│                                                 │
└─────────────────────────────────────────────────┘
```

## State Management

### Redux Store Structure (Auth Slice)
```typescript
{
  auth: {
    user: {
      id: string;
      email: string;
      nom: string;
      prenom: string;
      role: NomRole;
      type_compte: TypeCompte;
      statut_compte: StatutCompte;
      // ... other fields
    } | null;
    
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    } | null;
    
    loading: boolean;
    error: {
      code: string;
      message: string;
    } | null;
  }
}
```

### Local Component State (CompleteProfilePage)
```typescript
{
  userId: string | null;           // From session
  profileData: {
    email: string;                 // From session/state
    nom: string;                   // User input
    prenom: string;                // User input
    telephone?: string;            // User input
    isFromOAuth: boolean;          // From location.state
    oauthProvider?: string;        // From location.state
  };
  isLoading: boolean;
  errors: {
    nom?: string;
    prenom?: string;
    telephone?: string;
    general?: string;
  };
  completedStep: boolean;
}
```

---

**Architecture Last Updated**: Phase 13
**Status**: Production Ready ✅
