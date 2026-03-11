import { messaging, db } from "./firebase";
import { getToken } from "firebase/messaging";
import { doc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp } from "firebase/firestore";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async (userId: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        console.log("FCM Token:", token);
        // Salva o token no documento do usuário
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token)
        });
        return token;
      }
    }
  } catch (error) {
    console.error("Erro ao solicitar permissão de notificação:", error);
  }
  return null;
};

export const sendBroadcastNotification = async (title: string, body: string, senderId: string, type: string = "broadcast") => {
  try {
    await addDoc(collection(db, "notifications"), {
      title,
      body,
      createdAt: serverTimestamp(),
      senderId,
      type
    });
    return true;
  } catch (error) {
    console.error("Erro ao enviar broadcast:", error);
    return false;
  }
};
