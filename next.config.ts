import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 指示器放到右上角，避免挡住场景底部的按钮和前景
  devIndicators: { position: "top-right" },
};

export default nextConfig;
