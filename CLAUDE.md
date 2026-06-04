# CLAUDE.md

## Project Name

**Karmyogi Staff App for HomeTown**

A production-ready mobile-first staff enablement app for **HomeTown**, a furniture, home decor, retail, and e-commerce brand. The app is designed for store employees, store managers, regional managers, and head office teams to manage attendance, training, assignments, quizzes, certificates, and performance targets.

This document is intended for **Claude Code / AI coding agents** to generate, maintain, and extend the complete application.



---

# CRITICAL UPDATE: React Native Expo Existing Project Rules

## A. Project Constraint

This app must be built **only inside the existing Expo React Native project**.

Do not create a separate mobile project.

Do not create a Flutter project.

Do not create a new Expo project unless explicitly asked.

Do not create a separate web-only app for staff.

Use the current Expo project structure and extend it module by module.

The app must be:

```txt
React Native + Expo + TypeScript
```

The final Android build must be generated as an:

```txt
APK file using Expo / EAS Build
```

---

## B. Existing Login Must Be Preserved

The project already has a login flow.

Claude Code must not replace the existing login system unless explicitly asked.

Instead:

1. Inspect the existing login screens.
2. Reuse the current authentication UI.
3. Reuse the current auth state/store if available.
4. Reuse the current API client if available.
5. Add staff app screens after successful login.
6. Route users to the correct dashboard after login.
7. Do not break the current login design.
8. Do not rename existing login files unless absolutely required.
9. Do not remove existing auth logic.
10. Add missing OTP/geofencing logic only as extensions.

If the existing login currently uses:

```txt
email/password
```

then keep it and add OTP later as an optional enhancement.

If the existing login currently uses:

```txt
mobile + OTP
```

then extend the OTP flow and connect it to staff role-based routing.

---

## C. App Must Stay Inside Expo Project

Expected project location:

```txt
mobile/
```

or the current Expo root folder.

All staff app code must be added inside the existing Expo app.

Allowed additions:

```txt
app/
src/
components/
screens/
services/
store/
hooks/
types/
constants/
assets/
```

Do not create:

```txt
new-mobile-app/
staff-app/
flutter-app/
separate-react-web-app/
```

unless the user explicitly asks.

---

## D. Required Expo Packages

Use Expo-compatible libraries.

Install these only if not already installed:

```bash
npx expo install expo-location
npx expo install expo-secure-store
npx expo install expo-file-system
npx expo install expo-sharing
npx expo install expo-print
npx expo install expo-document-picker
npx expo install expo-image-picker
npx expo install expo-notifications
npx expo install expo-device
npx expo install react-native-safe-area-context
npx expo install react-native-screens
npx expo install react-native-svg
```

For navigation:

```bash
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install @react-navigation/bottom-tabs
```

If using Expo Router already, continue with Expo Router.

Do not mix navigation systems unnecessarily.

---

## E. Required Staff App Screens Inside Expo

Add these screens inside the existing Expo routing structure.

If project uses Expo Router:

```txt
app/
  index.tsx
  _layout.tsx
  auth/
    login.tsx
    verify-otp.tsx
  staff/
    _layout.tsx
    dashboard.tsx
    attendance.tsx
    assignments.tsx
    assignment-detail.tsx
    courses.tsx
    course-detail.tsx
    quiz.tsx
    quiz-result.tsx
    certificates.tsx
    certificate-detail.tsx
    targets.tsx
    documents.tsx
    profile.tsx
```

If project uses React Navigation:

```txt
src/
  navigation/
    RootNavigator.tsx
    AuthNavigator.tsx
    StaffTabNavigator.tsx
  screens/
    auth/
      LoginScreen.tsx
      VerifyOtpScreen.tsx
    staff/
      StaffDashboardScreen.tsx
      AttendanceScreen.tsx
      AssignmentsScreen.tsx
      AssignmentDetailScreen.tsx
      CoursesScreen.tsx
      CourseDetailScreen.tsx
      QuizScreen.tsx
      QuizResultScreen.tsx
      CertificatesScreen.tsx
      CertificateDetailScreen.tsx
      TargetsScreen.tsx
      DocumentsScreen.tsx
      ProfileScreen.tsx
```

Claude Code must first detect which routing style is already used and continue that style.

---

## F. Staff Bottom Tab Navigation

After login, store staff should see bottom navigation:

```txt
Home
Attendance
Courses
Targets
Profile
```

Secondary pages should be reachable from dashboard cards:

```txt
Assignments
Quizzes
Certificates
Documents
Notifications
Help
```

Manager users may see:

```txt
Home
Team
Attendance
Targets
Approvals
```

---

## G. Existing Login Routing Requirement

After successful login:

```txt
STORE_STAFF -> Staff Dashboard
STORE_MANAGER -> Manager Dashboard
REGIONAL_MANAGER -> Regional Dashboard
HEAD_OFFICE_ADMIN -> Admin/HO Dashboard if available
```

For MVP, if dashboards are not ready, route all authenticated users to:

```txt
/staff/dashboard
```

or:

```txt
StaffDashboardScreen
```

---

## H. Expo APK Build Requirement

The final Android build must be created through Expo.

Preferred method:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

Use this `eas.json` configuration:

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

For APK:

```bash
eas build -p android --profile preview
```

For Play Store AAB later:

```bash
eas build -p android --profile production
```

---

## I. Expo App Config

Ensure `app.json` or `app.config.ts` includes Android package details.

Example:

```json
{
  "expo": {
    "name": "Karmyogi HomeTown Staff",
    "slug": "karmyogi-hometown-staff",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "karmyogi",
    "userInterfaceStyle": "light",
    "android": {
      "package": "com.hometown.karmyogi.staff",
      "versionCode": 1,
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-location",
      "expo-document-picker",
      "expo-notifications",
      "expo-secure-store"
    ]
  }
}
```

If the existing Expo project already has `app.json` or `app.config.ts`, update it carefully without overwriting unrelated settings.

---

## J. Geofencing in Expo

Use:

```txt
expo-location
```

Attendance check-in must:

1. Ask for foreground location permission.
2. Get current GPS coordinates.
3. Send latitude and longitude to backend.
4. Backend validates geofence.
5. App displays success or failure.

