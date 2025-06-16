import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

export async function GET(
  request: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reservationId } = params;
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        court: true,
        owner: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        messages: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const isOwner = session.user.email === reservation.owner.email;

    // Transform the data to match the expected format
    const transformedReservation = {
      ...reservation,
      isOwner,
      participants: reservation.participants.map((participant: ParticipantStatus) => ({
        userId: participant.user.id,
        name: participant.user.name,
        email: participant.user.email,
        image: participant.user.image,
        hasPaid: participant.hasPaid,
        isGoing: participant.isGoing,
      })),
    };

    return NextResponse.json(transformedReservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: params.reservationId },
      include: { owner: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Check if user is owner
    if (reservation.owner.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { description, paymentInfo } = body;

    const updatedReservation = await prisma.reservation.update({
      where: { id: params.reservationId },
      data: {
        description,
        paymentInfo,
      },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
} 