/** 随真实时间变化的光影：时段判定 + 每个时段的光源、阴影方向和纸色。 */

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export const TIMES_OF_DAY: readonly TimeOfDay[] = ["dawn", "day", "dusk", "night"];

export const TIME_LABELS: Record<TimeOfDay, string> = {
  dawn: "清晨",
  day: "白天",
  dusk: "黄昏",
  night: "夜晚",
};

/** 纸层颜色（不透明的 #rrggbb），会写到对应的 --paper-* CSS 变量 */
export interface Palette {
  skyTop: string;
  skyBottom: string;
  hillFar: string;
  treeFar: string;
  forestMid: string;
  meadow: string;
  fore: string;
  trunk: string;
  stream: string;
  cloud: string;
  bloom: string;
  bloomCenter: string;
}

export interface Lighting {
  /** 阴影方向（单位向量，屏幕坐标：x 向右、y 向下），与光源方向相反 */
  shadow: { x: number; y: number };
  palette: Palette;
  /** 阴影颜色（不透明）；透明度单独给，整组阴影只合成一次，重叠处不会叠深 */
  shadowColor: string;
  shadowAlpha: number;
  /** 纸偶的时段明暗：用一层同色剪影盖在纸偶上 */
  shade: string;
  shadeAlpha: number;
  /** 整体色调叠加 */
  tint: string;
  /** 镂空处透出的光，非逆光时透明 */
  glow: string;
  warm: boolean;
  backlit: boolean;
  fireflies: boolean;
}

export function getTimeOfDay(date: Date): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 19) return "dusk";
  return "night";
}

const norm = (x: number, y: number, len: number) => {
  const l = Math.hypot(x, y);
  return { x: (x / l) * len, y: (y / l) * len };
};

export const LIGHTING: Record<TimeOfDay, Lighting> = {
  dawn: {
    shadow: norm(1, 0.45, 1),
    palette: {
      skyTop: "#f4d9c6",
      skyBottom: "#fbeedb",
      hillFar: "#d3cbbf",
      treeFar: "#a9b8a0",
      forestMid: "#78986e",
      meadow: "#93ab69",
      fore: "#557a4a",
      trunk: "#8f6a4b",
      stream: "#b9d3cc",
      cloud: "#fdf1e4",
      bloom: "#d0634a",
      bloomCenter: "#f2c56a",
    },
    shadowColor: "#46322a",
    shadowAlpha: 0.28,
    shade: "#f2a77c",
    shadeAlpha: 0.1,
    tint: "rgb(255 210 170 / 0.12)",
    glow: "rgb(255 214 140 / 0)",
    warm: false,
    backlit: false,
    fireflies: false,
  },
  day: {
    shadow: { x: 0, y: 0.6 },
    palette: {
      skyTop: "#cfe3e0",
      skyBottom: "#f6efdc",
      hillFar: "#bfd0bd",
      treeFar: "#9db99f",
      forestMid: "#6c9a6c",
      meadow: "#86ad62",
      fore: "#4a7a45",
      trunk: "#8a6446",
      stream: "#9fcbcb",
      cloud: "#fbf6ea",
      bloom: "#c8553d",
      bloomCenter: "#f0c25e",
    },
    shadowColor: "#28321f",
    shadowAlpha: 0.3,
    shade: "#ffffff",
    shadeAlpha: 0,
    tint: "rgb(255 240 200 / 0)",
    glow: "rgb(255 214 140 / 0)",
    warm: false,
    backlit: false,
    fireflies: false,
  },
  dusk: {
    shadow: norm(-1, 0.45, 1),
    palette: {
      skyTop: "#e9a77a",
      skyBottom: "#f7d9a8",
      hillFar: "#c4aea4",
      treeFar: "#9c9c7c",
      forestMid: "#6f7d55",
      meadow: "#8c8d4f",
      fore: "#4f5a36",
      trunk: "#7d5638",
      stream: "#d9b48f",
      cloud: "#f8dcc0",
      bloom: "#b9503a",
      bloomCenter: "#e8b257",
    },
    shadowColor: "#462319",
    shadowAlpha: 0.34,
    shade: "#b5552f",
    shadeAlpha: 0.16,
    tint: "rgb(255 170 90 / 0.14)",
    glow: "rgb(255 190 110 / 0.2)",
    warm: true,
    backlit: false,
    fireflies: false,
  },
  night: {
    shadow: { x: 0, y: 0.4 },
    palette: {
      skyTop: "#1f2a44",
      skyBottom: "#3a4762",
      hillFar: "#36435a",
      treeFar: "#2c3a4b",
      forestMid: "#24343a",
      meadow: "#233f30",
      fore: "#15301f",
      trunk: "#3b2e2a",
      stream: "#3d5a6b",
      cloud: "#4a5672",
      bloom: "#6b3a3a",
      bloomCenter: "#8a7444",
    },
    shadowColor: "#050a14",
    shadowAlpha: 0.45,
    shade: "#16203a",
    shadeAlpha: 0.55,
    tint: "rgb(30 40 80 / 0.15)",
    glow: "rgb(255 200 120 / 0.85)",
    warm: false,
    backlit: true,
    fireflies: true,
  },
};

export function shadowOffset(light: Lighting, distance: number): { dx: number; dy: number } {
  return { dx: light.shadow.x * distance, dy: light.shadow.y * distance };
}

const CSS_VAR: Record<keyof Palette, string> = {
  skyTop: "--paper-sky-top",
  skyBottom: "--paper-sky-bottom",
  hillFar: "--paper-hill-far",
  treeFar: "--paper-tree-far",
  forestMid: "--paper-forest-mid",
  meadow: "--paper-meadow",
  fore: "--paper-fore",
  trunk: "--paper-trunk",
  stream: "--paper-stream",
  cloud: "--paper-cloud",
  bloom: "--paper-bloom",
  bloomCenter: "--paper-bloom-center",
};

/** 某个时段对应的全部 CSS 变量，直接作为 style 写到场景根元素上 */
export function lightingCssVars(light: Lighting): Record<string, string> {
  const vars: Record<string, string> = {
    "--paper-shadow": light.shadowColor,
    "--paper-shadow-alpha": String(light.shadowAlpha),
    "--puppet-shade": light.shade,
    "--puppet-shade-alpha": String(light.shadeAlpha),
    "--paper-tint": light.tint,
    "--paper-glow": light.glow,
    "--crown-glow-on": light.backlit ? "1" : "0",
  };
  for (const key of Object.keys(CSS_VAR) as (keyof Palette)[]) {
    vars[CSS_VAR[key]] = light.palette[key];
  }
  return vars;
}
