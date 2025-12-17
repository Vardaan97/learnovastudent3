import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GamificationProvider } from "@/context/GamificationContext";
import { StudyProvider } from "@/context/StudyContext";
import { SocialProvider } from "@/context/SocialContext";
import { CompanyProvider } from "@/context/CompanyContext";
import { TourProvider } from "@/components/OnboardingTour";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Koenig Learning Portal - Your Path to Certification",
  description: "Interactive learning portal for IT certification courses. Watch videos, take quizzes, and track your progress towards certification.",
  keywords: ["learning", "certification", "IT training", "Azure", "Microsoft", "online courses"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Koenig Learn",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0891b2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <CompanyProvider>
            <ThemeProvider>
              <GamificationProvider>
                <StudyProvider>
                  <SocialProvider>
                    <TourProvider>
                      {children}
                    </TourProvider>
                  </SocialProvider>
                </StudyProvider>
              </GamificationProvider>
            </ThemeProvider>
          </CompanyProvider>
        </AuthProvider>
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
