import type { Metadata } from "next";
import "./globals.css";
import { ApolloWrapper } from "@/lib/apollo-wrapper";
import { AuthProvider } from "@/lib/auth-context";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "AI Study Planner",
  description: "Personalized study plans powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 font-sans">
        <ApolloWrapper>
          <AuthProvider>
            <AuthGate>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-y-auto p-6">{children}</main>
                </div>
              </div>
            </AuthGate>
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
