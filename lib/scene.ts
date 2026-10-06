/**
 * 场景纸层定义（素材集中处之一）。
 * 舞台坐标：x ∈ [-1500, 1500]（中心为 0），y ∈ [0, 1000]（顶部为 0）。
 * 竖屏手机大约只能看到 x ∈ [-280, 280]，所以重要元素集中在中间；两侧是给横屏和视差用的。
 * 以后换成画师素材时，保持 SceneLayer 结构不变即可。
 */
import type { Point } from "./paper/geometry";
import { translate } from "./paper/geometry";
import { seeded } from "./paper/random";
import { pathFromPoints, roughPath } from "./paper/roughen";
import { blob, crescent, ellipse, leaf, ridge, treeLine } from "./paper/shapes";
import { GROUND, groundY, streamDepthAt, streamHalfWidthAt } from "./forest/ground";
import type { Palette } from "./scene/lighting";

export type LayerId = "sky" | "hills" | "farTrees" | "forest" | "meadow" | "fore";

export interface PaperPiece {
  /** 已经过 roughen 的 SVG path，可以包含多个子路径 */
  d: string;
  /** 纸色：对应 lighting 的 palette 键；也可以是固定颜色 */
  fill: keyof Palette | `#${string}` | "glow";
  /** 镂空纹样：用遮罩从纸片里挖掉（不用 evenodd，避免重叠的子路径互相挖空） */
  cutouts?: string;
  /** 投影距离（舞台单位），0 表示不投影 */
  shadow: number;
  opacity?: number;
}

export interface SceneLayer {
  id: LayerId;
  /** 离前景的距离（CSS px，translateZ 为负） */
  depth: number;
  pieces: PaperPiece[];
  /** 低画质时可以隐藏 */
  optional?: boolean;
}

export const PERSPECTIVE = 1000;
/** 舞台在视口四周额外留出的视差余量（px） */
export const PARALLAX_MARGIN = 36;

/** 入林晨雾：三层手剪纸边，左右纸片在转场时拉开。 */
export const ONBOARDING_MIST = [0, 1, 2].map((index) => {
  const edge = Array.from({ length: 13 }, (_, i) => ({
    x: 80 + Math.sin(i * 1.3 + index) * 65,
    y: -100 + i * 100,
  }));
  return {
    left: roughPath([{ x: -1700, y: -100 }, ...edge, { x: -1700, y: 1100 }], { seed: `mist-left-${index}`, amplitude: 3, step: 18 }),
    right: roughPath([{ x: 1700, y: -100 }, ...edge.map((p) => ({ x: -p.x, y: p.y })), { x: 1700, y: 1100 }], { seed: `mist-right-${index}`, amplitude: 3, step: 18 }),
    opacity: 0.45 + index * 0.2,
  };
});

const X0 = -1560;
const X1 = 1560;
const BOTTOM = 1060;

const rough = (pts: Point[], seed: string, amplitude = 3, step = 14) => roughPath(pts, { seed, amplitude, step });

function cloud(seed: string, cx: number, cy: number, w: number): string {
  const rng = seeded(seed);
  const parts = [
    blob(rng, cx - w * 0.3, cy + w * 0.05, w * 0.22, { wobble: 0.08, segments: 14 }),
    blob(rng, cx, cy - w * 0.05, w * 0.3, { wobble: 0.08, segments: 16 }),
    blob(rng, cx + w * 0.32, cy + w * 0.06, w * 0.2, { wobble: 0.08, segments: 14 }),
  ];
  return parts.map((p, i) => rough(p, `${seed}-${i}`, 2, 10)).join("");
}

function sky(): SceneLayer {
  return {
    id: "sky",
    depth: 1600,
    pieces: [
      { d: cloud("cloud-a", -420, 170, 300), fill: "cloud", shadow: 0, opacity: 0.9 },
      { d: cloud("cloud-b", 380, 120, 240), fill: "cloud", shadow: 0, opacity: 0.85 },
      { d: cloud("cloud-c", 1150, 210, 320), fill: "cloud", shadow: 0, opacity: 0.8 },
      { d: cloud("cloud-d", -1150, 140, 260), fill: "cloud", shadow: 0, opacity: 0.8 },
    ],
  };
}

function hills(): SceneLayer {
  const back = ridge(seeded("hills-back"), { x0: X0, x1: X1, baseY: 430, amplitude: 90, bottomY: BOTTOM, step: 40 });
  const front = ridge(seeded("hills-front"), { x0: X0, x1: X1, baseY: 500, amplitude: 60, bottomY: BOTTOM, step: 34 });
  return {
    id: "hills",
    depth: 900,
    pieces: [
      { d: rough(back, "hills-back", 4, 22), fill: "hillFar", shadow: 0, opacity: 0.75 },
      { d: rough(front, "hills-front", 4, 20), fill: "hillFar", shadow: 6 },
    ],
  };
}