Do not rely only on client-side geofence validation.

Client may show approximate distance, but backend must make final decision.

---

## K. PDF Certificate Download in Expo

Use:

```txt
expo-file-system
expo-sharing
expo-print
```

Certificate flow:

1. Backend generates PDF certificate.
2. App receives certificate download URL.
3. App downloads PDF using `expo-file-system`.
4. App opens share/download prompt using `expo-sharing`.
5. User can save or share the certificate.

If certificate is generated locally for demo mode:

1. Use `expo-print` to convert HTML to PDF.
2. Save the PDF locally.
3. Share/download using `expo-sharing`.

---

## L. PDF Upload in Expo

Use:

```txt
expo-document-picker
```

Upload flow:

1. User taps upload PDF.
2. Document picker opens.
3. User selects PDF.
4. App validates file type and size.
5. App uploads file using `multipart/form-data`.
6. Backend stores file in S3 or local development storage.
7. App shows upload status.

---

## M. Existing UI Must Be Extended, Not Replaced

Claude Code must:

- Reuse existing theme.
- Reuse existing components.
- Reuse existing button/input/card components.
- Reuse existing navigation structure.
- Reuse existing auth context/store.
- Add missing components only where required.
- Avoid duplicate components with same purpose.
- Avoid breaking current screens.

Before adding a new file, check whether equivalent file already exists.

---

## N. Expo Build Commands to Document in README

Add these commands to project README:

```bash
npm install
npx expo start
```

For Android local testing:

```bash
npx expo start --android
```

For APK build:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

For checking build status:

```bash
eas build:list
```

For downloading APK:

```bash
eas build:download
```

---

## O. Final Deliverable Expected

The final deliverable should be:

```txt
Existing Expo React Native project updated with:
- Existing login preserved
- Staff dashboard added
- Geofence attendance added
- Assignment pages added
- Courses pages added
- Quiz pages added
- Certificate PDF download added
- PDF upload added
- Targets page added
- Profile page added
- APK build configuration added
- eas.json added or updated
- app.json/app.config.ts updated carefully
```

Do not deliver a separate app.

Do not deliver only a design document.

The code must be inside the existing Expo project.

---

## P. Claude Code Build Checklist

Before finishing, verify:

```txt
[ ] Existing login still works
[ ] Authenticated user reaches staff dashboard
[ ] Bottom tabs work
[ ] Attendance page asks location permission
[ ] Check-in sends latitude and longitude
[ ] Assignment list renders
[ ] Course list renders
[ ] Quiz screen renders
[ ] Certificate list renders
[ ] Certificate PDF download works
[ ] PDF upload works
[ ] Targets page shows weekly/monthly/yearly sections
[ ] Profile page shows employee details
[ ] App runs with npx expo start
[ ] Android build profile exists in eas.json
[ ] APK build command documented
```

---

## Q. Important Instruction for Claude Code

When implementing this project, start by reading the existing Expo project files:

```txt
package.json
app.json or app.config.ts
app/
src/
navigation/
screens/
components/
store/
services/
```

Then make minimal, safe, additive changes.

Do not rewrite the whole project.

Do not remove existing login.

Do not create a new project.

Build staff features inside the existing Expo app only.


---

## 1. Product Vision

HomeTown has stores across multiple cities and regions. Store staff need a unified app for daily work, learning, accountability, training, attendance, target tracking, and certification.

The goal is to create a premium, reliable, mobile-first staff app that allows:

- Store employees to mark attendance using geofencing.
- Employees to view and complete assigned tasks.
- Employees to complete courses and quizzes.
- Employees to generate and download certificates after passing courses.
- Store managers to monitor staff progress.
- Head office to track staff performance, attendance, learning, targets, and compliance.
- Employees to view monthly, weekly, and yearly targets.
- Employees to upload PDFs or supporting documents when required.
- Employees to download certificates as PDF files.
- Admins to assign courses, quizzes, assignments, and performance targets.

The app should feel premium, clean, fast, secure, and suitable for a national-level retail workforce.

---

## 2. Target Users

### 2.1 Store Staff

Store staff are frontline employees working at HomeTown stores.

They can:

- Login using mobile number and OTP.
- Mark attendance using location-based geofencing.
- View daily attendance status.
- View assigned courses.
- Complete training modules.
- Attempt quizzes.
- View quiz scores.
- Generate certificates.
- Download certificates as PDFs.
- View weekly, monthly, quarterly, and yearly targets.
- Upload required PDFs or documents.
- Track personal progress.

### 2.2 Store Manager

Store managers manage employees at a specific store.

They can:

- View attendance of all staff in their store.
- Review assignment completion.
- View course progress.
- Track quiz scores.
- Approve or reject document uploads.
- Monitor individual employee targets.
- View team performance.
- Assign local tasks to store employees.
- Escalate issues to regional managers.

### 2.3 Regional Manager

Regional managers oversee multiple stores.

They can:

- View store-wise performance.
- Track regional attendance.
- Compare stores.
- Monitor training completion.
- Identify low-performing stores.
- View target achievement by store and employee.
- Download regional reports.

### 2.4 Head Office Admin

Head office manages the full system.

They can:

- Create and manage users.
- Create and manage stores.
- Create and manage regions.
- Assign courses.
- Create quizzes.
- Create assignments.
- Generate certificates.
- Create performance targets.
- View national dashboards.
- Export reports.
- Configure geofence radius.
- Manage app settings.

---

## 3. Recommended Technology Stack

### 3.1 Mobile App

Use one of the following approaches:

Preferred:

```txt
React Native + Expo + TypeScript
```

Alternative:

```txt
Flutter
```

For this project, use:

```txt
React Native + Expo + TypeScript
```

### 3.2 Backend

```txt
FastAPI + Python
```

### 3.3 Database

```txt
PostgreSQL
```

### 3.4 Cache / Queue

```txt
Redis
Celery
Celery Beat
```

### 3.5 Storage

Use one of:

```txt
AWS S3
Cloudinary
Azure Blob Storage
```

Preferred:

```txt
AWS S3
```

### 3.6 Authentication

