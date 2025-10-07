# 🚨 SECURITY - IMMEDIATE ACTION REQUIRED

## ⚠️ Critical Security Issue Detected and Partially Fixed

### Issue: Database File Was Tracked in Git

**What Happened:**
- Your SQLite database `prisma/dev.db` was being tracked by git
- This database contains OAuth tokens, user data, and session information

**What Was Done:**
✅ Removed `prisma/dev.db` from git staging
✅ Updated `.gitignore` to prevent future tracking
✅ Added comprehensive security patterns

**What You MUST Do Now:**

### 1. Check Git History (CRITICAL)

Run this command to see if the database was previously committed:
```bash
git log --all --full-history -- prisma/dev.db
```

**If this shows any commits:**
⚠️ Your database (with credentials) is in git history!

### 2. If Database Was Committed Before

**Option A: If repo is private and just started (no collaborators yet)**
```bash
# Amend the last commit if it just happened
git commit --amend --no-edit

# Or if it's been a few commits, reset and recommit
# BACKUP YOUR WORK FIRST!
git log --oneline  # note the commit BEFORE the db was added
git reset --soft <commit-hash-before-db>
git commit -m "Your commit message"
```

**Option B: If repo is shared or has history**
You'll need to rewrite git history using BFG Repo-Cleaner:
```bash
# Install BFG
brew install bfg  # macOS
# or download from https://rtyley.github.io/bfg-repo-cleaner/

# Clean the repo
bfg --delete-files dev.db
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 3. Rotate ALL Credentials IMMEDIATELY

Because the database contains OAuth tokens and potentially session data:

**Strava API:**
1. Go to https://www.strava.com/settings/api
2. Delete your current application
3. Create a new one with new credentials
4. Update `.env.local`

**Google OAuth:**
1. Go to Google Cloud Console
2. Delete current OAuth client
3. Create new credentials
4. Update `.env.local`

**Supabase:**
1. Go to Supabase dashboard
2. Navigate to Settings → API
3. Rotate the service role key
4. Update `.env.local`

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Revoke current key
3. Create new key
4. Update `.env.local`

**NextAuth:**
Generate a new secret:
```bash
openssl rand -base64 32
```
Update `NEXTAUTH_SECRET` in `.env.local`

### 4. Update Vercel Environment Variables

If you've deployed to Vercel:
```bash
vercel env rm STRAVA_CLIENT_SECRET production
vercel env rm GOOGLE_CLIENT_SECRET production
vercel env rm SUPABASE_SERVICE_ROLE_KEY production
vercel env rm OPENAI_API_KEY production
vercel env rm NEXTAUTH_SECRET production

# Add new values
vercel env add STRAVA_CLIENT_SECRET production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENAI_API_KEY production
vercel env add NEXTAUTH_SECRET production
```

### 5. Verify No Other Sensitive Files

Run this check:
```bash
# Check what's currently tracked
git ls-files | grep -E "\.env$|secret|credential|\.db$|token"

# Should only show:
# - scripts/get-credentials.js (safe, no actual credentials)
# - No .env files
# - No .db files
```

### 6. Force Push (If Necessary)

⚠️ **WARNING:** Only do this if:
- Repository is private
- You're the only contributor
- Or you've coordinated with team

```bash
git push --force-with-lease origin main
```

## Prevention Going Forward

### Pre-Commit Checklist
Before every commit, run:
```bash
# Check what you're about to commit
git diff --staged

# Look for sensitive patterns
git diff --staged | grep -i "secret\|password\|token\|key"

# Verify status
git status
```

### Install Pre-Commit Hook (Optional)

Create `.git/hooks/pre-commit`:
```bash
#!/bin/sh

# Check for sensitive files
if git diff --cached --name-only | grep -E "\.env$|\.env\.local|\.db$|secret|credential"; then
    echo "❌ ERROR: Attempting to commit sensitive files!"
    echo "Files detected:"
    git diff --cached --name-only | grep -E "\.env$|\.env\.local|\.db$"
    exit 1
fi

# Check for sensitive patterns in content
if git diff --cached | grep -i "sk-[a-zA-Z0-9]\{20,\}\|ghp_[a-zA-Z0-9]\{36,\}\|xox[baprs]-[a-zA-Z0-9-]\+"; then
    echo "❌ ERROR: Potential API key or token detected in commit!"
    exit 1
fi

exit 0
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Current Safe Files to Commit

These files are safe and should be committed:
- ✅ `.env.example`
- ✅ `.env.production.example`
- ✅ `.gitignore`
- ✅ All new infrastructure files (`src/lib/*.ts`)
- ✅ Documentation (`*.md`)

## Files to NEVER Commit

- ❌ `.env.local`
- ❌ `.env`
- ❌ `.env.vercel`
- ❌ `prisma/dev.db`
- ❌ Any file with actual credentials

## Verification Commands

### Check Current Status
```bash
git status --short
```

Should show:
- Modified files (M)
- Untracked new files (??)
- NO sensitive files staged for commit

### Check Ignored Files
```bash
git status --ignored
```

Should show `.env.local`, `.env.vercel`, and `prisma/dev.db` as ignored

## Need Help?

If you're unsure about any step:
1. DO NOT commit or push anything yet
2. Back up your current `.env.local` separately
3. Check the git history first
4. Ask for help if the database was committed

## Summary Checklist

- [ ] Checked if `prisma/dev.db` is in git history
- [ ] Rotated all API credentials
- [ ] Updated Vercel environment variables
- [ ] Verified no sensitive files are staged
- [ ] Updated `.env.local` with new credentials
- [ ] Tested that the app still works with new credentials
- [ ] (If necessary) Force pushed to remove history
- [ ] Set up pre-commit hook for future protection

---

**Remember:** Security is not optional. Take these steps seriously to protect your users and your application.
