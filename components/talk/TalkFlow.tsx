"use client";

import { useCallback, type ReactElement } from "react";
import { PopupCard } from "@/components/ui/PopupCard";
import { ANIMAL_CAST } from "@/lib/animals";
import { useForestStore } from "@/lib/stores/forest";
import { useTalkStore } from "@/lib/stores/talk";
import { FollowUpStage } from "./FollowUpStage";
import { GrowStage } from "./GrowStage";
import { GrowthCardStage } from "./GrowthCardStage";
import { ListeningStage } from "./ListeningStage";
import { MoodStage } from "./MoodStage";
import { RiskStage } from "./RiskStage";
import { RateStage } from "./RateStage";
import { RoundtableStage } from "./RoundtableStage";
import { SummaryStage } from "./SummaryStage";
import { useTalkFlow } from "./useTalkFlow";

/** 一次倾诉：写字 → 聆听 → 守护（要是需要）→ 圆桌 → 总结 → 追问。 */
export function TalkFlow(): ReactElement | null {
  const phase = useTalkStore((s) => s.phase);
  const flow = useTalkFlow();
  const leave = useCallback((): void => {
    useTalkStore.getState().finish();
    useForestStore.getState().startDisperse(ANIMAL_CAST.length);
  }, []);
  /** 回到森林之后直接去古树那边看年轮 */
  const seeRings = useCallback((): void => {
    leave();
    useForestStore.getState().openRings();
  }, [leave]);
  /** 先放一放：这一次先存下来，再回森林 */
  const leavePaused = useCallback((): void => {
    flow.pause();
    leave();
  }, [flow, leave]);

  if (phase === "away") return null;

  return (
    <PopupCard open onClose={leave} labelledBy="talk-title">
      {phase === "mood" ? <MoodStage onSpeak={flow.speak} /> : null}
      {phase === "listening" ? <ListeningStage /> : null}
      {phase === "risk" ? <RiskStage onLeave={leave} /> : null}
      {phase === "roundtable" ? <RoundtableStage flow={flow} /> : null}
      {phase === "summary" ? <SummaryStage flow={flow} onPause={leavePaused} /> : null}
      {phase === "followup" ? <FollowUpStage flow={flow} onPause={leavePaused} /> : null}
      {phase === "rate" ? <RateStage onGrow={flow.settle} /> : null}
      {phase === "grow" ? <GrowStage onRetry={flow.settle} /> : null}
      {phase === "card" ? <GrowthCardStage onRings={seeRings} onLeave={leave} /> : null}
    </PopupCard>
  );
}
