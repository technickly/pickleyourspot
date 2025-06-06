import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: Request
) {
  try {
    const session = await getServerSession(authOptions);
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

    // Get owned reservations
    const ownedReservations = await prisma.reservation.findMany({
      where: {
        owner: {
          email: userEmail,
        },
      },
      include: {
        court: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get participated reservations
    const participatedReservations = await prisma.reservation.findMany({
      where: {
        participants: {
          some: {
            email: userEmail,
          },
        },
      },
      include: {
        court: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Format the response to include whether the user is the owner
    const allReservations = [
      ...ownedReservations.map((r: any) => ({
        id: r.id,
        shortUrl: r.shortUrl,
        courtName: r.court.name,
        startTime: r.startTime,
        endTime: r.endTime,
        description: r.description,
        isOwner: true,
      })),
      ...participatedReservations.map((r: any) => ({
        id: r.id,
        shortUrl: r.shortUrl,
        courtName: r.court.name,
        startTime: r.startTime,
        endTime: r.endTime,
        description: r.description,
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