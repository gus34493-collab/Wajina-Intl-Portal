import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.wajinainternational.com.ng';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/academics/', '/our-story', '/future/'],
        disallow: [
          '/api/',
          '/portal',
          '/portal/',
          '/director-dashboard',
          '/principal-dashboard',
          '/teacher-dashboard',
          '/bursar-dashboard',
          '/bursar-primary-dashboard',
          '/bursar-secondary-dashboard',
          '/hr-dashboard',
          '/head-teacher-dashboard',
          '/hod-dashboard',
          '/dean-dashboard',
          '/accounts-officer-dashboard',
          '/admissions-dashboard',
          '/parent-dashboard',
          '/student-dashboard',
          '/operations-hub',
          '/gradebook',
          '/review-grades',
          '/academic-performance',
          '/results-approval',
          '/fee-compliance',
          '/staff-directory',
          '/staff-onboarding',
          '/pupil-records',
          '/session-planner',
          '/testimonials',
          '/retention-analysis',
          '/expense-approval',
          '/director-finances',
          '/director-academics',
          '/director-audit-logs',
          '/teacher-submissions-review',
          '/school-config',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
