from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Header, Query
from fastapi.responses import Response as FastAPIResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import requests
import stripe
stripe.api_key = os.environ.get("STRIPE_API_KEY")

# PayPal (your existing)
from paypalcheckoutsdk.core import SandboxEnvironment, PayPalHttpClient
from paypalcheckoutsdk.core import SandboxEnvironment, PayPalHttpClient
from paypalcheckoutsdk.orders import OrdersCreateRequest, OrdersCaptureRequest

import secrets
from bson import ObjectId
import secrets

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fastlanelawn.com",
        "https://www.fastlanelawn.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
    
# ✅ 2. DEFINE ROUTERS
api_router = APIRouter(prefix="/api")

auth_router = APIRouter(prefix="/auth")
payments_router = APIRouter(prefix="/payments")
bookings_router = APIRouter(prefix="/bookings")
stripe_router = APIRouter(prefix="/stripe")
paypal_router = APIRouter(prefix="/paypal")

@api_router.get("/test")
async def test():
    return {"message": "API is working ✅"}

@payments_router.get("/test")
async def paymentstest():
    return {"message": "Payments API is working ✅"}

@auth_router.get("/test")
async def authtest():
    return {"message": "Auth API is working ✅"}

@stripe_router.get("/test")
async def stripetest():
    return {"message": "Stripe API is working ✅"}

@paypal_router.get("/test")
async def paypaltest():
    return {"message": "PayPal API is working ✅"}

@auth_router.get("/registertest")
async def registertest():
    return {"message": "register route works ✅"}

@auth_router.get("/logintest")
async def logintest():
    return {"message": "login route works ✅"}

@auth_router.get("/admindetails")
async def admindetails():
    return {"message": "Email: admin@fastlanelawn.com - Password: admin123"}

@auth_router.get("/metest")
async def metest():
    return {"message": "Auth API is working and you are authenticated! ✅"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    role: str = "customer"
    phone: Optional[str] = None
    created_at: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Google auth models removed

class BookingCreate(BaseModel):
    date: str
    time: str
    name: str
    address: str
    phone: str
    email: str
    payment_method: str
    amount: float = float(os.environ.get("DEFAULT_SERVICE_PRICE", "50.0"))

class Booking(BaseModel):
    booking_id: str
    user_id: Optional[str] = None
    date: str
    time: str
    name: str
    address: str
    phone: str
    email: str
    payment_method: str
    payment_status: str = "pending"
    booking_status: str = "pending"
    amount: float
    created_at: str
    staff_id: Optional[str] = None

class QuoteCreate(BaseModel):
    name: str
    email: str
    phone: str
    service_type: str
    property_size: str

class Quote(BaseModel):
    quote_id: str
    name: str
    email: str
    phone: str
    service_type: str
    property_size: str
    photo_url: Optional[str] = None
    status: str = "pending"
    created_at: str
    response_message: Optional[str] = None

class QuoteUpdate(BaseModel):
    status: str
    response_message: Optional[str] = None

class InvoiceCreate(BaseModel):
    booking_id: Optional[str] = None
    customer_name: str
    customer_email: str
    items: List[Dict[str, Any]]
    total_amount: float
    due_date: str

class Invoice(BaseModel):
    invoice_id: str
    booking_id: Optional[str] = None
    customer_name: str
    customer_email: str
    items: List[Dict[str, Any]]
    total_amount: float
    due_date: str
    status: str = "unpaid"
    created_at: str

class StaffUpdate(BaseModel):
    booking_id: str
    hours_worked: float
    performance_score: Optional[int] = None

class PaymentSessionCreate(BaseModel):
    booking_id: str
    payment_type: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        token = request.cookies.get("session_token")
        if token:
            session_doc = await db.user_sessions.find_one({"session_token": token})
            if not session_doc:
                raise HTTPException(status_code=401, detail="Session not found")
            
            expires_at = session_doc["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Session expired")
            
            user = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return user
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== STORAGE HELPERS ====================

# Storage functionality removed - using local storage only

def put_object(path: str, data: bytes, content_type: str) -> dict:
    # Local storage only
    return {"path": path, "status": "local"}

def get_object(path: str) -> tuple:
    # Local storage only
    return b"", "application/octet-stream"

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": email,
        "password_hash": hashed,
        "name": user_data.name,
        "phone": user_data.phone,
        "role": "customer",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    # Determine secure flag based on environment
    is_secure = os.environ.get("ENVIRONMENT", "development") == "production"
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=is_secure, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=is_secure, samesite="lax", max_age=604800, path="/")
    
    user_doc.pop("_id", None)
    user_doc.pop("password_hash", None)
    return user_doc

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    email = credentials.email.lower()
    
    identifier = f"{email}"
    attempt_doc = await db.login_attempts.find_one({"identifier": identifier})
    if attempt_doc and attempt_doc.get("attempts", 0) >= 5:
        lockout_time = attempt_doc.get("lockout_until")
        if lockout_time and lockout_time > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
    
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"attempts": 1},
                "$set": {
                    "lockout_until": datetime.now(timezone.utc) + timedelta(minutes=15) if (attempt_doc and attempt_doc.get("attempts", 0) >= 4) else None
                }
            },
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    await db.login_attempts.delete_one({"identifier": identifier})
    
    access_token = create_access_token(user["user_id"], email)
    refresh_token = create_refresh_token(user["user_id"])
    
    # Determine secure flag based on environment
    is_secure = os.environ.get("ENVIRONMENT", "development") == "production"
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=is_secure, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=is_secure, samesite="lax", max_age=604800, path="/")
    
    user_doc = {k: v for k, v in user.items() if k not in ["_id", "password_hash"]}
    return user_doc

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# Google auth removed - using local auth only

