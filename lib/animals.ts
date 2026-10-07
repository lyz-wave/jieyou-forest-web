/**
 * 角色设定与纸偶定义（素材集中处之一）。
 * 纸偶 viewBox 统一为 200×200，脚底在 y ≈ 196。
 * 以后换画师素材时，保持 AnimalDef / PuppetDef 结构不变即可。
 */
import type { Point } from "./paper/geometry";
import { seeded } from "./paper/random";
import { pathFromPoints, roughPath } from "./paper/roughen";
import { blob, ellipse, leaf } from "./paper/shapes";
import type { PuppetDef } from "./puppet/types";

export type AnimalId = "woodpecker" | "owl" | "fox" | "bear" | "turtle" | "otter" | "squirrel";
export type CharacterId = AnimalId | "tree";

export interface AnimalDef {
  id: CharacterId;
  name: string;
  species: string;
  /** 思维方式（短标签） */
  mindset: string;
  /** 一句话介绍思维方式 */
  summary: string;
  basis: string;
  tone: string;
  /** 符合语气的样句 */
  sample: string;
  game?: { id: string; name: string };
  puppet: PuppetDef;
}

const r = (pts: Point[], seed: string, amp = 1.2, step = 6) => roughPath(pts, { seed, amplitude: amp, step });
const smooth = (pts: Point[]) => pathFromPoints(pts);

// ── 阿橘（狐狸） ─────────────────────────────────────────────

const FOX_ORANGE = "#d9773a";
const FOX_CREAM = "#f6e7cf";
const FOX_DARK = "#7a3b22";
const INK = "#2b221b";

function foxPuppet(): PuppetDef {
  const rng = seeded("fox");
  // 坐姿身体：上窄下宽的水滴
  const body: Point[] = [
    { x: 100, y: 92 },
    { x: 122, y: 104 },
    { x: 136, y: 136 },
    { x: 140, y: 170 },
    { x: 130, y: 194 },
    { x: 70, y: 194 },
    { x: 60, y: 170 },
    { x: 64, y: 136 },
    { x: 78, y: 104 },
  ];
  const chest: Point[] = [
    { x: 100, y: 104 },
    { x: 114, y: 122 },
    { x: 116, y: 150 },
    { x: 104, y: 176 },
    { x: 96, y: 176 },
    { x: 84, y: 150 },
    { x: 86, y: 122 },
  ];
  // 尾巴：从身体右后方甩出的大羽毛形，尖端奶油色
  const tail: Point[] = [
    { x: 128, y: 180 },
    { x: 152, y: 176 },
    { x: 174, y: 160 },
    { x: 188, y: 134 },
    { x: 190, y: 108 },
    { x: 182, y: 92 },
    { x: 172, y: 104 },
    { x: 166, y: 130 },
    { x: 152, y: 152 },
    { x: 132, y: 164 },
  ];
  const tailTip: Point[] = [
    { x: 190, y: 108 },
    { x: 182, y: 92 },
    { x: 174, y: 102 },
    { x: 172, y: 116 },
    { x: 184, y: 120 },
  ];
  // 头：倒三角脸 + 两腮
  const head: Point[] = [
    { x: 66, y: 62 },
    { x: 84, y: 50 },
    { x: 100, y: 48 },
    { x: 116, y: 50 },
    { x: 134, y: 62 },
    { x: 140, y: 76 },
    { x: 124, y: 92 },
    { x: 106, y: 110 },
    { x: 100, y: 114 },
    { x: 94, y: 110 },
    { x: 76, y: 92 },
    { x: 60, y: 76 },
  ];
  const cheekL: Point[] = [
    { x: 62, y: 76 },
    { x: 80, y: 80 },
    { x: 96, y: 100 },
    { x: 100, y: 113 },
    { x: 92, y: 108 },
    { x: 74, y: 92 },
  ];
  const cheekR: Point[] = cheekL.map((p) => ({ x: 200 - p.x, y: p.y }));
  const earL: Point[] = [
    { x: 70, y: 60 },
    { x: 66, y: 22 },
    { x: 92, y: 50 },
  ];
  const earInL: Point[] = [
    { x: 74, y: 54 },
    { x: 71, y: 32 },
    { x: 86, y: 50 },
  ];
  const mirror = (pts: Point[]) => pts.map((p) => ({ x: 200 - p.x, y: p.y }));
  const legL: Point[] = [
    { x: 80, y: 160 },
    { x: 92, y: 160 },
    { x: 94, y: 194 },
    { x: 78, y: 196 },
  ];
  const legR = mirror(legL);
  const eyeL = ellipse(87, 76, 4.2, 5, 12);
  const eyeR = ellipse(113, 76, 4.2, 5, 12);
  const nose = ellipse(100, 108, 4, 3, 10);
  // 两腮各三根胡须：细长叶片
  const whiskers = [
    leaf(78, 98, 18, 1.6, 0.25),
    leaf(76, 103, 18, 1.6, 0.05),
    leaf(122, 98, 18, 1.6, -0.25),
    leaf(124, 103, 18, 1.6, -0.05),
  ];
  // 身体上的一点深色斑块，增加纸片层次
  const pawDark = blob(rng, 86, 194, 7, { wobble: 0.15, segments: 10, squashY: 0.5 });
  const pawDarkR = blob(rng, 114, 194, 7, { wobble: 0.15, segments: 10, squashY: 0.5 });

  return {
    id: "fox",
    viewBox: [200, 200],
    facing: "right",
    signature: { part: "tail", angle: 18 },
    parts: [
      {
        id: "body",
        path: r(body, "fox-body", 1.4, 7),
        fill: FOX_ORANGE,
        joint: [100, 194],
        z: 0,
        idle: { kind: "breathe", duration: 3.2, amount: 0.035 },
        children: [
          {
            id: "tail",
            path: `${r(tail, "fox-tail", 1.6, 7)}`,
            fill: FOX_ORANGE,
            joint: [132, 172],
            z: -1,
            pin: true,
            idle: { kind: "sway", duration: 2.6, amount: 7 },
            children: [{ id: "tail-tip", path: r(tailTip, "fox-tail-tip", 1, 5), fill: FOX_CREAM, joint: [182, 106], z: 1 }],
          },
          { id: "chest", path: r(chest, "fox-chest", 1, 5), fill: FOX_CREAM, joint: [100, 140], z: 1 },
          // 两条前腿：走路时交替前后摆（关节在肩部）
          {
            id: "leg-l",
            path: r(legL, "fox-leg-l", 0.8, 5) + smooth(pawDark),
            fill: FOX_DARK,
            joint: [86, 162],
            z: 2,
            pin: true,
            gait: "leg-front",
          },
          {
            id: "leg-r",
            path: r(legR, "fox-leg-r", 0.8, 5) + smooth(pawDarkR),
            fill: FOX_DARK,
            joint: [114, 162],
            z: 2,
            pin: true,
            gait: "leg-back",
          },
          {
            id: "head",
            path: r(head, "fox-head", 1.2, 6),
            fill: FOX_ORANGE,
            joint: [100, 104],
            z: 4,
            pin: true,
            idle: { kind: "sway", duration: 4.4, amount: 3 },
            children: [
              {
                id: "ear-l",
                path: r(earL, "fox-ear-l", 0.8, 5),
                fill: FOX_ORANGE,
                joint: [80, 56],
                z: -1,
                children: [{ id: "ear-in-l", path: r(earInL, "fox-ear-in-l", 0.6, 4), fill: FOX_DARK, joint: [78, 50], z: 1 }],
              },
              {
                id: "ear-r",
                path: r(mirror(earL), "fox-ear-r", 0.8, 5),
                fill: FOX_ORANGE,
                joint: [120, 56],
                z: -1,
                children: [
                  { id: "ear-in-r", path: r(mirror(earInL), "fox-ear-in-r", 0.6, 4), fill: FOX_DARK, joint: [122, 50], z: 1 },
                ],
              },
              { id: "cheeks", path: r(cheekL, "fox-cheek-l", 0.8, 5) + r(cheekR, "fox-cheek-r", 0.8, 5), fill: FOX_CREAM, joint: [100, 96], z: 1 },
              {
                id: "eyes",
                path: smooth(eyeL) + smooth(eyeR),
                fill: INK,
                ink: true,
                joint: [100, 76],
                z: 2,
                idle: { kind: "blink", duration: 4.6, amount: 0.12 },
              },
              { id: "nose", path: smooth(nose), fill: INK, ink: true, joint: [100, 108], z: 2 },
              { id: "whiskers", path: whiskers.map(smooth).join(""), fill: INK, ink: true, joint: [100, 100], z: 2 },
            ],
          },
        ],
      },
    ],
  };
}

