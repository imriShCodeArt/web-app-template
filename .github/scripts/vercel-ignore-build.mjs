import { execFileSync } from 'node:child_process';

const branch = process.env.VERCEL_GIT_COMMIT_REF;
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA;

// Vercel skips a build on exit 0 and proceeds on any non-zero exit code.
if (!branch) {
  console.log('Git branch is unavailable; proceeding safely');
  process.exit(1);
}

if (branch !== 'main' && branch !== 'preview') {
  console.log(`Skipping automatic deployment for branch: ${branch}`);
  process.exit(0);
}

if (branch === 'preview' && commitSha) {
  try {
    const mainSha = execFileSync(
      'git',
      ['ls-remote', 'origin', 'refs/heads/main'],
      {
        encoding: 'utf8',
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    )
      .trim()
      .split(/\s+/, 1)[0];

    if (mainSha === commitSha) {
      console.log('Skipping preview deployment for the released main commit');
      process.exit(0);
    }
  } catch {
    console.log('Could not compare preview with main; proceeding safely');
  }
}

console.log(`Proceeding with automatic deployment for branch: ${branch}`);
process.exit(1);