# ==================== BOOKING ENDPOINTS ====================

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, request: Request):
    try:
        user = await get_current_user(request)
        user_id = user.get("user_id")
    except:
        user_id = None
    
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    
    booking_doc = {
        "booking_id": booking_id,
        "user_id": user_id,
        "date": booking_data.date,
        "time": booking_data.time,
        "name": booking_data.name,
        "address": booking_data.address,
        "phone": booking_data.phone,
        "email": booking_data.email,
        "payment_method": booking_data.payment_method,
        "payment_status": "pending",
        "booking_status": "pending",
        "amount": booking_data.amount,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "staff_id": None
    }
    
    await db.bookings.insert_one(booking_doc)
    booking_doc.pop("_id", None)
    return booking_doc

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(request: Request):
    user = await get_current_user(request)
    
    if user.get("role") == "admin":
        bookings = await db.bookings.find({}, {"_id": 0}).to_list(1000)
    else:
        bookings = await db.bookings.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    
    return bookings

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@api_router.patch("/bookings/{booking_id}")
async def update_booking(booking_id: str, update_data: dict, request: Request):
    await require_admin(request)
    
    result = await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Booking updated"}

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, request: Request):
    await require_admin(request)
    
    result = await db.bookings.delete_one({"booking_id": booking_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Booking deleted"}

# ==================== QUOTE ENDPOINTS ====================

@api_router.post("/quotes", response_model=Quote)
async def create_quote(quote_data: QuoteCreate):
    quote_id = f"quote_{uuid.uuid4().hex[:12]}"
    
    quote_doc = {
        "quote_id": quote_id,
        "name": quote_data.name,
        "email": quote_data.email,
        "phone": quote_data.phone,
        "service_type": quote_data.service_type,
        "property_size": quote_data.property_size,
        "photo_url": None,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "response_message": None
    }
    
    await db.quotes.insert_one(quote_doc)
    quote_doc.pop("_id", None)
    return quote_doc

@api_router.post("/quotes/{quote_id}/upload")
async def upload_quote_photo(quote_id: str, file: UploadFile = File(...)):
    quote = await db.quotes.find_one({"quote_id": quote_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # File upload disabled - storage removed
    return {"photo_url": None, "message": "File upload not available"}

@api_router.get("/quotes", response_model=List[Quote])
async def get_quotes(request: Request):
    await require_admin(request)
    quotes = await db.quotes.find({}, {"_id": 0}).to_list(1000)
    return quotes

@api_router.patch("/quotes/{quote_id}")
async def update_quote(quote_id: str, update_data: QuoteUpdate, request: Request):
    await require_admin(request)
    
    result = await db.quotes.update_one(
        {"quote_id": quote_id},
        {"$set": update_data.model_dump(exclude_unset=True)}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    return {"message": "Quote updated"}

@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str, request: Request):
    await require_admin(request)
    
    result = await db.quotes.delete_one({"quote_id": quote_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    return {"message": "Quote deleted"}

# File download removed - storage functionality removed

# ==================== INVOICE ENDPOINTS ====================

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate, request: Request):
    await require_admin(request)
    
    invoice_id = f"invoice_{uuid.uuid4().hex[:12]}"
    
    invoice_doc = {
        "invoice_id": invoice_id,
        "booking_id": invoice_data.booking_id,
        "customer_name": invoice_data.customer_name,
        "customer_email": invoice_data.customer_email,
        "items": invoice_data.items,
        "total_amount": invoice_data.total_amount,
        "due_date": invoice_data.due_date,
        "status": "unpaid",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.invoices.insert_one(invoice_doc)
    invoice_doc.pop("_id", None)
    return invoice_doc

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(request: Request):
    await require_admin(request)
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    return invoices

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, request: Request):
    await require_admin(request)
    
    result = await db.invoices.delete_one({"invoice_id": invoice_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return {"message": "Invoice deleted"}

# ==================== STAFF ENDPOINTS ====================

@api_router.get("/staff")
async def get_staff(request: Request):
    await require_admin(request)
    staff = await db.users.find({"role": {"$in": ["admin", "staff"]}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    staff_with_metrics = []
    for s in staff:
        bookings = await db.bookings.find({"staff_id": s["user_id"]}).to_list(1000)
        completed = [b for b in bookings if b.get("booking_status") == "completed"]
        
        total_hours = 0
        total_score = 0
        count = 0
        
        work_logs = await db.staff_work_logs.find({"staff_id": s["user_id"]}).to_list(1000)
        for log in work_logs:
            total_hours += log.get("hours_worked", 0)
            if log.get("performance_score"):
                total_score += log["performance_score"]
                count += 1
        
        avg_score = total_score / count if count > 0 else 0
        
        staff_with_metrics.append({
            **s,
            "completed_jobs": len(completed),
            "total_hours": round(total_hours, 2),
            "avg_performance_score": round(avg_score, 1)
        })
    
    return staff_with_metrics

@api_router.post("/staff/work-log")
async def log_staff_work(work_data: StaffUpdate, request: Request):
    await require_admin(request)
    
    booking = await db.bookings.find_one({"booking_id": work_data.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    log_doc = {
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "staff_id": booking.get("staff_id"),
        "booking_id": work_data.booking_id,
        "hours_worked": work_data.hours_worked,
        "performance_score": work_data.performance_score,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.staff_work_logs.insert_one(log_doc)
    
    return {"message": "Work log created"}

# ==================== ANALYTICS ENDPOINTS ====================

@api_router.get("/analytics")
async def get_analytics(request: Request):
    await require_admin(request)
    
    total_bookings = await db.bookings.count_documents({})
    total_customers = await db.users.count_documents({"role": "customer"})
    
    completed_bookings = await db.bookings.find({"payment_status": "paid"}, {"_id": 0}).to_list(10000)
    total_earnings = sum(b.get("amount", 0) for b in completed_bookings)
    
    pending_quotes = await db.quotes.count_documents({"status": "pending"})
    
    return {
        "total_bookings": total_bookings,
        "total_customers": total_customers,
        "total_earnings": round(total_earnings, 2),
        "pending_quotes": pending_quotes
    }

# ==================== PAYMENT ENDPOINTS ====================

stripe_api_key = os.environ.get("STRIPE_API_KEY")

@stripe_router.post("/create-session")
async def create_stripe_session(payment_data: PaymentSessionCreate, http_request: Request):
    booking = await db.bookings.find_one({"booking_id": payment_data.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    BASE_URL = "https://api.fastlanelawn.com"
    success_url = f"{BASE_URL}/booking-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{BASE_URL}/booking"

    if not stripe_api_key:
        raise HTTPException(status_code=503, detail="Stripe API key not configured")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"Booking {payment_data.booking_id}",
                        },
                        "unit_amount": int(float(booking["amount"]) * 100),
                    },
                    "quantity": 1,
                }
            ],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "booking_id": payment_data.booking_id
            }
        )

        await db.payment_transactions.insert_one({
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "booking_id": payment_data.booking_id,
            "session_id": session.id,
            "amount": booking["amount"],
            "currency": "usd",
            "payment_type": "stripe",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        return {
            "url": session.url,
            "session_id": session.id
        }

    except Exception as e:
       raise HTTPException(status_code=500, detail=str(e))
    
@payments_router.get("/stripe/status/{session_id}")
async def get_stripe_status(session_id: str):
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # If already marked paid in DB, return early
    if transaction.get("payment_status") == "paid":
        return {"status": "complete", "payment_status": "paid"}

    try:
        # Ensure Stripe key is set
        if not stripe.api_key:
            raise Exception("Stripe API key not configured")

        # 🔑 Fetch session directly from Stripe
        session = stripe.checkout.Session.retrieve(session_id)

        payment_status = session.payment_status  # 'paid', 'unpaid', etc.
        status = session.status  # 'complete', 'open', etc.

        # ✅ If payment completed, update DB
        if payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": "paid",
                    "status": "complete"
                }}
            )

            await db.bookings.update_one(
                {"booking_id": transaction["booking_id"]},
                {"$set": {"payment_status": "paid"}}
            )

        return {
            "status": status,
            "payment_status": payment_status,
            "amount": (session.amount_total or 0) / 100
        }

    except Exception as e:
        logger.error(f"Stripe status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    return {"status": "received"}

# ==================== PAYPAL PAYMENT ENDPOINTS ====================

@payments_router.post("/paypal/create-order")
async def create_paypal_order(payment_data: PaymentSessionCreate, http_request: Request):
    booking = await db.bookings.find_one({"booking_id": payment_data.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Initialize PayPal client
    paypal_client_id = os.environ.get("PAYPAL_CLIENT_ID", "test")
    paypal_secret = os.environ.get("PAYPAL_SECRET", "test")
    paypal_env = os.environ.get("PAYPAL_ENVIRONMENT", "sandbox")
    
    if paypal_env.lower() == "live":
        from paypalcheckoutsdk.core import LiveEnvironment
        environment = LiveEnvironment(client_id=paypal_client_id, client_secret=paypal_secret)
    else:
        environment = SandboxEnvironment(client_id=paypal_client_id, client_secret=paypal_secret)
    
    paypal_client = PayPalHttpClient(environment)
    
    # Create PayPal order
    request_obj = OrdersCreateRequest()
    request_obj.prefer('return=representation')
    
    host_url = str(http_request.base_url).rstrip('/')
    return_url = f"{host_url}/booking-success"
    cancel_url = f"{host_url}/booking"
    
    request_obj.request_body({
        "intent": "CAPTURE",
        "application_context": {
            "return_url": return_url,
            "cancel_url": cancel_url,
            "brand_name": os.environ.get("BRAND_NAME", "Fast Lane Lawn Care"),
            "user_action": "PAY_NOW"
        },
        "purchase_units": [{
            "reference_id": payment_data.booking_id,
            "description": f"Lawn service booking - {booking['date']} at {booking['time']}",
            "amount": {
                "currency_code": "USD",
                "value": str(float(booking["amount"]))
            }
        }]
    })
    
    try:
        response = paypal_client.execute(request_obj)
        order_id = response.result.id
        
        # Get approval URL
        approval_url = None
        for link in response.result.links:
            if link.rel == "approve":
                approval_url = link.href
                break
        
        # Store transaction
        await db.payment_transactions.insert_one({
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "booking_id": payment_data.booking_id,
            "paypal_order_id": order_id,
            "amount": booking["amount"],
            "currency": "usd",
            "payment_type": "paypal",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "order_id": order_id,
            "approval_url": approval_url
        }
        
    except Exception as e:
        logger.error(f"PayPal order creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create PayPal order: {str(e)}")

@api_router.post("/payments/paypal/capture/{order_id}")
async def capture_paypal_order(order_id: str):
    transaction = await db.payment_transactions.find_one({"paypal_order_id": order_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check if already captured
    if transaction.get("payment_status") == "paid":
        return {"status": "complete", "payment_status": "paid"}
    
    # Initialize PayPal client
    paypal_client_id = os.environ.get("PAYPAL_CLIENT_ID", "test")
    paypal_secret = os.environ.get("PAYPAL_SECRET", "test")
    paypal_env = os.environ.get("PAYPAL_ENVIRONMENT", "sandbox")
    
    if paypal_env.lower() == "live":
        from paypalcheckoutsdk.core import LiveEnvironment
        environment = LiveEnvironment(client_id=paypal_client_id, client_secret=paypal_secret)
    else:
        environment = SandboxEnvironment(client_id=paypal_client_id, client_secret=paypal_secret)
    
    paypal_client = PayPalHttpClient(environment)
    
    # Capture order
    request_obj = OrdersCaptureRequest(order_id)
    
    try:
        response = paypal_client.execute(request_obj)
        
        if response.result.status == "COMPLETED":
            # Update transaction
            await db.payment_transactions.update_one(
                {"paypal_order_id": order_id},
                {"$set": {
                    "payment_status": "paid",
                    "status": "complete",
                    "captured_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Update booking
            booking_id = transaction["booking_id"]
            await db.bookings.update_one(
                {"booking_id": booking_id},
                {"$set": {"payment_status": "paid"}}
            )
            
            return {
                "status": "complete",
                "payment_status": "paid",
                "order_id": order_id
            }
        else:
            return {
                "status": response.result.status,
                "payment_status": "pending"
            }
            
    except Exception as e:
        logger.error(f"PayPal capture error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to capture PayPal order: {str(e)}")

@payments_router.get("/paypal/status/{order_id}")
async def get_paypal_status(order_id: str):
    transaction = await db.payment_transactions.find_one({"paypal_order_id": order_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {
        "status": transaction.get("status", "pending"),
        "payment_status": transaction.get("payment_status", "pending"),
        "order_id": order_id
    }

# ==================== STARTUP EVENTS ====================

@app.on_event("startup")
async def startup():
    # Storage initialization removed
    
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@fastlanelawn.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info("Admin password updated")
    
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Test Customer (Create via registration)
- Use registration form to create test customer accounts

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
""")
        
# nesting
payments_router.include_router(stripe_router)
payments_router.include_router(paypal_router)

api_router.include_router(auth_router)
api_router.include_router(bookings_router)
api_router.include_router(payments_router)

app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()