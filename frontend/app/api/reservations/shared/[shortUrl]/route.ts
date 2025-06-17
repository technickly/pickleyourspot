import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface ParticipantWithUser {
  userId: string;
  user: {
    name: string | null;
    email: string;
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ shortUrl: string }> }
) {
  try {
    const { shortUrl } = await context.params;

    const reservation = await prisma.reservation.findUnique({
      where: {
        shortUrl,
      },
      include: {
        court: true,
        owner: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Transform the reservation data to match the expected format
    const response = {
      id: reservation.id,
      name: reservation.name,
      courtName: reservation.court.name,
      startTime: reservation.startTime.toISOString(),
      endTime: reservation.endTime.toISOString(),
      description: reservation.description,
      paymentRequired: reservation.paymentRequired,
      paymentInfo: reservation.paymentInfo,
      owner: {
        name: reservation.owner.name,
        email: reservation.owner.email,
      },
      participants: reservation.participants.map((p: ParticipantWithUser) => ({
        name: p.user.name,
        email: p.user.email,
        userId: p.userId,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shared reservation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
} 