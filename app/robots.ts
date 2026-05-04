import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/*-dashboard/',
        '/admin/',
        '/auth/',
        '/pupil-records/',
        '/teacher-submissions/',
      ],
    },
    sitemap: 'https://wajina.edu.ng/sitemap.xml',
  };
}
