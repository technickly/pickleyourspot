# Recent Updates to Pickleball Court Reservation System

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