import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user statistics
    const totalUsers = await prisma.user.count();
    const usersWithReservations = await prisma.user.count({
      where: {
        reservations: {
          some: {}
        }
      }
    });
    const usersWithMessages = await prisma.user.count({
      where: {
        messages: {
          some: {}
        }
      }
    });

    // Get reservation statistics
    const totalReservations = await prisma.reservation.count();
    
    // Get top users by reservations
    const reservationsByUser = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        reservations: {
          select: {
            startTime: true,
            endTime: true
          }
        }
      },
      where: {
        reservations: {
          some: {}
        }
      }
    });

    const formattedReservationsByUser = reservationsByUser.map(user => ({
      userId: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      count: user.reservations.length,
      totalDuration: user.reservations.reduce((total, res) => {
        const duration = (new Date(res.endTime).getTime() - new Date(res.startTime).getTime()) / (1000 * 60 * 60);
        return total + duration;
      }, 0)
    })).sort((a, b) => b.count - a.count);

    // Get reservation time distribution
    const allReservations = await prisma.reservation.findMany({
      select: {
        startTime: true
      }
    });

    const timeDistribution = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: allReservations.filter(res => new Date(res.startTime).getHours() === i).length
    }));

    // Get message statistics
    const totalMessages = await prisma.message.count();
    
    // Get top users by messages
    const messagesByUser = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            messages: true
          }
        }
      },
      where: {
        messages: {
          some: {}
        }
      }
    });

    const formattedMessagesByUser = messagesByUser
      .map(user => ({
        userId: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        count: user._count.messages
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      userStats: {
        totalUsers,
        usersWithReservations,
        usersWithMessages
      },
      reservationStats: {
        totalReservations,
        reservationsByUser: formattedReservationsByUser,
        reservationsByTime: timeDistribution
      },
      messageStats: {
        totalMessages,
        messagesByUser: formattedMessagesByUser
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 