# Architecture Overview

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[Browser/Client]
        B[React Components]
        C[Next.js App Router]
    end

    subgraph "API Layer"
        D[tRPC API Routes]
        E[Stripe API Routes]
        F[Webhook Handler]
    end

    subgraph "Business Logic Layer"
        G[tRPC Routers]
        H[Middleware]
        I[Auth Service]
        J[Subscription Service]
    end

    subgraph "Data Layer"
        K[Prisma ORM]
        L[MongoDB]
    end

    subgraph "External Services"
        M[Stripe API]
        N[Stripe Webhooks]
    end

    A --> B
    B --> C
    C --> D
    C --> E
    D --> G
    E --> J
    F --> J
    G --> H
    H --> I
    H --> J
    J --> K
    I --> K
    K --> L
    J --> M
    N --> F
    M --> N

    style A fill:#e1f5ff
    style B fill:#e1f5ff
    style C fill:#e1f5ff
    style D fill:#fff4e1
    style E fill:#fff4e1
    style F fill:#fff4e1
    style G fill:#ffe1f5
    style H fill:#ffe1f5
    style I fill:#ffe1f5
    style J fill:#ffe1f5
    style K fill:#e1ffe1
    style L fill:#e1ffe1
    style M fill:#f5e1ff
    style N fill:#f5e1ff
