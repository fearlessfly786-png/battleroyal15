"use client";

/**
 * LUCK ROYALE PANEL — full-screen royale screen.
 *
 * A 1:1 twin of the PET / CHARACTER screens (same uploaded pet-screen
 * design): blurred lobby backdrop, dashboard top chrome (player bar +
 * currency bar + close), nameplate over the stage, gold particles,
 * tabbed details panel and the big yellow action button, plus the
 * bottom "quick spin" switch. MIRRORED for luck: the live stage view
 * sits on the RIGHT half, the details cards + SPIN button take the
 * LEFT side, and the vertical IMAGE rail flips to the far right
 * (pure-CSS mirror, scoped with .luck-screen in luckPanel.css).
 *
 * The luck-royale theme maps 1:1 onto the character screen:
 *   characters  -> five ROYALES (Rockie / Panda / Draco / Ottero / Neon),
 *                  each with its own key-art, cost and prize pool
 *   rail tile   -> the royale's art square (same tile treatment)
 *   big preview -> the selected royale's art (breathe + click-to-play)
 *   EQUIP       -> the two FF-style spin plates at the bottom of the
 *                  card: blue "1 SPIN" (free daily spin, then diamonds)
 *                  and gold "10+1 SPINS" (10x cost, 11 pulls, best pull
 *                  lands on the stage + full loot into the record)
 *   skill tab   -> PRIZES (grand-prize emblem copy + the full pool)
 *   actions tab -> RECORD (your spin history)
 *   equipped ✓  -> gold check on royales whose JACKPOT you have hit
 *
 * Per the player's request the IMAGES are the pet panel's own art — the
 * royales reuse /pets/<id>.webp for the stage preview and
 * /pets/<id>-thumb.webp for the rail tiles, and the per-model preview
 * sizing rules from petPanel.css (.pet-model-panda etc.) apply verbatim,
 * so the vertical rail and the big preview are pixel-identical to the
 * pet kennel.
 *
 * It is a fully separate component from the pet and character panels —
 * it only reuses petPanel.css verbatim for the shared design language;
 * luckPanel.css adds the luck specifics, scoped with `.luck-screen`.
 *
 * Opened from the LUCK ROYALE entry in the left rail (and the crate
 * promo banner). Escape closes it, like every other lobby panel.
 */

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Coins,
  Crosshair,
  Crown,
  Gem,
  Plus,
  Shirt,
  Sparkles,
  X,
} from "lucide-react";
import { CoinIcon, DiamondIcon } from "./icons";
import { cn } from "@/utils/cn";
import "./petPanel.css";
import "./luckPanel.css";
import type { CurrencyKind, ToastKind } from "@/data/gameData";

const avatarImg = "/dashboard/avatar.jpg";
const bgScene = "/dashboard/bg-scene.jpg";

/* ============================== royale data ============================== */

type RoyaleId = "rockie" | "panda" | "draco" | "ottero" | "neon";
type PrizeIcon = ComponentType<{ className?: string }>;

interface RoyalePrize {
  name: string;
  icon: PrizeIcon;
  note: string;
  /** Currency payout — omit for pure item prizes. */
  kind?: CurrencyKind;
  amount?: number;
  jackpot?: boolean;
}

interface Royale {
  id: RoyaleId;
  name: string;
  /** Grand-prize short label shown in the details header. */
  tagline: string;
  description: string;
  benefit: string;
  descriptionEnd?: string;
  story: string;
  color: string;
  /** Stage preview — the pet panel's own art. */
  image: string;
  /** Rail tile — the pet panel's own thumbnail. */
  thumb: string;
  /** Diamonds per spin (after the daily free spin is spent). */
  cost: number;
  pool: RoyalePrize[];
}

