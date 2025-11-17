// app/studio/tiptap.d.ts
import '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      /**
       * Inserts a YouTube video embed.
       */
      setYoutubeVideo: (options: { src: string }) => ReturnType;
    };
  }
}