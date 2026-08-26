'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStats, type AdminStats } from '@/lib/admin-api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage API providers, knowledge base, and settings</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-zinc-500">API Providers</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? '—' : stats?.providers.total ?? 0}
          </p>
          <p className="text-xs text-zinc-600">
            {stats?.providers.active ? `Active: ${stats.providers.active.name}` : 'None active'}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-zinc-500">Reference Images</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? '—' : stats?.knowledgeBase.total ?? 0}
          </p>
          <p className="text-xs text-zinc-600">In knowledge base</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-zinc-500">Generations</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? '—' : stats?.generation.total ?? 0}
          </p>
          <p className="text-xs text-zinc-600">
            {stats?.generation.completed ?? 0} completed · {stats?.generation.failed ?? 0} failed
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/providers"
          className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
        >
          <div className="text-2xl mb-2">🔑</div>
          <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
            API Providers
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Configure OpenAI-compatible API providers. Server-managed keys.
          </p>
        </Link>

        <Link
          href="/admin/knowledge-base"
          className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
        >
          <div className="text-2xl mb-2">📚</div>
          <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
            Knowledge Base
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Upload reference images for the AI to study.
          </p>
        </Link>

        <Link
          href="/admin/settings"
          className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
        >
          <div className="text-2xl mb-2">⚙️</div>
          <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
            Settings
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Default models, image quality, iteration limits.
          </p>
        </Link>

        <a
          href="/api/v1/research"
          target="_blank"
          className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
        >
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
            MCP / API
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            REST API endpoint for AI agents to generate logos programmatically.
          </p>
        </a>
      </div>
    </div>
  );
}
