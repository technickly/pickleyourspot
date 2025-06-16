'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaCalendarAlt, FaClock, FaChartLine, FaMessage } from 'react-icons/fa';

interface DashboardData {
  userStats: {
    totalUsers: number;
    usersWithReservations: number;
    usersWithMessages: number;
  };
  reservationStats: {
    totalReservations: number;
    reservationsByUser: {
      userId: string;
      name: string;
      email: string;
      count: number;
      totalDuration: number;
    }[];
    reservationsByTime: {
      hour: number;
      count: number;
    }[];
  };
  messageStats: {
    totalMessages: number;
    messagesByUser: {
      userId: string;
      name: string;
      email: string;
      count: number;
    }[];
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchDashboardData();
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No dashboard data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.userStats.totalUsers}</p>
              </div>
              <FaUsers className="text-blue-600 text-2xl" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reservations</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.reservationStats.totalReservations}</p>
              </div>
              <FaCalendarAlt className="text-green-600 text-2xl" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.messageStats.totalMessages}</p>
              </div>
              <FaMessage className="text-purple-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* User Activity */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Users with Reservations</p>
              <p className="text-2xl font-bold text-blue-900">{dashboardData.userStats.usersWithReservations}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Users with Messages</p>
              <p className="text-2xl font-bold text-green-900">{dashboardData.userStats.usersWithMessages}</p>
            </div>
          </div>
        </div>

        {/* Top Users by Reservations */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Users by Reservations</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Reservations</th>
                  <th className="text-left py-3 px-4">Total Duration (hours)</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.reservationStats.reservationsByUser.map((user, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{user.count}</td>
                    <td className="py-3 px-4">{user.totalDuration.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Users by Messages */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Users by Messages</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Messages</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.messageStats.messagesByUser.map((user, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{user.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reservation Time Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Reservation Time Distribution</h2>
          <div className="grid grid-cols-6 gap-4">
            {dashboardData.reservationStats.reservationsByTime.map((time, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-500">{time.hour}:00</div>
                <div className="font-medium">{time.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 