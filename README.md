# DevEvent - Event Booking Platform

A production-ready event booking platform built with Next.js 16, TypeScript, MongoDB, and Razorpay for secure payments.

## 🎯 Features

### Core Functionality
- **Event Management**: Create, edit, and delete events (organizers only)
- **Event Discovery**: Browse and filter events across the platform
- **Booking System**: 
  - Free events: Simple email-based booking
  - Paid events: Razorpay payment integration
- **Payment Processing**: Secure Razorpay integration with signature verification
- **User Profiles**: View personal bookings and history
- **Admin Dashboard**: Global admin view of all bookings and revenue

### Security & Authorization
- **Authentication**: NextAuth with email-based login
- **Event Ownership**: Only event creators can edit/delete their events
- **Admin Access**: ADMIN_EMAIL environment variable for global admin
- **Server-Side Validation**: All business logic validated on backend
- **Payment Verification**: Signature verification on every transaction

### Architecture
- **Full-Stack TypeScript**: Type-safe across all layers
- **Server Components**: Leverages Next.js App Router for performance
- **Server Actions**: Backend logic encapsulated in reusable functions
- **Database**: MongoDB with Mongoose for schema validation
- **File Upload**: Cloudinary integration for event images

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Razorpay account (sandbox or production)
- Cloudinary account
- Gmail account (for email verification)

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd dev-events
npm install
```

2. **Setup Environment Variables**
```bash
cp .env.example .env.local
```

Fill in `.env.local` with your credentials:
```env
# Database
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/dev-events

# NextAuth
NEXTAUTH_SECRET=openssl rand -base64 32  # Generate a random secret
NEXTAUTH_URL=http://localhost:3000

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_SECRET=xxxxxxxxxxxx

# Admin Email
ADMIN_EMAIL=your-admin@email.com

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. **Run Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 🔑 Key Routes

### Public Routes
- `/` - Homepage
- `/events/[slug]` - Event details
- `/auth/signin` - Sign in
- `/auth/signup` - Sign up

### Authenticated User Routes
- `/create-event` - Create new event
- `/my-bookings` - View personal bookings
- `/checkout/[eventId]` - Payment checkout
- `/booking-success/[bookingId]` - Post-payment confirmation

### Organizer Routes
- `/organizer/events` - Dashboard (view/edit/delete own events)
- `/organizer/events/[eventId]/edit` - Edit event

### Admin Routes
- `/admin/bookings` - View all bookings + revenue stats

---

## 💳 Payment Flow (Razorpay)

1. **User books paid event**
   - Authenticates
   - Views event details

2. **Redirects to checkout**
   - `/checkout/[eventId]`
   - Displays event summary and total price
   - Server-side auth verification

3. **Payment initiation**
   - POST `/api/payments/create-order`
   - Backend creates booking with `paymentStatus = "pending"`
   - Razorpay order created

4. **Razorpay Checkout**
   - User enters payment details
   - Razorpay processes transaction

5. **Payment verification**
   - POST `/api/payments/verify`
   - Backend verifies signature (CRITICAL)
   - Updates booking to `paymentStatus = "paid"`

6. **Success page**
   - Redirects to `/booking-success/[bookingId]`
   - Displays booking confirmation and receipt

### Security Notes
- ✅ Signature verified on backend only
- ✅ No frontend "success = paid" logic
- ✅ Amount validated against event price
- ✅ Duplicate booking prevention
- ✅ Booking stays pending until verification passes

---

## 🔐 Authorization Rules

| Action | Requirement |
|--------|-------------|
| Create Event | Authenticated user |
| Edit Event | Event organizer ONLY |
| Delete Event | Event organizer ONLY |
| View All Bookings | Global admin ONLY |
| Book Event | Authenticated user |
| View Personal Bookings | Authenticated user |
| Access Organizer Dashboard | Must be organizer of ≥1 event |
| Access Admin Dashboard | ADMIN_EMAIL match |

