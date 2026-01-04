# Track 2: Certificate Generation (GreenCastle)
.\beads.exe create "Cert Template - Design HTML/CSS Certificate Template" --type task --priority 0 --estimate 240 --deps "ved-ugo6" --description "Create certificate template with vi/en/zh support, student name/course/date variables"

.\beads.exe create "Cert Generator - PDF Generation Service (PDFKit)" --type task --priority 0 --estimate 360 --deps "ved-ugo6" --description "Implement PDF generation using PDFKit (42MB memory, 1.8s, Vietnamese NotoSans fonts per spike ved-3wpc)"

.\beads.exe create "Cert Storage - Upload to Cloudflare R2" --type task --priority 0 --estimate 180 --deps "ved-ugo6" --description "Integrate R2 upload after PDF generation, return public URL for download"

.\beads.exe create "Cert API - Generate Certificate Endpoint" --type task --priority 0 --estimate 240 --deps "ved-ugo6" --description "POST /api/certificates/generate - requires quiz completion, calls generator + storage"

.\beads.exe create "Cert UI - Student Certificate Download" --type task --priority 1 --estimate 180 --deps "ved-ugo6" --description "Student dashboard: View certificates, download PDF, share link"

.\beads.exe create "Cert i18n - Multi-Language Certificate Support" --type task --priority 1 --estimate 240 --deps "ved-ugo6" --description "Ensure vi/en/zh text renders correctly in PDFs (NotoSans fonts)"

.\beads.exe create "Cert E2E Test - Certificate Generation Flow" --type task --priority 1 --estimate 120 --deps "ved-ugo6" --description "E2E test: Complete quiz → Generate cert → Download PDF → Verify content"

# Track 3: Roster/Progress (RedStone)
.\beads.exe create "Roster API - Get Enrolled Students per Course" --type task --priority 0 --estimate 240 --deps "discovered-from:ved-llu2" --description "GET /api/teacher/roster/:courseId - returns enrolled students with status/date"

.\beads.exe create "Roster Table - Student Roster UI Component" --type task --priority 0 --estimate 360 --deps "discovered-from:ved-llu2" --description "Table component with pagination, sorting, search (follow BehaviorLog analytics pattern)"

.\beads.exe create "Roster Filters - Status/Date/Name Search" --type task --priority 1 --estimate 240 --deps "discovered-from:ved-llu2" --description "Add filters: enrollment status, date range, name search (client-side + server-side)"

.\beads.exe create "Roster Export - Export to CSV" --type task --priority 1 --estimate 180 --deps "discovered-from:ved-llu2" --description "Export button → CSV download with student data (name, email, progress, enrollment date)"

.\beads.exe create "Progress API - Student Progress Summary" --type task --priority 0 --estimate 300 --deps "discovered-from:ved-llu2" --description "GET /api/teacher/progress/:studentId - lessons completed, quiz scores, time spent (use Kysely)"

.\beads.exe create "Progress Dashboard - Progress Monitoring UI" --type task --priority 1 --estimate 360 --deps "discovered-from:ved-llu2" --description "Dashboard with charts: completion rate, time spent, quiz performance (Chart.js)"

.\beads.exe create "Engagement Analytics - Time Spent and Completion Charts" --type task --priority 1 --estimate 300 --deps "discovered-from:ved-llu2" --description "Analytics: average time per lesson, completion trends, engagement heatmap"

# Track 4: Payment Gateway (PurpleBear)
.\beads.exe create "Stripe Setup - Install SDK and Configure Keys" --type task --priority 0 --estimate 120 --deps "discovered-from:ved-wjdy" --description "Install Stripe SDK, add keys to .env (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET per spike)"

.\beads.exe create "Payment Schema - Add Transaction Model to Prisma" --type task --priority 0 --estimate 180 --deps "discovered-from:ved-wjdy" --description "Add Transaction model: userId, courseId, amount, status, stripeSessionId, createdAt"

.\beads.exe create "Stripe Checkout - Create Checkout Session API" --type task --priority 0 --estimate 360 --deps "discovered-from:ved-wjdy" --description "POST /api/payment/checkout - creates Stripe session, returns checkout URL"

