import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { Prisma, User, Reservation, Court } from '@prisma/client';

interface CreateReservationBody {
  courtId: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string | null;
  participantIds: string[];
  paymentRequired?: boolean;
  paymentInfo?: string | null;
}

interface ParticipantWithUser {
  id: string;
  hasPaid: boolean;
  isGoing: boolean;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
  userId: string;
  reservationId: string;
  updatedAt: Date;
}

interface CompleteReservation extends Omit<Reservation, 'participants'> {
  court: Pick<Court, 'name' | 'description' | 'imageUrl'>;
  owner: Pick<User, 'name' | 'email' | 'image'>;
  participants: ParticipantWithUser[];
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

  // Format the time
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: true,
  }).format(startTime);

  return `${formattedName} ${date} Reservation at ${courtName}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courtId, startTime, endTime, participantIds, description, paymentRequired, paymentInfo } = await request.json() as CreateReservationBody;

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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the court details to include in the reservation name
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: { name: true },
    });

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Generate the reservation name
    const reservationName = formatReservationName(user.name, new Date(startTime), court.name);

    // Create the reservation
    const reservation = await prisma.reservation.create({
      data: {
        name: reservationName,
        court: { connect: { id: courtId } },
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        owner: { connect: { id: user.id } },
        description: description?.trim(),
        paymentRequired: paymentRequired || false,
        paymentInfo: paymentInfo?.trim(),
      } as Prisma.ReservationCreateInput,
    });

    // Add participants if any
    if (participantIds.length > 0) {
      // Create participant status entries for each participant
      for (const email of participantIds) {
        await (prisma as any).participantStatus.create({
          data: {
            user: { connect: { email } },
            reservation: { connect: { id: reservation.id } },
            hasPaid: false,
            isGoing: true,
          },
        });
      }
    }

    // Fetch the complete reservation with all relations
    const completeReservation = await prisma.reservation.findUnique({
      where: { id: reservation.id },
      include: {
        court: true,
        owner: true,
        participants: {
          include: {
            user: true
          }
        }
      }
    }) as CompleteReservation;

    if (!completeReservation) {
      return NextResponse.json(
        { error: 'Failed to fetch created reservation' },
        { status: 500 }
      );
    }

    // Transform the response to include only the fields we need
    const transformedReservation = {
      ...completeReservation,
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
          name: participant.user.name,
          email: participant.user.email,
          image: participant.user.image,
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