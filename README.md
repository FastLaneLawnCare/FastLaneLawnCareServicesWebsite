# To Do List
- Connect/Set Up Database (MongoDB)
- Create PayPal Account + Get PayPal API Keys
- Create Unique Admin Logins

# Vercel Migration - Environment Variables Guide
After migrating to Vercel, you must configure these environment variables for the application to work properly.

## Frontend Environment Variables
Create a `.env.local` file in the `frontend/` directory or set these in Vercel project settings:

```
# Backend API URL - determines where frontend sends API requests
REACT_APP_BACKEND_URL=https://fastlanesite-2g21xbgxs-skylers-projects-8cb5897c.vercel.app/

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
FRONTEND_URL=https://fastlanesite.vercel.app/
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

# Storage features removed - using local storage only
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

## Key Differences from Previous Hosting
1. **API Endpoint**: Previously `/_/backend`, now `/api`
2. **Domain**: Update all hardcoded URLs to your Vercel domain
3. **CORS**: Now controlled by `FRONTEND_URL` variable instead of previous configuration
4. **Storage**: Storage features removed - using local storage only
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

---
## Next Steps to Fix Signup, Bookings, and Quotes
### 1. **Set Environment Variables**
You MUST set these for the app to work:

**Backend (.env or Vercel environment settings)**:
```
MONGO_URL=your_mongodb_connection_string
DB_NAME=fastlanelawn
JWT_SECRET=your_secret_key_here
FRONTEND_URL=https://fastlanesite.vercel.app/
ENVIRONMENT=production
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=Fast Lane Lawn Care <no-reply@mail.fastlanelawn.com>
OWNER_EMAIL=owner@fastlanelawn.com
```

**Frontend (.env.local or Vercel environment settings)**:
```
REACT_APP_BACKEND_URL=https://fastlanesite.vercel.app/
```

### 2. **Verify MongoDB Connection**
The app won't work without MongoDB. Test:
```bash
# Test MongoDB connection string
mongosh "your_mongo_url"
```

### 3. **Test Locally First**
Before deploying to Vercel, test locally:

```bash
# Terminal 1: Start backend
cd backend
pip install -r requirements.txt
# Set env vars in .env file
python -m uvicorn server:app --reload

# Terminal 2: Start frontend  
cd frontend
npm install
npm start
```

Then test:
- Go to http://localhost:3000/login - try to signup
- Check browser console for errors
- Check backend terminal for error logs

### 4. **Deploy to Vercel**
Once working locally:
```bash
vercel deploy --prod
```
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
| `RESEND_API_KEY` | Backend | Resend email API key | `re_xxxx` |
| `RESEND_FROM_EMAIL` | Backend | Sender email identity | `no-reply@mail.fastlanelawn.com` |
| `OWNER_EMAIL` | Backend | Owner notification inbox | `owner@fastlanelawn.com` |
| `ADMIN_EMAIL` | Backend | Initial admin account | `admin@fastlanelawn.com` |
| `ADMIN_PASSWORD` | Backend | Initial admin password | `secure_password` |
---
## Debugging Checklist

*Use this if things still don't work:*

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

## API
- Test API (Check if the API is Online)
> https://api.fastlanelawn.com/api/test/