# Fast Lane Lawn Care Website Docs
This file serves as documentation for our [Website](https://fastlanelawn.com/).

## To Do List 📝
### Bookings 📚 
- [x] Allign "Book Now" Button more to the left.
- [x] resize the Calender parent frame so it doesnt look weird. (theres empty space right now)
- [x] Change the Time options to every hour instead of every 30 minutes.
- [ ] Remove the "House Number" field for the address, instead merge it into one.
- [ ] Setup PayPal Keys
- [ ] Replace random booking IDs with checkout IDs. (Must match email booking ID sent to customer)
- [ ] Move "Scrap Pickup" to the bottom.
- [ ] Change the "Quote" button color to green.
- [x] Center the text for the stage titles.
- [x] Fix the grey line cutting off
- [ ] Add A drop down menu for cities that we offer service in.
- [ ] Add More details to the "Booking Summary" Section. (Phone Number &  Email)
- [x] Add "Starting At" for lawn mowing.
- [ ] Force quotes for lawn mowing.
### Account Dashboard 🧑
- [x] Fix Bookings displaying globally.
- [ ] Fix Total booking text. (currently displays total bookings globally)
- [ ] Reset Password Support (With Email)
- [ ] Add an option for clients to cancel bookings that were set to be paid with cash
### Admin Dashboard 👑
- [ ] Add a Logout Button.
- [ ] Have the "Staff Dashboard" button instead display their role (Ex. CEO DASHBOARD)
- [ ] Remove delete capability for bookings. (CEO-only function)
- [ ] Staff Section pay rate settings should be hidden from everybody but the CEO. (Currently greyed out, but still visible)
- [ ] Add manual controls to change Booking status for if the booking has been Confirmed and if the payment has went through.
- [ ] Reorder the buttons (Bookings, Quotes, Invoices, Staff)
### Appearance 🎨
- [x] Embed Support.
- [ ] Add A custom "Page Not Found" redirect whenever a page is not found or something fails.

## API's 📶
### Testing 🔨
- API Test | https://api.fastlanelawn.com/api/test/
- Auth API Test | https://api.fastlanelawn.com/api/auth/test/
- Payments API Test | https://api.fastlanelawn.com/api/payments/test/
- Stripe API Test | https://api.fastlanelawn.com/api/payments/stripe/test/
- PayPal API Test | https://api.fastlanelawn.com/api/payments/paypal/test/
- Bookings API Test | https://api.fastlanelawn.com/api/bookings/test/
### Auth 🧑
- Get Account Details | https://api.fastlanelawn.com/api/auth/me/
### Data ✨
- Analytics | https://api.fastlanelawn.com/api/analytics/
### Bookings 📚
- Get All Bookings | https://api.fastlanelawn.com/api/bookings/
- Get Your Bookings | https://api.fastlanelawn.com/api/bookings/mine/
- Get Occupied Time Slots | https://api.fastlanelawn.com/api/bookings/occupied-slots/
### Quotes 🤝
- Get All Quotes | https://api.fastlanelawn.com/api/quotes/
- Get Your Quotes | https://api.fastlanelawn.com/api/quotes/mine/
### Invoices 💹
- Get All Invoices | https://api.fastlanelawn.com/api/invoices/
- Get Your Invoices | https://api.fastlanelawn.com/api/invoices/mine/
### Staff 👑
- Get All Staff | https://api.fastlanelawn.com/api/staff/
- Get Your Staff Details | https://api.fastlanelawn.com/api/staff/me/
- Get Clock Status | https://api.fastlanelawn.com/api/staff/clock-status/
- Get Time Logs | https://api.fastlanelawn.com/api/staff/time-logs/
- Get Current Clocked In Staff | https://api.fastlanelawn.com/api/staff/clocked-in/