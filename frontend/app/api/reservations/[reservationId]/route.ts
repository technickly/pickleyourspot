import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

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
  context: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { reservationId } = await context.params;
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
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

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Check if user has access to view this reservation
    const isOwner = reservation.owner.email === session.user.email;
    const isParticipant = reservation.participants.some(
      (p: ParticipantStatus) => p.user.email === session.user.email
    );

    if (!isOwner && !isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to view this reservation' },
        { status: 403 }
      );
    }

    // Transform the response to match the expected format
    const transformedReservation = {
      id: reservation.id,
      name: reservation.name,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      description: reservation.description,
      paymentRequired: reservation.paymentRequired,
      paymentInfo: reservation.paymentInfo,
      shortUrl: reservation.shortUrl,
      court: {
        name: reservation.court.name,
        description: reservation.court.description,
        imageUrl: reservation.court.imageUrl,
      },
      owner: {
        name: reservation.owner.name,
        email: reservation.owner.email,
        image: reservation.owner.image,
      },
      participants: reservation.participants.map((participant: ParticipantStatus) => ({
        userId: participant.userId,
        name: participant.user.name,
        email: participant.user.email,
        image: participant.user.image,
        hasPaid: participant.hasPaid,
        isGoing: participant.isGoing,
      })),
    };

    return NextResponse.json(transformedReservation);
  } catch (error) {
    console.error('Failed to fetch reservation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { reservationId } = await context.params;
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Verify the user is the owner of the reservation
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        owner: true,
      },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (existingReservation.owner.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Only the reservation owner can update it' },
        { status: 403 }
      );
    }

    // Update the reservation
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        name: body.name,
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        paymentRequired: body.paymentRequired,
        paymentInfo: body.paymentInfo,
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

    // Transform the response to match the expected format
    const transformedReservation = {
      id: updatedReservation.id,
      name: updatedReservation.name,
      startTime: updatedReservation.startTime,
      endTime: updatedReservation.endTime,
      description: updatedReservation.description,
      paymentRequired: updatedReservation.paymentRequired,
      paymentInfo: updatedReservation.paymentInfo,
      shortUrl: updatedReservation.shortUrl,
      court: {
        name: updatedReservation.court.name,
        description: updatedReservation.court.description,
        imageUrl: updatedReservation.court.imageUrl,
      },
      owner: {
        name: updatedReservation.owner.name,
        email: updatedReservation.owner.email,
        image: updatedReservation.owner.image,
      },
      participants: updatedReservation.participants.map((participant: ParticipantStatus) => ({
        userId: participant.userId,
        name: participant.user.name,
        email: participant.user.email,
        image: participant.user.image,
        hasPaid: participant.hasPaid,
        isGoing: participant.isGoing,
      })),
    };

    return NextResponse.json(transformedReservation);
  } catch (error) {
    console.error('Failed to update reservation:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
} 