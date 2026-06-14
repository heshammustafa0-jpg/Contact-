import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مقيّم الألعاب التعليمية | منهج مونتيسوري ومعايير EN 71",
  description:
    "وكيل ذكاء اصطناعي متخصص لتقييم الألعاب التعليمية وفق منهج مونتيسوري ومعايير السلامة الأوروبية EN 71",
  keywords: "مونتيسوري, ألعاب تعليمية, EN 71, تقييم, ذكاء اصطناعي",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gradient-to-br from-montessori-cream via-white to-green-50">
        {children}
      </body>
    </html>
  );
}
