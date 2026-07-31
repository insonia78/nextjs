import type { Metadata } from "next";
import "./globals.css";
import { ApolloWrapper } from "@/lib/apollo-wrapper";
import { AuthProvider } from "@/lib/auth-context";
import AuthGate from "@/components/AuthGate";
import AppShell from "@/components/AppShell";

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
              <AppShell>{children}</AppShell>
            </AuthGate>
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
