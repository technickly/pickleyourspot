import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface CreateReservationBody {
  courtId: string;
  startTime: string;
  endTime: string;
  description?: string | null;
  participantIds: string[];
  paymentRequired?: boolean;
  paymentInfo?: string | null;
  password?: string | null;
  passwordRequired?: boolean;
}

interface ParticipantStatusType {
  id: string;
  hasPaid: boolean;
  isGoing: boolean;
  userId: string;
  reservationId: string;
  userEmail: string;
  userName: string | null;
  userImage: string | null;
}

interface ReservationType {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  description: string | null;
  paymentRequired: boolean;
  paymentInfo: string | null;
  shortUrl: string;
  createdAt: Date;
  updatedAt: Date;
  court: {
    name: string;
    description: string;
    imageUrl: string;
  };
  owner: {
    name: string | null;
    email: string;
    image: string | null;
  };
  participants: ParticipantStatusType[];
}

function formatReservationName(userName: string | null, startTime: Date, courtName: string): string {
  // Format the user's name (First Name + Last Initial)
  const formattedName = userName ? userName.split(' ').map((part, index, arr) => {
    if (index === arr.length - 1) {
      // Last name - just take the first letter
      return part[0] + "'s";
    }
    // First name (and middle names if any) - keep as is
    return part;
  }).join(' ') : "Unknown's";

  // Format the date (M/D)
  const date = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
  }).format(startTime);

  return `${formattedName} ${date} Reservation at ${courtName}`;
}

async function createParticipantStatus(userId: string, reservationId: string, userEmail: string, userName: string | null, userImage: string | null) {
  return await prisma.participantStatus.create({
    data: {
      userId,
      reservationId,
      isGoing: true,
      hasPaid: false,
    },
  });
}

async function findUserByEmail(email: string) {
  // Try to find the user first
  let user = await prisma.user.findUnique({
    where: { email },
  });

  // If user doesn't exist, create them
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0], // Use the part before @ as a default name
      },
    });
  }

  return user;
}

async function findCourtById(id: string) {
  return await prisma.court.findUnique({
    where: { id },
  });
}

async function createReservation(data: {
  name: string;
  startTime: Date;
  endTime: Date;
  description?: string | null;
  paymentRequired?: boolean;
  paymentInfo?: string | null;
  courtId: string;
  ownerId: string;
  password?: string | null;
  passwordRequired?: boolean;
}) {
  return await prisma.reservation.create({
    data,
    include: {
      court: true,
      owner: true,
      participants: true,
    },
  }) as unknown as ReservationType;
}

async function findReservationWithRelations(id: string) {
  return await prisma.reservation.findUnique({
    where: { id },
    include: {
      court: true,
      owner: true,
      participants: true,
    },
  }) as unknown as ReservationType | null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courtId, startTime, endTime, participantIds, description, paymentRequired, paymentInfo, password, passwordRequired } = await request.json() as CreateReservationBody;

    // Validate required fields
    if (!courtId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate payment info if required
    if (paymentRequired && !paymentInfo?.trim()) {
      return NextResponse.json(
        { error: 'Payment information is required when payment is required' },
        { status: 400 }
      );
    }

    // Find the user making the reservation
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the court details
    const court = await findCourtById(courtId);
    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Generate the reservation name
    const reservationName = formatReservationName(user.name, new Date(startTime), court.name);

    // Create the reservation
    const reservation = await createReservation({
      name: reservationName,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      description: description?.trim(),
      paymentRequired: paymentRequired || false,
      paymentInfo: paymentInfo?.trim(),
      courtId,
      ownerId: user.id,
      password: passwordRequired ? password?.trim() : null,
      passwordRequired: passwordRequired || false
    });

    // Add participants if any
    if (participantIds.length > 0) {
      for (const email of participantIds) {
        const participant = await findUserByEmail(email);
        if (participant) {
          await createParticipantStatus(
            participant.id,
            reservation.id,
            participant.email,
            participant.name,
            participant.image
          );
        }
      }
    }

    // Fetch the complete reservation with all relations
    const completeReservation = await findReservationWithRelations(reservation.id);
    if (!completeReservation) {
      return NextResponse.json(
        { error: 'Failed to fetch created reservation' },
        { status: 500 }
      );
    }

    // Transform the response to include only the fields we need
    const transformedReservation = {
      id: completeReservation.id,
      name: completeReservation.name,
      startTime: completeReservation.startTime,
      endTime: completeReservation.endTime,
      description: completeReservation.description,
      paymentRequired: completeReservation.paymentRequired,
      paymentInfo: completeReservation.paymentInfo,
      shortUrl: completeReservation.shortUrl,
      createdAt: completeReservation.createdAt,
      updatedAt: completeReservation.updatedAt,
      court: {
        name: completeReservation.court.name,
        description: completeReservation.court.description,
        imageUrl: completeReservation.court.imageUrl,
      },
      owner: {
        name: completeReservation.owner.name,
        email: completeReservation.owner.email,
        image: completeReservation.owner.image,
      },
      participants: completeReservation.participants.map(participant => ({
        id: participant.id,
        hasPaid: participant.hasPaid,
        isGoing: participant.isGoing,
        user: {
          name: participant.userName,
          email: participant.userEmail,
          image: participant.userImage,
        },
      })),
    };

    return NextResponse.json(transformedReservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all reservations where the user is either the owner or a participant
    const reservations = await prisma.reservation.findMany({
      where: {
        OR: [
          { owner: { email: session.user.email } },
          { participants: { some: { user: { email: session.user.email } } } }
        ]
      },
      include: {
        court: true,
        owner: true,
        participants: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
} 