```

## Project Structure

```
trpc-saa-s-starter/
├── src/                          # Source code directory
│   ├── app/                      # Next.js App Router
│   │   ├── api/
│   │   │   ├── trpc/[trpc]/      # tRPC API route handler
│   │   │   │   └── route.ts      # Next.js API route
│   │   │   └── stripe/           # Stripe API routes
│   │   │       ├── checkout/     # Checkout session creation
│   │   │       └── webhook/      # Webhook handler
│   │   ├── dashboard/            # Dashboard pages
│   │   │   ├── users/            # Admin user management
│   │   │   ├── audit-logs/       # Audit logs (all users)
│   │   │   ├── api/              # API key management
│   │   │   ├── projects/         # Project management
│   │   │   ├── organizations/   # Organization management
│   │   │   ├── billing/          # Subscription & billing
│   │   │   └── settings/         # User settings
│   │   ├── register/             # User registration page
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing page
│   │   └── globals.css           # Global styles
│   │
│   ├── components/               # React components
│   │   ├── api/                  # API feature components
│   │   ├── auth/                 # Authentication forms
│   │   ├── dashboard/            # Dashboard components
│   │   ├── users/                # User management components
│   │   ├── audit-logs/           # Audit log components
│   │   ├── projects/             # Project components
│   │   ├── ui/                   # Reusable UI components (shadcn/ui)
│   │   └── theme-provider.tsx    # Theme context provider
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── server/               # Server-side code
│   │   │   ├── routers/          # tRPC routers
│   │   │   │   ├── auth.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── organizations.ts
│   │   │   │   ├── projects.ts
│   │   │   │   ├── subscriptions.ts
│   │   │   │   ├── audit-logs.ts
│   │   │   │   ├── api-keys.ts
│   │   │   │   ├── health.ts
│   │   │   │   ├── subscriptions-realtime.ts
│   │   │   │   └── index.ts
│   │   │   ├── auth/             # JWT & password utilities
│   │   │   │   ├── jwt.ts
│   │   │   │   └── password.ts
│   │   │   ├── middleware/       # tRPC middleware
│   │   │   │   ├── audit.ts
│   │   │   │   └── rate-limit.ts
│   │   │   ├── utils/            # Server utilities
│   │   │   │   ├── stripe-dates.ts  # Stripe date handling
│   │   │   │   └── errors.ts
│   │   │   ├── realtime/         # Real-time events
│   │   │   │   └── events.ts
│   │   │   ├── stripe.ts         # Stripe client configuration
│   │   │   ├── db.ts             # Prisma singleton
│   │   │   ├── trpc.ts           # tRPC setup & procedures
│   │   │   └── types.ts          # Server types
│   │   ├── queries/              # tRPC query hooks
│   │   │   └── subscriptions.queries.ts
│   │   ├── trpc-client.ts        # Client-side tRPC utilities
│   │   └── utils.ts              # Shared utilities
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-auth.ts           # Authentication hook
│   │   ├── use-mobile.ts         # Mobile detection hook
│   │   ├── use-organization.ts   # Organization context hook
│   │   ├── use-subscription.ts   # Subscription hook
│   │   └── use-toast.ts          # Toast notification hook
│   │
│   └── types/                    # TypeScript types
│       └── auth.ts               # Authentication types
│
├── prisma/                       # Database schema
│   └── schema.prisma             # Prisma schema (MongoDB)
│
└── public/                        # Static assets
```

## Architecture Layers

### 1. Presentation Layer (Next.js App Router)

- **Next.js 16** - React framework with App Router
- **Server Components** - Default rendering strategy
- **Client Components** - Interactive UI with "use client"
- **API Routes** - tRPC endpoint at `/api/trpc/[trpc]`
- **Server Actions** - Server-side mutations (via tRPC)

### 2. API Layer (tRPC)

- **tRPC Routers** - Type-safe API endpoints
- **Procedure Types** - `query`, `mutation`, `subscription`
- **Input Validation** - Zod schemas for all inputs
- **Type Safety** - End-to-end TypeScript types
- **Error Handling** - Structured error responses

### 3. Business Logic Layer

- **Service Functions** - Complex business operations
- **Cross-cutting Concerns** - Audit logging, rate limiting
- **Event Emission** - Real-time updates via EventEmitter
- **Authorization** - Role-based and resource-level checks

### 4. Data Access Layer

- **Prisma ORM** - Type-safe database client
- **MongoDB** - NoSQL database with flexible schema
- **Database Models** - User, Organization, Project, AuditLog, etc.
- **Query Optimization** - Indexes and efficient queries

### 5. Authentication & Authorization

- **JWT Tokens** - Stateless authentication
- **Session Tracking** - Database-backed sessions
- **Context-based Auth** - User context in tRPC procedures
- **Role-Based Access Control** - USER/ADMIN roles
- **Organization Permissions** - OWNER/ADMIN/MEMBER roles

## Data Flow

### Query Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant NextJS as Next.js API Route
    participant tRPC as tRPC Handler
    participant Router as Router Procedure
    participant DB as Prisma/MongoDB

    Client->>NextJS: GET /api/trpc/subscriptions.getSubscription
    NextJS->>tRPC: Parse request
    tRPC->>Router: Validate auth & context
    Router->>Router: Validate input (Zod)
    Router->>DB: Query subscription
    DB-->>Router: Return data
    Router-->>tRPC: Type-safe response
    tRPC-->>NextJS: JSON response
    NextJS-->>Client: Return subscription data
```

### Query Flow (Next.js + tRPC)

```
Client Component (React)
↓
useQuery Hook / trpcQuery()
↓
Next.js API Route (/api/trpc/[trpc])
↓
tRPC Handler (route.ts)
↓
tRPC Procedure (authentication, context)
↓
Router Procedure (input validation with Zod)
↓
Business Logic (database queries, authorization)
↓
Prisma ORM (MongoDB interaction)
↓
Response to Client (type-safe)
```

### Mutation Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant NextJS as Next.js API Route
    participant tRPC as tRPC Handler
    participant Auth as Auth Middleware
    participant Router as Router Procedure
    participant Audit as Audit Logger
    participant Events as Event Emitter
    participant DB as Prisma/MongoDB

    Client->>NextJS: POST /api/trpc/projects.create
    NextJS->>tRPC: Parse request
    tRPC->>Auth: Verify JWT token
    Auth-->>tRPC: User context
    tRPC->>Router: Protected procedure
    Router->>Router: Check permissions (RBAC)
    Router->>Router: Validate input (Zod)
    Router->>DB: Create project
    DB-->>Router: Project created
    Router->>Audit: Log action
    Router->>Events: Emit PROJECT_CREATED
    Router-->>tRPC: Success response
    tRPC-->>NextJS: JSON response
    NextJS-->>Client: Return created project