```txt
JWT access token
JWT refresh token
HttpOnly secure cookies for web
Secure storage for mobile
OTP login using MSG91 / Twilio
```

### 3.7 PDF Generation

```txt
WeasyPrint
ReportLab
PDFKit
```

Preferred:

```txt
ReportLab for certificates
WeasyPrint for reports
```

### 3.8 Maps and Geofencing

```txt
Expo Location
Google Maps API
Haversine distance calculation
```

### 3.9 Notifications

```txt
Firebase Cloud Messaging
Expo Push Notifications
```

### 3.10 Admin Web Dashboard

```txt
React + Vite + TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
Zustand
```

---

## 4. App Modules

The app must be divided into these main modules:

1. Authentication Module
2. User Profile Module
3. Attendance and Geofencing Module
4. Store and Region Module
5. Assignment Module
6. Course and Learning Module
7. Quiz Module
8. Certificate Module
9. Document Upload Module
10. Targets Module
11. Notifications Module
12. Reports Module
13. Admin Dashboard Module
14. Manager Dashboard Module
15. Analytics Module
16. Settings Module

---

## 5. Mobile App Pages

### 5.1 Splash Screen

Purpose:

- Show HomeTown / Karmyogi branding.
- Check if user is already logged in.
- Restore session from secure storage.
- Redirect user based on role.

UI Requirements:

- Premium HomeTown branding.
- Cream, brown, gold, and dark blue color palette.
- Smooth loading animation.
- App version at bottom.

---

### 5.2 Login Page

The login page must support OTP-based login.

Fields:

- Mobile number
- Country code selector, default `+91`
- Login button
- Terms and privacy notice

Flow:

1. User enters mobile number.
2. User taps `Send OTP`.
3. Backend sends OTP through SMS gateway.
4. User is redirected to OTP verification page.
5. On success, save access token and refresh token.
6. Redirect according to user role.

Validation:

- Mobile number must be 10 digits for India.
- Country code required.
- Prevent multiple OTP requests.
- Show resend timer.

UI Elements:

- HomeTown logo
- App title: `Karmyogi Staff App`
- Subtitle: `Learn. Perform. Grow.`
- Mobile input
- Send OTP button
- Help text
- Support link

Security:

- Rate limit OTP requests.
- Max 5 OTP attempts per hour.
- OTP expiry after 5 minutes.
- Device fingerprint optional.
- Block repeated failed attempts temporarily.

---

### 5.3 OTP Verification Page

Fields:

- Six OTP input boxes
- Resend OTP button
- Change number link

Features:

- Auto-focus next OTP field.
- Paste full OTP support.
- 60-second resend timer.
- Error state for invalid OTP.
- Loading state while verifying.

Backend:

```http
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/refresh
POST /api/auth/logout
GET /api/auth/me
```

---

### 5.4 Home Dashboard Page

The dashboard should be role-aware.

For store staff, show:

- Today attendance status
- Current shift timing
- Pending assignments
- Courses in progress
- Quiz pending
- Target achievement
- Certificate count
- Notifications
- Quick actions

Cards:

1. Mark Attendance
2. My Courses
3. Pending Quiz
4. My Assignments
5. My Targets
6. My Certificates
7. Upload Document
8. Help Desk

Dashboard KPIs:

- Attendance this month
- Course completion percentage
- Assignment completion percentage
- Target achievement percentage
- Quiz average score
- Certificates earned

---

## 6. Attendance and Geofencing Module

### 6.1 Purpose

Allow staff to mark attendance only when they are physically present near their assigned HomeTown store.

### 6.2 Attendance Actions

Staff can:

- Check in
- Check out
- View daily attendance
- View monthly attendance
- View missed days
- Submit attendance correction request

### 6.3 Geofencing Logic

Each store must have:

- Store name
- Store code
- Latitude
- Longitude
- Allowed radius in meters
- Address
- City
- Region
- Active status

When user tries to check in:

1. App requests current GPS location.
2. App sends latitude and longitude to backend.
3. Backend retrieves assigned store coordinates.
4. Backend calculates distance using Haversine formula.
5. If user distance is within allowed radius, check-in is allowed.
6. If outside radius, check-in is blocked.
7. Attendance event is saved with coordinates and device details.

### 6.4 Haversine Formula

Use backend-side validation. Never trust only client-side location.

```python
from math import radians, sin, cos, sqrt, atan2

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = radians(lat1)
    phi2 = radians(lat2)
    delta_phi = radians(lat2 - lat1)
    delta_lambda = radians(lon2 - lon1)

    a = sin(delta_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c
```

### 6.5 Anti-Fraud Features

Implement:

- Backend geofence validation.
- Device ID tracking.
- GPS accuracy check.
- Block attendance if GPS accuracy is poor.
- Detect mock location where possible.
- Save IP address.
- Save app version.
- Save device model.
- Prevent duplicate check-in.
- Require selfie verification optionally.
- Allow manager approval for exceptions.
- Audit log every check-in and check-out.

### 6.6 Attendance API

```http
POST /api/attendance/check-in
POST /api/attendance/check-out
GET /api/attendance/today
GET /api/attendance/my-monthly-summary
GET /api/attendance/my-history
POST /api/attendance/correction-request
GET /api/manager/attendance/store-summary
GET /api/admin/attendance/report
```

### 6.7 Attendance Database Tables

```txt
attendance
- id
- user_id
- store_id
- check_in_time
- check_out_time
- check_in_latitude
- check_in_longitude
- check_out_latitude
- check_out_longitude
- check_in_distance_meters
- check_out_distance_meters
- check_in_status
- check_out_status
- device_id
- device_model
- gps_accuracy
- ip_address
- app_version
- remarks
- created_at
- updated_at
```

```txt
attendance_correction_requests
- id
- user_id
- store_id
- date
- reason
- requested_check_in
- requested_check_out
- status
- manager_id
- manager_remarks
- created_at
- updated_at
```

---

## 7. Assignment Module

### 7.1 Purpose

Assignments are tasks given to staff for store operations, learning reinforcement, visual merchandising, customer service, product knowledge, audits, or sales improvement.

### 7.2 Assignment Types

