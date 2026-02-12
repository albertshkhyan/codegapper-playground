/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-terminal/client" />

/** PWA install prompt event (Chrome/Edge). Not supported in Safari. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

declare module 'prismjs/components/prism-javascript';
declare module 'prismjs/components/prism-typescript';
declare module 'prismjs/components/prism-python';
declare module 'prismjs/components/prism-java';
declare module 'prismjs/components/prism-cpp';
declare module 'prismjs/components/prism-csharp';
declare module 'prismjs/components/prism-go';
declare module 'prismjs/components/prism-rust';
declare module 'prismjs/components/prism-php';
declare module 'prismjs/components/prism-ruby';
