# Technical Concepts Examples 🚀

This directory is a comprehensive reference for modern backend architectural patterns using NestJS and Node.js.

## 📦 Navigation

### 🌐 Networking & Proxies
- `proxies/reverse-proxy.ts`: Proxying requests to external services.
- `proxies/forward-proxy.ts`: Node.js HTTP tunneling.

### 🛡️ Security
- `security/helmet-setup.ts`: Secure headers and CORS.
- `security/rate-limiter.ts`: Distributed rate limiting with Redis.
- `security/xss-sanitizer.ts`: Input sanitization interceptor.
- `security/csrf-protection.ts`: CSRF token management.

### 💾 Caching
- `caching/redis-cache.service.ts`: Structured Redis wrapper.
- `caching/cache-aside-pattern.ts`: Lazy loading strategy for databases.

### 📨 Queues & Jobs
- `queues/bull-queue.ts`: Producer/Consumer with BullMQ.
- `queues/dead-letter-queue.ts`: Handling failed background tasks.

### 🦾 Resilience
- `resilience/circuit-breaker.ts`: Preventing system cascade failures.
- `resilience/retry-exponential.ts`: Smart retry logic.
- `resilience/timeout-wrapper.ts`: Operation timeout patterns.

### 🗄️ Database Patterns
- `database/repository-pattern.ts`: Generic data access layer.
- `database/transaction-pattern.ts`: Atomicity with rollbacks.
- `database/pagination.ts`: Offset and Cursor strategies.

### 🛣️ API Patterns
- `api/idempotency-middleware.ts`: Handling duplicate requests safely.
- `api/versioning.ts`: URI and Header versioning.
- `api/response-wrapper.ts`: Standardized JSON envelopes.

### 📡 Event-Driven
- `events/event-emitter.ts`: Local asynchronous events.
- `events/kafka-producer-consumer.ts`: Distributed event streaming.
- `events/saga-pattern.ts`: Coordinating distributed transactions.

### 👁️ Observability
- `observability/winston-logger.ts`: Structured JSON logging.
- `observability/correlation-id.middleware.ts`: Distributed request tracing.
- `observability/health-check.ts`: Liveness/Readiness probes (Terminus).

### ⚡ Performance
- `performance/compression.ts`: Bandwidth optimization (Gzip/Brotli).
- `performance/streaming-response.ts`: Memory-efficient data transfers.
- `performance/worker-threads.ts`: Offloading CPU-heavy work.

### 🧪 Testing
- `testing/unit-test.spec.ts`: Isolated unit testing.
- `testing/integration-test.spec.ts`: Component interaction testing.
- `testing/e2e-test.spec.ts`: Full system flow verification.

### 🔐 Auth & OAuth
- `auth/jwt-refresh-token.ts`: Access and Refresh token rotation.
- `auth/rbac-middleware.ts`: Role-Based Access Control.
- `auth/api-key-auth.ts`: Simple API key authentication.
- `oauth/google-oauth.strategy.ts`: Passport strategy for Google.
- `oauth/internal-oauth.provider.ts`: Building an internal OAuth2 Authorization Server.

---

## 🚀 How to Use
These examples are modular. You can import the services/controllers into your main modules or use the logic as templates for your specific requirements.

## 🛠️ Requirements
Ensure you have the necessary dependencies installed:
```bash
npm install helmet express-rate-limit rate-limit-redis ioredis bullmq opossum typeorm kafkajs winston @nestjs/terminus compression xss cookie-parser uuid
```
