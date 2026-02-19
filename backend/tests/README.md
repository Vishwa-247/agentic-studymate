# API Keys Test Suite

## Quick Test

Run this command from the project root:

```bash
python backend/tests/test_api_keys.py
```

## What It Tests

✅ **Supabase Connection** - Database connectivity  
✅ **Gemini API Keys** - Tests all `GEMINI_API_KEY_*` variables  
✅ **ElevenLabs API** - TTS service (optional)  
✅ **Brave Search API** - Resource finding (optional)  

## Expected Results

### ✅ All Working (Ideal)

```
✅ Supabase Connection: ✅ PASS
✅ GEMINI_API_KEY_1: ✅ PASS
✅ GEMINI_API_KEY_2: ✅ PASS
✅ GEMINI_API_KEY_3: ✅ PASS
✅ Brave Search API: ✅ PASS
⚠️ ElevenLabs API: ⚠️ SKIP (optional)
```

### Minimum Required

At least:

- ✅ Supabase Connection
- ✅ 1 Gemini API Key

## Interpreting Results

- **✅ PASS**: Key is valid and working
- **❌ FAIL**: Key is invalid or expired (needs to be updated)
- **⚠️ SKIP**: Key not configured (OK if optional)

## Current Status

Based on last test run:

- ✅ **Supabase**: Working
- ✅ **Gemini Keys**: 3 keys working (excellent for load balancing!)
- ✅ **Brave Search**: Working
- ❌ **ElevenLabs**: Invalid key (optional - can remove or update)

## Troubleshooting

### Invalid API Key

1. Check the key in `.env` file
2. Verify it's not truncated
3. Get a new key from the service dashboard
4. Update `.env` and test again

### Rate Limited

If you see "Rate limited" messages, that's actually OK - it means the key is valid but you've hit the free tier limit. Wait a few minutes and try again.

### Connection Error

- Check internet connection
- Verify the service URL is correct
- Check if firewall is blocking requests
