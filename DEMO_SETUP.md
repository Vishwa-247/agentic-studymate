# Quick Setup & Demo Commands

## 🚀 First-Time Setup (Run Once)

### 1. Install Dependencies
```bash
cd d:\Agenntic-Studymate
npm install
```

### 2. Apply Database Migration
**Option A: Using Supabase CLI**
```bash
npx supabase db push
```

**Option B: Manual (If CLI doesn't work)**
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy contents of `supabase/migrations/20260120_user_onboarding.sql`
5. Paste and execute

---

## 🎬 Running the Demo (Every Time)

### Open 3 terminals in VS Code:

**Terminal 1: Frontend**
```bash
cd d:\Agenntic-Studymate
npm run dev
```
*Should open browser at http://localhost:5173*

**Terminal 2: API Gateway**
```bash
cd d:\Agenntic-Studymate\backend\gateway
uvicorn main:app --reload --port 8000
```
*Gateway runs at http://localhost:8000*

**Terminal 3: Orchestrator Service**
```bash
cd d:\Agenntic-Studymate\backend\orchestrator
uvicorn main:app --reload --port 8011
```
*Orchestrator runs at http://localhost:8011*

---

## ✅ Quick Verification Checklist

Before demo, verify these are running:
- [ ] Frontend: http://localhost:5173 (should show landing page)
- [ ] Gateway: http://localhost:8000/docs (Swagger UI)
- [ ] Orchestrator: http://localhost:8011/health (should return `{"status":"ok"}`)

---

## 🧪 Test Flow

1. **Sign up** with new account (use temp email or `test+demo@example.com`)
2. Should auto-redirect to `/onboarding`
3. Complete 5 steps:
   - Role: "Backend Engineer"
   - Focus: "Cracking Interviews"
   - Experience: "New Graduate"
   - Hours: "6-10 hours"
   - Learning: "Hands-on Practice"
4. Click "Complete Setup" → redirects to `/dashboard`
5. Dashboard should show **OrchestratorCard** at top with recommendation
6. Click "Start [Module]" → should navigate to that module

---

## 🐛 Troubleshooting

### Frontend won't start
```bash
# Re-install dependencies
rm -rf node_modules package-lock.json
npm install
```

### Backend services won't start
```bash
# Check Python version (need 3.9+)
python --version

# Install backend dependencies
cd backend/orchestrator
pip install -r requirements.txt

cd ../gateway
pip install -r requirements.txt
```

### Migration fails
- Check Supabase credentials in `.env`
- Verify you're using correct project ID
- Try manual SQL execution in dashboard

### Orchestrator returns error
- Check `backend/orchestrator/rules.py` exists
- Verify `user_state` table exists in Supabase
- Check Orchestrator logs in terminal

---

## 📸 Screenshots to Take for Demo

1. Onboarding Step 1 (Role selection)
2. Onboarding Progress Bar (Step 3/5)
3. Onboarding Complete → Redirect
4. Dashboard with OrchestratorCard visible
5. OrchestratorCard close-up (recommendation details)
6. Terminal showing all 3 services running

---

## 🎯 Demo Script (2 minutes)

**0:00-0:20** - "Let me show you the Phase 1 onboarding flow..."
- Sign up screen → Create account

**0:20-1:00** - "New users go through a 5-step personalization wizard..."
- Walk through each question quickly
- Point out progress bar, icons, validation

**1:00-1:20** - "After onboarding, users land on the dashboard..."
- Show orchestrator card at top
- Read out the recommendation + reason

**1:20-1:40** - "The Orchestrator decides the next step based on their profile..."
- Click "Start" button
- Navigate to recommended module

**1:40-2:00** - "This is the foundation for our agentic system..."
- Explain backend decides, not frontend
- Mention v0 → v1 evolution (rules → LLM + memory)
