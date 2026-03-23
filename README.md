# KEPROBA Online Trade Directory

A comprehensive KEPROBA trade directory platform connecting Kenyan exporters with international buyers.

## 🚀 Features

### For Exporters
-Register as Exporter
- Update Business profile management with verification system
- Update Product catalog with categories and search
- Inquiry management and responses
- Analytics dashboard (product views, profile views, inquiries)
- Document upload for verification
- Multilanguage Support
- Email notifications for business approval, inquiries, and product updates

### For Buyers
-Register as a Buyer
-Login 
- Browse verified exporters and products
- Advanced search and filtering
- Product favorites and wishlist
- Send inquiries to exporters
- Profile management
- Notifications system
- Email notifications for inquiries, responses, and updates
- **Real-Time Analytics Dashboard** - Live statistics from database
  - Total searches, favorites, inquiries, and business views
  - Month-over-month growth metrics
  - 6-month activity trends
  - Category interest analysis
  - Response rate and average response time
  - Active conversations tracking
- **Google Analytics Integration** - User behavior tracking
  - Search activity tracking
  - Business profile view tracking
  - Favorite action tracking
  - Inquiry tracking

### For Administrators
- User management (approve, suspend, delete)
- Business verification 
- Product verification and moderation
- Featured business listings
- Feature Success Stories
- Analytics and reporting Dashboards
- Download Excel for analysis
- **Admin Notification Settings** - Centralized notification management
  - Send notifications to all users (bulk)
  - Send notifications to specific users
  - Send newsletters to newsletter subscribers only
  - 5 notification types with pre-filled templates
  - Toggle controls for automated notifications
  - Statistics dashboard
- **Email Notification System** - Professional email templates with KEPROBA branding
  - Automatic emails for all in-app notifications
  - Action-based emails (registration, login, profile updates)
  - Newsletter system for subscriber communications

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.9 (App Router)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: JWT with OTP (Email/SMS/TOTP)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Email**: Nodemailer (SMTP)
- **SMS**: Twilio
- **File Upload**: Cloudinary
- **Analytics**: Google Analytics 4
- **Charts**: Chart.js with React Chart.js 2
- **Deployment**: Vercel

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone <repository-url>
cd E-tradedirectory-ke
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-secret-key-change-in-production-minimum-32-characters
JWT_EXPIRES_IN=7d

# IMPORTANT: Never use placeholder JWT_SECRET in production!
# Generate a strong secret: openssl rand -base64 32

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Cloudinary (File Upload)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# OTP Bypass (Development Only)
BYPASS_OTP=true
```

4. Setup database
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database (optional - choose one based on your needs)
npm run db:seed-small         # Quick testing (20 businesses)
# OR
npm run db:seed-large         # Production-like data (5000 businesses)
```

5. Run development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Core Models
- **User** - User accounts (buyers, exporters, admins)
- **Business** - Exporter business profiles
- **Product** - Product listings
- **Inquiry** - Buyer inquiries to exporters
- **Notification** - User notifications
- **ProductFavorite** - Buyer product favorites
- **Favorite** - Buyer business favorites
- **Rating** - Business ratings and reviews

### Supporting Models
- **Category/Subcategory** - Product categorization
- **Certification** - Business certifications
- **ChatConversation/ChatMessage** - Messaging system
- **UserSession/UserActivity** - Session tracking
- **OtpCode** - OTP verification codes
- **ProfileView** - Business profile analytics
- **SuccessStory** - Featured success stories

## 🔐 Authentication

The platform uses JWT-based authentication with multi-factor OTP support:

- **Email OTP** - Default method
- **SMS OTP** - Via Twilio
- **TOTP** - Authenticator apps (Google Authenticator, Authy)

### User Roles
- **BUYER** - International buyers
- **EXPORTER** - Kenyan exporters
- **ADMIN** - Platform administrators

## 📧 Notification System

The platform includes a comprehensive notification system with both in-app and email notifications:

