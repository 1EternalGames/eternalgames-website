// global.d.ts
interface Window {
  gtag: (
    command: 'config' | 'event' | 'consent' | 'js',
    targetId: string,
    config?: Record<string, any>
  ) => void;
  dataLayer: any[];
}