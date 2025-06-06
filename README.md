# Pickle Your Spot - Court Reservation System

A modern web application for managing pickleball court reservations with real-time messaging and participant management.

## Features

- 🔐 Google OAuth Authentication
- 🏸 Court Reservation Management
- 💬 Real-time Messaging System
- 👥 Smart User Search & Participant Management
- 📅 Interactive Time Slot Selection
- 📱 Responsive Design

## Tech Stack

- **Frontend:**
  - Next.js 13+ (App Router)
  - React
  - TypeScript
  - Tailwind CSS
  - Prisma ORM

- **Backend:**
  - PostgreSQL
  - NextAuth.js
  - Google OAuth

## Prerequisites

- Node.js 16+
- PostgreSQL
- Google OAuth credentials

## Environment Variables

Create a `.env` file in the frontend directory with the following:

```env
DATABASE_URL="postgresql://username@localhost:5432/court_reservation_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd [repository-name]
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Set up the database:
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

## Features in Detail

### Court Reservation
- View available courts
- Book time slots in 30-minute increments
- Manage reservations (view, cancel)
- Add/remove participants

### User Management
- Google authentication
- User profiles with Google profile images
- Participant search with autocomplete
- Real-time participant updates

### Messaging System
- Real-time messaging in reservations
- Participant and owner communication
- Message history

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 