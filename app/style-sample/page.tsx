import { notFound } from "next/navigation";
import { StyleSample } from "./StyleSample";

export const metadata = { title: "风格样板 · 解忧森林" };

/** 风格样板页：只在开发模式可访问 */
export default function StyleSamplePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StyleSample />;
}
