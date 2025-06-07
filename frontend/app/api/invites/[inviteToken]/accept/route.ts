import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import prisma from '@/lib/prisma';

interface Participant {
  user: {
    email: string;
  };
}

export async function POST(
  request: Request,
  { params }: { params: { inviteToken: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the invite and check if it's valid
    const invite = await prisma.invite.findUnique({
      where: { token: params.inviteToken },
      include: {
        reservation: {
          include: {
            participants: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    // Check if invite has expired
    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invite has expired' },
        { status: 410 }
      );
    }

    // Check if the user is already a participant
    const isAlreadyParticipant = invite.reservation.participants.some(
      (p: Participant) => p.user.email === session.user.email
    );

    if (isAlreadyParticipant) {
      return NextResponse.json(
        { error: 'You are already a participant' },
        { status: 400 }
      );
    }

    // Get the user record
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create the participant record
    await prisma.$transaction([
      // Add the user as a participant
      prisma.participant.create({
        data: {
          userId: user.id,
          reservationId: invite.reservationId,
          isGoing: true,
          hasPaid: false,
        },
      }),
      // Mark the invite as used
      prisma.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the reservation',
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
} 