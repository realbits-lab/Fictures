import { NextRequest, NextResponse } from 'next/server';
import { updateUser, findUserByEmail } from '@/lib/db/queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const body = await request.json();
    const { role } = body;

    if (!role || !['reader', 'writer', 'manager', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: reader, writer, manager, admin' },
        { status: 400 }
      );
    }

    // Await params in Next.js 15
    const { userId } = await params;

    const updatedUser = await updateUser(userId, { role });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User role updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper endpoint to update role by email (for easier management)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    if (!['reader', 'writer', 'manager', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: reader, writer, manager, admin' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updatedUser = await updateUser(user.id, { role });

    return NextResponse.json({
      message: 'User role updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}