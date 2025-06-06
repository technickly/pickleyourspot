import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { reservationId } = await context.params;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the reservation and check ownership
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { owner: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.owner.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Only the reservation owner can delete the reservation' },
        { status: 403 }
      );
    }

    // Delete all related records first
    await prisma.$transaction([
      // Delete messages
      prisma.message.deleteMany({
        where: { reservationId: reservationId },
      }),
      // Delete payment statuses
      prisma.paymentStatus.deleteMany({
        where: { reservationId: reservationId },
      }),
      // Delete the reservation
      prisma.reservation.delete({
        where: { id: reservationId },
      }),
    ]);

    return NextResponse.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Failed to delete reservation:', error);
    return NextResponse.json(
      { error: 'Failed to delete reservation' },
      { status: 500 }
    );
  }
} 