# Shiprocket Delivery Integration — Production Plan
> Grounded in your actual codebase: `app/modules/delivery/`, `orderWorkflowService.js`, `deliveryAssignmentStore.js`, `orderQueues.js`, `idempotencyService.js`

---

## 1. Current Architecture Audit — Tight Coupling Hotspots

### What's Already Decoupled ✅
| Component | Status |
|---|---|
| `deliveryManager.js` | Clean facade — callers never touch Shiprocket directly |
| `deliveryFlags.js` | Feature-flag gate via `DELIVERY_PROVIDER` env |
| `deliveryStatusMapping.js` | Canonical mapping stub exists |
| `deliveryAssignmentStore.js` | Internal store isolated behind module boundary |
| `idempotencyService.js` | Reusable, Redis-backed — ready to use |

### Still Tightly Coupled ⚠️ — Must Fix
| Problem | Location | Risk |
|---|---|---|
| Provider interface has only 4 broadcast-only methods | `deliveryManager.js` | No contract for shipment / tracking / webhook |
| `orderWorkflowService.js` imports `deliveryAssignmentStore` directly | Line 36 of `orderWorkflowService.js` | Internal store leaks into core workflow |
| `deliveryStatusMapping.js` returns `null` for all third-party statuses | Lines 18–19 | Status translation broken for Shiprocket |
| `DeliveryAssignment` model has no `awbCode`, `shiprocketShipmentId`, `trackingUrl` | `models/deliveryAssignment.js` | Cannot track Shiprocket shipment lifecycle |
| No Shiprocket webhook ingestion route | `routes/` | Shiprocket cannot push status updates |
| Queue only used for timeouts | `queues/orderQueues.js` | No async queue for Shiprocket API calls |

---

## 2. Shiprocket Service Contract

The Shiprocket service is the **single, concrete delivery implementation**. There is no provider interface or abstraction layer — the architecture is built directly around Shiprocket's API surface.

```js
// app/modules/delivery/providers/shiprocket/shiprocketService.js

/**
 * ShiprocketService
 * The sole delivery service. All shipment operations are Shiprocket operations.
 */
export class ShiprocketService {
  // Core lifecycle
  async createShipment(context);       // → { shiprocketOrderId, shiprocketShipmentId, awbCode, courierName, trackingUrl, labelUrl }
  async cancelShipment(context);       // → { cancelled: boolean, reason? }
  async getTrackingInfo(context);      // → { currentStatus, location, eta, events[] }
  async getETA(context);               // → { etaMinutes, etaTimestamp }

  // AWB & Label
  async assignAWB(shipmentId);         // → { awbCode, courierName }
  async generateLabel(shipmentId);     // → { labelUrl }
  async schedulePickup(shipmentId);    // → { pickupScheduled: boolean, scheduledAt: Date }

  // Status normalization
  mapStatus(shiprocketStatus);         // → canonical WORKFLOW_STATUS | null

  // Webhook
  parseWebhookPayload(rawBody, headers);        // → { orderId, awbCode, currentStatus, location, meta }
  verifyWebhookSignature(rawBody, headers);     // → boolean

  // Token lifecycle (managed internally by ShiprocketClient)
  refreshToken();                      // → void

  // Socket broadcasts (existing interface — preserved)
  emitDeliveryBroadcastForSeller(sellerId, payload);
  retractDeliveryBroadcastForOrder(orderId, winnerDeliveryId);
  emitReturnBroadcastForCustomer(customerLocation, payload);
  emitToDelivery(deliveryId, { event, payload });
}
```

> **Design Rule:** This is not an interface. `ShiprocketService` is a concrete class. There is no abstraction for future providers. If a method is temporarily unsupported, it returns a documented safe default and logs a warning — it never throws unexpectedly.

---

## 3. Recommended Folder Structure

```
backend/app/modules/delivery/
├── deliveryFlags.js                        ✅ exists — set DELIVERY_PROVIDER=shiprocket
├── deliveryManager.js                      ✅ exists — expand with Shiprocket methods
├── deliveryStatusMapping.js                ✅ exists — replace with Shiprocket-only map
│
├── providers/
│   └── shiprocket/
│       ├── shiprocketService.js            🆕 main Shiprocket service (full implementation)
│       ├── shiprocketClient.js             🆕 HTTP client (axios + token management)
│       ├── shiprocketStatusMap.js          🆕 Shiprocket status → canonical WORKFLOW_STATUS
│       └── shiprocketWebhookParser.js      🆕 HMAC verification + payload parsing
│
├── internal/
│   ├── deliveryAssignmentStore.js          ✅ exists
│   └── deliveryBroadcastPayload.js         🆕 extract payload builder from orderWorkflowService
│
├── webhooks/
│   ├── shiprocketWebhookRoute.js           🆕 POST /api/delivery/shiprocket/webhook
│   └── shiprocketWebhookProcessor.js      🆕 parses, maps, dispatches to orderWorkflowService
│
└── tracking/
    └── shiprocketTrackingPoller.js         🆕 scheduled Bull job — polling fallback

backend/app/queues/
├── orderQueues.js                          ✅ exists
└── deliveryQueues.js                       🆕 Shiprocket shipment / cancellation / tracking / webhook queues

backend/app/models/
├── deliveryAssignment.js                   ✅ exists — Shiprocket fields added (additive)
└── deliveryShipment.js                     🆕 Shiprocket shipment record

backend/app/routes/
└── deliveryWebhookRoutes.js                🆕 raw-body middleware + Shiprocket webhook route
```