Support:

- Text assignment
- PDF upload assignment
- Image upload assignment
- Video upload assignment
- Checklist assignment
- Store audit assignment
- Customer interaction assignment
- Product knowledge assignment
- Sales target action assignment

### 7.3 Assignment Fields

```txt
assignment
- id
- title
- description
- assignment_type
- priority
- due_date
- assigned_by
- assigned_to_user_id
- assigned_to_store_id
- assigned_to_role
- attachments
- status
- created_at
- updated_at
```

### 7.4 Assignment Status

Use these statuses:

```txt
assigned
in_progress
submitted
under_review
approved
rejected
resubmission_required
overdue
```

### 7.5 Staff Assignment Page

Show:

- Assignment title
- Description
- Due date
- Priority badge
- Attachment download
- Submit button
- Upload proof
- Comment box
- Status timeline

### 7.6 Manager Assignment Review Page

Managers can:

- View submissions.
- Approve.
- Reject.
- Request resubmission.
- Add remarks.
- Download submitted files.

### 7.7 Assignment APIs

```http
POST /api/assignments
GET /api/assignments/my
GET /api/assignments/{assignment_id}
POST /api/assignments/{assignment_id}/start
POST /api/assignments/{assignment_id}/submit
POST /api/assignments/{assignment_id}/approve
POST /api/assignments/{assignment_id}/reject
POST /api/assignments/{assignment_id}/request-resubmission
GET /api/manager/assignments/store
GET /api/admin/assignments/report
```

---

## 8. Course and Learning Module

### 8.1 Purpose

Courses train store staff on furniture, decor, customer service, sales, store operations, compliance, safety, and HomeTown brand standards.

### 8.2 Course Categories

Examples:

- Product Knowledge
- Sofa Sales Training
- Mattress Training
- Modular Kitchen Training
- Home Decor Styling
- Customer Handling
- Visual Merchandising
- POS Billing Training
- Store Operations
- Safety and Compliance
- Warranty and Returns
- Upselling and Cross-Selling
- E-commerce Order Handling
- Design Consultation Basics

### 8.3 Course Structure

```txt
Course
  - Modules
    - Lessons
      - Video
      - PDF
      - Text
      - Image
      - External link
      - Quiz
```

### 8.4 Course Fields

```txt
courses
- id
- title
- description
- category
- thumbnail_url
- difficulty_level
- estimated_duration_minutes
- passing_score
- certificate_enabled
- status
- created_by
- created_at
- updated_at
```

```txt
course_modules
- id
- course_id
- title
- description
- sort_order
```

```txt
course_lessons
- id
- module_id
- title
- lesson_type
- content
- video_url
- pdf_url
- image_url
- duration_minutes
- sort_order
- is_mandatory
```

```txt
course_progress
- id
- user_id
- course_id
- module_id
- lesson_id
- progress_percentage
- completed
- completed_at
- last_accessed_at
```

### 8.5 Course Progress Rules

- A lesson is completed when user finishes video or opens required material.
- A course is completed only when all mandatory lessons are completed.
- Quiz must be passed if course has final quiz.
- Certificate is generated only after passing course requirements.

### 8.6 Course APIs

```http
GET /api/courses/my
GET /api/courses/{course_id}
POST /api/courses/{course_id}/start
POST /api/courses/{course_id}/lessons/{lesson_id}/complete
GET /api/courses/{course_id}/progress
POST /api/admin/courses
PUT /api/admin/courses/{course_id}
DELETE /api/admin/courses/{course_id}
POST /api/admin/courses/{course_id}/assign
```

---

## 9. Quiz Module

### 9.1 Purpose

Quizzes validate learning outcomes for store staff.

### 9.2 Question Types

Support:

1. Single choice MCQ
2. Multiple choice MCQ
3. True or false
4. Image-based question
5. Video-based question
6. Match the following
7. Fill in the blank
8. Short answer
9. Scenario-based question

### 9.3 Quiz Rules

Each quiz can have:

- Time limit
- Passing score
- Maximum attempts
- Randomized questions
- Randomized answer options
- Negative marking optional
- Question-level marks
- Course dependency
- Certificate dependency

### 9.4 Quiz Tables

```txt
quizzes
- id
- course_id
- title
- description
- time_limit_minutes
- passing_score
- max_attempts
- randomize_questions
- randomize_options
- status
- created_at
- updated_at
```

```txt
quiz_questions
- id
- quiz_id
- question_text
- question_type
- image_url
- video_url
- marks
- sort_order
```

```txt
quiz_options
- id
- question_id
- option_text
- is_correct
- sort_order
```

```txt
quiz_attempts
- id
- quiz_id
- user_id
- attempt_number
- score
- percentage
- passed
- started_at
- submitted_at
- time_taken_seconds
```

```txt
quiz_answers
- id
- attempt_id
- question_id
- selected_option_ids
- text_answer
- is_correct
- marks_awarded
```

### 9.5 Quiz APIs

```http
GET /api/quizzes/my
GET /api/quizzes/{quiz_id}
POST /api/quizzes/{quiz_id}/start
POST /api/quizzes/{quiz_id}/submit
GET /api/quizzes/{quiz_id}/result
GET /api/quizzes/my-results
POST /api/admin/quizzes
PUT /api/admin/quizzes/{quiz_id}
DELETE /api/admin/quizzes/{quiz_id}
```

---

## 10. Certificate Module

### 10.1 Purpose

Generate certificates for employees who complete courses and pass quizzes.

### 10.2 Certificate Rules

Generate certificate only when:

- Course is completed.
- Required quiz is passed.
- User is active.
- Course has certificate enabled.

### 10.3 Certificate Content

Certificate should include:

- HomeTown logo
- Karmyogi logo
- Certificate title
- Employee name
- Employee ID
- Course name
- Completion date
- Score
- Certificate ID
- QR code verification link
- Authorized signature
- Store name
- Region name

### 10.4 Certificate Design

Use a premium certificate design:

- Cream background
- Gold border
- Dark blue heading
- Brown/gold accent lines
- Elegant typography
- QR code bottom right
- Signature bottom left

### 10.5 Certificate APIs

