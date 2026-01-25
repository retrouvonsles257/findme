#!/usr/bin/env node

/**
 * =====================================================
 * RETROUVONSLES - Environment Configuration Validator
 * Script de vérification des variables d'environnement
 * =====================================================
 * 
 * Usage: node validate-env.js
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
  console.log('\n' + colors.bright + colors.blue + '═'.repeat(60) + colors.reset);
  log(`  ${text}`, 'cyan');
  console.log(colors.bright + colors.blue + '═'.repeat(60) + colors.reset + '\n');
}

function check(label, value, required = true) {
  if (value && value.trim()) {
    log(`  ✅ ${label}`, 'green');
    return true;
  } else if (required) {
    log(`  ❌ ${label} - MANQUANT`, 'red');
    return false;
  } else {
    log(`  ⚠️  ${label} - Optionnel`, 'yellow');
    return true;
  }
}

// Charger les variables d'environnement
require('dotenv').config();

// Initialiser les compteurs
let totalChecks = 0;
let passedChecks = 0;
const results = {
  supabase: false,
  firebase: false,
  cloudinary: false,
  maptiler: false,
  huggingface: false,
  pushNotifications: false,
};

// Titre
header('🔐 RETROUVONSLES - Vérification des clés API');

// ============================================
// SUPABASE
// ============================================
log('📊 SUPABASE (Base de données)', 'bright');
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (check('SUPABASE_URL', supabaseUrl) && check('SUPABASE_ANON_KEY', supabaseKey)) {
  results.supabase = true;
  passedChecks += 2;
}
totalChecks += 2;

if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
  log('    ⚠️  URL ne semble pas valide (doit contenir "supabase.co")', 'yellow');
}

// ============================================
// FIREBASE
// ============================================
log('\n🔥 FIREBASE (Notifications push)', 'bright');
const firebaseChecks = [
  ['FIREBASE_API_KEY', process.env.REACT_APP_FIREBASE_API_KEY],
  ['FIREBASE_AUTH_DOMAIN', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN],
  ['FIREBASE_PROJECT_ID', process.env.REACT_APP_FIREBASE_PROJECT_ID],
  ['FIREBASE_STORAGE_BUCKET', process.env.REACT_APP_FIREBASE_STORAGE_BUCKET],
  ['FIREBASE_MESSAGING_SENDER_ID', process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID],
  ['FIREBASE_APP_ID', process.env.REACT_APP_FIREBASE_APP_ID],
];

let firebaseValid = 0;
firebaseChecks.forEach(([label, value]) => {
  if (check(label, value)) {
    firebaseValid++;
    passedChecks++;
  }
  totalChecks++;
});

if (firebaseValid === 6) {
  results.firebase = true;
}

// ============================================
// CLOUDINARY
// ============================================
log('\n☁️  CLOUDINARY (Stockage images)', 'bright');
const cloudinaryChecks = [
  ['CLOUDINARY_CLOUD_NAME', process.env.REACT_APP_CLOUDINARY_CLOUD_NAME],
  ['CLOUDINARY_UPLOAD_PRESET', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET],
  ['CLOUDINARY_API_KEY', process.env.REACT_APP_CLOUDINARY_API_KEY],
];

let cloudinaryValid = 0;
cloudinaryChecks.forEach(([label, value]) => {
  if (check(label, value)) {
    cloudinaryValid++;
    passedChecks++;
  }
  totalChecks++;
});

if (cloudinaryValid === 3) {
  results.cloudinary = true;
}

// ============================================
// MAPTILER
// ============================================
log('\n🗺️  MAPTILER (Géolocalisation)', 'bright');
const maptilerKey = process.env.REACT_APP_MAPTILER_API_KEY;

if (check('MAPTILER_API_KEY', maptilerKey)) {
  results.maptiler = true;
  passedChecks++;
}
totalChecks++;

// ============================================
// HUGGING FACE
// ============================================
log('\n🤖 HUGGING FACE (IA/ML)', 'bright');
const huggingfaceKey = process.env.REACT_APP_HUGGINGFACE_API_KEY;
const hfModelDetection = process.env.REACT_APP_HUGGINGFACE_MODEL_DETECTION;
const hfModelClassification = process.env.REACT_APP_HUGGINGFACE_MODEL_CLASSIFICATION;
const hfModelNLP = process.env.REACT_APP_HUGGINGFACE_MODEL_NLP;

if (check('HUGGINGFACE_API_KEY', huggingfaceKey)) {
  passedChecks++;
}
totalChecks++;

check('  Model - Detection', hfModelDetection, false);
check('  Model - Classification', hfModelClassification, false);
check('  Model - NLP', hfModelNLP, false);
totalChecks += 3;

if (huggingfaceKey) {
  results.huggingface = true;
  passedChecks += 3;
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================
log('\n📢 PUSH NOTIFICATIONS', 'bright');
const vapidKey = process.env.REACT_APP_PUSH_VAPID_PUBLIC_KEY;

if (check('PUSH_VAPID_PUBLIC_KEY', vapidKey, false)) {
  results.pushNotifications = true;
  passedChecks++;
}
totalChecks++;

// ============================================
// FEATURE FLAGS
// ============================================
log('\n🚀 FEATURE FLAGS', 'bright');
const enableGeo = process.env.ENABLE_GEOLOCATION !== 'false';
const enableNotifications = process.env.ENABLE_NOTIFICATIONS !== 'false';
const enablePush = process.env.ENABLE_PUSH_NOTIFICATIONS !== 'false';

log(`  ${enableGeo ? '✅' : '⚠️'} Géolocalisation: ${enableGeo ? 'ACTIVÉE' : 'DÉSACTIVÉE'}`, 
    enableGeo ? 'green' : 'yellow');
log(`  ${enableNotifications ? '✅' : '⚠️'} Notifications: ${enableNotifications ? 'ACTIVÉES' : 'DÉSACTIVÉES'}`, 
    enableNotifications ? 'green' : 'yellow');
log(`  ${enablePush ? '✅' : '⚠️'} Push Notifications: ${enablePush ? 'ACTIVÉES' : 'DÉSACTIVÉES'}`, 
    enablePush ? 'green' : 'yellow');

// ============================================
// RÉSUMÉ
// ============================================
header('📊 RÉSUMÉ');

log(`Total des vérifications: ${passedChecks}/${totalChecks}`, 'bright');

const percentage = Math.round((passedChecks / totalChecks) * 100);
const statusColor = percentage === 100 ? 'green' : percentage >= 80 ? 'yellow' : 'red';
log(`\nScore: ${percentage}%\n`, statusColor);

log('Services configurés:', 'bright');
const serviceStatus = {
  'Supabase (Base de données)': results.supabase,
  'Firebase (Notifications)': results.firebase,
  'Cloudinary (Stockage images)': results.cloudinary,
  'MapTiler (Géolocalisation)': results.maptiler,
  'Hugging Face (IA/ML)': results.huggingface,
  'Push Notifications': results.pushNotifications,
};

Object.entries(serviceStatus).forEach(([service, status]) => {
  log(
    `  ${status ? '✅' : '❌'} ${service}`,
    status ? 'green' : 'red'
  );
});

// ============================================
// RECOMMANDATIONS
// ============================================
header('💡 RECOMMANDATIONS');

const missingServices = Object.entries(serviceStatus)
  .filter(([_, status]) => !status)
  .map(([service, _]) => service);

if (missingServices.length === 0) {
  log('✅ Tous les services sont configurés!', 'green');
  log('\nTu peux maintenant démarrer le projet:', 'bright');
  log('  npm start', 'cyan');
} else {
  log(`⚠️  ${missingServices.length} service(s) manquant(s):`, 'yellow');
  missingServices.forEach(service => {
    log(`  • ${service}`, 'yellow');
  });
  
  log('\nGuides de configuration:', 'bright');
  log('  📖 Consulte: ENV_SETUP_GUIDE.md', 'cyan');
  log('  📖 Quick links: API_KEYS_QUICK_REFERENCE.md', 'cyan');
  log('  📖 Hugging Face: HUGGINGFACE_INTEGRATION_GUIDE.md', 'cyan');
}

// ============================================
// VÉRIFICATIONS DE SÉCURITÉ
// ============================================
header('🔒 SÉCURITÉ');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  const gitignore = fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8');
  if (gitignore.includes('.env')) {
    log('✅ .env est ignoré par Git', 'green');
  } else {
    log('❌ .env n\'est PAS ignoré par Git - RISQUE DE SÉCURITÉ!', 'red');
    log('   Ajoute ".env" à .gitignore immédiatement', 'red');
  }
} else {
  log('⚠️  Fichier .env non trouvé', 'yellow');
}

// ============================================
// CONCLUSION
// ============================================
console.log('\n' + colors.bright + colors.blue + '═'.repeat(60) + colors.reset + '\n');

if (percentage === 100) {
  log('🎉 Configuration complète! Prêt à développer! 🚀', 'green');
} else if (percentage >= 80) {
  log('⚙️  Configuration en bonne voie. Termine les services manquants.', 'yellow');
} else {
  log('⚠️  Configuration incomplète. Consulte les guides de configuration.', 'red');
}

console.log('\n' + colors.bright + colors.blue + '═'.repeat(60) + colors.reset + '\n');

// Exit code basé sur le statut
process.exit(percentage === 100 ? 0 : 1);