> **No `selection/`, no `quoteAggregator.js`, no `providerHealthStore.js`, no porter directory.** The architecture is flat and Shiprocket-specific.

---

## 4. Database Schema

### 4a. Extend `DeliveryAssignment` (additive, backward-compatible)

All new fields are optional so existing documents are unaffected.

```js
// Add to existing deliveryAssignment.js schema
{
  // Shiprocket identifiers
  shiprocketOrderId:    { type: String, index: true },
  shiprocketShipmentId: { type: String, index: true },
  awbCode:              { type: String, index: true },      // Shiprocket AWB / tracking number
  courierName:          { type: String },                   // e.g. "Delhivery", "Blue Dart"
  trackingUrl:          { type: String },
  labelUrl:             { type: String },

  // Lifecycle timestamps
  pickupScheduled:      { type: Boolean, default: false },
  pickupScheduledAt:    { type: Date },
  shipmentCreatedAt:    { type: Date },
  shipmentCancelledAt:  { type: Date },

  // Status tracking
  currentStatus:        { type: String },                   // raw Shiprocket status string
  webhookLogs:          [{ type: mongoose.Schema.Types.Mixed }],  // raw Shiprocket webhook payloads
  lastWebhookAt:        { type: Date },

  // Error tracking
  failureReason:        { type: String },
  retryCount:           { type: Number, default: 0 },
}
```

### 4b. New `DeliveryShipment` Model

```js
// app/models/deliveryShipment.js
{
  orderId:              { type: String, required: true, index: true },
  orderMongoId:         { type: ObjectId, ref: "Order" },

  // Shiprocket identifiers
  shiprocketOrderId:    { type: String, index: true },
  shiprocketShipmentId: { type: String, index: true },
  awbCode:              { type: String, unique: true, sparse: true },
  courierName:          { type: String },
  trackingUrl:          { type: String },
  labelUrl:             { type: String },             // PDF label URL from Shiprocket

  // Status
  status: {
    type: String,
    enum: ["pending", "created", "pickup_scheduled", "in_transit", "out_for_delivery", "delivered", "cancelled", "failed"],
    default: "pending",
  },
  currentStatus:        { type: String },             // raw Shiprocket status string

  // Shipment timeline (append-only)
  timeline: [{
    status:     { type: String },
    timestamp:  { type: Date },
    location:   { type: String },
    raw:        { type: mongoose.Schema.Types.Mixed },
  }],

  // ETA
  etaTimestamp:         { type: Date },

  // Pickup
  pickupScheduled:      { type: Boolean, default: false },
  pickupScheduledAt:    { type: Date },

  // Webhook log
  webhookLog: [{
    receivedAt:  { type: Date },
    payload:     { type: mongoose.Schema.Types.Mixed },
    processed:   { type: Boolean, default: false },
  }],

  // Idempotency
  idempotencyKey:       { type: String, unique: true, sparse: true },

  // Error tracking
  failureReason:        { type: String },
  retryCount:           { type: Number, default: 0 },

  createdAt, updatedAt  // auto via timestamps: true
}
```

### 4c. `ShiprocketTokenStore` Model

```js
// app/models/shiprocketTokenStore.js
{
  accessToken:  { type: String, required: true },
  expiresAt:    { type: Date, required: true },
  updatedAt:    { type: Date, required: true },
}
// Single-document collection — only one Shiprocket token is ever active.
// Use findOne() / findOneAndUpdate() with upsert: true.
```

> **Note:** `ProviderTokenStore` from the original multi-provider design is replaced with `ShiprocketTokenStore`. The `providerName` discriminator field is not needed.

---

## 5. Expanded `deliveryManager.js` — New Methods

Add these to the existing manager facade. No breaking changes to existing exports.

```js
// New additions to deliveryManager.js
import { shiprocketService } from "./providers/shiprocket/shiprocketService.js";

export async function createShipment(context) {
  if (!isDeliveryModuleEnabled()) return null;
  return shiprocketService.createShipment(context);
}

export async function cancelShipment(context) {
  if (!isDeliveryModuleEnabled()) return null;
  return shiprocketService.cancelShipment(context);
}

export async function getTrackingInfo(context) {
  if (!isDeliveryModuleEnabled()) return null;
  return shiprocketService.getTrackingInfo(context);
}

export async function getETA(context) {
  if (!isDeliveryModuleEnabled()) return null;
  return shiprocketService.getETA(context);
}

export async function assignAWB(shipmentId) {
  if (!isDeliveryModuleEnabled()) return null;
  return shiprocketService.assignAWB(shipmentId);
}

export async function generateLabel(shipmentId) {
  if (!isDeliveryModuleEnabled()) return null;
  return shiprocketService.generateLabel(shipmentId);
}

export async function schedulePickup(shipmentId) {
  if (!isDeliveryModuleEnabled()) return null;
  return shiprocketService.schedulePickup(shipmentId);
}

export function normalizeShiprocketStatus(rawStatus) {
  return shiprocketService.mapStatus(rawStatus);
}

export async function markBroadcastAssigned({ orderId, winnerDeliveryId }) {
  if (!isDeliveryModuleEnabled()) return null;
  const { markLatestBroadcastAssigned } = await import("./internal/deliveryAssignmentStore.js");
  return markLatestBroadcastAssigned({ orderId, winnerDeliveryId });
}
```