const ROYALES: Royale[] = [
  {
    id: "rockie",
    name: "ROCKIE ROYALE",
    tagline: "CRIMSON BUNDLE",
    description: "The rockie crate hides the ",
    benefit: "Crimson Voxel Bundle",
    descriptionEnd: " and five more battlefield prizes",
    story: "Every crate hides a legend.",
    color: "#b933ff",
    image: "/pets/rockie.webp",
    thumb: "/pets/rockie-thumb.webp",
    cost: 60,
    pool: [
      { name: "Crimson Voxel Bundle", icon: Shirt, note: "The legendary red-gold outfit set.", jackpot: true },
      { name: "5,000 Gold", icon: Coins, note: "A fat pouch of battle gold.", kind: "coins", amount: 5000 },
      { name: "250 Diamonds", icon: Gem, note: "Premium currency, straight to your wallet.", kind: "diamonds", amount: 250 },
      { name: "2,400 Gold", icon: Coins, note: "Solid gold for supplies and crates.", kind: "coins", amount: 2400 },
      { name: "80 Diamonds", icon: Gem, note: "A small sprinkle of diamonds.", kind: "diamonds", amount: 80 },
      { name: "Nebula Crystal Pack", icon: Sparkles, note: "Nebula crystals for the vault." },
    ],
  },
  {
    id: "panda",
    name: "PANDA ROYALE",
    tagline: "FORTUNE HOARD",
    description: "The lucky panda showers winners with ",
    benefit: "up to 10,000 gold",
    descriptionEnd: " in a single spin",
    story: "A little luck. A lot of gold.",
    color: "#ffc933",
    image: "/pets/panda.webp",
    thumb: "/pets/panda-thumb.webp",
    cost: 80,
    pool: [
      { name: "10,000 Gold", icon: Coins, note: "The mother lode. One spin, one fortune.", kind: "coins", amount: 10000, jackpot: true },
      { name: "5,000 Gold", icon: Coins, note: "A fat pouch of battle gold.", kind: "coins", amount: 5000 },
      { name: "2,400 Gold", icon: Coins, note: "Solid gold for supplies and crates.", kind: "coins", amount: 2400 },
      { name: "250 Diamonds", icon: Gem, note: "Premium currency, straight to your wallet.", kind: "diamonds", amount: 250 },
      { name: "80 Diamonds", icon: Gem, note: "A small sprinkle of diamonds.", kind: "diamonds", amount: 80 },
      { name: "Nebula Crystal Pack", icon: Sparkles, note: "Nebula crystals for the vault." },
    ],
  },
  {
    id: "draco",
    name: "DRACO ROYALE",
    tagline: "AK47 VOXEL DRACO",
    description: "Gun skins forged in dragon fire — the ",
    benefit: "AK47 Voxel Draco",
    descriptionEnd: " leads the pool",
    story: "Small wings. Legendary loot.",
    color: "#ff583c",
    image: "/pets/draco.webp",
    thumb: "/pets/draco-thumb.webp",
    cost: 120,
    pool: [
      { name: "AK47 Voxel Draco", icon: Crosshair, note: "Legendary red-web assault rifle skin.", jackpot: true },
      { name: "M4A1 Crimson Web", icon: Crosshair, note: "Epic rifle skin with crimson weave." },
      { name: "5,000 Gold", icon: Coins, note: "A fat pouch of battle gold.", kind: "coins", amount: 5000 },
      { name: "2,400 Gold", icon: Coins, note: "Solid gold for supplies and crates.", kind: "coins", amount: 2400 },
      { name: "80 Diamonds", icon: Gem, note: "A small sprinkle of diamonds.", kind: "diamonds", amount: 80 },
      { name: "Nebula Crystal Pack", icon: Sparkles, note: "Nebula crystals for the vault." },
    ],
  },
  {
    id: "ottero",
    name: "OTTERO ROYALE",
    tagline: "FROST LEGEND SET",
    description: "Ice-cold bundles led by ",
    benefit: "legendary frost skins",
    descriptionEnd: " you can't buy anywhere else",
    story: "Ready for the cold. Dressed for the win.",
    color: "#35c5ff",
    image: "/pets/ottero.webp",
    thumb: "/pets/ottero-thumb.webp",
    cost: 80,
    pool: [
      { name: "Frost Legend Set", icon: Shirt, note: "Ice-blue legendary outfit + cap.", jackpot: true },
      { name: "Neon Street Wraps", icon: Shirt, note: "Glow-threaded streetwear bundle." },
      { name: "2,400 Gold", icon: Coins, note: "Solid gold for supplies and crates.", kind: "coins", amount: 2400 },
      { name: "250 Diamonds", icon: Gem, note: "Premium currency, straight to your wallet.", kind: "diamonds", amount: 250 },
      { name: "80 Diamonds", icon: Gem, note: "A small sprinkle of diamonds.", kind: "diamonds", amount: 80 },
      { name: "Nebula Crystal Pack", icon: Sparkles, note: "Nebula crystals for the vault." },
    ],
  },
  {
    id: "neon",
    name: "NEON ROYALE",
    tagline: "1,000 DIAMONDS",
    description: "The neon shrine showers winners with ",
    benefit: "up to 1,000 diamonds",
    descriptionEnd: " in a single spin",
    story: "A spark of mischief. A fortune in glow.",
    color: "#f44fff",
    image: "/pets/neon.webp",
    thumb: "/pets/neon-thumb.webp",
    cost: 100,
    pool: [
      { name: "1,000 Diamonds", icon: Gem, note: "The mother lode. One spin, one fortune.", kind: "diamonds", amount: 1000, jackpot: true },
      { name: "250 Diamonds", icon: Gem, note: "Premium currency, straight to your wallet.", kind: "diamonds", amount: 250 },
      { name: "5,000 Gold", icon: Coins, note: "A fat pouch of battle gold.", kind: "coins", amount: 5000 },
      { name: "80 Diamonds", icon: Gem, note: "A small sprinkle of diamonds.", kind: "diamonds", amount: 80 },
      { name: "2,400 Gold", icon: Coins, note: "Solid gold for supplies and crates.", kind: "coins", amount: 2400 },
      { name: "Nebula Crystal Pack", icon: Sparkles, note: "Nebula crystals for the vault." },
    ],
  },
];

