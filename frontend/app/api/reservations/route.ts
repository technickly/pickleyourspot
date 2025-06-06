import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
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

    const reservationData: Prisma.ReservationCreateInput = {
      name: name.trim(),
      court: { connect: { id: courtId } },
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      owner: { connect: { id: user.id } },
      description: description?.trim(),
      paymentRequired: paymentRequired || false,
      paymentInfo: paymentInfo?.trim(),
    };

    // Create the reservation
    const reservation = await prisma.reservation.create({
      data: reservationData,
    });

    // Add participants if any
    if (participantIds.length > 0) {
      const participants = await prisma.user.findMany({
        where: {
          email: {
            in: participantIds,
          },
        },
      });

      if (participants.length > 0) {
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: {
            participants: {
              connect: participants.map(p => ({ id: p.id })),
            },
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
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(completeReservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
} 