function farTrees(): SceneLayer {
  const line = treeLine(seeded("far-trees"), {
    x0: X0,
    x1: X1,
    baseY: 640,
    bottomY: BOTTOM,
    minH: 90,
    maxH: 190,
    spacing: 80,
    step: 8,
  });
  return {
    id: "farTrees",
    depth: 550,
    optional: true,
    pieces: [{ d: rough(line, "far-trees", 2.5, 10), fill: "treeFar", shadow: 8 }],
  };
}

/** 古树树冠：几团大叶簇拼成，挖出叶形和月牙镂空（坐标为缩放前） */
function ancientCrown(): { crown: string; cutouts: string } {
  const rng = seeded("ancient-crown");
  const clusters: [number, number, number][] = [
    [0, 250, 210],
    [-180, 300, 150],
    [180, 300, 150],
    [-110, 175, 140],
    [120, 170, 135],
    [0, 130, 120],
  ];
  const crown = clusters
    .map(([x, y, r], i) =>
      rough(placeTree(blob(rng, x, y, r, { wobble: 0.1, segments: 22, squashY: 0.82 })), `crown-${i}`, 3, 12),
    )
    .join("");
  // 镂空：传统剪纸常见的叶形和月牙纹，挖在树冠里面
  const holes: Point[][] = [];
  const spots: [number, number, number][] = [
    [-120, 260, 0.6],
    [-40, 210, -0.4],
    [60, 270, 0.3],
    [140, 220, -0.8],
    [-170, 330, 1.2],
    [170, 340, -1.1],
    [10, 150, 0],
    [-80, 330, -0.2],
    [90, 160, 0.9],
  ];
  for (const [x, y, a] of spots) holes.push(leaf(x, y, 46, 18, a));
  holes.push(crescent(-30, 300, 16, 0.4), crescent(110, 120, 12, 2.4), crescent(-150, 180, 13, 1.2));
  const cutouts = holes.map((h, i) => rough(placeTree(h), `crown-hole-${i}`, 0.8, 5)).join("");
  return { crown, cutouts };
}

export interface AncientTree {
  /** 树干 + 根（舞台坐标，已平移到古树位置） */
  trunk: string;
  /** 树洞（松鼠住在这里） */
  hollow: string;
  crown: string;
  cutouts: string;
  /** 伸出的树枝（猫头鹰站在上面） */
  branch: string;
}

/** 古树位于中景树林层的舞台中央偏后。下面的坐标按「根部在 y = 790」画，再整体缩放到 TREE_SCALE。 */
export const TREE_BASE_Y = 790;
export const TREE_SCALE = 0.66;

const placeTree = (pts: Point[]): Point[] =>
  pts.map((p) => ({ x: p.x * TREE_SCALE, y: TREE_BASE_Y + (p.y - TREE_BASE_Y) * TREE_SCALE }));

/** 古树上的几个关键位置（舞台坐标，已缩放），动物会挂在这些位置上 */
export const TREE_SPOTS = {
  hollow: placeTree([{ x: 0, y: 620 }])[0],
  branchTip: placeTree([{ x: 230, y: 436 }])[0],
  trunkSide: placeTree([{ x: -56, y: 560 }])[0],
  crownTop: placeTree([{ x: 0, y: 40 }])[0],
};

/**
 * 古树的可点区域（舞台坐标，(x, y) 是底边中点，和 WorldActor 一致）。
 * 放在树冠上：树干被啄木鸟、松鼠和树枝上的猫头鹰占着，树冠又大又空，手机上最好点。
 * depth 用 forest 纸层的深度，所以 WorldActor 里 perspectiveScale 要关掉，投影才和纸层一致。
 */
export const TREE_HOTSPOT = { x: 0, y: 465, width: 340, height: 195, depth: 280 };

export function ancientTree(): AncientTree {
  const trunkPts: Point[] = [
    { x: -62, y: 360 },
    { x: -48, y: 520 },
    { x: -58, y: 680 },
    { x: -120, y: 760 },
    { x: -170, y: 790 },
    { x: 170, y: 790 },
    { x: 120, y: 760 },
    { x: 60, y: 680 },
    { x: 50, y: 520 },
    { x: 66, y: 360 },
  ];
  const branchPts: Point[] = [
    { x: 40, y: 470 },
    { x: 150, y: 440 },
    { x: 250, y: 430 },
    { x: 262, y: 446 },
    { x: 160, y: 462 },
    { x: 46, y: 500 },
  ];
  const { crown, cutouts } = ancientCrown();
  return {
    trunk: rough(placeTree(trunkPts), "ancient-trunk", 2.5, 10),
    hollow: rough(placeTree(ellipse(0, 620, 26, 36, 18)), "ancient-hollow", 1.2, 5),
    crown,
    cutouts,
    branch: rough(placeTree(branchPts), "ancient-branch", 1.5, 8),
  };
}

