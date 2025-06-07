import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

interface Participant {
  name: string | null;
  email: string;
}

export async function GET(
  request: Request
) {
  try {
    const session = await getServerSession();
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('email');

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Only allow users to view their own reservations
    if (session.user.email !== userEmail) {
      return NextResponse.json(
        { error: 'Not authorized to view these reservations' },
        { status: 403 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get owned reservations
    const ownedReservations = await prisma.reservation.findMany({
      where: {
        ownerId: user.id,
      },
      include: {
        court: {
          select: {
            name: true,
          },
        },
        participants: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Get participated reservations
    const participatedReservations = await prisma.reservation.findMany({
      where: {
        participants: {
          some: {
            id: user.id,
          },
        },
      },
      include: {
        court: {
          select: {
            name: true,
          },
        },
        participants: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Format the response to include whether the user is the owner
    const allReservations = [
      ...ownedReservations.map((r: any) => ({
        id: r.id,
        shortUrl: r.shortUrl,
        name: r.name,
        courtName: r.court.name,
        startTime: r.startTime,
        endTime: r.endTime,
        description: r.description,
        paymentRequired: r.paymentRequired,
        paymentInfo: r.paymentInfo,
        participants: r.participants.map((p: Participant) => ({
          ...p,
          hasPaid: false // Default to false since we don't track this yet
        })),
        isOwner: true,
      })),
      ...participatedReservations.map((r: any) => ({
        id: r.id,
        shortUrl: r.shortUrl,
        name: r.name,
        courtName: r.court.name,
        startTime: r.startTime,
        endTime: r.endTime,
        description: r.description,
        paymentRequired: r.paymentRequired,
        paymentInfo: r.paymentInfo,
        participants: r.participants.map((p: Participant) => ({
          ...p,
          hasPaid: false // Default to false since we don't track this yet
        })),
        isOwner: false,
      })),
    ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return NextResponse.json(allReservations);
  } catch (error) {
    console.error('Error in user reservations route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
} 