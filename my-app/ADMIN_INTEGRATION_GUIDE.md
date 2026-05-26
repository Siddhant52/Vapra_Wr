# Admin Integration Guide - Booking Status Tracker

## Quick Start for Admins

### Step 1: Import the Component

In your admin page or component where you display booking requests:

```javascript
// app/(main)/admin/page.jsx
import BookingRequestStatusManager from "@/components/booking-request-status-manager";
import { getServiceRequests } from "@/actions/bookingRequest";

export default async function AdminBookingPage() {
  const { requests } = await getServiceRequests();
  
  return (
    <div className="space-y-8">
      <h1>Booking Request Management</h1>
      
      {/* Add the status manager component */}
      <BookingRequestStatusManager requests={requests} />
    </div>
  );
}
```

### Step 2: Update Admin Components (If Using Existing)

If you have an existing admin component like `booking-requests.jsx`:

```javascript
// Before (mocked component)
export function ServiceRequests({ requests = [] }) {
  // ... mock implementation
}

// After (with live status manager)
import BookingRequestStatusManager from "@/components/booking-request-status-manager";

export function ServiceRequests({ requests = [] }) {
  return <BookingRequestStatusManager requests={requests} />;
}
```

## Available Admin Actions

### 1. Primary Status Progression
Click **"Move to [Next Status]"** button to advance to the next checkpoint:
- PENDING → REVIEWED
- REVIEWED → ASSIGNED
- ASSIGNED → COMPLETED
- COMPLETED → CLOSED

### 2. Quick Jump
Use shortcut buttons to skip multiple statuses at once:
- For PENDING: Can jump to ASSIGNED, COMPLETED, or CLOSED
- For REVIEWED: Can jump to COMPLETED or CLOSED
- For ASSIGNED: Can jump to CLOSED

### 3. View Request Details
Each request card displays:
- Service name
- Customer email
- Vehicle information
- Requested date/time
- Issue description
- Current status badge
- Preferred date preference

### 4. Track Updates
- Last update timestamp is visible in the status badge
- Loading indicators show during update
- Success/error toasts confirm actions

## Status Progression Examples

### Scenario 1: Normal Flow
```
Admin reviews new request
  ↓
Clicks "Move to Reviewed"
  ↓
Customer sees tracker update to "Under Review"
  ↓
Admin assigns mechanic
  ↓
Clicks "Move to Assigned"
  ↓
Customer sees "Mechanic Assigned" with live indicator
  ↓
Admin marks service complete
  ↓
Clicks "Move to Completed"
  ↓
Customer gets "Service Completed" confirmation
  ↓
Admin closes request
  ↓
Clicks "Move to Closed"
  ↓
Request finished - live tracker completes
```

### Scenario 2: Expedited Flow (Using Quick Jumps)
```
Admin reviews request
  ↓
Admin has mechanic immediately available
  ↓
Clicks "Assigned" button (skips REVIEWED)
  ↓
Request jumps to ASSIGNED status
  ↓
Process continues normally
```

## Data Structure

The component accepts a `requests` array with the following structure:

```javascript
{
  id: "uuid",                    // Request ID
  serviceName: "Oil Change",     // Service type
  vehicleInfo: "Honda Civic",    // Vehicle details
  issueDescription: "Regular maintenance", // Issue details
  email: "customer@example.com", // Customer email
  preferredDate: "2024-04-25",   // Preferred service date
  createdAt: "2024-04-24T09:00", // When request was created
  status: "PENDING",             // Current status
  updatedAt: "2024-04-24T09:00"  // Last update time
}
```

## API Response Handling

When you click status update buttons, the component:

1. **Sends PUT request** to `/api/booking-request/{requestId}/status/update`
2. **Payload:**
   ```json
   {
     "status": "REVIEWED"
   }
   ```
3. **Expected response:**
   ```json
   {
     "success": true,
     "request": {
       "id": "uuid",
       "status": "REVIEWED",
       "updatedAt": "2024-04-24T10:30:00Z"
     }
   }
   ```
4. **Updates local state** immediately
5. **Shows toast notification** (success or error)

## Permissions & Security

✅ **Built-in security checks:**
- Only ADMIN role can update status
- Authentication required
- Database admin verification
- Invalid status values rejected

