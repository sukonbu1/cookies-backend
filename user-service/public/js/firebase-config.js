// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDjoYMVx8qpJJRh2W6qCF9IE85r9UYc6dE",
    authDomain: "cookies-7fe6b.firebaseapp.com",
    projectId: "cookies-7fe6b",
    storageBucket: "cookies-7fe6b.firebasestorage.app",
    messagingSenderId: "569099166158",
    appId: "1:569099166158:web:e0750fe26d33d2edf84b9f",
    measurementId: "G-75XDFW09LX"
};

// Initialize Firebase with error handling
try {
    if (!firebase.apps.length) {
        console.log('Initializing Firebase...');
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
    } else {
        console.log('Firebase already initialized');
    }
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

// Export auth instance
const auth = firebase.auth();

// Add auth state change listener for debugging
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in:', user.uid);
    } else {
        console.log('User is signed out');
    }
}, (error) => {
    console.error('Auth state change error:', error);
});