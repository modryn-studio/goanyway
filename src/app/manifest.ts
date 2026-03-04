import { MetadataRoute } from 'next';
import { site } from '@/config/site';

// Public files are served at basePath + /filename.
// Derive the basePath prefix from site.url so the manifest icon src resolves correctly.
const basePath = new URL(site.url).pathname; // e.g. /tools/goanyway

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.shortName,
    description: site.description,
    start_url: `${basePath}/`,
    display: 'standalone',
    background_color: site.bg,
    theme_color: site.accent,
    icons: [
      {
        src: `${basePath}/icon.png`,
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // Declared separately as maskable so installable PWAs can crop it
        src: `${basePath}/icon.png`,
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