---

## 🗄️ Database Schema

### User
```typescript
{
  name: string
  email: string (unique)
  password: string (hashed)
  createdAt: Date
  updatedAt: Date
}
```

### Event
```typescript
{
  title: string
  slug: string (unique, auto-generated)
  description: string
  overview: string
  image: string (Cloudinary URL)
  venue: string
  location: string
  date: string (ISO format: YYYY-MM-DD)
  time: string (HH:mm format)
  mode: enum ["online", "offline", "hybrid"]
  audience: string
  agenda: string[]
  organizer: string
  organizerId: ObjectId (ref User) ← KEY FIELD
  tags: string[]
  price: number (₹)
  createdAt: Date
  updatedAt: Date
}
```

### Booking
```typescript
{
  eventId: ObjectId (ref Event)
  userId: ObjectId (ref User) [optional]
  email: string
  amount: number (₹)
  paymentStatus: enum ["pending", "paid", "failed"]
  razorpayOrderId: string
  razorpayPaymentId: string
  createdAt: Date
  updatedAt: Date
}
```

Indexes:
- `{ eventId: 1, email: 1 }` (unique) - Prevent duplicate bookings
- `{ organizerId: 1 }` - Fast event lookup by organizer
- `{ paymentStatus: 1 }` - Filter bookings by status

---

## 🛠️ Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint
```

---

## �� Environment Setup Checklist

- [ ] MongoDB Atlas cluster created
- [ ] `DATABASE_URL` set in `.env.local`
- [ ] Razorpay account created (sandbox for testing)
- [ ] `RAZORPAY_KEY_ID` and `RAZORPAY_SECRET` added
- [ ] Cloudinary account setup
- [ ] Cloudinary credentials added
- [ ] NextAuth secret generated and set
- [ ] `ADMIN_EMAIL` set (your email for global admin)
- [ ] Email provider configured (if sending confirmations)

---

## 🧪 Testing the Payment Flow

### In Sandbox Mode
1. Go to event details (paid event)
2. Click "Book Now"
3. Sign in if needed
4. Review booking on checkout page
5. Click "Proceed to Payment"
6. Razorpay opens - use test card:
   - **Card**: 4111 1111 1111 1111
   - **Expiry**: 12/25
   - **CVV**: 123
7. Complete payment
8. Redirected to success page with booking details

### Test Cases
- ✅ Free event booking (no payment)
- ✅ Paid event checkout flow
- ✅ Payment failure handling
- ✅ Duplicate booking prevention
- ✅ Auth required for booking
- ✅ Edit event (organizer only)
- ✅ Admin bookings dashboard

---

## 🚀 Production Deployment

### Pre-Deployment Checklist
- [ ] Switch Razorpay to production keys
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Generate secure `NEXTAUTH_SECRET`
- [ ] Enable HTTPS
- [ ] Set admin email
- [ ] Test full payment flow
- [ ] Enable database backups
- [ ] Configure error logging
- [ ] Set up monitoring alerts

### Deploy to Vercel
```bash
# Connect GitHub repo to Vercel
# Set environment variables in Vercel dashboard
# Automatic deploys on push to main
```

---

## 🐛 Troubleshooting

### Payment shows pending forever
- Check Razorpay signature verification logic
- Verify webhook configuration
- Check database connection

### Can't create event
- Ensure user is authenticated
- Check MongoDB connection
- Verify Cloudinary credentials

### Can't edit own event
- Verify `organizerId` matches session user
- Check database for event ownership

### Admin dashboard empty
- Verify `ADMIN_EMAIL` matches your email
- Check browser console for auth errors
- Clear cookies and re-login

---

## 📞 Support

For issues or questions:
1. Check `.env.example` for required variables
2. Review error logs in console
3. Verify database connectivity
4. Test Razorpay credentials

---

## 📄 License

MIT License - Feel free to use this project as a template.

---

**Built with ❤️ for developers, by developers.**
