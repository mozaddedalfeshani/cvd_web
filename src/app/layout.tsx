import type { Metadata } from "next";
import { Baloo_2, Noto_Sans_Bengali, Nunito } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import LanguageToggle from "@/components/ui-custom/LanguageToggle";

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HeartNest AI - Bangladesh CVD Risk Prediction",
  description:
    "A playful, research-backed cardiovascular risk screening app powered by a trained XGBoost model.",
  keywords:
    "CVD, Bangladesh, cardiovascular disease, heart disease prediction, machine learning, Next.js, Flask",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${baloo.variable} ${nunito.variable} ${notoSansBengali.variable} antialiased`}
      >
        <LanguageProvider>
          <AuthProvider>
            {children}
            <LanguageToggle />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
