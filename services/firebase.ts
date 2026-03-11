import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  memoryLocalCache, // Mudei para memória volátil (Online Only)
  // persistentLocalCache, // Desativado a pedido do usuário
  // persistentMultipleTabManager
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

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

// Inicialização: ONLINE ONLY (Tanque de Guerra modo Server-Side)
// Se não salvar no servidor, não salva no celular. Igual WhatsApp.
const db = initializeFirestore(app, {
  // Força HTTP para vencer AdGuard e Firewalls
  experimentalForceLongPolling: true,

  // Cache apenas na memória RAM. Fechou o app, sumiu (se não tiver ido pra nuvem).
  localCache: memoryLocalCache()
});

const auth = getAuth(app);
const messaging = getMessaging(app);

// O App.tsx lida com o monitoramento de Auth e login se necessário
export { db, auth, messaging };