```

### Mutation Flow

```
Client Component (React)
↓
useMutation Hook / trpcMutation()
↓
Next.js API Route (/api/trpc/[trpc])
↓
tRPC Protected Procedure
↓
Permission Check (RBAC + Organization)
↓
Input Validation (Zod schema)
↓
Business Logic Execution
↓
Emit Real-time Event (EventEmitter)
↓
Create Audit Log
↓
Database Transaction (Prisma)
↓
Response to Client
```

### Server Component Flow

```
Next.js Server Component
↓
Direct tRPC Call (server-side)
↓
tRPC Procedure
↓
Database Query
↓
Render HTML (SSR)
```

### Payment Flow Diagram (Stripe Integration)

```mermaid
sequenceDiagram
    participant User
    participant Billing as Billing Page
    participant API as tRPC API
    participant Checkout as Stripe Checkout API
    participant Stripe as Stripe Platform
    participant Webhook as Webhook Handler
    participant DB as Database
    participant Sync as Sync Function

    User->>Billing: Select PRO/ENTERPRISE plan
    Billing->>API: createCheckoutSession mutation
    API->>Checkout: POST /api/stripe/checkout
    Checkout->>Stripe: Create checkout session
    Stripe-->>Checkout: Return checkout URL
    Checkout-->>API: Return URL
    API-->>Billing: Return checkout URL
    Billing->>Stripe: Redirect to Stripe Checkout
    User->>Stripe: Complete payment
    Stripe->>Webhook: Send webhook event
    Webhook->>DB: Update subscription
    Stripe->>Billing: Redirect to success URL
    Billing->>Sync: syncSubscriptionFromStripe (fallback)
    Sync->>DB: Verify & update subscription
    Sync-->>Billing: Subscription synced
    Billing->>User: Show success message
```

### Payment Flow (Stripe Integration)

```
User selects paid plan (PRO/ENTERPRISE)
↓
Billing Page (Client Component)
↓
createCheckoutSession mutation
↓
POST /api/stripe/checkout
↓
Stripe Checkout Session Created
↓
User redirected to Stripe Checkout
↓
Payment completed on Stripe
↓
Stripe Webhook → POST /api/stripe/webhook
↓
Subscription updated in database
↓
Fallback: syncSubscriptionFromStripe (if webhook fails)
↓
User redirected to /dashboard/billing?success=true
↓
Subscription synced and UI updated
```

## Security Architecture

### Security Layers Diagram

```mermaid
graph TB
    subgraph "Client Security"
        A[HTTPS/TLS]
        B[JWT Token Storage]
        C[Input Sanitization]
    end

    subgraph "API Security"
        D[Rate Limiting]
        E[Authentication Middleware]
        F[Authorization Checks]
    end

    subgraph "Data Security"
        G[Password Hashing]
        H[Encrypted Connections]
        I[Audit Logging]
    end

    subgraph "Payment Security"
        J[Stripe PCI Compliance]
        K[Webhook Signature]
        L[Secure Redirects]
    end

    A --> D
    B --> E
    C --> F
    E --> G
    F --> H
    H --> I
    J --> K
    K --> L

    style A fill:#e1f5ff
    style D fill:#fff4e1
    style E fill:#fff4e1
    style F fill:#fff4e1
    style G fill:#ffe1f5
    style H fill:#ffe1f5
    style I fill:#ffe1f5
    style J fill:#f5e1ff
    style K fill:#f5e1ff
    style L fill:#f5e1ff