// ── 团团（熊） ───────────────────────────────────────────────

const BEAR_BROWN = "#a8714a";
const BEAR_TAN = "#e8c9a0";
const BEAR_DARK = "#6e4630";

function bearPuppet(): PuppetDef {
  const mirror = (pts: Point[]) => pts.map((p) => ({ x: 200 - p.x, y: p.y }));
  // 坐姿：圆滚滚的梨形身体
  const body = ellipse(100, 140, 52, 56, 26);
  const belly = ellipse(100, 150, 32, 36, 20);
  const head = ellipse(100, 72, 42, 38, 24);
  const muzzle = ellipse(100, 86, 18, 13, 16);
  const earL = ellipse(66, 42, 14, 14, 14);
  const earInL = ellipse(66, 43, 7, 7, 10);
  // 手臂：从肩膀垂下的圆头长条，抱抱时会张开
  const armL: Point[] = [
    { x: 58, y: 110 },
    { x: 70, y: 106 },
    { x: 66, y: 150 },
    { x: 58, y: 160 },
    { x: 46, y: 156 },
    { x: 44, y: 140 },
  ];
  // 腿：坐着时往前伸出的短腿和脚掌
  const legL: Point[] = [
    { x: 66, y: 168 },
    { x: 90, y: 170 },
    { x: 92, y: 192 },
    { x: 80, y: 197 },
    { x: 62, y: 195 },
    { x: 58, y: 184 },
  ];
  const padL = ellipse(76, 188, 8, 6, 12);
  const eyeL = ellipse(86, 70, 3.8, 4.4, 12);
  const eyeR = ellipse(114, 70, 3.8, 4.4, 12);
  const nose = ellipse(100, 81, 6, 4.2, 12);
  // 微笑：两片细叶子组成的弧
  const smile = [leaf(95, 91, 9, 1.6, 0.5), leaf(105, 91, 9, 1.6, -0.5)];

  return {
    id: "bear",
    viewBox: [200, 200],
    facing: "right",
    signature: { part: "arm-r", angle: -28 },
    parts: [
      {
        id: "body",
        path: r(body, "bear-body", 1.4, 7),
        fill: BEAR_BROWN,
        joint: [100, 194],
        z: 0,
        idle: { kind: "breathe", duration: 3.6, amount: 0.04 },
        children: [
          { id: "belly", path: r(belly, "bear-belly", 1, 5), fill: BEAR_TAN, joint: [100, 150], z: 1 },
          {
            id: "leg-l",
            path: r(legL, "bear-leg-l", 1, 5) + smooth(padL),
            fill: BEAR_DARK,
            joint: [74, 172],
            z: 2,
            pin: true,
            gait: "leg-front",
          },
          {
            id: "leg-r",
            path: r(mirror(legL), "bear-leg-r", 1, 5) + smooth(mirror(padL)),
            fill: BEAR_DARK,
            joint: [126, 172],
            z: 2,
            pin: true,
            gait: "leg-back",
          },
          { id: "arm-l", path: r(armL, "bear-arm-l", 1, 5), fill: BEAR_BROWN, joint: [62, 112], z: 3, pin: true },
          { id: "arm-r", path: r(mirror(armL), "bear-arm-r", 1, 5), fill: BEAR_BROWN, joint: [138, 112], z: 3, pin: true },
          {
            id: "head",
            path: r(head, "bear-head", 1.2, 6),
            fill: BEAR_BROWN,
            joint: [100, 104],
            z: 4,
            pin: true,
            idle: { kind: "sway", duration: 5, amount: 2.5 },
            children: [
              {
                id: "ear-l",
                path: r(earL, "bear-ear-l", 0.8, 4),
                fill: BEAR_BROWN,
                joint: [70, 50],
                z: -1,
                children: [{ id: "ear-in-l", path: r(earInL, "bear-ear-in-l", 0.5, 3), fill: BEAR_DARK, joint: [66, 43], z: 1 }],
              },
              {
                id: "ear-r",
                path: r(mirror(earL), "bear-ear-r", 0.8, 4),
                fill: BEAR_BROWN,
                joint: [130, 50],
                z: -1,
                children: [
                  { id: "ear-in-r", path: r(mirror(earInL), "bear-ear-in-r", 0.5, 3), fill: BEAR_DARK, joint: [134, 43], z: 1 },
                ],
              },
              { id: "muzzle", path: r(muzzle, "bear-muzzle", 0.8, 4), fill: BEAR_TAN, joint: [100, 86], z: 1 },
              {
                id: "eyes",
                path: smooth(eyeL) + smooth(eyeR),
                fill: INK,
                ink: true,
                joint: [100, 70],
                z: 2,
                idle: { kind: "blink", duration: 5.2, amount: 0.12 },
              },
              { id: "nose", path: smooth(nose), fill: INK, ink: true, joint: [100, 81], z: 2 },
              { id: "smile", path: smile.map(smooth).join(""), fill: INK, ink: true, joint: [100, 91], z: 2 },
            ],
          },
        ],
      },
    ],
  };
}

