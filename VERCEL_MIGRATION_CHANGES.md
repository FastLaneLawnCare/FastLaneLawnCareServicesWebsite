# Vercel Migration - Changes Made

## Summary of Fixes

Your application was failing after migrating from Emergent to Vercel due to several configuration and routing issues. Here are all the changes made:

## 1. **Fixed vercel.json Backend Routing** ✅

**Before:**
```json
"backend": {
    "entrypoint": "backend",
    "routePrefix": "/_/backend"
}
```

**After:**
```json
"backend": {
    "entrypoint": "backend",
    "routePrefix": "/api"
}
```

**Why**: Frontend API calls expect `/api` routes, but old config used `/_/backend`. This was breaking all API calls for signup, bookings, and quotes.

---

## 2. **Fixed CORS Configuration** ✅

**Before:**
```python
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    ...
)
```

**Issues**:
- Middleware added AFTER router (incorrect order)
- Only allowed single origin, not comma-separated list
- No error handling for missing env var

**After:**
```python
cors_origins = os.environ.get("FRONTEND_URL", "http://localhost:3000").split(",")
cors_origins = [origin.strip() for origin in cors_origins]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)
```

**Why**: Now properly handles multiple origins and middleware is added before router (correct order for FastAPI).

---

## 3. **Made Emergent Dependencies Optional** ✅

**Before**:
```python
from emergentintegrations.payments.stripe.checkout import StripeCheckout, ...
# ... hard crash if import fails
```

**After**:
```python
try:
    from emergentintegrations.payments.stripe.checkout import ...
except ImportError:
    logger.warning("emergentintegrations not available")
    StripeCheckout = None
```

**Storage functions updated**:
```python
# Now checks if storage is configured before trying to use it
def init_storage():
    if not use_storage:
        logger.info("Storage disabled")
        return None
    # ... rest of code
```

**Startup event updated**:
```python
if use_storage:
    try:
        init_storage()
    except Exception as e:
        logger.warning(f"Storage init failed: {e} - continuing without storage")
```

**Why**: You're moving away from Emergent. These changes prevent crashes if the library isn't installed or Emergent keys aren't configured.

---

## 4. **Fixed Cookie Security Settings** ✅

**Before** (always insecure):
```python
response.set_cookie(key="access_token", ..., secure=False, ...)
```

**After** (dynamic based on environment):
```python
is_secure = os.environ.get("ENVIRONMENT", "development") == "production"
response.set_cookie(key="access_token", ..., secure=is_secure, ...)
```

**Applied to**:
- `/auth/register` endpoint
- `/auth/login` endpoint

**Why**: Cookies must have `secure=True` in production (HTTPS), but `False` in development (HTTP). This was causing auth failures on Vercel.

---

## 5. **Added Error Handling to Payment Endpoints** ✅

**Stripe endpoints now check**:
```python
if not StripeCheckout:
    raise HTTPException(status_code=503, detail="Stripe integration not available")
if not stripe_api_key:
    raise HTTPException(status_code=503, detail="Stripe API key not configured")
```

**Why**: Prevents confusing crash errors and gives clear API response instead.

## Debugging Checklist
Use this if things still don't work:

### Signup/Login Not Working?
- [ ] Is `MONGO_URL` correctly set?
- [ ] Is `JWT_SECRET` set?
- [ ] Check backend logs for errors: `console.error()` and `logger.error()`
- [ ] Check browser console (F12) for CORS errors
- [ ] Is `FRONTEND_URL` set to your Vercel domain?

### Bookings Not Working?
- [ ] Can you signup/login? (fix that first)
- [ ] Is MongoDB database available?
- [ ] Try creating booking: `curl -X POST http://your-domain/api/bookings ...`
- [ ] Check if booking_id is being returned

### Quotes Not Working?
- [ ] Similar to bookings - test locally first
- [ ] Check if quote_id is being returned
- [ ] If file upload fails, check storage configuration

### CORS Errors?
- [ ] `FRONTEND_URL` must match the domain making requests
- [ ] Check Vercel domain in URL bar
- [ ] Set `FRONTEND_URL` to exact domain (including https://)

### Cookies/Auth Not Working?
- [ ] Did you set `ENVIRONMENT=production` for Vercel deployment?
- [ ] Check browser DevTools → Application → Cookies
- [ ] Cookies must have secure=true flag in HTTPS
---

## Key Environment Variables Reference

| Variable | Location | Purpose | Example |
|----------|----------|---------|---------|
| `REACT_APP_BACKEND_URL` | Frontend | API endpoint | `https://app.example.com` |
| `FRONTEND_URL` | Backend | CORS allowed origin | `https://app.example.com` |
| `MONGO_URL` | Backend | Database connection | `mongodb+srv://user:pass@host` |
| `DB_NAME` | Backend | Database name | `fastlanelawn` |
| `JWT_SECRET` | Backend | Auth signing key | `random_secure_string` |
| `ENVIRONMENT` | Backend | Cookie security flag | `production` or `development` |
| `STRIPE_API_KEY` | Backend | Stripe payments (optional) | `sk_test_xxxx` |
| `PAYPAL_CLIENT_ID` | Backend | PayPal (optional) | `xxxx` |
| `ADMIN_EMAIL` | Backend | Initial admin account | `admin@fastlanelawn.com` |
| `ADMIN_PASSWORD` | Backend | Initial admin password | `secure_password` |
---

## Files Changed

1. **vercel.json** - Updated backend route prefix from `/_/backend` to `/api`
2. **backend/server.py**:
   - Made Emergent imports optional
   - Updated CORS configuration
   - Made storage functions handle missing configuration
   - Updated startup event
   - Fixed cookie security settings
   - Added error handling to payment endpoints

See [VERCEL_MIGRATION_ENV_GUIDE.md](VERCEL_MIGRATION_ENV_GUIDE.md) for detailed environment variable setup.
