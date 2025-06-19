import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId, type, value;
    try {
      ({ userId, type, value } = await request.json());
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!userId || !type || typeof value === 'undefined') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Only allow the participant themselves to update their status
    // userId should be the database ID, so we compare with session.user.id
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.participantStatus.update({
      where: {
        userId_reservationId: {
          userId,
          reservationId,
        },
      },
      data: type === 'payment' ? { hasPaid: value } : { isGoing: value },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      userId: updated.userId,
      hasPaid: updated.hasPaid,
      isGoing: updated.isGoing,
      name: updated.user.name,
      email: updated.user.email,
      image: updated.user.image,
    });
  } catch (error) {
    console.error('Error updating participant status:', error);
    return NextResponse.json(
      { error: 'Failed to update participant status' },
      { status: 500 }
    );
  }
}