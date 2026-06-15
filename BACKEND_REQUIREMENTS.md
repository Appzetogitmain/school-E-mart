# School E-Mart — Backend Requirement Specification (BRS)

> **Source:** Reverse-engineered from the React 19 + Vite frontend in `frontend/src` (185 `.jsx/.js` files).
> **Generated:** Static scan only. No code in the repository was modified.
> **State of the frontend:** Almost the entire app is wired with mock data, `localStorage`, and `setTimeout`-based fake APIs. Exactly **one** real Axios call exists today (`GET /vendor/orders` in `frontend/src/features/vendor/VendorOrders.jsx`). Every other API listed below is **inferred** from the mock interactions, forms, redirects, and success/error flows present in the UI.

---

## 1. Global Architecture & Conventions

### 1.1 Tech & runtime
- React 19 + Vite 8, React Router v7, Zustand (with `persist`) for auth, Axios for HTTP, Tailwind 4.
- Auth client: `frontend/src/services/apiClient.js`.
- API base URL: `import.meta.env.VITE_API_URL` (defaults to `http://localhost:5000/api`) from `frontend/src/config/env.js`.
- Auth header on every request: `Authorization: Bearer <token>` (token from Zustand `useAuthStore`).
- Global 401 handler: clears auth state and redirects to `/login`.

### 1.2 Recommended API conventions
- All endpoints under base path `/api/v1`.
- JSON request/response, `application/json`.
- JWT bearer auth on every protected endpoint; refresh endpoint optional (frontend does not currently refresh).
- Standard error envelope used by `frontend/src/utils/errorHandler.js`:

```json
{ "message": "Human readable error", "code": "OPTIONAL_CODE", "errors": { "field": "..." } }
```
- Status code conventions: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `500` internal.

### 1.3 Roles (constants from `frontend/src/constants/roles.js`)
| Code | Source | Capability scope |
|---|---|---|
| `parent` | `AppAuthPage.jsx`, `ProfileSetupPage.jsx` | Mobile app shopper, child profile owner |
| `school` | `SchoolAuthPage.jsx` (admin tab) | Institutional buyer, school administration |
| `teacher` | `SchoolAuthPage.jsx` (teacher tab) | Class/attendance/homework/diary author |
| `vendor` | `VendorLogin.jsx` | Catalog, orders, quotations, payouts |
| `admin` (Super Admin) | `SuperAdminLogin.jsx` | Full platform administration |

`ROLES` only enumerates `admin`, `vendor`, `school`. Parent and Teacher are derived from the `user.role` value stored in `localStorage:childInfo`.

### 1.4 Reference ID format conventions (used everywhere in the UI)
- Parent: `SEM-P-XXXXXX`
- School Admin: `SEM-S-XXXXXX` / `SEM-ADM-XXXXXX`
- Teacher: `SEM-TCH-XXXXXX`
- Vendor: `SEM-VEN-XXXXXX`
- Super Admin: `SEM-SADM-XXXX`
- Referral code (parent): `EMART\d{4}` (regex enforced in `ReferEarnPage.jsx`).
- Order IDs: 8-digit numeric or `ORD<long-timestamp>` (Super Admin lists).
- RFQ IDs: `REQ-YYYY-NN`, Draft IDs: `DR-YYYY-NNNN`, Kit IDs: `KIT-YYYY-NNN`, Vendor IDs: `VND-YYYY-NNN`.

### 1.5 Global persistent client storage (today)
- `auth-storage` — Zustand persist (`{ user, token, isAuthenticated }`).
- `childInfo` — primary user/profile blob: `{ name, school, grade, phone, email, refId, role, photo, address, pinCode, city, state, country, altPhone, schoolRefNo, progress }`.
- `cart` — array `[{ id, name, price, image, quantity, weight? }]`.
- `wishlist` — array of product objects.
- `referral_code` — `EMARTxxxx`.
- `teacherProfileDetails`, `teacherStudentsList`, `teacherHomework`, `teacherDiaryNotes` — teacher-only local DB.
- `schoolSplashSeen`, `splashSeen` — UI flags.

All of these must be backed by server-side data once the backend lands.

---

## 2. Routes Inventory (from `frontend/src/routes/AppRoutes.jsx`)

### Public / web (`MainLayout`)
`/`, `/home`, `/about`, `/how-it-works`, `/category/:slug`, `/school-faq`, `/help-center`, `/track-order`, `/refund-policy`, `/shop-by-grade`, `/my-school`, `/terms-conditions`, `/privacy-policy`.

### Auth
`/login`, `/register`, `/vendor/login`, `/superadmin/login`, `/user/login`, `/user/signup`, `/school/login`, `/school/signup`.

### Parent mobile app (`/user/*`)
`home, categories, my-school, category/:categoryId, checkout, order-success, track-order/:orderId, orders, select-grade, products, product/:productId, kit/:kitId, cart, edit-profile, wishlist, notifications, contact, about, refer, wallet, attendance, homework, diary, notices, calendar, phonebook, reels, learning-hub, profile, terms, privacy`.

### School portal (`/school/*`)
`admin, send-notice, create-event, create-kit, create-request, draft-requests, teacher-approvals, more, students, vendors, quotations, kits, grade, categories, cart, edit-profile, change-password, wishlist, my-school, orders, category/:categoryName, notifications, products, refer, partner, wallet, contact, about, checkout, kit/:kitId`.

### Teacher portal (`/school/teacher/*`)
`dashboard, students, students/bulk, attendance, homework, diary, profile, notifications`.

### Vendor portal (`/vendor/*` — `RoleRoute([VENDOR])`)
`dashboard, orders, quotations, products, catalog, price-stock, payments, wallet, returns, profile, announcements, reports, settings, help-support`.

### Super Admin console (`/superadmin/*`)
`dashboard, category, header-category, product-list, vendor-list, vendor-location, wallet, withdrawals, vendor-transactions, users, notifications, faq, orders, orders-{pending,received,processed,shipped,out-for-delivery,delivered,cancelled,returned}, promo-home-section, reels, lms, promo-home-banners, setting-billing-charges, profile`.

---

## 3. Cross-cutting Backend Modules

### 3.1 Authentication & Identity
| Endpoint | Method | Purpose | Source UI |
|---|---|---|---|
| `/auth/parent/otp/request` | POST | Send 4-digit OTP to mobile (10-digit numeric, India). Body: `{ phone }` | `AppAuthPage.jsx` (Mobile + Send OTP) |
| `/auth/parent/otp/verify` | POST | Verify OTP and return `{ token, user }`. Body: `{ phone, otp }` | `AppAuthPage.jsx` (`Verify`) |
| `/auth/parent/signup` | POST | Profile setup: `{ phone, studentName, schoolRefNo?, grade, schoolId? }` → returns `{ token, user }` and unique `refId` (`SEM-P-…`) | `ProfileSetupPage.jsx` |
| `/auth/parent/web/register` | POST | Web parent register form: `{ studentName, mobile, otp, schoolName, schoolRefNo, role:'parent' }` | `features/auth/AuthPage.jsx` |
| `/auth/parent/web/login` | POST | Web parent login: `{ mobile, otp }` | `features/auth/AuthPage.jsx` |
| `/auth/school/admin/login` | POST | `{ email, password }` | `SchoolAuthPage.jsx` |
| `/auth/school/admin/signup` | POST | `{ schoolName, fullName, mobile, email, password }` → returns `refId` (`SEM-ADM-…`) | `SchoolAuthPage.jsx` |
| `/auth/school/teacher/login` | POST | `{ email, password }` | `SchoolAuthPage.jsx` |
| `/auth/school/teacher/signup` | POST | `{ fullName, mobile, email, schoolCode, password }` → returns `refId` (`SEM-TCH-…`) and `pending_approval` state | `SchoolAuthPage.jsx` + `SchoolTeacherApprovals.jsx` |
| `/auth/vendor/login` | POST | `{ email, password }` | `VendorLogin.jsx` |
| `/auth/vendor/signup` | POST | `{ name, storeName, phone, email, location, password }` → returns `refId` (`SEM-VEN-…`) | `VendorLogin.jsx` |
| `/auth/admin/login` | POST | Super admin `{ email, password }` | `SuperAdminLogin.jsx` |
| `/auth/forgot-password` | POST | Issue reset link/OTP | "Forgot?" links on vendor and super-admin login |
| `/auth/change-password` | POST | `{ currentPassword, newPassword }` — used by school admin & teacher | `SchoolChangePasswordPage.jsx`, `TeacherProfile.jsx` |
| `/auth/logout` | POST | Invalidate token | `ProfilePage.jsx` |
| `/auth/me` | GET | Re-hydrate `user` after refresh | (needed by `useAuthStore`) |

