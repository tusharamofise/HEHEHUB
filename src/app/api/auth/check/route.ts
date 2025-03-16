import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-admin';
import jwt from 'jsonwebtoken';
import vision from '@google-cloud/vision';

const JWT_SECRET = process.env.JWT_SECRET || 'E55r495+0xNpNriVa2OpsA54VF364+qsZETH8ubkbyE=';

// Initialize Google Cloud Vision client
const visionClient = new vision.ImageAnnotatorClient();

export async function POST(request: Request) {
  try {
    const { address, image } = await request.json();

    if (!address || !image) {
      return NextResponse.json(
        { error: 'Address and image are required' },
        { status: 400 }
      );
    }

    // Facial recognition check
    const [result] = await visionClient.faceDetection({ image: { content: image } });
    const faces = result.faceAnnotations;

    if (!faces || faces.length === 0) {
      return NextResponse.json(
        { error: 'No face detected. Please upload a valid image.' },
        { status: 400 }
      );
    }

    // Find existing user by address
    const { data: existingUser } = await supabase
      .from('User')
      .select()
      .eq('address', address.toLowerCase())
      .single();

    if (existingUser) {
      const token = jwt.sign({ userId: existingUser.id }, JWT_SECRET);
      return NextResponse.json({ token, user: existingUser });
    }

    // User not found
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
