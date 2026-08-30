import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { ReduxProvider } from "@/components/providers/redux-provider";
import { AppearanceProvider } from "@/components/providers/appearance-provider";
import { ProgramSettingsProvider } from "@/components/providers/program-settings-provider";
import "./globals.css";

const appearanceInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme') || 'system';
    var compact = localStorage.getItem('appearance-compact') === 'true';
    var reduceMotion = localStorage.getItem('appearance-reduce-motion') === 'true';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    var root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.classList.toggle('compact', compact);
    root.classList.toggle('reduce-motion', reduceMotion);
    root.style.colorScheme = resolved === 'dark' ? 'dark' : 'light';
  } catch (e) {}
})();
`;

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "The Curve Africa",
    template: "%s | The Curve Africa",
  },
  description: "Modern education platform for students and teachers",
  generator: "The Curve Africa",
  icons: {
    icon: [
      {
        url: "/theCurveLogo.png",
        media: "(prefers-color-scheme: light)",
        sizes: "32x32",
      },
      {
        url: "/theCurveLogo.png",
        media: "(prefers-color-scheme: dark)",
        sizes: "32x32",
      },
      {
        url: "/theCurveLogo.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: {
      url: "/theCurveLogo.png",
      sizes: "180x180",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#ffb703",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceInitScript }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ReduxProvider>
          <AppearanceProvider>
            <ProgramSettingsProvider>{children}</ProgramSettingsProvider>
          </AppearanceProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--card-foreground)",
                border: "1px solid var(--border)",
              },
            }}
          />
        </ReduxProvider>
        <Analytics />
      </body>
    </html>
  );
}
