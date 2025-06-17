import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ParticipantStatus {
  id: string;
  userId: string;
  reservationId: string;
  isGoing: boolean;
  hasPaid: boolean;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

interface Reservation {
  id: string;
  name: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  courtId: string;
  ownerId: string;
  shortUrl: string;
  paymentRequired: boolean;
  paymentInfo: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants: ParticipantStatus[];
}

interface ReservationWithParticipants extends Reservation {
  participants: ParticipantStatus[];
}

interface ParticipantWithReservation extends ParticipantStatus {
  reservation: Reservation;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { email } = await context.params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow users to view their own stats
    if (session.user.email !== email) {
      return NextResponse.json(
        { error: 'Not authorized to view these stats' },
        { status: 403 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        reservations: {
          include: {
            participants: {
              include: {
                user: true,
              },
            },
          },
        },
        participantIn: {
          include: {
            reservation: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();

    // Calculate reservation statistics
    const ownedReservations = user.reservations as ReservationWithParticipants[];
    const participatedReservations = user.participantIn.map((p: ParticipantWithReservation) => p.reservation);

    const upcomingReservations = ownedReservations.filter((r: ReservationWithParticipants) => new Date(r.startTime) > now).length;
    const pastReservations = ownedReservations.filter((r: ReservationWithParticipants) => new Date(r.startTime) <= now).length;

    // Calculate participant statistics
    let totalParticipants = 0;
    let goingCount = 0;
    let notGoingCount = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    ownedReservations.forEach((reservation: ReservationWithParticipants) => {
      totalParticipants += reservation.participants.length;
      reservation.participants.forEach((participant: ParticipantStatus) => {
        if (participant.isGoing) goingCount++;
        else notGoingCount++;
        if (participant.hasPaid) paidCount++;
        else unpaidCount++;
      });
    });

    const averageParticipants = ownedReservations.length > 0
      ? totalParticipants / ownedReservations.length
      : 0;

    // Always return FREE tier for now
    const membershipTier = 'FREE';

    const response = {
      userStats: {
        joinDate: user.createdAt,
        membershipTier,
        totalReservationsCreated: ownedReservations.length,
        totalReservationsJoined: participatedReservations.length,
      },
      reservationStats: {
        totalReservations: ownedReservations.length,
        upcomingReservations,
        pastReservations,
        totalParticipants,
        averageParticipants,
        participantStats: {
          going: goingCount,
          notGoing: notGoingCount,
          paid: paidCount,
          unpaid: unpaidCount,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
} 