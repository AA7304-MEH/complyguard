import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Aggressively capture EVERY possible environment variable source
    // Vite's loadEnv + Node's process.env
    const env = { 
        ...process.env, 
        ...loadEnv(mode, process.cwd(), ''),
        ...loadEnv(mode, process.cwd(), 'VITE_') 
    };
    
    // Log detected keys during Vercel build (hidden from client)
    console.log('--- Build Time Environment Check ---');
    console.log('Detected VITE_ keys:', Object.keys(env).filter(k => k.startsWith('VITE_')));
    console.log('Detected GEMINI keys:', Object.keys(env).filter(k => k.includes('GEMINI')));
    console.log('------------------------------------');
    
    return {
      server: {
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
              );
          }
        }
      ],
      define: {

        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''),
        'process.env.RAZORPAY_KEY_ID': JSON.stringify(env.VITE_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || ''),

        'process.env.PAYPAL_CLIENT_ID': JSON.stringify(env.VITE_PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || ''),

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
