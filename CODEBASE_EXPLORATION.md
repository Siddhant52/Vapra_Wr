# Vapra Workshop - Codebase Exploration Report
**Generated:** May 4, 2026

---

## 1. PAGES IN APP/(MAIN)/ - Main Application Pages

### About Page
- **File:** `app/(main)/about/page.jsx`
- **Type:** Client Component ("use client")
- **Purpose:** Displays company history, mission, and values for Vapra Workshop
- **Renders:** 
  - PageHeader with workshop info
  - About story section with founding details
  - Service offerings and testimonials
- **Components Used:** PageHeader, Card, CardContent, CardHeader, CardTitle, Button
- **Booking Status Integration:** ❌ None

### Admin Dashboard Page
- **File:** `app/(main)/admin/page.jsx`
- **Type:** Server Component (async)
- **Purpose:** Main admin dashboard showing mechanics, service requests, and payouts
- **Renders:**
  - Tabs interface for different admin sections
  - Mechanics list with verification status
  - Service requests manager (30 most recent)
  - Payout management (processing status)
  - Attendance tracking (if enabled)
- **Components Used:** Tabs, TabsContent, TabsList, TabsTrigger, ManageMechanics, ServiceRequestsManager, AttendanceManager, Badge
- **Data Fetching:** Queries db.user (mechanics), db.bookingRequest, db.payout
- **Booking Status Integration:** ✅ **YES** - Displays and manages service requests with status tracking

### Admin Manage Page
- **File:** `app/(main)/admin/manage/page.jsx`
- **Type:** Server Component (async)
- **Purpose:** Dedicated admin management panel for mechanics and service requests
- **Renders:**
  - Navigation tabs (Dashboard, Manage)
  - ManageMechanics component
  - ServiceRequestsManager component
  - Payout management
- **Components Used:** ManageMechanics, ServiceRequestsManager, Badge, Link
- **Booking Status Integration:** ✅ **YES** - Manages booking request statuses

### Contact Support Page
- **File:** `app/(main)/contact-support/page.jsx`
- **Type:** Client Component ("use client")
- **Purpose:** Contact form with speech-to-text support for customer inquiries
- **Renders:**
  - Contact form with name, email, subject, message
  - Speech recognition input for message field
  - Submit functionality
- **Components Used:** Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Textarea, Label
- **Features:** Web Speech API integration for voice input
- **Booking Status Integration:** ❌ None

### Pricing Page
- **File:** `app/(main)/pricing/page.jsx`
- **Type:** Client Component ("use client")
- **Purpose:** Display service packages and pricing options
- **Renders:**
  - Three pricing tiers (Basic, Standard, Premium)
  - Feature lists per package
  - Call-to-action buttons
- **Components Used:** Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, PageHeader, Check icon
- **Pricing Details:**
  - Basic: ₹999 (99900 paisa)
  - Standard: ₹1,999 (199,900 paisa) - Most popular
  - Premium: ₹4,999 (499,900 paisa)
- **Booking Status Integration:** ❌ None

---

## 2. PAGES IN APP/(AUTH)/ - Authentication Pages

### Auth Layout
- **File:** `app/(auth)/layout.jsx`
- **Type:** Server Component
- **Purpose:** Wrapper layout for authentication pages
- **Renders:** Centered container for child components
- **Styling:** Flex centered, padding-top

### Sign In Page
- **File:** `app/(auth)/sign-in/[[...sign-in]]/page.jsx`
- **Type:** Server Component
- **Purpose:** Clerk authentication sign-in page
- **Renders:** Clerk SignIn component
- **Components Used:** Clerk's <SignIn />

### Sign Up Page
- **File:** `app/(auth)/sign-up/[[...sign-up]]/page.jsx`
- **Type:** Server Component
- **Purpose:** Clerk authentication sign-up page
- **Renders:** Clerk SignUp component
- **Components Used:** Clerk's <SignUp />

---

## 3. ROOT APP PAGES - Core Application Pages

