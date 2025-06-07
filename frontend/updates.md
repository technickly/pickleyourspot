# Recent Updates to Pickleball Court Reservation System

## UI and Landing Page Improvements (Latest)

### Landing Page Updates
- Updated main description text to be more concise and impactful:
  - New text: "Effortlessly manage court time, organize tournaments, and coordinate with friends. From reservations to payment tracking, we've got your pickleball plans covered."
  - Emphasizes key features: coordination, management, tournaments, and payments
  - More engaging and action-oriented tone
  - Better highlights the platform's comprehensive nature

### Membership System Simplification
- Streamlined membership tiers:
  - Removed Bronze tier references
  - Simplified to three tiers: Free, Basic, Premium
  - Set all current and new users to Free tier by default
- Updated tier documentation:
  - Marked Basic and Premium as "Coming Soon"
  - Clarified Free tier as current default
  - Removed specific pricing information
  - Updated feature lists for each tier

### Color Scheme Update
- Changed primary color scheme from purple to blue
  - Primary: #2563EB (vibrant blue)
  - Primary Hover: #1D4ED8 (darker blue)
- Applied to:
  - All primary buttons
  - Interactive elements
  - Text accents
  - Links and CTAs

### Button Styling Consistency
- Unified "My Reservations" button styling with "New Reservation"
  - Both now use primary blue color scheme
  - Consistent hover effects
  - Matching shadow and transition effects
- Enhanced visual hierarchy in navigation

## Payment Requirements Feature

### Database Changes
- Added new fields to Reservation model:
  - `paymentRequired` (Boolean, defaults to false)
  - `paymentInfo` (String, optional)
  - These fields integrate with existing `paymentStatus` model

### Reservation Creation
- Added payment requirement toggle during reservation creation
- Optional payment information field appears when payment is required
- Example payment info: "Send $5 per person to @venmo-username"

### Participant List Improvements
- Enhanced payment status visibility:
  - Only shows payment status when payment is required for the reservation
  - No payment indicators shown when payment is not required
- Improved payment toggle UI:
  - Larger, more prominent payment buttons
  - Interactive hover effects
  - Color-coded status indicators:
    - Green for paid status
    - Yellow for unpaid status
  - Clear call-to-action text:
    - "Mark as Paid →" for unpaid
    - "✓ Paid (Click to undo)" for paid

### UI/UX Enhancements
- Card-style participant rows
- Better mobile responsiveness
- Clear payment requirement indicators
- Improved visibility of payment instructions

## Technical Updates
- Fixed module system configuration:
  - Removed "type": "module" from package.json to use CommonJS
  - Updated next.config.js to use CommonJS module.exports
  - Fixed CSS module loading issues
  - Resolved module parsing warnings
- Fixed API route issues:
  - Updated route handlers to properly await dynamic params
  - Fixed payment status model case sensitivity
  - Improved error handling in API routes
  - Enhanced time zone handling in court time slots
  - Optimized user reservation queries
- Resolved ESM vs CommonJS conflicts
- Updated package dependencies
- Fixed Prisma schema location issues

## Previous Major Features (For Reference)
- Operating hours: 2 PM PT - 5 AM PT next day
- 30-minute time slots
- Pacific Time zone handling
- Mobile UI with hamburger menu
- Reservation notes display
- Court database with 8 SF courts
- Theme toggle with glass-morphism effects

## Database Maintenance and Image Updates (June 2024)

### Database Migration and User Data Preservation
Created scripts to safely migrate the database while preserving user data:

```typescript
// scripts/export-users.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportUsers() {
  try {
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users to export`);

    // Write to a JSON file
    const exportPath = path.join(__dirname, 'users-backup.json');
    fs.writeFileSync(exportPath, JSON.stringify(users, null, 2));
    console.log(`✓ Exported users to ${exportPath}`);
  } catch (error) {
    console.error('Error exporting users:', error);
  }
}

