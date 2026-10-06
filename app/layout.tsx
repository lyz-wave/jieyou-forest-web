import type { Metadata, Viewport } from "next";
import "lxgw-wenkai-screen-webfont/lxgwwenkaigbscreen.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "解忧森林",
  description: "释放情绪，转换思维，看见自己的成长。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3ecdc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full overflow-hidden antialiased">{children}</body>
    </html>
  );
}
