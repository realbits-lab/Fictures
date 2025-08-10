import { NextRequest, NextResponse } from 'next/server';
import { checkPermittedUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Check if this email is permitted to login
    const isPermitted = await checkPermittedUser(email);
    
    return NextResponse.json({
      success: true,
      permitted: isPermitted
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}