**Frontend validation rules to enforce on backend:**
- Mobile: exactly 10 numeric digits (`/\D/g` stripped client-side).
- OTP: 4 numeric digits (parent app), 6 numeric digits (web register form).
- Email: regex `\S+@\S+\.\S+` (web school auth).
- Password: ≥ 6 chars (school auth) and "≥ 8 chars + number + special char" (school change password).
- Password and confirm-password must match on signup and change.
- All sign-up payloads should idempotently return the role-specific `refId`.

### 3.2 Profile Management
| Endpoint | Method | Purpose | Source UI |
|---|---|---|---|
| `/users/me` | GET / PATCH | Read & update current user. Parent body: `{ name, email, phone, altPhone, address, pinCode, city, state, country, photo(base64/file) }` | `EditProfilePage.jsx`, `SchoolEditProfilePage.jsx`, `TeacherProfile.jsx`, `VendorProfile.jsx`, `AdminProfileManagement.jsx` |
| `/users/me/avatar` | POST (multipart) | Upload profile photo. **Client-side max 2MB** | `EditProfilePage.jsx` |
| `/users/me/children` | GET/POST/PUT/DELETE | Child sub-profiles (currently single-child mock). Each child: `{ name, schoolId, school, grade, schoolRefNo, rollNo }` | `ProfileSetupPage.jsx`, `MySchoolPage.jsx` "Switch Child" |
| `/users/me/address/auto-resolve` | GET | Reverse-geocode helper for "Tap to Auto-fill" | `EditProfilePage.jsx#handleAutoFill` |
| `/teachers/me/details` | GET/PUT | Teacher extended profile: `{ fullName, dob, gender, maritalStatus, phone, email, altPhone, address, designation, qualification, experience, joiningDate, employeeId, avatar }` | `TeacherProfile.jsx` |
| `/vendors/me/profile` | GET/PUT | `{ name, storeName, phone, email, address, latitude, longitude, serviceRadius }` | `VendorProfile.jsx` |
| `/admin/profile` | GET/PUT | `{ firstName, lastName, email, mobile, role }` | `AdminProfileManagement.jsx` |

### 3.3 Reference Data / Lookups (read-only)
| Endpoint | Returns |
|---|---|
| `/lookups/schools` | `[{ id, name, code, address, city, state }]` — used by `ProfileSetupPage.jsx` and `features/auth/AuthPage.jsx` school dropdown |
| `/lookups/grades` | All 15 grades from Nursery → Class 12 + grouped `Pre-Primary / Primary / Secondary` (used by `SelectGradePage.jsx`) |
| `/lookups/sections` | Section A/B/C |
| `/lookups/subjects` | Mathematics, Science, English, Social Studies (Teacher Homework) |
| `/lookups/cities-pincodes` | Auto-fill address |
| `/lookups/categories/tree` | Header → category → subcategory tree (used by parent `CategoryPage`, school `Categories`, header bar) |
| `/lookups/academic-years` | `["2025-26","2026-27", …]` (`SchoolCreateRequest.jsx`) |

---

## 4. Feature-Wise Specification

For every feature: **Purpose**, **Forms & Fields**, **APIs (existing or inferred)**, **Validations**, **Roles**.

### 4.1 PUBLIC / MARKETING (Web)

#### 4.1.1 `/` Landing Home — `features/home/Home.jsx` + landing sections (`AppSection`, `FeaturedCategories`, `HowItWorksSection`, `WhyChooseSection`, `ShopByClass`, `TrustStrip`, `VideoSection`, `FinalCTASection`, `SEOContentSection`)
- **Purpose:** Pure marketing; CTAs into `/register`, `/login`, vendor onboarding modal.
- **Forms:** None.
- **APIs (inferred):**
  - `GET /content/landing/hero` — banners, copy.
  - `GET /content/landing/categories` — featured categories.
  - `GET /content/landing/testimonials`.
  - `GET /content/seo/{page}` — meta/JSON-LD.
- **Roles:** Public.

#### 4.1.2 `/home` Marketplace Home — `features/home/MarketplaceHome.jsx`
- **Purpose:** Logged-in marketplace front.
- **APIs:** `GET /catalog/home` (sections, categories, banners, recommended kits).

#### 4.1.3 `/category/:slug` Category Browse — `features/products/CategoryPage.jsx`, `features/products/Showcase.jsx`
- **APIs:** `GET /catalog/categories/:slug/products?filters=&sort=&page=` ; `GET /catalog/categories/:slug`.

#### 4.1.4 `/about`, `/how-it-works`, `/terms-conditions`, `/privacy-policy`, `/refund-policy`, `/school-faq`
- **Forms:** None (static).
- **APIs:** `GET /content/pages/{slug}` (CMS-style).

#### 4.1.5 `/help-center` — `features/help/HelpCenter.jsx`, `AccountManagerModal`
- **APIs:** `GET /content/faqs` ; `GET /support/account-manager`.
- **Validations:** FAQ accordion is local UI.

#### 4.1.6 `/track-order` — `features/orders/TrackOrder.jsx`
- **Form:** Single field `orderId` (no min length client-side; accepts any).
- **API:** `GET /orders/track/:orderId` → `{ id, date, status, currentLocation, estimatedDelivery, steps[] }`.
- **Roles:** Public (with optional auth).

#### 4.1.7 `/shop-by-grade` — `features/products/GradeProductsPage.jsx`
- **API:** `GET /catalog/products?grade=:grade`.

#### 4.1.8 `VendorContactModal` — public "Sell with Us" lead form
- **Fields:** `name*, businessName*, category* (uniforms|books|furniture|labs|tech|sports), phone*, email*, message`.
- **API:** `POST /leads/vendor-onboarding`.
- **Validations:** `required` HTML5, email type, tel type. Backend should rate-limit.

---

### 4.2 PARENT (Mobile App `/user/*`)

#### 4.2.1 Auth & Onboarding
| Screen | Forms | Fields | APIs | Validations |
|---|---|---|---|---|
| `AppAuthPage.jsx` (login) | Mobile + OTP | `phone (10 digits)`, `otp (4 digits)` | `/auth/parent/otp/request`, `/auth/parent/otp/verify` | Strip non-digits, length checks, OTP TTL on backend |
| `ProfileSetupPage.jsx` (signup) | Profile setup | `phone*`, `studentName*`, `schoolRefNo`, `grade*` | `/auth/parent/signup` | `phone.length===10`, `studentName non-empty`, `grade ∈ allGrades` |

After auth, client stores `childInfo` and routes to `/user/home`.

#### 4.2.2 Parent Home — `ParentHome.jsx`
- **Sections rendered:** Today at a Glance (attendance + pending homework summary), `RecentUpdates`, `QuickActions`, `ParentLearningHub`, `RecommendedKits`, Categories, `PromoCategoryBanners`, Essential Products, Uniforms, Stationery, `ReelsRow`.
- **APIs (inferred):**
  - `GET /parent/home/today-glance` → `{ attendance:{status,time}, homework:{pending,dueLabel} }`.
  - `GET /parent/notifications/banner` — top notification carousel.
  - `GET /parent/learning-hub/continue` (resume video).
  - `GET /parent/kits/recommended` (8.6 below).
  - `GET /catalog/categories` (icon row).
  - `GET /catalog/promo/category-banners` (4.5.8).
  - `GET /catalog/products?section=essentials&grade=:grade`.
  - `GET /reels?role=parent`.

