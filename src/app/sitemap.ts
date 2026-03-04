import { MetadataRoute } from 'next';
import { site } from '@/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified: new Date('2026-03-04'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${site.url}/result`,
      lastModified: new Date('2026-03-04'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${site.url}/privacy`,
      lastModified: new Date('2026-03-04'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${site.url}/terms`,
      lastModified: new Date('2026-03-04'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    // TODO: add pSEO routes here once /tools/goanyway/[activity]/[city] is built (Issue #9)
  ];
}
