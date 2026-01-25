# Multi-Step Registration - Quick Reference

## Quick Start for Developers

### How to Use OAuth in Your Component

```typescript
import { supabaseAuthService } from '@/services/supabase/auth';

// Trigger OAuth flow
const handleGoogleLogin = async () => {
  const result = await supabaseAuthService.handleOAuthSignup('google');
  if (result.error) {
    console.error('OAuth failed:', result.error.message);
  }
  // On success: Supabase redirects to /auth/complete-profile
};
```

### How to Complete a Profile

```typescript
import { supabaseAuthService } from '@/services/supabase/auth';

const completeUserProfile = async (userId: string) => {
  const result = await supabaseAuthService.completeProfile({
    userId,
    nom: 'Dupont',
    prenom: 'Jean',
    telephone: '+33612345678',
    // Optional fields:
    adresse: '123 Rue de la Paix',
    ville: 'Paris',
    region: 'Île-de-France',
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  // result.data contains the completed User profile
  return result.data;
};
```

### How to Get OAuth Provider Data

```typescript
import { supabaseAuthService } from '@/services/supabase/auth';

// Call this when user lands on /auth/complete-profile after OAuth
const getProviderInfo = async () => {
  const result = await supabaseAuthService.getOAuthProviderData();
  
  if (result.error) {
    console.error('Failed to get provider data');
    return;
  }

  // result.data contains:
  // {
  //   email: 'user@gmail.com',
  //   nom: 'Dupont',
  //   prenom: 'Jean',
  //   picture: 'https://...',
  //   provider: 'google'
  // }
  
  return result.data;
};
```

## Routes Reference

| Path | Component | Purpose |
|------|-----------|---------|
| `/auth/register` | `RegisterPage` | Initial signup (manual or OAuth) |
| `/auth/login` | `LoginPage` | User login |
| `/auth/complete-profile` | `CompleteProfilePage` | Profile completion after signup |
| `/auth/verify-email` | `VerifyEmailPage` | Email verification (manual signup) |
| `/auth/forgot-password` | `ForgotPasswordPage` | Password reset request |

## API Reference

### `handleOAuthSignup(provider)`
- **Parameters**: `'google' | 'facebook' | 'github'`
- **Returns**: `Promise<AuthResult<void>>`
- **Behavior**: Initiates OAuth flow, redirects to provider login
- **On Success**: Supabase handles callback, redirects to `/auth/complete-profile`

### `completeProfile(data)`
- **Parameters**:
  ```typescript
  {
    userId: string;              // Required: Supabase auth user ID
    nom: string;                 // Required: Last name
    prenom: string;              // Required: First name
    telephone?: string;          // Optional: Phone number
    adresse?: string;            // Optional: Street address
    ville?: string;              // Optional: City
    region?: string;             // Optional: Region
    date_naissance?: string;     // Optional: Birth date (YYYY-MM-DD)
    type_compte?: string;        // Optional: Account type
    organisation_id?: string;    // Optional: Organization ID
  }
  ```
- **Returns**: `Promise<AuthResult<User>>`
- **Behavior**: Creates/updates utilisateur table entry via RPC
- **On Success**: Returns completed User profile
- **On Error**: Returns error details

### `getOAuthProviderData()`
- **Parameters**: None
- **Returns**: `Promise<AuthResult<OAuthData>>`
- **Returns Data**:
  ```typescript
  {
    email: string;
    nom: string;
    prenom: string;
    picture: string;
    provider: string;
  }
  ```

## State Shape for Navigation

When navigating to `/auth/complete-profile`, pass state:

```typescript
// For manual signup after email confirmation
navigate('/auth/complete-profile', {
  state: {
    email: 'user@example.com',
    isFromOAuth: false
  }
});

// For OAuth signup (handled automatically)
// Supabase redirects with session containing user data
```

## Component Integration

### RegisterPage OAuth Button Handler
```typescript
const handleOAuthSignup = async (provider: 'google' | 'facebook') => {
  setIsLoading(true);
  try {
    const result = await supabaseAuthService.handleOAuthSignup(provider);
    if (result.error) throw new Error(result.error.message);
    // Supabase handles redirect
  } catch (error) {
    setErrors({ general: error.message });
  } finally {
    setIsLoading(false);
  }
};
```

