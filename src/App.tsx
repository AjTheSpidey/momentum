import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowDownToLine,
  ArrowUpRight,
  CalendarDays,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  History,
  Inbox,
  Leaf,
  ListChecks,
  Plus,
  RotateCcw,
  Repeat2,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

type Task = {
  id: string;
  title: string;
  createdAt: string;
  focusDate?: string;
  scheduledDate?: string;
  completedAt?: string;
};

type Routine = {
  id: string;
  title: string;
  days: number[];
  createdAt: string;
  completions: Record<string, boolean>;
};

type View = 'today' | 'inbox' | 'rhythms' | 'history';

const queryClient = new QueryClient();
const STORAGE_KEY = 'momentum-tasks-v1';
const ROUTINES_STORAGE_KEY = 'momentum-routines-v1';
const SEED_TASKS: Task[] = [
  { id: 'seed-1', title: 'Send the proposal to Maya', createdAt: '2025-01-01T09:00:00.000Z' },
  { id: 'seed-2', title: 'Book the dentist appointment', createdAt: '2025-01-01T09:01:00.000Z' },
  { id: 'seed-3', title: 'Outline the first chapter', createdAt: '2025-01-01T09:02:00.000Z' },
  { id: 'seed-4', title: 'Pick up oat milk on the way home', createdAt: '2025-01-01T09:03:00.000Z' },
];
const SEED_ROUTINES: Routine[] = [
  { id: 'routine-1', title: 'Drink a full glass of water', days: [0, 1, 2, 3, 4, 5, 6], createdAt: '2025-01-01T08:00:00.000Z', completions: {} },
  { id: 'routine-2', title: 'Take a walk outside', days: [1, 3, 5], createdAt: '2025-01-01T08:01:00.000Z', completions: {} },
  { id: 'routine-3', title: 'Plan tomorrow before signing off', days: [1, 2, 3, 4, 5], createdAt: '2025-01-01T08:02:00.000Z', completions: {} },
];
const DAY_OPTIONS = [
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
  { value: 0, label: 'S' },
];

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
}

function formatScheduledDate(value: string) {
  if (value === dateKey()) return 'Today';
  const date = new Date(`${value}T12:00:00`);
  const formatted = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
  return value < dateKey() ? `Overdue · ${formatted}` : formatted;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function calendarMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

function calendarMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function loadTasks(): Task[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Task[];
  } catch {
    return SEED_TASKS.map((task) => ({ ...task, focusDate: task.id === 'seed-1' ? dateKey() : undefined }));
  }
  return SEED_TASKS.map((task) => ({ ...task, focusDate: task.id === 'seed-1' ? dateKey() : undefined }));
}

