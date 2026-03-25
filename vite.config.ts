import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Merge system environment variables (like those in Vercel) with .env files
    const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'html-transform',
          transformIndexHtml(html) {
            return html
              .replace(
                'pk_test_c2VsZWN0ZWQtbW9sZS0xNy5jbGVyay5hY2NvdW50cy5kZXYk',
                env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_c2VsZWN0ZWQtbW9sZS0xNy5jbGVyay5hY2NvdW50cy5kZXYk'
              )
              .replace(
                'YOUR_GEMINI_API_KEY_PLACEHOLDER',
                env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''
              );
          }
        }
      ],
      define: {
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
        'process.env.RAZORPAY_KEY_ID': JSON.stringify(env.VITE_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || ''),
        'process.env.RAZORPAY_KEY_SECRET': JSON.stringify(env.VITE_RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || ''),
        'process.env.PAYPAL_CLIENT_ID': JSON.stringify(env.VITE_PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || ''),
        'process.env.PAYPAL_CLIENT_SECRET': JSON.stringify(env.VITE_PAYPAL_CLIENT_SECRET || process.env.VITE_PAYPAL_CLIENT_SECRET || ''),
        'process.env.PAYPAL_ENVIRONMENT': JSON.stringify(env.VITE_PAYPAL_ENVIRONMENT || process.env.VITE_PAYPAL_ENVIRONMENT || 'production')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild',
        target: 'es2015',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              clerk: ['@clerk/clerk-react'],
              ai: ['@google/generative-ai']
            }
          }
        }
      }
    };
});