### CompleteProfilePage Session Handling
```typescript
// Get current user session
const { data: { session } } = await supabase.auth.getSession();
if (session?.user) {
  const userId = session.user.id;
  const email = session.user.email;
  
  // Pre-fill from OAuth metadata if available
  const fullName = session.user.user_metadata?.full_name;
}
```

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `OAUTH_ERROR` | OAuth provider error | Show user-friendly error, retry |
| `OAUTH_EXCEPTION` | Network/runtime error during OAuth | Check network, retry |
| `PROFILE_COMPLETION_ERROR` | RPC function failed | Check database, retry |
| `SESSION_ERROR` | No active session found | Redirect to login |
| `OAUTH_DATA_EXCEPTION` | Failed to extract provider data | Refresh page, retry |

## Common Implementation Patterns

### Pattern 1: OAuth Login After Registration
```typescript
// User clicks "Sign up with Google" on RegisterPage
// → handleOAuthSignup('google') called
// → Redirects to OAuth provider
// → OAuth provider authenticates user
// → Supabase callback redirects to /auth/complete-profile
// → CompleteProfilePage pre-fills with provider data
// → User submits → completeProfile() called
// → Profile created → Redirect to /auth/login
```

### Pattern 2: Manual Signup with Email Verification
```typescript
// User fills form and clicks "Create account" on RegisterPage
// → registerThunk() called
// → Supabase creates auth user
// → Confirmation email sent
// → User clicks link in email
// → Supabase redirects to /auth/complete-profile with email in state
// → CompleteProfilePage shows with email pre-filled
// → User fills nom/prenom/telephone
// → completeProfile() called
// → Redirect to /auth/login
```

### Pattern 3: Already Have OAuth Account, Need to Complete Profile
```typescript
// User signs in with OAuth, session exists but profile incomplete
// Redirect with:
navigate('/auth/complete-profile', {
  state: {
    email: session.user.email,
    nom: extractedNom,
    prenom: extractedPrenom,
    isFromOAuth: true,
    oauthProvider: 'google'
  }
});
```

## Testing Guide

### Test OAuth Flow
```bash
1. Go to /auth/register
2. Click "Google" button
3. Sign in with test Google account
4. Should redirect to /auth/complete-profile
5. Form should have email and name pre-filled
6. Modify and submit
7. Should redirect to /auth/login
8. Can now login with email or Google
```

### Test Manual Signup
```bash
1. Go to /auth/register
2. Fill form with email/password/name
3. Click "Create account"
4. Should redirect to /auth/verify-email
5. Check email for confirmation link
6. Click confirmation link
7. Should redirect to /auth/complete-profile
8. Email should be pre-filled but name empty
9. Fill nom/prenom/telephone
10. Should redirect to /auth/login
11. Can now login with email/password
```

## Troubleshooting

### OAuth Not Redirecting to Complete Profile
- [ ] Check Supabase redirect URL configuration
- [ ] Verify OAuth provider is enabled in Supabase console
- [ ] Check browser console for redirect errors
- [ ] Clear browser cache and try again

### Profile Completion Fails
- [ ] Check network tab for RPC error details
- [ ] Verify `create_user_profile` RPC function exists
- [ ] Ensure user is authenticated (session exists)
- [ ] Check database constraints (nom, prenom required)

### Pre-filled Data Not Showing
- [ ] Check session data: `session.user.user_metadata`
- [ ] Verify provider returns full_name or name field
- [ ] Check CompleteProfilePage useEffect dependencies

### Can't Login After Profile Completion
- [ ] Verify utilisateur table has entry for user ID
- [ ] Check that session is still valid
- [ ] Try clearing localStorage and refreshing
- [ ] Check authentication error in browser console

## Database Requirements

### Utilisateur Table Constraints
```sql
ALTER TABLE utilisateur 
  ADD CONSTRAINT check_nom_notnull CHECK (nom IS NOT NULL),
  ADD CONSTRAINT check_prenom_notnull CHECK (prenom IS NOT NULL);
```

### RPC Function Signature (Required)
```sql
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_nom TEXT,
  p_prenom TEXT,
  p_type_compte TEXT DEFAULT 'grand_public',
  p_telephone TEXT DEFAULT NULL,
  p_adresse TEXT DEFAULT NULL,
  p_ville TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_date_naissance DATE DEFAULT NULL,
  p_organisation_id UUID DEFAULT NULL
) RETURNS utilisateur
AS $$
-- Implementation here
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Performance Notes

- OAuth flow: ~1-2 seconds (depends on provider)
- Email confirmation: Instant redirect to complete-profile
- Profile completion: ~100-500ms (RPC call)
- Total signup time: 1-3 minutes (includes user email confirmation)

---

**Last Updated**: Phase 13
**Status**: Production Ready ✅