.\beads.exe create "Stripe Webhook - Handle Payment Events" --type task --priority 0 --estimate 360 --deps "discovered-from:ved-wjdy" --description "POST /api/webhooks/stripe - verify signature (raw body), handle checkout.session.completed (150ms per spike)"

.\beads.exe create "Payment UI - Checkout Page Component" --type task --priority 0 --estimate 480 --deps "discovered-from:ved-wjdy" --description "Checkout page with Stripe Elements, payment confirmation, error handling"

.\beads.exe create "Payment Security - Webhook Signature Verification" --type task --priority 0 --estimate 240 --deps "discovered-from:ved-wjdy" --description "Ensure raw body middleware, signature verification, idempotency (per spike ved-wjdy)"

.\beads.exe create "Payment Tests - Integration Tests with Stripe Test Mode" --type task --priority 1 --estimate 300 --deps "discovered-from:ved-wjdy" --description "Test checkout flow, webhook handling, failure cases (using Stripe test cards)"

.\beads.exe create "Payment Admin - Teacher Revenue Dashboard" --type task --priority 1 --estimate 360 --deps "discovered-from:ved-wjdy" --description "Teacher dashboard: total revenue, transaction history, payout status"

# Track 5: Enrollment (OrangeRiver)
.\beads.exe create "Enrollment Schema - Add Enrollment Model to Prisma" --type task --priority 0 --estimate 180 --deps "discovered-from:ved-pmbv" --description "Add Enrollment model: userId, courseId, status, enrolledAt, expiresAt (if subscription)"

.\beads.exe create "Enrollment Logic - Service Layer (Triggered by Webhook)" --type task --priority 0 --estimate 360 --deps "discovered-from:ved-pmbv,blocks:ved-wjdy-webhook" --description "Handle payment webhook → create enrollment (Prisma transaction per spike ved-pmbv)"

.\beads.exe create "Enrollment Validation - Duplicate Check and Limits" --type task --priority 0 --estimate 240 --deps "discovered-from:ved-pmbv" --description "Validate: no duplicate enrollments, course capacity limits, payment verification"

.\beads.exe create "Enrollment UI - Enroll Now Button and Modal" --type task --priority 0 --estimate 300 --deps "discovered-from:ved-pmbv" --description "CTA button, confirmation modal with course details, redirect to checkout"

.\beads.exe create "Enrollment Email - Send Confirmation Email" --type task --priority 1 --estimate 180 --deps "discovered-from:ved-682e" --description "Send email via Resend (2.1s delivery per spike ved-682e): enrollment confirmation, course access link"

.\beads.exe create "Enrollment Access - Verify Student Access to Course" --type task --priority 0 --estimate 240 --deps "discovered-from:ved-pmbv" --description "Middleware: check enrollment before allowing course/lesson access"

.\beads.exe create "Enrollment E2E Test - Full Journey Test" --type task --priority 1 --estimate 300 --deps "discovered-from:ved-pmbv" --description "E2E: Browse course → Pay → Enroll → Access lessons → Take quiz"

# Track 6: E2E Testing (SilverEagle)
.\beads.exe create "E2E Quiz Flow - Quiz Creation and Taking" --type task --priority 1 --estimate 180 --deps "discovered-from:ved-ahar" --description "E2E test: Teacher creates quiz (4 types) → Student takes quiz → Score calculated"

.\beads.exe create "E2E Cert Flow - Certificate Generation" --type task --priority 1 --estimate 120 --deps "discovered-from:ved-3wpc" --description "E2E test: Complete quiz → Generate certificate → Download PDF"

.\beads.exe create "E2E Payment Flow - Checkout with Stripe Test Mode" --type task --priority 1 --estimate 240 --deps "discovered-from:ved-wjdy" --description "E2E test: Add to cart → Checkout → Pay (test card) → Webhook triggered"

.\beads.exe create "E2E Roster Flow - Teacher Views Roster" --type task --priority 1 --estimate 120 --deps "discovered-from:ved-llu2" --description "E2E test: Teacher views roster → Filters students → Exports CSV"

.\beads.exe create "E2E CI Integration - Add Tests to GitHub Actions" --type task --priority 1 --estimate 120 --deps "discovered-from:ved-llu2" --description "Add E2E tests to CI pipeline, run on every PR, quality gates (95% pass, <3min)"

Write-Host "All beads created successfully!" -ForegroundColor Green
