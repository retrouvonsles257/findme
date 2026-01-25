/**
 * =====================================================
 * RETROUVONSLES - Auth Validation Utilities
 * Fonctions de validation pour l'authentification
 * =====================================================
 */

/**
 * Résultat de validation d'un formulaire
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  errors?: Record<string, string>;
}

/**
 * Résultat de validation d'un mot de passe
 */
export interface PasswordValidationResult extends ValidationResult {
  score?: number;
  strength?: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  requirements?: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

// ============================================
// EMAIL VALIDATION
// ============================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMMON_INVALID_DOMAINS = ['test.com', 'example.com', 'invalid.com'];

/**
 * Valide un email
 */
export const validateEmail = (email: string | null | undefined): ValidationResult => {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      message: 'Veuillez entrer un email valide',
    };
  }

  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return {
      isValid: false,
      message: 'L\'email est requis',
    };
  }

  if (trimmedEmail.length > 254) {
    return {
      isValid: false,
      message: 'L\'email doit contenir au maximum 254 caractères',
    };
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return {
      isValid: false,
      message: 'Le format de l\'email est invalide',
    };
  }

  const domain = trimmedEmail.split('@')[1]?.toLowerCase();
  if (domain && COMMON_INVALID_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      message: 'Veuillez utiliser une adresse email valide',
    };
  }

  return {
    isValid: true,
    message: 'Email valide',
  };
};

/**
 * Vérifie si un email est au format valide (simpler)
 */
export const isValidEmail = (email: string): boolean => validateEmail(email).isValid;

// ============================================
// PHONE VALIDATION
// ============================================

/**
 * Valide un numéro de téléphone
 */
export const validatePhoneNumber = (phone: string | null | undefined): ValidationResult => {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      message: 'Veuillez entrer un numéro de téléphone valide',
    };
  }

  const cleanPhone = phone.replace(/\D/g, '');

  // Accepte les numéros avec 10-15 chiffres
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return {
      isValid: false,
      message: 'Le numéro de téléphone doit contenir entre 10 et 15 chiffres',
    };
  }

  return {
    isValid: true,
    message: 'Numéro de téléphone valide',
  };
};

/**
 * Vérifie si un numéro de téléphone est valide (simpler)
 */
export const isValidPhoneNumber = (phone: string): boolean =>
  validatePhoneNumber(phone).isValid;

// ============================================
// PASSWORD VALIDATION
// ============================================

/**
 * Valide un mot de passe avec critères de sécurité
 */
export const validatePassword = (password: string | null | undefined): PasswordValidationResult => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Veuillez entrer un mot de passe',
      score: 0,
      strength: 'weak',
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
      },
    };
  }

  const requirements = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[@$!%*?&]/.test(password),
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;

  let score = 0;
  let strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong' = 'weak';

  if (metRequirements === 0) {
    score = 0;
    strength = 'weak';
  } else if (metRequirements <= 2) {
    score = 1;
    strength = 'weak';
  } else if (metRequirements === 3) {
    score = 2;
    strength = 'fair';
  } else if (metRequirements === 4) {
    score = 3;
    strength = 'good';
  } else if (metRequirements === 5) {
    if (password.length >= 16) {
      score = 5;
      strength = 'very-strong';
    } else {
      score = 4;
      strength = 'strong';
    }
  }

  const isValid = metRequirements >= 4 && password.length >= 12;

  return {
    isValid,
    message: isValid
      ? 'Mot de passe sécurisé'
      : 'Le mot de passe ne respecte pas les critères de sécurité',
    score,
    strength,
    requirements,
  };
};

/**
 * Vérifie si un mot de passe est valide (simpler)
 */
export const isValidPassword = (password: string): boolean => validatePassword(password).isValid;

/**
 * Vérifie la force d'un mot de passe
 */
export const checkPasswordStrength = (password: string): PasswordValidationResult =>
  validatePassword(password);

// ============================================
// NAME VALIDATION
// ============================================

/**
 * Valide un prénom ou nom
 */
export const validateName = (
  name: string | null | undefined,
  type: 'first' | 'last' = 'last',
): ValidationResult => {
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      message: type === 'first' ? 'Le prénom est requis' : 'Le nom est requis',
    };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message:
        type === 'first'
          ? 'Le prénom doit contenir au minimum 2 caractères'
          : 'Le nom doit contenir au minimum 2 caractères',
    };
  }

  if (trimmedName.length > 50) {
    return {
      isValid: false,
      message:
        type === 'first'
          ? 'Le prénom doit contenir au maximum 50 caractères'
          : 'Le nom doit contenir au maximum 50 caractères',
    };
  }

  // Vérifie que le nom ne contient que des lettres, espaces et traits d'union
  if (!/^[a-zA-Zàâäæèéêëìîïðòôöœùûüýÿ\s\-']+$/.test(trimmedName)) {
    return {
      isValid: false,
      message: 'Le nom contient des caractères invalides',
    };
  }

  return {
    isValid: true,
    message: 'Nom valide',
  };
};

