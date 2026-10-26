# Architecture Decision Records (ADR) & System Assumptions - EcoCircuit

This document records the architectural decisions, trade-offs, assumptions, and explicit MOCK components across the EcoCircuit platform.

---

## ADR 001: Monorepo Architecture & Package Boundaries
- **Status:** Accepted
- **Context:** EcoCircuit spans three clients (Consumer Mobile, Hub Worker Mobile, Admin Console) and two backend services (Express Node.js core backend and Python FastAPI AI service).
- **Decision:** Use a clean monorepo structure:
  - `packages/common`: Shared domain types, Zod schemas, validation contracts, and statutory hazard definitions (India E-Waste 2022).
  - `services/backend`: Primary ACID transactional backend (Postgres 15, Redis 7, Express, WebSockets).
  - `services/ai-service`: Computer vision inference engine (Python FastAPI, OpenCV, TensorFlow/YOLO architecture).
  - `apps/mobile`: Unified React Native / Expo codebase with role-based navigation for Consumer and Hub Worker.
  - `apps/admin`: React + Vite web dashboard.
- **Consequences:** Ensures single source of truth for validation schemas and database models across backend and clients.

---

## ADR 002: PostgreSQL 15 ACID Guarantees for Points Ledger
- **Status:** Accepted
- **Context:** Points are direct monetary-equivalent vouchers. Double-spending or points corruption is unacceptable.
- **Decision:**
  - Implemented an immutable, append-only `points_ledger` table.
  - Balance is derived from transaction history.
  - All balance-altering operations require `SELECT ... FOR UPDATE` row-level locks on user records within a serializable transaction block.
  - Every transaction requires an `idempotency_key` (UUID/hash). Duplicate attempts return the prior result without altering state.
- **Consequences:** Zero risk of double redemption or phantom balances during concurrent requests.

---

## ADR 003: Commodity Price Feed & Voucher Adapters (MOCK & Real)
- **Status:** Accepted
- **Context:** Real commodity markets (LME, MCX India) and voucher partners (Amazon Incentives, Flipkart Corporate) require commercial API keys or partner contracts during initial phases.
- **Decision:**
  - Build adapter interfaces (`ICommodityPriceAdapter`, `IVoucherProviderAdapter`).
  - Implement `MockCommodityPriceAdapter` (with realistic baseline prices and volatility simulation) and `MockVoucherAdapter`.
  - Cache last known prices in Redis with a 24-hour TTL fallback so valuations continue uninterrupted if live feeds are unreachable.
  - **Explicit Label:** All mock implementations are clearly labeled `[MOCK]` in code, logs, and UI.

---

## ADR 004: Statutory Hazard Threshold & Worker Safety Interlock
- **Status:** Accepted
- **Context:** Under India's E-Waste (Management) Rules 2022, improper handling of lithium cells, CRT lead glass, mercury switches, and PCB capacitors poses severe health, fire, and legal liability.
- **Decision:**
  - Confidence threshold set strictly at **>= 0.85** for hazard alert triggering.
  - Hard interlock: when a hazard alert is triggered, the Hub Worker client is software-locked from logging or completing the intake until the worker explicitly checks off the statutory PPE compliance checklist.
  - Audit logging of all hazard alerts with timestamp, hub ID, worker badge, and photo frame snapshot.

---

## ADR 005: Low-Bandwidth Realtime Scan Strategy
- **Status:** Accepted
- **Context:** Hubs in industrial areas may operate on 2G/3G or saturated cellular networks. Raw video streaming (WebRTC or RTSP) is too bandwidth-heavy.
- **Decision:**
  - Clients send compressed JPEG frames at 3 to 5 frames per second over WebSocket.
  - AI service processes frames asynchronously and emits detection bounding boxes and material classifications.
  - Client interpolates bounding boxes between updates for smooth 30fps screen preview.
  - Fallback: If AI latency > 5s or disconnected, app degrades to manual category logging and caches up to 20 scans locally.