// ── 墨墨（猫头鹰） ───────────────────────────────────────────

const OWL_BROWN = "#8a6a4c";
const OWL_DARK = "#5f4532";
const OWL_CREAM = "#efe0c4";
const OWL_OCHRE = "#c99a4e";

/** 圆环（两个反向的圆，中间镂空），用来画眼镜 */
const ring = (cx: number, cy: number, outer: number, inner: number) =>
  smooth(ellipse(cx, cy, outer, outer, 24)) + smooth(ellipse(cx, cy, inner, inner, 24).reverse());

/** 胸口的小 V 形羽毛纹 */
const chevron = (x: number, y: number): Point[] => [
  { x: x - 5, y: y - 2 },
  { x, y: y + 2 },
  { x: x + 5, y: y - 2 },
  { x: x + 5, y: y },
  { x, y: y + 4 },
  { x: x - 5, y },
];

function owlPuppet(): PuppetDef {
  const mirror = (pts: Point[]) => pts.map((p) => ({ x: 200 - p.x, y: p.y }));
  const body = ellipse(100, 138, 44, 56, 26);
  const belly = ellipse(100, 148, 28, 40, 20);
  const wingL: Point[] = [
    { x: 60, y: 104 },
    { x: 74, y: 110 },
    { x: 72, y: 150 },
    { x: 64, y: 176 },
    { x: 54, y: 162 },
    { x: 52, y: 126 },
  ];
  const head = ellipse(100, 74, 46, 40, 26);
  const tuftL: Point[] = [
    { x: 64, y: 54 },
    { x: 58, y: 26 },
    { x: 82, y: 44 },
  ];
  const discs = smooth(ellipse(83, 76, 17, 17, 20)) + smooth(ellipse(117, 76, 17, 17, 20));
  const beak: Point[] = [
    { x: 94, y: 88 },
    { x: 106, y: 88 },
    { x: 100, y: 101 },
  ];
  const feet = smooth(ellipse(86, 192, 10, 4.5, 12)) + smooth(ellipse(114, 192, 10, 4.5, 12));
  const marks = [chevron(92, 132), chevron(108, 132), chevron(100, 146), chevron(92, 160), chevron(108, 160)];

  return {
    id: "owl",
    viewBox: [200, 200],
    facing: "right",
    signature: { part: "head", angle: 12 },
    parts: [
      {
        id: "body",
        path: r(body, "owl-body", 1.3, 6),
        fill: OWL_BROWN,
        joint: [100, 194],
        z: 0,
        idle: { kind: "breathe", duration: 3.4, amount: 0.035 },
        children: [
          { id: "belly", path: r(belly, "owl-belly", 1, 5), fill: OWL_CREAM, joint: [100, 148], z: 1 },
          { id: "marks", path: marks.map(smooth).join(""), fill: INK, ink: true, joint: [100, 146], z: 2 },
          { id: "wing-l", path: r(wingL, "owl-wing-l", 1, 5), fill: OWL_DARK, joint: [64, 108], z: 3, pin: true, gait: "wing" },
          {
            id: "wing-r",
            path: r(mirror(wingL), "owl-wing-r", 1, 5),
            fill: OWL_DARK,
            joint: [136, 108],
            z: 3,
            pin: true,
            gait: "wing",
          },
          { id: "feet", path: feet, fill: OWL_OCHRE, joint: [100, 192], z: 4 },
          {
            id: "head",
            path: r(head, "owl-head", 1.2, 6),
            fill: OWL_BROWN,
            joint: [100, 108],
            z: 5,
            pin: true,
            idle: { kind: "sway", duration: 4.8, amount: 3 },
            children: [
              { id: "tuft-l", path: r(tuftL, "owl-tuft-l", 0.8, 4), fill: OWL_BROWN, joint: [70, 50], z: -1 },
              { id: "tuft-r", path: r(mirror(tuftL), "owl-tuft-r", 0.8, 4), fill: OWL_BROWN, joint: [130, 50], z: -1 },
              { id: "discs", path: discs, fill: OWL_CREAM, joint: [100, 76], z: 1 },
              // 一副圆眼镜：墨墨爱思考
              { id: "glasses", path: ring(83, 76, 17, 14.6) + ring(117, 76, 17, 14.6), fill: INK, ink: true, joint: [100, 76], z: 3 },
              {
                id: "eyes",
                path: smooth(ellipse(85, 77, 6.2, 6.8, 14)) + smooth(ellipse(119, 77, 6.2, 6.8, 14)),
                fill: INK,
                ink: true,
                joint: [100, 77],
                z: 2,
                idle: { kind: "blink", duration: 4.2, amount: 0.1 },
              },
              { id: "beak", path: r(beak, "owl-beak", 0.5, 3), fill: OWL_OCHRE, joint: [100, 92], z: 3 },
            ],
          },
        ],
      },
    ],
  };
}

