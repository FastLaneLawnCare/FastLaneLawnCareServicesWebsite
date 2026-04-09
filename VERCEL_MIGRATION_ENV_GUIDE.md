# Vercel Migration - Environment Variables Guide

After migrating from Emergent to Vercel, you must configure these environment variables for the application to work properly.

## Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory or set these in Vercel project settings:

```
# Backend API URL - determines where frontend sends API requests
REACT_APP_BACKEND_URL=https://your-vercel-domain.vercel.app

# For local development:
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Backend Environment Variables

Create a `.env` file in the `backend/` directory or set these in Vercel environment settings:

### Required Variables
```
# MongoDB Connection
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=fastlanelawn

# JWT Authentication
JWT_SECRET=your-very-long-random-secret-key-here-change-this

# Frontend URL for CORS - comma-separated for multiple origins
FRONTEND_URL=https://your-vercel-domain.vercel.app
# For local development:
FRONTEND_URL=http://localhost:3000

# Environment flag for cookie security
ENVIRONMENT=production  # Set to "production" for Vercel, "development" for local
```

### Optional Variables (for specific features)
```
# Stripe Payment Integration
STRIPE_API_KEY=sk_test_xxxx  # or sk_live_xxxx for production

# PayPal Integration
PAYPAL_CLIENT_ID=xxxx
PAYPAL_SECRET=xxxx

# Admin Account (for first-time setup)
ADMIN_EMAIL=admin@fastlanelawn.com
ADMIN_PASSWORD=your-secure-password

# Emergent Storage (if still using)
STORAGE_URL=https://integrations.emergentagent.com/objstore/api/v1/storage
EMERGENT_LLM_KEY=your-emergent-key
# If these are not set, storage features will be disabled gracefully
```

## Vercel Deployment Configuration

### 1. Add Environment Variables in Vercel
Go to your Vercel project → Settings → Environment Variables and add:

- `MONGO_URL`
- `DB_NAME`
- `JWT_SECRET`
- `FRONTEND_URL` (set to your Vercel domain)
- `STRIPE_API_KEY` (if using Stripe)
- `PAYPAL_CLIENT_ID` (if using PayPal)
- `PAYPAL_SECRET` (if using PayPal)
- `ENVIRONMENT=production`

### 2. Deploy
```bash
vercel deploy --prod
```

## Testing After Migration

### 1. Test Authentication (Sign Up)
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "Test User",
    "phone": "1234567890"
  }'
```

### 2. Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

### 3. Test Booking Creation
```bash
curl -X POST http://localhost:8000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-06-15",
    "time": "10:00 AM",
    "name": "John Doe",
    "address": "123 Main St, Bloomington, IL 61701",
    "phone": "2175551234",
    "email": "john@example.com",
    "payment_method": "cash",
    "amount": 50
  }'
```

### 4. Test Quote Request
```bash
curl -X POST http://localhost:8000/api/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "2175555678",
    "service_type": "lawn_mowing",
    "property_size": "0.25 acre"
  }'
```

## Troubleshooting

### CORS Errors
- **Problem**: `Access to XMLHttpRequest has been blocked by CORS policy`
- **Solution**: Check that `FRONTEND_URL` environment variable is correctly set in backend

### API Calls Failing (404 errors)
- **Problem**: Frontend can't reach backend endpoints
- **Solution**: Ensure `REACT_APP_BACKEND_URL` is correctly set to your Vercel domain

### Authentication/Cookies Not Working
- **Problem**: Not staying logged in, cookies not being sent
- **Solution**: 
  - Ensure `ENVIRONMENT=production` is set when deployed to Vercel
  - Check browser console for cookie security warnings
  - Make sure frontend and backend are at the same domain

### MongoDB Connection Failed
- **Problem**: `ServerSelectionTimeoutError` or connection failures
- **Solution**: 
  - Verify `MONGO_URL` is correct
  - Check that IP whitelist includes Vercel's IP ranges (allow all: 0.0.0.0/0)
  - Test connection string locally first

### Emergent/Storage Integration Failing
- **Problem**: Storage-related errors on startup
- **Solution**: These are now non-fatal. The app will log a warning and continue without storage features. Only set `EMERGENT_LLM_KEY` and `STORAGE_URL` if you're still using Emergent.

## Key Differences from Emergent Hosting

1. **API Endpoint**: Previously `/_/backend`, now `/api`
2. **Domain**: Update all hardcoded URLs to your Vercel domain
3. **CORS**: Now controlled by `FRONTEND_URL` variable instead of Emergent configuration
4. **Storage**: Emergent storage is now optional and won't crash the app if unavailable
5. **Cookies**: Security settings now adjust based on `ENVIRONMENT` variable

## Migration Checklist

- [ ] Created `.env` files locally with test values
- [ ] Tested sign-up locally
- [ ] Tested login locally
- [ ] Tested booking creation locally
- [ ] Tested quote submission locally
- [ ] Added environment variables to Vercel project settings
- [ ] Deployed to Vercel
- [ ] Tested sign-up on Vercel domain
- [ ] Tested login on Vercel domain
- [ ] Tested bookings on Vercel domain
- [ ] Tested quotes on Vercel domain
- [ ] Verified cookies/authentication works