---

## 6. Shipment Creation Workflow

```
Order Confirmed
        │
        ▼
Create Shiprocket Order
  (via deliveryShipmentQueue)
        │
        ▼
Generate Shipment
  (shiprocketService.createShipment)
        │
        ▼
Assign AWB
  (shiprocketService.assignAWB)
        │
        ▼
Pickup Scheduled
  (shiprocketService.schedulePickup)
        │
        ▼
Track Shipment
  (webhook-primary / polling-fallback)
        │
        ▼
Webhook Updates
  (shiprocketWebhookProcessor)
        │
        ▼
Delivered / Cancelled
```

There is **no second provider, no fallback chain, no auto-selection logic**.

**Context object** passed to every Shiprocket service method:

```js
{
  orderId,
  orderMongoId,
  pickup: { name, phone, address, lat, lng, pincode },
  drop:   { name, phone, address, lat, lng, pincode },
  items:  [{ name, qty, weight, value }],
  paymentMode:   "COD" | "PREPAID",
  totalValue,
  weight,
  idempotencyKey,
}
```

**Processor flow** inside `shipmentCreationProcessor.js`:

```
[deliveryShipmentQueue] ← Bull job enqueued by orderWorkflowService
        │
        ▼
[shipmentCreationProcessor]
  1. Idempotency check (idempotencyService)
  2. shiprocketService.createShipment(context)
  3. shiprocketService.assignAWB(shiprocketShipmentId)
  4. shiprocketService.schedulePickup(shiprocketShipmentId)
  5. shiprocketService.generateLabel(shiprocketShipmentId)
  6. Save / update DeliveryShipment record
  7. Update DeliveryAssignment: awbCode, trackingUrl, labelUrl, courierName
  8. Emit socket: shipment:created → customer
  9. On failure → retry with exponential backoff (max 3 attempts)
     → If all attempts exhausted: mark SHIPMENT_FAILED, notify admin, stop retrying
```

---

## 7. Webhook Handling Architecture

### Endpoint

```
POST /api/delivery/shiprocket/webhook
```

There is a single, dedicated Shiprocket webhook endpoint. No generic `/:provider` routing.

### Processing Flow

```
POST /api/delivery/shiprocket/webhook
        │
        ├── Raw body captured (before JSON parse — required for HMAC verification)
        ├── shiprocketWebhookParser.verifyWebhookSignature(rawBody, headers)
        ├── Idempotency check on Shiprocket event ID
        │
        ▼
[deliveryWebhookQueue] ← enqueued immediately; 200 OK returned to Shiprocket
        │
        ▼
[shiprocketWebhookProcessor]
  1. shiprocketWebhookParser.parseWebhookPayload(rawBody, headers)
     → { orderId, awbCode, currentStatus, location, eta, meta }
  2. normalizeShiprocketStatus(currentStatus)
     → canonical WORKFLOW_STATUS
  3. Append to DeliveryShipment.webhookLog + timeline
  4. IF status changed → call appropriate orderWorkflowService handler
  5. Emit realtime socket: order:tracking_update → customer room
```

**Critical:** Always return `200 OK` to Shiprocket within 3 seconds. All heavy processing is queued.

```js
// app/modules/delivery/webhooks/shiprocketWebhookRoute.js
router.post(
  "/shiprocket/webhook",
  express.raw({ type: "*/*" }),           // MUST be before express.json()
  shiprocketWebhookRateLimiter,
  async (req, res) => {
    const valid = shiprocketWebhookParser.verifyWebhookSignature(req.body, req.headers);
    if (!valid) {
      logger.warn({ domain: "delivery" }, "Shiprocket webhook signature invalid");
      return res.status(401).end();
    }

    const idemKey = `webhook:shiprocket:${req.headers["x-shiprocket-event-id"]}`;
    const duplicate = await idempotencyService.check(idemKey);
    if (duplicate) return res.status(200).end();  // idempotent no-op

    await deliveryWebhookQueue.add({
      rawBody: req.body.toString(),
      headers: req.headers,
    });

    await idempotencyService.store(idemKey, true, 86400);
    res.status(200).end();
  }
);
```

---

## 8. Shiprocket Client — Token Management & Rate Limiting

