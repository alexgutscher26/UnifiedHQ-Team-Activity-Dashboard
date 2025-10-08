import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET - Load user preferences
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: {
        userId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: preferences || {
        githubOwner: null,
        githubRepo: null,
        githubRepoId: null
      }
    });

  } catch (error) {
    console.error('User Preferences GET Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load user preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST/PUT - Save user preferences
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { githubOwner, githubRepo, githubRepoId } = body;

    // Validate required fields
    if (!githubOwner || !githubRepo || !githubRepoId) {
      return NextResponse.json(
        { error: 'Missing required fields: githubOwner, githubRepo, githubRepoId' },
        { status: 400 }
      );
    }

    // Upsert user preferences
    const preferences = await prisma.userPreferences.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        githubOwner,
        githubRepo,
        githubRepoId,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        githubOwner,
        githubRepo,
        githubRepoId
      }
    });

    return NextResponse.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('User Preferences POST Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save user preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Clear user preferences
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await prisma.userPreferences.deleteMany({
      where: {
        userId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User preferences cleared'
    });

  } catch (error) {
    console.error('User Preferences DELETE Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear user preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
