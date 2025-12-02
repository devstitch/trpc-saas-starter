# tRPC SaaS Starter

A production-ready Next.js + tRPC SaaS starter kit with MongoDB, JWT authentication, multi-tenancy, admin panel, and comprehensive features.

## 🚀 Features

- ✅ **Next.js 16** with App Router
- ✅ **tRPC** for type-safe API
- ✅ **MongoDB** with Prisma ORM
- ✅ **JWT Authentication** with session management
- ✅ **Role-Based Access Control** (USER/ADMIN)
- ✅ **Multi-Tenant Organizations**
- ✅ **Subscription Management** (FREE/PRO/ENTERPRISE)
- ✅ **Stripe Payment Integration** with checkout and webhooks
- ✅ **Admin Dashboard** with user management
- ✅ **Audit Logging** system
- ✅ **API Key Management** (PRO/ENTERPRISE plans)
- ✅ **API Testing Panel** built-in
- ✅ **Rate Limiting** middleware
- ✅ **TypeScript** throughout
- ✅ **Modern UI** with Tailwind CSS & Radix UI

## 📋 Prerequisites

- Node.js 20+
- MongoDB (local or cloud)
- npm or pnpm

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd trpc-saa-s-starter
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="mongodb://localhost:27017/trpc-saas"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NODE_ENV="development"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # Get from Stripe Dashboard > Webhooks
STRIPE_PRICE_ID_PRO="price_..." # Create in Stripe Dashboard > Products
STRIPE_PRICE_ID_ENTERPRISE="price_..." # Create in Stripe Dashboard > Products
NEXT_PUBLIC_APP_URL="http://localhost:3001" # Your app URL for redirects
```

**Stripe Setup:**

1. Create a Stripe account at https://stripe.com
2. Go to Products section and create two products:
   - **PRO Plan**: $29/month (recurring subscription - monthly or yearly)
   - **ENTERPRISE Plan**: $999/month (recurring subscription - monthly or yearly)
   - ⚠️ **Important**: Make sure to create **recurring subscription** prices, not one-time payments
3. Copy the Price IDs (starts with `price_...`) and add them to your `.env` file
4. Set up a webhook endpoint in Stripe Dashboard:
   - **Development**: Use Stripe CLI: `stripe listen --forward-to localhost:3001/api/stripe/webhook`
   - **Production**: URL: `https://your-domain.com/api/stripe/webhook`
   - **Events to listen**:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`
5. **Testing**: Use Stripe test cards (e.g., `4242 4242 4242 4242`) for testing payments

### 3. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:3001`

## 🐳 Docker Setup

### Using Docker Compose

```bash
# Start all services (MongoDB + Next.js)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Manual Docker Build

```bash
# Build image
docker build -t trpc-saas-starter .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="mongodb://admin:password@mongodb:27017/trpc-saas?authSource=admin" \
  -e JWT_SECRET="your-secret-key" \
  trpc-saas-starter
