'use client';

import { useState } from 'react';
import StepNavigation from './StepNavigation';

interface StepInputProps {
  brandName: string;
  description: string;
  onNext: (name: string, desc: string) => void;
}

export default function StepInput({ brandName, description, onNext }: StepInputProps) {
  const [name, setName] = useState(brandName);
  const [desc, setDesc] = useState(description);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Create your wordmark</h2>
        <p className="mt-2 text-sm text-zinc-400">Tell us your brand name and what it does — AI handles the rest</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Brand Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. PressWires, Stripe, Linear"
            autoFocus
            className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-5 py-4 text-lg text-white placeholder-zinc-600 outline-none focus:border-blue-500/50 transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) onNext(name.trim(), desc.trim());
            }}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">What does the brand do? <span className="text-zinc-600">(optional)</span></label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. AI-powered press release distribution platform"
            rows={2}
            className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-5 py-4 text-white placeholder-zinc-600 outline-none focus:border-blue-500/50 transition-colors resize-none"
          />
        </div>
      </div>

      {name.trim() && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-zinc-500 mb-2">Preview</p>
          <p className="text-4xl font-bold tracking-tight text-white">{name.trim()}</p>
          {desc.trim() && <p className="mt-2 text-xs text-zinc-500">{desc.trim()}</p>}
        </div>
      )}

      <StepNavigation
        onBack={() => {}}
        onNext={() => onNext(name.trim(), desc.trim())}
        nextLabel="Research & Generate"
        nextDisabled={!name.trim()}
        canGoBack={false}
      />
    </div>
  );
}