/** localStorage-backed state (same pattern as the pet/character screens). */
function useSavedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`luck-arena:${key}`);
      if (stored === null) return initial;
      const parsed: unknown = JSON.parse(stored);
      if (initial !== null && (parsed === null || typeof parsed !== typeof initial))
        return initial;
      if (Array.isArray(initial) && !Array.isArray(parsed)) return initial;
      return parsed as T;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(`luck-arena:${key}`, JSON.stringify(value));
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

interface SpinRecord {
  name: string;
  royale?: string;
  at: number;
}

/* ============================ tiny art bits ============================== */

/** Angled prize emblem, tinted per royale via --skill-color. */
function PrizeEmblem({ color }: { color: string }) {
  return (
    <div
      className="skill-emblem"
      style={{ "--skill-color": color } as CSSProperties}
    >
      <svg viewBox="0 0 144 148" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="skill-core-luck">
            <stop stopColor="#8a13d8" />
            <stop offset=".65" stopColor="#30085e" />
            <stop offset="1" stopColor="#0d0826" />
          </radialGradient>
          <filter id="skill-glow-luck">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <path
          className="emblem-outline"
          d="m72 5 23 10 28 5 4 29 12 25-13 24-5 29-27 7-22 9-26-12-25-5-6-27L5 74l12-25 5-28 27-6Z"
          fill="url(#skill-core-luck)"
          strokeWidth="2.5"
        />
        <path
          d="m70 15 22 9 22 3 5 25 10 21-12 23-4 22-23 7-19 8-22-10-21-4-5-23-9-23 10-21 5-23 22-6Z"
          stroke="#7419a9"
          strokeWidth="2"
        />
        <g stroke="#c75dff" strokeWidth="10" filter="url(#skill-glow-luck)">
          <path d="m45 50 23 10 11 20-22 11-15 24m35-32 20 15 14-9M37 72l22-14m29-8 14 18" />
        </g>
        <g fill="#fbf4ff">
          <path d="m74 46 9-8 10 2 4 9-7 10-10-2ZM63 59l13-3 12 20-12 12-19 9-12 20-10-5 14-26 17-9-7-9-12 7-13-1 1-8 12-1Z" />
          <path d="m75 84 14-6 10 15 14-9 6 8-21 15-10-5ZM80 62l8-6 10 12 15 2-1 8-20-1Z" />
          <path d="m85 27 3 9 8 2 4-9 6 5-2 11-9 5-13-5-2-10ZM116 61l3 7 7 2 4-7 5 7-5 10-11 1-7-7Z" />
        </g>
        <path
          d="m27 45 20-9m-25 19 13-6m-8 40 12-4m9 36 10-9"
          stroke="#db7cff"
          strokeWidth="3"
        />
        <path d="m30 30 9 1-6 8ZM110 116l-10 1 5-9Z" fill="#b12bff" />
      </svg>
    </div>
  );
}

