import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { email } = await context.params;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow users to view their own reservations
    if (session.user.email !== email) {
      return NextResponse.json(
        { error: 'Not authorized to view these reservations' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        reservations: {
          include: {
            court: true,
            participants: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        participants: {
          include: {
            court: true,
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
            participants: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      owned: user.reservations,
      participating: user.participants,
    });
  } catch (error) {
    console.error('Failed to fetch user reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user reservations' },
      { status: 500 }
    );
  }
} 