function loadRoutines(): Routine[] {
  try {
    const stored = window.localStorage.getItem(ROUTINES_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Routine[];
  } catch {
    return SEED_ROUTINES;
  }
  return SEED_ROUTINES;
}

function routineIsDueToday(routine: Routine, date = new Date()) {
  return routine.days.includes(date.getDay());
}

function routineIsCompleteToday(routine: Routine, today: string) {
  return routine.completions[today] === true;
}

function AppShell() {
  const [view, setView] = useState<View>('today');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [showRoutineComposer, setShowRoutineComposer] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTasks(loadTasks());
      setRoutines(loadRoutines());
      setIsHydrated(true);
    }, 180);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isHydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, isHydrated]);

  useEffect(() => {
    if (isHydrated) window.localStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
  }, [routines, isHydrated]);

  const today = dateKey();
  const focused = useMemo(
    () => tasks.filter((task) => task.focusDate === today && !task.completedAt),
    [tasks, today],
  );
  const finishedToday = useMemo(
    () => tasks.filter((task) => task.completedAt?.startsWith(today)),
    [tasks, today],
  );
  const focusHistory = useMemo(() => tasks.filter((task) => task.completedAt), [tasks]);
  const inbox = useMemo(
    () => tasks.filter((task) => !task.focusDate && !task.completedAt && task.scheduledDate !== today),
    [tasks, today],
  );
  const dueRoutines = useMemo(() => routines.filter((routine) => routineIsDueToday(routine)), [routines, today]);
  const completedRoutinesToday = dueRoutines.filter((routine) => routineIsCompleteToday(routine, today)).length;
  const scheduledToday = useMemo(
    () => tasks.filter((task) => task.scheduledDate === today && task.focusDate !== today && !task.completedAt),
    [tasks, today],
  );
  const completedCount = finishedToday.length;
  const totalToday = focused.length + scheduledToday.length + completedCount;
  const progress = totalToday ? Math.round((completedCount / totalToday) * 100) : 0;

  const addTask = (scheduledDate?: string) => {
    const title = newTask.trim();
    if (!title) return;
    setTasks((current) => [
      { id: `task-${Date.now()}`, title, createdAt: new Date().toISOString(), scheduledDate },
      ...current,
    ]);
    setNewTask('');
    setShowComposer(false);
    setView(scheduledDate === today ? 'today' : 'inbox');
  };

  const promoteTask = (id: string) => {
    if (focused.length >= 3) return;
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, focusDate: today } : task)));
    setView('today');
  };

  const removeTask = (id: string) => setTasks((current) => current.filter((task) => task.id !== id));

  const toggleComplete = (id: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? task.completedAt
            ? { ...task, completedAt: undefined }
            : { ...task, completedAt: new Date().toISOString() }
          : task,
      ),
    );
  };

  const addRoutine = (title: string, days: number[]) => {
    setRoutines((current) => [
      { id: `routine-${Date.now()}`, title, days, createdAt: new Date().toISOString(), completions: {} },
      ...current,
    ]);
    setShowRoutineComposer(false);
    setView('rhythms');
  };

  const toggleRoutine = (id: string) => {
    setRoutines((current) =>
      current.map((routine) => {
        if (routine.id !== id) return routine;
        const completed = routineIsCompleteToday(routine, today);
        const completions = { ...routine.completions };
        if (completed) {
          delete completions[today];
        } else {
          completions[today] = true;
        }
        return { ...routine, completions };
      }),
    );
  };

  const removeRoutine = (id: string) => setRoutines((current) => current.filter((routine) => routine.id !== id));

  const clearAll = () => {
    if (window.confirm('Clear every one-off task from Momentum? Your recurring rhythms will stay.')) {
      setTasks([]);
      setView('today');
    }
  };

  const resetExamples = () => {
    setTasks(SEED_TASKS.map((task) => ({ ...task, focusDate: task.id === 'seed-1' ? today : undefined })));
    setRoutines(SEED_ROUTINES);
    setView('today');
  };

  const goTo = (nextView: View) => {
    setView(nextView);
    setShowComposer(false);
    setShowRoutineComposer(false);
  };

  return (
    <div className="grain min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1540px]">
        <Sidebar
          view={view}
          onNavigate={goTo}
          onNewTask={() => setShowComposer(true)}
          onNewRoutine={() => setShowRoutineComposer(true)}
        />

        <main className="min-w-0 flex-1 px-5 py-5 sm:px-8 sm:py-7 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-[1080px]">
            <TopBar
              view={view}
              onNewTask={() => setShowComposer(true)}
              onNewRoutine={() => setShowRoutineComposer(true)}
              onNavigate={goTo}
              onClear={clearAll}
              onReset={resetExamples}
            />
            {!isHydrated ? (
              <LoadingState />
            ) : view === 'history' ? (
              <HistoryView tasks={tasks} completedCount={completedCount} />
            ) : view === 'rhythms' ? (
              <RhythmsView
                routines={routines}
                today={today}
                dueCount={dueRoutines.length}
                completedCount={completedRoutinesToday}
                onToggle={toggleRoutine}
                onRemove={removeRoutine}
                onNewRoutine={() => setShowRoutineComposer(true)}
              />
            ) : (
              <TodayView
                view={view}
                focused={focused}
                scheduledToday={scheduledToday}
                inbox={inbox}
                finishedToday={finishedToday}
                progress={progress}
                onPromote={promoteTask}
                onRemove={removeTask}
                onToggleComplete={toggleComplete}
                onNavigate={goTo}
                focusFull={focused.length >= 3}
              />
            )}
          </div>
        </main>
      </div>

      {showComposer && (
        <Composer
          value={newTask}
          onChange={setNewTask}
          onSubmit={addTask}
          onClose={() => setShowComposer(false)}
        />
      )}
      {showRoutineComposer && (
        <RoutineComposer
          onSubmit={addRoutine}
          onClose={() => setShowRoutineComposer(false)}
        />
      )}
    </div>
  );
}

