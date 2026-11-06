import { useEffect, useState } from "react";
import { api } from "../../services/apiClient.js";

/**
 * Section 2 smoke-test page. Pings the Express health endpoint to prove
 * the frontend and backend can communicate through the Vite proxy.
 */
export default function HealthPage() {
  const [status, setStatus] = useState("checking");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .get("/health")
      .then((res) => {
        if (mounted) {
          setStatus("ok");
          setData(res);
        }
      })
      .catch((err) => {
        if (mounted) {
          setStatus("error");
          setError(err?.message || "Unknown error");
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Platform
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary">
          System health
        </h1>
      </header>
      <p className="text-sm text-secondary">
        Live check of the Express backend via the Vite dev proxy.
      </p>

      <div className="ui-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${status === "ok" ? "bg-success" : status === "error" ? "bg-danger" : "bg-warning"}`}
          />
          <span className="font-semibold text-primary">Backend API</span>
          <span className="rounded-full border border-border-subtle bg-surface-raised px-2.5 py-1 text-xs capitalize text-secondary">
            {status}
          </span>
        </div>

        {status === "error" && (
          <p className="text-sm text-danger">
            Could not reach the backend: {error}. Start it with{" "}
            <code className="rounded-md bg-surface-raised px-1.5 py-1">
              cd Backend && npm run dev
            </code>
          </p>
        )}

        {data && (
          <pre className="overflow-auto rounded-control border border-border-subtle bg-surface-raised p-4 text-sm text-secondary">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