```http
POST /api/certificates/generate
GET /api/certificates/my
GET /api/certificates/{certificate_id}
GET /api/certificates/{certificate_id}/download
GET /api/certificates/verify/{certificate_code}
```

### 10.6 Certificate Table

```txt
certificates
- id
- certificate_code
- user_id
- course_id
- quiz_id
- score
- certificate_url
- issued_at
- expires_at
- verification_url
- status
```

### 10.7 PDF Generation Requirements

The PDF certificate must:

- Be downloadable.
- Be shareable.
- Be stored in S3.
- Have unique certificate code.
- Include QR verification.
- Use A4 landscape layout.
- Generate within 3 seconds.
- Be regenerated only if admin allows.

---

## 11. PDF Upload and Document Module

### 11.1 Purpose

Allow users to upload PDFs and supporting documents for assignments, compliance, training proof, identity documents, or store operations.

### 11.2 Supported File Types

```txt
PDF
JPG
JPEG
PNG
DOC
DOCX
XLS
XLSX
```

### 11.3 Upload Rules

- Max file size: 10 MB for normal users.
- Max file size: 25 MB for admin uploads.
- Virus scan required for production.
- Store file in S3 or Cloudinary.
- Save file metadata in database.
- Validate MIME type.
- Do not trust only file extension.
- Generate secure signed URLs for private files.

### 11.4 Document Fields

```txt
documents
- id
- user_id
- related_entity_type
- related_entity_id
- file_name
- file_type
- file_size
- file_url
- storage_key
- upload_status
- approval_status
- approved_by
- approved_at
- rejection_reason
- created_at
- updated_at
```

### 11.5 Document APIs

```http
POST /api/documents/upload
GET /api/documents/my
GET /api/documents/{document_id}
GET /api/documents/{document_id}/download
POST /api/documents/{document_id}/approve
POST /api/documents/{document_id}/reject
DELETE /api/documents/{document_id}
```

---

## 12. Targets Module

### 12.1 Purpose

Show employees their performance targets across weekly, monthly, quarterly, and yearly periods.

Targets can include:

- Revenue target
- Sales target
- Category target
- Sofa target
- Mattress target
- Modular kitchen lead target
- Home decor sales target
- Warranty plan target
- Customer feedback target
- Design consultation booking target
- Online order handling target
- Training completion target

### 12.2 Target Periods

Support:

```txt
daily
weekly
monthly
quarterly
yearly
custom
```

### 12.3 Target Metrics

Examples:

```txt
sales_amount
sales_units
leads_generated
conversion_rate
average_order_value
customer_feedback_score
training_completion
quiz_score_average
assignment_completion
attendance_percentage
```

### 12.4 Staff Target Page

The targets page must show:

- Current week target
- Current month target
- Current year target
- Achieved value
- Pending value
- Percentage achieved
- Progress bar
- Category-wise target breakup
- Incentive eligibility
- Rank within store
- Tips to improve

Sections:

1. Weekly Target
2. Monthly Target
3. Yearly Target
4. Category Performance
5. Incentive Tracker
6. Target History
7. Manager Remarks

### 12.5 Target Table

```txt
targets
- id
- user_id
- store_id
- region_id
- target_type
- metric_type
- period_type
- period_start
- period_end
- target_value
- achieved_value
- achievement_percentage
- status
- created_by
- created_at
- updated_at
```

### 12.6 Target Status

```txt
not_started
in_progress
achieved
missed
exceeded
```

### 12.7 Target APIs

```http
GET /api/targets/my
GET /api/targets/my/weekly
GET /api/targets/my/monthly
GET /api/targets/my/yearly
GET /api/targets/my/history
POST /api/admin/targets
PUT /api/admin/targets/{target_id}
POST /api/admin/targets/bulk-upload
GET /api/manager/targets/store-summary
GET /api/admin/targets/report
```

---

## 13. Notifications Module

### 13.1 Notification Types

Support:

- New assignment
- Assignment due soon
- Assignment overdue
- New course assigned
- Quiz assigned
- Quiz result available
- Certificate generated
- Target updated
- Target achieved
- Attendance reminder
- Document approved
- Document rejected
- Manager announcement
- Head office announcement

### 13.2 Notification Channels

```txt
In-app notification
Push notification
SMS optional
Email optional
WhatsApp optional
```

### 13.3 Notification Table

```txt
notifications
- id
- user_id
- title
- message
- notification_type
- deep_link
- read_status
- sent_at
- read_at
- created_at
```

### 13.4 Notification APIs

```http
GET /api/notifications/my
POST /api/notifications/{notification_id}/read
POST /api/notifications/mark-all-read
POST /api/admin/notifications/send
```

---

## 14. Role-Based Access Control

### 14.1 Roles

Use these roles:

```txt
SUPER_ADMIN
HEAD_OFFICE_ADMIN
REGIONAL_MANAGER
STORE_MANAGER
STORE_STAFF
TRAINER
AUDITOR
```

### 14.2 Permissions

Use permission format:

```txt
resource:action
```

Examples:

```txt
attendance:read
attendance:create
attendance:approve
assignment:create
assignment:submit
assignment:review
course:create
course:assign
course:view
quiz:create
quiz:attempt
certificate:generate
target:create
target:view
document:upload
document:approve
report:export
```

### 14.3 Access Rules

- Store staff can only view their own data.
- Store managers can view their assigned store data.
- Regional managers can view assigned region data.
- Head office can view national data.
- Super admin can configure everything.

---

## 15. Backend Folder Structure

Use this FastAPI structure:

```txt
backend/
  app/
    main.py
    core/
      config.py
      security.py
      database.py
      redis.py
      celery_app.py
      logging.py
      permissions.py
    modules/
      auth/
        router.py
        service.py
        schemas.py
        models.py
        otp.py
      users/
        router.py
        service.py
        schemas.py
        models.py
      stores/
        router.py
        service.py
        schemas.py
        models.py
      attendance/
        router.py
        service.py
        schemas.py
        models.py
        geofence.py
      assignments/
        router.py
        service.py
        schemas.py
        models.py
      courses/
        router.py
        service.py
        schemas.py
        models.py
      quizzes/
        router.py
        service.py
        schemas.py
        models.py
      certificates/
        router.py
        service.py
        schemas.py
        models.py
        pdf_generator.py
        qr_generator.py
      documents/
        router.py
        service.py
        schemas.py
        models.py
        storage.py
      targets/
        router.py
        service.py
        schemas.py
        models.py
      notifications/
        router.py
        service.py
        schemas.py
        models.py
      reports/
        router.py
        service.py
        schemas.py
        models.py
    workers/
      tasks.py
      certificate_tasks.py
      notification_tasks.py
      report_tasks.py
    tests/
      test_auth.py
      test_attendance.py
      test_assignments.py
      test_courses.py
      test_quizzes.py
      test_certificates.py
      test_targets.py
  alembic/
  requirements.txt
  Dockerfile
  docker-compose.yml
```

---

## 16. Mobile App Folder Structure

Use this Expo React Native structure:

```txt
mobile/
  app/
    _layout.tsx
    index.tsx
    auth/
      login.tsx
      verify-otp.tsx
    dashboard/
      index.tsx
    attendance/
      index.tsx
      history.tsx
    assignments/
      index.tsx
      [id].tsx
      submit.tsx
    courses/
      index.tsx
      [id].tsx
      lesson.tsx
    quizzes/
      index.tsx
      attempt.tsx
      result.tsx
    certificates/
      index.tsx
      [id].tsx
    documents/
      upload.tsx
      index.tsx
    targets/
      index.tsx
      history.tsx
    profile/
      index.tsx
      settings.tsx
  src/
    components/
      ui/
      cards/
      forms/
      charts/
      layout/
    constants/
      colors.ts
      routes.ts
    hooks/
      useAuth.ts
      useLocation.ts
      useAttendance.ts
      useTargets.ts
    services/
      api.ts
      auth.service.ts
      attendance.service.ts
      assignment.service.ts
      course.service.ts
      quiz.service.ts
      certificate.service.ts
      target.service.ts
      document.service.ts
    store/
      auth.store.ts
      app.store.ts
    utils/
      validation.ts
      date.ts
      permissions.ts
      formatters.ts
    types/
      auth.types.ts
      attendance.types.ts
      assignment.types.ts
      course.types.ts
      quiz.types.ts
      certificate.types.ts
      target.types.ts
```

---

## 17. Admin Web Dashboard Folder Structure

```txt
admin-web/
  src/
    app/
      App.tsx
      routes.tsx
    components/
      ui/
      layout/
      cards/
      tables/
      charts/
      forms/
    pages/
      login/
      dashboard/
      users/
      stores/
      attendance/
      assignments/
      courses/
      quizzes/
      certificates/
      documents/
      targets/
      reports/
      settings/
    services/
      api.ts
      auth.service.ts
      user.service.ts
      store.service.ts
      attendance.service.ts
      assignment.service.ts
      course.service.ts
      quiz.service.ts
      certificate.service.ts
      target.service.ts
      report.service.ts
    hooks/
      useAuth.ts
      useUsers.ts
      useAttendance.ts
      useTargets.ts
    store/
      auth.store.ts
    types/
      index.ts
```

---

## 18. Design System

### 18.1 Brand Colors

Use this premium HomeTown-inspired palette:

```txt
Cream: #F8F1E7
Warm Cream: #EFE1CE
Espresso Brown: #3B2416
Walnut Brown: #6F4E37
Luxury Gold: #C8A24A
Deep Navy: #102A43
Rust Orange: #B85C38
Soft Grey: #F4F4F4
Success Green: #1F8A5B
Warning Amber: #F59E0B
Error Red: #DC2626
```

### 18.2 Typography

Recommended:

```txt
Heading: Playfair Display or Cormorant Garamond
Body: Inter or Manrope
Mobile App: Inter
Certificate: Playfair Display + Inter
```

### 18.3 UI Style

The app should feel:

- Premium
- Clean
- Trustworthy
- Corporate
- Mobile-first
- Easy for store staff
- Fast and lightweight

Use:

- Rounded cards
- Soft shadows
- Clear CTA buttons
- Large touch targets
- Progress bars
- Badges
- Role-based dashboards
- Bottom tab navigation
- Pull-to-refresh
- Skeleton loading
- Empty states
- Error states

---

## 19. Mobile Navigation

Use bottom tabs for staff:

```txt
Home
Attendance
Courses
Targets
Profile
```

Secondary pages:

```txt
Assignments
Quizzes
Certificates
Documents
Notifications
Help
```

For managers:

```txt
Home
Team
Attendance
Targets
Approvals
```

For admin web:

```txt
Dashboard
Users
Stores
Attendance
Assignments
Courses
Quizzes
Certificates
Targets
Reports
Settings
```

---

## 20. API Standards

### 20.1 Response Format

All APIs should follow this structure:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "errors": null
}
```

Error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    {
      "field": "mobile",
      "message": "Mobile number is required"
    }
  ]
}
```

### 20.2 Pagination Format

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### 20.3 API Versioning

Use:

```txt
/api/v1
```

---

## 21. Database Core Tables

### 21.1 Users

```txt
users
- id
- employee_code
- full_name
- mobile
- email
- role
- store_id
- region_id
- designation
- department
- profile_photo_url
- date_of_joining
- status
- last_login_at
- created_at
- updated_at
```

### 21.2 Stores

```txt
stores
- id
- store_code
- store_name
- address
- city
- state
- pincode
- region_id
- latitude
- longitude
- geofence_radius_meters
- manager_id
- active_status
- created_at
- updated_at
```

### 21.3 Regions

```txt
regions
- id
- region_name
- region_code
- regional_manager_id
- active_status
- created_at
- updated_at
```

### 21.4 Audit Logs

```txt
audit_logs
- id
- user_id
- action
- resource_type
- resource_id
- old_value
- new_value
- ip_address
- device_id
- created_at
```

---

## 22. Security Requirements

Implement:

- JWT authentication.
- Refresh token rotation.
- Password hashing for admin login using bcrypt.
- OTP rate limiting.
- Role-based authorization.
- Permission checks at API level.
- Secure file upload validation.
- S3 private bucket.
- Signed URLs.
- SQL injection prevention.
- XSS protection for web dashboard.
- CORS allowlist.
- Request size limits.
- Audit logs.
- Device tracking.
- Session expiry.
- Account disable support.
- Admin activity logs.

---

## 23. Offline and Low-Network Support

Store staff may face low network in some stores.

Implement:

- Cached dashboard.
- Cached assigned courses.
- Attendance retry queue.
- Upload retry queue.
- Offline warning banner.
- Background sync when network returns.
- Local draft saving for assignment submissions.
- Prevent fake offline attendance unless explicitly approved.

Offline attendance rule:

- App can save pending check-in locally.
- Backend must validate timestamp, device, and location when synced.
- If sync is delayed too long, mark attendance as `requires_manager_approval`.

---

## 24. Reports

### 24.1 Staff Reports

- My attendance report
- My course completion report
- My quiz result report
- My target report
- My certificate report

### 24.2 Manager Reports

- Store attendance report
- Store assignment report
- Store target report
- Store learning report
- Staff ranking report

### 24.3 Head Office Reports

- National attendance report
- Region-wise performance report
- Store-wise target report
- Course completion report
- Quiz performance report
- Certificate report
- Compliance document report

Export formats:

```txt
PDF
Excel
CSV
```

---

## 25. Analytics Dashboard

### 25.1 Staff Analytics

Show:

- Attendance percentage
- Learning completion
- Quiz score trend
- Target progress
- Certificate count
- Pending actions

### 25.2 Store Manager Analytics

Show:

- Team attendance
- Top performers
- Low performers
- Training completion
- Target progress
- Pending approvals

### 25.3 Head Office Analytics

Show:

- National KPI summary
- Region heatmap
- Store comparison
- Training completion by region
- Target achievement by category
- Attendance exceptions
- Compliance gaps

---

## 26. Certificate PDF Generation Flow

1. User completes course.
2. User passes quiz.
3. Backend checks eligibility.
4. Backend creates certificate record.
5. Celery task generates PDF.
6. QR code is generated.
7. PDF is uploaded to S3.
8. Certificate URL is saved.
9. User receives notification.
10. User can download certificate.

---

## 27. Attendance Flow

1. User opens Attendance page.
2. App asks location permission.
3. App fetches current location.
4. App shows assigned store.
5. App shows distance from store.
6. User taps Check In.
7. Backend validates location.
8. Backend saves attendance.
9. App shows success state.
10. User can check out later.

---

## 28. Target Flow

1. Admin creates targets.
2. Targets are assigned to user, store, or role.
3. Backend calculates achieved value.
4. Staff views progress.
5. Manager reviews team target progress.
6. Head office sees consolidated target dashboard.
7. Notifications are sent for target milestones.

---

## 29. Course Completion Flow

1. Admin creates course.
2. Admin adds modules and lessons.
3. Admin assigns course to role, store, region, or user.
4. Staff opens course.
5. Staff completes lessons.
6. Staff attempts quiz.
7. Staff passes quiz.
8. Certificate is generated.
9. Staff downloads certificate.

---

## 30. Assignment Flow

1. Manager or admin creates assignment.
2. Assignment is assigned to staff.
3. Staff receives notification.
4. Staff opens assignment.
5. Staff submits text, image, PDF, or checklist proof.
6. Manager reviews.
7. Manager approves or rejects.
8. Assignment status updates.
9. Analytics dashboard updates.

---

## 31. Push Notification Events

Send push notifications for:

- OTP login
- New assignment
- Assignment due tomorrow
- Assignment overdue
- New course assigned
- Quiz pending
- Quiz passed
- Certificate generated
- Attendance missing
- Target 50% achieved
- Target 100% achieved
- Document approved
- Document rejected
- Manager announcement

---

## 32. Testing Requirements

### 32.1 Backend Tests

Write tests for:

- OTP send
- OTP verify
- JWT refresh
- User role permissions
- Attendance geofence pass
- Attendance geofence fail
- Duplicate check-in prevention
- Assignment submission
- Assignment approval
- Course progress
- Quiz scoring
- Certificate generation
- Document upload
- Target calculation

### 32.2 Mobile Tests

Write tests for:

- Login validation
- OTP input
- Dashboard render
- Attendance location permission
- Course list
- Quiz attempt
- Certificate download
- Target progress

### 32.3 Manual UAT Scenarios

Test:

- Staff login
- Staff check-in inside store
- Staff check-in outside store
- Staff completes assignment
- Staff uploads PDF
- Staff completes course
- Staff attempts quiz
- Staff downloads certificate
- Staff views targets
- Manager approves assignment
- Admin creates target

---

## 33. Environment Variables

Backend `.env`:

