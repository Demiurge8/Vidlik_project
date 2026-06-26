import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata = {
  title: "Vidlik — спільнота молоді",
  description: "Vidlik — українська молодіжна спільнота в Данії",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#0a0a0a] text-white"
      >
        {/* Glow background */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 -top-[10%] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[#98ff22]/10 blur-[120px]" />
          <div className="absolute -right-[10%] -bottom-[10%] h-[28rem] w-[28rem] rounded-full bg-[#98ff22]/10 blur-[120px]" />
        </div>

        {children}
      </body>
    </html>
  );
}
