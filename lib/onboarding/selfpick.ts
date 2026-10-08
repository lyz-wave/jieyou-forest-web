/**
 * 引导式选伙伴：问「此刻想被怎么对待」，而不是「你是什么样的人」。
 * 答案只用来推荐一位此刻可能合适的伙伴：不推断人格、不分类、不上传。
 */
import { ANIMALS, type AnimalId } from "../animals";

/** 七种「此刻想被怎么对待」，各自对应一只动物的办法 */
export type WantKind =
  | "understood"
  | "comforted"
  | "reframe"
  | "small-step"
  | "let-go"
  | "see-clearly"
  | "long-view"
  /** 中立选项（「说不好」）：算作答过了，但不投给任何一只动物 */
  | "unsure";

export interface SelfPickOption {
  /** 选项对应的陪伴方式；中立选项（「说不好」）为 null */
  kind: WantKind | null;
  /** 选中时给这只动物加一票；中立选项为 null */
  animal: AnimalId | null;
  label: string;
}

export interface SelfPickQuestion {
  id: "want" | "now" | "long";
  ask: string;
  hint?: string;
  /** 最多能选几项 */
  max: 1 | 2;
  options: readonly SelfPickOption[];
}

export const SELF_PICK_QUESTIONS: readonly SelfPickQuestion[] = [
  {
    id: "want",
    ask: "此刻，你最想被怎么对待？",
    hint: "最多选两个，也可以两个都想",
    max: 2,
    options: [
      { kind: "understood", animal: "woodpecker", label: "被理解，有人先听我说" },
      { kind: "comforted", animal: "bear", label: "被抱一下，被温柔对待" },
      { kind: "reframe", animal: "fox", label: "换个角度看这件事" },
      { kind: "small-step", animal: "squirrel", label: "先做一件能做的小事" },
      { kind: "let-go", animal: "otter", label: "先放一放，松一口气" },
      { kind: "see-clearly", animal: "owl", label: "看清那件事是真的，还是我想的" },
    ],
  },
  {
    id: "now",
    ask: "现在，你更想要哪一种？",
    max: 1,
    options: [
      { kind: "see-clearly", animal: "owl", label: "有人陪我一起把它想明白" },
      { kind: "small-step", animal: "squirrel", label: "先动一动，做点什么" },
      { kind: "let-go", animal: "otter", label: "先什么也不做，缓一缓" },
      { kind: "unsure", animal: null, label: "说不好，先看看" },
    ],
  },
  {
    id: "long",
    ask: "要不要把这件事放到更长的时间里看看？",
    max: 1,
    options: [
      { kind: "long-view", animal: "turtle", label: "想，往远处看一点" },
      { kind: "unsure", animal: null, label: "不用，先看眼前" },
      { kind: "let-go", animal: "otter", label: "不用，我想先缓一缓" },
    ],
  },
];

export interface SelfPickAnswers {
  want: WantKind[];
  now: WantKind[];
  long: WantKind[];
}

export const EMPTY_ANSWERS: SelfPickAnswers = { want: [], now: [], long: [] };

export function isComplete(answers: SelfPickAnswers): boolean {
  return answers.want.length > 0 && answers.now.length > 0 && answers.long.length > 0;
}

/** 答案里选中的陪伴方式，按题目顺序；中立选项不进 */
function chosenKinds(answers: SelfPickAnswers): WantKind[] {
  return [...answers.want, ...answers.now, ...answers.long];
}

/** 选中过的说法，用来告诉用户「为什么是它」 */
function chosenLabels(answers: SelfPickAnswers): string[] {
  const kinds = new Set(chosenKinds(answers));
  const labels: string[] = [];
  for (const question of SELF_PICK_QUESTIONS) {
    for (const option of question.options) {
      if (option.kind && option.kind !== "unsure" && kinds.has(option.kind) && !labels.includes(option.label)) labels.push(option.label);
    }
  }
  return labels;
}

/**
 * 每只动物的票数 = 答案里出现过几次对应它的陪伴方式。
 * 平票时后答的题优先（更接近此刻最终的意愿），所以遍历时用 >= 覆盖。
 */
export function recommend(answers: SelfPickAnswers): AnimalId | null {
  if (!isComplete(answers)) return null;
  const score = new Map<AnimalId, number>();
  for (const question of SELF_PICK_QUESTIONS) {
    const chosen = new Set(answers[question.id]);
    for (const option of question.options) {
      if (!option.animal || !option.kind || !chosen.has(option.kind)) continue;
      score.set(option.animal, (score.get(option.animal) ?? 0) + 1);
    }
  }
  let best: AnimalId | null = null;
  let bestScore = 0;
  for (const question of SELF_PICK_QUESTIONS) {
    const chosen = new Set(answers[question.id]);
    for (const option of question.options) {
      if (!option.animal || !option.kind || !chosen.has(option.kind)) continue;
      const votes = score.get(option.animal) ?? 0;
      if (votes >= bestScore) {
        best = option.animal;
        bestScore = votes;
      }
    }
  }
  return best;
}

/** 一句「为什么是它」：只用当时的说法，不做人格判断 */
export function recommendLine(answers: SelfPickAnswers, animal: AnimalId): string {
  const labels = chosenLabels(answers);
  const def = ANIMALS[animal];
  const head = labels.length > 0 ? "你现在更需要「" + labels.join("」「") + "」。" : "";
  return head + def.name + "的办法是：" + def.summary + "想去和它待一会儿吗？";
}

/** 存进资料的一条选择记录：时间、想被怎么陪、最后选了谁、是自己挑还是问出来的 */
export interface SelfPick {
  at: number;
  want: WantKind[];
  animalId: AnimalId;
  source: "self" | "guided";
}