// ── 跳跳（松鼠） ─────────────────────────────────────────────

const SQ_RUST = "#c0703a";
const SQ_CREAM = "#f3dfbf";
const SQ_DARK = "#7c4426";

function squirrelPuppet(): PuppetDef {
  // 侧身坐着，脸朝右；大尾巴在身后卷成问号形
  const body: Point[] = [
    { x: 96, y: 108 },
    { x: 118, y: 116 },
    { x: 128, y: 146 },
    { x: 124, y: 180 },
    { x: 110, y: 194 },
    { x: 80, y: 194 },
    { x: 74, y: 170 },
    { x: 78, y: 132 },
  ];
  const belly: Point[] = [
    { x: 110, y: 124 },
    { x: 122, y: 146 },
    { x: 118, y: 178 },
    { x: 104, y: 188 },
    { x: 98, y: 160 },
    { x: 100, y: 132 },
  ];
  const tail: Point[] = [
    { x: 82, y: 186 },
    { x: 56, y: 182 },
    { x: 34, y: 160 },
    { x: 24, y: 126 },
    { x: 28, y: 88 },
    { x: 44, y: 58 },
    { x: 68, y: 46 },
    { x: 90, y: 52 },
    { x: 96, y: 70 },
    { x: 82, y: 76 },
    { x: 66, y: 72 },
    { x: 54, y: 88 },
    { x: 52, y: 118 },
    { x: 60, y: 148 },
    { x: 76, y: 164 },
  ];
  const tailStripe: Point[] = [
    { x: 40, y: 140 },
    { x: 36, y: 112 },
    { x: 40, y: 86 },
    { x: 52, y: 66 },
    { x: 62, y: 62 },
    { x: 50, y: 82 },
    { x: 46, y: 112 },
    { x: 50, y: 138 },
  ];
  const head: Point[] = [
    { x: 92, y: 74 },
    { x: 110, y: 64 },
    { x: 130, y: 68 },
    { x: 146, y: 84 },
    { x: 148, y: 96 },
    { x: 136, y: 108 },
    { x: 114, y: 114 },
    { x: 96, y: 106 },
    { x: 88, y: 90 },
  ];
  const cheek: Point[] = [
    { x: 124, y: 96 },
    { x: 146, y: 94 },
    { x: 140, y: 106 },
    { x: 124, y: 110 },
    { x: 116, y: 104 },
  ];
  const ear: Point[] = [
    { x: 104, y: 70 },
    { x: 104, y: 42 },
    { x: 120, y: 66 },
  ];
  const earIn: Point[] = [
    { x: 107, y: 66 },
    { x: 107, y: 50 },
    { x: 116, y: 64 },
  ];
  // 小前爪抱着一颗橡果
  const paw = ellipse(130, 140, 8, 6, 12);
  const acorn = ellipse(138, 140, 7, 8, 14);
  const acornCap: Point[] = [
    { x: 130, y: 134 },
    { x: 138, y: 128 },
    { x: 146, y: 134 },
    { x: 138, y: 136 },
  ];
  const hind: Point[] = [
    { x: 88, y: 170 },
    { x: 112, y: 172 },
    { x: 124, y: 192 },
    { x: 116, y: 197 },
    { x: 92, y: 196 },
  ];

  return {
    id: "squirrel",
    viewBox: [200, 200],
    facing: "right",
    signature: { part: "tail", angle: 20 },
    parts: [
      {
        id: "body",
        path: r(body, "sq-body", 1.2, 6),
        fill: SQ_RUST,
        joint: [100, 194],
        z: 0,
        idle: { kind: "breathe", duration: 2.4, amount: 0.04 },
        children: [
          {
            id: "tail",
            path: r(tail, "sq-tail", 1.6, 7),
            fill: SQ_RUST,
            joint: [80, 180],
            z: -1,
            pin: true,
            idle: { kind: "sway", duration: 2.2, amount: 8 },
            children: [{ id: "tail-stripe", path: r(tailStripe, "sq-tail-stripe", 0.8, 5), fill: SQ_DARK, joint: [46, 110], z: 1 }],
          },
          { id: "belly", path: r(belly, "sq-belly", 0.8, 5), fill: SQ_CREAM, joint: [110, 150], z: 1 },
          { id: "hind", path: r(hind, "sq-hind", 0.8, 5), fill: SQ_DARK, joint: [100, 172], z: 2, pin: true, gait: "leg-back" },
          {
            id: "arm",
            path: smooth(paw),
            fill: SQ_DARK,
            joint: [120, 128],
            z: 3,
            gait: "leg-front",
            children: [
              { id: "acorn", path: r(acorn, "sq-acorn", 0.5, 3), fill: SQ_RUST, joint: [138, 140], z: 1 },
              { id: "acorn-cap", path: r(acornCap, "sq-acorn-cap", 0.4, 3), fill: SQ_DARK, joint: [138, 132], z: 2 },
            ],
          },
          {
            id: "head",
            path: r(head, "sq-head", 1, 5),
            fill: SQ_RUST,
            joint: [108, 112],
            z: 4,
            pin: true,
            idle: { kind: "sway", duration: 2.8, amount: 4 },
            children: [
              {
                id: "ear",
                path: r(ear, "sq-ear", 0.6, 4),
                fill: SQ_RUST,
                joint: [110, 68],
                z: -1,
                children: [{ id: "ear-in", path: r(earIn, "sq-ear-in", 0.4, 3), fill: SQ_DARK, joint: [110, 62], z: 1 }],
              },
              { id: "cheek", path: r(cheek, "sq-cheek", 0.6, 4), fill: SQ_CREAM, joint: [132, 102], z: 1 },
              {
                id: "eye",
                path: smooth(ellipse(126, 84, 4.6, 5.4, 12)),
                fill: INK,
                ink: true,
                joint: [126, 84],
                z: 2,
                idle: { kind: "blink", duration: 3.8, amount: 0.12 },
              },
              { id: "nose", path: smooth(ellipse(147, 93, 3, 2.4, 10)), fill: INK, ink: true, joint: [147, 93], z: 2 },
            ],
          },
        ],
      },
    ],
  };
}