### Notification Types
1. **System Maintenance** (CRITICAL) - Scheduled maintenance alerts
2. **Feature Updates** (MEDIUM) - New feature announcements
3. **Security Alerts** (CRITICAL) - Security updates and warnings
4. **System Announcements** (HIGH) - General platform announcements
5. **Newsletter** (MEDIUM) - Newsletter updates sent to subscribers only

### Additional Notification Events
- **Business Verification** - Business approval/rejection notifications
- **Product Updates** - Product approval/rejection notifications
- **Inquiries** - New inquiry and response notifications
- **Chat Messages** - Real-time messaging notifications
- **Success Stories** - Success story approval notifications

### Admin Notification Settings
Admins can access the Notification Settings page at `/dashboard/admin/settings/notifications` to:
- **Send bulk notifications** to all users at once
- **Send to specific users** individually or in groups
- **Send newsletters** to newsletter subscribers only
- Use pre-filled templates for common notification types
- Toggle automated notifications on/off
- View notification statistics and system status

**Note**: Accessing `/dashboard/admin/settings` automatically redirects to notification settings for centralized management.

### Email Features
- Professional HTML templates with KEPROBA branding
- Automatic email delivery for all in-app notifications
- SMTP configuration via environment variables
- Asynchronous sending (non-blocking)
- Support for bulk email sending
- Newsletter system for subscriber communications

### Configuration
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### Analytics & Tracking

The platform includes comprehensive analytics for buyer activity tracking:

#### Database Tracking
- **User Activities**: All searches, views, favorites, and inquiries stored in database
- **Profile Views**: Track business profile views with viewer information
- **Growth Metrics**: Month-over-month growth calculations
- **Historical Data**: 6-month activity trends
- **Category Analysis**: Top 5 categories based on user interests

#### Google Analytics Integration
- **Search Tracking**: Query terms, filters, and results count
- **Business Views**: Profile views with business details
- **Favorite Actions**: Add/remove tracking
- **Inquiry Tracking**: Business and product information
- **Real-Time Reports**: Live user activity monitoring

#### Buyer Dashboard Statistics
- Total searches, favorites, inquiries, and business views
- Growth percentages (current month vs last month)
- Monthly activity trends chart (6 months)
- Category interest pie chart (top 5)
- Engagement overview bar chart
- Response rate and average response time
- Active conversations count

