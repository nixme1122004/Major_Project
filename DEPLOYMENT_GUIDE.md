# GitHub Deployment Guide for Skill Swap Project

This guide explains how to deploy code changes to your GitHub repository.

---

## Initial Setup (Already Complete ✅)

Your repository is now initialized and connected to GitHub:
- Repository URL: `https://github.com/nixme1122004/Skill_Swap_For_Student_Learning`
- Initial commit pushed with Docker setup, deployment configs, and source code

---

## Workflow for Future Deployments

### 1. **Before Making Changes** — Ensure You're on Main Branch

```powershell
cd "c:\Users\NITHESH\Skill_Swap_For_Student_Learning-main"
git status                    # See current branch and uncommitted changes
git branch                    # Verify you're on 'main'
```

**Expected output:**
```
On branch main
```

---

### 2. **Make Your Changes**

Edit code as needed. For example:
- Backend: Modify files in `College_Tutor_Backend/`
- Frontend: Modify files in `College_Tutor_Frontend/`
- Database: Update `DB.sql`

---

### 3. **Stage Changes**

Add all changes to the staging area:

```powershell
git add .
```

Or add specific files:

```powershell
git add College_Tutor_Backend/src/app.js
git add College_Tutor_Frontend/src/App.tsx
```

**Check staged changes:**
```powershell
git status                    # Shows files ready to commit
```

---

### 4. **Commit Changes**

Create a meaningful commit message describing what changed:

```powershell
git commit -m "Add real-time notifications to dashboard"
```

**Good commit message examples:**
- `"Fix: Resolve MySQL connection timeout on startup"`
- `"Feature: Add dark mode toggle to settings page"`
- `"Refactor: Improve API error handling in auth controller"`
- `"Docs: Update deployment instructions in README"`

**View your commit:**
```powershell
git log --oneline -1
```

---

### 5. **Push to GitHub**

Upload your commits to the remote repository:

```powershell
git push origin main
```

**Expected output:**
```
Enumerating objects: 5, done.
...
To https://github.com/nixme1122004/Skill_Swap_For_Student_Learning.git
   abc1234..def5678  main -> main
```

---

## Common Scenarios

### Scenario A: Undo Uncommitted Changes

If you made mistakes before committing:

```powershell
git checkout -- College_Tutor_Frontend/src/App.tsx   # Undo specific file
git checkout -- .                                      # Undo all changes
```

---

### Scenario B: Undo a Commit (Haven't Pushed Yet)

If you committed something wrong:

```powershell
git reset --soft HEAD~1       # Undo commit, keep changes staged
git reset HEAD~1              # Undo commit, keep changes unstaged
git reset --hard HEAD~1       # Undo commit and discard changes (⚠️ irreversible)
```

---

### Scenario C: Undo After Pushing

If you pushed and need to undo (use sparingly):

```powershell
git revert HEAD               # Creates a new commit that undoes the last one
git push origin main          # Push the revert commit
```

---

### Scenario D: Update Your Local Code from GitHub

If someone else pushed changes or you want to pull remote updates:

```powershell
git pull origin main          # Fetch and merge remote changes
```

---

### Scenario E: Create a New Feature Branch

Best practice: Create branches for new features:

```powershell
git branch feature/dark-mode
git checkout feature/dark-mode
# or: git checkout -b feature/dark-mode

# Make changes and commit
git add .
git commit -m "Add dark mode support"

# Push to GitHub
git push origin feature/dark-mode
```

Then create a **Pull Request** on GitHub to merge into `main`.

---

## Quick Reference Commands

| Command | Purpose |
|---------|---------|
| `git status` | Check current branch and changes |
| `git add .` | Stage all changes |
| `git commit -m "msg"` | Create a commit with message |
| `git push origin main` | Push commits to GitHub |
| `git pull origin main` | Fetch and merge remote changes |
| `git log --oneline` | View commit history |
| `git diff` | Show differences in unstaged files |
| `git branch -a` | List all branches (local and remote) |
| `git checkout -b branch-name` | Create and switch to new branch |

---

## Deployment Checklist

Before each push, verify:

- [ ] Backend code compiles/runs without errors
- [ ] Frontend builds successfully: `npm run build`
- [ ] `.env` files are NOT committed (checked in `.gitignore`)
- [ ] `node_modules/` directories are NOT committed
- [ ] Commit message is descriptive
- [ ] Related `DB.sql` changes are included if applicable

---

## Render Deployment Notes

Render uses managed services for production.

- `render.yaml` is included in the repo and defines:
  - A Node.js web service for the backend
  - A static site service for the frontend
  - A managed MySQL database
- The backend now supports `DATABASE_URL`, which Render provides for managed MySQL.
- The frontend uses `VITE_BACKEND_URL`, which you can set in Render environment variables.

### Deploying on Render

1. Go to https://render.com and connect your GitHub account.
2. Create a new service and choose "Web Service" for the backend.
3. Use `main` branch and set the build command to `cd College_Tutor_Backend && npm install`, start command to `cd College_Tutor_Backend && npm start`.
4. Create a new "Static Site" service for the frontend.
5. Use `main` branch and set build command to `cd College_Tutor_Frontend && npm install && npm run build`, publish directory `College_Tutor_Frontend/dist`.
6. Create a managed MySQL database in Render and connect it to the backend service.
7. Add environment variables in Render for backend:
   - `JWT_SECRET`
   - `FRONTEND_URL` with the frontend URL
   - `DATABASE_URL` from the managed MySQL database
   - Set `VITE_BACKEND_URL` for the frontend to the backend URL

---

## Files NOT to Commit

These are already in `.gitignore`:

```
node_modules/
.env
.env.local
dist/
build/
.vscode/
.idea/
*.swp
```

Verify with:
```powershell
git status                    # Should NOT show node_modules or .env
```

---

## View Your Deployed Repository

After pushing, visit your GitHub repository:

🔗 [https://github.com/nixme1122004/Skill_Swap_For_Student_Learning](https://github.com/nixme1122004/Skill_Swap_For_Student_Learning)

See your commits in the **Commits** tab and track changes in the **Network** tab.

---

## Need Help?

For Git-specific questions:
```powershell
git help                      # General Git help
git help commit              # Help on specific command
```

Or visit: https://git-scm.com/doc