```

### Authentication

- **JWT Tokens** - 7-day expiration, stored in HTTP-only cookies (recommended) or localStorage
- **Password Hashing** - bcryptjs with 10 salt rounds
- **Session Management** - Database-backed sessions with expiration
- **API Keys** - Alternative authentication for PRO/ENTERPRISE plans
- **Stripe Webhooks** - Signature verification for secure webhook processing

### Authorization

- **Role-Based Access Control** - USER, ADMIN roles
- **Organization-Level Permissions** - OWNER, ADMIN, MEMBER roles
- **Resource-Level Access** - Organization-scoped data access
- **Procedure Protection** - `protectedProcedure`, `adminProcedure`

### Rate Limiting

- **Global Rate Limit** - 100 requests per 15 minutes
- **Auth Endpoints** - 5 requests per 15 minutes
- **Mutations** - 100 requests per minute
- **Queries** - 500 requests per minute
- **Middleware-based** - Applied at tRPC procedure level

### Data Protection

- **Audit Logging** - All mutations logged with user, action, changes
- **Soft Deletes** - Archive instead of delete (projects)
- **Input Validation** - Zod schemas on all endpoints
- **NoSQL Injection Prevention** - Prisma ORM protection
- **XSS Protection** - React's built-in escaping
- **CSRF Protection** - SameSite cookies (when using cookies)
- **Payment Security** - Stripe PCI-compliant payment processing
- **Webhook Security** - Stripe signature verification

## Scalability Considerations

### Database

- **MongoDB** - Flexible schema, horizontal scaling
- **Indexes** - On frequently queried fields (userId, organizationId, createdAt)
- **Connection Pooling** - Prisma connection management
- **Query Optimization** - Selective field fetching, pagination

### Caching

- **Next.js Caching** - Built-in request caching
- **Session Caching** - In-memory session validation
- **Real-time Events** - EventEmitter for in-process events
- **HTTP Caching** - Cache headers for static assets

### Performance

- **Pagination** - All list endpoints support skip/take
- **Lazy Loading** - Relationships loaded on demand
- **Server Components** - Reduced client bundle size
- **Code Splitting** - Next.js automatic code splitting
- **Static Generation** - ISR for public pages (if applicable)

## Multi-Tenancy Design

### Multi-Tenancy Architecture Diagram

```mermaid
graph LR
    subgraph "User Layer"
        U1[User 1]
        U2[User 2]
        U3[User 3]
    end

    subgraph "Organization Layer"
        O1[Org A<br/>PRO Plan]
        O2[Org B<br/>FREE Plan]
        O3[Org C<br/>ENTERPRISE]
    end

    subgraph "Data Isolation"
        D1[(Org A Data)]
        D2[(Org B Data)]
        D3[(Org C Data)]
    end

    subgraph "Stripe Integration"
        S1[Customer A]
        S2[Customer B]
        S3[Customer C]
    end

    U1 --> O1
    U2 --> O1
    U2 --> O2
    U3 --> O3

    O1 --> D1
    O2 --> D2
    O3 --> D3

    O1 --> S1
    O2 --> S2
    O3 --> S3

    style O1 fill:#e1f5ff
    style O2 fill:#e1f5ff
    style O3 fill:#e1f5ff
    style D1 fill:#ffe1f5
    style D2 fill:#ffe1f5
    style D3 fill:#ffe1f5
    style S1 fill:#f5e1ff
    style S2 fill:#f5e1ff
    style S3 fill:#f5e1ff