/**
 * Valide un prénom
 */
export const validateFirstName = (firstName: string): ValidationResult =>
  validateName(firstName, 'first');

/**
 * Valide un nom de famille
 */
export const validateLastName = (lastName: string): ValidationResult =>
  validateName(lastName, 'last');

// ============================================
// FORM VALIDATION
// ============================================

/**
 * Valide un formulaire de connexion
 */
export const validateLoginForm = (data: any): ValidationResult => {
  const errors: Record<string, string> = {};

  // Email
  const emailValidation = validateEmail(data?.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message || 'Email invalide';
  }

  // Password
  if (!data?.password || typeof data.password !== 'string') {
    errors.password = 'Le mot de passe est requis';
  } else if (data.password.length < 6) {
    errors.password = 'Le mot de passe est incorrect';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors: !isValid ? errors : undefined,
    message: isValid ? 'Formulaire valide' : 'Le formulaire contient des erreurs',
  };
};

/**
 * Valide un formulaire d'enregistrement
 */
export const validateRegisterForm = (data: any): ValidationResult => {
  const errors: Record<string, string> = {};

  // Email
  const emailValidation = validateEmail(data?.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message || 'Email invalide';
  }

  // First Name
  const firstNameValidation = validateFirstName(data?.prenom);
  if (!firstNameValidation.isValid) {
    errors.prenom = firstNameValidation.message || 'Prénom invalide';
  }

  // Last Name
  const lastNameValidation = validateLastName(data?.nom);
  if (!lastNameValidation.isValid) {
    errors.nom = lastNameValidation.message || 'Nom invalide';
  }

  // Password
  const passwordValidation = validatePassword(data?.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message || 'Mot de passe faible';
  }

  // Password Confirmation
  if (!data?.confirmPassword || typeof data.confirmPassword !== 'string') {
    errors.confirmPassword = 'Veuillez confirmer votre mot de passe';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas';
  }

  // Terms Agreement
  if (!data?.acceptTerms || data.acceptTerms !== true) {
    errors.acceptTerms = 'Vous devez accepter les conditions d\'utilisation';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors: !isValid ? errors : undefined,
    message: isValid ? 'Formulaire valide' : 'Le formulaire contient des erreurs',
  };
};

/**
 * Valide un formulaire de réinitialisation de mot de passe
 */
export const validatePasswordResetForm = (data: any): ValidationResult => {
  const errors: Record<string, string> = {};

  // Password
  const passwordValidation = validatePassword(data?.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message || 'Mot de passe faible';
  }

  // Password Confirmation
  if (!data?.confirmPassword || typeof data.confirmPassword !== 'string') {
    errors.confirmPassword = 'Veuillez confirmer votre mot de passe';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors: !isValid ? errors : undefined,
    message: isValid ? 'Formulaire valide' : 'Le formulaire contient des erreurs',
  };
};

/**
 * Valide un formulaire de demande d'email
 */
export const validatePasswordRequestForm = (data: any): ValidationResult => {
  const errors: Record<string, string> = {};

  // Email
  const emailValidation = validateEmail(data?.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message || 'Email invalide';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors: !isValid ? errors : undefined,
    message: isValid ? 'Formulaire valide' : 'Le formulaire contient des erreurs',
  };
};

/**
 * Valide un code de vérification d'email
 */
export const validateVerificationCode = (code: string | null | undefined): ValidationResult => {
  if (!code || typeof code !== 'string') {
    return {
      isValid: false,
      message: 'Le code de vérification est requis',
    };
  }

  const trimmedCode = code.trim();

  if (trimmedCode.length !== 6) {
    return {
      isValid: false,
      message: 'Le code doit contenir 6 chiffres',
    };
  }

  if (!/^\d{6}$/.test(trimmedCode)) {
    return {
      isValid: false,
      message: 'Le code doit contenir uniquement des chiffres',
    };
  }

  return {
    isValid: true,
    message: 'Code valide',
  };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Obtient tous les messages d'erreur d'un formulaire
 */
export const getFormErrors = (validation: ValidationResult): string[] => {
  if (!validation.errors) return [];
  return Object.values(validation.errors);
};

/**
 * Vérifie si un formulaire a des erreurs
 */
export const hasFormErrors = (validation: ValidationResult): boolean => {
  return !validation.isValid || (validation.errors !== undefined && Object.keys(validation.errors).length > 0);
};

/**
 * Vérifie si un champ a une erreur
 */
export const hasFieldError = (validation: ValidationResult, fieldName: string): boolean => {
  if (!validation.errors) return false;
  return Boolean(validation.errors[fieldName]);
};

/**
 * Obtient le message d'erreur d'un champ
 */
export const getFieldError = (validation: ValidationResult, fieldName: string): string | null => {
  if (!validation.errors) return null;
  return validation.errors[fieldName] || null;
};
