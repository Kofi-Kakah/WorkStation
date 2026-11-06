import { CircleDot, LayoutGrid, MessagesSquare } from "lucide-react";
import { BrandMark } from "../components/shared/BrandMark.jsx";
import { Card } from "../components/ui/Card.jsx";

const HIGHLIGHTS = [
  { icon: MessagesSquare, label: "Channels, threads, and direct messages" },
  { icon: LayoutGrid, label: "Boards that mirror your issue workflow" },
  { icon: CircleDot, label: "Issues, sprints, and team activity" },
];

/**
 * Auth surface shared by sign-in and registration. The brand panel is
 * decorative context on wide screens; the form column is the only interactive
 * region on small screens.
 */
export function AuthLayout({ children }) {
  return (
    <div className="auth-page flex min-h-screen min-h-[100svh] text-primary">
      <aside className="relative hidden w-[46%] max-w-[560px] flex-col justify-between overflow-hidden border-r border-border-subtle bg-sidebar p-10 lg:flex xl:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent-soft blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-accent-soft opacity-60 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <BrandMark size={36} iconSize={20} />
          <span className="text-[17px] font-semibold tracking-tight">
            WorkStation
          </span>
        </div>

        <div className="relative max-w-sm">
          <p className="text-[34px] font-semibold leading-[1.15] tracking-tight text-primary xl:text-[38px]">
            Communication, planning, and delivery in{" "}
            <span className="text-accent">one place</span>.
          </p>
          <p className="mt-4 text-sm leading-6 text-secondary">
            Bring team chat, visual boards, and issue tracking together so work
            never gets lost between tools.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 text-sm text-secondary"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-icon bg-accent-soft text-accent">
                  <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] uppercase tracking-[0.16em] text-muted">
          Live presence · Threads · Boards · Sprints
        </p>
      </aside>

      <div
        role="main"
        className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6"
      >
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <BrandMark size={32} iconSize={18} />
          <span className="text-[15px] font-semibold tracking-tight text-primary">
            WorkStation
          </span>
        </div>
        <Card className="w-full max-w-[420px] p-6 sm:p-8">{children}</Card>
      </div>
    </div>
  );
}

export default AuthLayout;
