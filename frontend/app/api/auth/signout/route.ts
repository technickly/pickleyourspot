import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session) {
      console.log('🗑️ Custom sign out for user:', session.user?.email);
    }
    
    // Clear all cookies
    const response = NextResponse.json({ success: true });
    
    // Clear NextAuth cookies
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__Host-next-auth.csrf-token');
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('__Secure-next-auth.callback-url');
    response.cookies.delete('next-auth.callback-url');
    
    // Redirect to home page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Error in custom sign out:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
} 