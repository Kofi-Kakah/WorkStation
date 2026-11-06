import { useState } from "react";
import { Activity, Bell, CheckCircle2, Clock3, Layers, Plus } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Dropdown } from "../../components/ui/Dropdown.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { SegmentedControl } from "../../components/ui/SegmentedControl.jsx";
import { StatCard } from "../../components/ui/StatCard.jsx";
import { Toggle } from "../../components/ui/Toggle.jsx";

const REGIONS = ["All regions", "North America", "Europe", "Asia Pacific"];

/**
 * Development-only design system surface used to visually verify the
 * Emberline primitives. It is not included in production builds.
 */
export default function PrimitivesPreviewPage() {
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [grain, setGrain] = useState("weekly");
  const [region, setRegion] = useState("All regions");
  const [query, setQuery] = useState("");

  return (
    <main className="app-shell min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Design system preview
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">
            Emberline primitives
          </h1>
          <p className="mt-2 text-sm text-secondary">
            Development-only surface for checking tokens, states, and contrast.
          </p>
        </header>

        <section aria-labelledby="metrics-heading" className="flex flex-col gap-3">
          <h2
            id="metrics-heading"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
          >
            Metric cards
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Completed issues"
              value={184}
              icon={CheckCircle2}
              trend={12.4}
              comparison="vs last month"
            />
            <StatCard
              label="Average cycle time"
              value="3.2d"
              icon={Clock3}
              trend={-8}
              invertTrend
              comparison="vs last month"
            />
            <StatCard
              label="Open blockers"
              value={7}
              icon={Activity}
              trend={4.1}
              attention
              comparison="vs last week"
            />
            <StatCard
              label="Q4 forecast"
              value="$212.4k"
              icon={Layers}
              featured
              toggleChecked={liveUpdates}
              onToggle={setLiveUpdates}
              toggleLabel="Toggle forecast mode"
            />
            <StatCard label="Loading metric" value="" loading />
            <StatCard
              label="Unavailable metric"
              value=""
              error="The analytics service did not respond."
            />
            <StatCard label="Empty metric" value="" empty />
          </div>
        </section>

        <section aria-labelledby="controls-heading" className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2
              id="controls-heading"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
            >
              Buttons and badges
            </h2>
            <Card className="flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">
                  <Plus size={15} />
                  Create issue
                </Button>
                <Button variant="secondary">Export CSV</Button>
                <Button variant="ghost">Dismiss</Button>
                <Button variant="primary" isDisabled>
                  Disabled
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">Backlog</Badge>
                <Badge variant="accent">In review</Badge>
                <Badge variant="success">Done</Badge>
                <Badge variant="warning">Medium priority</Badge>
                <Badge variant="danger">Blocker</Badge>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Inputs
            </h2>
            <Card className="flex flex-col gap-4 p-5">
              <Input
                aria-label="Search metrics"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search issues..."
                leftElement={<Bell size={16} />}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SegmentedControl
                  label="Time grain"
                  value={grain}
                  onChange={setGrain}
                  options={["daily", "weekly", "monthly"]}
                />
                <Toggle
                  checked={liveUpdates}
                  onChange={setLiveUpdates}
                  label="Live activity updates"
                />
                <Dropdown
                  label={region}
                  items={REGIONS.map((name) => ({
                    label: name,
                    onSelect: () => setRegion(name),
                  }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <Avatar name="Leonhard Hopf" size="md" status="online" />
                <Avatar name="Amara Okafor" size="md" status="away" />
                <Avatar name="Jun Watanabe" size="md" status="busy" />
                <Avatar name="Sofia Reyes" size="md" status="offline" />
              </div>
            </Card>
          </div>
        </section>

        <section aria-labelledby="surfaces-heading" className="flex flex-col gap-3">
          <h2
            id="surfaces-heading"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
          >
            Surfaces
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-sm font-semibold text-primary">Default surface</p>
              <p className="mt-1 text-xs text-secondary">
                Base panel with a subtle warm border.
              </p>
            </Card>
            <Card variant="raised" className="p-5">
              <p className="text-sm font-semibold text-primary">Raised surface</p>
              <p className="mt-1 text-xs text-secondary">
                Elevated panel for nested content.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
