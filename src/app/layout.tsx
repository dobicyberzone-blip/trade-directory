import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { PublicThemeProvider } from "@/contexts/theme-context";
import { Toaster } from "@/components/ui/toaster";
import GoogleTranslate from "@/components/GoogleTranslate";
import GoogleTranslateSpacer from "@/components/layout/GoogleTranslateSpacer";
import ScriptLoader from "@/components/ScriptLoader";
import { generateOrganizationSchema, SeoStructuredData } from "@/lib/seo";
import "@/lib/chunk-error-handler"; // Handle chunk loading errors

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "KEPROBA - Kenya Export Trade Directory",
    template: "%s | KEPROBA - Kenya Export Trade Directory",
  },
  description: "Discover verified Kenyan exporters and their products. KEPROBA connects international buyers with trusted Kenyan suppliers. Browse our directory of verified exporters.",
  keywords: ["Kenya exports", "export directory", "Kenyan exporters", "trade", "KEPROBA", "export promotion", "business directory", "importers", "international trade"],
  authors: [
    {
      name: "KEPROBA",
      url: "https://www.keproba.go.ke",
    },
  ],
  creator: "KEPROBA",
  publisher: "Kenya Export Promotion Council",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://www.keproba.go.ke"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.keproba.go.ke",
    siteName: "KEPROBA - Kenya Export Trade Directory",
    title: "KEPROBA - Kenya Export Trade Directory",
    description: "Discover verified Kenyan exporters and their products. KEPROBA connects international buyers with trusted Kenyan suppliers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KEPROBA - Kenya Export Trade Directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KEPROBA - Kenya Export Trade Directory",
    description: "Discover verified Kenyan exporters and their products. KEPROBA connects international buyers with trusted Kenyan suppliers.",
    images: ["/og-image.png"],
    site: "@keproba",
    creator: "@keproba",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
    yandex: "yandex-verification-code",
  },
  category: "business",
  classification: "Export Directory",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const organizationSchema = generateOrganizationSchema();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <SeoStructuredData data={organizationSchema} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <AuthProvider>
          <PublicThemeProvider>
            <GoogleTranslateSpacer />
            {children}
            <Toaster />
            <GoogleTranslate />
            <ScriptLoader />
          </PublicThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
