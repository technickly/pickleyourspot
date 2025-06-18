import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { reservationId: string; participantId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, value } = await request.json();
    if (type !== 'isGoing' && type !== 'hasPaid') {
      return NextResponse.json(
        { error: 'Invalid status type' },
        { status: 400 }
      );
    }

    // Get the participant status
    const participantStatus = await prisma.participantStatus.findUnique({
      where: { id: params.participantId },
      include: { user: true },
    });

    if (!participantStatus) {
      return NextResponse.json(
        { error: 'Participant status not found' },
        { status: 404 }
      );
    }

    // Verify that the user is updating their own status
    if (participantStatus.user.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized to update this participant status' },
        { status: 403 }
      );
    }

    // Update the status
    const updatedStatus = await prisma.participantStatus.update({
      where: { id: params.participantId },
      data: {
        [type]: value,
      },
    });

    return NextResponse.json(updatedStatus);
  } catch (error) {
    console.error('Error updating participant status:', error);
    return NextResponse.json(
      { error: 'Failed to update participant status' },
      { status: 500 }
    );
  }
} 