### Home Page
- **File:** `app/page.jsx`
- **Type:** Server Component (async)
- **Purpose:** Landing page with features, testimonials, and CTAs
- **Renders:**
  - Hero section with slider banner
  - Features grid
  - Service plans section
  - Testimonials section
  - Credit benefits information
- **Components Used:** Badge, Button, Card, CardAction, CardContent, CardHeader, CardTitle, CardDescription, Check icon, Wrench icon, TrackAppointmentButton, SliderBanner
- **Data Fetching:** Gets current user role for personalized CTAs
- **Booking Status Integration:** ❌ None (but links to booking pages)

### Appointments Page
- **File:** `app/appointments/page.jsx`
- **Type:** Server Component (async)
- **Purpose:** Display customer's booking requests and appointments
- **Renders:**
  - PageHeader
  - MyAppointmentsList component with all booking requests
  - Status badges and details for each appointment
- **Components Used:** PageHeader, Card, CardContent, MyAppointmentsList
- **Data Fetching:** Queries bookingRequests for authenticated user
- **Booking Status Integration:** ✅ **CRITICAL INTEGRATION** - Core page for tracking bookings with full status visibility

### Booking Request Page
- **File:** `app/booking-request/page.jsx`
- **Type:** Server Component with Suspense
- **Purpose:** Form page for creating new booking requests
- **Renders:** BookingRequestContent component with Suspense fallback
- **Components Used:** BookingRequestContent (wrapped in Suspense)
- **Features:** Service selection, vehicle info, issue description, preferred date/time
- **Booking Status Integration:** ❌ Creates bookings (not tracking status)

### Booking Status Page
- **File:** `app/booking-status/page.jsx`
- **Type:** Server Component (async)
- **Purpose:** Dedicated page for tracking booking request status
- **Renders:** CustomerBookingStatusClient with auth context and search params
- **Components Used:** CustomerBookingStatusClient
- **Features:** 
  - Guest tracking via access code
  - Signed-in user booking history
  - Real-time status updates
- **Booking Status Integration:** ✅ **CRITICAL INTEGRATION** - Main tracking interface for customers

### Onboarding Page
- **File:** `app/onboarding/page.jsx`
- **Type:** Client Component ("use client")
- **Purpose:** User role selection after first sign-up
- **Renders:**
  - Role selection cards (Customer vs Mechanic)
  - Auto-redirect logic based on user role
- **Components Used:** Card, CardContent, CardDescription, CardTitle, Button, User icon, Shield icon, Loader2 icon
- **Server Actions:** setUserRole, autoSetUserRole
- **Booking Status Integration:** ❌ None

### Mechanics Page
- **File:** `app/mechanics/page.jsx`
- **Type:** Server Component (async)
- **Purpose:** Browse mechanics by service specialty
- **Renders:**
  - Grid of specialty cards (from SPECIALTIES constant)
  - Links to specialty detail pages (/mechanics/[service])
- **Components Used:** Link, Card, CardContent, PageHeader
- **Booking Status Integration:** ❌ None

### Services Page
- **File:** `app/services/page.jsx`
- **Type:** Server Component
- **Purpose:** Redirect page (redirects to /mechanics)
- **Renders:** None (redirect only)
- **Booking Status Integration:** ❌ None

### Mechanics Service Detail Page
- **File:** `app/mechanics/[service]/page.jsx`
- **Type:** Dynamic route (details not fully explored)
- **Purpose:** Display mechanics in specific service category
- **Booking Status Integration:** Likely ❌ None

---

## 4. API ROUTES - Backend Endpoints

### Booking Status API
- **Route:** `GET /api/booking-status`
- **File:** `app/api/booking-status/route.js`
- **HTTP Methods:** GET
- **Purpose:** Fetch booking requests for tracking
- **Authentication:** Optional (Clerk auth or guest access code)
- **Query Parameters:**
  - `accessCode` (string): Guest tracking code (format: VAP-{uuid} or raw uuid)
