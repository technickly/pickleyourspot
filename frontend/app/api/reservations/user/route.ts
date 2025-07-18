import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import prisma from '@/lib/prisma';

interface ReservationWithRelations {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  shortUrl: string;
  description: string | null;
  paymentRequired: boolean;
  paymentInfo: string | null;
  passwordRequired: boolean;
  court: {
    name: string;
  };
  owner: {
    name: string | null;
    email: string;
    image: string | null;
  };
  participants: Array<{
    userId: string;
    hasPaid: boolean;
    isGoing: boolean;
    user: {
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
}

interface Court {
  name: string;
  description: string;
  imageUrl: string;
}

interface FormattedReservation {
  id: string;
  shortUrl: string;
  name: string;
  courtName: string;
  startTime: Date;
  endTime: Date;
  description: string | null;
  paymentRequired: boolean;
  paymentInfo: string | null;
  participants: {
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
    hasPaid: boolean;
    isGoing: boolean;
  }[];
  isOwner: boolean;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's ID first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get reservations where user is owner
    const ownedReservations = await prisma.reservation.findMany({
      where: {
        owner: {
          email: session.user.email
        }
      },
      include: {
        court: true,
        owner: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Get reservations where user is participant
    const participantReservations = await prisma.reservation.findMany({
      where: {
        participants: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        court: true,
        owner: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Combine and format the results
    const allReservations = [
      ...ownedReservations.map((r: ReservationWithRelations) => ({
        ...r,
        isOwner: true,
        courtName: r.court.name,
        name: r.name
      })),
      ...participantReservations
        .filter((r: ReservationWithRelations) => r.owner.email !== session.user.email)
        .map((r: ReservationWithRelations) => ({
          ...r,
          isOwner: false,
          courtName: r.court.name,
          name: r.name
        })),
    ];

    return NextResponse.json(allReservations);
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
} 