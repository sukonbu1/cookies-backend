const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount;
try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.warn('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
        serviceAccount = undefined;
    } else {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('Firebase service account loaded successfully');
    }
} catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', error);
    serviceAccount = undefined;
}

// Initialize Firebase Admin with error handling
try {
    if (!admin.apps.length) {
        console.log('Initializing Firebase Admin...');
        admin.initializeApp({
            credential: serviceAccount 
                ? admin.credential.cert(serviceAccount)
                : admin.credential.applicationDefault()
        });
        console.log('Firebase Admin initialized successfully');
    } else {
        console.log('Firebase Admin already initialized');
    }
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error; // Re-throw to prevent the app from starting with invalid Firebase config
}

module.exports = admin; 