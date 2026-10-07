import type { ReactElement } from "react";

/**
 * 纸片做成的小点缀：叶子与羽毛。
 * 以前这里是 emoji，换成随字色的纸片图形，
 * 对读屏隐藏——按钮的可读名字只留文字。
 */
export function PaperGlyph({
  kind,
  size = 14,
  className = "",
}: {
  kind: "leaf" | "feather";
  size?: number;
  className?: string;
}): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      className={`inline-block shrink-0 align-[-0.14em] ${className}`}
    >
      {kind === "leaf" ? (
        <>
          <path
            d="M21 3C11.6 3.4 5.8 8.3 4.5 17.2c-.3 2-.4 3.5-.4 3.5s1.6-.1 3.6-.5C16.4 18.9 20.7 12.9 21 3Z"
            fill="currentColor"
          />
          <path
            d="M18.7 5.3 6.2 18.5"
            stroke="var(--paper-shadow, #3b3328)"
            strokeOpacity="0.28"
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <path
            d="M20.6 3.4C13.4 3.9 8.8 7 7.2 12.4l-1.5 5.3 5.3-1.5c5.4-1.6 8.9-5.4 9.6-12.8Z"
            fill="currentColor"
          />
          <path
            d="M18.2 5.8 6 18.2"
            stroke="var(--paper-shadow, #3b3328)"
            strokeOpacity="0.3"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M15.1 5.4 9.4 11.1"
            stroke="var(--paper-shadow, #3b3328)"
            strokeOpacity="0.18"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
    </svg>
  );
}
