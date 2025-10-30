import React, { useMemo, useState, useEffect } from "react";
import { Search, RefreshCcw, Home, ChevronRight, ArrowLeft, Share2, Download } from "lucide-react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "icon";
  className?: string;
};

function Button({ variant = "default", size = "default", className = "", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    default: "bg-indigo-600 text-white hover:bg-indigo-600/90",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
    outline: "border border-slate-300 text-slate-800 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
  };
  const sizes: Record<string, string> = {
    default: "px-4 py-2 rounded-xl",
    icon: "p-2 rounded-xl",
  };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}>{children}</div>;
}
function CardContent({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
}

type NodeID = string;

type FlowNode = {
  id: NodeID;
  role: "Classroom Teacher" | "Head Teacher" | "Deputy Principal" | "Any";
  title: string;
  body?: string;
  bullet?: string[];
  next?: Array<{ label: string; to: NodeID; emphasis?: boolean }>;
  note?: string;
};

const NODES: Record<NodeID, FlowNode> = {
  "start-class": {
    id: "start-class",
    role: "Classroom Teacher",
    title: "Classroom Teacher – Start",
    body:
      "Implement preventative classroom management and set clear routines. If minor behaviours occur, proceed through least → most intrusive responses before consequences.",
    bullet: [
      "Line up at door, orderly entry, call roll with structure",
      "Seating plan, 5–10 positives for every correction",
      "Use RISE vocabulary and descriptive cues",
      "Plan to student need, including disability adjustments",
    ],
    next: [
      { label: "Minor behaviours present", to: "ct-minor" },
      { label: "Major behaviour (immediate referral)", to: "major-referral" },
    ],
  },
  "ct-minor": {
    id: "ct-minor",
    role: "Classroom Teacher",
    title: "Minor challenging behaviours",
    bullet: [
      "Disruption (talking over, calling out, off-task)",
      "Lateness to class",
      "Inappropriate language",
      "Physical contact (non-serious)",
      "Property misuse (off-task laptop/phone)",
      "Other off-task behaviours",
    ],
    next: [
      { label: "Use least → most intrusive responses", to: "ct-least-most" },
      { label: "Skip to consequences", to: "ct-consequences" },
    ],
  },
  "ct-least-most": {
    id: "ct-least-most",
    role: "Classroom Teacher",
    title: "Least → Most Intrusive Responses",
    bullet: [
      "Proximity, eye contact, body language",
      "Descriptive cues / positive corrections",
      "Choice (e.g., \"close your laptop or place it on my desk\")",
      "Restate expectations / school rule",
      "Verbal warning (\"this is your first warning…\")",
    ],
    next: [
      { label: "Apply in-class consequences", to: "ct-consequences", emphasis: true },
      { label: "Behaviour escalates anyway", to: "major-referral" },
    ],
  },
  "ct-consequences": {
    id: "ct-consequences",
    role: "Classroom Teacher",
    title: "In-class consequences (and documentation)",
    bullet: [
      "Move seats",
      "Brief chat outside (not for entire lesson)",
      "Lunch detention with CTR (Classroom Teacher Reflection)",
      "Document on CHAS & notify parents (email / PAL)",
      "5–10 min discussion after class / at lunch",
    ],
    next: [
      { label: "Student attends detention/reflection", to: "ct-followup-success" },
      { label: "Student does NOT attend", to: "ct-nonattendance-1" },
      { label: "3 × lunch detentions reached", to: "ht-referral-criteria" },
    ],
  },
  "ct-nonattendance-1": {
    id: "ct-nonattendance-1",
    role: "Classroom Teacher",
    title: "Non-attendance: first failure",
    body:
      "Follow the student up and insist they attend reflection at an alternate time. Provide at least one opportunity.",
    next: [
      { label: "Student now attends", to: "ct-followup-success" },
      { label: "Fails to attend a second time", to: "ct-nonattendance-2" },
    ],
  },
  "ct-nonattendance-2": {
    id: "ct-nonattendance-2",
    role: "Classroom Teacher",
    title: "Non-attendance: second failure",
    bullet: [
      "Contact parents and notify of failure (email via CHAS)",
      "Arrange alternate time for reflection/detention",
    ],
    next: [
      { label: "Student attends", to: "ct-followup-success" },
      { label: "3rd failed attendance → REFER TO HT", to: "ht-intake" },
    ],
  },
  "ct-followup-success": {
    id: "ct-followup-success",
    role: "Classroom Teacher",
    title: "Follow-up complete",
    body:
      "Continue monitoring. If challenging behaviours persist, repeat the cycle once more. On the 3rd attempt, refer to Head Teacher and notify parents (call home).",
    next: [
      { label: "Challenging behaviours improve", to: "home" },
      { label: "Repeat cycle (2nd attempt)", to: "ct-least-most" },
      { label: "3rd attempt – refer to Head Teacher", to: "ht-intake" },
    ],
  },
  "ht-referral-criteria": {
    id: "ht-referral-criteria",
    role: "Classroom Teacher",
    title: "Exec-managed challenging behaviours (CT triggers)",
    bullet: [
      "3 × lunch detentions (per process) = Head Teacher referral",
      "Damage to classroom equipment",
      "Significant defiance",
      "Ongoing truancy (HT Wellbeing/Admin)",
    ],
    next: [
      { label: "Refer to Head Teacher", to: "ht-intake", emphasis: true },
      { label: "Behaviour is actually MAJOR", to: "major-referral" },
    ],
  },
  "major-referral": {
    id: "major-referral",
    role: "Any",
    title: "Major behaviours – immediate referral",
    body:
      "Send student with a note to colleague / HT / DP. Follow up with detention & restorative questions / HT referral; notify parents (phone or PAL).",
    next: [
      { label: "Refer to Head Teacher", to: "ht-intake" },
      { label: "Criteria fits DP-managed list", to: "dp-managed" },
    ],
  },
  "ht-intake": {
    id: "ht-intake",
    role: "Head Teacher",
    title: "Head Teacher – Intake",
    body:
      "HT follows up the student, ensures they complete teacher detention with CTR. May wish to speak through CTR with student and the CT.",
    next: [
      { label: "Issue HT consequence(s)", to: "ht-consequences" },
      { label: "Escalate to Deputy (2 × faculty referrals)", to: "dp-intake" },
    ],
  },
  "ht-consequences": {
    id: "ht-consequences",
    role: "Head Teacher",
    title: "Head Teacher – Consequences",
    bullet: [
      "Head Teacher Reflection (HTR)",
      "Faculty afternoon detention",
      "Faculty monitoring card",
      "Restorative meeting (student, CT, HT)",
      "Removal from class (e.g., in-faculty suspension / attend senior lesson)",
      "Notify Deputy Principal",
    ],
    next: [
      { label: "Behaviours improve", to: "home" },
      { label: "No improvement", to: "ht-no-improve" },
      { label: "2 × faculty referrals", to: "dp-intake" },
    ],
  },
  "ht-no-improve": {
    id: "ht-no-improve",
    role: "Head Teacher",
    title: "Lack of improvement",
    body: "Failure to improve after HT process may result in suspension. Major behaviours may warrant immediate suspension.",
    next: [
      { label: "Escalate to Deputy Principal", to: "dp-intake", emphasis: true },
      { label: "Refer to support services", to: "wraparound" },
    ],
  },
  "dp-intake": {
    id: "dp-intake",
    role: "Deputy Principal",
    title: "Deputy Principal – Intake",
    body:
      "2 × faculty referrals triggers DP intervention. DP ensures compliance with outstanding CT reflections and may issue further consequences.",
    next: [
      { label: "Issue DP consequence(s)", to: "dp-consequences" },
      { label: "Meets DP-managed behaviour criteria", to: "dp-managed" },
    ],
  },
  "dp-consequences": {
    id: "dp-consequences",
    role: "Deputy Principal",
    title: "Deputy Principal – Consequences",
    bullet: [
      "Wednesday afternoon detention",
      "Monitoring booklet (US in any class → DP lunch detention)",
      "Formal caution to suspend",
      "Removal from particular classes and restorative conversation with CT (if appropriate)",
      "If referral was due to failure to complete CT reflection: ensure original reflection is completed and issue Wednesday detention with DPR (DP Reflection)",
    ],
    next: [
      { label: "Behaviours improve", to: "home" },
      { label: "No improvement (repeat once more)", to: "dp-repeat" },
      { label: "Need wraparound supports", to: "wraparound" },
    ],
  },
  "dp-repeat": {
    id: "dp-repeat",
    role: "Deputy Principal",
    title: "Repeat DP process once",
    body: "If improvement does not occur after a repeat cycle, consider suspension and/or higher-level supports.",
    next: [
      { label: "Escalate to suspension pathway", to: "suspension" },
      { label: "Add supports (LST, Counsellor, etc.)", to: "wraparound" },
    ],
  },
  "dp-managed": {
    id: "dp-managed",
    role: "Deputy Principal",
    title: "DP-Managed Challenging Behaviours",
    bullet: [
      "> 2 faculty monitoring / HT referrals",
      "Abusive/inappropriate language at staff",
      "Physical violence",
      "Verbal intimidation",
      "Racism (+ ARCO) & discrimination",
      "Absconding from school grounds",
      "Sexual behaviour",
      "Criminal actions (theft, weapons, drugs, vaping, tobacco, etc.)",
      "Banned items (rubber band guns, stink bombs, laser pointers)",
      "Graffiti / vandalism / property damage",
      "Bullying / harassment",
      "Spitting on property or students",
      "Antisocial behaviour in community related to school",
    ],
    next: [
      { label: "Proceed with DP consequences", to: "dp-consequences", emphasis: true },
      { label: "Add supports / planning", to: "wraparound" },
    ],
  },
  "wraparound": {
    id: "wraparound",
    role: "Any",
    title: "Referrals & Behaviour Support Planning",
    bullet: [
      "Learning & Support Team (LST)",
      "Welfare Team",
      "School Counsellor",
      "SSO / Complex Case Team / Team Around the School",
      "Behaviour Support & Risk Management planning (as appropriate)",
    ],
    next: [
      { label: "Back to Deputy Principal", to: "dp-intake" },
      { label: "Back to Head Teacher", to: "ht-intake" },
      { label: "Back to Classroom Teacher", to: "start-class" },
      { label: "Home", to: "home" },
    ],
  },
  "suspension": {
    id: "suspension",
    role: "Deputy Principal",
    title: "Suspension pathway (where warranted)",
    body:
      "Failure to improve after the above process may result in suspension. Major behaviours may warrant immediate suspension (follow DoE policy).",
    next: [
      { label: "Plan supports / reintegration", to: "wraparound" },
      { label: "Home", to: "home" },
    ],
  },
  home: {
    id: "home",
    role: "Any",
    title: "RISE – Whole School Behaviour Flow",
    body:
      "Select your role to begin navigating the flow. Use search to quickly find actions, consequences, or criteria.",
    bullet: [
      "Respect • Integrity • Safety • Effort",
      "Document interventions (CHAS), keep parents informed (email/PAL/phone)",
      "Use restorative approaches and clearly staged responses",
    ],
    next: [
      { label: "Classroom Teacher", to: "start-class", emphasis: true },
      { label: "Head Teacher", to: "ht-intake" },
      { label: "Deputy Principal", to: "dp-intake" },
    ],
  },
};

const ALL_NODES: FlowNode[] = Object.values(NODES);

function usePersistedState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

function searchNodes(q: string): FlowNode[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return ALL_NODES
    .map((n) => ({
      n,
      score: (n.title + " " + (n.body ?? "") + " " + (n.bullet ?? []).join(" "))
        .toLowerCase()
        .split(/\s+/)
        .reduce((acc, word) => acc + (terms.some((t) => word.includes(t)) ? 1 : 0), 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((x) => x.n);
}

function useShareableHash(currentId: string, setCurrentId: (id: string) => void) {
  useEffect(() => {
    const fromHash = location.hash.replace(/^#/, "");
    if (fromHash && NODES[fromHash]) setCurrentId(fromHash);
  }, [setCurrentId]);
  useEffect(() => {
    if (currentId) {
      try { history.replaceState(null, "", `#${currentId}`); } catch {}
    }
  }, [currentId]);
}

function RolePill({ role }: { role: FlowNode["role"] }) {
  const color =
    role === "Classroom Teacher"
      ? "bg-blue-100 text-blue-800"
      : role === "Head Teacher"
      ? "bg-emerald-100 text-emerald-800"
      : role === "Deputy Principal"
      ? "bg-purple-100 text-purple-800"
      : "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${color}`}>
      {role}
    </span>
  );
}

function NodeCard({ node, onGo }: { node: FlowNode; onGo: (id: NodeID) => void }) {
  return (
    <Card className="shadow-md rounded-2xl border border-slate-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <RolePill role={node.role} />
            <h2 className="text-xl sm:text-2xl font-semibold leading-tight">{node.title}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onGo("home")} title="Back to Home" aria-label="Home">
            <Home className="w-5 h-5" />
          </Button>
        </div>
        {node.body && <p className="mt-3 text-slate-700 leading-relaxed">{node.body}</p>}
        {node.bullet && node.bullet.length > 0 && (
          <ul className="mt-3 list-disc list-inside space-y-1 text-slate-700">
            {node.bullet.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
        {node.note && (
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-900">
            {node.note}
          </div>
        )}
        {node.next && node.next.length > 0 && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {node.next.map((nx, i) => (
              <Button
                key={i}
                onClick={() => onGo(nx.to)}
                className={`justify-between rounded-xl ${nx.emphasis ? "ring-2 ring-offset-2 ring-indigo-300" : ""}`}
                variant={nx.emphasis ? "default" : "secondary"}
              >
                <span>{nx.label}</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Header({ onReset, onBack, canBack, onShare, onInstall, canInstall }: any) {
  return (
    <div className="flex items-center justify-between gap-2 p-3 sm:p-4 bg-white/70 sticky top-0 backdrop-blur z-30 border-b">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="School logo" className="w-9 h-9 rounded-lg border border-slate-200" />
        <div className="font-semibold text-slate-800 text-sm sm:text-base">RISE Behaviour Flow</div>
      </div>
      <div className="flex items-center gap-2">
        {canBack && (
          <Button variant="secondary" size="icon" onClick={onBack} title="Back" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Button variant="secondary" size="icon" onClick={onReset} title="Reset" aria-label="Reset">
          <RefreshCcw className="w-5 h-5" />
        </Button>
        {canInstall && (
          <Button variant="outline" onClick={onInstall} title="Install app (Add to Home Screen)">
            <Download className="w-4 h-4" /> Install
          </Button>
        )}
        <Button variant="secondary" size="icon" onClick={onShare} title="Copy sharable link" aria-label="Share">
          <Share2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

export default function App() {
  const [stack, setStack] = usePersistedState<NodeID[]>("rise:stack", ["home"]);
  const currentId = stack[stack.length - 1];
  const node = NODES[currentId] ?? NODES["home"];
  useShareableHash(currentId, (id) => setStack([id]));

  const [q, setQ] = usePersistedState("rise:q", "");
  const results = useMemo(() => (q ? searchNodes(q) : []), [q]);

  function go(to: NodeID) { setStack((s) => [...s, to]); }
  function back() { setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)); }
  function reset() { setStack(["home"]); }
  function copyShare() { navigator.clipboard?.writeText(window.location.href).catch(() => {}); }

  // PWA install prompt support
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);
  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
  }

  const quick = (
    <div className="grid grid-cols-3 gap-2">
      <Button variant="outline" className="rounded-xl" onClick={() => go("start-class")}>CT</Button>
      <Button variant="outline" className="rounded-xl" onClick={() => go("ht-intake")}>HT</Button>
      <Button variant="outline" className="rounded-xl" onClick={() => go("dp-intake")}>DP</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        onReset={reset}
        onBack={back}
        canBack={stack.length > 1}
        onShare={copyShare}
        onInstall={handleInstall}
        canInstall={canInstall}
      />

      <main className="mx-auto max-w-3xl px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <div className="flex items-center gap-2 bg-white rounded-2xl border p-2 pr-3 shadow-sm sticky top-[64px] z-20">
          <Search className="w-5 h-5 ml-2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search actions, consequences, criteria…"
            className="w-full bg-transparent outline-none py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{quick}</div>

        {q && results.length > 0 ? (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">Results ({results.length})</div>
            {results.map((r) => (
              <div key={r.id}>
                <NodeCard node={r} onGo={(id) => go(id)} />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <NodeCard node={node} onGo={(id) => go(id)} />
          </div>
        )}

        <div className="text-xs text-slate-500 flex flex-wrap gap-1 items-center">
          {stack.map((id, i) => (
            <span key={i} className="flex items-center gap-1">
              <button
                className="underline decoration-dotted hover:text-slate-700"
                onClick={() => setStack(stack.slice(0, i + 1))}
              >
                {NODES[id]?.title ?? id}
              </button>
              {i < stack.length - 1 && <ChevronRight className="w-3 h-3" />}
            </span>
          ))}
        </div>

        <div className="py-6 text-center text-xs text-slate-500">
          RISE • Respect • Integrity • Safety • Effort
        </div>
      </main>
    </div>
  );
}