#### 4.2.3 Categories — `CategoryPage.jsx`, `SubcategoryPage.jsx`
- **APIs:** `GET /catalog/categories`, `GET /catalog/categories/:categoryId/subcategories`.

#### 4.2.4 Select Grade — `SelectGradePage.jsx`
- **Form:** Click-only grade selector.
- **APIs:** `PUT /users/me/children/:id` to persist grade; navigates to `/user/products?grade=…`.

#### 4.2.5 Grade Products — `GradeProductsPage.jsx`
- **API:** `GET /catalog/products?grade=:grade&page=&sort=`.

#### 4.2.6 Product Details — `ProductDetailsPage.jsx`
- **Form/Actions:** size selector, quantity, add-to-cart, buy-now, wishlist toggle.
- **APIs:**
  - `GET /catalog/products/:productId` → `{ name, brand, price, originalPrice, category, rating, reviews, description, images[], sizes[], specs[] }`.
  - `GET /catalog/products/:productId/similar`.
  - `POST /wishlist/items` / `DELETE /wishlist/items/:productId`.
  - `POST /cart/items`, `PATCH /cart/items/:productId`.
- **Validations:** size required when adding to cart (UI defaults `28`).

#### 4.2.7 Kit Details — `KitDetailsPage.jsx`
- **API:** `GET /catalog/kits/:kitId` → `{ name, description, image, items[], addons[] }`.
- **Action:** Add selected items + add-ons to cart in single request: `POST /cart/items/batch`.

#### 4.2.8 Recommended Kits row — `RecommendedKits.jsx`
- **API:** `GET /parent/kits/recommended` (school + grade context).

#### 4.2.9 Cart — `CartPage.jsx`
- **APIs:**
  - `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`.
- **Pricing rules (currently hard-coded):** delivery fee = ₹49 if cart non-empty (parent); platform fee = ₹10. Server must drive these via `GET /pricing/charges` (also configured by Super Admin BillingCharges, §4.6.21).

#### 4.2.10 Checkout — `CheckoutPage.jsx`
- **Fields:** `deliveryType ('home'|'school')`, `paymentMethod ('online'|'cod')`, `gstin?` (Add GSTIN button).
- **APIs:**
  - `GET /users/me/addresses` (saved address) + `PUT /users/me/addresses/:id` (Edit button).
  - `POST /orders` body:
    ```json
    { "items": [...], "deliveryType": "home|school",
      "paymentMethod": "online|cod", "addressId": "...",
      "gstin": "?", "orderForSomeoneElse": false }
    ```
  - For `paymentMethod = online`: `POST /payments/initiate` returning `{ paymentSessionId, gateway, payload }`; `POST /payments/verify` for webhook return.
- **Validations:** address selected; delivery type selected; items non-empty.

#### 4.2.11 Order Success — `OrderSuccessPage.jsx`
- **State:** receives `{ orderId, city, address, paymentMethod, subtotal, shipping, totalAmount, itemsCount }` from checkout navigation; should be sourced from `GET /orders/:orderId`.

#### 4.2.12 Order History — `OrderHistoryPage.jsx`
- **API:** `GET /orders/me?status=&page=` returning `[{ id, status (ORDER PLACED|PENDING|DELIVERED|...), date, price, itemCount, items[] }]`.
- **Action "Order Again":** `POST /orders/:id/reorder`.

#### 4.2.13 Order Tracking — `OrderTrackingPage.jsx`
- **APIs:**
  - `GET /orders/:orderId` → bill summary, store info, payment, delivery address.
  - `GET /orders/:orderId/track` → status timeline + live location (map placeholder).
  - `POST /orders/:orderId/cancel` (only `before store accepts`).
- **External integration:** map provider (Google Maps / MapMyIndia) — backend should surface lat/lng to the client.

#### 4.2.14 Wishlist — `WishlistPage.jsx` + `WishlistContext`
- **APIs:** `GET /wishlist`, `POST /wishlist/items`, `DELETE /wishlist/items/:productId`.

#### 4.2.15 Notifications — `NotificationsPage.jsx`
- **Schema (mocked):** `{ id, title, message, type ('order'|'school'|'seller'|'admin'), isRead, createdAt, actionLink }`.
- **APIs:** `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id`.

#### 4.2.16 Edit Profile — `EditProfilePage.jsx`
- **Fields:** `fullName*`, `email`, `phone*`, `altPhone`, `address`, `pinCode`, `city`, `state`, `country`, `photo`.
- **API:** `PATCH /users/me`; `POST /users/me/avatar` (≤2MB).
- **Validations:** `fullName`, `phone` required; email must contain `@`.

#### 4.2.17 Profile — `ProfilePage.jsx`
- Display menu of links + logout (`POST /auth/logout`).

#### 4.2.18 Contact Us — `ContactUsPage.jsx`
- **Fields:** `name*, email*, phone, message*`.
- **API:** `POST /support/contact`.

#### 4.2.19 About Us — `AboutUsPage.jsx`
- Static; `GET /content/pages/about-parent`.

#### 4.2.20 Refer & Earn — `ReferEarnPage.jsx`
- **APIs:**
  - `GET /referrals/me` → `{ code, totalEarnings, monthlyEarnings, successfulReferrals, pendingReferrals }`.
  - `POST /referrals/share` (analytics event).
- **Code format:** `EMART\d{4}`.

#### 4.2.21 Wallet — `WalletPage.jsx`
- **APIs:**
  - `GET /wallet/me` → `{ balance, monthlyEarnings, totalEarnings, transactions[] }`.
  - `POST /wallet/withdraw` (button "Withdraw").
- Transaction model: `{ id, title, subtitle, amount, type ('credit'|'debit'), date, status ('success'|'pending') }`.

#### 4.2.22 My School — `MySchoolPage.jsx`
- **APIs:**
  - `GET /parent/my-school/checklist` → `{ progress:{completed,total}, mandatoryItems[], missingItems[] }`.
  - `GET /parent/my-school/announcements`.
  - `GET /parent/my-school/recommended-kits`.
  - `POST /support/school-chat` (Chat with School Support button).
  - `PUT /users/me/active-child` (Switch Child).

#### 4.2.23 Attendance — `ParentAttendance.jsx`
- **APIs:**
  - `GET /students/:studentId/attendance?month=&year=` → per-day status `present|absent|late|leave|holiday|sunday`.
  - `GET /students/:studentId/attendance/summary?range=this_month|last_month|last_3_months|this_term` → `overviewStats` (`overallPercentage, presentPercent, absentPercent, latePercent, leavePercent, holidayPercent, presentDays, totalDays, absentDays, lateDays, leaveDays, holidayDays`).
  - `GET /students/:studentId/attendance/trend?range=last_6_months|last_12_months|this_year` → stacked monthly bars.
  - `POST /students/:studentId/leave-application` (Submit leave application CTA).

#### 4.2.24 Homework (Parent view) — `ParentHomework.jsx` + `ParentHomeworkDetails.jsx`
- **APIs:**
  - `GET /students/:studentId/homework?tab=All|Pending|Submitted|Completed&sort=Newest|Oldest|DueDate`.
  - `GET /students/:studentId/homework/stats` → `{ pending, submitted, completed, overdue }`.
  - `GET /homework/:id` (details).
  - `POST /homework/:id/submissions` (file upload — multipart).

#### 4.2.25 Diary — `ParentDiary.jsx`
- **APIs:** `GET /students/:studentId/diary?date_from=&date_to=&category=&tab=`.

#### 4.2.26 Notices — `ParentNotices.jsx`
- **APIs:** `GET /students/:studentId/notices?tab=All|General|Academic|Events|Urgent&date_from=&date_to=`.

#### 4.2.27 Calendar — `ParentCalendar.jsx`
- **APIs:** `GET /students/:studentId/calendar?month=&year=`.

#### 4.2.28 Phonebook — `ParentPhonebook.jsx`
- **APIs:** `GET /schools/:schoolId/phonebook?category=Administration|Academics|Support Staff|Other Services`.

