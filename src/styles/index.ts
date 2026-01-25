/**
 * =====================================================
 * RETROUVONSLES - Styles Index
 * Central export point for all stylesheets
 * =====================================================
 */

/* Import order is critical - from least to most specific */

/* 1. CSS Variables - Foundation for all styles */
import './variables.css';

/* 2. Theme Configuration - Light and Dark theme variables */
import './themes.css';

/* 3. Global Styles - HTML5 normalization, typography, base elements */
import './global.css';

/* 4. Light Theme - Light theme specific component overrides */
import './light.css';

/* 5. Dark Theme - Dark theme specific component overrides */
import './dark.css';
