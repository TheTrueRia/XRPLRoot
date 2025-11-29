import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

// Generate a unique child ID
function generateChildId() {
  return `child_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate that at least one identifier is provided
    if (!body.alias && !body.fullName) {
      return NextResponse.json(
        { error: 'Au moins un identifiant est requis (alias ou nom complet)' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('xrpl_identity');
    const collection = db.collection('children');

    // Create child document
    const childDocument = {
      id: generateChildId(),
      fullName: body.fullName || '',
      alias: body.alias || '',
      dateOfBirth: body.dateOfBirth || '',
      birthPlace: body.birthPlace || '',
      gender: body.gender || '',
      parentsNames: body.parentsNames || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into database
    await collection.insertOne(childDocument);

    return NextResponse.json({
      success: true,
      child: childDocument,
    });
  } catch (error) {
    console.error('Error creating child:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'enfant' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db('xrpl_identity');
    const collection = db.collection('children');

    const children = await collection.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      children,
    });
  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des enfants' },
      { status: 500 }
    );
  }
}
