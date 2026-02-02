# CI/CD Pipeline

This project uses **GitHub Actions** for continuous integration and deployment. The workflow is defined in [../.github/workflows/ci.yml](../.github/workflows/ci.yml).

## Triggers

- **Push** to `main` → full pipeline (install → lint, test → build → deploy).
- **Pull request** targeting `main` → install, lint, test, build (no deploy).

## Stages (Jobs)

### 1. Install

- **Purpose**: Validate that the repository and lockfile are consistent and dependencies install cleanly.
- **Steps**: Checkout → Setup Node.js (with npm cache) → `npm ci`.
- **Why `npm ci`**: Uses exact versions from `package-lock.json` for reproducible builds. Faster and stricter than `npm install` in CI.

### 2. Lint

- **Purpose**: Enforce code style and catch common issues before merge.
- **Steps**: Checkout → Setup Node.js (cache) → `npm ci` → `npm run lint`.
- **Runs after**: Install (so we know deps are valid). Runs in parallel with Test.

### 3. Test

- **Purpose**: Run the test suite (e.g. Vitest). Fails if any test fails.
- **Steps**: Checkout → Setup Node.js (cache) → `npm ci` → `npm run test`.
- **Runs after**: Install. Runs in parallel with Lint.

### 4. Build

- **Purpose**: Ensure the app compiles and produces a production bundle.
- **Steps**: Checkout → Setup Node.js (cache) → `npm ci` → `npm run build` → upload `dist/` as an artifact.
- **Runs after**: Both Lint and Test pass. Artifacts are used by Deploy.

### 5. Deploy

- **Purpose**: Ship the built app to production (placeholder by default).
- **Condition**: Only on **push to `main`** (not on PRs).
- **Steps**: Download build artifact → run your deploy command (e.g. Vercel CLI, Netlify, GitHub Pages, S3).
- **Secrets**: Use GitHub repository **Secrets** (e.g. `DEPLOY_TOKEN`, `VERCEL_TOKEN`) for any tokens; never commit them.

## Caching

- **`cache: 'npm'`** in `actions/setup-node@v4` caches the npm dependency directory (keyed by lockfile). Subsequent jobs on the same branch restore it so `npm ci` is fast.

## Environment Variables and Secrets

- **Environment variables** (non-sensitive): Set in the workflow under `env` or per job/step.
- **Secrets** (tokens, keys): Add in **Settings → Secrets and variables → Actions**. Reference in YAML as `${{ secrets.SECRET_NAME }}`. They are not logged.

## Common Pitfalls to Avoid

1. **Using `npm install` in CI**  
   Use `npm ci` so installs are deterministic and match the lockfile.

2. **Deploying on every branch or on PRs**  
   Restrict deploy to `main` (or your production branch) and to `push` events so you don’t deploy feature branches.

3. **Logging secrets**  
   Avoid `echo ${{ secrets.X }}` or printing env vars that might contain secrets. GitHub redacts some values but don’t rely on it.

4. **Skipping the build before deploy**  
   Deploy should use the artifact from the Build job (or equivalent) so you deploy exactly what was tested and built.

5. **No cache**  
   Without npm cache, every job does a full install and CI is slower. Use `setup-node` with `cache: 'npm'`.

6. **Wrong Node version**  
   Use the same Node version as local/dev (e.g. 20 LTS). Set it in one place (`env.NODE_VERSION`) and reuse.

7. **Flaky tests**  
   Fix or quarantine flaky tests; don’t retry indefinitely or ignore failures.

8. **Heavy use of `workflow_dispatch` without branch protection**  
   For production, protect `main` (require status checks: lint, test, build) so only green PRs can merge.

## Customizing Deploy

Replace the "Deploy (placeholder)" step in [.github/workflows/ci.yml](../.github/workflows/ci.yml) with your provider, for example:

- **Vercel**: `npx vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}`
- **Netlify**: use `npx netlify-cli deploy --prod` with `secrets.NETLIFY_AUTH_TOKEN` and `secrets.NETLIFY_SITE_ID`
- **GitHub Pages**: use `actions/upload-pages-artifact` and `actions/deploy-pages`, or a static export in `dist/` with a Pages deployment action

Always store provider tokens in GitHub Actions secrets and reference them as `${{ secrets.* }}`.
