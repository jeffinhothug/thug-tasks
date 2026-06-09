import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['icon.svg'],
        manifest: {
          name: 'Thug Tasks',
          short_name: 'ThugTasks',
          description: 'Gerenciador de tarefas minimalista e offline-first',
          theme_color: '#09090b',
          background_color: '#09090b',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      }),
      {
        name: 'transform-sw-config',
        closeBundle() {
          const swPath = path.resolve(__dirname, 'dist/firebase-messaging-sw.js');
          if (fs.existsSync(swPath)) {
            let content = fs.readFileSync(swPath, 'utf-8');
            content = content.replace('__VITE_FIREBASE_API_KEY__', env.VITE_FIREBASE_API_KEY || '');
            content = content.replace('__VITE_FIREBASE_AUTH_DOMAIN__', env.VITE_FIREBASE_AUTH_DOMAIN || '');
            content = content.replace('__VITE_FIREBASE_PROJECT_ID__', env.VITE_FIREBASE_PROJECT_ID || '');
            content = content.replace('__VITE_FIREBASE_STORAGE_BUCKET__', env.VITE_FIREBASE_STORAGE_BUCKET || '');
            content = content.replace('__VITE_FIREBASE_MESSAGING_SENDER_ID__', env.VITE_FIREBASE_MESSAGING_SENDER_ID || '');
            content = content.replace('__VITE_FIREBASE_APP_ID__', env.VITE_FIREBASE_APP_ID || '');
            fs.writeFileSync(swPath, content);
          }
        }
      }
    ],
    define: {
      // Chaves de IA privadas removidas do build público do front-end por questões de segurança.
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
