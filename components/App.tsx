"use client";
import { useEffect, useState } from "react";
import {
  format, addDays, differenceInCalendarDays, parseISO,
  addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday,
} from "date-fns";
import {
  LayoutDashboard, BookOpen, CalendarDays, CalendarCheck,
  Timer, Settings as Cog, Play, Pause, Check, SkipForward,
  Trash2, Maximize2, ChevronLeft, ChevronRight, Flame,
  BookMarked, FlaskConical, FileText, RotateCcw, BrainCircuit, AlertCircle,
} from "lucide-react";
import { useStore, uid, today, mins, elapsed, tomorrow, seed, Task } from "@/lib/store";

// ─── constants ───────────────────────────────────────────────────────────────
const NAV = [
  ["dash",     "Dashboard",    LayoutDashboard],
  ["subjects", "Subjects",     BookOpen],
  ["planner",  "Planner",      CalendarCheck],
  ["calendar", "Calendar",     CalendarDays],
  ["timer",    "Timer",        Timer],
  ["settings", "Settings",     Cog],
] as const;

const TYPES = [
  "Learn new concepts",
  "Practice questions",
  "Previous-year paper",
  "Mock examination",
  "Revision",
  "Active recall",
  "Review mistakes",
];

// type → icon + label colour (earthy, never generic AI-purple)
const TYPE_META: Record<string, { icon: React.ElementType; color: string }> = {
  "Learn new concepts": { icon: BookMarked,    color: "#5685B8" },
  "Practice questions": { icon: FlaskConical,  color: "#276B5A" },
  "Previous-year paper":{ icon: FileText,      color: "#8C6A4F" },
  "Mock examination":   { icon: FileText,      color: "#C65B55" },
  "Revision":           { icon: RotateCcw,     color: "#D89B54" },
  "Active recall":      { icon: BrainCircuit,  color: "#6F8A3D" },
  "Review mistakes":    { icon: AlertCircle,   color: "#C65B55" },
};

// ─── small helpers ────────────────────────────────────────────────────────────
const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return (h ? h + ":" : "") + p(m) + ":" + p(r);
};
const t12 = (t: string) => format(new Date("2000-01-01T" + t), "h:mm a");
const hrs = (m: number) => (m / 60).toFixed(1) + " h";
const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

function useTick() {
  const [, s] = useState(0);
  useEffect(() => { const i = setInterval(() => s(x => x + 1), 1000); return () => clearInterval(i) }, []);
}
function useSub() {
  const subs = useStore(s => s.subjects);
  return (id: string) => subs.find(x => x.id === id);
}

const Bar = ({ v, c = "#276B5A", thin }: { v: number; c?: string; thin?: boolean }) => (
  <div className={`${thin ? "h-1" : "h-1.5"} rounded-full bg-line overflow-hidden`}>
    <div className="h-full rounded-full transition-all duration-500" style={{ width: Math.min(100, v) + "%", background: c }} />
  </div>
);

const progress = (s: any) => {
  const t = s.chapters.flatMap((c: any) => c.topics);
  return t.length ? Math.round(t.filter((x: any) => x.done).length / t.length * 100) : 0;
};

const TypeBadge = ({ type }: { type: string }) => {
  const m = TYPE_META[type] ?? { icon: BookMarked, color: "#777" };
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md" style={{ color: m.color, background: m.color + "18" }}>
      <Icon size={10} />
      {type}
    </span>
  );
};

