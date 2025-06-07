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
  user: User;
  userId: string;
  reservationId: string;
  updatedAt: Date;
}

interface CompleteReservation extends Reservation {
  court: Pick<Court, 'name' | 'description' | 'imageUrl'>;
  owner: Pick<User, 'name' | 'email' | 'image'>;
  participants: ParticipantWithUser[];
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courtId, name, startTime, endTime, participantIds, description, paymentRequired, paymentInfo } = await request.json() as CreateReservationBody;

    // Validate required fields
    if (!courtId || !name || !startTime || !endTime) {
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

    // Create the reservation
    const reservation = await prisma.reservation.create({
      data: {
        name: name.trim(),
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
        await (prisma as any).ParticipantStatus.create({
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
        court: {
          select: {
            name: true,
            description: true,
            imageUrl: true,
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    }) as CompleteReservation | null;

    if (!completeReservation) {
      return NextResponse.json(
        { error: 'Failed to fetch created reservation' },
        { status: 500 }
      );
    }

    // Transform the response to include user details
    const transformedReservation = {
      ...completeReservation,
      participants: completeReservation.participants.map((participant: ParticipantWithUser) => ({
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