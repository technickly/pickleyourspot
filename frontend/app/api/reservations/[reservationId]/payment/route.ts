import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { reservationId } = await context.params;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentStatuses = await prisma.paymentStatus.findMany({
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
    });

    return NextResponse.json(paymentStatuses);
  } catch (error) {
    console.error('Failed to fetch payment statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment statuses' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hasPaid } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const paymentStatus = await prisma.paymentStatus.upsert({
      where: {
        userId_reservationId: {
          userId: user.id,
          reservationId: reservationId,
        },
      },
      update: {
        hasPaid,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        reservationId: reservationId,
        hasPaid,
      },
    });

    return NextResponse.json(paymentStatus);
  } catch (error) {
    console.error('Failed to update payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
} 