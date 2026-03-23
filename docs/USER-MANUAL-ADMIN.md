# KEPROBA Trade Directory - Administrator User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [User Management](#user-management)
5. [Business Verification](#business-verification)
6. [Product Verification](#product-verification)
7. [Content Management](#content-management)
8. [Analytics & Reports](#analytics--reports)
9. [System Settings](#system-settings)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Introduction

### About This Manual
This manual provides comprehensive guidance for administrators managing the KEPROBA Trade Directory platform. As an administrator, you have full access to manage users, verify businesses, moderate content, and configure system settings.

### Administrator Responsibilities
- Verify and approve business registrations
- Review and approve product listings
- Manage user accounts and permissions
- Monitor platform activity and analytics
- Maintain content quality and accuracy
- Configure system settings
- Handle user inquiries and support requests

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- Screen resolution: 1280x720 or higher recommended
- Administrator account credentials

---

## Getting Started

### Accessing the Admin Panel

1. **Navigate to Login Page**
   - Go to: `https://otd-ten.vercel.app/login`
   - Or click "Login" from the homepage

2. **Enter Admin Credentials**
   - Email: Your admin email address
   - Password: Your secure password
   - Click "Sign In"

3. **Two-Factor Authentication (if enabled)**
   - Enter the 6-digit code from your authenticator app
   - Click "Verify"

4. **Access Admin Dashboard**
   - After successful login, you'll be redirected to the admin dashboard
   - URL: `https://otd-ten.vercel.app/dashboard/admin`

### First-Time Setup

1. **Update Your Profile**
   - Click your profile icon (top right)
   - Select "Profile"
   - Update your information
   - Upload a profile picture
   - Click "Save Changes"

2. **Enable Two-Factor Authentication**
   - Go to Settings → Security
   - Click "Enable 2FA"
   - Scan QR code with authenticator app
   - Enter verification code
   - Save backup codes securely

3. **Configure Notifications**
   - Go to Settings → Notifications
   - Enable email notifications for:
     - New business registrations
     - Pending verifications
     - User reports
     - System alerts

---

## Dashboard Overview

### Main Dashboard Components

#### 1. Statistics Cards
- **Total Users**: Current registered users count
- **Total Businesses**: Verified and pending businesses
- **Total Products**: All product listings
- **Pending Verifications**: Items awaiting approval

#### 2. Growth Trends Chart
- Visual representation of platform growth
- Shows businesses and products over time
- Filter by: Last 6 months, Last year, All time

#### 3. Verification Status
- Pie chart showing verification breakdown:
  - Verified: 100.0%
  - Pending: 0.0%
  - Rejected: 0.0%

#### 4. Recent Activities
- Latest platform activities
- User registrations
- Business submissions
- Product uploads
- Verification actions

#### 5. Quick Actions
- **Verify Businesses**: Jump to verification queue
- **Manage Users**: Access user management
- **View Analytics**: Detailed analytics dashboard
- **System Settings**: Configure platform settings

### Navigation Menu

**Left Sidebar Menu:**
- 🏠 Dashboard - Main overview
- 👥 Users - User management
- 🏢 Businesses - Business listings
- 📦 Products - Product catalog
- ✅ Business Verification - Approval queue
- ✅ Product Verification - Product approval
- 📊 Analytics - Detailed reports
- 📰 CMS - Content management
- 🏭 Industries - Industry categories
- 🌍 Export Markets - Market management
- 🎯 Export Sectors - Sector management
- ⚙️ Settings - System configuration

---

## User Management

### Viewing Users

1. **Access User Management**
   - Click "Users" in the sidebar
   - View all registered users in a table

2. **User Information Displayed**
   - Name and email
   - Role (Admin, Exporter, Buyer)
   - Status (Active, Inactive, Suspended)
   - Registration date
   - Last login
   - Activity count

3. **Search and Filter**
   - Search by name or email
   - Filter by role
   - Filter by status
   - Sort by any column

### User Actions

#### View User Details
1. Click the "👁️ View" button on any user
2. Review user information:
   - Personal details
   - Contact information
   - Business associations
   - Activity history
   - Login history

#### Edit User
1. Click "✏️ Edit" button
2. Modify user information:
   - Name and contact details
   - Role assignment
   - Status (Active/Inactive)
3. Click "Save Changes"

#### Suspend User
1. Click "⏸️ Suspend" button
2. Confirm suspension
3. User will be logged out immediately
4. User cannot log in until reactivated

#### Delete User
1. Click "🗑️ Delete" button
2. Confirm deletion
3. **Warning**: This action is permanent
4. All user data will be removed

### Managing Roles

**Role Types:**

1. **Admin**
   - Full system access
   - Can manage all users
   - Can verify businesses and products
   - Can configure system settings

2. **Exporter**
   - Can create business profile
   - Can add products
   - Can receive inquiries
   - Can view analytics

3. **Buyer**
   - Can search directory
   - Can send inquiries
   - Can save favorites
   - Can rate businesses

**Changing User Role:**
1. Edit user details
2. Select new role from dropdown
3. Save changes
4. User will have new permissions on next login

### User Activity Monitoring

1. **View Activity Tab**
   - Click on user → Activity tab
   - See all user actions:
     - Login history
     - Profile updates
     - Business submissions
     - Product uploads
     - Inquiries sent/received

2. **Export Activity Log**
   - Click "Export" button
   - Choose format (CSV, Excel, PDF)
   - Download activity report

---

## Business Verification

### Verification Queue

1. **Access Verification Queue**
   - Click "Business Verification" in sidebar
   - View all pending businesses

2. **Business Information Displayed**
   - Business name and logo
   - Owner information
   - Registration details
   - Submission date
   - Status (Pending, Verified, Rejected)

### Verification Process

#### Step 1: Review Business Details

1. **Click "View" on pending business**
2. **Review Basic Information:**
   - Business name
   - Type of business
   - Year established
   - Number of employees
   - KRA PIN
   - Sector/Industry

3. **Review Location Details:**
   - Physical address
   - County and town
   - GPS coordinates
   - Contact information

4. **Review Export Information:**
   - Current export markets
   - Target markets
   - Export license number
   - Business organization membership

#### Step 2: Verify Documents

1. **Company Logo**
   - Check image quality
   - Verify authenticity
   - Ensure appropriate content

2. **Registration Certificate**
   - Click "View" to open PDF
   - Verify business registration number
   - Check validity and authenticity
   - Confirm matches business details

3. **PIN Certificate**
   - Click "View" to open PDF
   - Verify KRA PIN number
   - Check validity
   - Confirm matches business details

4. **Export License (if applicable)**
   - Click "View" to open PDF
   - Verify license number
   - Check expiry date
   - Confirm export authorization

5. **Tax Certificate (if provided)**
   - Click "View" to open PDF
   - Verify tax compliance
   - Check validity period

#### Step 3: Review Certifications

1. **Check Certification Details:**
   - Certification name (ISO, GlobalGAP, FairTrade, etc.)
   - Issuing authority
   - Issue date
   - Valid until date
   - Certificate number

2. **Verify Certificate Documents:**
   - Click "View" on each certification
   - Check authenticity
   - Verify validity period
   - Confirm issuing authority

#### Step 4: Review Products

1. **Check Product Listings:**
   - Product names and descriptions
   - Categories and subcategories
   - HS codes
   - Images quality
   - Pricing information (if provided)

2. **Verify Product Information:**
   - Accurate descriptions
   - Appropriate categories
   - Valid HS codes
   - Professional images

#### Step 5: Make Verification Decision

**Option A: Approve Business**
1. Click "✅ Approve" button
2. Add approval notes (optional)
3. Confirm approval
4. Business status changes to "VERIFIED"
5. Business appears in public directory
6. Owner receives approval notification

**Option B: Reject Business**
1. Click "❌ Reject" button
2. **Required**: Enter rejection reason
   - Be specific and clear
   - Explain what needs correction
   - Provide guidance for resubmission
3. Confirm rejection
4. Business status changes to "REJECTED"
5. Owner receives rejection notification with reason

**Option C: Request More Information**
1. Click "📝 Request Info" button
2. Specify what information is needed
3. Business status changes to "PENDING_INFO"
4. Owner receives notification with request

### Verification Best Practices

1. **Document Verification**
   - Always open and review all documents
   - Check for tampering or alterations
   - Verify document dates and validity
   - Cross-reference information across documents

2. **Business Legitimacy**
   - Verify KRA PIN on iTax portal (if possible)
   - Check business registration with relevant authorities
   - Verify export license with export promotion council
   - Confirm physical address exists

3. **Quality Standards**
   - Ensure professional presentation
   - Check for complete information
   - Verify contact details are valid
   - Confirm GPS coordinates are accurate

4. **Rejection Guidelines**
   - Always provide clear, specific reasons
   - Be professional and constructive
   - Offer guidance for correction
   - Allow resubmission after corrections

5. **Approval Criteria**
   - All required documents submitted
   - Documents are valid and authentic
   - Information is complete and accurate
   - Business meets export standards
   - No red flags or concerns

### Bulk Actions

1. **Select Multiple Businesses**
   - Check boxes next to businesses
   - Click "Bulk Actions" dropdown

2. **Available Bulk Actions:**
   - Approve selected
   - Reject selected
   - Export selected
   - Send notification

---

## Product Verification

### Product Verification Queue

1. **Access Product Verification**
   - Click "Product Verification" in sidebar
   - View all pending products

2. **Product Information Displayed**
   - Product name and image
   - Business name
   - Category and subcategory
   - HS code
   - Submission date
   - Status

### Product Verification Process

#### Step 1: Review Product Details

1. **Click "View" on pending product**
2. **Review Information:**
   - Product name
   - Description
   - Category and subcategory
   - HS code
   - Minimum order quantity
   - Packaging details
   - Certifications

3. **Check Product Image:**
   - Professional quality
   - Clear and well-lit
   - Shows actual product
   - Appropriate content
   - No watermarks or logos (except business logo)

#### Step 2: Verify Product Information

1. **Category Accuracy**
   - Product in correct category
   - Subcategory is appropriate
   - Matches product description

2. **HS Code Verification**
   - HS code is valid
   - Matches product type
   - Correct for export classification

3. **Description Quality**
   - Clear and detailed
   - Accurate information
   - Professional language
   - No misleading claims

4. **Certifications**
   - Relevant to product
   - Valid and current
   - Properly documented

#### Step 3: Make Decision

**Approve Product:**
1. Click "✅ Approve" button
2. Add notes (optional)
3. Confirm approval
4. Product appears in directory

**Reject Product:**
1. Click "❌ Reject" button
2. Enter rejection reason
3. Confirm rejection
4. Owner receives notification

### Product Verification Guidelines

1. **Image Quality Standards**
   - Minimum resolution: 800x800 pixels
   - Clear focus and lighting
   - Professional presentation
   - No inappropriate content

2. **Description Standards**
   - Minimum 50 characters
   - Clear and accurate
   - No spam or keywords stuffing
   - Professional language

3. **HS Code Validation**
   - Must be 6-10 digits
   - Valid international code
   - Matches product category
   - Correct for export purposes

4. **Rejection Reasons**
   - Poor image quality
   - Incomplete information
   - Incorrect categorization
   - Invalid HS code
   - Misleading description
   - Inappropriate content

---

## Content Management

### Managing Homepage Content

1. **Access CMS**
   - Click "CMS" in sidebar
   - Select "Homepage Content"

2. **Hero Section**
   - Edit main headline
   - Update subheading
   - Change call-to-action text
   - Upload hero image

3. **Featured Exporters**
   - Select businesses to feature
   - Set display order
   - Update featured period

4. **Success Stories**
   - Add new success stories
   - Edit existing stories
   - Upload story images
   - Set publication status

### Managing Static Pages

1. **About Page**
   - Edit organization information
   - Update mission and vision
   - Manage team members
   - Update contact details

2. **FAQ Page**
   - Add new questions
   - Edit existing FAQs
   - Organize by category
   - Set display order

3. **Terms & Conditions**
   - Update legal terms
   - Version control
   - Publication date

4. **Privacy Policy**
   - Update privacy terms
   - GDPR compliance
   - Data handling policies

### Newsletter Management

1. **View Subscribers**
   - Access subscriber list
   - Export email addresses
   - View subscription date

2. **Send Newsletter**
   - Create newsletter content
   - Select recipients
   - Schedule or send immediately
   - Track open rates

---

## Analytics & Reports

### Dashboard Analytics

1. **Access Analytics**
   - Click "Analytics" in sidebar
   - View comprehensive reports

2. **Key Metrics:**
   - Total users (by role)
   - Total businesses (by status)
   - Total products (by category)
   - Verification statistics
   - Growth trends
   - User activity

### User Analytics

1. **User Growth**
   - New registrations over time
   - User retention rate
   - Active vs inactive users
   - User distribution by role

2. **User Activity**
   - Login frequency
   - Feature usage
   - Inquiry patterns
   - Search behavior

### Business Analytics

1. **Business Statistics**
   - Total businesses by sector
   - Verification rate
   - Geographic distribution
   - Export markets coverage

2. **Business Performance**
   - Profile views
   - Inquiry received
   - Rating distribution
   - Favorite counts

### Product Analytics

1. **Product Statistics**
   - Products by category
   - Products by business
   - Verification status
   - HS code distribution

2. **Product Performance**
   - Most viewed products
   - Most inquired products
   - Category popularity
   - Search trends

### Export Reports

1. **Generate Reports**
   - Select report type
   - Choose date range
   - Select format (CSV, Excel, PDF)
   - Click "Generate Report"

2. **Available Reports:**
   - User report
   - Business report
   - Product report
   - Verification report
   - Activity report
   - Analytics summary

3. **Schedule Reports**
   - Set report frequency (daily, weekly, monthly)
   - Select recipients
   - Choose format
   - Enable/disable schedule

---

## System Settings

### General Settings

1. **Site Information**
   - Site name
   - Site description
   - Contact email
   - Support phone
   - Physical address

2. **Business Hours**
   - Operating hours
   - Time zone
   - Holiday schedule

3. **Social Media**
   - Facebook URL
   - Twitter URL
   - LinkedIn URL
   - Instagram URL
   - YouTube URL

### Email Settings

1. **SMTP Configuration**
   - SMTP server
   - Port number
   - Username
   - Password
   - Encryption (TLS/SSL)

2. **Email Templates**
   - Welcome email
   - Verification email
   - Approval notification
   - Rejection notification
   - Password reset
   - Newsletter template

3. **Email Notifications**
   - Enable/disable notifications
   - Set recipients
   - Configure triggers

### Security Settings

1. **Password Policy**
   - Minimum length
   - Complexity requirements
   - Expiration period
   - History count

2. **Two-Factor Authentication**
   - Enforce 2FA for admins
   - Optional for users
   - Backup codes

3. **Session Management**
   - Session timeout
   - Concurrent sessions
   - Remember me duration

4. **IP Restrictions**
   - Whitelist IP addresses
   - Block suspicious IPs
   - Geographic restrictions

### Verification Settings

1. **Business Verification**
   - Required documents
   - Verification criteria
   - Auto-approval rules
   - Rejection reasons list

2. **Product Verification**
   - Required fields
   - Image requirements
   - HS code validation
   - Auto-approval rules

3. **Certification Verification**
   - Accepted certifications
   - Validity period
   - Verification process

### Export Settings

1. **Export Markets**
   - Add new markets
   - Edit existing markets
   - Set market regions
   - Enable/disable markets

2. **Export Sectors**
   - Add new sectors
   - Edit existing sectors
   - Set sector categories
   - Enable/disable sectors

3. **Industries**
   - Add new industries
   - Edit existing industries
   - Set industry categories
   - Enable/disable industries

### Notification Settings

1. **Admin Notifications**
   - New business registration
   - Pending verifications
   - User reports
   - System alerts
   - Error notifications

2. **User Notifications**
   - Welcome email
   - Verification status
   - Inquiry received
   - Profile views
   - Newsletter

3. **Notification Channels**
   - Email
   - SMS (if configured)
   - In-app notifications
   - Push notifications

---

## Best Practices

### Verification Best Practices

1. **Timely Processing**
   - Review submissions within 24-48 hours
   - Prioritize complete submissions
   - Communicate delays to users

2. **Thorough Review**
   - Check all documents carefully
   - Verify information accuracy
   - Cross-reference data
   - Look for red flags

3. **Clear Communication**
   - Provide specific feedback
   - Be professional and courteous
   - Offer guidance for corrections
   - Follow up on pending items

4. **Consistency**
   - Apply standards uniformly
   - Document decisions
   - Follow verification checklist
   - Maintain quality standards

### User Management Best Practices

1. **Account Security**
   - Enforce strong passwords
   - Enable 2FA for admins
   - Monitor suspicious activity
   - Regular security audits

2. **User Support**
   - Respond to inquiries promptly
   - Provide clear instructions
   - Document common issues
   - Maintain FAQ section

3. **Data Privacy**
   - Protect user information
   - Follow GDPR guidelines
   - Secure data storage
   - Regular backups

### Content Management Best Practices

1. **Quality Control**
   - Review all content before publishing
   - Maintain professional standards
   - Check for accuracy
   - Update regularly

2. **SEO Optimization**
   - Use relevant keywords
   - Optimize meta descriptions
   - Create quality content
   - Update regularly

3. **User Experience**
   - Clear navigation
   - Mobile-friendly design
   - Fast loading times
   - Accessible content

### Analytics Best Practices

1. **Regular Monitoring**
   - Check analytics daily
   - Track key metrics
   - Identify trends
   - Address issues promptly

2. **Data-Driven Decisions**
   - Use analytics for planning
   - Identify improvement areas
   - Measure success
   - Adjust strategies

3. **Reporting**
   - Generate regular reports
   - Share with stakeholders
   - Document insights
   - Track progress

---

## Troubleshooting

### Common Issues and Solutions

#### Login Issues

**Problem**: Cannot log in to admin panel
**Solutions:**
1. Verify email and password are correct
2. Check if account is active
3. Clear browser cache and cookies
4. Try different browser
5. Reset password if needed
6. Contact system administrator

**Problem**: 2FA code not working
**Solutions:**
1. Ensure time on device is synchronized
2. Generate new code
3. Check authenticator app is correct
4. Use backup code
5. Contact administrator to reset 2FA

#### Verification Issues

**Problem**: Cannot view documents
**Solutions:**
1. Check internet connection
2. Try different browser
3. Clear browser cache
4. Ensure PDF viewer is enabled
5. Download document and view locally

**Problem**: Verification button not working
**Solutions:**
1. Refresh the page
2. Check all required fields are reviewed
3. Clear browser cache
4. Try different browser
5. Contact technical support

#### User Management Issues

**Problem**: Cannot edit user
**Solutions:**
1. Check admin permissions
2. Refresh the page
3. Verify user exists
4. Check for system errors
5. Contact technical support

**Problem**: User not receiving notifications
**Solutions:**
1. Check email settings
2. Verify email address is correct
3. Check spam folder
4. Test email configuration
5. Review notification settings

#### System Performance Issues

**Problem**: Slow page loading
**Solutions:**
1. Check internet connection
2. Clear browser cache
3. Close unnecessary tabs
4. Try different browser
5. Check system status
6. Contact technical support

**Problem**: Features not working
**Solutions:**
1. Refresh the page
2. Clear browser cache
3. Check browser console for errors
4. Try different browser
5. Report issue to technical support

### Getting Help

#### Support Channels

1. **Technical Support**
   - Email: support@keproba.go.ke
   - Phone: +254 722 205 875
   - Hours: Monday-Friday, 8:00 AM - 5:00 PM EAT

2. **Documentation**
   - User manuals
   - Video tutorials
   - FAQ section
   - Knowledge base

3. **Training**
   - Admin training sessions
   - Webinars
   - One-on-one support
   - Training materials

#### Reporting Issues

1. **Bug Reports**
   - Describe the issue clearly
   - Include steps to reproduce
   - Attach screenshots
   - Note browser and OS
   - Submit via support email

2. **Feature Requests**
   - Describe desired feature
   - Explain use case
   - Provide examples
   - Submit via support email

3. **Security Issues**
   - Report immediately
   - Email: security@keproba.go.ke
   - Do not disclose publicly
   - Provide detailed information

---

## Appendix

### Keyboard Shortcuts

- `Ctrl + /` - Open search
- `Ctrl + K` - Quick actions
- `Esc` - Close dialogs
- `Ctrl + S` - Save changes
- `Ctrl + P` - Print/Export

### Glossary

- **2FA**: Two-Factor Authentication
- **CMS**: Content Management System
- **GDPR**: General Data Protection Regulation
- **HS Code**: Harmonized System Code
- **KRA**: Kenya Revenue Authority
- **PIN**: Personal Identification Number
- **SMTP**: Simple Mail Transfer Protocol
- **SSL**: Secure Sockets Layer
- **TLS**: Transport Layer Security

### Contact Information

**KEPROBA Headquarters**
- Address: 1st and 16th Floor Anniversary Towers, University Way
- P.O. Box: 40247 00100 GPO, Nairobi, Kenya
- Phone: +254 20 222 85 34 8
- Mobile: +254 722 205 875 / +254 734 228 534
- Fax: +254 20 222 85 39 or 221 80 13
- Email: chiefexe@brand.ke
- Website: www.keproba.go.ke

### Version History

- **Version 1.0** (March 2024) - Initial release
- Current version: 1.0

---

## Conclusion

This manual provides comprehensive guidance for administering the KEPROBA Trade Directory platform. For additional support, training, or questions not covered in this manual, please contact the KEPROBA technical support team.

**Remember**: As an administrator, you play a crucial role in maintaining the quality and integrity of the platform. Your diligent verification and management ensure that the directory serves as a trusted resource for connecting Kenyan exporters with global buyers.

---

*Last Updated: March 2024*
*KEPROBA - Kenya Export Promotion and Branding Agency*
