import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface ParticipantStatus {
  userId: string;
  hasPaid: boolean;
  isGoing: boolean;
  user: User;
}

interface Court {
  name: string;
  description: string;
  imageUrl: string;
}

interface Reservation {
  id: string;
  shortUrl: string;
  name: string;
  startTime: Date;
  endTime: Date;
  description: string | null;
  paymentRequired: boolean;
  paymentInfo: string | null;
  court: Court;
  participants: ParticipantStatus[];
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
  participants: {
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
    hasPaid: boolean;
    isGoing: boolean;
  }[];
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
        participants: {
          include: {
            user: true
          }
        }
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
        participants: {
          include: {
            user: true
          }
        }
      },
    });

    // Format the response to include whether the user is the owner
    const allReservations: FormattedReservation[] = [
      ...ownedReservations.map((reservation: Reservation) => ({
        id: reservation.id,
        shortUrl: reservation.shortUrl,
        name: reservation.name,
        courtName: reservation.court.name,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        description: reservation.description,
        paymentRequired: reservation.paymentRequired,
        paymentInfo: reservation.paymentInfo,
        participants: reservation.participants.map((participant: ParticipantStatus) => ({
          userId: participant.userId,
          name: participant.user.name,
          email: participant.user.email,
          image: participant.user.image,
          hasPaid: participant.hasPaid,
          isGoing: participant.isGoing,
        })),
        isOwner: true,
      })),
      ...participatedReservations.map((reservation: Reservation) => ({
        id: reservation.id,
        shortUrl: reservation.shortUrl,
        name: reservation.name,
        courtName: reservation.court.name,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        description: reservation.description,
        paymentRequired: reservation.paymentRequired,
        paymentInfo: reservation.paymentInfo,
        participants: reservation.participants.map((participant: ParticipantStatus) => ({
          userId: participant.userId,
          name: participant.user.name,
          email: participant.user.email,
          image: participant.user.image,
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