function forest(): SceneLayer {
  const rng = seeded("forest-mid");
  const bushes = [-900, -620, -360, 360, 640, 920, 1240, -1240].map((x, i) =>
    rough(blob(rng, x, 700, 150 + (i % 3) * 30, { wobble: 0.12, segments: 20, squashY: 0.7 }), `bush-${i}`, 3, 14),
  );
  const tree = ancientTree();
  return {
    id: "forest",
    depth: 280,
    pieces: [
      { d: bushes.join(""), fill: "forestMid", shadow: 10 },
      { d: tree.branch, fill: "trunk", shadow: 8 },
      { d: tree.trunk, fill: "trunk", shadow: 12 },
      { d: tree.hollow, fill: "#3b2a1f", shadow: 0 },
      { d: tree.crown, cutouts: tree.cutouts, fill: "forestMid", shadow: 14 },
    ],
  };
}

function meadow(): SceneLayer {
  const ground = ridge(seeded("meadow"), { x0: X0, x1: X1, baseY: 760, amplitude: 22, bottomY: BOTTOM, step: 30 });
  // 溪流：形状由 lib/forest/ground 的地面模型给出，水獭漂在中线上，其他动物不会走进去
  const streamTop: Point[] = [];
  const streamBottom: Point[] = [];
  for (let x = X1; x >= GROUND.streamStartX; x -= 40) {
    const d = streamDepthAt(x);
    const hw = streamHalfWidthAt(x);
    streamTop.push({ x, y: groundY(d + hw) });
    streamBottom.unshift({ x, y: groundY(d - hw) });
  }
  const tip = streamTop[streamTop.length - 1];
  const stream = [...streamTop, { x: tip.x - 24, y: tip.y + 4 }, ...streamBottom];
  return {
    id: "meadow",
    depth: 110,
    pieces: [
      { d: rough(ground, "meadow", 3, 16), fill: "meadow", shadow: 10 },
      { d: rough(stream, "stream", 2, 12), fill: "stream", shadow: 0 },
    ],
  };
}

function fore(): SceneLayer {
  const rng = seeded("fore");
  const blades: string[] = [];
  const clumps = [-1300, -980, -700, -430, -250, 250, 430, 700, 980, 1300];
  clumps.forEach((cx, i) => {
    for (let j = 0; j < 5; j++) {
      const h = 70 + rng() * 70;
      const x = cx + (j - 2) * 14;
      const lean = (rng() - 0.5) * 0.5;
      blades.push(rough(leaf(x + Math.sin(lean) * h * 0.5, 1000 - h / 2, h, 16, -Math.PI / 2 + lean), `blade-${i}-${j}`, 0.8, 6));
    }
  });
  const flowers = [-560, -180, 200, 560, 1100, -1100].map((x, i) => {
    const y = 950 - (i % 2) * 20;
    const petals = Array.from({ length: 5 }, (_, k) => {
      const a = (k / 5) * Math.PI * 2;
      return pathFromPoints(leaf(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 16, 9, a));
    });
    return petals.join("");
  });
  const centers = [-560, -180, 200, 560, 1100, -1100].map((x, i) =>
    pathFromPoints(ellipse(x, 950 - (i % 2) * 20, 4.5, 4.5, 10)),
  );
  const ground = translate(
    ridge(seeded("fore-ground"), { x0: X0, x1: X1, baseY: 985, amplitude: 10, bottomY: BOTTOM, step: 30 }),
    0,
    0,
  );
  return {
    id: "fore",
    depth: 0,
    pieces: [
      { d: rough(ground, "fore-ground", 2, 14), fill: "fore", shadow: 6 },
      { d: blades.join(""), fill: "fore", shadow: 6 },
      { d: flowers.join(""), fill: "bloom", shadow: 4 },
      { d: centers.join(""), fill: "bloomCenter", shadow: 0 },
    ],
  };
}

/** 6 个纸层，由远到近 */
export const SCENE_LAYERS: readonly SceneLayer[] = [sky(), hills(), farTrees(), forest(), meadow(), fore()];

export function layerById(id: LayerId): SceneLayer {
  const layer = SCENE_LAYERS.find((l) => l.id === id);
  if (!layer) throw new Error(`未知纸层：${id}`);
  return layer;
}