/* ================================ panel ================================== */

interface LuckRoyalePanelProps {
  coins: number;
  diamonds: number;
  onSpend: (kind: CurrencyKind, amount: number) => boolean;
  onEarn: (kind: CurrencyKind, amount: number) => void;
  onToast: (msg: string, kind?: ToastKind) => void;
  onTopUp: () => void;
  onClose: () => void;
}

export default function LuckRoyalePanel({
  coins,
  diamonds,
  onSpend,
  onEarn,
  onToast,
  onTopUp,
  onClose,
}: LuckRoyalePanelProps) {
  const [selectedId, setSelectedId] = useSavedState<RoyaleId>("selected", "rockie");
  const [jackpots, setJackpots] = useSavedState<RoyaleId[]>("jackpots", []);
  const [quickSpin, setQuickSpin] = useSavedState("quick-spin", false);
  const [lastFreeSpin, setLastFreeSpin] = useSavedState("last-free-spin", "");
  const [record, setRecord] = useSavedState<SpinRecord[]>("record", []);

  const [tab, setTab] = useState<"prizes" | "record">("prizes");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<RoyalePrize | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [spinTick, setSpinTick] = useState(0);
  const [playTick, setPlayTick] = useState(0);

  const spinTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const playTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const railRef = useRef<HTMLElement>(null);

  const royale = ROYALES.find((item) => item.id === selectedId) ?? ROYALES[0];
  const freeSpin = lastFreeSpin !== new Date().toDateString();

  /* Escape closes the panel, like every other lobby screen. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* Clear the pending timers on unmount. */
  useEffect(
    () => () => {
      clearTimeout(spinTimer.current);
      clearTimeout(celebrateTimer.current);
      clearTimeout(playTimer.current);
    },
    [],
  );

  /* ---------------------------- interactions ---------------------------- */

  function selectRoyale(id: RoyaleId) {
    if (id === royale.id) return;
    setSelectedId(id);
    setTab("prizes");
    setResult(null);
    const rail = railRef.current;
    const button = rail?.querySelector<HTMLElement>(`[data-pet="${id}"]`);
    if (rail && button && rail.scrollWidth > rail.clientWidth) {
      rail.scrollTo({
        left: button.offsetLeft - (rail.clientWidth - button.clientWidth) / 2,
        behavior: "smooth",
      });
    }
  }

  function nextRoyale(direction = 1) {
    const index = ROYALES.findIndex((item) => item.id === royale.id);
    selectRoyale(ROYALES[(index + direction + ROYALES.length) % ROYALES.length].id);
  }

  /** Click the key-art: the crate pops like the pet does. */
  function playRoyale() {
    if (spinning) return;
    clearTimeout(playTimer.current);
    setPlaying(true);
    setPlayTick((t) => t + 1);
    playTimer.current = setTimeout(() => setPlaying(false), 1150);
  }

  /**
   * Spin the royale: pullCount = 1 for the blue plate (free daily spin
   * first, then diamonds) or 11 for the gold 10+1 plate (charges 10x,
   * the +1 is the bonus pull). Currency wins are summed and paid out
   * once; the best pull (jackpot first, then the biggest payout) takes
   * the stage and every pull lands in the record.
   */
  function spin(pullCount: number) {
    if (spinning) return;
    const multi = pullCount > 1;
    const price = multi ? royale.cost * 10 : freeSpin ? 0 : royale.cost;
    if (price > 0 && !onSpend("diamonds", price)) {
      onToast(
        multi
          ? `Not enough diamonds — 10+1 spins costs ${price}!`
          : `Not enough diamonds — ${royale.name} costs ${royale.cost} a spin!`,
        "error",
      );
      onTopUp();
      return;
    }
    if (!multi && freeSpin) setLastFreeSpin(new Date().toDateString());

    const pulled = Array.from({ length: pullCount }, () => {
      const index = Math.floor(Math.random() * royale.pool.length);
      return royale.pool[index];
    });
    /* best pull: jackpots first, then the biggest currency payout */
    const rank = (prize: RoyalePrize) =>
      prize.jackpot ? Number.MAX_SAFE_INTEGER : (prize.amount ?? 0);
    const bestIndex = pulled.reduce(
      (top, prize, index) => (rank(prize) > rank(pulled[top]) ? index : top),
      0,
    );
    const best = pulled[bestIndex];
    const ordered = [...pulled];
    ordered.splice(bestIndex, 1);
    ordered.unshift(best);
    const hitJackpot = pulled.some((prize) => prize.jackpot);

    setResult(null);
    setSpinning(true);
    setSpinTick((t) => t + 1);

    clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(
      () => {
        setSpinning(false);
        setResult(best);
        setCelebrating(true);
        clearTimeout(celebrateTimer.current);
        celebrateTimer.current = setTimeout(() => setCelebrating(false), 1500);
        let coinsWon = 0;
        let diamondsWon = 0;
        for (const prize of pulled) {
          if (prize.amount !== undefined && prize.kind && prize.amount > 0) {
            if (prize.kind === "coins") coinsWon += prize.amount;
            else diamondsWon += prize.amount;
          }
        }
        if (coinsWon > 0) onEarn("coins", coinsWon);
        if (diamondsWon > 0) onEarn("diamonds", diamondsWon);
        if (hitJackpot) {
          setJackpots((current) =>
            current.includes(royale.id) ? current : [...current, royale.id],
          );
        }
        setRecord((r) =>
          [
            ...ordered.map((prize) => ({
              name: prize.name,
              royale: royale.name,
              at: Date.now(),
            })),
            ...r,
          ].slice(0, 8),
        );
        onToast(
          multi
            ? hitJackpot
              ? `JACKPOT! ${best.name} in your ${pullCount} pulls!`
              : `${pullCount} pulls — best: ${best.name}!`
            : hitJackpot
              ? `JACKPOT! ${best.name} is yours!`
              : `Luck Royale: you won ${best.name}!`,
          "success",
        );
      },
      quickSpin ? 260 : 1260,
    );
  }

  const fmtTime = (at: number) =>
    new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  /* -a/-b keyframe variants alternate so repeating the same animation
     restarts it (same trick as the pet actions). */
  const previewAnimation = spinning
    ? `luck-spin-${spinTick % 2 === 0 ? "a" : "b"} 1.2s ease-in-out`
    : playing
      ? `pf-jump-${playTick % 2 === 0 ? "a" : "b"} 1.1s ease-in-out`
      : undefined;

  return (
    <div
      className="pet-screen luck-screen z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label="Luck Royale"
    >
      {/* ---------- backdrop : dashboard scene, blurred & dimmed (KEPT) ---------- */}
      <div
        className="absolute inset-0 bg-[#03060c]"
        onClick={onClose}
        aria-hidden="true"
      >
        <img
          src={bgScene}
          alt=""
          className="h-full w-full scale-105 object-cover opacity-30 blur-[10px]"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-[#04070d]/80 to-[#04070d]" />
      </div>

      {/* ------------- top chrome : dashboard header (KEPT 1:1) ------------- */}
      <div className="relative z-20 flex items-start justify-between gap-2 px-3 pt-2.5 max-md:flex-wrap">
        {/* left cluster — mirrors the lobby TopBar left cluster */}
        <div className="flex items-start gap-2">
          {/* player name + level bar — identical to the lobby header */}
          <div
            className="anim-lobby-in bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 p-[2px] shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
            style={{
              clipPath:
                "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
              animationDelay: "0.05s",
            }}
          >
            <div className="clip-notch flex h-[62px] w-[292px] items-center gap-3 bg-[#0a111f]/95 pr-4 pl-1.5 max-md:w-[210px]">
              <img
                src={avatarImg}
                alt="FearlessFly avatar"
                className="pixelated clip-notch-sm h-[50px] w-[50px] shrink-0 object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-[19px] leading-tight font-bold tracking-wide">
                    FearlessFly
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-mist">
                    Lv. 18
                  </span>
                </div>
                <div className="mt-1.5 h-[7px] w-full bg-white/12">
                  <div
                    className="bar-grow h-full bg-gradient-to-r from-amber-300 to-gold shadow-[0_0_8px_rgba(255,198,26,0.8)]"
                    style={{ width: "62%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* currency bar — identical to the lobby wallet */}
          <div
            className="anim-lobby-in mt-[5px] flex items-stretch max-sm:hidden"
            style={{ animationDelay: "0.12s" }}
          >
            <div className="clip-para flex h-[50px] items-center gap-5 bg-black/75 pr-7 pl-5 backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <CoinIcon className="h-[26px] w-[26px]" />
                <span className="text-[19px] font-bold tracking-wide tabular-nums">
                  {coins}
                </span>
              </span>
              <span className="h-6 w-px bg-white/15" />
              <span className="flex items-center gap-2">
                <DiamondIcon className="h-[24px] w-[24px]" />
                <span className="text-[19px] font-bold tracking-wide tabular-nums">
                  {diamonds}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={onTopUp}
              aria-label="Top up currency"
              className="clip-para -ml-2 grid h-[50px] w-[46px] place-items-center bg-[#131e33] text-white transition-all duration-150 hover:bg-gold hover:text-black active:scale-95"
            >
              <Plus className="h-6 w-6" strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Luck Royale"
          className="panel-close anim-lobby-in grid h-8 w-8 shrink-0 place-items-center transition hover:rotate-90 active:scale-95 max-md:ml-auto"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* ====================== luck royale body (TWIN) ====================== */}
      <div className="pet-body">
        {/* ------------------------------ stage ------------------------------ */}
        <section className="pet-stage" aria-label={`${royale.name} preview`}>
          <div className="pet-nameplate">
            <Crown className="name-paw" />
            <h1 className={royale.name.length > 12 ? "long-name" : ""}>
              {royale.name}
            </h1>
            <span className="nameplate-cost" title="Diamonds per spin">
              <DiamondIcon />
              <span>{royale.cost}</span>
            </span>
          </div>
          <div className="pedestal-aura" aria-hidden="true" />
          <div className="pet-shadow" aria-hidden="true" />
          <div
            className={cn("gold-particles", celebrating && "celebrating")}
            aria-hidden="true"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <i
                key={index}
                style={
                  {
                    "--particle": index,
                    "--left": `${(index * 29 + 7) % 100}%`,
                    "--delay": `${index * -0.46}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <div className="pet-display">
            <div key={royale.id} className={`pet-model pet-model-${royale.id}`}>
              <button
                type="button"
                className={cn(
                  "pet-character",
                  (spinning || playing) && "is-active",
                  spinning && "is-spinning",
                )}
                style={previewAnimation ? { animation: previewAnimation } : undefined}
                aria-label={`Play with ${royale.name}`}
                title={`Click to play with ${royale.name}`}
                onClick={playRoyale}
              >
                <img
                  src={royale.image}
                  alt={`${royale.name} key art`}
                  draggable={false}
                />
              </button>
            </div>
          </div>
          <p
            className={cn(
              "luck-result",
              spinning && "is-spinning",
              result && "is-win",
            )}
            aria-live="polite"
          >
            {spinning
              ? "ROUND AND ROUND IT GOES…"
              : result
                ? result.name
                : freeSpin
                  ? "Your free spin is ready."
                  : "Spin for glory — grand prizes wait inside."}
          </p>
        </section>

        {/* ------------------------------- rail ------------------------------- */}
        <nav
          className="pet-rail"
          ref={railRef}
          aria-label="Choose a royale"
          onKeyDown={(event) => {
            if (
              ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(
                event.key,
              )
            ) {
              event.preventDefault();
              nextRoyale(["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1);
            }
          }}
        >
          {ROYALES.map((item) => (
            <button
              key={item.id}
              type="button"
              data-pet={item.id}
              className={cn(
                "pet-option",
                royale.id === item.id && "selected",
              )}
              aria-label={`Select ${item.name}`}
              aria-pressed={royale.id === item.id}
              title={item.name}
              onClick={() => selectRoyale(item.id)}
            >
              <span className="pet-option-glow" />
              <img src={item.thumb} alt="" draggable={false} />
              {jackpots.includes(item.id) && (
                <span className="equipped-mark" aria-label="Jackpot won">
                  <Check strokeWidth={3} />
                </span>
              )}
              <span className="selection-corner" />
              {royale.id === item.id && (
                <ChevronRight className="selected-arrow" strokeWidth={5} />
              )}
            </button>
          ))}
          <button
            type="button"
            className="next-pet"
            onClick={() => nextRoyale()}
            aria-label="Select next royale"
            title="Next royale"
          >
            <ChevronDown strokeWidth={5} />
          </button>
        </nav>

        {/* ----------------------------- details ----------------------------- */}
        <section className="details-zone" aria-label="Luck Royale details">
          <div className="pet-panel">
            <div className="panel-interior">
              <div className="level-header">
                <div className="level-info">
                  <strong>GRAND PRIZE</strong>
                  <span>{royale.tagline}</span>
                </div>
                <div
                  className="level-progress"
                  role="progressbar"
                  aria-label="Grand prize availability"
                  aria-valuenow={100}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span />
                </div>
              </div>
              <div
                className="pet-tabs"
                role="tablist"
                aria-label="Luck Royale information"
              >
                <button
                  type="button"
                  id="prizes-tab"
                  className={cn("pet-tab", tab === "prizes" && "active")}
                  role="tab"
                  aria-selected={tab === "prizes"}
                  aria-controls="prizes-panel"
                  tabIndex={tab === "prizes" ? 0 : -1}
                  onClick={() => setTab("prizes")}
                  onKeyDown={(event) => {
                    if (
                      event.key === "ArrowRight" ||
                      event.key === "ArrowLeft"
                    ) {
                      setTab("record");
                      document.getElementById("record-tab")?.focus();
                    }
                  }}
                >
                  PRIZES
                </button>
                <button
                  type="button"
                  id="record-tab"
                  className={cn("pet-tab", tab === "record" && "active")}
                  role="tab"
                  aria-selected={tab === "record"}
                  aria-controls="record-panel"
                  tabIndex={tab === "record" ? 0 : -1}
                  onClick={() => setTab("record")}
                  onKeyDown={(event) => {
                    if (
                      event.key === "ArrowRight" ||
                      event.key === "ArrowLeft"
                    ) {
                      setTab("prizes");
                      document.getElementById("prizes-tab")?.focus();
                    }
                  }}
                >
                  RECORD
                </button>
              </div>
              <div
                id="prizes-panel"
                className="skill-content"
                role="tabpanel"
                aria-labelledby="prizes-tab"
                tabIndex={0}
                hidden={tab !== "prizes"}
              >
                <div className="ability-row">
                  <PrizeEmblem color={royale.color} />
                  <div className="ability-copy">
                    <h2>{royale.tagline}</h2>
                    <p>
                      {royale.description}
                      <strong>{royale.benefit}</strong>
                      {royale.descriptionEnd}.
                    </p>
                  </div>
                </div>
                <blockquote className="pet-story">
                  <p>{royale.story}</p>
                </blockquote>
                <h2 className="pool-title">THE FULL POOL</h2>
                {royale.pool.map((prize) => {
                  const Icon = prize.icon;
                  return (
                    <div className="prize-row" key={prize.name}>
                      <span className="prize-chip">
                        <Icon />
                      </span>
                      <div className="prize-copy">
                        <h3>{prize.name}</h3>
                        <p>
                          {prize.jackpot ? <strong>JACKPOT — </strong> : null}
                          {prize.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                id="record-panel"
                className="actions-content"
                role="tabpanel"
                aria-labelledby="record-tab"
                tabIndex={0}
                hidden={tab !== "record"}
              >
                <h2>Your spins.</h2>
                <p>Loot pulled from the royales, newest first.</p>
                {record.length === 0 ? (
                  <p className="record-empty">
                    No spins yet — the crate is still sealed. Give it a spin!
                  </p>
                ) : (
                  record.map((entry, i) => (
                    <div className="record-row" key={`${entry.at}-${i}`}>
                      <span>
                        {entry.name}
                        {entry.royale && <small>{entry.royale}</small>}
                      </span>
                      <time>{fmtTime(entry.at)}</time>
                    </div>
                  ))
                )}
              </div>
            </div>
            <span className="panel-corner top" />
            <span className="panel-corner bottom" />
          </div>
          <div className="spin-buttons" role="group" aria-label="Spin options">
            <button
              type="button"
              className="spin-button spin-single"
              onClick={() => spin(1)}
              disabled={spinning}
              title={
                freeSpin
                  ? "Your free daily spin"
                  : `1 spin — ${royale.cost} diamonds`
              }
            >
              <span className="spin-title">1 SPIN</span>
              <span className="spin-cost">
                {freeSpin ? <Sparkles /> : <DiamondIcon />}
                <span>{freeSpin ? "FREE" : royale.cost}</span>
              </span>
            </button>
            <button
              type="button"
              className="spin-button spin-multi"
              onClick={() => spin(11)}
              disabled={spinning}
              title={`11 pulls — ${royale.cost * 10} diamonds`}
            >
              <span className="spin-title">10+1 SPINS</span>
              <span className="spin-cost">
                <DiamondIcon />
                <span>{royale.cost * 10}</span>
              </span>
            </button>
          </div>
        </section>

        {/* --------------------------- quick spin --------------------------- */}
        <label className="hide-pet">
          <input
            type="checkbox"
            checked={quickSpin}
            onChange={(event) => {
              setQuickSpin(event.target.checked);
              onToast(
                event.target.checked
                  ? "Quick spin on — the prize snaps straight out."
                  : "Quick spin off — enjoy the full spin ride.",
              );
            }}
          />
          <span className="checkbox-visual">
            {quickSpin && <Check strokeWidth={3.5} />}
          </span>
          <span>Quick spin (skip animation)</span>
        </label>
      </div>
    </div>
  );
}
