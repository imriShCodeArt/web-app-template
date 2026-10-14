# Branching and deployment flow

This repository uses a long-lived integration branch and an explicit production promotion step.

```text
feature/fix/chore/dependabot branches ──PR──> preview ──release PR──> main
                                                │                    │
                                                │                    └── Vercel Production
                                                └── Vercel Preview
                                                    + preview Neon DB
```

| Branch / target | Role                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **`main`**      | GitHub default branch and Vercel Production branch. It accepts release PRs from this repository's `preview` branch only. |
| **`preview`**   | Long-lived integration and staging branch. Normal work and dependency updates merge here first.                          |
| Topic branches  | Short-lived branches such as `feature/*`, `fix/*`, `chore/*`, `refactor/*`, or `docs/*`. They normally target `preview`. |

Branch-name prefixes are conventions, not security controls. GitHub rulesets and required checks provide enforcement.

## Daily development workflow

### 1. Start from `preview`

```bash
git fetch origin
git switch preview
git pull --ff-only origin preview
git switch -c feature/my-change
```

Use another descriptive prefix when appropriate, for example `fix/`, `chore/`, `refactor/`, or `docs/`.

### 2. Open a PR into `preview`

```bash
git push -u origin feature/my-change
gh pr create --base preview --head feature/my-change
```

The `preview` ruleset should require a pull request and the `CI / validate` check. Dependabot also targets `preview`.

After the PR is merged, Vercel deploys the updated `preview` branch using Preview-scoped environment variables and the shared preview Neon database.

### 3. Promote `preview` to `main`

When the staging environment is ready:

```bash
gh pr create \
  --base main \
  --head preview \
  --title "release: promote preview to production"
```

Only a PR whose head is the `preview` branch in this same repository is accepted by the `main-source-branch` guard. Merging the release PR updates `main` and triggers the Vercel Production deployment.

Use a merge commit for the long-lived `preview` → `main` promotion unless the repository intentionally adopts another history strategy. Do not squash-delete the `preview` branch.

### 4. Automatic post-release synchronization

After a merge-commit release, `main` contains one merge commit that is not yet
on `preview`. The
[`Sync preview after release`](workflows/sync-preview-after-release.yml)
workflow verifies that:

1. `preview` is an ancestor of the new `main` commit.
2. The new `main` commit is a merge commit.
3. Its second parent is the current `preview` tip.

Only then does it fast-forward `preview` to `main`. It never force-pushes,
rebases, or creates a merge when the branches have diverged.

If synchronization fails because `preview` advanced while the release was
merging, reconcile the branches through a reviewed PR instead of bypassing the
guard.

## GitHub Actions

| Workflow                                                                                       | Purpose                                                                                                          |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`.github/workflows/main-source-guard.yml`](workflows/main-source-guard.yml)                   | Publishes `main-source-branch=success` only for `preview` → `main` PRs from this repository.                     |
| [`.github/workflows/sync-preview-after-release.yml`](workflows/sync-preview-after-release.yml) | Safely fast-forwards `preview` to the verified release merge commit on `main`.                                   |
| [`.github/workflows/tag-patch-release.yml`](workflows/tag-patch-release.yml)                   | On each push to `main`, bumps the latest `vX.Y.Z` patch tag and creates a GitHub Release.                        |
| [`.github/workflows/ci.yml`](workflows/ci.yml)                                                 | Runs tests + validation for PRs targeting `preview` (affected packages only), plus full runs on manual dispatch. |

### Automatic patch tags

Every successful `preview` → `main` merge pushes to `main` and triggers
[`tag-patch-release.yml`](workflows/tag-patch-release.yml). That workflow:

1. Finds the latest semver tag matching `vMAJOR.MINOR.PATCH` (for example `v1.1.4`).
2. Creates the next patch tag (`v1.1.5`) on the release commit.
3. Publishes a GitHub Release with generated notes.

It skips when the commit already has a version tag (manual tags or re-runs).
Bump **minor** or **major** manually when needed; the next automatic release
continues patching from whatever the newest `v*` tag is.

### CI scope and Turbo cache

Pull-request CI uses Turbo's git filter against `origin/preview`
(`--filter="...[origin/preview]"` via `yarn validate:affected`). Only packages
changed since `preview` — plus their dependents — are typechecked, linted,
tested, and built. A CRM-only PR therefore skips the platform app.

Manual **workflow_dispatch** runs still validate the full monorepo.

Caching:

1. **Local CI cache** — GitHub Actions caches the `.turbo` directory between
   runs.
2. **Vercel Remote Cache** (shared across machines) — add repository secrets /
   variables:

| Name          | Where                                                  | Value                                  |
| ------------- | ------------------------------------------------------ | -------------------------------------- |
| `TURBO_TOKEN` | Settings → Secrets and variables → Actions → Secrets   | Vercel access token (Account → Tokens) |
| `TURBO_TEAM`  | Settings → Secrets and variables → Actions → Variables | Vercel team / account slug             |

Without `TURBO_TOKEN`, CI still works; it only uses the GitHub Actions `.turbo`
cache. After the secret is set, CI logs should show remote cache hits.