```js
// app/modules/delivery/providers/shiprocket/shiprocketClient.js

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";
const RATE_LIMIT = { rpm: 500, windowMs: 60_000 };

class ShiprocketClient {
  // ── Token Management ──────────────────────────────────────────────────────

  async getToken() {
    const stored = await ShiprocketTokenStore.findOne();
    if (stored && stored.expiresAt > new Date()) return stored.accessToken;
    return this.refreshToken();
  }

  async refreshToken() {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email:    process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    });
    const token = res.data.token;
    await ShiprocketTokenStore.findOneAndUpdate(
      {},
      { accessToken: token, expiresAt: addHours(new Date(), 23), updatedAt: new Date() },
      { upsert: true, new: true }
    );
    return token;
  }

  // ── Rate Limiting ─────────────────────────────────────────────────────────

  async checkRateLimit() {
    const key = "ratelimit:shiprocket";
    const count = await redis.incr(key);
    if (count === 1) await redis.pexpire(key, RATE_LIMIT.windowMs);
    if (count > RATE_LIMIT.rpm) {
      throw new ShiprocketError("RATE_LIMITED", "Shiprocket rate limit exceeded");
    }
  }

  // ── Core Request ──────────────────────────────────────────────────────────

  async request(method, path, data) {
    await this.checkRateLimit();
    const token = await this.getToken();
    try {
      const response = await axios({
        method,
        url: BASE_URL + path,
        data,
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      if (err.response?.status === 401) {
        // Force token refresh and retry once
        await ShiprocketTokenStore.deleteOne({});
        const freshToken = await this.refreshToken();
        return axios({
          method,
          url: BASE_URL + path,
          data,
          headers: { Authorization: `Bearer ${freshToken}` },
        }).then(r => r.data);
      }
      throw new ShiprocketError("REQUEST_FAILED", err.message, err.response?.data);
    }
  }

  // ── API Methods ───────────────────────────────────────────────────────────

  async createOrder(payload)          { return this.request("POST", "/orders/create/adhoc", payload); }
  async createShipment(orderId)       { return this.request("POST", "/shipments", { order_id: orderId }); }
  async assignAWB(shipmentId)         { return this.request("POST", "/courier/assign/awb", { shipment_id: shipmentId }); }
  async schedulePickup(shipmentIds)   { return this.request("POST", "/courier/generate/pickup", { shipment_id: shipmentIds }); }
  async generateLabel(shipmentIds)    { return this.request("POST", "/courier/generate/label", { shipment_id: shipmentIds }); }
  async cancelOrder(orderIds)         { return this.request("POST", "/orders/cancel", { ids: orderIds }); }
  async trackShipment(awbCode)        { return this.request("GET",  `/courier/track/awb/${awbCode}`); }
  async ping()                        { return this.request("GET",  "/settings/company/selfinfo"); }
}

export const shiprocketClient = new ShiprocketClient();
```

---

## 9. Shiprocket Status Mapping

```js
// app/modules/delivery/providers/shiprocket/shiprocketStatusMap.js

import { WORKFLOW_STATUS } from "../../deliveryStatusMapping.js";

export const SHIPROCKET_STATUS_MAP = {
  "PICKUP SCHEDULED":        WORKFLOW_STATUS.DELIVERY_ASSIGNED,
  "OUT FOR PICKUP":          WORKFLOW_STATUS.DELIVERY_ASSIGNED,
  "PICKUP ERROR":            WORKFLOW_STATUS.DELIVERY_FAILED,
  "PICKUP COMPLETE":         WORKFLOW_STATUS.OUT_FOR_DELIVERY,
  "OUT FOR DELIVERY":        WORKFLOW_STATUS.OUT_FOR_DELIVERY,
  "DELIVERED":               WORKFLOW_STATUS.DELIVERED,
  "UNDELIVERED":             WORKFLOW_STATUS.DELIVERY_FAILED,
  "MISROUTED":               WORKFLOW_STATUS.DELIVERY_FAILED,
  "RTO INITIATED":           WORKFLOW_STATUS.RETURN_INITIATED,
  "RTO IN TRANSIT":          WORKFLOW_STATUS.RETURN_INITIATED,
  "RTO DELIVERED":           WORKFLOW_STATUS.RETURNED,
  "CANCELLED":               WORKFLOW_STATUS.CANCELLED,
  "LOST":                    WORKFLOW_STATUS.DELIVERY_FAILED,
};

/**
 * Maps a raw Shiprocket status string to a canonical WORKFLOW_STATUS.
 * Returns null if the status is unrecognised.
 * Callers must handle null: do NOT transition order state, store raw status in timeline.
 */
export function mapShiprocketStatus(rawStatus) {
  if (!rawStatus) return null;
  return SHIPROCKET_STATUS_MAP[rawStatus.toUpperCase()] ?? null;
}
```

> **Rule:** If `null` is returned, **do not** transition order state. Store the raw status string in `DeliveryShipment.timeline` and emit a log warning for ops visibility.

---

## 10. Retry Strategy & Failure Escalation

### Bull Queue Configuration

```js
// app/queues/deliveryQueues.js

export const deliveryShipmentQueue = new Bull("delivery:shipment", {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },  // 5s → 10s → 20s
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const deliveryCancellationQueue = new Bull("delivery:cancellation", {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const deliveryWebhookQueue = new Bull("delivery:webhook", {
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "fixed", delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
});

export const deliveryTrackingQueue = new Bull("delivery:tracking", {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10_000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});
```

