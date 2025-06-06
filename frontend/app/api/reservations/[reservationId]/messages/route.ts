import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
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

    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Get the user and check if they have access to this reservation
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        reservations: {
          where: { id: reservationId },
        },
        participants: {
          where: { id: reservationId },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or participant
    const isOwner = user.reservations.length > 0;
    const isParticipant = user.participants.length > 0;

    if (!isOwner && !isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to message in this reservation' },
        { status: 403 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        userId: user.id,
        reservationId: reservationId,
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
    console.error('Failed to create message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has access to this reservation
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        reservations: {
          where: { id: reservationId },
        },
        participants: {
          where: { id: reservationId },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isOwner = user.reservations.length > 0;
    const isParticipant = user.participants.length > 0;

    if (!isOwner && !isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to view messages in this reservation' },
        { status: 403 }
      );
    }

    // Get all messages for this reservation
    const messages = await prisma.message.findMany({
      where: {
        reservationId: reservationId,
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
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
} 