```

### Multi-Tenancy Features

- **Organization as Tenant** - Primary tenant boundary
- **Row-Level Security** - All queries filtered by organizationId
- **Subscription-Based Access** - FREE, PRO, ENTERPRISE plans
- **Resource Limits** - Plan-based limits (projects, API access)
- **Isolation** - Complete data isolation between organizations
- **Stripe Customer Mapping** - Each organization has Stripe customer ID
- **Subscription Management** - Stripe subscription IDs linked to organizations

## Real-time Architecture

### Real-time Event Flow Diagram

```mermaid
graph TB
    subgraph "Event Sources"
        A[Project Created]
        B[Project Updated]
        C[Subscription Changed]
    end

    subgraph "Event System"
        D[EventEmitter]
        E[Event Router]
    end

    subgraph "Subscribers"
        F[Client 1<br/>Org A]
        G[Client 2<br/>Org A]
        H[Client 3<br/>Org B]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E -->|Filter by Org| F
    E -->|Filter by Org| G
    E -->|Filter by Org| H

    style D fill:#ffe1f5
    style E fill:#ffe1f5
    style F fill:#e1f5ff
    style G fill:#e1f5ff
    style H fill:#e1f5ff
```

### Real-time Features

- **EventEmitter** - In-process event system
- **tRPC Subscriptions** - WebSocket-based subscriptions
- **Organization-Scoped** - Events filtered by organization
- **Automatic Cleanup** - Connection cleanup on disconnect
- **Event Types** - Project updates, organization changes

## Frontend Architecture

### Component Hierarchy Diagram

```mermaid
graph TD
    A[Root Layout] --> B[Dashboard Layout]
    B --> C[Sidebar]
    B --> D[Header]
    B --> E[Main Content]

    E --> F[Billing Page]
    E --> G[Projects Page]
    E --> H[Users Page]

    F --> I[Plan Cards]
    F --> J[Current Plan]
    F --> K[Payment Button]

    G --> L[Project List]
    G --> M[Create Project]

    H --> N[User Table]
    H --> O[User Actions]

    I --> P[UI Components]
    J --> P
    K --> P
    L --> P
    M --> P
    N --> P
    O --> P

    style A fill:#e1f5ff
    style B fill:#e1f5ff
    style F fill:#ffe1f5
    style G fill:#ffe1f5
    style H fill:#ffe1f5
    style P fill:#e1ffe1
```

### Component Structure

- **Feature-Based** - Components organized by feature
- **UI Library** - Reusable shadcn/ui components
- **Client Components** - Interactive components with "use client"
- **Server Components** - Default for static content

### State Management

- **React Hooks** - Custom hooks for auth, organization, subscription
- **tRPC Hooks** - Type-safe data fetching
- **Context API** - Theme provider, auth context
- **Local State** - useState for component-level state

### Styling

- **Tailwind CSS v4** - Utility-first CSS framework
- **CSS Variables** - Theme customization
- **Dark Mode** - Built-in dark mode support
- **Responsive Design** - Mobile-first approach

## Deployment Architecture

### Production Build

- **Next.js Standalone** - Optimized production build
- **Docker Support** - Multi-stage Docker builds
- **Environment Variables** - Secure configuration
- **Health Checks** - `/api/trpc/health.check` endpoint

### Deployment Options

- **Vercel** - Recommended for Next.js
- **Render** - Docker-based deployment
- **Docker Compose** - Local development with MongoDB
- **Self-Hosted** - Docker container deployment

## Technology Stack

### Frontend

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Radix UI** - Accessible components
- **Lucide React** - Icons

### Backend

- **tRPC** - Type-safe API
- **Prisma** - ORM
- **MongoDB** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Zod** - Schema validation
- **Stripe** - Payment processing and subscription management

### Development

- **TypeScript** - Type checking
- **ESLint** - Code linting
- **Vitest** - Testing framework (configured)

## API Design Principles

1. **Type Safety** - End-to-end TypeScript types
2. **Input Validation** - Zod schemas for all inputs
3. **Error Handling** - Structured error responses
4. **Pagination** - Consistent pagination across list endpoints
5. **Filtering** - Organization-scoped data access
6. **Audit Trail** - All mutations logged
7. **Rate Limiting** - Protection against abuse
8. **Documentation** - Complete API documentation
9. **Payment Integration** - Secure Stripe checkout and webhook handling
10. **Subscription Sync** - Automatic and manual subscription synchronization

## Stripe Integration Architecture

### Stripe Integration Flow Diagram

```mermaid
graph TB
    subgraph "Application"
        A[Billing Page]
        B[Checkout API]
        C[Webhook Handler]
        D[Sync Function]
        E[Database]
    end

    subgraph "Stripe Platform"
        F[Stripe Checkout]
        G[Stripe API]
        H[Stripe Webhooks]
    end

    A -->|Create Session| B
    B -->|Create Session| G
    G -->|Return URL| B
    B -->|Redirect| F
    F -->|Payment Success| H
    H -->|Webhook Event| C
    C -->|Update| E
    A -->|Sync Request| D
    D -->|Retrieve| G
    G -->|Subscription Data| D
    D -->|Update| E

    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#fff4e1
    style D fill:#fff4e1
    style E fill:#e1ffe1
    style F fill:#f5e1ff
    style G fill:#f5e1ff
    style H fill:#f5e1ff