> There is no provider-selection queue. All queues exist exclusively for Shiprocket operations.

### Failure Escalation Matrix

| Failure | Action |
|---|---|
| Shipment creation fails — attempt 1/2 | Exponential backoff retry |
| Shipment creation fails — all 3 attempts | Mark `DeliveryShipment.status = "failed"`, set `failureReason`, notify admin via alert, **stop retrying** |
| Webhook signature invalid | Log `WARN` + return `401`. Never enqueue. |
| Webhook event duplicated | Idempotency check returns hit — silent no-op, return `200` |
| Status map returns `null` | Log `WARN`, store raw status in `timeline`, skip workflow transition |
| Shiprocket 401 | Refresh token → retry original call once. If still 401 → fail job |
| Rate limit exceeded (`429`) | Delay job (fixed 60 s) → retry. Count toward attempt budget. |
| AWB assignment fails | Retry job; if all attempts exhausted → log alert, mark `awb_assignment_failed` |
| Cancellation fails | Mark `cancellation_pending`, retry job; if stuck > 30 min → alert admin |
| Shiprocket goes down mid-delivery | Show last known status to customer; polling job retries at configured interval |

**There is no fallback to another provider at any stage.**

---

## 11. Idempotency Protection

Leverage the existing `idempotencyService.js` for all Shiprocket operations:

| Operation | Idempotency Key Pattern | TTL |
|---|---|---|
| Shipment creation | `shipment:create:{orderId}` | 24 h |
| Shipment cancellation | `shipment:cancel:{orderId}` | 24 h |
| AWB assignment | `shipment:awb:{shiprocketShipmentId}` | 24 h |
| Pickup schedule | `shipment:pickup:{shiprocketShipmentId}` | 24 h |
| Label generation | `shipment:label:{shiprocketShipmentId}` | 24 h |
| Webhook event | `webhook:shiprocket:{eventId}` | 24 h |
| Delivery accept | `idem:delivery_accept:{orderId}:{key}` ✅ already done | — |

```js
// In shipmentCreationProcessor.js
const idemKey = `shipment:create:${orderId}`;
const existing = await idempotencyService.check(idemKey);
if (existing) return existing.result;   // Shiprocket already created — return cached result

const result = await shiprocketService.createShipment(context);
await idempotencyService.store(idemKey, result, 86400);   // 24 h TTL
```

---

## 12. Live Tracking & ETA

### Hybrid Approach: Webhooks (primary) + Polling (fallback)

```
Shiprocket sends webhook → shiprocketWebhookProcessor → update DeliveryShipment.timeline
                                                       → emit socket: order:tracking_update

Polling fallback (when Shiprocket webhook is silent > configured interval):
[deliveryTrackingQueue] — scheduled Bull job per active shipment
  → shiprocketClient.trackShipment(awbCode)
  → diff against DeliveryShipment.currentStatus
  → if changed → update DB + emit socket
```

**Polling schedule config:**

```js
// Enqueue once per shipment when AWB is assigned; repeat until delivered or cancelled
await deliveryTrackingQueue.add(
  { orderId, awbCode },
  {
    repeat: { every: 120_000 },          // every 2 minutes while in transit
    jobId:  `track:${orderId}`,          // prevents duplicate poll jobs
    removeOnComplete: true,
  }
);

// In shiprocketWebhookProcessor — stop polling when terminal status received:
if (["DELIVERED", "CANCELLED", "RTO DELIVERED"].includes(canonicalStatus)) {
  const job = await deliveryTrackingQueue.getJob(`track:${orderId}`);
  await job?.remove();
}
```

### ETA Socket Push

```js
// Push ETA update to customer only when ETA shifts by more than 5 minutes
if (Math.abs(newEtaMinutes - previousEtaMinutes) > 5) {
  emitToCustomer(customerId, {
    event: "order:eta_update",
    payload: { orderId, etaMinutes: newEtaMinutes, etaTimestamp },
  });
}
```

---

## 13. Security

| Concern | Implementation |
|---|---|
| Webhook signature | HMAC-SHA256 verification with `SHIPROCKET_WEBHOOK_SECRET` before any processing |
| Secrets | `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_WEBHOOK_SECRET` stored in `.env` / secrets manager — never logged or committed |
| Webhook raw body | `express.raw({ type: "*/*" })` applied **only** to the Shiprocket webhook route, not globally |
| Inbound webhook IPs | Whitelist Shiprocket IP ranges in nginx / cloud firewall if available |
| Token storage | `ShiprocketTokenStore` — token value never written to structured logs |
| Input validation | Validate `orderId` from webhook payload against DB before processing |
| Webhook replay protection | Idempotency check on Shiprocket event ID — duplicates are silently discarded |
| Log redaction | Redact `accessToken` and `password` from all structured log output |
| Error exposure | Webhook endpoint never returns internal error details — always `200` or `401` |
| Token proactive rotation | Scheduled job refreshes token at hour 23 of the 24 h window, not reactively on `401` |

