#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import time
import os

class FastLaneLawnAPITester:
    def __init__(self, base_url="https://fast-lane-lawn.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_token = None
        self.customer_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test admin login
        try:
            response = self.session.post(f"{self.base_url}/auth/login", json={
                "email": "admin@fastlanelawn.com",
                "password": "admin123"
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get("role") == "admin":
                    self.log_test("Admin Login", True)
                else:
                    self.log_test("Admin Login", False, "Role not admin")
            else:
                self.log_test("Admin Login", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Admin Login", False, str(e))

        # Test customer registration
        try:
            test_email = f"test_{int(time.time())}@test.com"
            response = self.session.post(f"{self.base_url}/auth/register", json={
                "email": test_email,
                "password": "testpass123",
                "name": "Test Customer",
                "phone": "555-0123"
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get("role") == "customer":
                    self.log_test("Customer Registration", True)
                else:
                    self.log_test("Customer Registration", False, "Role not customer")
            else:
                self.log_test("Customer Registration", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Customer Registration", False, str(e))

        # Test /auth/me endpoint
        try:
            response = self.session.get(f"{self.base_url}/auth/me")
            if response.status_code == 200:
                data = response.json()
                if "user_id" in data:
                    self.log_test("Get Current User", True)
                else:
                    self.log_test("Get Current User", False, "No user_id in response")
            else:
                self.log_test("Get Current User", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Current User", False, str(e))

    def test_quote_endpoints(self):
        """Test quote request endpoints"""
        print("\n📝 Testing Quote Endpoints...")
        
        # Test quote creation
        try:
            response = self.session.post(f"{self.base_url}/quotes", json={
                "name": "Test Customer",
                "email": "test@example.com",
                "phone": "555-0123",
                "service_type": "lawn_mowing",
                "property_size": "1000 sq ft"
            })
            
            if response.status_code == 200:
                data = response.json()
                if "quote_id" in data:
                    self.quote_id = data["quote_id"]
                    self.log_test("Create Quote", True)
                else:
                    self.log_test("Create Quote", False, "No quote_id in response")
            else:
                self.log_test("Create Quote", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create Quote", False, str(e))

        # Test get quotes (admin only)
        try:
            response = self.session.get(f"{self.base_url}/quotes")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Quotes (Admin)", True)
                else:
                    self.log_test("Get Quotes (Admin)", False, "Response not a list")
            elif response.status_code == 401 or response.status_code == 403:
                self.log_test("Get Quotes (Admin)", True, "Correctly requires admin auth")
            else:
                self.log_test("Get Quotes (Admin)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Quotes (Admin)", False, str(e))

    def test_booking_endpoints(self):
        """Test booking endpoints"""
        print("\n📅 Testing Booking Endpoints...")
        
        # Test booking creation
        try:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            response = self.session.post(f"{self.base_url}/bookings", json={
                "date": tomorrow,
                "time": "2:00 PM",
                "name": "Test Customer",
                "address": "123 Test St",
                "phone": "555-0123",
                "email": "test@example.com",
                "payment_method": "cash",
                "amount": 50.0
            })
            
            if response.status_code == 200:
                data = response.json()
                if "booking_id" in data:
                    self.booking_id = data["booking_id"]
                    self.log_test("Create Booking", True)
                else:
                    self.log_test("Create Booking", False, "No booking_id in response")
            else:
                self.log_test("Create Booking", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create Booking", False, str(e))

        # Test get bookings
        try:
            response = self.session.get(f"{self.base_url}/bookings")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Bookings", True)
                else:
                    self.log_test("Get Bookings", False, "Response not a list")
            elif response.status_code == 401:
                self.log_test("Get Bookings", True, "Correctly requires authentication")
            else:
                self.log_test("Get Bookings", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Bookings", False, str(e))

    def test_payment_endpoints(self):
        """Test payment endpoints"""
        print("\n💳 Testing Payment Endpoints...")
        
        # Test Stripe session creation (requires booking)
        if hasattr(self, 'booking_id'):
            try:
                response = self.session.post(f"{self.base_url}/payments/stripe/create-session", json={
                    "booking_id": self.booking_id,
                    "payment_type": "stripe"
                })
                
                if response.status_code == 200:
                    data = response.json()
                    if "url" in data and "session_id" in data:
                        self.session_id = data["session_id"]
                        self.log_test("Create Stripe Session", True)
                    else:
                        self.log_test("Create Stripe Session", False, "Missing url or session_id")
                else:
                    self.log_test("Create Stripe Session", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Create Stripe Session", False, str(e))

            # Test payment status check
            if hasattr(self, 'session_id'):
                try:
                    response = self.session.get(f"{self.base_url}/payments/stripe/status/{self.session_id}")
                    if response.status_code == 200:
                        data = response.json()
                        if "status" in data and "payment_status" in data:
                            self.log_test("Check Payment Status", True)
                        else:
                            self.log_test("Check Payment Status", False, "Missing status fields")
                    else:
                        self.log_test("Check Payment Status", False, f"Status: {response.status_code}")
                except Exception as e:
                    self.log_test("Check Payment Status", False, str(e))

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        # Test analytics
        try:
            response = self.session.get(f"{self.base_url}/analytics")
            if response.status_code == 200:
                data = response.json()
                expected_keys = ["total_bookings", "total_customers", "total_earnings", "pending_quotes"]
                if all(key in data for key in expected_keys):
                    self.log_test("Get Analytics", True)
                else:
                    self.log_test("Get Analytics", False, "Missing expected analytics keys")
            elif response.status_code == 401 or response.status_code == 403:
                self.log_test("Get Analytics", True, "Correctly requires admin auth")
            else:
                self.log_test("Get Analytics", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Analytics", False, str(e))

        # Test staff endpoint
        try:
            response = self.session.get(f"{self.base_url}/staff")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Staff", True)
                else:
                    self.log_test("Get Staff", False, "Response not a list")
            elif response.status_code == 401 or response.status_code == 403:
                self.log_test("Get Staff", True, "Correctly requires admin auth")
            else:
                self.log_test("Get Staff", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Staff", False, str(e))

        # Test invoices endpoint
        try:
            response = self.session.get(f"{self.base_url}/invoices")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Invoices", True)
                else:
                    self.log_test("Get Invoices", False, "Response not a list")
            elif response.status_code == 401 or response.status_code == 403:
                self.log_test("Get Invoices", True, "Correctly requires admin auth")
            else:
                self.log_test("Get Invoices", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Invoices", False, str(e))

    def test_invoice_creation(self):
        """Test invoice creation (admin only)"""
        print("\n🧾 Testing Invoice Creation...")
        
        try:
            tomorrow = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
            response = self.session.post(f"{self.base_url}/invoices", json={
                "customer_name": "Test Customer",
                "customer_email": "test@example.com",
                "items": [
                    {"description": "Lawn Mowing", "quantity": 1, "price": 50.0}
                ],
                "total_amount": 50.0,
                "due_date": tomorrow
            })
            
            if response.status_code == 200:
                data = response.json()
                if "invoice_id" in data:
                    self.log_test("Create Invoice", True)
                else:
                    self.log_test("Create Invoice", False, "No invoice_id in response")
            elif response.status_code == 401 or response.status_code == 403:
                self.log_test("Create Invoice", True, "Correctly requires admin auth")
            else:
                self.log_test("Create Invoice", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create Invoice", False, str(e))

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Fast Lane Lawn Care API Tests...")
        print(f"Testing against: {self.base_url}")
        
        self.test_auth_endpoints()
        self.test_quote_endpoints()
        self.test_booking_endpoints()
        self.test_payment_endpoints()
        self.test_admin_endpoints()
        self.test_invoice_creation()
        
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1

def main():
    tester = FastLaneLawnAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())