import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { Wallet } from 'xrpl';

// Generate a new XRPL wallet and return the address as child ID
async function generateChildWallet() {
  const wallet = Wallet.generate();
  return {
    address: wallet.address,
    seed: wallet.seed, // Clé privée - à retourner une seule fois à l'utilisateur
    publicKey: wallet.publicKey,
  };
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

    // Generate a new XRPL wallet for the child
    const wallet = await generateChildWallet();
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('xrpl_identity');
    const collection = db.collection('children');

    // Create child document with wallet address as ID
    const childDocument = {
      id: wallet.address, // L'ID est maintenant l'adresse XRPL du wallet
      fullName: body.fullName || '',
      alias: body.alias || '',
      dateOfBirth: body.dateOfBirth || '',
      birthPlace: body.birthPlace || '',
      gender: body.gender || '',
      parentsNames: body.parentsNames || '',
      walletAddress: wallet.address, // Stocker aussi l'adresse explicitement
      walletPublicKey: wallet.publicKey,
      // NOTE: Ne JAMAIS stocker la seed (clé privée) en base de données
      // Elle est retournée une seule fois dans la réponse
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into database
    await collection.insertOne(childDocument);

    // Retourner l'enfant avec la seed (à afficher une seule fois à l'utilisateur)
    return NextResponse.json({
      success: true,
      child: childDocument,
      walletSeed: wallet.seed, // ⚠️ À afficher une seule fois et à sauvegarder de manière sécurisée
      warning: 'IMPORTANT: Sauvegardez cette seed (clé privée) de manière sécurisée. Elle ne sera plus affichée.',
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