- **Response:** 
  ```json
  {
    "requests": [
      {
        "id": "uuid",
        "serviceName": "string",
        "vehicleInfo": "string",
        "issueDescription": "string",
        "preferredDate": "ISO date",
        "preferredTimeSlot": "string",
        "status": "PENDING|REVIEWED|ASSIGNED|COMPLETED|CLOSED",
        "createdAt": "ISO date",
        "customerName": "string",
        "phone": "string"
      }
    ]
  }
  ```
- **Booking Status Integration:** ✅ **CRITICAL** - Core API for status tracking

### Booking Request Status GET API
- **Route:** `GET /api/booking-request/[requestId]/status`
- **File:** `app/api/booking-request/[requestId]/status/route.js`
- **HTTP Methods:** GET
- **Purpose:** Fetch live status of a specific booking request
- **Authentication:** Required (Clerk auth)
- **Params:** `requestId` (UUID)
- **Response:**
  ```json
  {
    "id": "uuid",
    "status": "PENDING|REVIEWED|ASSIGNED|COMPLETED|CLOSED"
  }
  ```
- **Booking Status Integration:** ✅ **CRITICAL** - Used by polling tracker

### Booking Request Status UPDATE API
- **Route:** `PUT /api/booking-request/[requestId]/status/update`
- **File:** `app/api/booking-request/[requestId]/status/update/route.js`
- **HTTP Methods:** PUT
- **Purpose:** Update booking request status (admin only)
- **Authentication:** Required (Clerk auth + ADMIN role)
- **Params:** `requestId` (UUID)
- **Request Body:**
  ```json
  {
    "status": "PENDING|REVIEWED|ASSIGNED|COMPLETED|CLOSED"
  }
  ```
- **Side Effects:**
  - Updates database status
  - Sends SMS notifications based on status transition
  - SMS Templates: smsBookingReviewed, smsBookingAssigned, smsBookingClosed, smsBookingCancelled
- **Booking Status Integration:** ✅ **CRITICAL** - Admin status management

### Track Appointment API
- **Route:** `POST /api/track-appointment`
- **File:** `app/api/track-appointment/route.js`
- **HTTP Methods:** POST
- **Purpose:** Analytics tracking for appointment booking clicks
- **Authentication:** Optional (Clerk auth)
- **Request Body:**
  ```json
  {
    "source": "string",
    "href": "string",
    "timestamp": "ISO date"
  }
  ```
- **Response:**
  ```json
  { "success": true }
  ```
- **Booking Status Integration:** ⚠️ Analytics only (not status tracking)

### Checkout/Payment API
- **Route:** `POST /api/checkout`
- **File:** `app/api/checkout/route.js`
- **HTTP Methods:** POST
- **Purpose:** Create Razorpay payment orders
- **Authentication:** Required (Clerk auth)
- **Request Body:**
  ```json
  {
    "planId": "basic|standard|premium"
  }
  ```
- **Response:**
  ```json
  {
    "orderId": "string",
    "amount": "number (in paisa)",
    "currency": "INR",
    "planName": "string",
    "key": "string (Razorpay key)"
  }
  ```
- **Plans & Credits:**
  - Basic: ₹999 → 10 credits
  - Standard: ₹1,999 → 25 credits
  - Premium: ₹4,999 → 60 credits
- **Booking Status Integration:** ❌ Payment processing (not status tracking)

### Checkout Webhook API
- **Route:** `POST /api/checkout/webhook`
- **File:** `app/api/checkout/webhook/route.js`
- **HTTP Methods:** POST
- **Purpose:** Handle Razorpay payment webhook for credit allocation
- **Authentication:** Webhook signature verification
- **Events Handled:** `payment.captured`
- **Side Effects:** Updates user credits on successful payment
- **Booking Status Integration:** ❌ Payment confirmation (not status tracking)

