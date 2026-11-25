import "./globals.css";
import WalletProvider from "@/components/WalletProvider";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Carbon Registry",
  description: "Hệ thống quản lý tín chỉ carbon trên blockchain (ĐATN)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <WalletProvider>
          <Nav />
          <main>{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
