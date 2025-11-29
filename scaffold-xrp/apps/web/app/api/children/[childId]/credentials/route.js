import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';

// Generate a unique credential ID
function generateCredentialId() {
  return `cred_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(request, { params }) {
  try {
    const { childId } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.data) {
      return NextResponse.json(
        { error: 'Type et données sont requis' },
        { status: 400 }
      );
    }

    if (!body.signerAddress) {
      return NextResponse.json(
        { error: 'Adresse du signataire requise' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('xrpl_identity');

    // Verify child exists
    const childrenCollection = db.collection('children');
    const child = await childrenCollection.findOne({ id: childId });

    if (!child) {
      return NextResponse.json(
        { error: 'Enfant non trouvé' },
        { status: 404 }
      );
    }

    // Create credential document
    const credentialDocument = {
      id: generateCredentialId(),
      childId: childId,
      type: body.type,
      data: body.data,
      signerAddress: body.signerAddress,
      signature: body.signature || null, // Signature XRPL if provided
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into database
    const credentialsCollection = db.collection('credentials');
    await credentialsCollection.insertOne(credentialDocument);

    return NextResponse.json({
      success: true,
      credential: credentialDocument,
    });
  } catch (error) {
    console.error('Error creating credential:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'attestation' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { childId } = params;

    const client = await clientPromise;
    const db = client.db('xrpl_identity');
    const collection = db.collection('credentials');

    const credentials = await collection
      .find({ childId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      credentials,
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des attestations' },
      { status: 500 }
    );
  }
}
