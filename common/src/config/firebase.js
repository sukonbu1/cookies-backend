const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount;
try {
    serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
    console.error('❌ Error loading service account key:', error.message);
    console.error('Please check if serviceAccountKey.json exists and is valid');
    throw error;
}

// Initialize Firebase Admin with error handling
try {
    if (!admin.apps.length) {
        console.log('Initializing Firebase Admin...');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
        console.log('✅ Firebase Admin initialized successfully');
    } else {
        console.log('Firebase Admin already initialized');
    }
} catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    if (error.message.includes('Invalid JWT Signature')) {
        console.error('🔑 The service account key appears to be invalid or expired.');
        console.error('Please generate a new service account key from Firebase Console:');
        console.error('https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk');
    }
    throw error; // Re-throw to prevent the app from starting with invalid Firebase config
}

module.exports = admin; 