```js
// Webhook HMAC verification
// app/modules/delivery/providers/shiprocket/shiprocketWebhookParser.js

export function verifyWebhookSignature(rawBody, headers) {
  const secret    = process.env.SHIPROCKET_WEBHOOK_SECRET;
  const signature = headers["x-shiprocket-signature"];
  if (!signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

---

## 14. Decoupling `orderWorkflowService.js`

**Current problem:** `orderWorkflowService.js` directly imports `deliveryAssignmentStore.js`, which is an internal delivery module concern.

**Fix:** Route all delivery interactions through `deliveryManager.js` only:

```js
// BEFORE (tight coupling):
import { markLatestBroadcastAssigned } from "../modules/delivery/internal/deliveryAssignmentStore.js";

// AFTER (loose coupling via manager facade):
import { markBroadcastAssigned } from "../modules/delivery/deliveryManager.js";
```

Also extract `deliveryBroadcastPayloadFromOrder()` out of `orderWorkflowService.js`:

```js
// Move to: app/modules/delivery/internal/deliveryBroadcastPayload.js
// Import in orderWorkflowService.js via deliveryManager.js facade only

// deliveryManager.js:
export function buildDeliveryBroadcastPayload(order, deliveryContext) {
  const { buildPayload } = require("./internal/deliveryBroadcastPayload.js");
  return buildPayload(order, deliveryContext);
}
```

After this change, `orderWorkflowService.js` has **zero direct imports** from any delivery submodule — only from `deliveryManager.js`.

---

## 15. Real-time Updates via Sockets

### Customer-Facing Tracking Events

```js
// Emitted to room: `order:${orderId}`

socket.emit("order:tracking_update", {
  orderId,
  status:         canonicalStatus,             // e.g. "OUT_FOR_DELIVERY"
  currentStatus:  "Out For Delivery",          // raw Shiprocket string for display
  awbCode,
  courierName,
  location:       { lat, lng, label },
  etaMinutes:     12,
  timeline:       [{ status, timestamp, location }],
  trackingUrl,
});

socket.emit("order:eta_update",  { orderId, etaMinutes, etaTimestamp });
socket.emit("order:delivered",   { orderId, deliveredAt });
socket.emit("order:rto_initiated", { orderId, initiatedAt });
```

### Admin / Seller Dashboard

```js
// Emitted to room: `seller:${sellerId}` and admin room

socket.emit("delivery:status_change", {
  orderId, awbCode, courierName,
  oldStatus, newStatus, timestamp,
});

socket.emit("delivery:alert", {
  type:    "shipment_failed" | "rate_limited" | "token_expired" | "cancellation_pending",
  orderId,
  message: String,
});
```

### Integration in `shiprocketWebhookProcessor.js`

```js
import { emitToCustomer } from "../../services/orderSocketEmitter.js";
import { emitToSeller }   from "../../services/orderSocketEmitter.js";

// After status transition confirmed:
await emitToCustomer(customerId, { event: "order:tracking_update", payload });
await emitToSeller(sellerId,     { event: "delivery:status_change", payload });
```

---

## 16. Logging & Observability

Use the existing `logger.js` (structured logging) with Shiprocket-specific metadata:

```js
// Standard log shape for all Shiprocket operations
logger.info({
  domain:      "delivery",
  provider:    "shiprocket",
  orderId,
  awbCode:     shipment.awbCode,
  operation:   "createShipment",
  durationMs:  Date.now() - start,
  status:      "success",
});

logger.error({
  domain:    "delivery",
  provider:  "shiprocket",
  orderId,
  operation: "createShipment",
  attempt:   job.attemptsMade,
  error:     err.message,
  code:      err.code,
});
```

### Prometheus Metrics (extend existing `metrics.js`)

```js
delivery_shipment_created_total{status}            // counter: "success" | "failed"
delivery_shipment_cancelled_total{status}
delivery_awb_assigned_total{status}
delivery_pickup_scheduled_total{status}
delivery_webhook_received_total{status}            // "processed" | "invalid_sig" | "duplicate"
delivery_webhook_processing_ms                     // histogram
delivery_shiprocket_api_latency_ms{operation}      // histogram: createOrder, assignAWB, etc.
delivery_token_refresh_total{status}               // "success" | "failed"
delivery_queue_depth{queue}                        // gauge: shipment, cancellation, webhook, tracking
```

### Health Check (extend existing `healthCheck.js`)

```js
{ name: "delivery:shiprocket", check: () => shiprocketClient.ping() }
{ name: "delivery:token",      check: async () => {
    const t = await ShiprocketTokenStore.findOne();
    return t && t.expiresAt > new Date();
  }
}
```

---

## 17. Testing Strategy

### Unit Tests

```js
// __tests__/delivery/shiprocketService.test.js
describe("ShiprocketService", () => {
  it("createShipment returns shiprocketOrderId, shiprocketShipmentId, awbCode, trackingUrl");
  it("cancelShipment returns { cancelled: true }");
  it("getTrackingInfo returns currentStatus and events[]");
  it("assignAWB returns awbCode and courierName");
  it("schedulePickup returns { pickupScheduled: true, scheduledAt }");
  it("generateLabel returns labelUrl");
  it("mapStatus correctly maps all known Shiprocket statuses");
  it("mapStatus returns null for unrecognised status without throwing");
  it("handles 401 by refreshing token and retrying the request once");
  it("throws ShiprocketError with code RATE_LIMITED when RPM exceeded");
});

