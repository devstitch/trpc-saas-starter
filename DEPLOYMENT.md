# Deployment Guide

## Prerequisites

- Node.js 20+
- MongoDB Atlas account (or self-hosted MongoDB)
- Environment variables configured

## Local Development

\`\`\`bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Update DATABASE_URL and JWT_SECRET

# Setup database
pnpm db:push

# Start development server
pnpm dev
\`\`\`

Server runs on `http://localhost:3000`

---

## Docker Deployment

### Build Image
\`\`\`bash
docker build -t trpc-saas:latest .
\`\`\`

### Run Container
\`\`\`bash
docker run -p 3000:3000 \
  -e DATABASE_URL="mongodb://..." \
  -e JWT_SECRET="your-secret" \
  trpc-saas:latest
\`\`\`

### Docker Compose
\`\`\`bash
docker-compose up -d
\`\`\`

---

## Render Deployment

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. New → Web Service
4. Connect GitHub repository
5. Set environment variables:
   - `DATABASE_URL`: MongoDB connection string
   - `JWT_SECRET`: Secure random string
   - `NODE_ENV`: production
6. Deploy

---

## Fly.io Deployment

\`\`\`bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch app
flyctl launch

# Set secrets
flyctl secrets set DATABASE_URL="mongodb://..."
flyctl secrets set JWT_SECRET="your-secret"

# Deploy
flyctl deploy
\`\`\`

---

## Railway Deployment

\`\`\`bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Set environment variables
railway variables

# Deploy
railway up
\`\`\`

---

## Environment Variables

### Required
- `DATABASE_URL`: MongoDB connection string
- `JWT_SECRET`: Secret for signing JWTs

### Optional
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

### Example
\`\`\`bash
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/trpc-saas
JWT_SECRET=your-super-secret-key-change-this
NODE_ENV=production
PORT=3000
\`\`\`

---

## Production Checklist

- [ ] Update `JWT_SECRET` to strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas with IP whitelist
- [ ] Enable database backups
- [ ] Configure rate limiting for your load
- [ ] Set up monitoring and logging
- [ ] Configure CORS for your frontend
- [ ] Use HTTPS/SSL
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure automated backups

---

## Monitoring

### Health Check
\`\`\`bash
curl http://localhost:3000/health
\`\`\`

Response:
\`\`\`json
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00Z"
}
\`\`\`

### Database Connection
Check in your MongoDB Atlas console or local MongoDB client.

### Logs
\`\`\`bash
# Docker
docker logs trpc-saas-backend

# Railway
railway logs

# Render
View in dashboard

# Fly.io
flyctl logs
\`\`\`

---

## Scaling

### Database
- Start with MongoDB Atlas free tier
- Scale to dedicated cluster as needed
- Enable auto-scaling

### Backend
- Start with single instance
- Use load balancing (Render, Fly.io, Railway provide)
- Scale to multiple instances

### Caching
- Consider Redis for session storage
- Use HTTP caching headers

---

## Troubleshooting

### Connection Refused
- Check DATABASE_URL format
- Verify MongoDB is running
- Check IP whitelist (MongoDB Atlas)

### Authentication Errors
- Verify JWT_SECRET is set
- Check token expiration
- Verify user exists in database

### Rate Limit Errors
- Check if using shared IP (Docker/VPN)
- Adjust rate limits in rate-limit.ts
- Implement per-user rate limiting

### Database Timeout
- Increase connection pool
- Check network latency
- Verify MongoDB performance
