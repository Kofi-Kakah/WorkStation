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
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">System health</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Live check of the Express backend via the Vite dev proxy.
      </p>

      <div className="glass-surface p-6">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`w-3 h-3 rounded-full ${status === "ok" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-amber-400"}`}
          />
          <span className="font-semibold">Backend API</span>
          <span className="text-sm text-gray-500">{status}</span>
        </div>

        {status === "error" && (
          <p className="text-red-600 dark:text-red-400">
            Could not reach the backend: {error}. Start it with{" "}
            <code>cd Backend && npm run dev</code>.
          </p>
        )}

        {data && (
          <pre className="bg-black/5 dark:bg-white/5 rounded-lg p-4 text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
