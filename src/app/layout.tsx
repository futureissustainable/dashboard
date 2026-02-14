import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TASKS",
  description: "Brutalist task management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
