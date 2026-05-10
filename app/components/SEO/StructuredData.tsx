"use client";

import Script from "next/script";

const BASE_URL = "https://www.wajinainternational.com.ng";

export default function StructuredData() {
  const schoolData = {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "School"],
    "name": "Wajina International Schools",
    "alternateName": "Wajina Intl Schools",
    "url": BASE_URL,
    "logo": `${BASE_URL}/images/Logo.png`,
    "image": `${BASE_URL}/images/og-preview.png`,
    "description": "A premier international institution in Makurdi, Benue State, Nigeria providing world-class education from Crèche to Secondary level with a blend of British and Nigerian curriculums.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Makurdi",
      "addressRegion": "Benue State",
      "addressCountry": "NG",
      "addressCountryName": "Nigeria"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 7.7313,
      "longitude": 8.5384
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Academic Programs",
      "itemListElement": [
        { "@type": "Course", "name": "Crèche", "description": "Early childcare for ages 3–18 months" },
        { "@type": "Course", "name": "Nursery School", "description": "Foundation learning for ages 2–5 years" },
        { "@type": "Course", "name": "Primary Education", "description": "Years 1–6 British & Nigerian curriculum" },
        { "@type": "Course", "name": "Secondary Education", "description": "JSS1 to SS3 with IGCSE pathways" },
        { "@type": "Course", "name": "Enrichment Programs", "description": "Co-curricular and talent development programs" }
      ]
    },
    "sameAs": [
      "https://facebook.com/wajinaschools",
      "https://twitter.com/wajinaschools",
      "https://instagram.com/wajinaschools"
    ]
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Wajina International Schools",
    "url": BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/academics/{search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What curriculums does Wajina International Schools offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Wajina International Schools offers a blend of the Nigerian National Curriculum and the British (Cambridge/IGCSE) curriculum, ensuring students are globally competitive while remaining locally grounded."
        }
      },
      {
        "@type": "Question",
        "name": "Where is Wajina International Schools located?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Wajina International Schools is located in Makurdi, Benue State, Nigeria."
        }
      },
      {
        "@type": "Question",
        "name": "What age groups does Wajina International Schools accept?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Wajina International Schools accepts students from 3 months (Crèche) through to SS3 (Secondary), covering Crèche, Nursery, Primary, and Secondary levels."
        }
      },
      {
        "@type": "Question",
        "name": "How do I apply for admission to Wajina International Schools?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can apply for admission online by visiting our portal at wajinainternational.com.ng, completing the enrollment form, and scheduling an entrance assessment. Our admissions team will guide you through the process."
        }
      },
      {
        "@type": "Question",
        "name": "Does Wajina International Schools have a parent portal?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Wajina International Schools has a secure parent portal where parents can track their child's academic progress, view results, and communicate with staff."
        }
      },
      {
        "@type": "Question",
        "name": "Is Wajina International Schools a boarding or day school?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Wajina International Schools currently operates as a day school, providing structured after-school enrichment programs for extended learning beyond classroom hours."
        }
      }
    ]
  };

  return (
    <>
      <Script
        id="structured-data-school"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolData) }}
      />
      <Script
        id="structured-data-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
      />
      <Script
        id="structured-data-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
    </>
  );
}