// ── 笃笃（啄木鸟） ───────────────────────────────────────────

const WP_BLACK = "#33302d";
const WP_WHITE = "#f4efe4";
const WP_RED = "#c8453a";

function woodpeckerPuppet(): PuppetDef {
  // 竖着抓在树干上：画面右边是树干，身体贴着树、嘴朝右；尾羽向下撑在树干上
  const body: Point[] = [
    { x: 112, y: 86 },
    { x: 126, y: 102 },
    { x: 130, y: 140 },
    { x: 124, y: 170 },
    { x: 108, y: 176 },
    { x: 92, y: 160 },
    { x: 86, y: 126 },
    { x: 92, y: 98 },
  ];
  const chest: Point[] = [
    { x: 116, y: 104 },
    { x: 126, y: 128 },
    { x: 122, y: 160 },
    { x: 112, y: 166 },
    { x: 108, y: 132 },
  ];
  // 尾羽：几根硬羽，向下撑在树上
  const tail: Point[] = [
    { x: 112, y: 166 },
    { x: 128, y: 196 },
    { x: 120, y: 194 },
    { x: 114, y: 186 },
    { x: 106, y: 196 },
    { x: 102, y: 176 },
  ];
  const wing: Point[] = [
    { x: 92, y: 104 },
    { x: 108, y: 110 },
    { x: 110, y: 150 },
    { x: 100, y: 172 },
    { x: 88, y: 156 },
    { x: 84, y: 124 },
  ];
  // 翅膀上的白色横斑
  const bars = [
    ellipse(96, 126, 7, 2.6, 10),
    ellipse(97, 140, 7, 2.6, 10),
    ellipse(98, 154, 6, 2.4, 10),
  ];
  const head = ellipse(114, 72, 22, 21, 22);
  const cap: Point[] = [
    { x: 96, y: 66 },
    { x: 102, y: 52 },
    { x: 116, y: 48 },
    { x: 130, y: 54 },
    { x: 134, y: 64 },
    { x: 118, y: 62 },
  ];
  const cheek: Point[] = [
    { x: 112, y: 76 },
    { x: 134, y: 74 },
    { x: 132, y: 86 },
    { x: 114, y: 88 },
  ];
  const beak: Point[] = [
    { x: 132, y: 68 },
    { x: 162, y: 74 },
    { x: 132, y: 80 },
  ];
  const foot = ellipse(128, 168, 6, 4, 10);

  return {
    id: "woodpecker",
    viewBox: [200, 200],
    facing: "right",
    signature: { part: "head", angle: 14 },
    parts: [
      {
        id: "body",
        path: r(body, "wp-body", 1, 5),
        fill: WP_BLACK,
        joint: [110, 176],
        z: 0,
        idle: { kind: "breathe", duration: 2.6, amount: 0.035 },
        children: [
          { id: "tail", path: r(tail, "wp-tail", 0.8, 4), fill: WP_BLACK, joint: [110, 170], z: -1 },
          { id: "chest", path: r(chest, "wp-chest", 0.8, 4), fill: WP_WHITE, joint: [116, 132], z: 1 },
          {
            id: "wing",
            path: r(wing, "wp-wing", 0.8, 4),
            fill: WP_BLACK,
            joint: [96, 108],
            z: 2,
            pin: true,
            gait: "wing",
            children: [{ id: "wing-bars", path: bars.map(smooth).join(""), fill: WP_WHITE, joint: [97, 140], z: 1 }],
          },
          { id: "foot", path: smooth(foot), fill: WP_BLACK, joint: [128, 168], z: 2 },
          {
            id: "head",
            path: r(head, "wp-head", 0.8, 4),
            fill: WP_BLACK,
            joint: [112, 92],
            z: 3,
            pin: true,
            idle: { kind: "sway", duration: 3, amount: 5 },
            children: [
              { id: "cap", path: r(cap, "wp-cap", 0.6, 4), fill: WP_RED, joint: [116, 56], z: 1 },
              { id: "cheek", path: r(cheek, "wp-cheek", 0.5, 3), fill: WP_WHITE, joint: [122, 80], z: 1 },
              { id: "beak", path: r(beak, "wp-beak", 0.4, 3), fill: WP_WHITE, joint: [134, 74], z: 2 },
              {
                id: "eye",
                path: smooth(ellipse(122, 68, 3.6, 4, 12)),
                fill: INK,
                ink: true,
                joint: [122, 68],
                z: 3,
                idle: { kind: "blink", duration: 4.4, amount: 0.12 },
              },
            ],
          },
        ],
      },
    ],
  };
}