function Sidebar({
  view,
  onNavigate,
  onNewTask,
  onNewRoutine,
}: {
  view: View;
  onNavigate: (view: View) => void;
  onNewTask: () => void;
  onNewRoutine: () => void;
}) {
  const isRhythms = view === 'rhythms';
  return (
    <aside className="hidden w-[252px] shrink-0 flex-col bg-sidebar px-5 py-7 text-sidebar-foreground lg:flex">
      <div className="mb-12 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <Leaf size={19} strokeWidth={2.4} />
        </div>
        <div>
          <p className="display-serif text-[21px] leading-none">Momentum</p>
          <p className="mono-label mt-1 text-[9px] text-sidebar-foreground/55">make room to move</p>
        </div>
      </div>

      <button
        type="button"
        onClick={isRhythms ? onNewRoutine : onNewTask}
        data-testid="button-new-task-sidebar"
        className="mb-9 flex w-full items-center justify-between rounded-xl bg-sidebar-primary px-4 py-3.5 text-sm font-bold text-sidebar-primary-foreground shadow-[0_8px_20px_hsl(32_89%_59%_/_0.18)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        <span className="flex items-center gap-2.5"><Plus size={17} /> {isRhythms ? 'Add a rhythm' : 'Add a task'}</span>
        <span className="font-mono text-[10px] opacity-60">N</span>
      </button>

      <nav className="space-y-1" aria-label="Main navigation">
        <NavButton active={view === 'today'} icon={<Target size={18} />} label="Today" onClick={() => onNavigate('today')} testId="nav-today" />
        <NavButton active={view === 'inbox'} icon={<Inbox size={18} />} label="Inbox" onClick={() => onNavigate('inbox')} testId="nav-inbox" />
          <NavButton active={view === 'rhythms'} icon={<Repeat2 size={18} />} label="Rhythms" onClick={() => onNavigate('rhythms')} testId="nav-rhythms" />
        <NavButton active={view === 'history'} icon={<History size={18} />} label="History" onClick={() => onNavigate('history')} testId="nav-history" />
      </nav>

      <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/45 p-4">
        <div className="mb-3 flex items-center gap-2 text-sidebar-primary"><Sparkles size={15} /><span className="mono-label text-[9px]">A small practice</span></div>
        <p className="text-[13px] leading-relaxed text-sidebar-foreground/70">The goal is not to fit more in. It is to make space for what matters.</p>
      </div>
      <p className="mt-5 px-2 text-[11px] text-sidebar-foreground/35">Your tasks live only in this browser.</p>
    </aside>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick,
  testId,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-colors ${
        active ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/58 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
      }`}
    >
      {icon}<span>{label}</span>{active && <ChevronRight className="ml-auto" size={15} />}
    </button>
  );
}

function TopBar({
  view,
  onNewTask,
  onNewRoutine,
  onNavigate,
  onClear,
  onReset,
}: {
  view: View;
  onNewTask: () => void;
  onNewRoutine: () => void;
  onNavigate: (view: View) => void;
  onClear: () => void;
  onReset: () => void;
}) {
  const title = view === 'today' ? 'A clear day starts here.' : view === 'inbox' ? 'Make room for what is next.' : view === 'rhythms' ? 'Build a rhythm that carries you.' : 'Notice your momentum.';
  const eyebrow = view === 'today' ? 'Your focus' : view === 'inbox' ? 'Open loops' : view === 'rhythms' ? 'Recurring care' : 'A quiet record';
  const isRhythms = view === 'rhythms';
  const openComposer = isRhythms ? onNewRoutine : onNewTask;
  return (
    <header className="mb-9">
      <div className="mb-7 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Leaf size={17} /></div>
          <span className="display-serif text-xl">Momentum</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onReset} data-testid="button-reset-mobile" className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Reset examples"><RotateCcw size={16} /></button>
           <button type="button" onClick={openComposer} data-testid="button-new-task-mobile" className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground" aria-label={isRhythms ? 'Add a rhythm' : 'Add a task'}><Plus size={18} /></button>
        </div>
      </div>
       <div className="mb-7 flex gap-1 overflow-x-auto pb-1 lg:hidden" aria-label="Mobile navigation">
         <MobileNavButton active={view === 'today'} icon={<Target size={15} />} label="Today" onClick={() => onNavigate('today')} />
         <MobileNavButton active={view === 'inbox'} icon={<Inbox size={15} />} label="Inbox" onClick={() => onNavigate('inbox')} />
         <MobileNavButton active={view === 'rhythms'} icon={<Repeat2 size={15} />} label="Rhythms" onClick={() => onNavigate('rhythms')} />
         <MobileNavButton active={view === 'history'} icon={<History size={15} />} label="History" onClick={() => onNavigate('history')} />
       </div>
      <div className="flex items-end justify-between gap-5">
        <div className="fade-up">
          <p className="mono-label mb-3 text-[10px] text-primary">{eyebrow}</p>
          <h1 className="display-serif max-w-[660px] text-[clamp(2.35rem,5vw,4.25rem)] leading-[.98] tracking-[-0.04em] text-foreground">{title}</h1>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays size={15} /> {formatDate()}</p>
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <button type="button" onClick={onReset} data-testid="button-reset-examples" className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Reset example tasks"><RotateCcw size={16} /></button>
           {!isRhythms && <button type="button" onClick={onClear} data-testid="button-clear-all" className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive" title="Clear all tasks"><Trash2 size={16} /></button>}
           <button type="button" onClick={openComposer} data-testid="button-new-task-header" className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"><Plus size={17} /> {isRhythms ? 'Add rhythm' : 'Add task'}</button>
        </div>
      </div>
    </header>
  );
}

function MobileNavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-colors ${active ? 'bg-foreground text-background' : 'bg-card/70 text-muted-foreground hover:bg-card hover:text-foreground'}`}
    >
      {icon}{label}
    </button>
  );
}