// scripts/import-users.ts
async function importUsers() {
  try {
    const backupPath = path.join(__dirname, 'users-backup.json');
    const usersData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    for (const user of usersData) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          image: user.image,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }
  } catch (error) {
    console.error('Error importing users:', error);
  }
}
```

### Database Migration Process
1. Export existing users to JSON backup
2. Run database migrations to update schema
3. Import users back while preserving all data
4. Clear existing reservations and messages
5. Verify data integrity

### Court Image Updates
Updated court images with high-quality placeholder images from Unsplash and Pexels:

1. **Image Requirements**
   - Minimum width: 800px
   - Aspect ratio: 4:3 preferred
   - Content: Tennis courts, parks, and recreational facilities
   - High-quality, well-lit scenes

2. **Image Implementation**
   - Stored in `/public/images/courts/`
   - Named consistently with court IDs
   - Optimized for web delivery
   - Responsive loading with Next.js Image component

3. **Court Image Mapping**
   - Buena Vista: Park recreation area
   - Goldman Tennis Center: Professional tennis facility
   - Jackson: Outdoor sports court
   - Moscone: Modern recreation center
   - Parkside: Community park
   - Presidio: Scenic court location
   - Richmond: Tennis facility
   - Rossi: Park sports area
   - Stern: Tennis complex
   - Upper Noe: Community recreation area

### Technical Improvements
1. **Image Handling**
   - Implemented proper error handling for missing images
   - Added fallback images for failed loads
   - Optimized image loading performance
   - Improved mobile responsiveness

2. **Database Operations**
   - Created safe migration scripts
   - Implemented user data preservation
   - Added data validation checks
   - Improved error handling 

# Updates and Database Management

## Recent Updates

### Time Zone Fixes
- Fixed time zone issues where 8 AM was showing as 6 PM
- Updated time slot generation code with proper PT (Pacific Time) handling
- Implemented explicit time zone conversion using date-fns-tz
- Set operating hours to 8 AM - 6 PM PT
- Created verification script to test time zone handling
- Fixed remote server time zone discrepancies

### Image Management
- Added placeholder images for all courts
- Images sourced from Unsplash and Pexels
- Updated court images: rossi, jackson, goldman, parkside, presidio, buena-vista, moscone
- Images stored in `/frontend/public/images/courts/`
- Optimized file sizes (31KB to 123KB)

### Database Management
- Created comprehensive database management scripts
- Added safe data migration process
- Updated schema and migrations
- Implemented user data preservation during updates

## How to Update Database While Keeping Users

### Available Scripts

1. **backup-users.js**
   - Purpose: Creates a backup of all users and their relationships
   - Location: `frontend/scripts/backup-users.js`
   - Usage: `node scripts/backup-users.js`
   - Output: Creates a timestamped JSON file in `frontend/backups/`

2. **clean-reservations.js**
   - Purpose: Deletes all reservations while preserving user data
   - Location: `frontend/scripts/clean-reservations-cjs.js`
   - Usage: `node scripts/clean-reservations-cjs.js`
   - What it cleans:
     - Messages
     - Payment statuses
     - Reservations
     - Preserves all user data

3. **reset-courts.js**
   - Purpose: Resets court data to default state
   - Location: `frontend/scripts/reset-courts.js`
   - Usage: `node scripts/reset-courts.js`
   - What it does:
     - Updates court information
     - Maintains correct image paths
     - Preserves user data

### Step-by-Step Update Process

1. **Backup Current Users**
   ```bash
   cd /path/to/frontend
   node scripts/backup-users.js
   ```

2. **Update Dependencies and Schema**
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   ```

3. **Clean Old Reservations (Optional)**
   ```bash
   node scripts/clean-reservations-cjs.js
   ```

4. **Reset Court Data**
   ```bash
   node scripts/reset-courts.js
   ```

5. **Verify Database State**
   ```bash
   npx prisma studio
   ```

### Important Notes

- Always backup user data before any database operations
- Run migrations before cleaning or resetting data
- The clean-reservations script is safe to run as it preserves user data
- Use Prisma Studio to verify database state after updates
- All scripts are designed to maintain data integrity
- Time slots are automatically adjusted for Pacific Time

### Troubleshooting

If you encounter issues:
1. Check the backups directory for the latest user backup
2. Verify Prisma schema is up to date
3. Ensure all migrations have been applied
4. Check server logs for any error messages
5. Use Prisma Studio to manually verify database state 

# Updates Log

## June 2024 - SSL Certificate Rate Limit and HTTP Fallback

