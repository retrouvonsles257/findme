/**
 * =====================================================
 * RETROUVONSLES - RegisterPublicForm Component
 * Alias pour RegisterForm - Inscription pour le public
 * =====================================================
 */

import React from 'react';
import { RegisterForm, type RegisterFormProps } from './RegisterForm';

/**
 * RegisterPublicForm is an alias for RegisterForm component
 * This component is used for public user registration (GRAND_PUBLIC account type)
 */
const RegisterPublicForm: React.FC<RegisterFormProps> = (props) => {
  return <RegisterForm {...props} />;
};

export default RegisterPublicForm;
