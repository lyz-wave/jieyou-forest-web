/**
 * 守护与求助的文案（产品文档第八节）。
 * ① crisis：先停下来说话、给求助卡、要一句「我现在是安全的」才能继续；
 * ② concern：不打断倾诉，古树在总结里温和地提一句。
 */

/** 隐私说明里的一句；写下的内容不落盘、不进日志。 */
export const PRIVACY_LINE =
  "写下的内容只发给我们自己的服务端，用来生成这一次的回应；不进日志，也不留在这台设备上。";

export interface Hotline {
  name: string;
  number: string;
}

/**
 * 求助卡上的号码取自产品文档第八节。上线前必须再核实一次：
 * 号码会变，写错了等于把人引到一个空号上。
 */
export const HOTLINES: readonly Hotline[] = [
  { name: "全国心理援助热线", number: "12356" },
  { name: "希望 24 热线", number: "400-161-9995" },
  { name: "紧急情况（报警 / 急救）", number: "110 / 120" },
];

export interface CrisisCopy {
  /** 岁岁先说的那一句 */
  treeSays: string;
  title: string;
  body: string;
  steps: readonly string[];
  tail: string;
  hotlineTitle: string;
  /** 继续之前要他自己确认的一句话 */
  confirm: string;
  continueLabel: string;
  leaveLabel: string;
}

/** 危险时的那一页：岁岁先说话，再给三条出路和求助卡。 */
export const CRISIS: CrisisCopy = {
  treeSays: "我在。你写下的这句话我不打算轻轻放过，先让我陪你停一下。",
  title: "先停一下，我们慢慢来",
  body: "你写下的这段话让我有些担心。森林可以陪着你，但这件事值得有一个真人陪着你一起面对。",
  steps: [
    "先找一个信得过的人：把刚才写的话念给他听，或者只说一句「我现在很不好，能陪我说说话吗」。",
    "如果身边暂时没有人，就打下面的热线，接通后直接说「我需要有人陪我聊聊」。",
    "如果这一刻很难受，可以先什么都不决定，把手机放在手边，等呼吸慢下来一点。",
  ],
  tail: "森林会一直在这里。你先把自己交给一个真人，好吗？",
  hotlineTitle: "现在就能接住你的人",
  confirm: "我现在是安全的",
  continueLabel: "我还想说，继续吧",
  leaveLabel: "先离开，去透口气",
};

/** concern 不拦人，只在总结里轻轻说一句。 */
export const CONCERN_LINE =
  "还有一句想轻轻说：这些沉甸甸的东西如果一直在，找一个真人聊聊会比我们陪你更有用。";
