# Reservation System Updates

## Extended Time Slots and Multiple Slot Selection Feature (2024)

### Overview
The reservation system has been enhanced to provide more flexibility in booking durations and extended operating hours. Users can now select multiple consecutive time slots directly, making the booking process more intuitive and visual.

### Key Changes

1. **Extended Operating Hours**
   - Changed operating hours from 7 AM to 10 PM (previously ended at 8 PM)
   - Increased availability by adding 4 more hours of bookable slots per day

2. **Multiple Time Slot Selection**
   - Added ability to select up to 6 consecutive 30-minute slots (3 hours total)
   - Visual feedback for available consecutive slots
   - Click-to-select interface for natural time range selection
   - Real-time duration calculation and display

### Technical Implementation

#### Time Slot Generation (`frontend/app/api/courts/[courtId]/time-slots/route.ts`)
- Modified the end time from 8 PM to 10 PM
- Added `maxExtensionSlots` calculation to determine available consecutive slots
- Implemented logic to check slot availability up to 3 hours ahead
- Enhanced the time slot object to include extension information:
  ```typescript
  {
    startTime: string,
    endTime: string,
    isAvailable: boolean,
    maxExtensionSlots: number
  }
  ```

#### Reservation UI (`frontend/app/courts/[courtId]/reserve/page.tsx`)
- Implemented multiple time slot selection:
  ```typescript
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  ```
- Added intelligent slot selection logic:
  - Allows selecting consecutive slots only
  - Enforces maximum 3-hour limit
  - Handles deselection of slots
- Enhanced visual feedback:
  - Highlights currently selected slots
  - Shows available consecutive slots
  - Displays total duration and time range
- Real-time validation of slot selection

### User Experience Improvements
- Direct visual selection of time slots
- Clear feedback on which slots can be selected next
- Real-time display of selected time range
- Automatic enforcement of booking rules:
  - Must select consecutive slots
  - Maximum 3-hour duration
  - Only available slots can be selected
- Seamless integration with existing reservation flow

### Technical Notes
- All times are still processed in 30-minute increments
- Backend validation ensures no overlapping reservations
- Maintains backward compatibility with existing reservation data
- Real-time availability checking for consecutive slots
- Improved error handling for invalid selections 

## Court Information Update and Database Setup (2024)

### Database Setup
```bash
# Install required dependencies
npm install @prisma/client
npm install --save-dev @types/node

# Create Prisma schema and database configuration
# Added schema.prisma with Court, Reservation, User, and Message models
# Added .env with database connection URL

# Generate Prisma client
npx prisma generate

# Reset and initialize database
npx prisma migrate reset --force
npx prisma migrate dev --name init
```

### Court Information Updates

#### Enhanced Court Details
Updated court information to provide more comprehensive details about each facility:

1. **Carl Larsen Tennis Courts** (formerly "Carl Larsen")
   - Added details about recent renovations
   - Specified 6 hard courts
   - Listed amenities: practice wall, bathrooms, water fountains
   - Updated facility image

2. **Stern Grove Tennis Courts** (formerly "Stern Grove")
   - Added information about LED lighting
   - Specified number of courts (4)
   - Updated reservation link to sfrecpark.org
   - New image showing court surroundings

3. **Goldman Tennis Center** (formerly "Goldman Park")
   - Added details about indoor/outdoor courts (6 indoor, 8 outdoor)
   - Listed premium amenities: climate control, pro shop, locker rooms
   - Specified pricing and member discounts
   - Updated facility image

#### Technical Implementation
Created `prisma/update-courts.ts` script to handle court updates:
```typescript
const courts = [
  {
    name: 'Carl Larsen Tennis Courts',
    description: 'Recently renovated courts with new surfacing and lighting. Features include 6 hard courts, practice wall, bathroom facilities, water fountains, shaded seating areas, and equipment rental. Perfect for both casual play and organized events.',
    imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop&q=80',
  },
  {
    name: 'Stern Grove Tennis Courts',
    description: 'Historic courts nestled in the beautiful Stern Grove park. Four well-maintained courts available through SF Rec & Parks. Features include new LED lighting for evening play, ample parking, picnic areas, and stunning surroundings. Official reservations at sfrecpark.org.',
    imageUrl: 'https://images.unsplash.com/photo-1622163642998-1ea32e539f77?w=800&h=600&fit=crop&q=80',
  },
  {
    name: 'Goldman Tennis Center',
    description: 'Premium tennis facility featuring 6 indoor and 8 outdoor courts. State-of-the-art amenities include climate-controlled indoor courts, pro shop, locker rooms, and café. Available for $25/hour with discounts for members. Night lighting and covered seating available. Dedicated parking lot on-site.',
    imageUrl: 'https://images.unsplash.com/photo-1614743758466-e569f4791116?w=800&h=600&fit=crop&q=80',
  },
];
```

#### Database Schema
```prisma
model Court {
  id           String        @id @default(uuid())
  name         String
  description  String
  imageUrl     String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  reservations Reservation[]
}
```

