import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ courtId: string }> }
) {
  try {
    const { courtId } = await context.params;
    
    const court = await prisma.court.findUnique({
      where: { id: courtId },
    });

    if (!court) {
      return NextResponse.json(
        { error: 'Court not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(court);
  } catch (error) {
    console.error('Failed to fetch court:', error);
    return NextResponse.json(
      { error: 'Failed to fetch court' },
      { status: 500 }
    );
  }
} 