#### 4.2.29 Reels — `ParentReels.jsx`, `ReelsRow.jsx`
- **APIs:**
  - `GET /reels?category=All|Kits|Uniforms|Stationery&page=`.
  - `POST /reels/:id/like`, `POST /reels/:id/comments`, `POST /reels/:id/save`, `POST /reels/:id/share`.
- **Schema:** `{ id, title, description, views, category, likes, isLiked, music, thumb, videoUrl, comments[], product? }`.

#### 4.2.30 Learning Hub — `ParentLearningHub.jsx`, `ParentLearningHubAll.jsx`
- **APIs:**
  - `GET /lms/lessons?grade=&subject=All|Math|Science|...`.
  - `GET /lms/lessons/continue` (resume), `GET /lms/lessons/:id`.
  - `POST /lms/lessons/:id/progress` `{ progressPercent, lastPosition }`.

#### 4.2.31 Terms / Privacy (Parent) — `TermsAndConditions.jsx`, `PrivacyPolicy.jsx`
- Static; `GET /content/pages/terms` and `/privacy`.

#### 4.2.32 Recent Updates / Quick Actions / Promo Banners / Reels Row
- Driven by `GET /parent/home/*` and `GET /promo/banners?location=home&audience=parent`.

---

### 4.3 SCHOOL / Admin Portal (`/school/*`)

#### 4.3.1 Auth — `SchoolAuthPage.jsx`
See §3.1 (admin & teacher sub-flows).

#### 4.3.2 School Home — `SchoolHome.jsx` + `InstitutionalPackages`, `SchoolCategories`, `CategoryEssentials`, `VendorSpotlights`, `SchoolCaseStudies`
- **APIs:**
  - `GET /school/home/summary` (academic year, banners).
  - `GET /school/home/packages`.
  - `GET /school/home/categories`.
  - `GET /school/home/vendor-spotlights`.
  - `GET /school/case-studies`.

#### 4.3.3 Send Notice — `SchoolSendNotice.jsx`
- **Fields:** `title* (≤100)`, `content (rich text)`, `audience ('parents'|'teachers'|'all')`, `attachments[]`, `schedule ('now'|'later')`, optional `scheduledAt`.
- **APIs:** `POST /school/notices` (multipart with attachments); `POST /attachments/upload`.

#### 4.3.4 Create Event — `SchoolCreateEvent.jsx`
- **Fields:** `title*, description, eventType, eventCategory, startDate, startTime, endDate, endTime, venue, isAllDay (bool), reminder, audience ('specific'|'all'), selectedClass, visibleOnCalendar (bool), publishToNoticeBoard (bool)`.
- **API:** `POST /school/events`.

#### 4.3.5 Create Kit — `SchoolCreateKit.jsx`
- **Fields:** `kitName, classGrade, category, description, includes, imageFile, items[], sellingPrice, mrp, quantity, sku, kitStatus ('active'|'draft'), showOnApp, availableOnline, allowPreorders`.
- **APIs:** `POST /school/kits` (multipart). Items list has CRUD client-side; backend persists nested items.

#### 4.3.6 Create Request (Uniform RFQ) — `SchoolCreateRequest.jsx`
- 4-step wizard (Details → Sets → Vendors → Review → Publish).
- **Step 1 fields:** `requestTitle* (≤100)`, `academicYear*`, `requiredDate*`, `selectedClasses[]*`, `totalStudents (number)`, `specialInstructions (≤300)`.
- **Step 2 (per set):** `name, type ('Primary Set'|'Secondary Set'), boysQty, girlsQty, components[{label,icon,checked}], images[{label,file,preview}]`.
- **Step 3:** vendor selection (multi), `deadlineDate*`, `quotationRequirements[]` (Sample Required, GST Included, Delivery Timeline, Fabric Details, Size Chart, After Sales Support), `additionalNotes (≤300)`.
- **APIs:**
  - `GET /school/vendors?search=&page=` (vendor search list with rating/orders/verified).
  - `POST /school/requests/drafts` (Save Draft button).
  - `POST /school/requests` (Publish).
  - `POST /attachments/upload` (image references).
- **Validations:** all `*`-marked fields, ≥1 set, ≥1 vendor; deadline must be ≥ today.

#### 4.3.7 Draft Requests — `SchoolDraftRequests.jsx`
- **APIs:** `GET /school/requests/drafts?category=All|Uniform Requests|Purchase Requests|Kits|Others`, `DELETE /school/requests/drafts/:id`, navigate-Resume reuses `POST/PATCH /school/requests/drafts/:id`.

#### 4.3.8 Teacher Approvals — `SchoolTeacherApprovals.jsx`
- **APIs:**
  - `GET /school/teachers/pending`, `GET /school/teachers/approved`, `GET /school/teachers/rejected`.
  - `POST /school/teachers/:id/approve`, `POST /school/teachers/:id/reject`.
- **Schema:** `{ id, name, phone, email, date, status, avatar, designation, department, qualifications, experience, refCode }`.

#### 4.3.9 More — `SchoolMorePage.jsx`
- Pure navigation hub; protected items require auth.

#### 4.3.10 Students — `SchoolStudentsPage.jsx`
- **APIs:**
  - `GET /school/students?class=&section=&status=&search=&sort=&page=`.
  - `GET /school/students/:id`.
  - Bulk import handled by Teacher (4.4.3).
- **Schema:** `{ id (ADM-YYYY-NNNN), name, class, rollNo, gender, parent, parentPhone, parentEmail, status (Active|Inactive), avatar, dob, bloodGroup, attendance, fees }`.

#### 4.3.11 Vendors — `SchoolVendorsPage.jsx`
- **APIs:**
  - `GET /school/vendors?category=All|Uniform|...&search=`.
  - `POST /school/vendors/:id/request-quote`.
- **Modal sends:** `{ subject, message, requirementType }`.

#### 4.3.12 Quotations — `SchoolQuotationsPage.jsx`
- **APIs:**
  - `GET /school/requests?status=Received|Pending|Closed`.
  - `GET /school/requests/:id/quotes`.
  - `POST /school/requests/:id/award` `{ vendorId }`.
  - `POST /school/requests/:id/reject-quote` `{ vendorId, reason }`.
  - `POST /school/requests/:id/message` `{ vendorId, message }`.
- **Quote schema:** `{ vendorName, pricePerUnit, totalAmount, deliveryDays, rating, material, remarks }`.

#### 4.3.13 Kits Catalog — `SchoolKitsPage.jsx`
- **APIs:**
  - `GET /school/kits?category=All|Academic|Stationery|Sports|Uniform&search=`.
  - `GET /school/kits/:id`.
  - `PATCH /school/kits/:id` (status, items).

#### 4.3.14 Grade & Categories pages — `SchoolGradePage.jsx`, `SchoolCategoryPage.jsx`, `SchoolSubcategoryPage.jsx`
- **APIs:** `GET /catalog/...` parameterized by `audience=school`.

#### 4.3.15 Cart, Checkout, Order History — `SchoolCartPage.jsx`, `SchoolCheckoutPage.jsx`, `SchoolOrderHistoryPage.jsx`
- Same cart endpoints as Parent (`/cart/...`) but **server should detect school role for free delivery + ₹50 platform fee** (institutional rules from `SchoolCartPage`, `SchoolCheckoutPage`).
- Order schema for school orders prefixed `PROC-NNNNN`.

#### 4.3.16 Wishlist — `SchoolWishlistPage.jsx`
- **APIs:** `GET/POST/DELETE /school/wishlist`.

#### 4.3.17 Notifications — `SchoolNotificationsPage.jsx`
- Types: `order, quote, admin`.
- Same endpoints as parent (`/notifications`) but `?audience=school`.

#### 4.3.18 Refer & Earn / Partner — `SchoolReferEarnPage.jsx`, `SchoolPartnerPage.jsx`
- **APIs:** `GET /school/referrals/me`, `POST /school/partner/apply`.

#### 4.3.19 Wallet — `SchoolWalletPage.jsx`
- **APIs:** `GET /school/wallet`, `POST /school/wallet/credit-request`.

