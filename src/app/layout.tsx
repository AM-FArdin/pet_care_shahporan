import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shahporan Pet & Vet Care",
  description: "Comprehensive veterinary management system for Shahporan Pet & Vet Care, Sylhet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
          <Navbar />
        </Suspense>
        <main className="app-main px-4 sm:px-6 lg:pr-8 py-6 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
