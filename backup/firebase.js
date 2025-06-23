const admin = require('firebase-admin');
require('dotenv').config();
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin with error handling
try {
    if (!admin.apps.length) {
        console.log('Initializing Firebase Admin...');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
        console.log('Firebase Admin initialized successfully');
    } else {
        console.log('Firebase Admin already initialized');
    }
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error; 
}
