import { initializeApp, getDatabase } from './firebase-init.js';

const firebaseConfig = {
    apiKey: "AIzaSyA8hhTyeavWEzLjE7HwYqXNbAjKrc9AlqQ",
    authDomain: "gomoku-3f1a8.firebaseapp.com",
    databaseURL: "https://gomoku-3f1a8-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gomoku-3f1a8",
    storageBucket: "gomoku-3f1a8.firebasestorage.app",
    messagingSenderId: "539760004171",
    appId: "1:539760004171:web:130477b3e733ac211991ce"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
