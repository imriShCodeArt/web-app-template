type PromptStatus = { needsPrompt?: boolean };

async function promptNeeded(url: string): Promise<boolean> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return false;
  const data = (await res.json()) as PromptStatus;
  return data.needsPrompt === true;
}

/**
 * True while the legal or marketing onboarding dialog still needs to be shown.
 * Callers should wait until this is false before starting delayed UI.
 */
export async function hasBlockingOnboardingPrompt(): Promise<boolean> {
  try {
    const [needsLegal, needsMarketing] = await Promise.all([
      promptNeeded('/api/account/legal-prompt-status'),
      promptNeeded('/api/account/marketing-prompt-status'),
    ]);
    return needsLegal || needsMarketing;
  } catch {
    return true;
  }
}
