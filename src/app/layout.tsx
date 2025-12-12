import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Koenig Learning Portal - Your Path to Certification",
  description: "Interactive learning portal for IT certification courses. Watch videos, take quizzes, and track your progress towards certification.",
  keywords: ["learning", "certification", "IT training", "Azure", "Microsoft", "online courses"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
