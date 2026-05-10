import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "./components/AuthContext";
import { cn } from "@/lib/utils";
import TelemetryInit from "./components/TelemetryInit";
import LegacyAtmosphere from "./components/landing/LegacyAtmosphere";
import StructuredData from "./components/SEO/StructuredData";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

const BASE_URL = "https://www.wajinainternational.com.ng";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Wajina International Schools | Excellence in Global Education",
    template: "%s | Wajina International Schools",
  },
  description: "Experience world-class learning at Wajina International Schools, Makurdi. From Crèche to Secondary, we offer a prestigious blend of British and Nigerian curriculums for the leaders of tomorrow.",
  keywords: ["Wajina International Schools", "Private School Benue", "Best School Makurdi", "International School Nigeria", "British Curriculum Nigeria", "Secondary School Makurdi", "Nursery School Benue"],
  manifest: "/manifest.json",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Wajina International Schools | Citadel of Excellence",
    description: "Empowering students through academic rigor and holistic growth in a world-class environment.",
    url: BASE_URL,
    siteName: "Wajina International Schools",
    images: [
      {
        url: "/images/og-preview.png",
        width: 1200,
        height: 630,
        alt: "Wajina International Schools Campus, Makurdi",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wajina International Schools",
    description: "Shaping global leaders with academic excellence and character.",
    images: ["/images/og-preview.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "brand-primary",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth no-scrollbar" data-scroll-behavior="smooth">
      <head>
        <link rel="apple-touch-icon" href="/images/Logo.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Wajina International Schools" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased selection:bg-brand-primary/30 selection:text-white",
          plusJakartaSans.variable,
          fraunces.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <StructuredData />
          <AuthProvider>
            <LegacyAtmosphere />
            <TelemetryInit />
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Script
          id="sw-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('[Wajina] SW registered:', registration.scope);
                  }).catch(err => {
                    console.log('[Wajina] SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

