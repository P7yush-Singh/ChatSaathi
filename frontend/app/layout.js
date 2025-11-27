import "./globals.css";
import AppHeader from "@/components/layout/AppHeader";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata = {
  title: "Chat Saathi",
  description: "Real-time chat with your digital saathi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0d1b1f] text-slate-100">
        <AuthProvider>
          <div className="max-w-7xl mx-auto px-6 py-5">
            <AppHeader />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
