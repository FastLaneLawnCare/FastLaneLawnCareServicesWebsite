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

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def get_next_booking_number():
    counter = await db.counters.find_one_and_update(
        {"_id": "booking_counter"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return counter["seq"]

async def migrate_old_booking_ids():
    cursor = db.bookings.find({}).sort("created_at", 1)
    bookings = await cursor.to_list(length=10000)
    
    max_seq = 0
    for i, booking in enumerate(bookings):
        old_id = booking.get("booking_id", "")
        
        if old_id.isdigit():
            max_seq = max(max_seq, int(old_id))
            continue
        
        new_id = f"{i + 1:04d}"
        await db.bookings.update_one(
            {"_id": booking["_id"]},
            {"$set": {"booking_id": new_id}}
        )
        max_seq = max(max_seq, i + 1)
    
    await db.counters.update_one(
        {"_id": "booking_counter"},
        {"$set": {"seq": max_seq + 1}},
        upsert=True
    )
    
    return len(bookings)

# Create the main app

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
    
# ✅ 2. DEFINE ROUTERS
api_router = APIRouter(prefix="/api")

auth_router = APIRouter(prefix="/auth")
payments_router = APIRouter(prefix="/payments")
## bookings_router = APIRouter(prefix="/bookings")
stripe_router = APIRouter(prefix="/stripe")
paypal_router = APIRouter(prefix="/paypal")

@api_router.get("/test")
async def test():
    return {"message": "API is working ✅"}

@payments_router.get("/test")
async def paymentstest():
    return {"message": "Payments API is working ✅"}

@api_router.get("/bookings/test")
async def bookingstest():
    return {"message": "Bookings API is working ✅"}

@auth_router.get("/test")
async def authtest():
    return {"message": "Auth API is working ✅"}

@stripe_router.get("/test")
async def stripetest():
    return {"message": "Stripe API is working ✅"}

@paypal_router.get("/test")
async def paypaltest():
    return {"message": "PayPal API is working ✅"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
MIN_BOOKING_DAYS_AHEAD = 2
ROLE_HIERARCHY = {
    "customer": 0,
    "staff": 1,          # legacy alias for crew
    "crew": 1,
    "crew_manager": 2,
    "manager": 3,
    "ceo": 4
}

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

def send_resend_email(to_email: str, subject: str, html: str = None, template_id: str = None, template_vars: dict = None) -> None:
    try:
        import resend
    except ImportError:
        logger.warning("resend module not installed; skipping email send.")
        return
    
    resend_api_key = os.environ.get("RESEND_API_KEY")
    if not resend_api_key:
        logger.warning("RESEND_API_KEY is not configured; skipping email send.")
        return

    sender_email = os.environ.get("RESEND_FROM_EMAIL", "Fast Lane Lawn Care <mail@fastlanelawn.com>")

    try:
        resend.api_key = resend_api_key

        email_params = {
            "from": sender_email,
            "to": [to_email],
            "subject": subject,
        }

        if template_id and template_vars:
            email_params["template"] = {
                "id": template_id,
                "variables": template_vars
            }
        elif html:
            email_params["html"] = html

        response = resend.Emails.send(email_params)
        if response.get("error"):
            logger.error("Resend email failed: %s", response.get("error"))
    except Exception as email_error:
        logger.error("Resend email exception: %s", email_error)


def send_booking_emails(booking_doc: dict) -> None:
    owner_email = os.environ.get("OWNER_EMAIL") or os.environ.get("ADMIN_EMAIL")
    customer_email = booking_doc.get("email")
    template_id = os.environ.get("RESEND_TEMPLATE_ID", "").strip() or None

    template_vars = {
        "booking_id": booking_doc.get("booking_id", ""),
        "appointment_date": booking_doc.get("date", ""),
        "appointment_time": booking_doc.get("time", ""),
        "service_address": booking_doc.get("address", ""),
        "payment_method": (booking_doc.get("payment_method") or "").upper(),
        "payment_amount": booking_doc.get("amount", ""),
    }

    if customer_email:
        if template_id:
            send_resend_email(
                customer_email,
                "Your Fast Lane Lawn Care Booking Is Confirmed",
                template_id=template_id,
                template_vars=template_vars,
            )
        else:
            send_resend_email(
                customer_email,
                "Booking Received - Fast Lane Lawn Care",
                f"""
                <h2>Booking Confirmed</h2>
                <p>Hi {booking_doc.get('name', 'Customer')},</p>
                <p>We received your booking request.</p>
                <ul>
                  <li><strong>Booking ID:</strong> #{booking_doc.get('booking_id')}</li>
                  <li><strong>Date:</strong> {booking_doc.get('date')}</li>
                  <li><strong>Time:</strong> {booking_doc.get('time')}</li>
                  <li><strong>Address:</strong> {booking_doc.get('address')}</li>
                  <li><strong>Payment Method:</strong> {booking_doc.get('payment_method')}</li>
                  <li><strong>Amount:</strong> ${booking_doc.get('amount')}</li>
                </ul>
                <p>We will follow up soon.</p>
                """,
            )

    if owner_email:
        send_resend_email(
            owner_email,
            f"New Booking: #{booking_doc.get('booking_id')}",
            f"""
            <h2>New Booking Submitted</h2>
            <ul>
              <li><strong>Booking ID:</strong> #{booking_doc.get('booking_id')}</li>
              <li><strong>Name:</strong> {booking_doc.get('name')}</li>
              <li><strong>Email:</strong> {booking_doc.get('email')}</li>
              <li><strong>Phone:</strong> {booking_doc.get('phone')}</li>
              <li><strong>Date:</strong> {booking_doc.get('date')}</li>
              <li><strong>Time:</strong> {booking_doc.get('time')}</li>
              <li><strong>Address:</strong> {booking_doc.get('address')}</li>
              <li><strong>Payment Method:</strong> {booking_doc.get('payment_method')}</li>
              <li><strong>Amount:</strong> ${booking_doc.get('amount')}</li>
            </ul>
            """,
        )


def send_quote_emails(quote_doc: dict) -> None:
    owner_email = os.environ.get("OWNER_EMAIL") or os.environ.get("ADMIN_EMAIL")
    customer_email = quote_doc.get("email")

    if customer_email:
        send_resend_email(
            customer_email,
            "Quote Request Received - Fast Lane Lawn Care",
            f"""
            <h2>Quote Request Received</h2>
            <p>Hi {quote_doc.get('name', 'Customer')},</p>
            <p>We received your quote request and will get back to you shortly.</p>
            <ul>
              <li><strong>Quote ID:</strong> {quote_doc.get('quote_id')}</li>
              <li><strong>Service Type:</strong> {quote_doc.get('service_type')}</li>
              <li><strong>Property Size:</strong> {quote_doc.get('property_size')}</li>
            </ul>
            """,
        )

    if owner_email:
        send_resend_email(
            owner_email,
            f"New Quote Request: {quote_doc.get('quote_id')}",
            f"""
            <h2>New Quote Request Submitted</h2>
            <ul>
              <li><strong>Quote ID:</strong> {quote_doc.get('quote_id')}</li>
              <li><strong>Name:</strong> {quote_doc.get('name')}</li>
              <li><strong>Email:</strong> {quote_doc.get('email')}</li>
              <li><strong>Phone:</strong> {quote_doc.get('phone')}</li>
              <li><strong>Service Type:</strong> {quote_doc.get('service_type')}</li>
              <li><strong>Property Size:</strong> {quote_doc.get('property_size')}</li>
            </ul>
            """,
        )

class User(BaseModel):
    user_id: str
    email: str
    name: str
    role: str = "customer"
    phone: Optional[str] = None
    house_number: Optional[str] = None
    street_name: Optional[str] = None
    apt_number: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    hourly_rate: Optional[float] = None
    created_at: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

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
    user_id: Optional[str] = None
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

class StaffRoleUpdate(BaseModel):
    role: str

class StaffPayUpdate(BaseModel):
    hourly_rate: float

class ClockInRequest(BaseModel):
    notes: Optional[str] = None

class ClockOutRequest(BaseModel):
    notes: Optional[str] = None

class ClockStatusResponse(BaseModel):
    session_id: Optional[str] = None
    clock_in_time: Optional[str] = None
    clock_out_time: Optional[str] = None
    duration_hours: Optional[float] = None
    notes: Optional[str] = None
    is_clocked_in: bool

class TimeLogResponse(BaseModel):
    session_id: str
    staff_id: str
    clock_in_time: str
    clock_out_time: Optional[str] = None
    duration_hours: Optional[float] = None
    notes: Optional[str] = None
    created_at: str

class ClockedInStaffResponse(BaseModel):
    staff_id: str
    name: str
    email: str
    role: str
    session_id: str
    clock_in_time: str
    elapsed_hours: float

class PaymentSessionCreate(BaseModel):
    booking_id: str
    payment_type: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    house_number: Optional[str] = None
    street_name: Optional[str] = None
    apt_number: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None

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

def set_auth_cookies(response: Response, user_id: str, email: str) -> None:
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    is_secure = os.environ.get("ENVIRONMENT", "development") == "production"

    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=is_secure, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=is_secure, samesite="lax", max_age=604800, path="/")

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
    if user.get("role") not in {"ceo", "manager"}:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def normalize_role(role: Optional[str]) -> str:
    return (role or "customer").strip().lower()

def role_level(role: Optional[str]) -> int:
    return ROLE_HIERARCHY.get(normalize_role(role), 0)

async def require_role_at_least(request: Request, minimum_role: str) -> dict:
    user = await get_current_user(request)
    if role_level(user.get("role")) < role_level(minimum_role):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user

async def require_ceo(request: Request) -> dict:
    user = await get_current_user(request)
    if normalize_role(user.get("role")) != "ceo":
        raise HTTPException(status_code=403, detail="CEO access required")
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
    
    set_auth_cookies(response, user_id, email)
    
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
    
    set_auth_cookies(response, user["user_id"], email)
    
    user_doc = {k: v for k, v in user.items() if k not in ["_id", "password_hash"]}
    return user_doc

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_auth(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    try:
        payload = jwt.decode(refresh_token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        set_auth_cookies(response, user["user_id"], user["email"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.patch("/auth/profile")
async def update_profile(profile_data: UserProfileUpdate, request: Request):
    user = await get_current_user(request)

    normalized_name = (profile_data.name or "").strip() or (user.get("name") or "").strip()
    normalized_phone = (profile_data.phone or "").strip() or None
    normalized_house_number = (profile_data.house_number or "").strip() or None
    normalized_street_name = (profile_data.street_name or "").strip() or None
    normalized_apt_number = (profile_data.apt_number or "").strip() or None
    normalized_city = (profile_data.city or "").strip() or None
    normalized_zip_code = (profile_data.zip_code or "").strip() or None
    if not normalized_name:
        raise HTTPException(status_code=400, detail="Name is required before saving profile")

    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "name": normalized_name,
            "phone": normalized_phone,
            "house_number": normalized_house_number,
            "street_name": normalized_street_name,
            "apt_number": normalized_apt_number,
            "city": normalized_city,
            "zip_code": normalized_zip_code
        }}
    )

    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user.pop("password_hash", None)
    return updated_user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== BOOKING ENDPOINTS ====================

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, request: Request):
    try:
        requested_booking_date = datetime.strptime(booking_data.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid booking date format")

    minimum_allowed_booking_date = datetime.now(timezone.utc).date() + timedelta(days=MIN_BOOKING_DAYS_AHEAD)
    if requested_booking_date < minimum_allowed_booking_date:
        raise HTTPException(
            status_code=400,
            detail=f"Bookings must be made at least {MIN_BOOKING_DAYS_AHEAD} days in advance"
        )

    try:
        user = await get_current_user(request)
        user_id = user.get("user_id")
    except:
        user_id = None
    
    booking_seq = await get_next_booking_number()
    booking_id = f"{booking_seq:04d}"
    
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
    send_booking_emails(booking_doc)
    booking_doc.pop("_id", None)
    return booking_doc

@api_router.get("/bookings/mine")
async def get_my_bookings(request: Request):
    try:
        user = await get_current_user(request)

        bookings = await db.bookings.find(
            {"email": user["email"]},
            {"_id": 0}
        ).to_list(1000)

        return bookings

    except Exception as e:
        print("🚨:", e)
        raise e

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(request: Request):
    user = await get_current_user(request)
    
    if role_level(user.get("role")) >= role_level("manager"):
        bookings = await db.bookings.find({}, {"_id": 0}).to_list(1000)
    else:
        bookings = await db.bookings.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    
    return bookings

@api_router.get("/bookings/occupied-slots")
async def get_occupied_slots(date: str = Query(...)):
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    occupied_bookings = await db.bookings.find(
        {
            "date": date,
            "booking_status": {"$ne": "cancelled"}
        },
        {"_id": 0, "time": 1}
    ).to_list(1000)

    occupied_times = sorted({booking.get("time") for booking in occupied_bookings if booking.get("time")})
    return {"date": date, "occupied_times": occupied_times}

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@api_router.patch("/bookings/{booking_id}")
async def update_booking(booking_id: str, update_data: dict, request: Request):
    await require_ceo(request)
    
    result = await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Booking updated"}

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, request: Request):
    await require_ceo(request)
    
    result = await db.bookings.delete_one({"booking_id": booking_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Booking deleted"}

@api_router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, request: Request):
    print(f"Cancel booking {booking_id}")
    try:
        user = await get_current_user(request)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth exception: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    print(f"User authenticated: {user.get('email')}")
    user_id = user.get("user_id")
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    user_email = user.get("email", "").lower()
    booking_email = booking.get("email", "").lower()
    if booking_email != user_email:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
    
    if booking.get("booking_status") == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")
    
    if booking.get("booking_status") == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel a completed booking")
    
    if booking.get("payment_method", "").lower() != "cash":
        raise HTTPException(status_code=400, detail="Only cash bookings can be cancelled by clients")
    
    if booking.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Cannot cancel a paid booking")
    
    booking_date = datetime.strptime(booking.get("date", ""), "%Y-%m-%d").date()
    if booking_date <= datetime.now(timezone.utc).date() + timedelta(days=2):
        raise HTTPException(status_code=400, detail="Cannot cancel a booking within 2 days of the service date")
    
    await db.bookings.delete_one({"booking_id": booking_id})
    
    return {"message": "Booking cancelled"}

# ==================== QUOTE ENDPOINTS ====================

@api_router.post("/quotes", response_model=Quote)
async def create_quote(quote_data: QuoteCreate, request: Request):
    try:
        user = await get_current_user(request)
    except HTTPException:
        user = None

    quote_id = f"quote_{uuid.uuid4().hex[:12]}"
    
    quote_doc = {
        "quote_id": quote_id,
        "user_id": user.get("user_id") if user else None,
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
    send_quote_emails(quote_doc)
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
    await require_role_at_least(request, "manager")
    quotes = await db.quotes.find({}, {"_id": 0}).to_list(1000)
    return quotes

@api_router.get("/quotes/mine", response_model=List[Quote])
async def get_my_quotes(request: Request):
    user = await get_current_user(request)
    quotes = await db.quotes.find(
        {
            "$or": [
                {"user_id": user["user_id"]},
                {"email": user["email"]}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return quotes

@api_router.patch("/quotes/{quote_id}")
async def update_quote(quote_id: str, update_data: QuoteUpdate, request: Request):
    await require_ceo(request)
    
    result = await db.quotes.update_one(
        {"quote_id": quote_id},
        {"$set": update_data.model_dump(exclude_unset=True)}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    return {"message": "Quote updated"}

@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str, request: Request):
    await require_ceo(request)
    
    result = await db.quotes.delete_one({"quote_id": quote_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    return {"message": "Quote deleted"}

# File download removed - storage functionality removed

# ==================== INVOICE ENDPOINTS ====================

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate, request: Request):
    await require_ceo(request)
    
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
    await require_role_at_least(request, "manager")
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    return invoices

@api_router.get("/invoices/mine", response_model=List[Invoice])
async def get_my_invoices(request: Request):
    user = await get_current_user(request)
    invoices = await db.invoices.find(
        {"customer_email": user["email"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return invoices

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, request: Request):
    await require_ceo(request)
    
    result = await db.invoices.delete_one({"invoice_id": invoice_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return {"message": "Invoice deleted"}

# ==================== STAFF ENDPOINTS ====================

@api_router.get("/staff")
async def get_staff(request: Request):
    await require_role_at_least(request, "manager")
    staff = await db.users.find({"role": {"$in": ["ceo", "manager", "crew_manager", "crew", "staff"]}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
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
            "avg_performance_score": round(avg_score, 1),
            "jobs_per_hour": round((len(completed) / total_hours), 2) if total_hours > 0 else 0,
            "hourly_rate": float(s.get("hourly_rate", 0) or 0),
            "estimated_earnings": round(total_hours * float(s.get("hourly_rate", 0) or 0), 2)
        })
    
    return staff_with_metrics

@api_router.post("/staff/work-log")
async def log_staff_work(work_data: StaffUpdate, request: Request):
    await require_ceo(request)
    
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

@api_router.get("/staff/me")
async def get_my_staff_metrics(request: Request):
    user = await require_role_at_least(request, "staff")
    if normalize_role(user.get("role")) not in {"staff", "crew", "crew_manager", "manager", "ceo"}:
        raise HTTPException(status_code=403, detail="Staff access required")

    bookings = await db.bookings.find({"staff_id": user["user_id"]}).to_list(1000)
    completed = [b for b in bookings if b.get("booking_status") == "completed"]
    work_logs = await db.staff_work_logs.find({"staff_id": user["user_id"]}).to_list(1000)

    total_hours = sum(log.get("hours_worked", 0) for log in work_logs)
    scored_logs = [log.get("performance_score") for log in work_logs if log.get("performance_score") is not None]
    avg_score = (sum(scored_logs) / len(scored_logs)) if scored_logs else 0
    hourly_rate = float(user.get("hourly_rate") or 0)

    return {
        "user_id": user["user_id"],
        "name": user.get("name"),
        "role": normalize_role(user.get("role")),
        "hourly_rate": hourly_rate,
        "completed_jobs": len(completed),
        "total_hours": round(total_hours, 2),
        "avg_performance_score": round(avg_score, 1),
        "jobs_per_hour": round((len(completed) / total_hours), 2) if total_hours > 0 else 0,
        "estimated_earnings": round(total_hours * hourly_rate, 2)
    }

@api_router.patch("/staff/{staff_user_id}/hourly-rate")
async def update_staff_hourly_rate(staff_user_id: str, pay_data: StaffPayUpdate, request: Request):
    acting_user = await require_role_at_least(request, "manager")
    acting_role = normalize_role(acting_user.get("role"))
    if acting_role not in {"manager", "ceo"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    target_user = await db.users.find_one({"user_id": staff_user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Staff user not found")

    target_role = normalize_role(target_user.get("role"))
    if target_role not in {"staff", "crew", "crew_manager"}:
        raise HTTPException(status_code=403, detail="Hourly rate can only be updated for crew")

    await db.users.update_one(
        {"user_id": staff_user_id},
        {"$set": {"hourly_rate": float(pay_data.hourly_rate)}}
    )
    return {"message": "Staff hourly rate updated"}

@api_router.patch("/staff/{staff_user_id}/role")
async def update_staff_role(staff_user_id: str, role_data: StaffRoleUpdate, request: Request):
    await require_ceo(request)
    target_role = normalize_role(role_data.role)
    if target_role not in {"manager", "crew_manager", "crew"}:
        raise HTTPException(status_code=400, detail="Role must be manager, crew_manager, or crew")

    target_user = await db.users.find_one({"user_id": staff_user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if normalize_role(target_user.get("role")) == "ceo":
        raise HTTPException(status_code=403, detail="Cannot change CEO role")

    await db.users.update_one(
        {"user_id": staff_user_id},
        {"$set": {"role": target_role}}
    )
    return {"message": "User role updated"}

# ==================== TIME CLOCK ENDPOINTS ====================

@api_router.post("/staff/clock-in")
async def clock_in(clock_in_data: ClockInRequest, request: Request):
    user = await require_role_at_least(request, "staff")
    user_id = user.get("user_id")
    
    # Check if user is already clocked in
    existing_session = await db.time_clock_sessions.find_one({
        "staff_id": user_id,
        "clock_out_time": None
    })
    
    if existing_session:
        raise HTTPException(status_code=400, detail="Already clocked in")
    
    # Create new clock-in session
    session_id = str(uuid.uuid4())
    current_time = datetime.now(timezone.utc).isoformat()
    
    session_doc = {
        "session_id": session_id,
        "staff_id": user_id,
        "clock_in_time": current_time,
        "clock_out_time": None,
        "duration_hours": None,
        "notes": clock_in_data.notes,
        "created_at": current_time
    }
    
    await db.time_clock_sessions.insert_one(session_doc)
    
    return {
        "message": "Clocked in successfully",
        "session": {
            "session_id": session_id,
            "clock_in_time": current_time,
            "notes": clock_in_data.notes
        }
    }

@api_router.post("/staff/clock-out")
async def clock_out(clock_out_data: ClockOutRequest, request: Request):
    user = await require_role_at_least(request, "staff")
    user_id = user.get("user_id")
    
    # Find open session
    existing_session = await db.time_clock_sessions.find_one({
        "staff_id": user_id,
        "clock_out_time": None
    })
    
    if not existing_session:
        raise HTTPException(status_code=400, detail="Not clocked in")
    
    # Calculate duration
    clock_in_time = datetime.fromisoformat(existing_session["clock_in_time"].replace('Z', '+00:00'))
    current_time = datetime.now(timezone.utc)
    duration_hours = round((current_time - clock_in_time).total_seconds() / 3600, 2)
    
    # Update session
    current_time_iso = current_time.isoformat()
    await db.time_clock_sessions.update_one(
        {"session_id": existing_session["session_id"]},
        {
            "$set": {
                "clock_out_time": current_time_iso,
                "duration_hours": duration_hours,
                "notes": clock_out_data.notes if clock_out_data.notes else existing_session.get("notes", "")
            }
        }
    )
    
    return {
        "message": "Clocked out successfully",
        "session": {
            "session_id": existing_session["session_id"],
            "clock_in_time": existing_session["clock_in_time"],
            "clock_out_time": current_time_iso,
            "duration_hours": duration_hours,
            "notes": clock_out_data.notes if clock_out_data.notes else existing_session.get("notes", "")
        }
    }

@api_router.get("/staff/clock-status", response_model=ClockStatusResponse)
async def get_clock_status(request: Request):
    user = await require_role_at_least(request, "staff")
    user_id = user.get("user_id")
    
    # Find open session
    session = await db.time_clock_sessions.find_one({
        "staff_id": user_id,
        "clock_out_time": None
    })
    
    if session:
        return ClockStatusResponse(
            session_id=session["session_id"],
            clock_in_time=session["clock_in_time"],
            clock_out_time=None,
            duration_hours=None,
            notes=session.get("notes"),
            is_clocked_in=True
        )
    else:
        return ClockStatusResponse(
            is_clocked_in=False
        )

@api_router.get("/staff/time-logs")
async def get_time_logs(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    staff_id: Optional[str] = None
):
    user = await require_role_at_least(request, "staff")
    user_role = normalize_role(user.get("role"))
    
    # Build query
    query = {}
    
    # If not manager/ceo, only show own logs
    if user_role not in {"manager", "ceo"}:
        query["staff_id"] = user.get("user_id")
    elif staff_id:
        # Manager/ceo can filter by specific staff
        query["staff_id"] = staff_id
    
    # Add date filters if provided
    if start_date:
        query["clock_in_time"] = {"$gte": start_date}
    if end_date:
        if "clock_in_time" in query:
            query["clock_in_time"]["$lte"] = end_date
        else:
            query["clock_in_time"] = {"$lte": end_date}
    
    # Fetch sessions
    sessions = await db.time_clock_sessions.find(query).sort("clock_in_time", -1).to_list(length=None)
    
    # Convert to response format
    time_logs = []
    for session in sessions:
        time_logs.append({
            "session_id": session["session_id"],
            "staff_id": session["staff_id"],
            "clock_in_time": session["clock_in_time"],
            "clock_out_time": session.get("clock_out_time"),
            "duration_hours": session.get("duration_hours"),
            "notes": session.get("notes"),
            "created_at": session["created_at"]
        })
    
    return {"time_logs": time_logs}

@api_router.get("/staff/clocked-in", response_model=List[ClockedInStaffResponse])
async def get_clocked_in_staff(request: Request):
    user = await require_role_at_least(request, "manager")
    
    # Find all open sessions
    open_sessions = await db.time_clock_sessions.find({
        "clock_out_time": None
    }).to_list(length=None)
    
    clocked_in_staff = []
    current_time = datetime.now(timezone.utc)
    
    for session in open_sessions:
        # Get staff user info
        staff_user = await db.users.find_one({"user_id": session["staff_id"]})
        if not staff_user:
            continue
            
        # Calculate elapsed hours
        clock_in_time = datetime.fromisoformat(session["clock_in_time"].replace('Z', '+00:00'))
        elapsed_hours = round((current_time - clock_in_time).total_seconds() / 3600, 2)
        
        clocked_in_staff.append(ClockedInStaffResponse(
            staff_id=session["staff_id"],
            name=staff_user.get("name", "Unknown"),
            email=staff_user.get("email", ""),
            role=staff_user.get("role", ""),
            session_id=session["session_id"],
            clock_in_time=session["clock_in_time"],
            elapsed_hours=elapsed_hours
        ))
    
    return clocked_in_staff

# ==================== ANALYTICS ENDPOINTS ====================

@api_router.get("/analytics")
async def get_analytics(request: Request):
    await require_role_at_least(request, "manager")
    
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

    frontend_base_url = os.environ.get("FRONTEND_URL", "https://fastlanelawn.com").rstrip("/")
    success_url = f"{frontend_base_url}/my-account?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{frontend_base_url}/"

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
    migrated = await migrate_old_booking_ids()
    if migrated > 0:
        print(f"✅ Migrated {migrated} old booking IDs to new format")
    
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
            "role": "ceo",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    else:
        updates = {}
        if normalize_role(existing.get("role")) == "admin":
            updates["role"] = "ceo"
        if not verify_password(admin_password, existing["password_hash"]):
            updates["password_hash"] = hash_password(admin_password)
        if updates:
            await db.users.update_one(
                {"email": admin_email},
                {"$set": updates}
            )
            if "password_hash" in updates:
                logger.info("Admin password updated")
            if "role" in updates:
                logger.info("Admin role migrated to CEO")
    
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: ceo

## Test Customer (Create via registration)
- Use registration form to create test customer accounts

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
""")
        
@app.get("/")
def root():
    return {"status": "ok"}
        
# nesting
payments_router.include_router(stripe_router)
payments_router.include_router(paypal_router)

api_router.include_router(auth_router)
##api_router.include_router(bookings_router)
api_router.include_router(payments_router)

app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
