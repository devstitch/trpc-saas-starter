# tRPC SaaS Backend API Documentation

## Overview

Complete REST/tRPC API reference for the tRPC SaaS starter. All endpoints are available at `/api/trpc`.

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

**Authentication Methods:**

1. **JWT Token** - Obtained via `auth.register` or `auth.login` procedures. Used for web application authentication.
2. **API Key** - Obtained via `apiKeys.getApiKey` or `apiKeys.regenerateApiKey`. Used for programmatic API access (PRO/ENTERPRISE plans only).

**Note:** API keys are only available for users with PRO or ENTERPRISE subscription plans. Use the same `Authorization: Bearer <API_KEY>` header format for API key authentication.

---

## Auth Router

### auth.register

Register a new user account.

**Input:**

```typescript
{
  email: string; // Valid email address
  password: string; // Minimum 8 characters
  name: string; // Minimum 2 characters
}
```

**Response:**

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN";
  }
  token: string; // JWT token for future requests
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/api/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

---

### auth.login

Authenticate with email and password.

**Input:**

```typescript
{
  email: string;
  password: string;
}
```

**Response:**

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN";
  }
  token: string;
}
```

---

### auth.me

Get current authenticated user.

**Authentication:** Required

**Response:**

```typescript
{
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  createdAt: ISO8601;
}
```

---

### auth.logout

Invalidate all sessions for current user.

**Authentication:** Required

**Response:**

```typescript
{
  success: boolean;
}
```

---

## Organizations Router

### organizations.createOrganization

Create a new organization.

**Authentication:** Required

**Input:**

```typescript
{
  name: string;
  slug: string; // URL-friendly identifier (lowercase, hyphens)
  description?: string;
}
```

**Response:**

```typescript
{
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  members: Array<{
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    user: { id; email; name };
  }>;
}
```

---

### organizations.listUserOrganizations

Get all organizations the user is a member of.

**Authentication:** Required

**Response:**

```typescript
Array<{
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  members: Array<{ userId: string; role: string }>;
}>;
```

---

### organizations.getOrganization

Get organization details.

**Authentication:** Required  
**Permission:** Must be organization member

**Input:**

```typescript
{
  id: string;
}
```

---

### organizations.inviteUserToOrganization

Add user to organization.

**Authentication:** Required  
**Permission:** Owner or Admin role

**Input:**

```typescript
{
  organizationId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
}
```

---

## Projects Router

### projects.create

Create new project in organization.

**Authentication:** Required  
**Permission:** Organization member

**Input:**

```typescript
{
  organizationId: string;
  name: string;
  description?: string;
}
```

**Limits:**

- FREE: 5 projects
- PRO: 1,000 projects
- ENTERPRISE: 10,000 projects

---

### projects.list

List projects in organization.

**Authentication:** Required

**Input:**

```typescript
{
  organizationId: string;
  skip?: number; // Default: 0
  take?: number; // Default: 10
  status?: 'ACTIVE' | 'ARCHIVED';
}
```

**Response:**

```typescript
{
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    status: "ACTIVE" | "ARCHIVED";
    createdBy: { id; email; name };
    createdAt: ISO8601;
  }>;
  total: number;
  skip: number;
  take: number;
}
```

---

### projects.update

Update project details.

**Authentication:** Required

**Input:**

```typescript
{
  id: string;
  organizationId: string;
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}
```

---

### projects.delete

Archive project (soft delete).

**Authentication:** Required

**Input:**

```typescript
{
  id: string;
  organizationId: string;
}
```

---

## Subscriptions Router

### subscriptions.getSubscription

Get organization's subscription details.

**Authentication:** Required

**Input:**

```typescript
{
  organizationId: string;
}
```

**Response:**

```typescript
{
  id: string;
  organizationId: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  currentPeriodStart: ISO8601;
  currentPeriodEnd: ISO8601;
  details: {
    price: number;
    features: string[];
    projectLimit: number;
  };
}
```

---

### subscriptions.updateSubscription

Upgrade or downgrade subscription plan.

**Authentication:** Required  
**Permission:** Owner or Admin

**Input:**

```typescript
{
  organizationId: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
}
```

**Behavior:**

- **FREE Plan**: Updated directly without payment
- **PRO/ENTERPRISE Plans**: Redirects to Stripe Checkout for payment

**Response:**

```typescript
{
  id: string;
  organizationId: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
  // ... other subscription fields
}
```

---

### subscriptions.createCheckoutSession

Create a Stripe checkout session for paid plans (PRO/ENTERPRISE).

**Authentication:** Required  
**Permission:** Owner or Admin

**Input:**

```typescript
{
  organizationId: string;
  plan: "PRO" | "ENTERPRISE";
}
```

**Response:**

```typescript
{
  url: string | null; // Stripe Checkout URL
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/api/trpc/subscriptions.createCheckoutSession \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org_id_here",
    "plan": "PRO"
  }'
