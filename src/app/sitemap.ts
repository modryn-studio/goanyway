import { MetadataRoute } from 'next';

import { site } from '@/config/site';
import { getPseoCombos } from '@/../content/pseo/combos';

export default function sitemap(): MetadataRoute.Sitemap {
  const pseoRoutes: MetadataRoute.Sitemap = getPseoCombos().map(({ activitySlug, citySlug }) => ({
    url: `${site.url}/${activitySlug}/${citySlug}`,
    lastModified: new Date('2026-03-04'),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

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
      lastModified: new Date('2026-03-05'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${site.url}/terms`,
      lastModified: new Date('2026-03-05'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    ...pseoRoutes,
  ];
}