```

## 📁 Project Structure

```
trpc-saa-s-starter/
├── src/                          # ✨ Source code directory
│   ├── app/                      # Next.js App Router
│   │   ├── api/
│   │   │   ├── trpc/             # tRPC API endpoint
│   │   │   │   └── [trpc]/
│   │   │   │       └── route.ts
│   │   │   └── stripe/           # Stripe API routes
│   │   │       ├── checkout/     # Checkout session creation
│   │   │       └── webhook/      # Webhook handler
│   │   ├── dashboard/            # Dashboard pages
│   │   │   ├── users/            # Admin user management
│   │   │   ├── audit-logs/       # Audit logs (all users)
│   │   │   ├── api/              # API key management
│   │   │   ├── projects/         # Project management
│   │   │   ├── organizations/    # Organization management
│   │   │   ├── billing/          # Subscription & billing
│   │   │   ├── settings/         # User settings
│   │   │   └── page.tsx          # Dashboard home
│   │   ├── register/             # User registration page
│   │   │   └── page.tsx
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
│   │   ├── ui/                   # Reusable UI component library
│   │   └── theme-provider.tsx    # Theme context provider
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── server/               # Server-side code
│   │   │   ├── routers/          # tRPC routers
│   │   │   ├── auth/             # JWT & password utilities
│   │   │   ├── middleware/       # Rate limiting, audit
│   │   │   ├── utils/            # Server utilities
│   │   │   │   └── stripe-dates.ts  # Stripe date handling utilities
│   │   │   ├── realtime/         # Real-time events
│   │   │   ├── stripe.ts         # Stripe client configuration
│   │   │   ├── db.ts             # Prisma client
│   │   │   └── trpc.ts           # tRPC setup
│   │   ├── queries/              # tRPC query hooks
│   │   │   └── subscriptions.queries.ts  # Subscription queries
│   │   ├── trpc-client.ts        # Client-side tRPC utilities
│   │   └── utils.ts              # Shared utilities
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-mobile.ts
│   │   ├── use-organization.ts
│   │   ├── use-subscription.ts
│   │   └── use-toast.ts
│   │
│   └── types/                    # TypeScript types
│       └── auth.ts
│
├── prisma/                       # Database schema
│   └── schema.prisma
│
└── public/                       # Static assets
```

### Structure Best Practices

✅ **Follows Next.js 13+ App Router conventions**
✅ **Uses `src/` folder for better organization**
✅ **Feature-based component organization**
✅ **Clear separation of server/client code**
✅ **Proper hooks organization**
✅ **Type-safe with TypeScript**
✅ **Scalable architecture**
✅ **Path aliases configured (`@/*` → `src/*`)**

**Note:** All source code is organized in the `src/` folder. Next.js automatically detects `src/app/` for the App Router. Use `@/` prefix for imports (e.g., `@/components`, `@/hooks`, `@/lib`).

## 🏗️ Architecture

### System Overview

The application follows a layered architecture with clear separation of concerns:

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
    end

    subgraph "Business Logic"
        F[tRPC Routers]
        G[Middleware]
        H[Services]
    end

    subgraph "Data Layer"
        I[Prisma ORM]
        J[MongoDB]
    end

    subgraph "External"
        K[Stripe API]
    end

    A --> B --> C
    C --> D
    C --> E
    D --> F
    E --> H
    F --> G --> H
    H --> I --> J
    H --> K

    style A fill:#e1f5ff
    style D fill:#fff4e1
    style F fill:#ffe1f5
    style I fill:#e1ffe1
    style K fill:#f5e1ff
```

### Architecture Layers

1. **Presentation Layer** - Next.js App Router with React components
2. **API Layer** - tRPC for type-safe APIs and Stripe webhooks
3. **Business Logic Layer** - tRPC routers with middleware (auth, rate limiting, audit)
4. **Data Access Layer** - Prisma ORM with MongoDB
5. **External Services** - Stripe for payments

### Key Architecture Features

- **Type Safety** - End-to-end TypeScript types from database to UI
- **Multi-Tenancy** - Organization-based data isolation
- **Real-time Updates** - EventEmitter-based real-time events
- **Payment Integration** - Stripe checkout and webhook handling
- **Security** - JWT auth, RBAC, rate limiting, audit logging

### Data Flow

**Query Flow:**

```
Client → tRPC Query → Router → Database → Response
```

**Mutation Flow:**

```
Client → tRPC Mutation → Auth Check → Validation → Business Logic → Audit Log → Database → Response
```

**Payment Flow:**

```
User → Checkout Session → Stripe → Webhook → Database Update → UI Refresh
```

### Complete Architecture Documentation

For detailed architecture documentation including:

- Complete system diagrams
- Data flow diagrams
- Payment flow diagrams
- Multi-tenancy architecture
- Security architecture
- Component hierarchy

See [ARCHITECTURE.md](./ARCHITECTURE.md) for comprehensive architecture details.

## 🔐 Authentication

### User Registration

```bash
curl -X POST http://localhost:3001/api/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### User Login

```bash
curl -X POST http://localhost:3001/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Use the returned `token` in subsequent requests:

```bash
Authorization: Bearer <JWT_TOKEN>
```

## 👥 Admin Features

### Creating Admin User

1. Register a regular user
2. Update user role in database:

   ```javascript
   // In MongoDB or Prisma Studio
   db.User.updateOne(
     { email: "admin@example.com" },
     { $set: { role: "ADMIN" } }
   );
   ```

### Admin Capabilities

- ✅ Manage all users (CRUD operations)
- ✅ View all audit logs across organizations
- ✅ Delete audit logs (single or bulk)
- ✅ Access admin-only routes

## 💳 Stripe Integration

### Payment Flow

1. **User selects a paid plan** (PRO/ENTERPRISE) on the billing page
2. **Checkout session created** - Redirects to Stripe Checkout
3. **Payment processed** - User completes payment on Stripe
4. **Webhook received** - Stripe sends webhook event to update subscription
5. **Fallback sync** - If webhook fails, sync function updates subscription on redirect

### Subscription Management

- **FREE Plan**: Updated directly without payment
- **PRO/ENTERPRISE Plans**: Requires Stripe checkout
- **Automatic sync**: Subscription syncs from Stripe on success redirect
- **Webhook handling**: Real-time updates via Stripe webhooks
- **Status tracking**: ACTIVE, PAST_DUE, CANCELED, EXPIRED

### Testing Stripe

```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

## 📊 API Documentation

Complete API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Key Endpoints

- `/api/trpc/auth.*` - Authentication
- `/api/trpc/users.*` - User management (Admin)
- `/api/trpc/organizations.*` - Organization management
- `/api/trpc/projects.*` - Project management
- `/api/trpc/subscriptions.*` - Subscription management
  - `createCheckoutSession` - Create Stripe checkout session
  - `syncSubscriptionFromStripe` - Sync subscription from Stripe
  - `updateSubscription` - Update subscription plan
  - `cancelSubscription` - Cancel subscription
- `/api/stripe/checkout` - Create checkout session (POST)
- `/api/stripe/webhook` - Handle Stripe webhooks (POST)
- `/api/trpc/auditLogs.*` - Audit logs
- `/api/trpc/apiKeys.*` - API key management
- `/api/trpc/health.check` - Health check

## 🎯 Available Scripts

```bash
# Development
npm run dev      # Start dev server (port 3001)
npm run build    # Build for production
npm run start    # Start production server

# Database
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio

# Docker
docker-compose up -d  # Start with Docker Compose
docker-compose down   # Stop services
```

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Rate limiting middleware
- Audit logging for all actions
- API key authentication (PRO/ENTERPRISE)
- Stripe webhook signature verification
- Secure payment processing via Stripe
- Environment variable validation

## 📦 Subscription Plans

- **FREE**:
  - Up to 5 projects
  - Basic analytics
  - No payment required
- **PRO**:
  - $29/month
  - Up to 1,000 projects
  - Advanced analytics
  - API access
  - Stripe payment required
- **ENTERPRISE**:
  - $999/month
  - Up to 10,000 projects
  - Advanced analytics
  - API access
  - SSO (Single Sign-On)
  - Dedicated support
  - Stripe payment required

### Plan Features

- **Automatic upgrades**: Plans upgrade automatically after successful payment
- **Webhook sync**: Real-time subscription updates via Stripe webhooks
- **Fallback sync**: Manual sync if webhook fails
- **Status tracking**: Monitor subscription status (ACTIVE, PAST_DUE, etc.)
- **Payment handling**: Automatic payment processing and renewal

## 🚢 Deployment

### Environment Variables for Production

```env
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/trpc-saas"
JWT_SECRET="strong-random-secret-key"
NODE_ENV="production"

# Stripe Configuration (use live keys in production)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_PRO="price_..."
STRIPE_PRICE_ID_ENTERPRISE="price_..."
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Deploy to Vercel

```bash
vercel --prod
```

### Deploy to Docker

```bash
docker build -t trpc-saas-starter .
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  trpc-saas-starter
```

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with:** Next.js, tRPC, MongoDB, Prisma, TypeScript, Tailwind CSS, Radix UI
