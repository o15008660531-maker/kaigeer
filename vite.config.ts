import path from 'path';
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
          registerType: 'autoUpdate',
          includeAssets: ['icon.jpg'],
          manifest: {
            name: 'KegelFlow - 提肛训练助手',
            short_name: 'KegelFlow',
            description: '专业的提肛训练助手',
            theme_color: '#f8fafc',
            background_color: '#f8fafc',
            display: 'standalone',
            icons: [
              {
                src: 'icon.jpg',
                sizes: '192x192',
                type: 'image/jpeg'
              },
              {
                src: 'icon.jpg',
                sizes: '512x512',
                type: 'image/jpeg'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