#### 4.3.20 Contact / About — `SchoolContactUsPage.jsx`, `SchoolAboutUsPage.jsx`
- **Fields:** `name, email, school, message`; `POST /support/contact?audience=school`.

#### 4.3.21 Edit Profile / Change Password — `SchoolEditProfilePage.jsx`, `SchoolChangePasswordPage.jsx`
- **Fields (edit):** as Parent + School-specific address fields.
- **Fields (change pw):** `currentPassword*, newPassword*, confirmPassword*`.
- **Validations (change pw):** length ≥ 8, contains digit, contains special char, match confirm.

---

### 4.4 TEACHER (`/school/teacher/*`)

#### 4.4.1 Dashboard — `TeacherDashboard.jsx`
- **APIs:**
  - `GET /teacher/me/classes` (list of class-section).
  - `GET /teacher/classes/:class/sections/:section/summary` → `{ studentsCount, attendance (Pending|Completed), attendanceCount, homeworkCount, diaryCount, studentsList[5] }`.
  - `GET /teacher/notifications?unread=true`.

#### 4.4.2 Manage Students — `TeacherManageStudents.jsx`
- **Form fields:** `name, rollNo, gender ('Male'|'Female'), dob, fatherName, motherName, phone, altPhone, admissionNo, class, section`.
- **APIs:**
  - `GET /teacher/students?class=&section=&search=&sort=rollNo|name`.
  - `POST /teacher/students`, `PATCH /teacher/students/:id`, `DELETE /teacher/students/:id`.
  - `GET /teacher/students/export` (CSV download).

#### 4.4.3 Bulk Add Students — `TeacherBulkAddStudents.jsx`
- **Modes:** Excel upload (`.xlsx/.csv`) drag-drop or manual rows.
- **APIs:**
  - `POST /teacher/students/import` (multipart) — returns `{ total, valid, empty, errors[] }`.
  - `POST /teacher/students/bulk` (manual array).

#### 4.4.4 Attendance (Mark) — `TeacherAttendance.jsx`
- **Fields:** `selectedClass, selectedSection, students[{ roll, status ('P'|'A'|'L'|'Late') }], remark`.
- **APIs:**
  - `GET /teacher/classes/:class/:section/students`.
  - `POST /teacher/attendance` `{ date, class, section, students:[{roll, status}], remark }`.
  - `POST /teacher/attendance/draft`.
  - `GET /teacher/attendance?date=&class=&section=`.

#### 4.4.5 Homework — `TeacherHomework.jsx`
- **Fields:** `class, section, subject (Mathematics|Science|English|Social Studies), title*, dateAssigned, dueDate, homeworkType ('Written'|'Reading'|'Project'|'Online Quiz'), priority ('High'|'Medium'|'Low'), description, instructions, textbook, chapter, attachments[]`.
- **APIs:**
  - `POST /teacher/homework`.
  - `POST /attachments/upload` for files.
  - `GET /teacher/homework?class=&section=&page=`.

#### 4.4.6 Diary — `TeacherDiary.jsx`
- **Fields:** `class, section, noteType ('general'|'homework'|'behaviour'|'appreciation'), title, message, visibility ('class'|'students'), priority ('normal'|'important'|'urgent'), notifyParents (bool), schedule ('now'|'later'), attachments[]`.
- **APIs:** `POST /teacher/diary`, `GET /teacher/diary?date=&class=&section=`.

#### 4.4.7 Profile — `TeacherProfile.jsx`
- See §3.2 (`/teachers/me/details`).
- Modal change password: `currentPassword, newPassword (≥ 6), confirmPassword`.

#### 4.4.8 Notifications — `TeacherNotifications.jsx`
- **API:** `GET /teacher/notifications?type=Urgent|Notice|...&page=`.

---

### 4.5 VENDOR (`/vendor/*`)

#### 4.5.1 Auth — `VendorLogin.jsx`
See §3.1.

#### 4.5.2 Dashboard — `VendorDashboard.jsx`
- **APIs:**
  - `GET /vendor/dashboard/kpis` → totalOrders, completed, pending, returns, revenue, walletBalance.
  - `GET /vendor/orders/recent`.
  - `GET /vendor/quotations/open`.
  - `GET /vendor/products/top-selling`.
  - `GET /vendor/announcements`.

#### 4.5.3 Orders — `VendorOrders.jsx` **(only real API call in code today)**
- **Existing call:** `apiClient.get('/vendor/orders')` returning array of `{ id, school, amount, status, orderDate, ... }`.
- **Additional inferred:**
  - `GET /vendor/orders?status=&from=&to=&search=&page=&limit=`.
  - `GET /vendor/orders/:id` (modal details).
  - `PATCH /vendor/orders/:id/status` `{ status, note }`.
  - `GET /vendor/orders/export?format=csv|xlsx|pdf`.
  - `POST /vendor/orders/:id/invoice` (Print).

#### 4.5.4 Quotations / RFQ — `VendorQuotations.jsx`
- **APIs:**
  - `GET /vendor/rfqs?status=Pending|Submitted|Awarded|Rejected&search=`.
  - `GET /vendor/rfqs/:id`.
  - `POST /vendor/rfqs/:id/bid` body: `{ price, deliveryDays, notes }`.
- **Validations:** `price > 0`, `deliveryDays > 0`.

#### 4.5.5 Products — `VendorProducts.jsx`
- **Add form fields:** `name*, description, brand, code/SKU, header, category, subcategory, variant, stock, price, status ('PUBLISHED'|'DRAFT')`.
- **APIs:**
  - `GET /vendor/products?category=&approval=&search=`.
  - `POST /vendor/products` (multipart for images).
  - `PATCH /vendor/products/:id`, `DELETE /vendor/products/:id`.

#### 4.5.6 Price & Stock — `VendorStock.jsx`
- **APIs:** `GET /vendor/products` (re-used); `PATCH /vendor/products/:id` `{ stock, price }`.
- Low-stock threshold: `stock <= 5`.

#### 4.5.7 Returns — `VendorReturns.jsx`
- **APIs:**
  - `GET /vendor/returns?segment=All|Requested|Approved|Rejected|Completed&search=`.
  - `PATCH /vendor/returns/:id` `{ status, qcStatus }`.
- **Statuses:** `Requested, Approved, QC Passed, Pickup Assigned, In Transit, Rejected, Completed`.

#### 4.5.8 Money Requests — `VendorMoneyRequests.jsx`
- **Fields:** `amount*, method ('Bank Transfer'|'UPI'), bankName, account`.
- **APIs:**
  - `GET /vendor/payouts/balances` → `{ available, onHold, pending, lastWithdrawal }`.
  - `POST /vendor/payouts` `{ amount, method, bankName, account }`.
  - `GET /vendor/payouts?status=&search=`.

#### 4.5.9 Payment History / Wallet — `VendorPaymentHistory.jsx`
- **APIs:**
  - `GET /vendor/transactions?tab=All|Payments|Withdrawal|Refunds&search=`.
  - `GET /vendor/transactions/export?format=PDF|CSV&range=30days|...`.

#### 4.5.10 Profile — `VendorProfile.jsx`
- See §3.2; `PATCH /vendors/me/profile` + lat/lng + `serviceRadius` (km).

#### 4.5.11 Stub vendor pages
Catalog, Announcements, Reports, Settings, Help & Support — placeholders today; backend should expose `GET /vendor/announcements`, `GET /vendor/reports`, `GET/PUT /vendor/settings`, `GET /support/topics`.

---

### 4.6 SUPER ADMIN (`/superadmin/*`)

#### 4.6.1 Login — `SuperAdminLogin.jsx`
See §3.1.

#### 4.6.2 Dashboard — `SuperAdminDashboard.jsx`
- **API:** `GET /admin/dashboard/stats` → totals (users, categories, subcategories, products, orders, completed, pending, cancelled, sold-out, low-stock).
- `GET /admin/dashboard/charts?range=june|months&year=` (daily / monthly orders).