### Admin Attendance API
- **Route:** `GET /api/admin/attendance`
- **File:** `app/api/admin/attendance/route.js`
- **HTTP Methods:** GET
- **Purpose:** Fetch mechanic attendance records
- **Authentication:** Required (Admin role)
- **Booking Status Integration:** ❌ Attendance tracking (not booking status)

### Admin Export Attendance API
- **Route:** `GET /api/admin/export-attendance`
- **File:** `app/api/admin/export-attendance/route.js`
- **HTTP Methods:** GET
- **Purpose:** Export attendance records as Excel file
- **Authentication:** Required (Admin role)
- **Query Parameters:** Range selection (lastweek, lastmonth, last2months, last3months, custom)
- **Response:** Excel file (XLSX format)
- **Booking Status Integration:** ❌ Attendance export (not booking status)

### Admin Export Service Requests API
- **Route:** `GET /api/admin/export-service-requests`
- **File:** `app/api/admin/export-service-requests/route.js`
- **HTTP Methods:** GET
- **Purpose:** Export booking requests as CSV file
- **Authentication:** Required (Admin role)
- **Response:** CSV file with booking request data
- **Fields Exported:** Request ID, Customer ID, Service Name, Vehicle Info, Issue, Preferred Date, Preferred Time, Phone, Email, Status, Created At, Updated At
- **Booking Status Integration:** ⚠️ Includes status field in export, but primarily for data export

---

## 5. COMPONENTS - Reusable React Components

### Core Booking Status Components

#### BookingStatusTracker
- **File:** `components/booking-status-tracker.jsx`
- **Type:** Client Component ("use client")
- **Props:**
  - `requestId` (string): UUID of booking request
  - `initialStatus` (string): Starting status from parent
- **Purpose:** Supply-chain style live status tracker with 5 checkpoints
- **Features:**
  - Real-time polling every 5 seconds
  - Visual checkpoint progression
  - Status states: completed, current, pending
  - Icon animations (CheckCircle2, Clock, Circle)
  - Color coding (emerald, amber, slate)
- **Workflow Checkpoints:**
  1. PENDING - "Booking Submitted"
  2. REVIEWED - "Under Review"
  3. ASSIGNED - "Mechanic Assigned"
  4. COMPLETED - "Service Completed"
  5. CLOSED - "Request Closed"
- **Booking Status Integration:** ✅ **CRITICAL** - Main visual tracker component

#### BookingRequestStatusManager
- **File:** `components/booking-request-status-manager.jsx`
- **Type:** Client Component ("use client")
- **Props:**
  - `requests` (array): Initial booking requests
- **Purpose:** Admin interface for managing booking request statuses
- **Features:**
  - Status transition buttons (PENDING → REVIEWED → ASSIGNED → COMPLETED → CLOSED)
  - Color-coded status badges
  - Real-time state updates
  - Toast notifications on status change
  - Loading indicators during update
- **API Integration:** PUT `/api/booking-request/[requestId]/status/update`
- **Booking Status Integration:** ✅ **CRITICAL** - Admin status management interface

#### MyAppointmentsList
- **File:** `components/my-appointments-list.jsx`
- **Type:** Client Component ("use client")
- **Props:**
  - `initialRequests` (array): Customer's booking requests
  - `highlightId` (string): ID of newly created booking to highlight
- **Purpose:** Display customer's appointments with status tracking
- **Features:**
  - Lists all customer bookings
  - Status badges with descriptions
  - Embeds BookingStatusTracker for each request
  - Cancel request functionality
  - Auto-scroll to newly created booking
  - Highlight ring animation for new bookings
  - Toast notifications
- **Booking Status Integration:** ✅ **CRITICAL** - Customer-facing appointment list with embedded tracker

#### TrackAppointmentButton
- **File:** `components/track-appointment-button.jsx`
- **Type:** Client Component ("use client")
- **Props:**
  - `href` (string): Navigation link
  - `children` (React.ReactNode): Button text
  - `source` (string): Analytics tracking source (default: "home-hero-primary")
