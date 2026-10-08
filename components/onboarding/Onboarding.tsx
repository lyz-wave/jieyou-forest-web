"use client";

import { PuppetMark } from "@/components/puppet/PuppetMark";
import { useRef, useState, type ReactElement } from "react";
import { PaperPuppet } from "@/components/puppet/PaperPuppet";
import { PopupCard } from "@/components/ui/PopupCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ANIMALS, ANIMAL_CAST, type AnimalId } from "@/lib/animals";
import { clampNickname, isValidNickname, NICKNAME_MAX } from "@/lib/onboarding/nickname";
import { EMPTY_ANSWERS, SELF_PICK_QUESTIONS, recommend, recommendLine, type SelfPickAnswers, type SelfPickOption } from "@/lib/onboarding/selfpick";
import { useAppStore } from "@/lib/stores/app";

type Step = "mist" | "welcome" | "nickname" | "notice" | "companion";
/** 第 5 步的三种样子：自己挑卡片、答三句话看看、看推荐 */
type CompanionMode = "cards" | "guided" | "result";
const STEPS: Step[] = ["mist", "welcome", "nickname", "notice", "companion"];

export function Onboarding({ onEnter }: { onEnter?: () => void }): ReactElement {
  const [step, setStep] = useState<Step>("mist");
  const [nickname, setNickname] = useState("");
  const [companion, setCompanion] = useState<AnimalId | null>(null);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<CompanionMode>("cards");
  const [question, setQuestion] = useState(0);
  const [answers, setAnswers] = useState<SelfPickAnswers>(EMPTY_ANSWERS);
  const [picked, setPicked] = useState<AnimalId | null>(null);
  /** 用户看过推荐；最后选的还是不是推荐的那只，落库时再定 */
  const [guided, setGuided] = useState(false);
  const submitting = useRef(false);
  const persistent = useAppStore((s) => s.persistent);
  const complete = useAppStore((s) => s.completeOnboarding);
  const reducedMotion = useReducedMotion();
  const enter = (): void => {
    onEnter?.();
    setStep("welcome");
  };
  const finish = async (): Promise<void> => {
    if (!companion || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      const at = Date.now();
      await complete({
        nickname: nickname.trim(),
        companion,
        onboardedAt: at,
        selfPicks: [{ at, want: answers.want, animalId: companion, source: guided && companion === picked ? "guided" : "self" }],
      });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };
  const nextClass = "paper-button mt-6 min-h-11 w-full px-5 py-3 text-base";
  const solidClass = "paper-button min-h-11 w-full px-5 py-3 text-base";
  const current = SELF_PICK_QUESTIONS[question];
  const startGuide = (): void => {
    setMode("guided");
    setQuestion(0);
  };
  const backToCards = (): void => {
    setMode("cards");
    setGuided(false);
    setPicked(null);
    setQuestion(0);
    setAnswers(EMPTY_ANSWERS);
  };
  const acceptRecommendation = (): void => {
    if (!picked) return;
    setCompanion(picked);
    setGuided(true);
    setMode("cards");
  };
  const toggleOption = (option: SelfPickOption): void => {
    const id = current.id;
    const kind = option.kind ?? "unsure";
    setAnswers((prev) => {
      const toggled = prev[id].includes(kind) ? prev[id].filter((k) => k !== kind) : [...prev[id], kind];
      // 第 1 题最多两项（两个都想）；其他题只留最后点的那项
      return { ...prev, [id]: current.max === 2 ? toggled.slice(-2) : toggled.slice(-1) };
    });
  };
  const nextQuestion = (): void => {
    if (question < SELF_PICK_QUESTIONS.length - 1) {
      setQuestion(question + 1);
      return;
    }
    const result = recommend(answers);
    if (!result) return;
    setPicked(result);
    setMode("result");
  };

  return (
    <section aria-label="入林引导" className="absolute inset-0 z-40">
      {step === "mist" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
          <p className="text-xs tracking-[0.4em] text-ink-soft">给心事留一片空地</p>
          <h1 className="text-5xl leading-relaxed tracking-widest sm:text-6xl">解忧森林</h1>
          <p className="text-base leading-8 text-ink-soft">不用急着变好。<br />先在这里，歇一歇。</p>
          <button type="button" onClick={enter} className="paper-button mt-5 min-h-11 px-8 py-3">走进森林</button>
        </div>
      ) : (
        <PopupCard key={step} open dismissible={false} labelledBy="onboarding-title" className={step === "companion" ? "max-w-2xl" : ""}>
          <p className="mb-3 text-xs tracking-[0.2em] text-ink-soft">入林小记 · {STEPS.indexOf(step) + 1} / 5</p>
          {step === "welcome" && (
            <>
              <div className="mx-auto mb-2 h-28 w-28">
                <PaperPuppet def={ANIMALS.tree.puppet} label="岁岁，森林守护者" shadow={{ dx: 3, dy: 4 }} reducedMotion={reducedMotion} />
              </div>
              <h2 id="onboarding-title" className="text-center text-2xl">我是岁岁</h2>
              <p className="mt-4 text-center leading-8 text-ink-soft">孩子，欢迎来到解忧森林。<br />这里的每一位朋友，都愿意听你说。<br />先放下行囊，慢慢来。</p>
              <button data-autofocus type="button" onClick={() => setStep("nickname")} className={nextClass}>你好，岁岁</button>
            </>
          )}
          {step === "nickname" && (
            <form onSubmit={(e) => { e.preventDefault(); if (isValidNickname(nickname)) setStep("notice"); }}>
              <h2 id="onboarding-title" className="text-2xl">我们该怎么称呼你？</h2>
              <p className="mb-5 mt-3 leading-7 text-ink-soft">一个喜欢的名字就好，不必是真名。</p>
              <label htmlFor="nickname" className="mb-2 block text-sm">你的昵称</label>
              <input id="nickname" data-autofocus value={nickname} onChange={(e) => setNickname(clampNickname(e.target.value))}
                autoComplete="nickname" aria-describedby="nickname-count" placeholder="比如，小满"
                className="min-h-12 w-full rounded-xl border border-bark/25 bg-cream-deep/40 px-4 py-3 text-lg" />
              <p id="nickname-count" className="mt-2 text-right text-xs text-ink-soft">{Array.from(nickname).length} / {NICKNAME_MAX} 字</p>
              <button type="submit" disabled={!isValidNickname(nickname)} className={nextClass}>继续</button>
            </form>
          )}
          {step === "notice" && (
            <>
              <h2 id="onboarding-title" className="text-2xl">入林前，一点叮咛</h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-ink-soft">
                <p><span className="text-ink">这里不是心理治疗。</span>朋友们的陪伴不能替代专业心理咨询，也不会为你诊断。</p>
                <p>遇到紧急情况，请联系当地心理援助热线；如果有立即的人身危险，请联系当地急救或报警服务，并找可信任的人陪着你。</p>
                <p>你的昵称、伙伴和游戏记录，只存在你自己的设备上；昵称也不必使用真名。</p>
                <p>倾诉时你写下的话，会发给本站的服务端、交给模型帮你生成回应。那边不写日志，也不会把它留下来；将来存进年轮的记录仍在你自己的设备上。</p>
              </div>
              <button data-autofocus type="button" onClick={() => setStep("companion")} className={nextClass}>我知道了</button>
            </>
          )}
          {step === "companion" && (
            <div className="flex max-h-[calc(100dvh-112px)] flex-col">
              <h2 id="onboarding-title" className="text-2xl">{mode === "cards" ? "今天想先找谁玩？" : mode === "guided" ? "帮你看看现在更需要什么" : "也许这位适合此刻的你"}</h2>
              {mode === "cards" && (
                <>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">{nickname.trim()}，选一位同行伙伴吧。其他朋友也都在等你。</p>
                  <button type="button" onClick={startGuide} className="mt-3 min-h-11 self-start rounded-full border border-bark/20 bg-cream-deep/40 px-4 py-2 text-sm text-ink-soft">不知道找谁？帮我看看</button>
                  {/* 滚动放在外层 div：fieldset 作滚动容器时浏览器不裁剪内容，纸卡会被内容撑出屏幕 */}
                  <div className="mt-4 min-h-0 shrink overflow-y-auto p-1">
                    <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-3" disabled={saving}>
                      <legend className="sr-only">选择你的伙伴</legend>
                      {ANIMAL_CAST.map((animal) => (
                        <label key={animal.id} className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-3 transition-colors ` + (companion === animal.id ? "border-moss bg-moss/10" : "border-bark/10 bg-cream-deep/35")}>
                          <input type="radio" name="companion" value={animal.id} checked={companion === animal.id}
                            onChange={() => setCompanion(animal.id)} className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" aria-label={`${animal.name}，${animal.mindset}，${animal.game?.name}`} />
                          <span className="absolute inset-0 rounded-2xl peer-focus-visible:outline-2 peer-focus-visible:outline-dashed peer-focus-visible:outline-vermilion" />
                          <span className="flex items-center justify-between gap-2"><span className="text-lg"><PuppetMark id={animal.id} size={22} /> {animal.name}</span><span aria-hidden className="text-moss">{companion === animal.id ? "✓" : ""}</span></span>
                          <span className="mt-1 text-xs leading-5 text-ink-soft">{animal.summary}</span>
                          <span className="mt-2 text-xs text-bark">一起玩 · {animal.game?.name}</span>
                        </label>
                      ))}
                    </fieldset>
                  </div>
                  <button type="button" disabled={!companion || saving} onClick={() => void finish().catch((err: unknown) => console.error("入林失败", err))} className={`${nextClass} shrink-0`}>{saving ? "正在认识你…" : "一起入林"}</button>
                </>
              )}
              {mode === "guided" && (
                <>
                  <p className="mt-3 text-xs tracking-[0.2em] text-ink-soft">第 {question + 1} / {SELF_PICK_QUESTIONS.length} 问</p>
                  <p className="mt-2 leading-7">{current.ask}</p>
                  {current.hint && <p className="mt-1 text-xs text-ink-soft">{current.hint}</p>}
                  <div className="mt-3 grid gap-2">
                    {current.options.map((option) => {
                      const on = answers[current.id].includes(option.kind ?? "unsure");
                      return (
                        <button key={option.label} type="button" aria-pressed={on} onClick={() => toggleOption(option)}
                          className={`min-h-11 rounded-xl border-2 px-4 py-3 text-left text-sm leading-6 transition-colors ${on ? "border-moss bg-moss/10" : "border-bark/10 bg-cream-deep/35"}`}>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex shrink-0 items-center gap-2">
                    {question > 0 && <button type="button" onClick={() => setQuestion(question - 1)} className="paper-button min-h-11 shrink-0 px-4 py-2 text-sm">上一问</button>}
                    <button type="button" disabled={answers[current.id].length === 0} onClick={nextQuestion} className={`${solidClass} flex-1`}>
                      {question === SELF_PICK_QUESTIONS.length - 1 ? "看看推荐" : "下一问"}
                    </button>
                  </div>
                  <button type="button" onClick={backToCards} className="mt-3 min-h-11 shrink-0 self-center text-sm text-ink-soft underline">还是想自己挑</button>
                </>
              )}
              {mode === "result" && picked !== null && (
                <>
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-moss bg-moss/10 p-3">
                    <PuppetMark id={picked} size={44} />
                    <span className="flex flex-col"><span className="text-lg">{ANIMALS[picked].name}</span><span className="text-xs text-ink-soft">{ANIMALS[picked].species} · {ANIMALS[picked].mindset}</span></span>
                  </div>
                  <p className="mt-3 text-sm leading-7">{recommendLine(answers, picked)}</p>
                  <p className="mt-2 text-xs leading-5 text-ink-soft">看的是你此刻的需要，不代表你是什么样的人。</p>
                  <div className="mt-4 flex shrink-0 items-center gap-2">
                    <button type="button" onClick={acceptRecommendation} className={`${solidClass} flex-1`}>就是它</button>
                  </div>
                  <button type="button" onClick={backToCards} className="mt-3 min-h-11 shrink-0 self-center text-sm text-ink-soft underline">还是想自己挑</button>
                </>
              )}
            </div>
          )}

        </PopupCard>
      )}
      {!persistent && <p role="status" className="paper-card absolute inset-x-4 top-3 z-50 mx-auto max-w-md px-4 py-2 text-center text-xs leading-5">森林这次记不住你，关掉页面后需要重新认识哦</p>}
    </section>
  );
}