#### 4.6.3 Category Management — `CategoryManagement.jsx`
- **Form fields (Add/Edit):** `name*, image (file), header, order (number), status (active/inactive)`.
- **APIs:**
  - `GET /admin/categories?status=&search=`.
  - `POST /admin/categories`, `PATCH /admin/categories/:id`, `DELETE /admin/categories/:id`.
  - `POST /admin/categories/:id/subcategories`, `PATCH /admin/subcategories/:id`, `DELETE /admin/subcategories/:id`.

#### 4.6.4 Header Category Management — `HeaderCategoryManagement.jsx`
- **Fields:** `name*, slug*, commission(%), fees(₹), status, image`.
- **APIs:** `GET/POST/PATCH/DELETE /admin/header-categories`.

#### 4.6.5 Product List Management — `ProductListManagement.jsx`
- **Fields:** `name, description, brand, sku, price, stock, variant, headerGroup, category, subcategory, vendor, approvalStatus ('Approved'|'Pending'|'Rejected'), image`.
- **APIs:**
  - `GET /admin/products?tab=All|Approved|Pending Approval|Rejected&category=&sort=&search=`.
  - `PATCH /admin/products/:id`, `POST /admin/products/:id/approve`, `POST /admin/products/:id/reject`.
- **Computed `stockStatus`:** In Stock / Low Stock / Out of Stock (server-derived).

#### 4.6.6 Vendor List Management — `VendorListManagement.jsx`
- **Edit fields:** `name, storeName, phone, email, category, commission, status ('Approved'|'Pending'|'Suspended'), needApproval, address, city, serviceableArea, latitude, longitude, serviceRadius, panCard, taxName, taxNumber, accountName, bankName, branch, accountNumber, ifscCode`. Read-only: `balance, categoriesCount`.
- **APIs:**
  - `GET /admin/vendors?tab=All|Approved|Pending|Suspended&search=`.
  - `PATCH /admin/vendors/:id`, `POST /admin/vendors/:id/suspend`, `POST /admin/vendors/:id/approve`.

#### 4.6.7 Vendor Locations — `VendorLocations.jsx`
- **API:** `GET /admin/vendors?withLocation=true&status=`.
- **Schema:** `{ id, storeName, ownerName, address, city, latitude, longitude, phone, email, status, serviceRadius }`.

#### 4.6.8 Wallet Management — `WalletManagement.jsx`
- **APIs:** `GET /admin/wallet/transactions?user=&type=`, `GET /admin/wallet/withdrawal-requests?status=`, `POST /admin/wallet/withdrawal-requests/:id/approve` `{ txnRef }`, `POST .../reject`.

#### 4.6.9 Withdrawals Management — `WithdrawalsManagement.jsx`
- **APIs:** `GET /admin/withdrawals?status=All|Pending|Completed|Rejected`, `POST /admin/withdrawals/:id/complete` `{ transactionReference }`, `POST /admin/withdrawals/:id/reject` `{ reason }`.

#### 4.6.10 Vendor Transactions — `VendorTransactions.jsx`
- **APIs:** `GET /admin/vendor-transactions?search=&type=&date=`, `POST /admin/vendor-transactions` (manual entry).
- **Fields:** `vendorName*, type ('Credit'|'Debit')*, amount*, remarks, date`.

#### 4.6.11 User Management — `UserManagement.jsx`
- **APIs:** `GET /admin/users?search=`, `PATCH /admin/users/:id` `{ status }`, `GET /admin/users/:id/wallet`, `GET /admin/users/:id/orders`.

#### 4.6.12 Notification Management — `NotificationManagement.jsx`
- **Form fields (Add):** `usersTarget ('All Users'|'Delivery'|<role>), title, message, date (auto)`.
- **APIs:** `GET /admin/notifications`, `POST /admin/notifications/broadcast`, `DELETE /admin/notifications/:id`, `POST /admin/notifications/:id/resend`.

#### 4.6.13 FAQ Management — `FAQManagement.jsx`
- **Fields:** `question*, answer*`.
- **APIs:** `GET/POST/PATCH/DELETE /admin/faqs`.

#### 4.6.14 Orders List Management — `OrdersListManagement.jsx`
- **APIs:**
  - `GET /admin/orders?status=&search=&from=&to=`.
  - `GET /admin/orders/:id` (detailed view modal).
  - `GET /admin/orders/export`.
- **Status sub-pages:** Pending, Received, Processed, Shipped, Out For Delivery, Delivered, Cancelled, Returned — same endpoint with `status=` query.

#### 4.6.15 Promo Home Sections — `PromoHomeSections.jsx`
- **Fields:** `order, title, slug, location, type ('Products'|'Categories'|...), categories[], columns, limit, status`.
- **APIs:** `GET/POST/PATCH/DELETE /admin/promo/home-sections`.

#### 4.6.16 Promo Home Banners — `PromoHomeBanners.jsx`
- **Fields:** `slug, category, orderRank, imageUrl, targetUrl, status`.
- **APIs:** `GET/POST/PATCH/DELETE /admin/promo/home-banners`.

#### 4.6.17 Reels Management — `ReelsManagement.jsx`
- **Fields:** `title, description, videoUrl, thumbnailUrl, storeName, productTitle, productPrice, productMrp, productUrl, productImageUrl, status`.
- **APIs:** `GET/POST/PATCH/DELETE /admin/reels`, `POST /attachments/video`, `POST /attachments/image`.

#### 4.6.18 LMS Management — `LMSManagement.jsx`
- **Fields:** `title, subject, gradeClass, instructor, concepts, duration, videoUrl, thumbnailUrl, status, studentsEnrolled`.
- **APIs:** `GET/POST/PATCH/DELETE /admin/lms/courses`.

#### 4.6.19 Billing & Charges — `BillingChargesManagement.jsx`
- **Fields:** `platformFee, freeDeliveryThreshold, pricingMode ('fixed'|'distance'), fixedDeliveryCharge, baseCharge, baseDistance, extraKmCharge, riderCommission`.
- **APIs:** `GET /admin/settings/billing`, `PUT /admin/settings/billing`.
- The Parent/School cart and checkout fee logic must consume the same values.

#### 4.6.20 Admin Profile — `AdminProfileManagement.jsx`
- See §3.2. Includes change-password modal: `currentPassword, newPassword (≥ 6), confirmNewPassword`.

---

### 4.7 Shared Components & Modals

| Component | Endpoint(s) |
|---|---|
| `Header.jsx` + categories | `GET /lookups/categories/header` |
| `VendorContactModal.jsx` | `POST /leads/vendor-onboarding` |
| `AccountManagerModal.jsx` | `GET /support/account-manager` |
| `LoginPromptModal.jsx`, `AuthPrompt.jsx`, `LoginRequired.jsx` | trigger client-side redirects only |
| `ProductCard.jsx` (multiple variants) | `POST /cart/items`, `POST /wishlist/items` |
| `ScrollToTop.jsx` | n/a |

---

## 5. Permissions Matrix (summary)

| Capability | parent | teacher | school | vendor | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Browse catalog | yes | yes | yes | yes | yes |
| Cart / Checkout (D2C) | yes | no | no | no | no |
| School Cart / Bulk Checkout | no | no | yes | no | no |
| Wishlist | yes | no | yes | no | no |
| Place Order | yes | no | yes | no | no |
| Track Order | yes | no | yes | no | yes |
| Manage Students | no | yes | yes (read-only) | no | yes |
| Mark Attendance | no | yes | no | no | yes |
| Create Homework / Diary | no | yes | no | no | yes |
| Send Notice / Create Event | no | no | yes | no | yes |
| Create Uniform Request (RFQ) | no | no | yes | no | yes |
| Submit Quote on RFQ | no | no | no | yes | no |
| Approve Teacher | no | no | yes | no | yes |
| Approve Vendor / Product | no | no | no | no | yes |
| Manage Categories / Banners / Reels / LMS | no | no | no | no | yes |
| Manage Wallet & Withdrawals (system-wide) | no | no | no | no | yes |
| Vendor Payouts (own) | no | no | no | yes | oversee |
| Refer & Earn | yes | no | yes | no | no |