// __tests__/delivery/shiprocketWebhookParser.test.js
describe("shiprocketWebhookParser", () => {
  it("verifyWebhookSignature accepts a valid HMAC-SHA256 signature");
  it("verifyWebhookSignature rejects a tampered payload");
  it("parseWebhookPayload extracts orderId, awbCode, and currentStatus");
  it("parseWebhookPayload handles missing optional fields gracefully");
});
```

### Integration Tests

```js
// __tests__/delivery/shiprocketWebhookProcessor.test.js
describe("shiprocketWebhookProcessor", () => {
  it("transitions order to OUT_FOR_DELIVERY on PICKUP COMPLETE webhook");
  it("transitions order to DELIVERED on DELIVERED webhook");
  it("ignores a duplicate webhook (idempotency check)");
  it("stores an unmapped status in DeliveryShipment.timeline without crashing");
  it("emits order:tracking_update socket event after a status transition");
  it("stops the tracking poll job when a terminal status is received");
});

// __tests__/delivery/deliveryQueues.test.js
describe("deliveryShipmentQueue", () => {
  it("retries up to 3 times with exponential backoff on Shiprocket API failure");
  it("marks shipment as failed and notifies admin after all retries exhausted");
  it("does not retry after a successful creation (idempotency)");
});
```

### Webhook Simulation Script

```js
// scripts/simulateShiprocketWebhook.js — for local / staging testing
import axios  from "axios";
import crypto from "crypto";

const SAMPLE_PAYLOADS = {
  "PICKUP COMPLETE":   { awb_code: "SR123456", current_status: "PICKUP COMPLETE",   order_id: "ORD-001" },
  "OUT FOR DELIVERY":  { awb_code: "SR123456", current_status: "OUT FOR DELIVERY",  order_id: "ORD-001" },
  "DELIVERED":         { awb_code: "SR123456", current_status: "DELIVERED",         order_id: "ORD-001" },
  "CANCELLED":         { awb_code: "SR123456", current_status: "CANCELLED",         order_id: "ORD-001" },
  "RTO INITIATED":     { awb_code: "SR123456", current_status: "RTO INITIATED",     order_id: "ORD-001" },
};