- **Purpose:** Button component with analytics tracking
- **Features:**
  - Tracks appointment booking click events
  - Uses navigator.sendBeacon for reliable delivery
  - Fallback to fetch API
  - Non-blocking tracking (errors don't prevent navigation)
- **Booking Status Integration:** ⚠️ Analytics tracking only

### Layout & Navigation Components

#### Header
- **File:** `components/header.jsx`
- **Type:** Client Component ("use client")
- **Purpose:** Main navigation header for the application
- **Features:**
  - Logo and branding
  - Desktop navigation menu with links
  - Mobile hamburger menu
  - Auth integration via HeaderAuth component
  - Navigation links: Home, About, Pricing, Mechanics, Services, Support
- **Components Used:** HeaderAuth, Button, Menu icon, X icon
- **Booking Status Integration:** ❌ Navigation only

#### HeaderAuth
- **File:** `components/header-auth.jsx`
- **Type:** Client Component ("use client")
- **Purpose:** Authentication UI in header
- **Features:**
  - Clerk SignIn/SignOut buttons
  - User profile button (UserButton)
  - Admin dashboard link (for allowlisted emails)
  - Responsive sizing
- **Components Used:** Clerk's SignedIn, SignedOut, SignInButton, UserButton
- **Booking Status Integration:** ❌ Auth UI only

#### PageHeader
- **File:** `components/page-header.jsx`
- **Type:** Server Component
- **Props:**
  - `icon` (React.ReactNode): Optional icon
  - `title` (string): Page title
  - `description` (string): Optional description
  - `backLink` (string): Back navigation URL (default: "/")
  - `backLabel` (string): Back button text (default: "Back to Home")
- **Purpose:** Reusable page header with back button
- **Booking Status Integration:** ❌ Layout component (used across pages)

#### SliderBanner
- **File:** `components/slider-banner.jsx`
- **Type:** Client Component ("use client")
- **Props:**
  - `images` (string[]): Array of image filenames
  - `interval` (number): Transition interval in ms (default: 3500)
  - `alt` (string): Alt text for images
- **Purpose:** Rotating image carousel/slider
- **Booking Status Integration:** ❌ UI component (used on home page)

#### ThemeProvider
- **File:** `components/theme-provider.jsx`
- **Type:** Client Component ("use client")
- **Purpose:** Next-themes integration for dark/light mode
- **Booking Status Integration:** ❌ Theme utility

### UI Components (in `components/ui/`)
- **alert.jsx** - Alert box component
- **badge.jsx** - Badge/label component
- **button.jsx** - Button component
- **card.jsx** - Card container component
- **dialog.jsx** - Modal dialog component
- **input.jsx** - Text input component
- **label.jsx** - Form label component
- **select.jsx** - Select dropdown component
- **separator.jsx** - Visual separator/divider
- **sonner.jsx** - Toast notification component
- **tabs.jsx** - Tab interface component
- **textarea.jsx** - Text area component

### Page-Specific Components

#### BookingRequestContent
- **File:** `app/booking-request/booking-request-content.jsx`
- **Type:** Client Component ("use client")
- **Purpose:** Form for creating new booking requests
- **Features:**
  - Service selection from route params
  - Common vehicle list with "Other" option
  - Vehicle info, issue description input
  - Date and time slot selection
  - Voice recording for issue description (Speech API)
  - Form validation
  - API submission
- **Booking Status Integration:** ❌ Creates bookings (status starts at PENDING)

#### CustomerBookingStatusClient
- **File:** `app/booking-status/status-client.jsx`
- **Type:** Client Component ("use client")
- **Purpose:** Main client interface for tracking booking status
- **Features:**
  - Guest tracking via access code (VAP-format or raw UUID)
  - Signed-in user booking history
  - Real-time fetch with loader states
  - Status meta information (color coding, labels)
  - Embeds BookingStatusTracker for each request
  - LocalStorage for guest tracking code persistence
  - Auto-scroll to highlighted/new request
- **API Integration:** GET `/api/booking-status`
- **Booking Status Integration:** ✅ **CRITICAL** - Main customer tracking interface

#### Admin Components
- **ManageMechanics** (`app/(main)/admin/components/manage-mechanics.jsx`)
  - Create, verify, and manage mechanics
  - Form for mechanic details (name, phone, aadhar, specialty, experience)
  - Verification status management
  - Delete mechanic functionality

- **ServiceRequestsManager** (`app/(main)/admin/components/service-requests-manager.jsx`)
  - Display service requests
  - Status update via dropdown
  - Uses updateServiceRequestStatus action

- **AttendanceManager** (`app/(main)/admin/components/attendance-manager.jsx`)
  - Mechanic attendance tracking

- **Other Admin Components:**
  - appointments.jsx
  - booking-requests.jsx
  - verified-mechanics.jsx
  - pending-mechanics.jsx
  - pending-payouts.jsx

---

## 6. BOOKING STATUS TRACKING INTEGRATION VERIFICATION

### ✅ FULLY INTEGRATED - Core Booking Status Features

| Feature | Status | Pages/Components | Evidence |
|---------|--------|-----------------|----------|
| **Status Enum** | ✅ YES | Prisma Schema | PENDING → REVIEWED → ASSIGNED → COMPLETED → CLOSED |
| **Status Tracker Component** | ✅ YES | BookingStatusTracker | Real-time polling, 5-checkpoint visualization |
| **Admin Status Manager** | ✅ YES | BookingRequestStatusManager | PUT API for status updates, SMS notifications |
| **Customer Status Display** | ✅ YES | MyAppointmentsList, BookingStatusTracker | Embedded in appointments page |
| **Guest Tracking** | ✅ YES | CustomerBookingStatusClient | Access code (VAP-format), localStorage persistence |
| **Status GET API** | ✅ YES | `/api/booking-status` | Supports auth + guest modes |
| **Status Update API** | ✅ YES | `/api/booking-request/[requestId]/status/update` | Admin-only, SMS notifications, auth checks |
| **Status GET Detail API** | ✅ YES | `/api/booking-request/[requestId]/status` | Live polling support |
| **SMS Notifications** | ✅ YES | Status update API | Triggers on: REVIEWED, ASSIGNED, CLOSED, CANCELLED |
| **Real-time Polling** | ✅ YES | BookingStatusTracker | 5-second interval updates |
| **Post-Booking Redirect** | ✅ YES | BookingRequest action | Redirect to /appointments?newBooking={id} |
| **Highlight New Booking** | ✅ YES | MyAppointmentsList | Ring animation + auto-scroll |
| **Status Color Coding** | ✅ YES | All tracker components | Emerald, Amber, Sky, Green, Slate |

### ✅ CORRECTLY IMPLEMENTED - Integration Points

#### Booking Request Form → Status Tracker Flow
1. **Create Request** (`app/booking-request/page.jsx`)
   - User fills form with service, vehicle, issue details
   - POST to `/api/booking-request` (action: createBookingRequest)
   - Status initialized to **PENDING**

2. **Redirect to Appointments**
   - Server redirects to `/appointments?newBooking={id}`
   - MyAppointmentsList receives `highlightId`
   - Auto-scrolls and highlights newly created booking

3. **Real-time Status Display**
   - BookingStatusTracker embeds in each appointment card
   - Polls `/api/booking-request/[requestId]/status` every 5 seconds
   - Updates visual checkpoint based on response

4. **Admin Status Management**
   - Admin visits `/admin` dashboard
   - Sees BookingRequestStatusManager with all requests
   - Updates status via PUT `/api/booking-request/[requestId]/status/update`
   - Triggers SMS to customer
   - Status updates propagate to customer via polling

#### Guest Tracking Flow
1. **After Booking (Guest)** 
   - Customer receives VAP-{uuid} access code
   - Stored in browser localStorage
   - SMS sent with tracking code

2. **Access /booking-status (Guest)**
   - Enter VAP-{uuid} code in input field
   - GET `/api/booking-status?accessCode={uuid}`
   - Displays booking request with BookingStatusTracker
   - Can track without authentication

#### Signed-in Customer Flow
1. **Access /appointments**
   - Authenticated user sees all their bookings
   - Each with BookingStatusTracker embedded
   - Real-time status updates via polling

2. **Access /booking-status**
   - Signed-in users see all bookings without code entry
   - GET `/api/booking-status` (no accessCode param)
   - Full booking history available

### ⚠️ POTENTIAL IMPROVEMENTS

| Item | Current Status | Recommendation |
|------|-----------------|-----------------|
| **Polling Interval** | 5 seconds | Consider increasing to 10-30s to reduce server load |
| **WebSocket** | Not implemented | Real-time updates could use WebSocket instead of polling |
| **Status History** | Not tracked | Consider logging all status transitions |
| **Customer Notifications** | SMS only | Consider email/push notifications |
| **Status Cancellation** | Possible via API | CANCELLED not fully integrated in UI |
| **Estimated Completion** | Not implemented | Could show ETA based on service type |

### ❌ NOT INTEGRATED - Separate Features (Not Booking Status)

| Feature | Location | Purpose |
|---------|----------|---------|
| Mechanic Onboarding | `/onboarding` | Role selection, not status tracking |
| Pricing/Plans | `/pricing` | Service packages, not status tracking |
| Credit System | `/api/checkout` | Payment & credit allocation |
| Attendance Tracking | `/api/admin/attendance` | Mechanic shifts, not booking status |
| Contact Support | `/contact-support` | Customer inquiries, not booking status |

---

## 7. SUMMARY

### Total Page Count
- **App/(main)/** 4 pages (About, Admin, Admin Manage, Contact Support)
- **App/(auth)/** 2 pages (Sign In, Sign Up)
- **Root App/** 7 pages (Home, Appointments, Booking Request, Booking Status, Onboarding, Mechanics, Services)
- **Total: 13 pages**

### Total API Route Count
- **Booking Status APIs:** 3 routes (GET status list, GET status detail, PUT status update)
- **Checkout APIs:** 2 routes (POST payment order, webhook)
- **Track API:** 1 route (POST analytics)
- **Admin APIs:** 3 routes (GET attendance, GET export attendance, GET export service requests)
- **Total: 9 API routes**

### Component Count
- **Booking Status Core:** 4 components (Tracker, Manager, MyAppointmentsList, TrackAppointmentButton)
- **Layout:** 3 components (Header, HeaderAuth, PageHeader)
- **Utility:** 2 components (SliderBanner, ThemeProvider)
- **UI Components:** 12 components (all in ui/ folder)
- **Page Components:** 8+ components (admin, booking, etc.)
- **Total: 29+ components**

### Booking Status Tracking Coverage
✅ **Fully Integrated**
- ✅ Status creation on booking
- ✅ Real-time customer status tracking
- ✅ Admin status management
- ✅ Guest access via tracking code
- ✅ SMS notifications on status changes
- ✅ Visual status checkpoint display
- ✅ Post-booking redirect flow
- ✅ Database persistence

✅ **Pages with Booking Status Integration**
1. `/appointments` - MyAppointmentsList with BookingStatusTracker
2. `/booking-status` - CustomerBookingStatusClient with full tracker
3. `/admin` - BookingRequestStatusManager for admin updates
4. `/admin/manage` - Alternative admin interface

✅ **API Routes Supporting Booking Status**
1. `/api/booking-status` - GET (fetch requests)
2. `/api/booking-request/[requestId]/status` - GET (live polling)
3. `/api/booking-request/[requestId]/status/update` - PUT (admin updates)
4. `/api/checkout/webhook` - POST (payment to enable bookings)

