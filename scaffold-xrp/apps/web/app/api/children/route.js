import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { Wallet, Client } from 'xrpl';
import crypto from 'crypto';

// Generate a new XRPL wallet and return the address as child ID
async function generateChildWallet() {
  const wallet = Wallet.generate();
  return {
    address: wallet.address,
    seed: wallet.seed, // Clé privée - à retourner une seule fois à l'utilisateur
    publicKey: wallet.publicKey,
  };
}

// Calculate SHA-256 hash of child data
function calculateDataHash(childData) {
  // Créer un objet avec toutes les données de l'enfant
  const dataString = JSON.stringify({
    fullName: childData.fullName,
    alias: childData.alias,
    dateOfBirth: childData.dateOfBirth,
    birthPlace: childData.birthPlace,
    gender: childData.gender,
    parentsNames: childData.parentsNames,
    walletAddress: childData.walletAddress,
  });
  
  // Calculer le hash SHA-256
  const hash = crypto.createHash('sha256').update(dataString).digest('hex');
  return hash;
}

// Create XRPL transaction with hash in Memo
function createHashTransaction(childAddress, hash, ngoAddress) {
  // Le hash est déjà en hex (SHA-256), on le convertit en format XRPL Memo
  // XRPL attend les Memos en hex, mais on peut aussi passer directement le hash hex
  const hashHex = hash.toUpperCase(); // Le hash SHA-256 est déjà en hex
  
  return {
    TransactionType: 'Payment',
    Account: ngoAddress,
    Destination: childAddress, // Envoyer au wallet de l'enfant
    Amount: '10000000', // 10 XRP en drops pour activer le wallet (si nécessaire)
    Memos: [
      {
        Memo: {
          MemoData: hashHex, // Hash SHA-256 des données (déjà en hex)
          MemoType: Buffer.from('Hash', 'utf8').toString('hex').toUpperCase(), // "Hash" en hex
        },
      },
    ],
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

    // Validate NGO wallet address is provided
    if (!body.ngoWalletAddress) {
      return NextResponse.json(
        { error: 'Adresse du wallet ONG requise pour signer la transaction' },
        { status: 400 }
      );
    }

    // Generate a new XRPL wallet for the child
    const wallet = await generateChildWallet();
    
    // Create child data object
    const childData = {
      fullName: body.fullName || '',
      alias: body.alias || '',
      dateOfBirth: body.dateOfBirth || '',
      birthPlace: body.birthPlace || '',
      gender: body.gender || '',
      parentsNames: body.parentsNames || '',
      walletAddress: wallet.address,
    };

    // Calculate hash of child data
    const dataHash = calculateDataHash(childData);
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('xrpl_identity');
    const collection = db.collection('children');

    // Create child document with wallet address as ID
    const childDocument = {
      id: wallet.address, // L'ID est maintenant l'adresse XRPL du wallet
      ...childData,
      walletPublicKey: wallet.publicKey,
      // Hash et informations blockchain
      dataHash: dataHash, // Hash SHA-256 des données
      ngoWalletAddress: body.ngoWalletAddress, // Wallet ONG qui a créé l'enfant
      blockchainTxHash: null, // Sera rempli après la transaction
      blockchainTxId: null, // Sera rempli après la transaction
      isWalletActivated: false, // Sera mis à jour après activation
      // NOTE: Ne JAMAIS stocker la seed (clé privée) en base de données
      // Elle est retournée une seule fois dans la réponse
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into database
    await collection.insertOne(childDocument);

    // Create transaction template (to be signed by frontend)
    const transactionTemplate = createHashTransaction(
      wallet.address,
      dataHash,
      body.ngoWalletAddress
    );

    // Retourner l'enfant avec la seed et la transaction à signer
    return NextResponse.json({
      success: true,
      child: childDocument,
      walletSeed: wallet.seed, // ⚠️ À afficher une seule fois et à sauvegarder de manière sécurisée
      dataHash: dataHash, // Hash des données
      transactionTemplate: transactionTemplate, // Transaction XRPL à signer et envoyer
      warning: 'IMPORTANT: Sauvegardez cette seed (clé privée) de manière sécurisée. Elle ne sera plus affichée.',
      nextStep: 'La transaction XRPL doit être signée avec le wallet ONG et envoyée sur la blockchain.',
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
