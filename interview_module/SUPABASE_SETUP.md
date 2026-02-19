# Supabase Integration Setup

## 1. Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Note your project URL and API key

## 2. Set Up Database Schema

1. Open Supabase SQL Editor
2. Copy and paste the SQL from `supabase_schema.sql`
3. Run the SQL to create tables, indexes, and policies

## 3. Configure Credentials

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-anon-key-here
   ```

## 4. Usage

### Basic Example

```python
from stress_model import StressEstimator
import os
from dotenv import load_dotenv

load_dotenv()

estimator = StressEstimator()
session = estimator.start_session("interview_123")

# ... run interview ...

# Save to Supabase
estimator.save_session_to_supabase(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)
```

### Run the Demo

```bash
python supabase_example.py
```

## 5. Available Methods

### Save Session

```python
estimator.save_session_to_supabase(url, key)
```

### Load Session

```python
data = StressEstimator.load_session_from_supabase(session_id, url, key)
```

### List All Sessions

```python
sessions = StressEstimator.list_all_sessions(url, key, limit=50)
```

### Delete Session

```python
StressEstimator.delete_session(session_id, url, key)
```

## 6. Database Tables

- **sessions** - Interview summaries
- **questions** - Timestamped questions
- **recordings** - Individual stress readings with features and flags

## 7. Security

The schema includes Row Level Security (RLS) policies. Adjust them in `supabase_schema.sql` based on your authentication needs.

## 8. Querying Data

### In Supabase Dashboard

```sql
-- Recent high-risk interviews
SELECT * FROM high_risk_interviews LIMIT 10;

-- Interview statistics
SELECT * FROM interview_stats;

-- Get full session data
SELECT get_full_session('interview_123');
```

### In Python

```python
# Get all high-risk sessions
sessions = StressEstimator.list_all_sessions(url, key)
high_risk = [s for s in sessions if s['deception_risk'] == 'high']
```

## Troubleshooting

### Import Error

```
pip install supabase python-dotenv
```

### Connection Error

- Verify SUPABASE_URL and SUPABASE_KEY in .env
- Check Supabase project is active
- Ensure tables are created (run supabase_schema.sql)

### Permission Error

- Check RLS policies in Supabase dashboard
- Use service_role key for admin access (be careful!)
