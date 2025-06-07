import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

interface Participant {
  user: {
    email: string;
  };
}

export async function POST(
  request: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify the reservation exists and the user has permission to invite
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.reservationId },
      include: {
        owner: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Only allow the owner to send invites
    if (reservation.owner.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Only the reservation owner can send invites' },
        { status: 403 }
      );
    }

    // Check if the user is already a participant
    const isAlreadyParticipant = reservation.participants.some(
      (p: Participant) => p.user.email === email
    );

    if (isAlreadyParticipant) {
      return NextResponse.json(
        { error: 'User is already a participant' },
        { status: 400 }
      );
    }

    // Generate a unique invite token
    const inviteToken = nanoid();

    // Create the invite record
    const invite = await prisma.invite.create({
      data: {
        token: inviteToken,
        email,
        reservationId: reservation.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    // Generate the invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`;

    // In a real application, you would:
    // 1. Send an email to the invited user with the link
    // 2. Create a notification for the invited user if they're already registered
    // 3. Handle any email delivery errors

    return NextResponse.json({
      success: true,
      inviteLink,
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    );
  }
} 