// ── 漂漂（水獭） ─────────────────────────────────────────────

const OT_BROWN = "#8c6142";
const OT_CREAM = "#ead6b8";
/** 和溪流同色，让水獭看起来泡在溪里 */
const OT_WATER = "#9fcbcb";

function otterPuppet(): PuppetDef {
  const mirror = (pts: Point[]) => pts.map((p) => ({ x: 200 - p.x, y: p.y }));
  // 立在水里，胸口以上露出水面，小爪子捧着一片叶子
  const body: Point[] = [
    { x: 100, y: 92 },
    { x: 124, y: 104 },
    { x: 134, y: 140 },
    { x: 132, y: 184 },
    { x: 118, y: 192 },
    { x: 82, y: 192 },
    { x: 68, y: 184 },
    { x: 66, y: 140 },
    { x: 76, y: 104 },
  ];
  const chest = ellipse(100, 146, 22, 30, 18);
  const head = ellipse(100, 74, 32, 27, 22);
  const muzzle = ellipse(100, 86, 17, 12, 16);
  // 上岸后才看得到的下半身：短腿和扁尾巴
  const feet = smooth(ellipse(84, 190, 12, 7, 12)) + smooth(ellipse(116, 190, 12, 7, 12));
  const tail: Point[] = [
    { x: 70, y: 176 },
    { x: 40, y: 186 },
    { x: 26, y: 194 },
    { x: 44, y: 196 },
    { x: 74, y: 190 },
  ];
  const ear = ellipse(74, 56, 7, 6, 10);
  const pawL: Point[] = [
    { x: 80, y: 118 },
    { x: 94, y: 122 },
    { x: 98, y: 132 },
    { x: 88, y: 136 },
    { x: 78, y: 128 },
  ];
  const leafHeld = leaf(100, 124, 30, 12, -0.25);
  // 水面：一圈围在腰间的波纹，正好盖住裁切线（水线 y = 172）
  const water: Point[] = [];
  for (let x = 50; x <= 150; x += 8) water.push({ x, y: 166 + Math.sin(x / 9) * 2 });
  water.push({ x: 158, y: 172 }, { x: 150, y: 172 }, { x: 50, y: 172 }, { x: 42, y: 172 });
  const whiskers = [leaf(80, 88, 14, 1.4, 0.15), leaf(80, 93, 14, 1.4, -0.1), leaf(120, 88, 14, 1.4, -0.15), leaf(120, 93, 14, 1.4, 0.1)];

  return {
    id: "otter",
    viewBox: [200, 200],
    facing: "right",
    signature: { part: "head", angle: 15 },
    waterline: 172,
    parts: [
      {
        id: "body",
        path: r(body, "ot-body", 1.2, 6),
        fill: OT_BROWN,
        joint: [100, 178],
        z: 0,
        idle: { kind: "breathe", duration: 3.2, amount: 0.035 },
        children: [
          { id: "chest", path: r(chest, "ot-chest", 0.8, 5), fill: OT_CREAM, joint: [100, 146], z: 1 },
          { id: "tail", path: r(tail, "ot-tail", 0.8, 4), fill: OT_BROWN, joint: [70, 182], z: -1, idle: { kind: "sway", duration: 2.8, amount: 6 } },
          { id: "feet", path: feet, fill: OT_BROWN, joint: [100, 186], z: 2, gait: "leg-back" },
          {
            id: "paws",
            path: r(pawL, "ot-paw-l", 0.6, 4) + r(mirror(pawL), "ot-paw-r", 0.6, 4),
            fill: OT_BROWN,
            joint: [100, 120],
            z: 3,
            gait: "leg-front",
            children: [{ id: "held-leaf", path: r(leafHeld, "ot-leaf", 0.6, 4), fill: OT_WATER, joint: [100, 124], z: -1 }],
          },
          {
            id: "head",
            path: r(head, "ot-head", 1, 5),
            fill: OT_BROWN,
            joint: [100, 98],
            z: 4,
            pin: true,
            idle: { kind: "sway", duration: 3.6, amount: 5 },
            children: [
              { id: "ear-l", path: r(ear, "ot-ear-l", 0.5, 3), fill: OT_BROWN, joint: [74, 56], z: -1 },
              { id: "ear-r", path: r(mirror(ear), "ot-ear-r", 0.5, 3), fill: OT_BROWN, joint: [126, 56], z: -1 },
              { id: "muzzle", path: r(muzzle, "ot-muzzle", 0.6, 4), fill: OT_CREAM, joint: [100, 86], z: 1 },
              {
                id: "eyes",
                path: smooth(ellipse(88, 70, 3.6, 4.2, 12)) + smooth(ellipse(112, 70, 3.6, 4.2, 12)),
                fill: INK,
                ink: true,
                joint: [100, 70],
                z: 2,
                idle: { kind: "blink", duration: 5.4, amount: 0.12 },
              },
              { id: "nose", path: smooth(ellipse(100, 81, 5, 3.6, 12)), fill: INK, ink: true, joint: [100, 81], z: 2 },
              { id: "whiskers", path: whiskers.map(smooth).join(""), fill: INK, ink: true, joint: [100, 90], z: 2 },
            ],
          },
        ],
      },
      // 水面纸条画在身体前面；随水轻轻起伏
      {
        id: "water",
        path: r(water, "ot-water", 1, 6),
        fill: OT_WATER,
        joint: [100, 184],
        z: 1,
        waterOnly: true,
        idle: { kind: "sway", duration: 2.6, amount: 2 },
      },
    ],
  };
}