```

**Note:** User will be redirected to Stripe Checkout. After successful payment, they'll be redirected back to `/dashboard/billing?success=true`.

---

### subscriptions.syncSubscriptionFromStripe

Sync subscription status from Stripe (useful after checkout when webhook hasn't fired).

**Authentication:** Required  
**Permission:** Organization member

**Input:**

```typescript
{
  organizationId: string;
}
```

**Response:**

```typescript
{
  synced: boolean;
  plan?: 'FREE' | 'PRO' | 'ENTERPRISE';
  status?: string; // Stripe subscription status
  dbStatus?: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  message?: string;
}
```

**Use Cases:**

- After Stripe checkout completion (fallback if webhook fails)
- Manual subscription status refresh
- Troubleshooting subscription sync issues

---

### subscriptions.cancelSubscription

Cancel an active subscription.

**Authentication:** Required  
**Permission:** Owner or Admin

**Input:**

```typescript
{
  organizationId: string;
}
```

**Response:**

```typescript
{
  id: string;
  organizationId: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  status: "CANCELED";
  canceledAt: ISO8601;
  // ... other subscription fields
}
```

**Note:** This cancels the Stripe subscription and updates the database. The subscription will remain active until the end of the current billing period.

---

### subscriptions.hasAccess

Check if organization has access to a specific feature.

**Authentication:** Required

**Input:**

```typescript
{
  organizationId: string;
  feature: string; // Feature name to check
}
```

**Response:**

```typescript
{
  hasAccess: boolean;
}
```

---

## Stripe API Routes

### POST /api/stripe/checkout

Create a Stripe checkout session for subscription payment.

**Authentication:** Required (JWT Token)

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**

```typescript
{
  organizationId: string;
  plan: "PRO" | "ENTERPRISE";
}
```

**Response:**

```typescript
{
  url: string | null; // Stripe Checkout URL to redirect user
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/api/stripe/checkout \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org_id_here",
    "plan": "PRO"
  }'
```

**Error Responses:**

- `400` - Invalid plan or missing Price ID configuration
- `401` - Unauthorized (invalid or missing token)
- `404` - Organization not found
- `500` - Server error

---

### POST /api/stripe/webhook

Handle Stripe webhook events for subscription updates.

**Authentication:** Stripe Webhook Signature (automatically verified)

**Headers:**

```
Stripe-Signature: <webhook_signature>
```

**Request Body:** Raw Stripe event payload

**Supported Events:**

- `checkout.session.completed` - Payment successful, subscription created
- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription updated (plan change, status change)
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed

**Response:**

```typescript
{
  received: true;
}
```

**Webhook Setup:**

1. Configure webhook endpoint in Stripe Dashboard
2. URL: `https://your-domain.com/api/stripe/webhook`
3. Add webhook signing secret to `STRIPE_WEBHOOK_SECRET` environment variable
4. Select events to listen to (listed above)

**Testing with Stripe CLI:**

