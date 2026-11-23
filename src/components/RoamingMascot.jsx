import React, { useEffect, useRef, useState } from "react";
import { HamsterMascot } from "./HamsterMascot.jsx";

const PET_QUOTES = {
  zh: {
    read: [
      "翻翻今天新收录了什么顶刊 Skill…",
      "这几个画图和润色工具看着真香！",
      "不会敲命令也能复制 SKILL.md 用哦~",
    ],
    snack: [
      "改论文累了，嗑颗瓜子回回血~",
      "祝你实证一次显著，实验一次跑通！",
      "代码不报错，今晚早点睡 🌻",
    ],
    jump: [
      "Reviewer #2 退散！投稿稳稳过 ✨",
      "抓到本鼠啦！点我帮你挑科研工具！",
      "开题、画图、排版卡壳？尽管问我！",
    ],
    sleep: ["跑完消融实验眯两秒…点我秒醒！"],
  },
  en: {
    read: [
      "Scanning today's top research Skills…",
      "Found great plotting & writing tools!",
    ],
    snack: [
      "Quick sunflower-seed break between papers~",
      "May all your p-values be significant!",
    ],
    jump: [
      "Reviewer #2 be nice! Click me for Skill picks ✨",
      "Need help choosing a research Skill? Ask me!",
    ],
    sleep: ["Power nap while jobs run… click to wake!"],
  },
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// 在可视窗口内挑选安全有趣的漫游目标坐标（优先两侧走廊与上下区域，不死挡中央）
function pickNextWaypoint(vw, vh) {
  const margin = 76;
  const maxX = Math.max(margin, vw - margin);
  const maxY = Math.max(margin + 40, vh - 96);
  const roll = Math.random();
  let x;
  let y;
  if (roll < 0.36) {
    // 左侧走廊上下溜达
    x = margin + Math.random() * Math.min(180, vw * 0.18);
    y = 90 + Math.random() * (maxY - 90);
  } else if (roll < 0.72) {
    // 右侧走廊上下溜达
    x = maxX - Math.random() * Math.min(180, vw * 0.18);
    y = 90 + Math.random() * (maxY - 90);
  } else {
    // 全屏自由横穿大冲刺！
    x = margin + Math.random() * (maxX - margin);
    y = 86 + Math.random() * (maxY - 86);
  }
  return { x: Math.round(x), y: Math.round(y) };
}

export default function RoamingMascot({
  roaming,
  botOpen,
  lang = "zh",
  onOpenBot,
}) {
  const [pos, setPos] = useState(() => ({
    x: typeof window !== "undefined" ? Math.max(80, window.innerWidth - 130) : 800,
    y: typeof window !== "undefined" ? Math.max(120, window.innerHeight - 86) : 600,
  }));
  const [mode, setMode] = useState("run");
  const [facing, setFacing] = useState(-1);
  const [quote, setQuote] = useState("");
  const [hovered, setHovered] = useState(false);

  const posRef = useRef(pos);
  posRef.current = pos;
  const dragRef = useRef({ active: false, moved: false, startX: 0, startY: 0 });
  const hoveredRef = useRef(false);
  hoveredRef.current = hovered;

  useEffect(() => {
    if (!roaming || botOpen) return undefined;

    let rafId = 0;
    let actionTimer = 0;
    let quoteTimer = 0;
    let cancelled = false;
    let target = pickNextWaypoint(window.innerWidth, window.innerHeight);
    let speed = 2.6; // px per 16ms frame
    let moving = true;

    const showRandomQuote = (actMode) => {
      const pool = (PET_QUOTES[lang] || PET_QUOTES.zh)[actMode];
      if (pool && Math.random() < 0.75) {
        setQuote(pickRandom(pool));
        clearTimeout(quoteTimer);
        quoteTimer = window.setTimeout(() => setQuote(""), 3400);
      }
    };

    const startNextLeg = () => {
      if (cancelled) return;
      target = pickNextWaypoint(window.innerWidth, window.innerHeight);
      const dist = Math.hypot(
        target.x - posRef.current.x,
        target.y - posRef.current.y,
      );
      const fast = dist > 280 || Math.random() < 0.55;
      speed = fast ? 3.2 : 1.65;
      moving = true;
      setMode(fast ? "run" : "walk");
      setFacing(target.x < posRef.current.x ? -1 : 1);
    };

    const performStopTrick = () => {
      if (cancelled) return;
      moving = false;
      const trick = pickRandom([
        "read",
        "snack",
        "jump",
        "idle",
        "read",
        "snack",
        "sleep",
      ]);
      setMode(trick);
      showRandomQuote(trick);
      const duration =
        trick === "sleep"
          ? 4600
          : trick === "jump"
            ? 2200
            : 2800 + Math.random() * 1400;
      actionTimer = window.setTimeout(startNextLeg, duration);
    };

    let lastTime = performance.now();
    const tick = (now) => {
      if (cancelled) return;
      const dt = Math.min(34, now - lastTime) / 16.67;
      lastTime = now;

      if (moving && !dragRef.current.active && !hoveredRef.current) {
        const cur = posRef.current;
        const dx = target.x - cur.x;
        const dy = target.y - cur.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= speed * dt + 2) {
          setPos({ x: target.x, y: target.y });
          performStopTrick();
        } else {
          const step = speed * dt;
          const nx = cur.x + (dx / dist) * step;
          const ny = cur.y + (dy / dist) * step;
          setFacing(dx < 0 ? -1 : 1);
          setPos({ x: nx, y: ny });
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    // 出发先来一段欢快小跑！
    startNextLeg();
    rafId = requestAnimationFrame(tick);

    const onResize = () => {
      setPos((cur) => ({
        x: Math.min(cur.x, Math.max(60, window.innerWidth - 60)),
        y: Math.min(cur.y, Math.max(80, window.innerHeight - 70)),
      }));
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearTimeout(actionTimer);
      clearTimeout(quoteTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [roaming, botOpen, lang]);

  if (!roaming || botOpen) return null;

  const bubbleAlignLeft = pos.x > (typeof window !== "undefined" ? window.innerWidth - 220 : 900);
  const bubbleBelow = pos.y < 110;
  const activeQuote =
    hovered
      ? lang === "zh"
        ? "点我挑科研 Skill · 按住还能拎着走！"
        : "Click to ask AI · Drag to move me!"
      : quote;

  return (
    <div
      className="roaming-mascot-layer"
      data-testid="roaming-mascot"
      style={{
        transform: `translate3d(${Math.round(pos.x - 36)}px, ${Math.round(pos.y - 42)}px, 0)`,
      }}
    >
      <button
        type="button"
        className="roaming-mascot-actor"
        aria-label={lang === "zh" ? "点击科研鼠鼠提问选工具" : "Ask roaming Hamster AI"}
        onMouseEnter={() => {
          setHovered(true);
          setMode("jump");
        }}
        onMouseLeave={() => {
          setHovered(false);
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          dragRef.current = {
            active: true,
            moved: false,
            startX: e.clientX,
            startY: e.clientY,
          };
          setMode("jump");
        }}
        onPointerMove={(e) => {
          if (!dragRef.current.active) return;
          const movedDist = Math.hypot(
            e.clientX - dragRef.current.startX,
            e.clientY - dragRef.current.startY,
          );
          if (movedDist > 6) {
            dragRef.current.moved = true;
            setFacing(e.movementX < 0 ? -1 : 1);
            setPos({
              x: Math.max(40, Math.min(window.innerWidth - 40, e.clientX)),
              y: Math.max(50, Math.min(window.innerHeight - 40, e.clientY)),
            });
          }
        }}
        onPointerUp={() => {
          const wasMoved = dragRef.current.moved;
          dragRef.current.active = false;
          if (!wasMoved) {
            onOpenBot?.();
          } else {
            setMode("idle");
          }
        }}
      >
        {activeQuote && (
          <span
            className={`roaming-mascot-bubble${bubbleAlignLeft ? " align-right" : ""}${bubbleBelow ? " place-below" : ""}`}
            aria-hidden="true"
          >
            {activeQuote}
          </span>
        )}
        <HamsterMascot
          mode={hovered ? "jump" : mode}
          size={72}
          facing={facing}
          showBackdrop={false}
        />
      </button>
    </div>
  );
}