function TodayView({
  view,
  focused,
  scheduledToday,
  inbox,
  finishedToday,
  progress,
  onPromote,
  onRemove,
  onToggleComplete,
  onNavigate,
  focusFull,
}: {
  view: View;
  focused: Task[];
  scheduledToday: Task[];
  inbox: Task[];
  finishedToday: Task[];
  progress: number;
  onPromote: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onNavigate: (view: View) => void;
  focusFull: boolean;
}) {
  if (view === 'inbox') {
    return <InboxView inbox={inbox} focusFull={focusFull} onPromote={onPromote} onRemove={onRemove} onNavigate={onNavigate} />;
  }
  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.8fr)]">
      <section className="fade-up delay-1 rounded-[24px] border border-card-border bg-card p-5 shadow-sm sm:p-7" data-testid="section-today-focus">
        <div className="mb-7 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary"><Target size={17} /><span className="mono-label text-[10px]">Today's three</span></div>
            <p className="text-sm text-muted-foreground">Choose less. Finish more.</p>
          </div>
          <ProgressMark value={progress} />
        </div>
        {focused.length === 0 && scheduledToday.length === 0 && finishedToday.length === 0 ? (
          <FocusEmpty onNavigate={onNavigate} />
        ) : (
          <div className="space-y-2.5">
            {finishedToday.map((task, index) => <TaskRow key={task.id} task={task} completed onToggle={onToggleComplete} onRemove={onRemove} index={index} />)}
            {focused.map((task, index) => <TaskRow key={task.id} task={task} onToggle={onToggleComplete} onRemove={onRemove} index={index + finishedToday.length} />)}
            {scheduledToday.length > 0 && (
              <div className="mt-6 border-t border-border/60 pt-5">
                <div className="mb-3 flex items-center gap-2"><CalendarCheck2 size={15} className="text-primary" /><span className="mono-label text-[10px] text-primary">Scheduled for today</span></div>
                <div className="space-y-2.5">
                  {scheduledToday.map((task, index) => <TaskRow key={task.id} task={task} onToggle={onToggleComplete} onRemove={onRemove} index={index + finishedToday.length + focused.length} />)}
                </div>
              </div>
            )}
          </div>
        )}
        {focused.length + scheduledToday.length + finishedToday.length > 0 && focused.length < 3 && (
          <button type="button" onClick={() => onNavigate('inbox')} data-testid="button-add-focus-task" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-foreground"><Plus size={16} /> Choose another from inbox</button>
        )}
        {focusFull && focused.length === 3 && <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><CheckCircle2 size={15} className="text-accent-foreground" /> Three is enough for today.</p>}
      </section>

      <aside className="fade-up delay-2 space-y-5">
        <div className="rounded-[24px] bg-[hsl(var(--secondary))] p-6">
          <div className="mb-5 flex items-center justify-between"><span className="mono-label text-[10px] text-muted-foreground">A gentle nudge</span><Leaf size={17} className="text-accent-foreground" /></div>
          <p className="display-serif text-[26px] leading-tight text-foreground">Progress is a direction, not a score.</p>
          <div className="mt-6 h-px bg-foreground/10" />
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">Each completed task makes the next decision a little lighter.</p>
        </div>
        <InboxPreview inbox={inbox} onNavigate={onNavigate} />
      </aside>
    </div>
  );
}

function ProgressMark({ value }: { value: number }) {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `conic-gradient(hsl(var(--primary)) ${value}%, hsl(var(--muted)) 0)` }} data-testid="status-progress">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-[11px] font-extrabold text-foreground">{value}%</div>
    </div>
  );
}

function FocusEmpty({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-input bg-background/45 px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Target size={23} /></div>
      <h2 className="display-serif text-2xl">A blank page can be a beginning.</h2>
      <p className="mt-2 max-w-[290px] text-sm leading-relaxed text-muted-foreground">Pick one small, meaningful thing from your inbox to give today a shape.</p>
      <button type="button" onClick={() => onNavigate('inbox')} data-testid="button-browse-inbox-empty" className="mt-5 flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background transition-transform hover:-translate-y-0.5"><Inbox size={16} /> Browse inbox</button>
    </div>
  );
}

