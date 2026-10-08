import { useCallback, useRef, useState } from "react";
import type { CharacterId } from "@/lib/animals";
import type { RiskLevel } from "@/lib/ai/schema";
import type { PromptContext } from "@/lib/prompts";
import { talkApi } from "@/lib/talk/client";
import { localGuard, mentionsTarget, needsServerCheck, parseMention, replyHistory, speechesAsHistory } from "@/lib/talk/flow";
import { useAppStore } from "@/lib/stores/app";
import { useForestStore } from "@/lib/stores/forest";
import { useGameContextStore } from "@/lib/stores/gameContext";
import { useTalkStore } from "@/lib/stores/talk";

export type AskStatus = "idle" | "thinking" | "failed";

export interface TalkFlow {
  roundStatus: AskStatus;
  summaryStatus: AskStatus;
  replyStatus: AskStatus;
  /** 提交一次倾诉：先过风险这一关，确认可以继续再请七只说话 */
  speak(text: string): void;
  /** 圆桌没接上时再来一次 */
  retryRound(): void;
  summarize(): void;
  retrySummary(): void;
  /** 说一句（可以写 @墨墨，也可以直接点头像：chosen 是点头像选的那一位） */
  ask(question: string, chosen?: CharacterId | null): void;
  retryReply(): void;
  /** 让大家就同一件事再说一轮 */
  again(): void;
}

/** 拼一份上下文：昵称、今天的伙伴、小游戏留下的、心情分都用当前的界面状态 */
function useContext(): (text: string, history: PromptContext["history"]) => PromptContext {
  const nickname = useAppStore((s) => s.profile?.nickname ?? "");
  const companion = useForestStore((s) => s.companion);
  const gameContext = useGameContextStore((s) => s.entries);
  const mood = useTalkStore((s) => s.mood);
  const concern = useTalkStore((s) => s.concern);
  return useCallback(
    (text, history) => ({
      nickname: nickname.trim() === "" ? "你" : nickname.trim(),
      companion,
      text,
      moodBefore: mood ?? undefined,
      concern,
      gameContext,
      memories: [],
      history: history ?? [],
    }),
    [nickname, companion, gameContext, mood, concern],
  );
}

export function useTalkFlow(): TalkFlow {
  const contextOf = useContext();
  const [roundStatus, setRoundStatus] = useState<AskStatus>("idle");
  const [summaryStatus, setSummaryStatus] = useState<AskStatus>("idle");
  const [replyStatus, setReplyStatus] = useState<AskStatus>("idle");
  const run = useRef(0);
  const lastQuestion = useRef("");
  /** 上一次点头像选的是谁（重试时还交给他） */
  const lastTarget = useRef<CharacterId | null>(null);

  const startRoundtable = useCallback(
    (text: string, history: PromptContext["history"] = []): void => {
      const id = ++run.current;
      setRoundStatus("thinking");
      void talkApi
        .roundtable(contextOf(text, history))
        .then((result) => {
          if (id !== run.current) return;
          useTalkStore.getState().gotSpeeches(result.speeches);
          setRoundStatus("idle");
        })
        .catch(() => {
          if (id !== run.current) return;
          // 停在聆听里用户只会一直等，所以先出来，再告诉他没接上
          useTalkStore.getState().toRoundtable();
          setRoundStatus("failed");
        });
    },
    [contextOf],
  );

  /**
   * 风险判定（文档第八节）：本地认定危险就当场守护、不往下走；其余情况都问服务端一次。
   * 服务端说 concern 就照常圆桌、只记一笔留给总结；问不到（断网、没配 Key）时宁可多报。
   * 返回 true 表示这一句可以继续交给七只。
   */
  const checkRisk = useCallback(async (local: RiskLevel, text: string): Promise<boolean> => {
    if (!needsServerCheck(local)) {
      useTalkStore.getState().guard("crisis");
      return false;
    }
    try {
      const result = await talkApi.risk(text);
      if (result.risk === "crisis") {
        useTalkStore.getState().guard("crisis");
        return false;
      }
      useTalkStore.getState().markConcern(result.risk === "concern");
      return true;
    } catch {
      useTalkStore.getState().markConcern(local === "concern");
      return true;
    }
  }, []);

  const speak = useCallback(
    (text: string): void => {
      const store = useTalkStore.getState();
      store.setText(text);
      store.submit();
      // 风险检测在前：确认可以继续，才请七只说话（文档 6.3.5 的顺序）
      void checkRisk(localGuard(text), text).then((mayGo) => {
        if (!mayGo) return;
        startRoundtable(text);
      });
    },
    [checkRisk, startRoundtable],
  );

  const retryRound = useCallback((): void => {
    startRoundtable(useTalkStore.getState().text);
  }, [startRoundtable]);

  const summarize = useCallback((): void => {
    const state = useTalkStore.getState();
    const history = speechesAsHistory(state.speeches);
    setSummaryStatus("thinking");
    void talkApi
      .summary(contextOf(state.text, history))
      .then((summary) => {
        useTalkStore.getState().toSummary(summary);
        setSummaryStatus("idle");
      })
      .catch(() => {
        setSummaryStatus("failed");
      });
  }, [contextOf]);

  const ask = useCallback(
    (question: string, chosen: CharacterId | null = null): void => {
      const state = useTalkStore.getState();
      lastQuestion.current = question;
      lastTarget.current = chosen;
      const named = mentionsTarget(question);
      const { target, rest } = parseMention(question);
      // 写了 @名字 就听文字里的；没写就听点的那一位；都没选，默认交回古树
      const who: CharacterId = named ? target : (chosen ?? target);
      const asked = named ? rest : question.trim();
      const history = replyHistory(state.text, state.speeches, state.replies);
      setReplyStatus("thinking");
      void talkApi
        .reply(contextOf(asked, history), who)
        .then((result) => {
          useTalkStore.getState().addReply({ speaker: result.speaker, text: result.text });
          setReplyStatus("idle");
        })
        .catch(() => {
          setReplyStatus("failed");
        });
    },
    [contextOf],
  );

  const retrySummary = useCallback((): void => {
    summarize();
  }, [summarize]);

  /** 刚才那句没接上：用同一句再来一次 */
  const retryReply = useCallback((): void => {
    if (lastQuestion.current === "") return;
    ask(lastQuestion.current, lastTarget.current);
  }, [ask]);

  /** 让大家就同一件事再说一轮（文档 6.3.8）：把已经说过的带回去，免得第二轮重复 */
  const again = useCallback((): void => {
    const state = useTalkStore.getState();
    const history = speechesAsHistory(state.speeches);
    state.again();
    startRoundtable(state.text, history);
  }, [startRoundtable]);

  return { roundStatus, summaryStatus, replyStatus, speak, retryRound, summarize, retrySummary, ask, retryReply, again };
}

/** 只给界面用：判断一句里有没有指名 */
export function mentioned(question: string): CharacterId {
  return parseMention(question).target;
}