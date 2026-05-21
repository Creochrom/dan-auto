"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/types/lead";

/**
 * Lead inbox — CRM-ready scaffold.
 * TODO: AI summaries, assignment, Twilio/WhatsApp threads.
 */
export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/leads")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setLeads(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Leads</h1>
          <p className="mt-1 text-sm text-zinc-500">Assistant & contact captures</p>
        </div>
        <Link href="/admin" className="text-sm text-[#d4a63c] hover:underline">
          ← Dashboard
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.08] bg-black/40 p-8 text-center text-sm text-zinc-500">
          No leads yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="rounded-2xl border border-white/[0.08] bg-black/50 p-4"
            >
              <p className="font-semibold text-white">{lead.name}</p>
              <p className="text-sm text-zinc-400">{lead.phone}</p>
              {lead.registration && (
                <p className="mt-1 font-mono text-xs text-[#d4a63c]">{lead.registration}</p>
              )}
              {lead.problemDescription && (
                <p className="mt-2 text-xs text-zinc-500">{lead.problemDescription}</p>
              )}
              <p className="mt-2 text-[10px] text-zinc-600">
                {lead.source} · {new Date(lead.createdAt).toLocaleString("en-GB")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