### Improvements
- More detailed facility descriptions
- Accurate amenity listings
- Updated pricing information
- Higher quality facility images
- Standardized naming convention
- Clear reservation instructions
- Improved user experience through detailed facility information 

## Database Maintenance (2024)

### Reservation Data Reset
Created and executed a script to safely clear all reservation data from the database:

```typescript
// prisma/delete-reservations.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // First delete all messages as they depend on reservations
    await prisma.message.deleteMany();
    console.log('✓ Deleted all messages');

    // Delete all reservations
    await prisma.reservation.deleteMany();
    console.log('✓ Deleted all reservations');

    console.log('Successfully deleted all reservations and related data');
  } catch (error) {
    console.error('Error deleting reservations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

To execute the reset:
```bash
npx ts-node prisma/delete-reservations.ts
```

### Court Removal - Carl Larsen
Created and executed a script to remove the Carl Larsen court and all associated data:

```typescript
// prisma/delete-carl-larsen.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // First find the Carl Larsen court
    const court = await prisma.court.findFirst({
      where: {
        name: {
          contains: 'Carl Larsen',
          mode: 'insensitive'
        }
      }
    });

    if (!court) {
      console.log('❌ Carl Larsen court not found');
      return;
    }

    // Delete all messages in reservations for this court
    await prisma.message.deleteMany({
      where: {
        reservation: {
          courtId: court.id
        }
      }
    });
    console.log('✓ Deleted all messages for Carl Larsen court reservations');

    // Delete all reservations for this court
    await prisma.reservation.deleteMany({
      where: {
        courtId: court.id
      }
    });
    console.log('✓ Deleted all reservations for Carl Larsen court');

    // Finally delete the court itself
    await prisma.court.delete({
      where: {
        id: court.id
      }
    });
    console.log('✓ Deleted Carl Larsen court');

    console.log('Successfully removed Carl Larsen court and all related data');
  } catch (error) {
    console.error('Error deleting Carl Larsen court:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

To execute the court removal:
```bash
cd frontend && npx ts-node prisma/delete-carl-larsen.ts
```

## Feature Updates (2024)

### Optional Reservation Description Field
Added a new optional description field to reservations to improve communication between participants.

#### Database Changes
1. Updated Prisma schema with new field:
```prisma
model Reservation {
  // ... existing fields ...
  description  String?   // Optional description field for notes and reminders
  // ... existing fields ...
}
```

2. Created and ran migration:
```bash
npx prisma migrate dev --name add_reservation_description
```

#### UI Updates
Added a new textarea field to the reservation form with helpful placeholder examples:
- Running late notifications
- Payment instructions (e.g., Venmo details)
- Equipment/setup information
- Session type/skill level information

#### Implementation Details
1. Form Component Updates:
   - Added description state management
   - Added textarea with placeholder examples
   - Integrated with form submission

2. API Updates:
   - Modified reservation creation endpoint to handle description field
   - Updated response types to include description
   - Added proper null handling for empty descriptions

#### User Experience
- Description field is optional
- Provides clear examples through placeholder text
- Supports multiline text for detailed notes
- Preserves formatting for better readability

This update improves coordination between players by providing a dedicated space for important game-related notes and instructions. 

## Reservation Management Enhancements (June 2024)

### Overview
The reservation system has been enhanced with improved management capabilities, including deletion, editing, and better naming features. These changes provide more control and flexibility for reservation owners.

### Key Changes

1. **Delete Functionality**
   - Added ability for owners to delete reservations
   - Implemented deletion confirmation modal
   - Added cascade deletion for related records (messages, payment statuses)
   - Added delete button in both My Reservations and individual reservation views

2. **Edit Capabilities**
   - Created new edit page for modifying reservations
   - Added ability to change dates and time slots
   - Added support for editing notes and payment information
   - Implemented validation to prevent double-booking
   - Added real-time availability checking when changing time slots

3. **Reservation Naming**
   - Added "Name of Reservation" field
   - Implemented smart auto-fill that includes:
     - User's name
     - Day of the week
     - Court name
   - Example format: "John's Thursday Main Court Reservation"

4. **UI Improvements**
   - Changed "Select time slot" to "Choose time slots" for clarity
   - Made entire reservation blocks clickable in My Reservations view
   - Added visual feedback for interactive elements
   - Improved confirmation dialogs for important actions

### Technical Implementation

#### Database Changes
```prisma
model Reservation {
  id              String          @id @default(uuid())
  name            String          // Added name field
  startTime       DateTime
  endTime         DateTime
  // ... existing fields ...
}
```

#### New API Endpoints
1. **Delete Endpoint** (`/api/reservations/[reservationId]/delete`)
   - DELETE method with owner verification
   - Cascading deletion of related records
   - Success/error status responses

2. **Edit Endpoint** (`/api/reservations/[reservationId]`)
   - PUT method for updating reservation details
   - Validation for time slot conflicts
   - Support for partial updates

#### UI Components
1. **Edit Page** (`/reservations/[reservationId]/edit`)
   - Full form for editing all reservation details
   - Time slot selection with availability checking
   - Real-time validation and error handling

2. **My Reservations Page**
   - Added delete and edit buttons for owners
   - Implemented confirmation modal for deletions
   - Made reservation blocks fully clickable

### User Experience Improvements
- Clearer labeling for time slot selection
- Intuitive reservation naming with auto-suggestions
- Streamlined editing process
- Improved feedback for user actions
- Enhanced error handling and validation

### Security Enhancements
- Owner-only access for edits and deletions
- Validation of user permissions
- Protection against unauthorized modifications
- Secure handling of reservation updates

# SSL Certificate and HTTPS Configuration Guide

## Current Setup (HTTP-only with HTTPS Redirect)
Current nginx configuration (`/etc/nginx/sites-available/pickleyourspot.com`):
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name pickleyourspot.com www.pickleyourspot.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}

# Separate server block for HTTPS redirect
server {
    listen 443;
    listen [::]:443;
    server_name pickleyourspot.com www.pickleyourspot.com;
    
    # Simple redirect without any SSL configuration
    return 301 http://$server_name$request_uri;
}
```

## SSL Re-enablement Plan (June 8th, 2025)

### Important Dates
- SSL Rate Limit Reset: June 8th, 2025, 08:09:48 UTC
- Domains: pickleyourspot.com and www.pickleyourspot.com

### Pre-SSL Checklist
1. [ ] Verify rate limit reset (after June 8th, 2025, 08:09:48 UTC)
2. [ ] Backup current nginx configuration
3. [ ] Ensure ports 80 and 443 are open in AWS security group
4. [ ] Verify Next.js app is running properly

### Step 1: Backup Current Configuration
```bash
# Create backup directory
sudo mkdir -p /etc/nginx/backups/$(date +%Y%m%d)

# Backup current configuration
sudo cp /etc/nginx/sites-available/pickleyourspot.com /etc/nginx/backups/$(date +%Y%m%d)/pickleyourspot.com.backup
sudo cp -r /etc/nginx/sites-enabled /etc/nginx/backups/$(date +%Y%m%d)/
```

### Step 2: Install New SSL Certificate
```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Request new certificate
sudo certbot --nginx \
  -d pickleyourspot.com \
  -d www.pickleyourspot.com \
  --email nick@pickleyourspot.com \
  --agree-tos \
  --non-interactive \
  --redirect

# Verify certificate installation
sudo certbot certificates
```

### Step 3: Update Nginx Configuration
Replace the content of `/etc/nginx/sites-available/pickleyourspot.com` with:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name pickleyourspot.com www.pickleyourspot.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pickleyourspot.com www.pickleyourspot.com;

    # SSL configuration (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/pickleyourspot.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pickleyourspot.com/privkey.pem;
    
    # Recommended SSL settings
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS (uncomment if you're sure)
    # add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 4: Test and Enable
```bash
# Test nginx configuration
sudo nginx -t

# If test passes, start nginx
sudo systemctl start nginx

# Enable nginx to start on boot
sudo systemctl enable nginx
```

### Step 5: Verify Setup
```bash
# Test HTTP to HTTPS redirect
curl -I http://pickleyourspot.com
# Should show 301 redirect to https://

# Test HTTPS directly
curl -I https://pickleyourspot.com
# Should show 200 OK
```

### Troubleshooting Guide

#### Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test certificate renewal
sudo certbot renew --dry-run

# Force certificate renewal
sudo certbot renew --force-renewal
```

#### Nginx Issues
```bash
# Check nginx status
sudo systemctl status nginx

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log
```

#### SSL Test Commands
```bash
# Test SSL configuration
curl -vI https://pickleyourspot.com

# Check SSL certificate details
openssl s_client -connect pickleyourspot.com:443 -servername pickleyourspot.com
```

### Recovery Steps
If something goes wrong, you can restore the HTTP-only configuration:
```bash
# Stop nginx
sudo systemctl stop nginx

# Restore backup
sudo cp /etc/nginx/backups/$(date +%Y%m%d)/pickleyourspot.com.backup /etc/nginx/sites-available/pickleyourspot.com

# Test and restart
sudo nginx -t && sudo systemctl start nginx
```

### Important Paths
- Nginx configuration: `/etc/nginx/sites-available/pickleyourspot.com`
- SSL certificates: `/etc/letsencrypt/live/pickleyourspot.com/`
- Nginx logs: `/var/log/nginx/`
- Backups: `/etc/nginx/backups/`

### Monitoring
After enabling SSL, monitor these aspects:
1. Certificate expiration (auto-renewal should be configured)
2. SSL Labs grade (https://www.ssllabs.com/ssltest/)
3. HTTPS redirect functionality
4. Next.js application performance
5. Error logs for any SSL-related issues

# Testing Remote Server Setup

## Initial Server Access
```