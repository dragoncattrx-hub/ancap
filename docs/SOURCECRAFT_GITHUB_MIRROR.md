# SourceCraft ↔ GitHub (Import / Mirror UI)

Official guide: https://sourcecraft.dev/portal/docs/en/sourcecraft/operations/migration

## Recommended for ANCAP

Use SourceCraft UI **Migrate existing** + **Activate synchronization** so GitHub stays the primary write target and SourceCraft auto-pulls branches. That gives you a second copy without fighting mirror branch locks.

If you need to **push commits into SourceCraft yourself** (true dual-write), import **without** synchronization, then add a `sourcecraft` remote and use `git push all`.

## UI steps (per repo)

1. Open https://sourcecraft.dev and sign in.
2. Left panel → **Create repository**.
3. Tab **Migrate existing**.
4. Source → **GitHub**.
5. Create a GitHub PAT (classic or fine-grained) with:
   - `repo` (list + read private/public repos)
   - `read:org` (optional; collaborators / LFS)
6. Paste PAT → **Authenticate**.
7. Owner: `dragoncattrx-hub`
8. Repository: pick one of:
   - `ancap` (main)
   - `assets`
   - `ancap-docs`
   - `Theodore`
   - `harem`
9. Under **Synchronization**:
   - **Mirror mode (recommended):** enable **Activate synchronization**, branches e.g. `master`, `main`, `release/*`
   - **Dual-write mode:** leave sync **off** (one-shot import only)
10. Create / start migration. Repeat for each repo.

## After mirror is live

- Day-to-day: keep pushing **GitHub** (`origin` / `github`). SourceCraft updates via sync.
- SSH key: `~/.ssh/id_rsa.pub` must be in SourceCraft → Access → SSH keys (already prepared locally; Host `sourcecraft` in `~/.ssh/config`).
- Clone URL shape: `ssh://ssh.sourcecraft.dev/<org_slug>/<repo_slug>.git`

## Optional: dual-push remotes (only if sync is OFF)

```powershell
cd C:\Users\drago\Desktop\ANCAP
.\scripts\setup-sourcecraft-dual-remote.ps1 -OrgSlug <YOUR_ORG> -RepoSlug ancap -LocalPath C:\Users\drago\Desktop\ANCAP
# then: git push all master
```

## Check SSH

```powershell
ssh -T ssh://ssh.sourcecraft.dev
# expect: Hi <user>! You've successfully authenticated...
```
