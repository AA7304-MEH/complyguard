/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_RAZORPAY_KEY_ID: string;

  readonly VITE_PAYPAL_CLIENT_ID: string;

  readonly VITE_PAYPAL_ENVIRONMENT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}