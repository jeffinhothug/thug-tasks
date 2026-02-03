import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// TODO: SUBSTITUA COM AS CONFIGURAÇÕES DO SEU PROJETO FIREBASE REAL
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// Inicialização do Firestore SEM cache persistente para teste de sincronização
// const db = initializeFirestore(app, {
//   localCache: persistentLocalCache({
//     tabManager: persistentMultipleTabManager()
//   })
// });

// Fallback simples (Online Only)
import { getFirestore } from "firebase/firestore";
const db = getFirestore(app);

const auth = getAuth(app);

// Lógica de segurança:
// Tenta realizar a autenticação anônima automaticamente
signInAnonymously(auth).then(() => {
  console.log("🔥 Firebase: Autenticado anonimamente.");
}).catch((error) => {
  console.error("Erro na autenticação Firebase:", error);
});

export { db, auth };