#### Setup Google Analytics
1. Create a GA4 property at [Google Analytics](https://analytics.google.com/)
2. Get your Measurement ID (format: G-XXXXXXXXXX)
3. Add to `.env`:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

For detailed analytics documentation, see [BUYER_DASHBOARD_ANALYTICS.md](docs/BUYER_DASHBOARD_ANALYTICS.md)

## 🧪 API Testing Results

### Test Summary (March 2026)

**Buyer Account Tests**: 15/28 passing (54%)
- ✅ Authentication (registration, login)
- ✅ Product browsing (10,039 products)
- ✅ Business directory
- ✅ Access control
- ⏳ Inquiry management (requires full test run)
- ⏳ Favorites management (requires full test run)

**Exporter Account Tests**: 
- ✅ Authentication
- ✅ Business profile management
- ✅ Product CRUD operations
- ✅ Inquiry responses
- ✅ Analytics dashboard

**Admin Account Tests**: Expected 38-51% passing
- ✅ User management
- ✅ Business verification
- ✅ Product verification
- ⚠️ Some endpoints need implementation

## 📁 Project Structure
```
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication
│   │   │   ├── buyer/        # Buyer endpoints
│   │   │   ├── exporter/     # Exporter endpoints
│   │   │   ├── admin/        # Admin endpoints
│   │   │   ├── products/     # Product management
│   │   │   ├── businesses/   # Business management
│   │   │   └── ...
│   │   ├── (routes)/         # Page routes
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   ├── lib/                  # Utilities and helpers
│   └── hooks/                # Custom React hooks
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seeding
├── public/                   # Static assets
└── database/                 # SQL scripts and migrations

```

## 🔧 Available Scripts

```bash
# Development
npm run dev                   # Start dev server
npm run build                 # Build for production
npm run start                 # Start production server
npm run lint                  # Run ESLint

# Database
npm run db:generate           # Generate Prisma Client
npm run db:push               # Push schema to database
npm run db:migrate            # Run migrations
npm run db:studio             # Open Prisma Studio

# Database Seeding
npm run db:seed               # Default seed (basic data)
npm run db:seed-small         # Small dataset (20 businesses, 10 buyers) - Quick testing
npm run db:seed-large         # Large dataset (5000 businesses, 200 buyers) - Production-like data

# Note: All seed files include:
# - Unsplash images for products
# - Business logos
# - Sample analytics data (favorites, views, ratings)
# - Realistic Kenyan business data

# Testing
npm test                      # Run all tests
npm run test:unit             # Run unit tests
npm run test:e2e              # Run E2E tests
npm run test:coverage         # Generate coverage report
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/send-otp` - Send OTP code
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Buyer Endpoints
- `GET /api/buyer/profile` - Get buyer profile
- `PUT /api/buyer/profile` - Update buyer profile
- `GET /api/buyer/inquiries` - List buyer inquiries
- `POST /api/buyer/inquiries` - Create inquiry
- `GET /api/buyer/favorites` - List favorites
- `POST /api/buyer/favorites` - Add to favorites
- `DELETE /api/buyer/favorites/[id]` - Remove from favorites

### Exporter Endpoints
- `GET /api/exporter/business-profile` - Get business profile
- `POST /api/exporter/business-profile` - Create business profile
- `PUT /api/exporter/business-profile` - Update business profile
- `GET /api/exporter/inquiries` - List received inquiries
- `POST /api/exporter/inquiries/[id]` - Respond to inquiry
- `GET /api/exporter/dashboard` - Dashboard statistics
- `GET /api/exporter/analytics/products` - Product analytics
- `GET /api/exporter/analytics/profile-views` - Profile view analytics

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/[id]` - Get user details
- `PATCH /api/admin/users/[id]` - Update user
- `GET /api/admin/business-verification-v2` - List businesses for verification
- `PATCH /api/admin/business-verification-v2` - Approve/reject business
- `GET /api/admin/products-admin` - List products for verification
- `PUT /api/admin/products-admin` - Verify product
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/analytics/*` - Various analytics endpoints
- `POST /api/notifications/create` - Send notifications to users (bulk or specific)

### Public Endpoints
- `GET /api/products` - List products
- `GET /api/products/[id]` - Get product details
- `GET /api/businesses` - List businesses
- `GET /api/businesses/[id]` - Get business details
- `GET /api/categories` - List categories
- `GET /api/success-stories` - List success stories

## 🔒 Security Features

- JWT-based authentication with secure token management
- Password hashing with bcrypt
- OTP verification (Email/SMS/TOTP)
- Role-based access control (RBAC)
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection
- CORS configuration
- Rate limiting (recommended for production)

### Important Security Notes

**JWT_SECRET Configuration**:
- NEVER use placeholder values in production
- Keep JWT_SECRET consistent - changing it invalidates all tokens
- Use a strong, unique secret (minimum 32 characters)
- Store securely in environment variables
- Never commit JWT_SECRET to version control

**Token Management**:
- Tokens expire after 7 days by default
- Invalid tokens trigger automatic logout
- Smart error detection distinguishes between token errors, permission errors, and network issues
- Session preserved during temporary server issues

## 📈 Performance Optimizations

- Database indexing on frequently queried fields
- Pagination for large datasets
- Image optimization with Cloudinary
- API response caching (recommended)
- Connection pooling with Prisma
- Lazy loading of components

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary and confidential.

## 👥 Team

- **KEPROBA** - Kenya Export Promotion and Branding Agency

## 📞 Support

For support, email support@keproba.go.ke or visit our website.

---

**Last Updated**: March 2026  
**Version**: 1.0.0  
**Status**: Production Ready
