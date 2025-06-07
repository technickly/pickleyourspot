import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { inviteToken: string } }
) {
  try {
    const invite = await prisma.invite.findUnique({
      where: { token: params.inviteToken },
      include: {
        reservation: {
          include: {
            court: true,
            owner: {
              select: {
                name: true,
                email: true,
                image: true,
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

    // Return reservation details
    return NextResponse.json({
      id: invite.reservation.id,
      name: invite.reservation.name,
      startTime: invite.reservation.startTime,
      endTime: invite.reservation.endTime,
      description: invite.reservation.description,
      court: {
        name: invite.reservation.court.name,
        description: invite.reservation.court.description,
        imageUrl: invite.reservation.court.imageUrl,
      },
      owner: {
        name: invite.reservation.owner.name,
        email: invite.reservation.owner.email,
        image: invite.reservation.owner.image,
      },
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invite details' },
      { status: 500 }
    );
  }
} 