`RoleRoute` enforces `vendor` and `admin` on the client; backend must mirror these checks plus enforce `school` and `teacher`.

---

## 6. Cross-Feature Validation Catalogue

| Field | Rule | Source |
|---|---|---|
| Indian mobile | strip non-digits, length === 10 | `AppAuthPage`, `SchoolAuthPage`, `ProfileSetupPage`, `EditProfilePage`, `ContactUsPage` |
| Email | regex `\S+@\S+\.\S+` | `SchoolAuthPage`, `ContactUsPage` |
| Password (signup) | ≥ 6 chars + must match confirm | `SchoolAuthPage`, `AdminProfileManagement` |
| Password (change) | ≥ 8 chars, ≥ 1 digit, ≥ 1 special char | `SchoolChangePasswordPage` |
| OTP (parent app) | 4 numeric digits | `AppAuthPage` |
| OTP (parent web) | 6 numeric digits | `features/auth/AuthPage` |
| Image upload | max 2 MB, `image/*` only | `EditProfilePage`, `SchoolEditProfilePage`, kit/uniform images |
| Text limits | Request Title 100, Special Instructions 300, Notice Title 100 | `SchoolCreateRequest`, `SchoolSendNotice`, `SchoolCreateEvent` |
| Grade | enum: `Nursery, LKG, UKG, KG 1, KG 2, Class 1..12` | `ProfileSetupPage`, `SelectGradePage` |
| Referral code | regex `^EMART\d{4}$` | `ReferEarnPage` |
| Student bulk row | row valid only if `name` & `phone` non-empty | `TeacherBulkAddStudents` |
| Cart quantity | min 1, decrement to 0 removes item | `CartPage`, `CheckoutPage` |
| Stock thresholds | `stock===0` → Out of Stock, `stock<=5` → Low Stock | `VendorStock`, `ProductListManagement` |

The backend MUST replicate ALL of the above as authoritative validation; client-side checks are advisory only.

---

## 7. Existing vs. Missing APIs

### 7.1 Existing in code (1 endpoint)
| Endpoint | Method | File | Status |
|---|---|---|---|
| `/vendor/orders` | GET | `frontend/src/features/vendor/VendorOrders.jsx:45` | Live (only real call) |

