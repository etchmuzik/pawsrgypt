import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F97316",
};

export const metadata: Metadata = {
  title: {
    default: "PAWS Egypt — Premium Pet Care",
    template: "%s | PAWS Egypt",
  },
  description: "Cairo's premium pet lifestyle brand. Shop pet food, accessories, health, and toys delivered across Egypt.",
  metadataBase: new URL("https://pawsegypt.com"),
  openGraph: {
    type: "website",
    siteName: "PAWS Egypt",
    title: "PAWS Egypt — Premium Pet Care",
    description: "Cairo's premium pet lifestyle brand. Shop pet food, accessories, health, and toys delivered across Egypt.",
    locale: "en_EG",
    url: "https://pawsegypt.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "PAWS Egypt — Premium Pet Care",
    description: "Cairo's premium pet lifestyle brand.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/paw-icon.svg",
    apple: "/paw-icon.svg",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster position="top-center" richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