async function simulate(orderId, statusKey) {
  const payload    = { ...SAMPLE_PAYLOADS[statusKey], order_id: orderId };
  const body       = JSON.stringify(payload);
  const eventId    = `sim-${Date.now()}`;
  const signature  = crypto
    .createHmac("sha256", process.env.SHIPROCKET_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  await axios.post("http://localhost:3000/api/delivery/shiprocket/webhook", body, {
    headers: {
      "Content-Type":              "application/json",
      "x-shiprocket-signature":    signature,
      "x-shiprocket-event-id":     eventId,
    },
  });

  console.log(`✅ Simulated [${statusKey}] for order ${orderId}`);
}

simulate(process.argv[2], process.argv[3]);
// Usage: node scripts/simulateShiprocketWebhook.js ORD-001 "OUT FOR DELIVERY"
```

### Mock Provider for Test Environment

```js
// app/modules/delivery/providers/shiprocket/shiprocketServiceMock.js
// Used only when DELIVERY_PROVIDER=mock (test / CI environment)

export const shiprocketServiceMock = {
  async createShipment(ctx) {
    return {
      shiprocketOrderId:    "MOCK-SR-ORDER-001",
      shiprocketShipmentId: "MOCK-SR-SHIP-001",
      awbCode:              "MOCK-AWB-001",
      courierName:          "MockCourier",
      trackingUrl:          "https://mock.tracking/MOCK-AWB-001",
      labelUrl:             "https://mock.labels/MOCK-AWB-001.pdf",
    };
  },
  async cancelShipment()    { return { cancelled: true }; },
  async getTrackingInfo()   { return { currentStatus: "OUT FOR DELIVERY", events: [] }; },
  async getETA()            { return { etaMinutes: 15, etaTimestamp: new Date(Date.now() + 15 * 60_000) }; },
  async assignAWB()         { return { awbCode: "MOCK-AWB-001", courierName: "MockCourier" }; },
  async generateLabel()     { return { labelUrl: "https://mock.labels/MOCK-AWB-001.pdf" }; },
  async schedulePickup()    { return { pickupScheduled: true, scheduledAt: new Date() }; },
  mapStatus:                (s) => SHIPROCKET_STATUS_MAP[s] ?? null,
  verifyWebhookSignature:   () => true,
  parseWebhookPayload:      (raw) => JSON.parse(raw),
  async refreshToken()      { return; },
};
```

---

## 18. Common Edge Cases & Failure Scenarios

| Scenario | Handling |
|---|---|
| Shiprocket creates order but DB write fails | Idempotency key prevents duplicate order on retry |
| Webhook arrives before `createShipment` completes | Buffered in `DeliveryShipment.webhookLog`; processed on next poll cycle |
| Two webhooks arrive out of order | Timeline stores all events; status only advances forward (no regression) |
| Shiprocket returns empty AWB | Retry AWB assignment job; log alert; do not emit tracking URL to customer |
| `orderId` in webhook does not match any DB order | Log + discard; never return `500` |
| Customer cancels while shipment is in transit | `shiprocketService.cancelShipment()` → if Shiprocket rejects → mark `cancellation_pending` → alert ops |
| Shiprocket API is down | Retry with exponential backoff; if all attempts exhausted → `shipment_failed` alert; show "Tracking unavailable" on frontend |
| Shipment delivered but no webhook received | Polling job (`deliveryTrackingQueue`) catches the status change via `trackShipment()` |
| Duplicate `DELIVERED` webhook | Idempotency on event ID — second call is a silent no-op |
| Shiprocket token expiry during a request | Client catches `401`, deletes stored token, calls `refreshToken()`, retries request once |
| Label URL unavailable at creation time | Enqueue a separate label generation job; retry up to 3 times |

---

## 19. Scalability & Performance

- **All Shiprocket HTTP calls are async via Bull queues** — request cycle is never blocked
- **Polling is opt-in per shipment** — one Bull job per AWB, not a global cron
- **Webhook endpoint returns `200 OK` immediately** — heavy processing is queued
- **Token is cached in `ShiprocketTokenStore`** — no per-request auth round-trip
- **Redis sliding-window rate limiter** prevents `429` errors that exhaust retry budget
- **`DeliveryShipment.timeline` is append-only** — no index contention on concurrent updates
- **Socket events are fire-and-forget** — delivery workflow never awaits socket confirmation
- **Idempotency keys have 24 h TTL** — Redis memory stays bounded
- Future: Consider event sourcing for `DeliveryShipment.timeline` if audit requirements grow

---

## 20. Implementation Roadmap

### Phase 1 — Shiprocket Foundation (Week 1–2) 🏗️

- [ ] Implement `ShiprocketTokenStore` model (single-document, upsert)
- [ ] Implement `shiprocketClient.js` with token management and rate limiting
- [ ] Add Shiprocket fields to `DeliveryAssignment` schema (additive, backward-compatible)
- [ ] Create `DeliveryShipment` model
- [ ] Create `deliveryQueues.js` with all four Bull queue definitions
- [ ] Populate `shiprocketStatusMap.js` with all known Shiprocket status strings
- [ ] Update `deliveryStatusMapping.js` to delegate to `mapShiprocketStatus()`
- [ ] Write `shiprocketServiceMock.js` for test-environment parity
- [ ] Configure `DELIVERY_PROVIDER=shiprocket` in environment; update `deliveryFlags.js`

### Phase 2 — Shipment APIs (Week 2–3) 🚀

- [ ] Implement `ShiprocketService.createShipment()` end-to-end (order → shipment → AWB → pickup → label)
- [ ] Implement `ShiprocketService.cancelShipment()`
- [ ] Implement `ShiprocketService.getTrackingInfo()`
- [ ] Implement `ShiprocketService.getETA()`
- [ ] Add all new methods to `deliveryManager.js` facade
- [ ] Wire `deliveryShipmentQueue` processor to `orderWorkflowService`
- [ ] Wire `deliveryCancellationQueue` processor
- [ ] Idempotency guards on all shipment operations
- [ ] Unit tests for all `ShiprocketService` methods

### Phase 3 — Webhooks & Status Sync (Week 3–4) 🔗

- [ ] Implement `shiprocketWebhookParser.js` (HMAC verification + payload parsing)
- [ ] Create `POST /api/delivery/shiprocket/webhook` route with raw-body middleware
- [ ] Implement `shiprocketWebhookProcessor.js` — status mapping → workflow transition → socket emit
- [ ] Decouple `orderWorkflowService.js`: remove direct `deliveryAssignmentStore` import
- [ ] Extract `deliveryBroadcastPayload.js` from `orderWorkflowService.js`
- [ ] Implement `shiprocketTrackingPoller.js` as `deliveryTrackingQueue` fallback
- [ ] Stop polling jobs on terminal webhook status
- [ ] Integration tests for webhook processor (all status paths + idempotency)
- [ ] Webhook simulation script for staging validation

### Phase 4 — Monitoring, Testing & Production Hardening (Week 5–6) 🛡️

- [ ] Prometheus metrics for all operations (shipment, cancellation, webhook, token, queue depth)
- [ ] Extend `healthCheck.js` with Shiprocket client ping and token validity check
- [ ] Proactive token rotation scheduler (refresh at hour 23, before expiry)
- [ ] Structured delivery log fields across all processors
- [ ] Full integration test suite (webhook, tracking, idempotency, failure escalation)
- [ ] Load test: 1 000 concurrent shipment creation jobs through `deliveryShipmentQueue`
- [ ] Grafana dashboard: API latency, shipment success/failure rate, webhook processing time, queue depth
- [ ] Runbook: Shiprocket API down, token expired, webhook signature failure, shipment stuck in `cancellation_pending`
- [ ] Admin alert integrations: Slack / PagerDuty for `shipment_failed` and `cancellation_pending` states
- [ ] Final end-to-end staging validation with live Shiprocket sandbox credentials