### 7.2 Missing APIs (must be implemented)
Every other endpoint enumerated in §3 and §4 is **inferred** and currently not implemented. The frontend either:
- Stores data in `localStorage` (auth, profile, cart, wishlist, referral code, teacher data).
- Returns mock arrays in component state (`useState([...])`).
- Wraps interactions in `setTimeout(..., 1000-2000)` to fake async (every form submit you've seen).

A complete first-cut backlog of inferred endpoints (grouped by module):

```
Auth
  POST   /auth/parent/otp/request
  POST   /auth/parent/otp/verify
  POST   /auth/parent/signup
  POST   /auth/parent/web/register
  POST   /auth/parent/web/login
  POST   /auth/school/admin/(login|signup)
  POST   /auth/school/teacher/(login|signup)
  POST   /auth/vendor/(login|signup)
  POST   /auth/admin/login
  POST   /auth/forgot-password
  POST   /auth/change-password
  POST   /auth/logout
  GET    /auth/me

Users / Profiles
  GET    /users/me
  PATCH  /users/me
  POST   /users/me/avatar
  GET    /users/me/children
  POST   /users/me/children
  PUT    /users/me/children/:id
  DELETE /users/me/children/:id
  PUT    /users/me/active-child
  GET    /users/me/addresses
  PUT    /users/me/addresses/:id
  GET    /users/me/address/auto-resolve

Teachers / Vendors / Admin profile
  GET/PUT /teachers/me/details
  GET/PUT /vendors/me/profile
  GET/PUT /admin/profile

Catalog
  GET    /catalog/home
  GET    /catalog/categories(/tree)?
  GET    /catalog/categories/:slug
  GET    /catalog/categories/:id/subcategories
  GET    /catalog/products  (filters: grade, category, search, sort, page)
  GET    /catalog/products/:id
  GET    /catalog/products/:id/similar
  GET    /catalog/kits/:id

Cart
  GET    /cart
  POST   /cart/items
  POST   /cart/items/batch
  PATCH  /cart/items/:productId
  DELETE /cart/items/:productId

Wishlist
  GET    /wishlist
  POST   /wishlist/items
  DELETE /wishlist/items/:productId

Orders / Payments
  POST   /orders
  GET    /orders/me
  GET    /orders/:id
  POST   /orders/:id/cancel
  POST   /orders/:id/reorder
  GET    /orders/track/:orderId
  GET    /orders/:id/track
  POST   /payments/initiate
  POST   /payments/verify
  GET    /pricing/charges

Notifications
  GET    /notifications
  PATCH  /notifications/:id/read
  PATCH  /notifications/read-all
  DELETE /notifications/:id

Parent
  GET    /parent/home/today-glance
  GET    /parent/home/banners
  GET    /parent/learning-hub/continue
  GET    /parent/kits/recommended
  GET    /parent/my-school/checklist
  GET    /parent/my-school/announcements
  GET    /parent/my-school/recommended-kits
  GET    /students/:id/attendance
  GET    /students/:id/attendance/summary
  GET    /students/:id/attendance/trend
  POST   /students/:id/leave-application
  GET    /students/:id/homework
  GET    /students/:id/homework/stats
  GET    /homework/:id
  POST   /homework/:id/submissions
  GET    /students/:id/diary
  GET    /students/:id/notices
  GET    /students/:id/calendar
  GET    /schools/:id/phonebook

LMS / Reels
  GET    /lms/lessons
  GET    /lms/lessons/:id
  GET    /lms/lessons/continue
  POST   /lms/lessons/:id/progress
  GET    /reels
  POST   /reels/:id/(like|comments|save|share)

Wallet / Referrals
  GET    /wallet/me
  POST   /wallet/withdraw
  GET    /referrals/me
  POST   /referrals/share

School
  GET    /school/home/*
  POST   /school/notices
  POST   /school/events
  POST   /school/kits
  GET    /school/kits
  POST   /school/requests
  POST   /school/requests/drafts
  GET    /school/requests
  GET    /school/requests/drafts
  DELETE /school/requests/drafts/:id
  GET    /school/requests/:id/quotes
  POST   /school/requests/:id/award
  POST   /school/requests/:id/reject-quote
  POST   /school/requests/:id/message
  GET    /school/vendors
  GET    /school/teachers/(pending|approved|rejected)
  POST   /school/teachers/:id/(approve|reject)
  GET    /school/students
  GET    /school/students/:id
  GET    /school/wallet
  POST   /school/wallet/credit-request
  GET    /school/referrals/me
  POST   /school/partner/apply
  GET    /school/wishlist
  POST   /school/wishlist
  DELETE /school/wishlist/:id

Teacher
  GET    /teacher/me/classes
  GET    /teacher/classes/:class/sections/:section/summary
  GET    /teacher/students
  POST   /teacher/students
  POST   /teacher/students/bulk
  POST   /teacher/students/import
  PATCH  /teacher/students/:id
  DELETE /teacher/students/:id
  GET    /teacher/students/export
  GET    /teacher/attendance
  POST   /teacher/attendance(/draft)?
  GET    /teacher/homework
  POST   /teacher/homework
  GET    /teacher/diary
  POST   /teacher/diary
  GET    /teacher/notifications

Vendor
  GET    /vendor/dashboard/kpis
  GET    /vendor/orders  [already wired]
  GET    /vendor/orders/:id
  PATCH  /vendor/orders/:id/status
  GET    /vendor/orders/export
  GET    /vendor/rfqs
  GET    /vendor/rfqs/:id
  POST   /vendor/rfqs/:id/bid
  GET    /vendor/products
  POST   /vendor/products
  PATCH  /vendor/products/:id
  DELETE /vendor/products/:id
  GET    /vendor/returns
  PATCH  /vendor/returns/:id
  GET    /vendor/payouts(/balances)?
  POST   /vendor/payouts
  GET    /vendor/transactions(/export)?
  GET    /vendor/announcements

Super Admin
  GET    /admin/dashboard/stats
  GET    /admin/dashboard/charts
  CRUD   /admin/categories(/subcategories)
  CRUD   /admin/header-categories
  GET    /admin/products
  PATCH  /admin/products/:id
  POST   /admin/products/:id/(approve|reject)
  GET    /admin/vendors
  PATCH  /admin/vendors/:id
  POST   /admin/vendors/:id/(approve|suspend)
  GET    /admin/users
  PATCH  /admin/users/:id
  GET    /admin/orders
  GET    /admin/orders/:id
  GET    /admin/orders/export
  GET    /admin/wallet/transactions
  GET    /admin/wallet/withdrawal-requests
  POST   /admin/wallet/withdrawal-requests/:id/(approve|reject)
  GET    /admin/withdrawals
  POST   /admin/withdrawals/:id/(complete|reject)
  GET    /admin/vendor-transactions
  POST   /admin/vendor-transactions
  CRUD   /admin/faqs
  GET    /admin/notifications
  POST   /admin/notifications/broadcast
  POST   /admin/notifications/:id/resend
  DELETE /admin/notifications/:id
  CRUD   /admin/promo/(home-sections|home-banners)
  CRUD   /admin/reels
  CRUD   /admin/lms/courses
  GET    /admin/settings/billing
  PUT    /admin/settings/billing

Misc
  GET    /lookups/{schools,grades,sections,subjects,categories,academic-years}
  POST   /attachments/(upload|video|image)
  POST   /leads/vendor-onboarding
  POST   /support/(contact|school-chat)
  GET    /support/account-manager
  GET    /content/pages/:slug
  GET    /content/faqs
```

---

## 8. Suggested Data Models (high level)

These are derived from the shape of mocks. Field names match the frontend exactly to make wiring trivial.

- **User** `{ _id, role, name, email, phone, altPhone, password(hash), refId, photo, address, city, state, country, pinCode, status, createdAt }`
- **ParentProfile** `{ userId, children:[ChildProfile] }`
- **ChildProfile** `{ name, schoolId, school, grade, schoolRefNo, rollNo, dob, bloodGroup }`
- **School** `{ _id, name, code, address, city, state, principalName, adminEmail, schoolRefNo, partnerStatus }`
- **Teacher** `{ userId, schoolId, employeeId, designation, department, qualifications, experience, joiningDate, status (Pending|Approved|Rejected), refCode }`
- **Student** `{ _id, schoolId, class, section, rollNo, name, gender, parentName, motherName, phone, altPhone, admissionNo, dob }`
- **Vendor** `{ userId, storeName, category, commission, status, address, city, latitude, longitude, serviceRadius, gstin, pan, bank:{accountName,bankName,branch,accountNumber,ifsc}, balance, categoriesCount }`
- **Product** `{ _id, vendorId, name, description, brand, sku, price, originalPrice, stock, variant, headerGroup, category, subcategory, sizes[], specs[], images[], approvalStatus, status, createdAt }`
- **Kit** `{ _id, schoolId?, name, classGrade, category, description, image, items:[{productId|name,detail,qty,unit}], addons[], price, mrp, sku, status, showOnApp, availableOnline, allowPreorders }`
- **HeaderCategory / Category / Subcategory** with `order, status, commission, fees, slug, image`.
- **Cart** `{ userId, items:[{productId,name,price,image,quantity,weight?}] }`
- **Order** `{ _id, userId, items[], subtotal, handlingCharge, deliveryCharge, total, deliveryType, paymentMethod, paymentStatus, status, address, gstin, vendorIds[], history:[{status,at,note}], invoiceUrl }`
- **Wallet / Transaction** `{ userId, balance, transactions:[{ id, dateTime, type, description, amount, status, ref }] }`
- **PayoutRequest / Withdrawal** `{ _id, userId, amount, status, paymentMethod, bankDetails, transactionReference }`
- **RFQ (Request)** `{ _id, schoolId, title, academicYear, requiredDate, classes[], totalStudents, specialInstructions, uniformSets[], invitedVendorIds[], deadlineDate, quotationRequirements[], additionalNotes, status (Draft|Open|Awarded|Closed), createdAt }`
- **Quote** `{ rfqId, vendorId, pricePerUnit, totalAmount, deliveryDays, material, remarks, status }`
- **Attendance** `{ studentId, date, status (P|A|L|Late), markedBy, time }`
- **Homework / Diary / Notice / Event / Calendar entry** as enumerated in §4.4 and §4.3.
- **Reel** `{ _id, title, description, videoUrl, thumbnailUrl, storeName, product, likes, views, status, comments:[] }`
- **LMS Course** `{ _id, title, subject, gradeClass, instructor, concepts, duration, videoUrl, thumbnailUrl, status, studentsEnrolled }`
- **Notification** `{ _id, userId|broadcast, title, message, type, isRead, actionLink, createdAt }`
- **PromoSection / PromoBanner** as in §4.6.15–16.
- **BillingConfig** singleton from §4.6.19.
- **Referral** `{ ownerId, code, totalEarnings, monthlyEarnings, successfulReferrals, pendingReferrals, invitees:[] }`.

---

## 9. Non-Functional Requirements (inferred from UI behaviour)
- **File uploads:** images up to 2 MB; videos for reels/LMS need streaming-friendly storage (mock uses .mp4 URLs).
- **Pagination:** list pages use `limit` (default 10) — implement `?page=&limit=` everywhere.
- **Search:** case-insensitive `LIKE` across primary fields shown in each list (id, name, school, vendor, etc.).
- **Sorting:** explicit options in screens (e.g. `Newest first`, `Name (A-Z)`, `rollNo`).
- **Realtime / Push:** parent notifications, teacher alerts, vendor RFQ alerts strongly imply push (FCM/APNS) + websocket polling for tracking page map.
- **Geo:** vendor lat/lng + service radius; order tracking map; address auto-resolve.
- **Internationalization:** copy is English + Hindi (account manager modal). Keep field-level i18n keys flexible.
- **Audit:** every admin write action (approve/reject vendor, complete withdrawal, broadcast notification) should be auditable.
- **Rate limiting:** OTP request, vendor lead form, contact form.
- **Permissions:** strict role enforcement server-side; the frontend trusts only `localStorage:childInfo.role`.

---

## 10. Suggested Build Order (engineering plan)
1. **Auth + Identity** (parent OTP, school admin/teacher, vendor, super admin) and `/auth/me`.
2. **Catalog read APIs + lookups** (categories, products, kits, grades) so home screens render.
3. **Cart, Wishlist, Orders, Payments, Order Tracking** (parent + school flows share endpoints).
4. **Vendor module** — keep existing `GET /vendor/orders` shape, add CRUD around it.
5. **School RFQ workflow** (create-request wizard, drafts, vendor invites, quotations award).
6. **Teacher modules** (students, attendance, homework, diary).
7. **Wallet / Withdrawals / Vendor Payouts** end-to-end.
8. **Notifications + Push** infrastructure.
9. **Super Admin CRUDs** (Category, Header, Products, Vendors, Banners, Reels, LMS, FAQ, BillingCharges, Notifications).
10. **CMS endpoints** (about/terms/privacy/refund/landing content).
11. **Reels & LMS streaming** + analytics.

---

## 11. Open Items / Assumptions to Confirm with Product
- Single child per parent vs. multi-child (UI has "Switch Child" button but only one is persisted).
- Whether `school` checkout truly bypasses payment gateway or just routes to invoice-based settlement.
- Whether teacher accounts require admin approval (UI suggests yes via `SchoolTeacherApprovals`, but signup currently auto-logs them in).
- The exact tax & GSTIN handling at checkout (the UI shows "Add GSTIN" but does not capture value).
- Cancellation window for orders ("only available before store accepts" in `OrderTrackingPage`).
- Reel monetization linkage (product CTA inside reel → `POST /cart/items`).
- Vendor approval workflow for new products created in `VendorProducts` (default to `Pending` per UI).

---

*End of Backend Requirement Specification — derived solely from the current frontend.*