function TaskRow({
  task,
  completed = false,
  onToggle,
  onRemove,
  index,
}: {
  task: Task;
  completed?: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  index: number;
}) {
  return (
    <div className={`task-enter group flex items-center gap-3 rounded-2xl border px-3.5 py-3.5 transition-colors sm:px-4 ${completed ? 'border-transparent bg-muted/60' : 'border-card-border bg-background/60 hover:border-primary/40 hover:bg-background'}`} style={{ animationDelay: `${index * 55}ms` }} data-testid={`row-task-${task.id}`}>
      <button type="button" onClick={() => onToggle(task.id)} data-testid={`button-complete-task-${task.id}`} aria-label={completed ? `Reopen ${task.title}` : `Complete ${task.title}`} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${completed ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-transparent hover:border-primary hover:bg-primary/10'}`}>
        {completed ? <Check size={14} strokeWidth={3} /> : <Circle size={12} className="opacity-0" />}
      </button>
      <span className={`min-w-0 flex-1 text-sm font-semibold ${completed ? 'text-muted-foreground line-through decoration-primary/60' : 'text-foreground'}`} data-testid={`text-task-${task.id}`}>{task.title}</span>
      <button type="button" onClick={() => onRemove(task.id)} data-testid={`button-remove-task-${task.id}`} aria-label={`Remove ${task.title}`} className="rounded-lg p-1.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:!bg-destructive/10 hover:!text-destructive"><Trash2 size={15} /></button>
    </div>
  );
}

function InboxPreview({ inbox, onNavigate }: { inbox: Task[]; onNavigate: (view: View) => void }) {
  return (
    <div className="rounded-[24px] border border-card-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Inbox size={16} className="text-primary" /><h2 className="text-sm font-extrabold">Inbox</h2><span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{inbox.length}</span></div><button type="button" onClick={() => onNavigate('inbox')} data-testid="button-view-inbox" className="text-muted-foreground hover:text-foreground"><ArrowUpRight size={16} /></button></div>
      {inbox.length === 0 ? <p className="py-4 text-sm leading-relaxed text-muted-foreground">Nothing waiting in the wings. Nice.</p> : <div className="space-y-1">{inbox.slice(0, 3).map((task) => <div key={task.id} className="flex items-center gap-2.5 border-b border-border/60 py-2.5 last:border-0"><Circle size={9} className="shrink-0 text-primary" /><span className="truncate text-[13px]">{task.title}</span></div>)}</div>}
      {inbox.length > 3 && <button type="button" onClick={() => onNavigate('inbox')} data-testid="button-see-all-inbox" className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">See all <ChevronRight size={13} /></button>}
    </div>
  );
}

function InboxView({
  inbox,
  focusFull,
  onPromote,
  onRemove,
  onNavigate,
}: {
  inbox: Task[];
  focusFull: boolean;
  onPromote: (id: string) => void;
  onRemove: (id: string) => void;
  onNavigate: (view: View) => void;
}) {
  return (
    <section className="fade-up delay-1 max-w-[760px]">
      <div className="mb-5 flex items-center justify-between"><p className="text-sm text-muted-foreground">{inbox.length === 0 ? 'Clear space, clear mind.' : `${inbox.length} ${inbox.length === 1 ? 'task' : 'tasks'} waiting for a decision`}</p><span className="mono-label text-[10px] text-muted-foreground">uncategorized</span></div>
      {inbox.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-input bg-card/45 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/50 text-accent-foreground"><Inbox size={23} /></div>
          <h2 className="display-serif text-2xl">Your inbox is quiet.</h2>
          <p className="mx-auto mt-2 max-w-[310px] text-sm leading-relaxed text-muted-foreground">Add anything tugging at your attention. You can decide what deserves today later.</p>
          <button type="button" onClick={() => onNavigate('today')} data-testid="button-back-to-today" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background"><Target size={16} /> Back to today</button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {inbox.map((task, index) => (
            <div key={task.id} className="task-enter group flex items-center gap-4 rounded-2xl border border-card-border bg-card px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:px-5" style={{ animationDelay: `${index * 50}ms` }} data-testid={`card-inbox-task-${task.id}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><Circle size={13} /></div>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold" data-testid={`text-inbox-task-${task.id}`}>{task.title}</span>
                {task.scheduledDate && <span className={`mt-1 block font-mono text-[10px] ${task.scheduledDate < dateKey() ? 'text-destructive' : 'text-muted-foreground'}`}>{formatScheduledDate(task.scheduledDate)}</span>}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button type="button" onClick={() => onPromote(task.id)} disabled={focusFull} data-testid={`button-promote-task-${task.id}`} className="flex items-center gap-1.5 rounded-xl bg-primary/15 px-3 py-2 text-xs font-extrabold text-primary-foreground transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-45"><ArrowDownToLine size={14} /> <span className="hidden sm:inline">For today</span></button>
                <button type="button" onClick={() => onRemove(task.id)} data-testid={`button-delete-inbox-task-${task.id}`} aria-label={`Remove ${task.title}`} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {focusFull && <p className="mt-4 flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-xs text-muted-foreground"><Clock3 size={15} /> Today's three are full. Finish one before adding another.</p>}
        </div>
      )}
    </section>
  );
}

function RhythmsView({
  routines,
  today,
  dueCount,
  completedCount,
  onToggle,
  onRemove,
  onNewRoutine,
}: {
  routines: Routine[];
  today: string;
  dueCount: number;
  completedCount: number;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onNewRoutine: () => void;
}) {
  const completion = dueCount ? Math.round((completedCount / dueCount) * 100) : 0;

  return (
    <section className="fade-up delay-1">
      <div className="mb-7 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
        <div className="rounded-[24px] border border-card-border bg-card p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-primary"><Repeat2 size={17} /><span className="mono-label text-[10px]">Your rhythms</span></div>
              <p className="max-w-[420px] text-sm leading-relaxed text-muted-foreground">The small things that keep life moving, already waiting for you when their day arrives.</p>
            </div>
            <ProgressMark value={completion} />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-secondary/70 px-4 py-3.5">
            <div className="flex items-center gap-2.5"><CalendarCheck2 size={17} className="text-primary" /><span className="text-sm font-bold">Due today</span></div>
            <span className="font-mono text-xs text-muted-foreground">{completedCount} / {dueCount} checked</span>
          </div>
        </div>
        <div className="rounded-[24px] bg-[hsl(var(--secondary))] p-6">
          <div className="mb-5 flex items-center justify-between"><span className="mono-label text-[10px] text-muted-foreground">A lighter way</span><Sparkles size={17} className="text-accent-foreground" /></div>
          <p className="display-serif text-[26px] leading-tight text-foreground">Decide once. Return to it.</p>
          <div className="mt-6 h-px bg-foreground/10" />
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">A rhythm only asks for your attention on the days you chose.</p>
        </div>
      </div>

      <div className="max-w-[820px] rounded-[24px] border border-card-border bg-card p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="display-serif text-2xl">Today’s rituals</h2>
            <p className="mt-1 text-sm text-muted-foreground">{dueCount === 0 ? 'Nothing scheduled for today.' : 'Check them as they happen. Tomorrow starts fresh.'}</p>
          </div>
          <button type="button" onClick={onNewRoutine} data-testid="button-new-routine" className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><Plus size={16} /> <span className="hidden sm:inline">Add rhythm</span><span className="sm:hidden">Add</span></button>
        </div>

        {dueCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-input bg-background/45 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><CalendarCheck2 size={23} /></div>
            <h3 className="display-serif text-2xl">Give today a little shape.</h3>
            <p className="mx-auto mt-2 max-w-[330px] text-sm leading-relaxed text-muted-foreground">Create a rhythm for something you want to remember without having to remember to add it.</p>
            <button type="button" onClick={onNewRoutine} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background"><Plus size={16} /> Create a rhythm</button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {routines.filter((routine) => routineIsDueToday(routine)).map((routine, index) => (
              <RoutineRow
                key={routine.id}
                routine={routine}
                today={today}
                onToggle={onToggle}
                onRemove={onRemove}
                index={index}
              />
            ))}
          </div>
        )}

        {routines.length > dueCount && (
          <div className="mt-8 border-t border-border/60 pt-6">
            <div className="mb-3 flex items-center gap-2"><span className="mono-label text-[10px] text-muted-foreground">Coming up</span><span className="h-px flex-1 bg-border/60" /></div>
            <div className="space-y-2">
              {routines.filter((routine) => !routineIsDueToday(routine)).map((routine) => (
                <div key={routine.id} className="flex items-center gap-3 rounded-xl bg-background/55 px-3.5 py-3">
                  <Repeat2 size={15} className="shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-muted-foreground">{routine.title}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{formatRoutineDays(routine.days)}</span>
                  <button type="button" onClick={() => onRemove(routine.id)} aria-label={`Remove ${routine.title}`} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function RoutineRow({
  routine,
  today,
  onToggle,
  onRemove,
  index,
}: {
  routine: Routine;
  today: string;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  index: number;
}) {
  const completed = routineIsCompleteToday(routine, today);
  return (
    <div className={`task-enter group flex items-center gap-3 rounded-2xl border px-3.5 py-3.5 transition-colors sm:px-4 ${completed ? 'border-transparent bg-muted/60' : 'border-card-border bg-background/60 hover:border-primary/40 hover:bg-background'}`} style={{ animationDelay: `${index * 55}ms` }} data-testid={`row-routine-${routine.id}`}>
      <button type="button" onClick={() => onToggle(routine.id)} data-testid={`button-complete-routine-${routine.id}`} aria-label={completed ? `Uncheck ${routine.title}` : `Check ${routine.title}`} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${completed ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-transparent hover:border-primary hover:bg-primary/10'}`}>
        {completed ? <Check size={14} strokeWidth={3} /> : <Circle size={12} className="opacity-0" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${completed ? 'text-muted-foreground line-through decoration-primary/60' : 'text-foreground'}`}>{routine.title}</p>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">{formatRoutineDays(routine.days)}</p>
      </div>
      <button type="button" onClick={() => onRemove(routine.id)} data-testid={`button-remove-routine-${routine.id}`} aria-label={`Remove ${routine.title}`} className="rounded-lg p-1.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:!bg-destructive/10 hover:!text-destructive"><Trash2 size={15} /></button>
    </div>
  );
}

function formatRoutineDays(days: number[]) {
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((day) => days.includes(day))) return 'Weekdays';
  if (days.length === 2 && [0, 6].every((day) => days.includes(day))) return 'Weekends';
  return DAY_OPTIONS.filter((day) => days.includes(day.value)).map((day) => day.label).join(' · ');
}

function RoutineComposer({
  onSubmit,
  onClose,
}: {
  onSubmit: (title: string, days: number[]) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<number[]>(DAY_OPTIONS.map((day) => day.value));
  const toggleDay = (day: number) => setDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort((a, b) => a - b));
  const submit = () => {
    if (title.trim() && days.length > 0) onSubmit(title.trim(), days);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/25 p-3 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Add a recurring rhythm">
      <div className="task-enter w-full max-w-[540px] rounded-[24px] border border-card-border bg-card p-5 shadow-[0_24px_70px_hsl(174_30%_18%_/_0.18)] sm:p-7">
        <div className="mb-6 flex items-start justify-between"><div><p className="mono-label mb-2 text-[10px] text-primary">A recurring rhythm</p><h2 className="display-serif text-3xl">Make it easier to remember.</h2></div><button type="button" onClick={onClose} data-testid="button-close-routine-composer" className="rounded-xl p-2 text-muted-foreground hover:bg-muted" aria-label="Close"><X size={18} /></button></div>
        <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(); if (event.key === 'Escape') onClose(); }} data-testid="input-new-routine" placeholder="What should come back to you?" className="w-full border-b-2 border-input bg-transparent px-1 py-3 text-lg outline-none placeholder:text-muted-foreground/55 focus:border-primary" />
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between"><p className="text-sm font-bold">Repeat on</p><button type="button" onClick={() => setDays(DAY_OPTIONS.map((day) => day.value))} className="text-xs font-bold text-primary hover:underline">Every day</button></div>
          <div className="grid grid-cols-7 gap-2">
            {DAY_OPTIONS.map((day, index) => {
              const selected = days.includes(day.value);
              return <button key={`${day.value}-${index}`} type="button" onClick={() => toggleDay(day.value)} aria-pressed={selected} aria-label={`${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.value]} ${selected ? 'selected' : 'not selected'}`} className={`flex aspect-square items-center justify-center rounded-xl border text-sm font-extrabold transition-all ${selected ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-input bg-background text-muted-foreground hover:border-primary/60'}`}>{day.label}</button>;
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{days.length === 0 ? 'Choose at least one day.' : `${formatRoutineDays(days)} · checks reset each new day`}</p>
        </div>
        <div className="mt-7 flex items-center justify-between gap-4"><p className="text-xs text-muted-foreground">You can always remove a rhythm later.</p><button type="button" onClick={submit} disabled={!title.trim() || days.length === 0} data-testid="button-submit-routine" className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"><CalendarCheck2 size={16} /> Save rhythm</button></div>
      </div>
    </div>
  );
}

function HistoryView({ tasks, completedCount }: { tasks: Task[]; completedCount: number }) {
  const completed = [...tasks].filter((task) => task.completedAt).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  const total = tasks.length;
  return (
    <section className="fade-up delay-1">
      <div className="mb-7 grid gap-4 sm:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[24px] bg-sidebar p-6 text-sidebar-foreground sm:p-7">
          <div className="mb-10 flex items-center justify-between"><span className="mono-label text-[10px] text-sidebar-foreground/55">Since you began</span><TrendingUp size={18} className="text-sidebar-primary" /></div>
          <p className="display-serif text-5xl text-sidebar-primary">{completed.length}</p>
          <p className="mt-2 text-sm text-sidebar-foreground/65">things moved forward</p>
        </div>
        <div className="rounded-[24px] border border-card-border bg-card p-6 sm:p-7">
          <div className="mb-9 flex items-center justify-between"><span className="mono-label text-[10px] text-muted-foreground">Today</span><Target size={18} className="text-primary" /></div>
          <p className="display-serif text-5xl">{completedCount}<span className="text-2xl text-muted-foreground"> / 3</span></p>
          <p className="mt-2 text-sm text-muted-foreground">focus items completed</p>
        </div>
      </div>
      <div className="max-w-[760px] rounded-[24px] border border-card-border bg-card p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center justify-between"><h2 className="display-serif text-2xl">Completed, not forgotten.</h2><ListChecks size={19} className="text-primary" /></div>
        {completed.length === 0 ? <div className="rounded-2xl bg-background px-5 py-10 text-center"><p className="text-sm text-muted-foreground">Your completed tasks will gather here as a quiet record.</p></div> : <div className="space-y-1">{completed.map((task) => <div key={task.id} className="flex items-center gap-3 border-b border-border/60 py-3.5 last:border-0"><CheckCircle2 size={17} className="shrink-0 text-primary" /><span className="flex-1 text-sm font-semibold">{task.title}</span><span className="font-mono text-[10px] text-muted-foreground">{task.completedAt ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(task.completedAt)) : ''}</span></div>)}</div>}
        {total === 0 && <p className="mt-4 text-center font-mono text-[10px] text-muted-foreground">0 tasks in your space</p>}
      </div>
    </section>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  onClose,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (scheduledDate?: string) => void;
  onClose: () => void;
}) {
  const [scheduleMode, setScheduleMode] = useState<'inbox' | 'today' | 'date'>('inbox');
  const [scheduledDate, setScheduledDate] = useState(dateKey());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const submit = () => {
    if (!value.trim()) return;
    onSubmit(scheduleMode === 'inbox' ? undefined : scheduleMode === 'today' ? dateKey() : scheduledDate);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/25 p-3 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Add a task">
      <div className="task-enter w-full max-w-[520px] rounded-[24px] border border-card-border bg-card p-5 shadow-[0_24px_70px_hsl(174_30%_18%_/_0.18)] sm:p-7">
        <div className="mb-6 flex items-start justify-between"><div><p className="mono-label mb-2 text-[10px] text-primary">New open loop</p><h2 className="display-serif text-3xl">Get it out of your head.</h2></div><button type="button" onClick={onClose} data-testid="button-close-composer" className="rounded-xl p-2 text-muted-foreground hover:bg-muted" aria-label="Close"><X size={18} /></button></div>
        <input autoFocus value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(); if (event.key === 'Escape') onClose(); }} data-testid="input-new-task" placeholder="What keeps tugging at you?" className="w-full border-b-2 border-input bg-transparent px-1 py-3 text-lg outline-none placeholder:text-muted-foreground/55 focus:border-primary" />
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between"><p className="text-sm font-bold">When should this appear?</p><span className="font-mono text-[10px] text-muted-foreground">optional</span></div>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['inbox', 'Inbox', 'Decide later'],
              ['today', 'Today', 'Bring it into focus'],
              ['date', 'A date', 'Choose when'],
            ] as const).map(([mode, label, description]) => (
              <button key={mode} type="button" onClick={() => { setScheduleMode(mode); if (mode !== 'date') setShowDatePicker(false); }} aria-pressed={scheduleMode === mode} className={`rounded-xl border px-3 py-3 text-left transition-all ${scheduleMode === mode ? 'border-primary bg-primary/10 text-foreground' : 'border-input bg-background text-muted-foreground hover:border-primary/60'}`}>
                <span className="block text-xs font-extrabold">{label}</span>
                <span className="mt-1 block text-[10px] leading-tight opacity-75">{description}</span>
              </button>
            ))}
          </div>
          {scheduleMode === 'date' && (
            <div className="relative mt-3">
              <button type="button" onClick={() => setShowDatePicker((current) => !current)} aria-expanded={showDatePicker} aria-haspopup="dialog" data-testid="button-open-task-date-picker" className="flex w-full items-center justify-between rounded-xl border border-input bg-background px-3.5 py-3 text-left text-sm font-bold transition-colors hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                <span className="flex items-center gap-2.5"><CalendarDays size={16} className="text-primary" />{formatScheduledDate(scheduledDate)}</span>
                <ChevronRight size={16} className={`text-muted-foreground transition-transform ${showDatePicker ? 'rotate-90' : ''}`} />
              </button>
              {showDatePicker && <CustomDatePicker value={scheduledDate} onChange={(value) => { setScheduledDate(value); setShowDatePicker(false); }} />}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{scheduleMode === 'inbox' ? 'It will wait in your inbox until you decide.' : scheduleMode === 'today' ? 'It will be ready in your Today view.' : `It will appear on ${formatScheduledDate(scheduledDate)}.`}</p>
        </div>
        <div className="mt-7 flex items-center justify-between gap-4"><p className="text-xs text-muted-foreground">Press Enter to add it.</p><button type="button" onClick={submit} disabled={!value.trim() || (scheduleMode === 'date' && !scheduledDate)} data-testid="button-submit-task" className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={16} /> Add task</button></div>
      </div>
    </div>
  );
}

function CustomDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const today = dateKey();
  const [month, setMonth] = useState(() => parseDateKey(value || today));
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1, 12).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const currentMonthKey = calendarMonthKey(parseDateKey(today));
  const previousMonthKey = calendarMonthKey(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12));

  return (
    <div className="absolute inset-x-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-card-border bg-card p-4 shadow-[0_18px_45px_hsl(174_30%_18%_/_0.16)]" role="dialog" aria-label="Choose a date" data-testid="custom-task-date-picker">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))} disabled={previousMonthKey < currentMonthKey} aria-label="Previous month" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={17} /></button>
        <p className="display-serif text-lg">{calendarMonthLabel(month)}</p>
        <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))} aria-label="Next month" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ChevronRight size={17} /></button>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`} className="font-mono text-[10px] text-muted-foreground">{day}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} className="aspect-square" />;
          const cellDate = new Date(month.getFullYear(), month.getMonth(), day, 12);
          const cellKey = dateKey(cellDate);
          const disabled = cellKey < today;
          const selected = cellKey === value;
          const isToday = cellKey === today;
          return (
            <button
              key={cellKey}
              type="button"
              onClick={() => onChange(cellKey)}
              disabled={disabled}
              aria-label={cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              aria-pressed={selected}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition-all ${selected ? 'bg-primary text-primary-foreground shadow-sm' : isToday ? 'bg-secondary text-foreground' : 'text-foreground hover:bg-primary/10'} ${disabled ? 'cursor-not-allowed text-muted-foreground/35 hover:bg-transparent' : ''}`}
            >
              {day}
              {isToday && !selected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <p className="text-[10px] text-muted-foreground">Past dates are kept out of new plans.</p>
        <button type="button" onClick={() => onChange(today)} className="rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-primary transition-colors hover:bg-primary/10">Today</button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.8fr)]" aria-label="Loading Momentum">
      <div className="h-[420px] animate-pulse rounded-[24px] bg-muted/70" />
      <div className="space-y-5"><div className="h-[205px] animate-pulse rounded-[24px] bg-muted/70" /><div className="h-[180px] animate-pulse rounded-[24px] bg-muted/70" /></div>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={AppShell} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;