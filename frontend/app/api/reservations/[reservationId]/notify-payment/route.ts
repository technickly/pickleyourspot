import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  context: { params: Promise<{ reservationId: string }> }
) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Await the params before using them
    const { reservationId } = await context.params;
    if (!reservationId) {
      return new NextResponse('Reservation ID is required', { status: 400 });
    }

    // Find the participant status and update it
    const participantStatus = await prisma.participantStatus.update({
      where: {
        userId_reservationId: {
          userId: session.user.id,
          reservationId: reservationId
        }
      },
      data: {
        hasPaid: true
      }
    });

    if (!participantStatus) {
      return new NextResponse('Failed to update payment status', { status: 400 });
    }

    return NextResponse.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 