// ── 慢慢（乌龟） ─────────────────────────────────────────────

const TT_SHELL = "#5f7f4a";
const TT_SCUTE = "#a9b77a";
const TT_SKIN = "#9aa56a";

function turtlePuppet(): PuppetDef {
  // 侧身趴着，头朝右伸出；龟壳是一个圆顶，上面几块六角形的甲片
  const shell: Point[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (i / 16) * Math.PI;
    shell.push({ x: 96 + Math.cos(a) * 62, y: 168 + Math.sin(a) * 52 });
  }
  shell.push({ x: 158, y: 176 }, { x: 34, y: 176 });
  const rim: Point[] = [
    { x: 30, y: 166 },
    { x: 162, y: 166 },
    { x: 160, y: 180 },
    { x: 32, y: 180 },
  ];
  const hex = (cx: number, cy: number, rr: number): Point[] =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * 0.8 };
    });
  const scutes = [hex(96, 132, 16), hex(66, 148, 13), hex(126, 148, 13), hex(80, 160, 9), hex(112, 160, 9)];
  const head: Point[] = [
    { x: 150, y: 148 },
    { x: 168, y: 136 },
    { x: 186, y: 138 },
    { x: 194, y: 150 },
    { x: 188, y: 162 },
    { x: 168, y: 166 },
    { x: 152, y: 166 },
  ];
  const leg = (x: number): Point[] => [
    { x: x - 9, y: 172 },
    { x: x + 9, y: 172 },
    { x: x + 11, y: 194 },
    { x: x - 11, y: 196 },
  ];
  const tail: Point[] = [
    { x: 36, y: 168 },
    { x: 18, y: 176 },
    { x: 36, y: 178 },
  ];
  // 眯眯眼：一道向下弯的细弧，看起来很悠闲
  const eye = leaf(178, 146, 10, 2.4, 0.1);
  const smile = leaf(184, 158, 10, 1.6, -0.35);

  return {
    id: "turtle",
    viewBox: [200, 200],
    facing: "right",
    signature: { part: "head", angle: 10 },
    parts: [
      {
        id: "body",
        path: r(rim, "tt-rim", 0.6, 5),
        fill: TT_SKIN,
        joint: [96, 194],
        z: 0,
        children: [
          { id: "tail", path: r(tail, "tt-tail", 0.4, 3), fill: TT_SKIN, joint: [36, 172], z: -1 },
          { id: "leg-bl", path: r(leg(52), "tt-leg-bl", 0.6, 4), fill: TT_SKIN, joint: [52, 172], z: -1, gait: "leg-back" },
          { id: "leg-br", path: r(leg(136), "tt-leg-br", 0.6, 4), fill: TT_SKIN, joint: [136, 172], z: -1, gait: "leg-front" },
          { id: "leg-fl", path: r(leg(68), "tt-leg-fl", 0.6, 4), fill: TT_SKIN, joint: [68, 172], z: 2, pin: true, gait: "leg-front" },
          { id: "leg-fr", path: r(leg(122), "tt-leg-fr", 0.6, 4), fill: TT_SKIN, joint: [122, 172], z: 2, pin: true, gait: "leg-back" },
          {
            id: "shell",
            path: r(shell, "tt-shell", 1.2, 6),
            fill: TT_SHELL,
            joint: [96, 172],
            z: 1,
            idle: { kind: "breathe", duration: 4.2, amount: 0.03 },
            children: [{ id: "scutes", path: scutes.map((h, i) => r(h, `tt-scute-${i}`, 0.5, 4)).join(""), fill: TT_SCUTE, joint: [96, 148], z: 1 }],
          },
          {
            id: "head",
            path: r(head, "tt-head", 0.8, 5),
            fill: TT_SKIN,
            joint: [152, 158],
            z: 3,
            pin: true,
            idle: { kind: "sway", duration: 5.6, amount: 4 },
            children: [
              { id: "eye", path: smooth(eye), fill: INK, ink: true, joint: [178, 146], z: 1, idle: { kind: "blink", duration: 6, amount: 0.2 } },
              { id: "smile", path: smooth(smile), fill: INK, ink: true, joint: [184, 158], z: 1 },
            ],
          },
        ],
      },
    ],
  };
}

// ── 岁岁（古树） ─────────────────────────────────────────────
// 古树本身是场景的一部分；这里是它在角色卡上的小纸偶：一截树桩横截面，一圈圈年轮，一张慈祥的脸

const TREE_BARK = "#7d5a3e";
const TREE_WOOD = "#e7cfa4";
const TREE_RING = "#c9a578";
const TREE_LEAF = "#6c9a6c";