```env
APP_NAME=Karmyogi Staff App
ENVIRONMENT=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/karmyogi
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=change-this-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

SMS_PROVIDER=MSG91
MSG91_AUTH_KEY=
MSG91_TEMPLATE_ID=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=karmyogi-staff-app

FCM_SERVER_KEY=

CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Mobile `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_APP_ENV=development
```

---

## 34. Docker Compose Services

Required services:

```txt
backend
postgres
redis
celery_worker
celery_beat
admin_web
```

Optional:

```txt
nginx
prometheus
grafana
minio
```

---

## 35. Development Commands

Backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Mobile:

```bash
cd mobile
npm install
npx expo start
```

Admin Web:

```bash
cd admin-web
npm install
npm run dev
```

Docker:

```bash
docker compose up --build
```

---

## 36. Acceptance Criteria

The project is considered complete when:

- Staff can login using OTP.
- Staff can mark attendance only within store geofence.
- Staff can view attendance history.
- Staff can view assigned courses.
- Staff can complete lessons.
- Staff can attempt quizzes.
- Staff can generate certificates.
- Staff can download certificates as PDFs.
- Staff can upload PDFs for assignments.
- Staff can view weekly, monthly, and yearly targets.
- Store manager can view team attendance.
- Store manager can approve assignments.
- Admin can create users, stores, courses, quizzes, assignments, and targets.
- Admin can export reports.
- Role-based access works correctly.
- App handles low network conditions.
- Backend has test coverage for critical modules.
- Production deployment works with HTTPS.

---

## 37. First Version MVP Scope

For the first working version, build:

1. OTP login
2. Staff dashboard
3. Geofence attendance
4. Assignment list and submission
5. Course list and lesson completion
6. Quiz attempt and result
7. Certificate generation and PDF download
8. PDF document upload
9. Weekly, monthly, yearly target page
10. Store manager dashboard
11. Admin web dashboard basic CRUD

---

## 38. Future Advanced Features

Add later:

- Face recognition attendance
- Selfie check-in
- AI training assistant
- Voice-based course assistant
- Multilingual support
- Hindi training modules
- Gamified leaderboard
- Incentive calculation
- Performance prediction
- Store heatmap
- AI-based low performer alert
- WhatsApp notifications
- E-commerce sales integration
- POS integration
- SAP integration
- HRMS integration
- Customer feedback integration
- AI-generated personalized learning path
- QR-based certificate verification
- Offline course download
- Store audit checklist with photo proof

---

## 39. Claude Code Instructions

When generating code for this project:

1. Use modular architecture.
2. Keep each module independent.
3. Use TypeScript for mobile and admin web.
4. Use Python typing for backend.
5. Use Pydantic schemas.
6. Use SQLAlchemy models.
7. Use Alembic migrations.
8. Use service layer pattern.
9. Use repository pattern if codebase becomes large.
10. Never put business logic directly in routers.
11. Always validate permissions.
12. Always validate geofence on backend.
13. Always validate file uploads.
14. Always use pagination for list APIs.
15. Always return consistent API response format.
16. Always write reusable UI components.
17. Use clean naming.
18. Use environment variables.
19. Add tests for critical business logic.
20. Add docstrings for complex functions.

---

## 40. Suggested Implementation Order

Build in this order:

1. Backend project setup
2. Database setup
3. Auth module
4. User and role module
5. Store and region module
6. Attendance and geofence module
7. Mobile app login
8. Mobile app dashboard
9. Assignment module
10. Course module
11. Quiz module
12. Certificate module
13. Document upload module
14. Target module
15. Manager dashboard
16. Admin dashboard
17. Reports
18. Notifications
19. Tests
20. Production deployment

---

## 41. Important Business Rules

- A user belongs to one primary store.
- A user can have only one active attendance record per day.
- Check-in must happen before check-out.
- Attendance outside geofence must be rejected or sent for approval.
- Course certificate requires course completion and quiz pass.
- Certificate code must be unique.
- Target achievement must be calculated regularly.
- Managers cannot view employees outside their store.
- Regional managers cannot view employees outside their region.
- Staff cannot approve their own assignments.
- Deleted records should use soft delete wherever required.
- Audit logs must be immutable.

---

## 42. Premium Staff Dashboard Content

Staff dashboard should display:

```txt
Good Morning, Priya
HomeTown Indore Store

Today
- Shift: 10:00 AM - 7:00 PM
- Attendance: Not Checked In
- Distance from store: 42 meters

Performance
- Monthly Target: ₹4,50,000
- Achieved: ₹2,85,000
- Progress: 63%

Learning
- Courses Assigned: 5
- Completed: 3
- Pending Quiz: 1

Assignments
- Pending: 2
- Due Today: 1
- Overdue: 0

Certificates
- Earned: 4
- Latest: Sofa Expert Level 1
```

---

## 43. Example Target Categories for HomeTown

Use these realistic HomeTown categories:

```txt
Sofas
Beds
Wardrobes
Dining Tables
Mattresses
Modular Kitchens
Home Decor
Lighting
Furnishings
Rugs and Carpets
Curtains
Wall Decor
Storage
Study Furniture
Outdoor Furniture
Design Consultation
Warranty Plans
Exchange and Upgrade
Online Orders
Customer Feedback
```

---

## 44. Example Courses for HomeTown Staff

Create seed data for:

```txt
HomeTown Brand Induction
Furniture Product Knowledge
Sofa Selling Masterclass
Mattress Recommendation Training
Modular Kitchen Basics
Home Decor Styling Guide
Customer Service Excellence
Handling E-commerce Orders
POS and Billing Process
Warranty and Return Policy
Visual Merchandising Standards
Festive Sales Preparation
Upselling and Cross-Selling
Store Safety and Compliance
Design Consultation Basics
```

---

## 45. Example Quizzes

Create quizzes for:

```txt
Furniture Product Knowledge Quiz
Sofa Sales Quiz
Mattress Recommendation Quiz
Customer Handling Quiz
Store Operations Quiz
Modular Kitchen Basics Quiz
Warranty Policy Quiz
Visual Merchandising Quiz
```

---

## 46. Example Assignments

Create assignment templates:

```txt
Upload Sofa Display Photo
Complete Mattress Training
Submit Customer Interaction Report
Update Visual Merchandising Checklist
Upload Store Cleanliness Proof
Complete Weekly Product Knowledge Task
Submit Modular Kitchen Lead Sheet
Upload Festive Display Setup Photo
Complete Customer Feedback Collection
Submit Competitor Price Check PDF
```

---

## 47. Non-Functional Requirements

Performance:

- API response under 300 ms for common endpoints.
- Attendance check-in under 2 seconds.
- Dashboard load under 3 seconds.
- Certificate generation under 3 seconds async.
- File upload progress visible.

Scalability:

- Support 10,000 staff users.
- Support 500 stores.
- Support 1 million attendance records.
- Support 100,000 certificates.

Availability:

- 99.5% uptime for MVP.
- 99.9% uptime for production scale.

Security:

- HTTPS only in production.
- Encrypt sensitive data.
- Audit all admin actions.
- Use signed URLs for documents.

Accessibility:

- Large tap targets.
- Clear contrast.
- Simple language.
- Support Hindi later.
- Avoid cluttered UI.

---

## 48. Final Build Goal

Build a complete, scalable, production-ready staff mobile app and admin dashboard for HomeTown that becomes the central operating system for store staff learning, attendance, assignments, certification, and target achievement.

The app should not feel like a simple LMS. It should feel like a modern retail workforce command platform.