⚠️ **Ensure in your database:**
```sql
-- Verify admin user exists
SELECT id, email, role FROM "User" WHERE role = 'ADMIN';

-- Grant admin role to user
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

## Styling & Customization

### Status Colors
Modify `getStatusColor()` in component to match your theme:

```javascript
const getStatusColor = (status) => {
  switch (status) {
    case "PENDING":
      return "bg-amber-900/40 border-amber-500/60 text-amber-200";
    case "REVIEWED":
      return "bg-sky-900/40 border-sky-500/60 text-sky-200";
    case "ASSIGNED":
      return "bg-emerald-900/40 border-emerald-500/60 text-emerald-200";
    case "COMPLETED":
      return "bg-green-900/40 border-green-500/60 text-green-200";
    case "CLOSED":
      return "bg-slate-900/60 border-slate-600/70 text-slate-300";
    default:
      return "bg-muted/30 border-muted/40 text-muted-foreground";
  }
};
```

### Button Styles
Edit button classes in the JSX:

```javascript
<Button
  onClick={() => updateStatus(request.id, nextStatus)}
  // Change these classes to customize
  className="flex-1 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-100 border border-emerald-600/40"
  size="sm"
>
  Move to {getStatusLabel(nextStatus)}
</Button>
```

## Error Handling

The component handles these errors gracefully:

| Error | Cause | Resolution |
|-------|-------|-----------|
| "Forbidden - Admin access required" | User is not admin | Assign ADMIN role to user |
| "Booking request not found" | Invalid request ID | Ensure request exists |
| "Invalid status" | Invalid status value | Use only: PENDING, REVIEWED, ASSIGNED, COMPLETED, CLOSED |
| "Internal server error" | Server error | Check server logs |

## Performance Considerations

✅ **Optimized for:**
- Single page load of 50+ requests
- Instant status updates (no page refresh)
- Minimal bundle size increase
- Efficient API calls

## Testing in Admin Panel

### Manual Testing Checklist

```
□ View all booking requests
□ Click "Move to [Next Status]" button
□ Verify loading indicator shows
□ Verify toast notification appears
□ Open customer appointments page in another tab
□ Confirm status updates in real-time (within 5 seconds)
□ Try quick jump buttons
□ Test with closed request (should disable buttons)
□ Verify error handling with invalid status
```

### Automated Testing (Jest Example)

```javascript
// __tests__/booking-request-status-manager.test.js
import { render, screen, fireEvent } from "@testing-library/react";
import BookingRequestStatusManager from "@/components/booking-request-status-manager";

describe("BookingRequestStatusManager", () => {
  const mockRequest = {
    id: "test-id",
    serviceName: "Oil Change",
    status: "PENDING",
    vehicleInfo: "Honda",
    email: "test@example.com",
    createdAt: new Date(),
  };

  it("renders status buttons for PENDING request", () => {
    render(<BookingRequestStatusManager requests={[mockRequest]} />);
    expect(screen.getByText(/Move to Reviewed/i)).toBeInTheDocument();
  });

  it("calls API on status update", async () => {
    const { getByText } = render(
      <BookingRequestStatusManager requests={[mockRequest]} />
    );
    fireEvent.click(getByText(/Move to Reviewed/i));
    // Assert API call was made
  });
});
```

## Integrating with Existing Admin Dashboard

If you have an admin dashboard, add this section:

```javascript
// app/(main)/admin/page.jsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import BookingRequestStatusManager from "@/components/booking-request-status-manager";
import { getServiceRequests } from "@/actions/bookingRequest";

export default async function AdminDashboard() {
  const { requests } = await getServiceRequests();
  
  const pendingRequests = requests.filter(r => r.status === "PENDING");
  const assignedRequests = requests.filter(r => r.status === "ASSIGNED");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{pendingRequests.length}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{assignedRequests.length}</div>
            <p className="text-sm text-muted-foreground">Assigned</p>
          </CardContent>
        </Card>
        {/* Add more stats */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Booking Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingRequestStatusManager requests={requests} />
        </CardContent>
      </Card>
    </div>
  );
}
```

## Troubleshooting

### Issue: Buttons don't work
```
1. Check browser console for errors
2. Verify admin role in database
3. Check network tab for API failures
4. Ensure API endpoint exists at: /api/booking-request/[requestId]/status/update
```

### Issue: Status doesn't update on customer side
```
1. Wait 5 seconds for polling to trigger
2. Refresh customer's browser
3. Check that polling interval is running (DevTools > Network tab)
4. Verify status in database: SELECT * FROM "BookingRequest" WHERE id = 'xxx';
```

### Issue: Toasts not showing
```
1. Ensure Sonner toast provider is in root layout
2. Check that sonner is installed: npm list sonner
3. Verify no toast styling conflicts
```