function treePuppet(): PuppetDef {
  const outer = ellipse(100, 120, 72, 70, 30);
  const wood = ellipse(100, 120, 62, 60, 28);
  // 年轮：几道同心的细环（外圆 + 反向内圆）
  const ringBand = (rr: number) =>
    smooth(ellipse(100, 122, rr, rr * 0.97, 30)) + smooth(ellipse(100, 122, rr - 3, (rr - 3) * 0.97, 30).reverse());
  const rings = [52, 40, 28, 16].map(ringBand).join("");
  // 闭着的弯弯眼和微笑：像老爷爷在打盹
  const eyeL = leaf(80, 110, 16, 3.4, 0.15);
  const eyeR = leaf(120, 110, 16, 3.4, -0.15);
  const smile = leaf(100, 140, 22, 3, 0);
  const sproutStem: Point[] = [
    { x: 98, y: 52 },
    { x: 102, y: 52 },
    { x: 103, y: 30 },
    { x: 99, y: 30 },
  ];
  const leafL = leaf(88, 28, 26, 12, -0.5);
  const leafR = leaf(114, 22, 30, 13, 0.45);

  return {
    id: "tree",
    viewBox: [200, 200],
    facing: "right",
    signature: { part: "sprout", angle: 18 },
    parts: [
      {
        id: "body",
        path: r(outer, "tree-bark", 1.8, 8),
        fill: TREE_BARK,
        joint: [100, 190],
        z: 0,
        idle: { kind: "breathe", duration: 4.6, amount: 0.025 },
        children: [
          {
            id: "wood",
            path: r(wood, "tree-wood", 1, 6),
            fill: TREE_WOOD,
            joint: [100, 120],
            z: 1,
            children: [
              { id: "rings", path: rings, fill: TREE_RING, joint: [100, 122], z: 1 },
              {
                id: "eyes",
                path: smooth(eyeL) + smooth(eyeR),
                fill: INK,
                ink: true,
                joint: [100, 110],
                z: 2,
                idle: { kind: "blink", duration: 6, amount: 0.4 },
              },
              { id: "smile", path: smooth(smile), fill: INK, ink: true, joint: [100, 140], z: 2 },
            ],
          },
          {
            id: "sprout",
            path: r(sproutStem, "tree-stem", 0.3, 3),
            fill: TREE_LEAF,
            joint: [100, 52],
            z: 2,
            pin: true,
            idle: { kind: "sway", duration: 3.4, amount: 8 },
            children: [{ id: "leaves", path: r(leafL, "tree-leaf-l", 0.6, 4) + r(leafR, "tree-leaf-r", 0.6, 4), fill: TREE_LEAF, joint: [100, 30], z: 1 }],
          },
        ],
      },
    ],
  };
}

export const ANIMALS: Record<CharacterId, AnimalDef> = {
  tree: {
    id: "tree",
    name: "岁岁",
    species: "古树",
    mindset: "森林守护者",
    summary: "听完大家的话，帮你把它们串起来，再把这次的成长收进年轮里。",
    basis: "整合各方视角",
    tone: "苍老温和，话不多但有分量",
    sample: "孩子，风会停的。我们一起看看，这一次你学会了什么。",
    puppet: treePuppet(),
  },
  turtle: {
    id: "turtle",
    name: "慢慢",
    species: "乌龟",
    mindset: "时间视角",
    summary: "把事情放到更长的时间里看看，再慢慢回到当下。",
    basis: "10-10-10 法则 + 正念",
    tone: "慢悠悠、豁达，爱讲「很久以前」",
    sample: "很久以前啊……我也以为天要塌了。十年后再看，它只是一阵风。",
    game: { id: "shell-breath", name: "龟壳呼吸" },
    puppet: turtlePuppet(),
  },
  otter: {
    id: "otter",
    name: "漂漂",
    species: "水獭",
    mindset: "放下与解离",
    summary: "想法只是想法，像水上的叶子，看着它漂走就好。",
    basis: "接纳承诺疗法（ACT）认知解离",
    tone: "轻松随性，爱玩水",
    sample: "这个念头呀，就像一片叶子，我们看着它漂远一点？",
    game: { id: "leaf-float", name: "落叶漂流" },
    puppet: otterPuppet(),
  },
  woodpecker: {
    id: "woodpecker",
    name: "笃笃",
    species: "啄木鸟",
    mindset: "情绪觉察",
    summary: "先承认、说出自己的情绪。情绪是信号，不是敌人。",
    basis: "情绪标注（Affect Labeling）",
    tone: "直爽有劲，句子短",
    sample: "笃笃笃！先别憋着。你现在，是什么感觉？",
    game: { id: "knock-tree", name: "敲树洞" },
    puppet: woodpeckerPuppet(),
  },
  squirrel: {
    id: "squirrel",
    name: "跳跳",
    species: "松鼠",
    mindset: "行动派",
    summary: "把大问题拆成今天就能做的一小步，先动起来再说！",
    basis: "问题解决疗法 / 行为激活",
    tone: "活泼，急性子，有干劲",
    sample: "别光想啦！先挑一件最小的事，现在就去做！",
    game: { id: "hide-nuts", name: "藏坚果" },
    puppet: squirrelPuppet(),
  },
  owl: {
    id: "owl",
    name: "墨墨",
    species: "猫头鹰",
    mindset: "理性分析",
    summary: "分清事实和猜测，看看自己有没有掉进思维陷阱。",
    basis: "认知行为疗法（CBT）",
    tone: "冷静睿智，爱提问",
    sample: "这件事里，哪些是真的发生了，哪些是你猜的？",
    game: { id: "fact-or-guess", name: "事实还是猜测" },
    puppet: owlPuppet(),
  },
  bear: {
    id: "bear",
    name: "团团",
    species: "熊",
    mindset: "自我关怀",
    summary: "像对待好朋友那样，温柔地对待自己。",
    basis: "自我关怀（Self-compassion）",
    tone: "温柔，说话慢，会抱抱",
    sample: "你已经很努力啦……来，先抱一下，我们慢慢说。",
    game: { id: "bear-hug", name: "熊抱" },
    puppet: bearPuppet(),
  },
  fox: {
    id: "fox",
    name: "阿橘",
    species: "狐狸",
    mindset: "换个角度",
    summary: "同一件事总有另一面，换个角度，也许能笑出来。",
    basis: "认知重构（Reframing）",
    tone: "机灵俏皮，但不轻浮",
    sample: "嘿，先别急着给这件事判死刑——把它翻过来看看背面写着什么？",
    game: { id: "flip-mirror", name: "翻面镜" },
    puppet: foxPuppet(),
  },
};

/** 7 只动物（不含古树），带上收窄后的 id 类型，方便按动物处理 */
export const ANIMAL_CAST: (AnimalDef & { id: AnimalId })[] = (
  ["woodpecker", "owl", "squirrel", "otter", "turtle", "bear", "fox"] as const
).map((id) => ({ ...ANIMALS[id], id }));
