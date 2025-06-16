import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { shortUrl: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { shortUrl: params.shortUrl },
      select: {
        id: true,
        password: true,
        participants: {
          where: {
            user: {
              email: session.user.email
            }
          }
        }
      }
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // If user is already a participant, allow access
    if (reservation.participants.length > 0) {
      return NextResponse.json({ success: true });
    }

    // If no password is set, allow access
    if (!reservation.password) {
      return NextResponse.json({ success: true });
    }

    // Verify password
    if (reservation.password !== password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    );
  }
} 