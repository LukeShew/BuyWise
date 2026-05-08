import { ShieldAlert } from "lucide-react";
import { globalScamWarnings } from "@/data/mockProducts";

export function ScamWarnings({ scamRiskScore }: { scamRiskScore: number }) {
  const level =
    scamRiskScore >= 7 ? "High scam risk" : scamRiskScore >= 5 ? "Medium scam risk" : "Lower scam risk";

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-1 h-5 w-5 text-danger" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-mint">Scam warnings</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">{level}</h2>
        </div>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {globalScamWarnings.map((warning) => (
          <li key={warning} className="rounded-lg bg-red-50 px-3 py-2 text-sm leading-6 text-red-900">
            {warning}
          </li>
        ))}
      </ul>
    </section>
  );
}
