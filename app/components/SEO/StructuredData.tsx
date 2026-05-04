"use client";

import Script from "next/script";

export default function StructuredData() {
  const schoolData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Wajina International Schools",
    "url": "https://wajina.edu.ng",
    "logo": "https://wajina.edu.ng/images/Logo.png",
    "description": "A premier international institution in Nigeria providing world-class education from Creche to Secondary levels.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Makurdi",
      "addressRegion": "Benue State",
      "addressCountry": "Nigeria"
    },
    "sameAs": [
      "https://facebook.com/wajinaschools",
      "https://twitter.com/wajinaschools",
      "https://instagram.com/wajinaschools"
    ]
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
          "text": "Wajina International Schools offers a rich blend of Nigerian and International (British) curriculums, ensuring students are globally competitive while remaining locally relevant."
        }
      },
      {
        "@type": "Question",
        "name": "How do I apply for admission?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can apply for admission by clicking the 'Apply Now' button on our portal, filling out the enrollment form, and scheduling an entrance assessment."
        }
      }
    ]
  };

  return (
    <>
      <Script
        id="structured-data-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolData) }}
      />
      <Script
        id="structured-data-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
    </>
  );
}

