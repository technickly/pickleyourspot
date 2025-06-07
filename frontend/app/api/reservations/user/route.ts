import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    court: true;
    owner: true;
    participants: true;
  };
}>;

interface FormattedParticipant {
  name: string | null;
  email: string;
  hasPaid: boolean;
  isGoing: boolean;
}

interface FormattedReservation {
  id: string;
  shortUrl: string;
  name: string;
  courtName: string;
  startTime: Date;
  endTime: Date;
  description: string | null;
  paymentRequired: boolean;
  paymentInfo: string | null;
  participants: FormattedParticipant[];
  isOwner: boolean;
}

export async function GET(
  request: Request
) {
  try {
    const session = await getServerSession();
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('email');

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Only allow users to view their own reservations
    if (session.user.email !== userEmail) {
      return NextResponse.json(
        { error: 'Not authorized to view these reservations' },
        { status: 403 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get owned reservations
    const ownedReservations = await prisma.reservation.findMany({
      where: {
        ownerId: user.id,
      },
      include: {
        court: true,
        owner: true,
        participants: true,
      },
    });

    // Get participated reservations
    const participatedReservations = await prisma.reservation.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        court: true,
        owner: true,
        participants: true,
      },
    });

    // Format the response to include whether the user is the owner
    const allReservations: FormattedReservation[] = [
      ...ownedReservations.map((reservation) => ({
        id: reservation.id,
        shortUrl: reservation.shortUrl,
        name: reservation.name,
        courtName: reservation.court.name,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        description: reservation.description,
        paymentRequired: reservation.paymentRequired,
        paymentInfo: reservation.paymentInfo,
        participants: reservation.participants.map((participant) => ({
          name: participant.userName,
          email: participant.userEmail,
          hasPaid: participant.hasPaid,
          isGoing: participant.isGoing,
        })),
        isOwner: true,
      })),
      ...participatedReservations.map((reservation) => ({
        id: reservation.id,
        shortUrl: reservation.shortUrl,
        name: reservation.name,
        courtName: reservation.court.name,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        description: reservation.description,
        paymentRequired: reservation.paymentRequired,
        paymentInfo: reservation.paymentInfo,
        participants: reservation.participants.map((participant) => ({
          name: participant.userName,
          email: participant.userEmail,
          hasPaid: participant.hasPaid,
          isGoing: participant.isGoing,
        })),
        isOwner: false,
      })),
    ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return NextResponse.json(allReservations);
  } catch (error) {
    console.error('Error in user reservations route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
} 