### Current Status
- **Date**: June 2024
- **Issue**: Let's Encrypt rate limit exceeded
- **Domain**: pickleyourspot.com and www.pickleyourspot.com
- **Current Setup**: HTTP only, with HTTPS redirecting to HTTP
- **Next SSL Window**: June 8th, 2025, 08:09:48 UTC

### SSL Rate Limit Details
- Hit maximum of 5 certificates issued for same domains in 168 hours
- Error: "too many certificates already issued for this exact set of domains"
- Implemented temporary HTTP-only solution with HTTPS redirection

### Current HTTP Configuration
```nginx
server {
    listen 80;
    listen 443;  # Listen on HTTPS port
    server_name pickleyourspot.com www.pickleyourspot.com;

    # Redirect HTTPS to HTTP temporarily
    if ($scheme = "https") {
        return 302 http://$host$request_uri;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Implementation Steps Taken
1. Removed SSL configuration
2. Updated nginx to serve HTTP and redirect HTTPS
3. Updated DNS settings
4. Configured nginx as reverse proxy for Next.js
5. Set up monitoring for HTTP functionality
6. Added temporary HTTPS to HTTP redirection

### Testing Procedures
1. **Basic HTTP Test Commands**:
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   curl -I http://pickleyourspot.com
   curl -I http://www.pickleyourspot.com
   ```

2. **Monitoring Commands**:
   ```bash
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```

### SSL Re-enablement Plan (After June 8th, 2025)

#### Pre-deployment Checklist
1. [ ] Verify rate limit reset (after June 8th, 2025, 08:09:48 UTC)
2. [ ] Backup nginx configuration
3. [ ] Test current HTTP setup
4. [ ] Ensure Next.js app is running properly

#### Deployment Steps
1. Stop nginx:
   ```bash
   sudo systemctl stop nginx
   ```

2. Request new certificate:
   ```bash
   sudo certbot --nginx -d pickleyourspot.com -d www.pickleyourspot.com
   ```

3. Verify and start:
   ```bash
   sudo certbot certificates
   sudo nginx -t
   sudo systemctl start nginx
   ```

#### Post-deployment Verification
1. [ ] Test HTTPS access
2. [ ] Verify HTTP to HTTPS redirect
3. [ ] Check certificate details in browser
4. [ ] Verify auto-renewal setup

### Backup and Recovery
- HTTP configuration backup location: `/etc/nginx/sites-available/pickleyourspot.conf.http.backup`
- Full nginx backup: `~/nginx-config-backup-[DATE].tar.gz`
- Recovery command if needed:
  ```bash
  sudo cp /etc/nginx/sites-available/pickleyourspot.conf.http.backup /etc/nginx/sites-available/pickleyourspot.conf
  ```

### Important Paths
- Nginx configuration: `/etc/nginx/sites-available/pickleyourspot.conf`
- SSL certificates (when re-enabled):
  - Live certs: `/etc/letsencrypt/live/pickleyourspot.com/`
  - Archive: `/etc/letsencrypt/archive/pickleyourspot.com/`
- Log files:
  - Access log: `/var/log/nginx/access.log`
  - Error log: `/var/log/nginx/error.log`

### Next Steps
1. Monitor HTTP functionality
2. Set calendar reminder for SSL renewal
3. Document any issues with HTTP-only setup
4. Prepare for SSL re-enablement in June 2025

### Contact Information
- Server IP: 18.204.218.155
- Domain: pickleyourspot.com
- Infrastructure: AWS EC2, Ubuntu, nginx, Next.js 

## June 2024 - Web Icon and PWA Updates

### Icon Implementation (MacBook Local Development)
- Created custom pickleball-themed SVG icon
- Generated multiple icon formats using ImageMagick on macOS:
  - `favicon.ico` (32x32) for browser tabs
  - `icon.png` (192x192) for PWA and larger displays
  - `apple-icon.png` (180x180) for iOS devices
- Icons stored in `/frontend/public/` directory

