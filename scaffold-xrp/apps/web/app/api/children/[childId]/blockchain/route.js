import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';

// Endpoint pour mettre à jour les informations blockchain après soumission
export async function POST(request, { params }) {
  try {
    const { childId } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.transactionHash) {
      return NextResponse.json(
        { error: 'Hash de transaction requis' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('xrpl_identity');
    const childrenCollection = db.collection('children');

    // Verify child exists
    const child = await childrenCollection.findOne({ id: childId });
    if (!child) {
      return NextResponse.json(
        { error: 'Enfant non trouvé' },
        { status: 404 }
      );
    }

    // Map network IDs
    const networkMap = {
      1: 'testnet',
      2: 'devnet',
      21465: 'alphanet',
    };
    const network = networkMap[body.network] || 'testnet';

    // Update child document with transaction info
    const updateResult = await childrenCollection.updateOne(
      { id: childId },
      {
        $set: {
          blockchainTxHash: body.transactionHash,
          blockchainTxId: body.transactionId || body.transactionHash,
          isWalletActivated: true, // Le wallet est activé si la transaction a réussi
          blockchainNetwork: network,
          blockchainSubmittedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      transaction: {
        hash: body.transactionHash,
        id: body.transactionId || body.transactionHash,
      },
      childUpdated: updateResult.modifiedCount > 0,
    });
  } catch (error) {
    console.error('Error updating blockchain info:', error);
    return NextResponse.json(
      { error: `Erreur lors de la mise à jour: ${error.message}` },
      { status: 500 }
    );
  }
}

