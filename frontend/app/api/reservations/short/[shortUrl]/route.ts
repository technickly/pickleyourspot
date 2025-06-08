import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Reservation } from '@prisma/client';

interface ReservationResponse {
  id: string;
  name: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  paymentRequired: boolean;
  paymentInfo: string | null;
  password: string | null;
  court: {
    name: string;
    description: string | null;
  };
  owner: {
    name: string | null;
    email: string;
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ shortUrl: string }> }
) {
  try {
    const { shortUrl } = await context.params;

    const reservation = await prisma.reservation.findUnique({
      where: { shortUrl },
      include: {
        court: {
          select: {
            name: true,
            description: true,
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!reservation) {
      return new Response(JSON.stringify({ error: 'Reservation not found' }), { status: 404 });
    }

    // Transform the response to include only necessary fields
    const response: ReservationResponse = {
      id: reservation.id,
      name: reservation.name,
      description: reservation.description,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      paymentRequired: reservation.paymentRequired,
      paymentInfo: reservation.paymentInfo,
      password: (reservation as any).password, // Type assertion to handle the password field
      court: reservation.court,
      owner: reservation.owner,
    };

    return new Response(JSON.stringify(response));
  } catch (error) {
    console.error('Failed to fetch reservation:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch reservation' }), { status: 500 });
  }
} 