### Icon Design Details
- Custom pickleball SVG with:
  - Yellow ball background (#FFDE59)
  - Court lines representation
  - Non-volley zone (kitchen) indicator
  - Ball texture details
  - Professional shine effect

### Next.js Integration
- Updated `app/layout.tsx` with comprehensive icon metadata:
```typescript
export const metadata = {
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
  },
  manifest: '/manifest.json',
  themeColor: '#FFDE59',
  viewport: 'width=device-width, initial-scale=1.0',
}
```

### PWA Support
- Added `manifest.json` for Progressive Web App capabilities:
```json
{
  "name": "Pickle Your Spot",
  "short_name": "PickleSpot",
  "description": "Reserve your next pickleball match in San Francisco",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#FFDE59"
}
```

### Technical Implementation Notes
- Used ImageMagick on macOS (not Linux) for image conversion
- Command used: `convert icon.svg -resize [size] [output]`
- Original SVG created at 512x512 for high-quality scaling
- Files generated locally on MacBook before deployment

### Icon Visibility
- Browser tabs
- Bookmarks
- iOS/Android home screen when added
- PWA installations
- Browser history
- Favorites/Reading lists

### Development Environment
- Platform: MacBook (macOS)
- Tools:
  - ImageMagick for conversion
  - Next.js 15.3.3
  - SVG editor for icon creation

# Updates

## Automatic Participant Addition for Shared Reservations

When users access a reservation through a shared URL, they are now automatically added as participants with the following behavior:

### Features
- Users accessing a shared reservation URL are automatically added as participants when they sign in
- New participants are marked as "going" by default
- Users can toggle their attendance status from both:
  - The reservation page
  - The "My Reservations" page

### Implementation Details

1. **Shared Reservation Page (`/r/[shortUrl]`)**
   - Automatically detects when a user signs in
   - Checks if the user is already a participant or owner
   - If not, automatically adds them as a participant
   - Shows a success message when joined
   - Refreshes the participant list automatically

2. **Participant Status**
   - Default status when joining:
     - `isGoing: true`
     - `hasPaid: false` (if payment is required)
   - Status can be updated through the UI with confirmation dialogs

3. **Security Checks**
   - Verifies user authentication
   - Prevents duplicate participant entries
   - Validates reservation existence
   - Maintains proper access controls

### User Flow
1. User receives and clicks a shared reservation URL
2. If not signed in, they are prompted to sign in
3. Upon successful sign-in, they are automatically added as a participant
4. They can immediately view the reservation details and participant list
5. They can update their attendance status as needed

### Technical Implementation
The feature is implemented across several components:

```typescript
// Automatic join on sign-in
useEffect(() => {
  if (session?.user?.email && reservation && !isJoining) {
    const isAlreadyParticipant = reservation.participants.some(
      p => p.email === session.user?.email
    );
    const isOwner = reservation.owner.email === session.user?.email;

    if (!isAlreadyParticipant && !isOwner) {
      handleJoinReservation();
    }
  }
}, [session, reservation]);
```

The join process is handled by a dedicated API endpoint that:
- Validates the request
- Creates the participant record
- Returns the updated reservation data

### Error Handling
- Shows appropriate error messages if joining fails
- Handles cases where:
  - The reservation doesn't exist
  - The user is already a participant
  - The user is the owner
  - There are network issues 

## Membership System Enhancement (Latest)

### Membership Tiers Implementation
- Added comprehensive membership tier display:
  - Free Tier ($0/month)
  - Basic Tier ($9.99/month)
  - Premium Tier ($24.99/month)
- Created interactive pricing cards with:
  - Feature lists for each tier
  - Upgrade buttons with future Stripe integration
  - Visual indicators for current plan
  - Hover effects and modern styling
- Updated membership status display in My Account page
- Added placeholder for future payment integration

### Tier Features
- Free Tier:
  - Up to 3 active reservations
  - Basic participant management
  - Payment tracking
  - Access to SF public courts
- Basic Tier ($9.99/month):
  - Everything in Free tier
  - Up to 10 active reservations
  - Custom events & tournaments
  - Email payment reminders
  - Priority support
- Premium Tier ($24.99/month):
  - Everything in Basic tier
  - Unlimited reservations
  - Advanced tournament tools
  - Premium analytics
  - VIP support
  - Custom branding options

### Technical Implementation
- Created new MembershipTiers component
- Integrated with existing user stats
- Added placeholder for Stripe payment integration
- Updated tier status display in user profile
- Implemented responsive design for all screen sizes 