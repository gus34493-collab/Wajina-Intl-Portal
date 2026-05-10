import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.wajinainternational.com.ng';

const ACADEMIC_SLUGS = ['creche', 'nursery', 'primary', 'secondary', 'enrichment'];
const FUTURE_SLUGS = ['alumni', 'college', 'adult-learning', 'scholarship', 'foundation'];

export default function sitemap(): MetadataRoute.Sitemap {
  const academicPages = ACADEMIC_SLUGS.map(slug => ({
    url: `${BASE_URL}/academics/${slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const futurePages = FUTURE_SLUGS.map(slug => ({
    url: `${BASE_URL}/future/${slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/our-story`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/academics`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...academicPages,
    {
      url: `${BASE_URL}/future`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...futurePages,
  ];
}
