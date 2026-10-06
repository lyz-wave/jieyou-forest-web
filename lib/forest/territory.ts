/**
 * 每只动物的领地（活动范围）和移动习性。
 * 领地由一组锚点组成；动物走动就是从当前锚点移到同一领地的另一个锚点。
 * 竖屏手机只能看到舞台中间约 ±250 的宽度，所以竖屏和横屏各有一套锚点。
 */
import type { AnimalId } from "../animals";
import { onGround, streamCenterY, streamDepthAt, type WorldPos } from "./ground";

export type Layout = "portrait" | "landscape";

export const ANIMAL_IDS: readonly AnimalId[] = ["woodpecker", "owl", "squirrel", "otter", "turtle", "bear", "fox"];

/** 动物在这块地方的姿态 */
export type Perch = "ground" | "trunk" | "branch" | "hollow" | "water";

export interface Territory {
  perch: Perch;
  anchors: WorldPos[];
}

export interface Habit {
  /** 地面移动速度（舞台单位 / 秒） */
  speed: number;
  canFly: boolean;
  canSwim: boolean;
  /** 竖屏 / 横屏下纸偶站在草地最近处时的舞台尺寸；越远按 sizeAt() 缩小 */
  size: Record<Layout, number>;
}

export const HABITS: Record<AnimalId, Habit> = {
  woodpecker: { speed: 60, canFly: true, canSwim: false, size: { portrait: 80, landscape: 88 } },
  owl: { speed: 40, canFly: true, canSwim: false, size: { portrait: 112, landscape: 124 } },
  squirrel: { speed: 150, canFly: false, canSwim: false, size: { portrait: 72, landscape: 78 } },
  otter: { speed: 45, canFly: false, canSwim: true, size: { portrait: 104, landscape: 116 } },
  turtle: { speed: 18, canFly: false, canSwim: false, size: { portrait: 92, landscape: 104 } },
  bear: { speed: 50, canFly: false, canSwim: false, size: { portrait: 140, landscape: 160 } },
  fox: { speed: 85, canFly: false, canSwim: false, size: { portrait: 116, landscape: 130 } },
};

/** 古树所在的深度：中景树林纸层在 280，树上的动物贴在它前面 */
export const TREE_DEPTH = 274;
/** 树干上能看到的最低处（再往下被草地纸层挡住），爬树时在这里起跳 / 落脚 */
export const TREE_CLIMB_BOTTOM_Y = 740;

/**
 * 树干左侧表面（啄木鸟抓的位置）。纸偶里树干在它右边，爪子在 viewBox x≈128 处；
 * 纸偶宽度的 0.14 偏移让爪子正好贴在树皮边缘上。
 */
const trunkLeft = (y: number): WorldPos => ({ x: -46, y, depth: TREE_DEPTH });
/** 树枝顶面（猫头鹰站的位置） */
const branchTop = (x: number): WorldPos => ({ x, y: 559 - (x - 99) * 0.1, depth: TREE_DEPTH });
/** 树洞口：脚踩在洞的下沿，上半身探出洞口 */
const hollow = (dx = 0): WorldPos => ({ x: dx, y: 703, depth: TREE_DEPTH });
/** 溪流中线上一点 */
const inWater = (x: number): WorldPos => ({ x, y: streamCenterY(x), depth: streamDepthAt(x) });
/** 溪流前方的岸边（离水中线 dd 深度） */
const bank = (x: number, dd: number): WorldPos => onGround(x, streamDepthAt(x) - dd);

export const TERRITORIES: Record<Layout, Record<AnimalId, Territory>> = {
  portrait: {
    woodpecker: { perch: "trunk", anchors: [trunkLeft(640), trunkLeft(600), trunkLeft(680)] },
    owl: { perch: "branch", anchors: [branchTop(118), branchTop(146)] },
    squirrel: { perch: "hollow", anchors: [hollow(), hollow(4)] },
    otter: { perch: "water", anchors: [inWater(40), inWater(85)] },
    turtle: { perch: "ground", anchors: [bank(-60, 18), bank(-90, 20)] },
    bear: { perch: "ground", anchors: [onGround(-170, 34), onGround(-195, 44)] },
    fox: { perch: "ground", anchors: [onGround(165, 30), onGround(185, 40), onGround(150, 24)] },
  },
  landscape: {
    woodpecker: { perch: "trunk", anchors: [trunkLeft(640), trunkLeft(590), trunkLeft(690)] },
    owl: { perch: "branch", anchors: [branchTop(118), branchTop(146), branchTop(160)] },
    squirrel: { perch: "hollow", anchors: [hollow(), hollow(4)] },
    otter: { perch: "water", anchors: [inWater(300), inWater(420), inWater(540)] },
    // 乌龟的落脚点要和水獭离远些：横屏下这两只都站在溪流一带，
    // 补到 44px 的可点区域会相交（E2E「布局与热区」量得出来）
    turtle: { perch: "ground", anchors: [bank(190, 24), bank(170, 24), bank(260, 26)] },
    bear: { perch: "ground", anchors: [onGround(-420, 40), onGround(-340, 50), onGround(-500, 34)] },
    fox: { perch: "ground", anchors: [onGround(-200, 30), onGround(-140, 40), onGround(-260, 26)] },
  },
};

/** 草地上用来聚拢的空地中心（舞台 x 与深度） */
export const CLEARING = { x: 0, depth: 40 };

export function homeOf(layout: Layout, id: AnimalId): WorldPos {
  return TERRITORIES[layout][id].anchors[0];
}