// ─── root app ─────────────────────────────────────────────────────────────────
export default function App() {
  const ready = useStore(s => s.ready), hydrate = useStore(s => s.hydrate);
  const active = useStore(s => s.active);
  const [view, go] = useState("dash");
  const [focus, setFocus] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { hydrate() }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT","SELECT","TEXTAREA"].includes(t.tagName) || e.metaKey || e.ctrlKey) return;
      const m: any = { n: "planner", t: "timer", c: "calendar", d: "dash" };
      if (m[e.key]) go(m[e.key]);
      if (e.key === " " && active) { e.preventDefault(); const s = useStore.getState(); active.runningSince ? s.pause() : s.resume() }
      if (e.key === "Escape") setFocus(false);
      if (e.key === "f" && focus) document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
    };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [active, focus]);
  useEffect(() => {
    const b = (e: BeforeUnloadEvent) => { if (useStore.getState().active) e.preventDefault() };
    addEventListener("beforeunload", b); return () => removeEventListener("beforeunload", b);
  }, []);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-mute animate-pulse">Loading your plan…</div>
    </div>
  );
  if (focus && active) return <Focus close={() => setFocus(false)} />;

  return (
    <div className="flex bg-bg h-screen overflow-hidden">
      {/* ── sidebar — sticky, full viewport height, never scrolls ── */}
      <aside className={`${collapsed ? "w-14" : "w-56"} shrink-0 border-r border-line bg-surface hidden md:flex flex-col transition-all duration-200 sticky top-0 h-screen`}>
        {/* logo row */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-line shrink-0">
          {!collapsed && <span className="text-[13px] font-bold tracking-widest text-ink select-none">STUDYLOG</span>}
          <button
            className="p-1 rounded-md text-mute hover:text-ink hover:bg-bg transition"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-[13px] transition ${view === id ? "bg-brand/8 text-brand font-semibold" : "text-mute hover:bg-bg hover:text-ink"}`}
            >
              <Icon size={15} />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {!collapsed && <div className="shrink-0"><SidebarExamCountdown /></div>}
      </aside>

      {/* ── main ── */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen">
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-7 pb-24 space-y-7">
          {view === "dash"     && <Dash go={go} />}
          {view === "subjects" && <Subjects />}
          {view === "planner"  && <Planner go={go} />}
          {view === "calendar" && <Cal />}
          {view === "timer"    && <TimerPage setFocus={setFocus} />}
          {view === "settings" && <SettingsPage />}
        </div>
      </main>

      {/* ── mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-line flex justify-around py-2 z-20">
        {NAV.map(([id, label, Icon]) => (
          <button
            key={id}
            aria-label={label}
            onClick={() => go(id)}
            className={`p-2 transition ${view === id ? "text-brand" : "text-mute"}`}
          >
            <Icon size={20} />
          </button>
        ))}
      </nav>

      {/* ── floating mini player ── */}
      {active && <Mini go={go} setFocus={setFocus} />}
    </div>
  );
}

// ─── sidebar exam countdown ───────────────────────────────────────────────────
function SidebarExamCountdown() {
  const ex = useStore(s => s.exams), sub = useSub();
  const upcoming = ex
    .filter(e => differenceInCalendarDays(parseISO(e.date), new Date()) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming[0];
  if (!next) return null;
  const s = sub(next.subjectId);
  const days = differenceInCalendarDays(parseISO(next.date), new Date());
  return (
    <div className="mx-3 mb-4 rounded-lg border border-line bg-bg p-3">
      <div className="text-[11px] text-mute mb-1 font-medium uppercase tracking-wide">Next exam</div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-bold text-sm" style={{ color: s?.color }}>{s?.abbr}</span>
        <span className="text-mute text-xs">in</span>
        <span className="font-bold text-ink num">{days}</span>
        <span className="text-mute text-xs">days</span>
      </div>
      <div className="text-[11px] text-mute mt-0.5">{s && format(parseISO(next.date), "EEE, d MMM")}</div>
    </div>
  );
}

// ─── mini floating timer ──────────────────────────────────────────────────────
function Mini({ go, setFocus }: any) {
  useTick();
  const a = useStore(s => s.active)!, { pause, resume, finish } = useStore.getState();
  const sub = useSub()(a.subjectId);
  const e = elapsed(a);
  const shown = a.targetMin ? a.targetMin * 60000 - e : e;
  return (
    <div className="fixed bottom-16 md:bottom-5 right-4 z-30 bg-surface border border-line rounded-xl flex items-center gap-3 shadow-md py-2 px-3">
      <button onClick={() => go("timer")} className="text-left min-w-0">
        <div className="num text-lg font-bold leading-none text-ink">{clock(shown)}</div>
        <div className="text-[11px] text-mute mt-0.5">{sub?.abbr} · {a.runningSince ? "Running" : "Paused"}</div>
      </button>
      <div className="flex gap-1">
        <button className="btn" aria-label="Pause/Resume" onClick={() => a.runningSince ? pause() : resume()}>
          {a.runningSince ? <Pause size={13} /> : <Play size={13} />}
        </button>
        <button className="btn" aria-label="Focus mode" onClick={() => setFocus(true)}>
          <Maximize2 size={13} />
        </button>
        <button className="btn" aria-label="Stop & save" onClick={finish}>
          <Check size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── focus mode ───────────────────────────────────────────────────────────────
function Focus({ close }: any) {
  useTick();
  const a = useStore(s => s.active)!, st = useStore.getState();
  const sub = useSub()(a.subjectId);
  const task = useStore(s => s.tasks.find(t => t.id === a.taskId));
  const e = elapsed(a);
  const left = a.targetMin ? a.targetMin * 60000 - e : e;
  const pct = a.targetMin ? e / (a.targetMin * 600) : 0;
  const R = 110, C = 2 * Math.PI * R;
  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <div className="text-xs text-mute uppercase tracking-widest font-medium">{sub?.name}</div>
        <div className="font-semibold text-lg mt-1 max-w-md">{task?.title ?? "Free study session"}</div>
      </div>
      <div className="relative">
        <svg width="260" height="260" className="-rotate-90">
          <circle cx="130" cy="130" r={R} fill="none" stroke="#E7E7E4" strokeWidth="8" />
          <circle cx="130" cy="130" r={R} fill="none" stroke={sub?.color ?? "#276B5A"} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, pct / 100))} />
        </svg>
        <div className="absolute inset-0 grid place-items-center num text-5xl font-bold">{clock(left)}</div>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        <button className="btn btn-p" onClick={() => a.runningSince ? st.pause() : st.resume()}>
          {a.runningSince ? "Pause" : "Resume"}
        </button>
        <button className="btn" onClick={() => { st.finish(); close() }}>Finish session</button>
        <button className="btn text-danger" onClick={() => { if (confirm("Discard? Time won't be saved.")) { st.discard(); close() } }}>Discard</button>
      </div>
      <button className="text-xs text-mute underline-offset-2 underline" onClick={close}>Exit focus mode (Esc)</button>
      <div className="text-xs text-mute">Space pauses · F toggles fullscreen</div>
    </div>
  );
}

// ─── task row ─────────────────────────────────────────────────────────────────
function TaskRow({ t, go }: { t: Task; go?: (v: string) => void }) {
  const sub = useSub()(t.subjectId);
  const { mut, start, active } = useStore(s => ({ mut: s.mut, start: s.start, active: s.active }));
  const set = (status: Task["status"]) => mut(d => ({ tasks: d.tasks.map(x => x.id === t.id ? { ...x, status } : x) }));
  const isDone = t.status === "done", isSkipped = t.status === "skipped";
  return (
    <div className={`flex items-start gap-3 py-3 border-b border-line last:border-0 group ${isDone || isSkipped ? "opacity-50" : ""}`}>
      {/* subject colour pill */}
      <div className="w-0.5 self-stretch rounded-full mt-0.5 shrink-0" style={{ background: sub?.color }} />
      {/* time */}
      <div className="w-24 shrink-0 pt-0.5">
        <div className="text-[11px] text-mute num leading-snug">{t12(t.start)}</div>
        <div className="text-[11px] text-mute num leading-snug">{t12(t.end)}</div>
      </div>
      {/* content */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium leading-snug mb-1 ${isDone ? "line-through text-mute" : "text-ink"}`}>{t.title}</div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <TypeBadge type={t.type} />
          <span className="text-[11px] text-mute">{hrs(mins(t.start, t.end))}</span>
          {t.goal !== "recall" && (
            <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${t.goal === "primary" ? "text-amber-700 bg-amber-50" : "text-slate-500 bg-slate-50"}`}>
              {t.goal}
            </span>
          )}
          {isSkipped && <span className="text-[11px] text-mute italic">skipped</span>}
        </div>
      </div>
      {/* actions */}
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
        {t.status === "todo" && go && (
          <button
            className="btn"
            title="Start timer for this task"
            aria-label="Start timer"
            disabled={!!active}
            onClick={() => { start(t.subjectId, t.id, 0); go("timer") }}
          >
            <Play size={12} />
          </button>
        )}
        <button
          className="btn"
          title={isDone ? "Mark as to-do" : "Mark as done"}
          aria-label={isDone ? "Mark as to-do" : "Mark as done"}
          onClick={() => set(isDone ? "todo" : "done")}
        >
          <Check size={12} />
        </button>
        <button
          className="btn"
          title={isSkipped ? "Un-skip" : "Skip this task"}
          aria-label={isSkipped ? "Un-skip" : "Skip"}
          onClick={() => set(isSkipped ? "todo" : "skipped")}
        >
          <SkipForward size={12} />
        </button>
        <button
          className="btn text-danger"
          title="Delete this task"
          aria-label="Delete"
          onClick={() => confirm("Delete this task?") && mut(d => ({ tasks: d.tasks.filter(x => x.id !== t.id) }))}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── stat tile ────────────────────────────────────────────────────────────────
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="num text-2xl font-bold text-ink leading-none">{value}</div>
      {sub && <div className="text-[11px] text-mute num">{sub}</div>}
      <div className="text-xs text-mute mt-0.5">{label}</div>
    </div>
  );
}

// ─── week strip ───────────────────────────────────────────────────────────────
function WeekStrip({ selected, onDayClick }: { selected: string; onDayClick: (d: string) => void }) {
  const tasks = useStore(s => s.tasks), exams = useStore(s => s.exams);
  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 2));
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {days.map(day => {
        const k = format(day, "yyyy-MM-dd");
        const hasExam = exams.some(e => e.date === k);
        const done = tasks.filter(t => t.date === k && t.status === "done").length;
        const total = tasks.filter(t => t.date === k && t.status !== "skipped").length;
        const isT = isToday(day);
        const isSel = selected === k;
        return (
          <button
            key={k}
            onClick={() => onDayClick(k)}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border flex-none transition ${isSel ? "border-brand bg-brand/5" : "border-line bg-surface hover:bg-bg"}`}
          >
            <span className={`text-[10px] font-medium uppercase tracking-wide ${isSel ? "text-brand" : "text-mute"}`}>{format(day, "EEE")}</span>
            <span className={`text-sm font-bold num ${isSel ? "text-brand" : isT ? "text-ink font-extrabold" : "text-ink"}`}>{format(day, "d")}</span>
            {hasExam && <span className="w-1.5 h-1.5 rounded-full bg-danger" title="Exam" />}
            {!hasExam && total > 0 && (
              <span className={`text-[10px] num ${done === total ? "text-ok" : "text-mute"}`}>{done}/{total}</span>
            )}
            {!hasExam && total === 0 && <span className="w-1.5 h-1.5 rounded-full bg-line" />}
          </button>
        );
      })}
    </div>
  );
}

