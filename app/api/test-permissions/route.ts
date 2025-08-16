import { NextRequest, NextResponse } from 'next/server';
import { addPermittedUser, checkPermittedUser, getPermittedUsers } from '@/lib/db/queries';

export async function GET() {
  try {
    const allUsers = await getPermittedUsers();
    return NextResponse.json({ 
      success: true, 
      permittedUsers: allUsers 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Check if already exists
    const exists = await checkPermittedUser(email);
    if (exists) {
      return NextResponse.json({
        success: true,
        message: `Email ${email} is already in permitted users`,
        alreadyExists: true
      });
    }

    // Add the user
    const result = await addPermittedUser(email);
    return NextResponse.json({
      success: true,
      message: `Successfully added ${email} to permitted users`,
      user: result[0]
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}