### Why the source guard uses `pull_request_target`

The source guard must use the trusted workflow stored on the default branch rather than a workflow modified by the PR under review. It only reads PR metadata and publishes a commit status. It does not check out or execute PR code.

The workflow publishes the status context on the PR test-merge commit, matching the SHA used by normal `pull_request` CI. It falls back to the head SHA only when GitHub cannot create a test merge, such as while conflicts exist.

## Required GitHub rulesets

The workflow files do not block direct pushes by themselves. Configure repository rulesets in **Settings → Rules → Rulesets**.

### `main` ruleset

Target `main` and enable:

- Require a pull request before merging.
- Require status checks to pass.
- Require the exact status context **`main-source-branch`**.
- Require the branch to be up to date before merging, when compatible with the repository's release process.
- Restrict deletions.
- Block force pushes.
- Leave the bypass list empty unless a narrowly scoped emergency actor is deliberately required.
- Do not enable **Restrict updates** for this PR-based design.

The `main-source-branch` status is the source-branch enforcement. `Publish main source guard` is the workflow job name, not the required status context.

### `preview` ruleset

Target `preview` and enable:

- Require a pull request before merging.
- Require **`CI / validate`**.
- Restrict deletions.
- Block force pushes.
- Add the narrowly scoped preview-sync actor to the bypass list with **Always
  allow** so only the synchronization workflow can fast-forward the branch.

Do not enforce a single source-branch prefix for `preview`; feature, fix, maintenance, dependency, and synchronization PRs are all valid integration inputs.

### Preview synchronization credentials

The workflow first uses the repository's built-in `GITHUB_TOKEN`. If your
`preview` ruleset allows the GitHub Actions actor to bypass its pull-request
requirement, no secret is needed.

If the ruleset blocks the built-in token:

1. Create a fine-grained token for a dedicated automation account, scoped only
   to this repository with **Contents: Read and write**.
2. Add that account to the `preview` ruleset bypass list. Do not grant it a
   bypass on `main`.
3. Store the token in **Settings → Secrets and variables → Actions** as
   `PREVIEW_SYNC_TOKEN`.

The token is used only by the trusted workflow on `main`, after the release
merge has passed the source and ancestry checks.

## Bootstrap procedure

`pull_request_target` uses the workflow stored on the default branch. Therefore, the guard file must exist on `main` before it can enforce future release PRs.

1. Add this `.github` directory to `preview`.
2. Open the initial `preview` → `main` bootstrap PR.
3. Review and merge the workflow into `main` before enabling `main-source-branch` as a required status.
4. Push a harmless commit to `preview` and open another `preview` → `main` PR so the `main-source-branch` status is registered.
5. Add `main-source-branch` to the active `main` ruleset and verify that a PR from any other branch fails.

This initial bootstrap is the only period before the new guard can be required.

## Vercel configuration

Configure every Vercel project linked to this repository:

| Setting             | Value                                              |
| ------------------- | -------------------------------------------------- |
| Production Branch   | `main`                                             |
| Preview deployments | Enabled; repository configuration filters branches |

Expected behavior:

| Git event                      | Vercel environment                                      |
| ------------------------------ | ------------------------------------------------------- |
| Merge or push to `preview`     | Preview deployment using Preview-scoped variables       |
| Merge to `main`                | Production deployment using Production-scoped variables |
| Topic-branch PR into `preview` | Skipped by the repository `ignoreCommand`               |

Keep each Vercel project's Root Directory at `apps/platform`.

The shared Vercel ignore script permits automatic builds only for `preview` and
`main`. It also skips the automatic post-release `preview` synchronization when
`preview` and `main` point at the same commit, avoiding a redundant rebuild of
the released tree. Create an explicit deployment from Vercel when a topic branch
needs an exceptional review environment.

## Neon database configuration

This repository uses two persistent database resources, not per-deployment Neon branching:

| Vercel environment | Neon resource                          |
| ------------------ | -------------------------------------- |
| Production         | Dedicated production Neon database     |
| Preview            | Dedicated shared preview Neon database |

Use the same application variable names, such as `DATABASE_URL`, with different values scoped to Production and Preview in Vercel.

**Disable Vercel-managed Neon preview branching** for this setup. Enabling it would create deployment-specific database branches and override the intended shared preview-database architecture.

Apply schema migrations to the preview database before production promotion. Do not copy sensitive production customer data into the preview database.

## Allowed routes

| Pull request route                        | Allowed?                                       |
| ----------------------------------------- | ---------------------------------------------- |
| Topic branch → `preview`                  | Yes                                            |
| Dependabot branch → `preview`             | Yes                                            |
| `preview` → `main`                        | Yes; this is the only normal route into `main` |
| Any other branch → `main`                 | No; `main-source-branch` fails                 |
| Automated `main` → `preview` fast-forward | Yes, after a verified release merge            |
| Manual `main` → `preview` PR              | Only as a recovery path if branches diverge    |
| Direct push to `main`                     | No; blocked by the `main` ruleset              |
| Direct push to `preview`                  | No; blocked by the `preview` ruleset           |
