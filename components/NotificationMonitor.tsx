import React, { useEffect, useRef } from 'react';
import { doc, collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { NotificationSettings, NotificationBroadcast } from '../types';

interface NotificationMonitorProps {
  userId: string;
}

const NotificationMonitor: React.FC<NotificationMonitorProps> = ({ userId }) => {
  const isFirstLoad = useRef(true);
  const settingsRef = useRef<NotificationSettings>({
    system: true,
    tasks: true,
    engagement: true,
    sounds: true,
    volume: 0.5,
    lastUpdated: new Date().toISOString()
  });

  useEffect(() => {
    if (!userId) return;

    // Escutar preferências do usuário em tempo real
    const unsubSettings = onSnapshot(doc(db, "users", userId), (docSnap) => {
      if (docSnap.exists() && docSnap.data().notificationSettings) {
        settingsRef.current = docSnap.data().notificationSettings;
      }
    });

    // Escuta as notificações
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data() as NotificationBroadcast;
          const category = data.type || 'system';
          
          // Filtro Global Thug Style (v2.2)
          const isAllowed = 
            (category === 'system' && settingsRef.current.system) ||
            (category === 'task' && settingsRef.current.tasks) ||
            (category === 'engagement' && settingsRef.current.engagement) ||
            (data.type === ('broadcast' as any)); // Broadcast sempre passa por ser alerta crítico

          if (!isAllowed) {
            console.log(`[NotificationMonitor] Notificação da categoria '${category}' bloqueada pelas preferências globais.`);
            return;
          }

          // Verifica se a notificação é recente (últimos 60 segundos)
          const createdAt = data.createdAt as Timestamp;
          const now = Date.now();
          const timestampMillis = createdAt ? createdAt.toMillis() : now;
          
          if (now - timestampMillis < 60000) {
            showBrowserNotification(data.title, data.body);
            
            // Som Premium com Tratamento de Erro e Log
            if (settingsRef.current.sounds) {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.5;
              audio.play().catch(e => {
                console.log("[NotificationMonitor] Som bloqueado pelo navegador (auto-play policy). Requer interação prévia do usuário.", e);
              });
            }
          }
        }
      });
    });

    return () => {
      unsubSettings();
      unsubscribe();
    };
  }, [userId]);

  const showBrowserNotification = async (title: string, body: string) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      const options = {
        body,
        icon: "/icon.svg",
        badge: "/icon.svg",
        vibrate: [200, 100, 200],
        tag: 'tag-broadcast-' + Date.now()
      };

      try {
        // Tenta usar Service Worker para melhor suporte mobile
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, options);
        } else {
          // Fallback para API clássica
          new Notification(title, options);
        }
      } catch (e) {
        console.error("Erro ao mostrar notificação:", e);
        new Notification(title, options);
      }
    }
  };

  return null; // Componente invisível
};

export default NotificationMonitor;
