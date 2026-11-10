import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DatasetProvider } from "@/context/DatasetContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Sidebar, Navbar } from "@/components/layout/Navigation";
import { GlobalFilterBar } from "@/components/filters/GlobalFilterBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DataInsight – Dynamic Data Visualisation & Intelligence Platform",
  description:
    "Universal analytics, visualization, and automated insight platform for CMP7227 MSc AI Assessment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`} style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
        <DatasetProvider>
          <ThemeProvider>
            <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
              <Sidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <Navbar />
                <main
                  className="flex-1 overflow-y-auto p-6 md:p-8"
                  style={{ backgroundColor: "var(--bg-base)" }}
                >
                  <GlobalFilterBar />
                  {children}
                </main>
              </div>
            </div>
          </ThemeProvider>
        </DatasetProvider>
      </body>
    </html>
  );
}
