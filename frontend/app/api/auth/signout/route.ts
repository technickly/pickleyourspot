import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session) {
      console.log('🗑️ Custom sign out for user:', session.user?.email);
    }
    
    // Create response with all cookies cleared
    const response = NextResponse.redirect(new URL('/', request.url));
    
    // Clear all possible NextAuth cookies
    const cookiesToDelete = [
      '__Secure-next-auth.session-token',
      'next-auth.session-token',
      '__Host-next-auth.csrf-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.callback-url',
      'next-auth.callback-url',
      '__Secure-next-auth.pkce.verifier',
      'next-auth.pkce.verifier',
      '__Host-next-auth.pkce.verifier',
      '__Secure-next-auth.state',
      'next-auth.state',
      '__Host-next-auth.state'
    ];
    
    cookiesToDelete.forEach(cookieName => {
      response.cookies.delete(cookieName);
    });
    
    // Also clear with different domain settings
    response.cookies.set('__Secure-next-auth.session-token', '', { 
      expires: new Date(0),
      path: '/',
      secure: true,
      sameSite: 'lax'
    });
    
    response.cookies.set('next-auth.session-token', '', { 
      expires: new Date(0),
      path: '/',
      secure: false,
      sameSite: 'lax'
    });
    
    console.log('🧹 Cleared all NextAuth cookies');
    
    return response;
  } catch (error) {
    console.error('Error in custom sign out:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
} 