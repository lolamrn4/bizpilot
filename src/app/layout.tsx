import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getDict } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";
import { SwRegister } from "@/components/SwRegister";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getDict();
  return {
    metadataBase: new URL("https://www.bizpilotappgn.xyz"),
    title: { default: d.meta.title, template: `%s · ${d.meta.title}` },
    description: d.meta.description,
    applicationName: "Biz Pilot Digital",
    appleWebApp: { capable: true, title: "Biz Pilot", statusBarStyle: "default" },
    icons: { apple: "/icons/apple-touch-icon.png" },
  };
}

export const viewport: Viewport = { themeColor: "#c92c6b", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, d } = await getDict();
  return (
    <html lang={lang}>
      <body>
        <I18nProvider d={d} lang={lang}>
          {children}
        </I18nProvider>
        <SwRegister />
      </body>
    </html>
  );
}