```

### Webhook Event Flow Diagram

```mermaid
sequenceDiagram
    participant Stripe
    participant Webhook as Webhook Handler
    participant Verify as Signature Verification
    participant Handler as Event Handler
    participant DB as Database
    participant Audit as Audit Logger

    Stripe->>Webhook: POST /api/stripe/webhook
    Webhook->>Verify: Verify signature
    Verify-->>Webhook: Signature valid
    Webhook->>Handler: Route event type

    alt checkout.session.completed
        Handler->>DB: Create/Update subscription
        Handler->>Audit: Log subscription created
    else customer.subscription.updated
        Handler->>DB: Update subscription status
        Handler->>Audit: Log subscription updated
    else invoice.payment_failed
        Handler->>DB: Set status to PAST_DUE
        Handler->>Audit: Log payment failed
    end

    DB-->>Handler: Success
    Handler-->>Webhook: 200 OK
    Webhook-->>Stripe: Acknowledged
```

### Payment Processing

- **Checkout Sessions** - Stripe-hosted checkout for secure payment collection
- **Webhook Events** - Real-time subscription updates via webhooks
- **Fallback Sync** - Manual sync function for reliability
- **Customer Management** - Automatic Stripe customer creation
- **Subscription Tracking** - Stripe subscription IDs stored in database

### Webhook Handling

- **Event Types** - `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
- **Signature Verification** - Webhook signature validation for security
- **Idempotency** - Safe to retry webhook events
- **Error Handling** - Graceful handling of missing or invalid data
- **Fallback Dates** - Default dates for incomplete subscriptions

### Subscription States

- **ACTIVE** - Active subscription with valid payment
- **PAST_DUE** - Payment failed, subscription past due
- **CANCELED** - Subscription canceled by user
- **EXPIRED** - Subscription expired or incomplete

### Subscription State Machine

```mermaid
stateDiagram-v2
    [*] --> FREE: Initial
    FREE --> PRO: Payment Success
    FREE --> ENTERPRISE: Payment Success
    PRO --> FREE: Downgrade
    PRO --> ENTERPRISE: Upgrade
    ENTERPRISE --> PRO: Downgrade
    ENTERPRISE --> FREE: Cancel

    PRO --> ACTIVE: Payment Success
    ENTERPRISE --> ACTIVE: Payment Success
    ACTIVE --> PAST_DUE: Payment Failed
    PAST_DUE --> ACTIVE: Payment Retry Success
    PAST_DUE --> CANCELED: Cancel
    ACTIVE --> CANCELED: Cancel
    CANCELED --> EXPIRED: Period End
    PAST_DUE --> EXPIRED: No Payment

    note right of ACTIVE
        Active subscription
        with valid payment
    end note

    note right of PAST_DUE
        Payment failed
        Retry available
    end note
```