```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

---

## Users Router

### users.getUser

Get user details by ID.

**Authentication:** Required

**Input:**

```typescript
{
  id: string;
}
```

**Response:**

```typescript
{
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: ISO8601;
  updatedAt: ISO8601;
}
```

---

### users.listUsers

List all users in the system.

**Authentication:** Required  
**Permission:** Admin only

**Input:**

```typescript
{
  skip?: number; // Default: 0
  take?: number; // Default: 10
}
```

**Response:**

```typescript
{
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    role: "USER" | "ADMIN";
    createdAt: ISO8601;
  }>;
  total: number;
  skip: number;
  take: number;
}
```

---

### users.createUser

Create a new user account.

**Authentication:** Required  
**Permission:** Admin only

**Input:**

```typescript
{
  email: string; // Valid email address
  name: string; // Minimum 2 characters
  password: string; // Minimum 8 characters
  role?: 'USER' | 'ADMIN'; // Default: 'USER'
}
```

**Response:**

```typescript
{
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  createdAt: ISO8601;
}
```

---

### users.updateUser

Update user information.

**Authentication:** Required  
**Permission:** Admin can update any user, users can update themselves

**Input:**

```typescript
{
  id: string;
  name?: string; // Minimum 2 characters
  email?: string; // Valid email address
  role?: 'USER' | 'ADMIN'; // Admin only
}
```

**Response:**

```typescript
{
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  updatedAt: ISO8601;
}
```

---

### users.deleteUser

Delete a user account.

**Authentication:** Required  
**Permission:** Admin only

**Input:**

```typescript
{
  id: string;
}
```

**Response:**

```typescript
{
  success: boolean;
  message: string;
}
```

---

## API Keys Router

### apiKeys.getApiKey

Get or generate API key for the authenticated user.

**Authentication:** Required

**Response:**

```typescript
{
  apiKey: string; // Format: trpc*<hex>*<hex>
}
```

**Note:** If the user doesn't have an API key, one will be automatically generated. API keys are only available for PRO/ENTERPRISE plans.

---

### apiKeys.regenerateApiKey

Regenerate API key for the authenticated user.

**Authentication:** Required

**Response:**

```typescript
{
  apiKey: string; // New API key
}
```

**Note:** This will invalidate the previous API key. Make sure to update any applications using the old key.

---

## Audit Logs Router

### auditLogs.list

List audit logs for organization.

**Authentication:** Required  
**Permission:** Must be organization member

**Input:**

```typescript
{
  organizationId: string;
  skip?: number; // Default: 0
  take?: number; // Default: 50
  action?: string;
  userId?: string;
  resourceType?: string;
}
```

**Response:**

```typescript
{
  logs: Array<{
    id: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    changes: Record<string, any> | null;
    user: { id; email; name };
    createdAt: ISO8601;
  }>;
  total: number;
  skip: number;
  take: number;
}
```

---

### auditLogs.get

Get a specific audit log by ID.

**Authentication:** Required  
**Permission:** Must be organization member

**Input:**

```typescript
{
  id: string;
}
```

**Response:**

```typescript
{
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  changes: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    id, email, name;
  }
  createdAt: ISO8601;
}
```

---

### auditLogs.adminListAll

List all audit logs across all organizations.

**Authentication:** Required  
**Permission:** Admin only

**Input:**

```typescript
{
  skip?: number; // Default: 0
  take?: number; // Default: 100
}
```

**Response:**

```typescript
{
  logs: Array<{
    id: string;
    organizationId: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    changes: Record<string, any> | null;
    ipAddress: string | null;
    userAgent: string | null;
    user: { id; email; name };
    organization: { id; name };
    createdAt: ISO8601;
  }>;
  total: number;
}
```

---

### auditLogs.delete

Delete a specific audit log.

**Authentication:** Required  
**Permission:** Admin only

**Input:**

```typescript
{
  id: string;
}
```

**Response:**

```typescript
{
  success: boolean;
  message: string;
}
```

---

### auditLogs.deleteMany

Delete multiple audit logs.

**Authentication:** Required  
**Permission:** Admin only

**Input:**

```typescript
{
  ids: string[]; // Array of audit log IDs
}
```

**Response:**

```typescript
{
  success: boolean;
  message: string;
  count: number; // Number of logs deleted
}
```

---

## Health Router

### health.check

Check API health status.

**Authentication:** Not required

**Response:**

```typescript
{
  status: "ok";
  timestamp: ISO8601;
}
```

---

## Real-time Subscriptions

### realtime.projectUpdates

Subscribe to project changes in organization.

**Authentication:** Required

**Input:**

```typescript
{
  organizationId: string;
}
```

**Events:**

```typescript
| { type: 'PROJECT_CREATED'; data: { projectId, organizationId, name } }
| { type: 'PROJECT_UPDATED'; data: { projectId, organizationId, changes } }
| { type: 'PROJECT_DELETED'; data: { projectId, organizationId } }
```

---

## Error Codes

- `UNAUTHORIZED` (401) - Missing or invalid authentication
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `BAD_REQUEST` (400) - Invalid input or validation error
- `INTERNAL_SERVER_ERROR` (500) - Server error

---

## Rate Limiting

- **Global:** 100 requests per 15 minutes per IP
- **Auth:** 5 requests per 15 minutes per IP
- **API:** 1,000 requests per hour per user
- **Mutations:** 100 per minute per user

Response includes `RateLimit-*` headers with limit info.

---

## Subscription Plans

### FREE Plan

- **Price:** $0/month
- **Features:**
  - Up to 5 projects
  - Basic analytics
- **Payment:** Not required

### PRO Plan

- **Price:** $29/month
- **Features:**
  - Up to 1,000 projects
  - Advanced analytics
  - API access
- **Payment:** Stripe checkout required

### ENTERPRISE Plan

- **Price:** $999/month
- **Features:**
  - Up to 10,000 projects
  - Advanced analytics
  - API access
  - SSO (Single Sign-On)
  - Dedicated support
- **Payment:** Stripe checkout required

---

## Payment Flow

1. **User selects paid plan** (PRO/ENTERPRISE) via `subscriptions.createCheckoutSession`
2. **Redirect to Stripe Checkout** - User completes payment
3. **Webhook received** - Stripe sends webhook event to `/api/stripe/webhook`
4. **Subscription updated** - Database updated with new plan and status
5. **Fallback sync** - If webhook fails, `subscriptions.syncSubscriptionFromStripe` updates on redirect

---

## Testing Stripe Integration

### Using Stripe Test Mode

1. Use Stripe test API keys (`sk_test_...`)
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
3. Use Stripe CLI for webhook testing:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

### Testing Subscription Flow

1. Create checkout session: `POST /api/trpc/subscriptions.createCheckoutSession`
2. Complete payment with test card
3. Verify webhook received: Check Stripe Dashboard or CLI logs
4. Sync subscription: `POST /api/trpc/subscriptions.syncSubscriptionFromStripe`
5. Verify subscription updated: `GET /api/trpc/subscriptions.getSubscription`

---

**Last Updated:** 2024
