import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface ParticipantStatus {
  id: string;
  userId: string;
  reservationId: string;
  hasPaid: boolean;
  isGoing: boolean;
  userEmail: string;
  userName: string | null;
  userImage: string | null;
}

interface Participant {
  email: string;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { reservationId } = await context.params;
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { content } = await request.json();

    if (!content?.trim()) {
      return new NextResponse('Message content is required', { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        owner: true,
        participants: {
          include: {
            user: true
          }
        }
      },
    });

    if (!reservation) {
      return new NextResponse('Reservation not found', { status: 404 });
    }

    // Check if user is owner or participant
    const isOwner = reservation.owner.email === session.user.email;
    const isParticipant = reservation.participants.some(
      (p) => p.user.email === session.user.email
    );

    if (!isOwner && !isParticipant) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the user's ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        reservationId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { reservationId } = await context.params;
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        owner: true,
        participants: {
          include: {
            user: true
          }
        }
      },
    });

    if (!reservation) {
      return new NextResponse('Reservation not found', { status: 404 });
    }

    // Check if user is owner or participant
    const isOwner = reservation.owner.email === session.user.email;
    const isParticipant = reservation.participants.some(
      (p) => p.user.email === session.user.email
    );

    if (!isOwner && !isParticipant) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const messages = await prisma.message.findMany({
      where: {
        reservationId,
      },
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
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 