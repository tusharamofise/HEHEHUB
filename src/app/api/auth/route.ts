import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-admin';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
}

export async function POST(request: Request) {
  try {
    const { address, username } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Find existing user by address
    const { data: existingUser } = await supabase
      .from('User')
      .select()
      .eq('address', address.toLowerCase())
      .single();

    // If username is provided, this is a signup request
    if (username) {
      // Check if username already exists
      const { data: userWithUsername } = await supabase
        .from('User')
        .select()
        .eq('username', username)
        .single();

      if (userWithUsername) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        );
      }

      // Create new user if they don't exist
      if (!existingUser) {
        const { data: newUser, error } = await supabase
          .from('User')
          .insert([{ address: address.toLowerCase(), username }])
          .select()
          .single();

        if (error || !newUser) {
          throw error;
        }

        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET);
        return NextResponse.json({ token, user: newUser });
      }

      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // This is a login request
    if (existingUser) {
      const token = jwt.sign({ userId: existingUser.id }, JWT_SECRET);
      return NextResponse.json({ token, user: existingUser });
    }

    // User needs to sign up
    return NextResponse.json({ needsUsername: true }, { status: 404 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
