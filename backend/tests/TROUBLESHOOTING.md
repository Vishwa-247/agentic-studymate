# 🔧 Troubleshooting API Keys

## ElevenLabs API Key Issues

### Current Status: ❌ Invalid API Key (401 Unauthorized)

### Common Issues & Solutions:

#### 1. **Key Format**
ElevenLabs keys should start with `sk_`
```
❌ Wrong: ELEVENLABS_API_KEY=abc123xyz
✅ Correct: ELEVENLABS_API_KEY=sk_abc123xyz...
```

#### 2. **Key Not Updated in .env**
After updating the key in `.env`:
- Make sure you saved the file
- Restart the test script (it reloads .env each time)
- Check for typos or extra spaces

#### 3. **Invalid/Expired Key**
- Get a fresh key from: https://elevenlabs.io/app/settings/api-keys
- Copy the entire key (usually starts with `sk_`)
- Make sure no extra characters

#### 4. **Wrong Key Type**
- Make sure you're using the **API Key**, not:
  - Voice ID
  - Project ID
  - User ID

### How to Fix:

1. **Go to ElevenLabs Dashboard:**
   - Visit: https://elevenlabs.io/app/settings/api-keys
   - Sign in to your account

2. **Get Your API Key:**
   - Look for "API Key" section
   - Click "Copy" or "Show" button
   - Key should look like: `sk_abc123def456...`

3. **Update .env File:**
   ```env
   ELEVENLABS_API_KEY=sk_your_actual_key_here
   ```
   - Make sure no quotes around the key
   - No spaces before/after
   - Start with `sk_`

4. **Test Again:**
   ```bash
   python backend/tests/test_api_keys.py
   ```

### Note
ElevenLabs is **optional** - your course generation will work fine without it. Audio will just show "not available" message.

---

## Other Common Issues

### Gemini Keys Not Working
- Check if keys start with `AIzaSy...`
- Verify you haven't hit free tier limits
- Get new keys from: https://makersuite.google.com/app/apikey

### Supabase Connection Failed
- Check `SUPABASE_URL` format (should be full URL with https://)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the service_role key (not anon key)
- Get key from: Dashboard → Settings → API → Service Role Key

### Brave Search Not Working
- Verify key format (usually alphanumeric)
- Check if free tier limit reached
- Get new key from: https://brave.com/search/api/
