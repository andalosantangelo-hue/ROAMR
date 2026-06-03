# ROAMR — Working together with Git + GitHub

Two people, two computers, one codebase. This is the standard workflow.

---

## One-time setup

### 1. Move the project out of OneDrive
Git and OneDrive fight each other. Copy the `roamr-app` folder to a normal local
dev path (e.g. `~/dev/roamr-app` on Mac, `C:\dev\roamr-app` on Windows) and work
there from now on. GitHub becomes the real "shared folder."

### 2. One of you creates the GitHub repo (do this once)
- Make a free account at github.com, then create a **private** repo named `roamr-app`
  (don't add a README — the project already has files).
- Install Git: https://git-scm.com (Mac usually has it; `git --version` to check).
- In a terminal, from inside the project folder:
  ```bash
  cd path/to/roamr-app
  git init
  git add .
  git commit -m "Initial commit: ROAMR app"
  git branch -M main
  git remote add origin https://github.com/<your-username>/roamr-app.git
  git push -u origin main
  ```

### 3. Invite your partner
On GitHub: repo → **Settings → Collaborators → Add people** → enter their username.
They accept the email invite, then clone it:
```bash
git clone https://github.com/<your-username>/roamr-app.git
cd roamr-app
npm install        # installs dependencies (node_modules is NOT in Git)
npm run dev
```

### 4. Share the Firebase backend
Firebase console → ⚙ Project settings → **Users and permissions** → Add member →
your partner's Google email → role **Editor** (or Owner). You both build against the
same `roamr-55afb` project, so you see the same data.

---

## Daily workflow (both of you, every time)

```bash
git pull                       # get your partner's latest changes first
git checkout -b my-feature     # work on your own branch, not main
# ...make changes, test: npm run test && npm run build...
git add .
git commit -m "Add saved-items screen"
git push -u origin my-feature  # push your branch
```
Then on GitHub, open a **Pull Request** from your branch into `main`. Your partner
reviews it, and you click **Merge**. CI (lint + tests + build) runs automatically on
every PR — green check = safe to merge.

**Golden rules**
- `git pull` before you start, so you build on the latest.
- Never commit straight to `main` — always a branch + PR. It prevents you both
  overwriting each other.
- If Git reports a "merge conflict," it's just the rare case where you both edited
  the same lines — it marks them so you pick which to keep. Not scary.
- Commit small and often with clear messages.

---

## Coordinating who does what
Use **GitHub Issues** (free, built in) or a board like Linear/Trello. One issue per
task, assign it, reference it in your PR ("Closes #12").

## Live pairing (optional)
For editing the same file together in real time, install the **Live Share**
extension in VS Code — like Google Docs for code. Day-to-day you won't need it;
Git handles async just fine.

## Never commit secrets
The Firebase *web* config in `src/lib/firebase.js` is safe to commit (it's meant to
be public). But never commit a Firebase **service-account** JSON or any private
API keys — `.gitignore` already blocks the common ones.
