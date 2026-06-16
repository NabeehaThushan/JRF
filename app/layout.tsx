import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "CBL job requisition portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="topheader">
          <Link href="/">CBL job requisition portal</Link>
        </div>
        {children}
      </body>
    </html>
  );
}