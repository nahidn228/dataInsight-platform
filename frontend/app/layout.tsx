import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DatasetProvider } from "@/context/DatasetContext";
import { Sidebar, Navbar } from "@/components/layout/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DataInsight – Dynamic Data Visualisation & Intelligence Platform",
  description: "Universal analytics, visualization, and automated insight platform for CMP7227 MSc AI Assessment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-100 antialiased`}>
        <DatasetProvider>
          <div className="flex h-screen overflow-hidden bg-slate-950">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Navbar />
              <main className="flex-1 overflow-y-auto bg-slate-900/50 p-6 md:p-8">
                {children}
              </main>
            </div>
          </div>
        </DatasetProvider>
      </body>
    </html>
  );
}
