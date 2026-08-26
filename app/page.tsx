'use client';

import { useState } from 'react';
import { WizardData, LogoResult, QualityScore } from '@/lib/types';
import { generateLogo, reviewLogo, iterateLogo } from '@/lib/api';
import WizardContainer from '@/components/wizard/WizardContainer';
import LogoResultView from '@/components/LogoResultView';

export default function Home() {
  const [view, setView] = useState<'wizard' | 'result'>('wizard');
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  const [research, setResearch] = useState('');
  const [logo, setLogo] = useState<LogoResult | null>(null);
  const [qualityReview, setQualityReview] = useState<QualityScore | null>(null);
  const [iteration, setIteration] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWizardComplete = async (data: WizardData, researchText: string) => {
    setWizardData(data);
    setResearch(researchText);
    setView('result');
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateLogo(data, researchText);
      setLogo(result);
      setCurrentPrompt(result.revisedPrompt);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!wizardData) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateLogo(wizardData, research);
      setLogo(result);
      setCurrentPrompt(result.revisedPrompt);
      setQualityReview(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Regeneration failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReview = async () => {
    if (!logo || !wizardData) return;
    setIsReviewing(true);
    setError(null);
    try {
      const review = await reviewLogo(logo.revisedPrompt, wizardData.brandName);
      setQualityReview(review);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Review failed');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleIterate = async () => {
    if (!qualityReview || !logo || !wizardData) return;
    setIsGenerating(true);
    setError(null);
    try {
      const refinedPrompt = await iterateLogo(
        currentPrompt,
        qualityReview.feedback,
        qualityReview.suggestions,
        wizardData
      );
      const result = await generateLogo({ ...wizardData, description: refinedPrompt }, research);
      setLogo(result);
      setCurrentPrompt(result.revisedPrompt);
      setQualityReview(null);
      setIteration((prev) => prev + 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Iteration failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!logo?.imageUrl || !wizardData) return;
    try {
      const res = await fetch(logo.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${wizardData.brandName.toLowerCase().replace(/\s+/g, '-')}-logo.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(logo.imageUrl, '_blank');
    }
  };

  const handleNewLogo = () => {
    setView('wizard');
    setLogo(null);
    setQualityReview(null);
    setIteration(0);
    setCurrentPrompt('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-tight text-white">wordmarks</span>
            <span className="text-xs text-zinc-500">.net</span>
          </a>
          <nav className="flex items-center gap-4">
            <a href="/admin" className="text-xs text-zinc-500 hover:text-white transition-colors">Admin</a>
          </nav>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-5xl px-6 pt-4">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center justify-between">
            <span><span className="font-medium">Error:</span> {error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-400">✕</button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {view === 'wizard' ? (
          <WizardContainer onComplete={handleWizardComplete} />
        ) : logo ? (
          <LogoResultView
            imageUrl={logo.imageUrl}
            revisedPrompt={logo.revisedPrompt}
            qualityReview={qualityReview}
            brandName={wizardData?.brandName || ''}
            iteration={iteration}
            isReviewing={isReviewing}
            isGenerating={isGenerating}
            onRegenerate={handleRegenerate}
            onReview={handleReview}
            onIterate={handleIterate}
            onDownload={handleDownload}
            onNewLogo={handleNewLogo}
          />
        ) : isGenerating ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <span className="absolute inset-0 flex items-center justify-center text-xl">🎨</span>
            </div>
            <p className="text-lg text-zinc-400">Generating your wordmark...</p>
            <p className="text-sm text-zinc-600">AI is crafting your logo</p>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-white/5 py-6 text-center">
        <p className="text-xs text-zinc-600">Powered by AI · wordmarks.net</p>
      </footer>
    </div>
  );
}
