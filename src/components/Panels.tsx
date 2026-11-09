import { useState } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { CoinIcon, DiamondIcon } from "./icons";
import {
  MISSIONS,
  type CurrencyKind,
  type PanelId,
  type ToastKind,
} from "@/data/gameData";

const TITLES: Record<PanelId, { title: string; sub: string }> = {
  store: { title: "STORE", sub: "Fresh drops rotate daily" },
  luck: { title: "LUCK ROYALE", sub: "Spin for legendary voxel loot" },
  vault: { title: "VAULT", sub: "Your collected gear" },
  missions: { title: "MISSIONS", sub: "Complete tasks, earn gold" },
  events: { title: "EVENTS", sub: "Limited-time activities" },
  character: { title: "CHARACTER", sub: "Your battle identity" },
  pet: { title: "PETS", sub: "Your loyal battle companions" },
};

interface PanelsProps {
  panel: PanelId | null;
  onClose: () => void;
  coins: number;
  diamonds: number;
  onSpend: (kind: CurrencyKind, amount: number) => boolean;
  onEarn: (kind: CurrencyKind, amount: number) => void;
  onToast: (msg: string, kind?: ToastKind) => void;
}

export default function Panels({ panel, onClose, coins, diamonds, onEarn, onToast }: PanelsProps) {
  const [claimedMissions, setClaimedMissions] = useState<Set<string>>(new Set());

  if (!panel) return null;
  const meta = TITLES[panel];

  const goldBtn =
    "clip-notch-sm bg-gradient-to-b from-[#ffd83d] to-gold px-3 py-1.5 font-cond text-[14.5px] font-bold tracking-[0.1em] text-[#241a00] transition hover:brightness-110 active:scale-95 disabled:cursor-default";
  const ghostBtn =
    "clip-notch-sm bg-white/8 px-3 py-1.5 font-cond text-[14.5px] font-bold tracking-[0.1em] text-white/85 ring-1 ring-white/12 transition hover:bg-white/15 active:scale-95";

  return (
    <section
      key={panel}
      className="anim-panel-in absolute top-[84px] right-3 bottom-3 z-30 flex w-[402px] max-w-[94vw] flex-col [filter:drop-shadow(0_24px_44px_rgba(0,0,0,0.55))] max-lg:top-[150px]"
      aria-label={meta.title}
    >
      <div className="clip-notch flex min-h-0 flex-1 flex-col bg-[#0a111f]/[0.97] ring-1 ring-white/10">
        {/* header */}
        <div className="flex items-start justify-between px-4 pt-3.5 pb-3">
          <div>
            <h2 className="font-display text-[23px] leading-none tracking-[0.05em] text-white">
              {meta.title} <span className="text-gold">/</span>
            </h2>
            <p className="mt-1 text-[12.5px] text-mist">{meta.sub}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="clip-notch-sm grid h-8 w-8 place-items-center bg-white/8 text-white/80 transition hover:rotate-90 hover:bg-red-500/80 hover:text-white active:scale-95"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="flex items-center gap-4 border-y border-white/8 bg-black/30 px-4 py-2">
          <span className="flex items-center gap-1.5 text-[14px] font-bold tabular-nums">
            <CoinIcon className="h-[19px] w-[19px]" /> {coins.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5 text-[14px] font-bold tabular-nums">
            <DiamondIcon className="h-[18px] w-[18px]" /> {diamonds.toLocaleString()}
          </span>
          <span className="ml-auto font-cond text-[12px] font-semibold tracking-[0.2em] text-white/35">
            SEASON 24
          </span>
        </div>

        {/* body */}
        <div className="nice-scroll min-h-0 flex-1 overflow-y-auto p-3.5">
          {panel === "missions" && (
            <div className="flex flex-col gap-2">
              {MISSIONS.map((m) => {
                const done = m.progress >= m.goal;
                const claimed = claimedMissions.has(m.id);
                return (
                  <article key={m.id} className="clip-notch-sm bg-white/[0.045] p-3 ring-1 ring-white/8">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[13.5px] leading-snug font-bold">{m.title}</h3>
                      <span className="flex shrink-0 items-center gap-1 text-[13px] font-bold text-gold tabular-nums">
                        <CoinIcon className="h-4 w-4" /> {m.reward}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-[7px] flex-1 bg-white/10">
                        <span className="bar-grow block h-full bg-gradient-to-r from-emerald-400 to-emerald-300" style={{ width: `${Math.min(100, (m.progress / m.goal) * 100)}%` }} />
                      </span>
                      <span className="text-[12px] text-mist tabular-nums">
                        {m.progress.toLocaleString()}/{m.goal.toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={!done || claimed}
                      onClick={() => {
                        setClaimedMissions((s) => new Set(s).add(m.id));
                        onEarn("coins", m.reward);
                        onToast(`Mission complete: +${m.reward} gold`, "success");
                      }}
                      className={cn("mt-2.5 w-full", done && !claimed ? goldBtn : ghostBtn, claimed && "text-emerald-300 ring-emerald-300/40")}
                    >
                      {claimed ? "CLAIMED" : done ? "CLAIM REWARD" : "IN PROGRESS"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

        </div>

        {/* footer hint */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 text-[11.5px] text-white/35">
          <Check className="h-3.5 w-3.5 text-emerald-400/70" />
          Progress auto-saves to your FearlessFly account.
        </div>
      </div>
    </section>
  );
}