// ─── dashboard ────────────────────────────────────────────────────────────────
function Dash({ go }: any) {
  const d = useStore(), sub = useSub();
  const [selDay, setSelDay] = useState(today());
  const isSelToday = selDay === today();

  const tasks    = d.tasks.filter(x => x.date === selDay).sort((a, b) => a.start.localeCompare(b.start));
  const live     = tasks.filter(x => x.status !== "skipped");
  const planned  = live.reduce((s, x) => s + mins(x.start, x.end), 0);
  const actual   = d.sessions.filter(s => format(s.start, "yyyy-MM-dd") === selDay).reduce((s, x) => s + x.ms, 0) / 60000;
  const done     = live.filter(x => x.status === "done").length;
  const pct      = live.length ? Math.round(done / live.length * 100) : 0;
  const exams    = d.exams.filter(e => differenceInCalendarDays(parseISO(e.date), new Date()) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  const examOnDay = d.exams.filter(e => e.date === selDay);
  const days     = new Set(d.sessions.map(s => format(s.start, "yyyy-MM-dd")));
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const k = format(addDays(new Date(), -i), "yyyy-MM-dd");
    if (days.has(k)) streak++; else if (i > 0) break;
  }
  const primary   = tasks.find(x => x.goal === "primary");
  const secondary = tasks.find(x => x.goal === "secondary");

  return (
    <div className="space-y-6">
      {/* ── header ── */}
      <div>
        <div className="text-xs text-mute uppercase tracking-widest font-medium mb-1">{format(new Date(), "EEEE, d MMMM yyyy")}</div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink leading-tight">{greet()}.</h1>
        {exams[0] && (
          <p className="text-sm text-mute mt-1">
            <span className="font-semibold" style={{ color: sub(exams[0].subjectId)?.color }}>{sub(exams[0].subjectId)?.abbr}</span>
            {" "}exam in <span className="num font-semibold text-ink">{differenceInCalendarDays(parseISO(exams[0].date), new Date())}</span> days.
          </p>
        )}
      </div>

      {/* ── week strip — clicking a day browses it ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-mute uppercase tracking-widest font-medium">
            {isSelToday ? "Today" : format(parseISO(selDay), "EEEE, d MMM")}
          </div>
          {!isSelToday && (
            <button className="text-xs text-brand hover:underline" onClick={() => setSelDay(today())}>
              Back to today
            </button>
          )}
        </div>
        <WeekStrip selected={selDay} onDayClick={setSelDay} />
      </div>

      {/* ── exam alert for selected day ── */}
      {examOnDay.length > 0 && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger flex items-center gap-2">
          <AlertCircle size={15} />
          {examOnDay.map(e => sub(e.subjectId)?.name).join(", ")} — exam day
        </div>
      )}

      {/* ── summary ── */}
      <div className="card">
        <div className="flex flex-wrap gap-x-8 gap-y-4 items-end mb-4">
          <Stat label={`of ${isSelToday ? "today's" : "this day's"} tasks done`} value={`${pct}%`} />
          <Stat label="Planned" value={hrs(planned)} />
          <Stat label="Studied" value={hrs(actual)} />
          <Stat label="Remaining" value={hrs(Math.max(0, planned - actual))} />
          <Stat label="Tasks" value={`${done}/${live.length}`} />
          {streak > 0 && isSelToday && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1 num text-2xl font-bold text-ink leading-none">
                <Flame size={18} className="text-amber" />{streak}
              </div>
              <div className="text-xs text-mute mt-0.5">Day streak</div>
            </div>
          )}
        </div>
        <Bar v={pct} />
        <div className="text-[11px] text-mute mt-2">Daily target {d.settings.targetHours} h · studied hours come from saved timer sessions.</div>
      </div>

      {/* ── goals ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {([["Primary goal", primary], ["Secondary goal", secondary]] as const).map(([label, task]) => (
          <div key={label} className="card">
            <div className="text-[11px] text-mute uppercase tracking-widest font-medium mb-2">{label}</div>
            {task ? (
              <>
                <div className="font-semibold text-sm text-ink leading-snug">{task.title}</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: sub(task.subjectId)?.color }} />
                  <span className="text-xs text-mute">{sub(task.subjectId)?.name}</span>
                </div>
                <div className="mt-2"><TypeBadge type={task.type} /></div>
              </>
            ) : (
              <div className="text-sm text-mute">None set for {isSelToday ? "today" : "this day"}. Add one in the planner.</div>
            )}
          </div>
        ))}
      </div>

      {/* ── day's schedule ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-mute">
            {isSelToday ? "Today's" : format(parseISO(selDay), "d MMM")} schedule
          </h2>
          <button className="btn" onClick={() => go("planner")}>Add task</button>
        </div>
        <div className="card py-0">
          {tasks.length
            ? tasks.map(x => <TaskRow key={x.id} t={x} go={go} />)
            : <p className="text-sm text-mute py-5 text-center">Nothing planned. Open the planner to add tasks.</p>}
        </div>
      </section>

      {/* ── upcoming exams ── */}
      {exams.length > 0 && (
        <section>
          <h2 className="font-semibold text-sm uppercase tracking-widest text-mute mb-3">Upcoming exams</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {exams.slice(0, 6).map((e, i) => {
              const s = sub(e.subjectId)!;
              const n = s.chapters.flatMap(c => c.topics);
              const daysLeft = differenceInCalendarDays(parseISO(e.date), new Date());
              const urgent = daysLeft <= 3;
              return (
                <div key={e.id} className="card" style={i === 0 ? { outline: `2px solid ${s.color}40`, outlineOffset: "-1px" } : {}}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-sm" style={{ color: s.color }}>{s.abbr}</div>
                      <div className="text-xs text-mute">{format(parseISO(e.date), "EEE d MMM")}</div>
                    </div>
                    <span className={`num text-sm font-bold px-2 py-0.5 rounded-md ${urgent ? "bg-danger/10 text-danger" : "bg-bg text-mute"}`}>{daysLeft}d</span>
                  </div>
                  <Bar v={progress(s)} c={s.color} />
                  <div className="flex justify-between text-[11px] mt-1.5">
                    <span className="text-mute">{n.filter(x => x.done).length}/{n.length} topics</span>
                    <span className="text-mute">{progress(s)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── subjects ─────────────────────────────────────────────────────────────────
function Subjects() {
  const d = useStore(), [open, setOpen] = useState("");
  const [txt, setTxt] = useState<Record<string, string>>({});
  const upd = (sid: string, f: (s: any) => any) =>
    d.mut(x => ({ subjects: x.subjects.map(s => s.id === sid ? f(s) : s) }));

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-mute uppercase tracking-widest font-medium mb-1">Overview</div>
        <h1 className="text-[28px] font-bold tracking-tight">My Subjects</h1>
      </div>

      <div className="space-y-2">
        {d.subjects.map(s => {
          const ex = d.exams.find(e => e.subjectId === s.id);
          const hours = d.sessions.filter(x => x.subjectId === s.id).reduce((a, b) => a + b.ms, 0) / 3600000;
          const pct = progress(s);
          return (
            <div key={s.id} className="card py-0 overflow-hidden">
              <button
                className="w-full text-left px-4 py-3"
                onClick={() => setOpen(open === s.id ? "" : s.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-sm shrink-0" style={{ color: s.color }}>{s.abbr}</span>
                    <span className="text-sm text-mute truncate">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[11px] text-mute num hidden sm:inline">{hours.toFixed(1)} h</span>
                    {ex && <span className="text-[11px] text-mute hidden sm:inline">{format(parseISO(ex.date), "d MMM")}</span>}
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded border" style={{ color: s.color, borderColor: s.color + "40", background: s.color + "0D" }}>
                      {s.priority}
                    </span>
                    <span className="text-[11px] text-mute num w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="mt-2"><Bar v={pct} c={s.color} thin /></div>
              </button>

              {open === s.id && (
                <div className="border-t border-line px-4 py-4 space-y-3 bg-bg">
                  {!s.chapters.length && (
                    <p className="text-sm text-mute">No chapters yet. Add units from your syllabus below.</p>
                  )}
                  {s.chapters.map((c: any) => {
                    const cDone = c.topics.filter((t: any) => t.done).length;
                    const cTotal = c.topics.length;
                    const cPct = cTotal ? Math.round((cDone / cTotal) * 100) : 0;
                    return (
                      <div key={c.id} className="rounded-lg bg-surface border border-line p-3">
                        <div className="flex justify-between items-center text-sm font-semibold mb-1">
                          <div className="flex items-center gap-2">
                            <span>{c.name}</span>
                            {cTotal > 0 && (
                              <span className="text-xs text-mute font-normal num">
                                {cDone}/{cTotal} ({cPct}%)
                              </span>
                            )}
                          </div>
                          <button
                            aria-label="Delete chapter"
                            title="Delete chapter"
                            className="text-mute hover:text-danger transition"
                            onClick={() => confirm("Delete chapter and its topics?") && upd(s.id, x => ({ ...x, chapters: x.chapters.filter((y: any) => y.id !== c.id) }))}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        {cTotal > 0 && (
                          <div className="mb-2.5">
                            <Bar v={cPct} c={s.color} thin />
                          </div>
                        )}
                        <div className="space-y-0.5">
                          {c.topics.map((topic: any) => (
                            <label key={topic.id} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer hover:bg-bg/60 rounded px-1 -mx-1 transition">
                              <input
                                type="checkbox"
                                className="accent-brand"
                                checked={topic.done}
                                onChange={() => upd(s.id, x => ({
                                  ...x,
                                  chapters: x.chapters.map((y: any) => y.id === c.id
                                    ? { ...y, topics: y.topics.map((z: any) => z.id === topic.id ? { ...z, done: !z.done } : z) }
                                    : y)
                                }))}
                              />
                              <span className={topic.done ? "line-through text-mute" : ""}>{topic.name}</span>
                            </label>
                          ))}
                        </div>
                        <input
                          className="inp mt-2 w-full text-xs"
                          placeholder="Add topic, press Enter"
                          value={txt[c.id] ?? ""}
                          onChange={e => setTxt({ ...txt, [c.id]: e.target.value })}
                          onKeyDown={e => {
                            const v = (txt[c.id] ?? "").trim();
                            if (e.key === "Enter" && v) {
                              upd(s.id, x => ({ ...x, chapters: x.chapters.map((y: any) => y.id === c.id ? { ...y, topics: [...y.topics, { id: uid(), name: v, done: false }] } : y) }));
                              setTxt({ ...txt, [c.id]: "" });
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                  <input
                    className="inp w-full"
                    placeholder="Add chapter / unit, press Enter"
                    value={txt[s.id] ?? ""}
                    onChange={e => setTxt({ ...txt, [s.id]: e.target.value })}
                    onKeyDown={e => {
                      const v = (txt[s.id] ?? "").trim();
                      if (e.key === "Enter" && v) {
                        upd(s.id, x => ({ ...x, chapters: [...x.chapters, { id: uid(), name: v, topics: [] }] }));
                        setTxt({ ...txt, [s.id]: "" });
                      }
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── planner ─────────────────────────────────────────────────────────────────
function Planner({ go }: any) {
  const d = useStore();
  const [date, setDate] = useState(today());
  const [f, setF] = useState({ title: "", subjectId: "aad", type: TYPES[0], start: "11:00", end: "13:00", goal: "primary" });
  const tasks = d.tasks.filter(x => x.date === date).sort((a, b) => a.start.localeCompare(b.start));
  const live  = tasks.filter(x => x.status !== "skipped");
  const todo  = tasks.filter(x => x.status === "todo");

  const add = () => {
    if (!f.title.trim()) return alert("Give the task a title.");
    if (mins(f.start, f.end) <= 0) return alert("End time must be after start time.");
    d.mut(x => ({ tasks: [...x.tasks, { id: uid(), ...f, date, status: "todo" } as Task] }));
    setF({ ...f, title: "" });
  };

  const examsOnDay = d.exams.filter(e => e.date === date);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-xs text-mute uppercase tracking-widest font-medium mb-1">Day view</div>
          <h1 className="text-[28px] font-bold tracking-tight">Daily Planner</h1>
        </div>
        <input type="date" className="inp ml-auto" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {examsOnDay.length > 0 && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger flex items-center gap-2">
          <AlertCircle size={15} />
          {examsOnDay.map(e => d.subjects.find(s => s.id === e.subjectId)?.name).join(", ")} — exam day
        </div>
      )}

      <div className="card flex gap-6 text-sm py-3">
        <span>Planned <b className="num font-bold">{hrs(live.reduce((s, x) => s + mins(x.start, x.end), 0))}</b></span>
        <span>Done <b className="num font-bold">{live.filter(x => x.status === "done").length}/{live.length}</b></span>
        <span className="text-mute text-xs self-center">target {d.settings.targetHours} h/day</span>
      </div>

      {/* add form */}
      <div className="card">
        <div className="text-xs text-mute uppercase tracking-widest font-medium mb-3">Add task</div>
        <div className="grid sm:grid-cols-6 gap-2">
          <input
            className="inp sm:col-span-3"
            placeholder="Task title"
            value={f.title}
            onChange={e => setF({ ...f, title: e.target.value })}
            onKeyDown={e => e.key === "Enter" && add()}
          />
          <select className="inp" value={f.subjectId} onChange={e => setF({ ...f, subjectId: e.target.value })}>
            {d.subjects.map(s => <option key={s.id} value={s.id}>{s.abbr}</option>)}
          </select>
          <select className="inp sm:col-span-2" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input type="time" className="inp" value={f.start} onChange={e => setF({ ...f, start: e.target.value })} />
          <input type="time" className="inp" value={f.end} onChange={e => setF({ ...f, end: e.target.value })} />
          <select className="inp" value={f.goal} onChange={e => setF({ ...f, goal: e.target.value })}>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="recall">Recall</option>
          </select>
          <button className="btn btn-p justify-center sm:col-span-3" onClick={add}>Add task</button>
        </div>
      </div>

      <div className="card py-0">
        {tasks.length
          ? tasks.map(t => <TaskRow key={t.id} t={t} go={go} />)
          : <p className="text-sm text-mute py-5 text-center">No tasks for this date.</p>}
      </div>

      {todo.length > 0 && (
        <button
          className="btn"
          onClick={() => confirm(`Move ${todo.length} unfinished task(s) to the next day?`) &&
            d.mut(x => ({ tasks: x.tasks.map(t => t.date === date && t.status === "todo" ? { ...t, date: tomorrow(date) } : t) }))
          }
        >
          Move {todo.length} unfinished to next day →
        </button>
      )}
    </div>
  );
}

// ─── calendar ─────────────────────────────────────────────────────────────────
function Cal() {
  const d = useStore(), sub = useSub();
  const [m, setM] = useState(startOfMonth(new Date()));
  const [sel, setSel] = useState(today());
  const days = eachDayOfInterval({
    start: startOfWeek(m, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(m), { weekStartsOn: 1 }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <div className="text-xs text-mute uppercase tracking-widest font-medium mb-1">Monthly view</div>
          <h1 className="text-[28px] font-bold tracking-tight">{format(m, "MMMM yyyy")}</h1>
        </div>
        <div className="ml-auto flex gap-1">
          <button className="btn" aria-label="Previous" onClick={() => setM(addMonths(m, -1))}><ChevronLeft size={14} /></button>
          <button className="btn" onClick={() => { setM(startOfMonth(new Date())); setSel(today()) }}>Today</button>
          <button className="btn" aria-label="Next" onClick={() => setM(addMonths(m, 1))}><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className="border border-line rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-bg border-b border-line">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(x => (
            <div key={x} className="text-[11px] text-mute font-medium text-center py-2">{x}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-line">
          {days.map(day => {
            const k = format(day, "yyyy-MM-dd");
            const exs = d.exams.filter(e => e.date === k);
            const n = d.tasks.filter(t => t.date === k).length;
            const doneTasks = d.tasks.filter(t => t.date === k && t.status === "done").length;
            const isT = isToday(day);
            return (
              <button
                key={k}
                onClick={() => setSel(k)}
                className={`bg-surface min-h-[72px] sm:min-h-[88px] p-2 text-left align-top transition ${!isSameMonth(day, m) ? "opacity-35" : ""} ${sel === k ? "bg-brand/5" : "hover:bg-bg"}`}
              >
                <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isT ? "bg-brand text-white" : "text-ink"}`}>
                  {format(day, "d")}
                </div>
                {exs.map(e => (
                  <div key={e.id} className="mt-1 rounded px-1 text-[10px] text-white font-medium truncate" style={{ background: sub(e.subjectId)?.color }}>
                    {sub(e.subjectId)?.abbr} exam
                  </div>
                ))}
                {n > 0 && !exs.length && (
                  <div className="mt-1 text-[10px] text-mute">{doneTasks}/{n}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card py-0">
        <div className="font-semibold text-sm px-4 pt-4 pb-2">{format(parseISO(sel), "EEEE, d MMMM")}</div>
        {d.exams.filter(e => e.date === sel).map(e => (
          <div key={e.id} className="px-4 pb-2 text-sm font-medium flex items-center gap-2 text-danger">
            <AlertCircle size={13} />Exam: {sub(e.subjectId)?.name}
          </div>
        ))}
        {d.tasks.filter(t => t.date === sel).sort((a, b) => a.start.localeCompare(b.start)).map(t => <TaskRow key={t.id} t={t} />)}
        {!d.tasks.some(t => t.date === sel) && !d.exams.some(e => e.date === sel) && (
          <p className="text-sm text-mute px-4 pb-4">Nothing scheduled. Add tasks from the planner.</p>
        )}
      </div>
    </div>
  );
}

// ─── timer ────────────────────────────────────────────────────────────────────
function TimerPage({ setFocus }: any) {
  useTick();
  const d = useStore(), sub = useSub(), a = d.active;
  const [sid, setSid] = useState("aad"), [mode, setMode] = useState(25);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-mute uppercase tracking-widest font-medium mb-1">Focus</div>
        <h1 className="text-[28px] font-bold tracking-tight">Study Timer</h1>
      </div>

      <div className="card text-center space-y-5 py-10">
        {a ? (
          <>
            <div className="text-xs text-mute uppercase tracking-widest font-medium">{sub(a.subjectId)?.name}</div>
            <div className="num text-7xl font-bold tracking-tight text-ink">
              {clock(a.targetMin ? a.targetMin * 60000 - elapsed(a) : elapsed(a))}
            </div>
            {a.targetMin > 0 && elapsed(a) >= a.targetMin * 60000 && (
              <div className="text-ok text-sm font-medium">✓ Target reached — finish to save.</div>
            )}
            <div className="flex justify-center gap-2 flex-wrap">
              <button className="btn btn-p" onClick={() => a.runningSince ? d.pause() : d.resume()}>
                {a.runningSince ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
              </button>
              <button className="btn" onClick={d.finish}>Finish & save</button>
              <button className="btn" onClick={() => setFocus(true)}><Maximize2 size={14} /> Focus mode</button>
              <button className="btn text-danger" onClick={() => confirm("Discard? Time won't be saved.") && d.discard()}>Discard</button>
            </div>
          </>
        ) : (
          <>
            <div className="num text-7xl font-bold tracking-tight text-mute">00:00</div>
            <div className="flex justify-center gap-2 flex-wrap">
              <select className="inp" value={sid} onChange={e => setSid(e.target.value)}>
                {d.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="inp" value={mode} onChange={e => setMode(+e.target.value)}>
                <option value={25}>Pomodoro — 25 min</option>
                <option value={5}>Short break — 5 min</option>
                <option value={15}>Long break — 15 min</option>
                <option value={50}>Countdown — 50 min</option>
                <option value={0}>Stopwatch</option>
              </select>
            </div>
            <button className="btn btn-p inline-flex gap-2" onClick={() => d.start(sid, undefined, mode)}>
              <Play size={14} /> Start session
            </button>
          </>
        )}
      </div>

      <div className="card">
        <div className="font-semibold text-sm mb-3">Session history</div>
        {d.sessions.length ? (
          [...d.sessions].reverse().slice(0, 30).map(s => (
            <div key={s.id} className="flex justify-between text-sm py-2 border-b border-line last:border-0">
              <span>
                <b style={{ color: sub(s.subjectId)?.color }}>{sub(s.subjectId)?.abbr}</b>
                <span className="text-mute ml-2 text-xs num">{format(s.start, "d MMM, h:mm a")}</span>
              </span>
              <span className="num text-sm font-semibold">{clock(s.ms)}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-mute py-2">No sessions yet. Start one to build your study history.</p>
        )}
      </div>
    </div>
  );
}

// ─── settings ─────────────────────────────────────────────────────────────────
function SettingsPage() {
  const d = useStore(), sub = useSub();
  const exp = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ subjects: d.subjects, exams: d.exams, tasks: d.tasks, sessions: d.sessions, active: d.active, settings: d.settings }, null, 2)], { type: "application/json" }));
    a.download = `studylog-${today()}.json`;
    a.click();
  };
  const imp = async (f?: File) => {
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (!Array.isArray(j.subjects) || !Array.isArray(j.tasks) || !Array.isArray(j.exams) || !Array.isArray(j.sessions)) throw 0;
      if (confirm("Replace all current data with this file?")) d.replace({ ...j, active: j.active ?? null, settings: j.settings ?? { targetHours: 5.5 } });
    } catch { alert("This file isn't a valid STUDYLOG export.") }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-mute uppercase tracking-widest font-medium mb-1">Preferences</div>
        <h1 className="text-[28px] font-bold tracking-tight">Settings</h1>
      </div>

      <div className="card">
        <div className="text-sm font-medium mb-1">Daily study target</div>
        <div className="flex items-center gap-3">
          <input
            type="number" step="0.5" min="0"
            className="inp w-24"
            value={d.settings.targetHours}
            onChange={e => d.mut(x => ({ settings: { ...x.settings, targetHours: +e.target.value } }))}
          />
          <span className="text-sm text-mute">hours / day</span>
        </div>
      </div>

      <div className="card">
        <div className="text-sm font-medium mb-3">Examination dates</div>
        {d.exams.map(e => (
          <div key={e.id} className="flex items-center justify-between py-1.5 text-sm border-b border-line last:border-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: sub(e.subjectId)?.color }} />
              <b>{sub(e.subjectId)?.name}</b>
            </div>
            <input
              type="date"
              className="inp text-xs"
              value={e.date}
              onChange={ev => d.mut(x => ({ exams: x.exams.map(y => y.id === e.id ? { ...y, date: ev.target.value } : y) }))}
            />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="text-sm font-medium mb-3">Data management</div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn" onClick={exp}>Export JSON</button>
          <label className="btn cursor-pointer">
            Import JSON
            <input type="file" accept="application/json" hidden onChange={e => imp(e.target.files?.[0])} />
          </label>
          <button className="btn text-danger" onClick={() => { if (confirm("Erase everything and restore the starting plan?")) d.replace(seed()) }}>
            Reset data
          </button>
        </div>
      </div>
    </div>
  );
}
