import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import { Client } from 'xrpl';
import crypto from 'crypto';

/**
 * Vérifie l'intégrité des données d'un enfant
 * - Compare le hash calculé avec le hash stocké dans MongoDB
 * - Récupère le hash depuis la transaction XRPL
 * - Compare les deux pour vérifier l'intégrité
 */
export async function GET(request, { params }) {
  try {
    const { childId } = params;

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('xrpl_identity');
    const collection = db.collection('children');

    // Récupérer l'enfant
    const child = await collection.findOne({ id: childId });
    if (!child) {
      return NextResponse.json(
        { error: 'Enfant non trouvé' },
        { status: 404 }
      );
    }

    // Recalculer le hash des données actuelles
    const childData = {
      fullName: child.fullName || '',
      alias: child.alias || '',
      dateOfBirth: child.dateOfBirth || '',
      birthPlace: child.birthPlace || '',
      gender: child.gender || '',
      parentsNames: child.parentsNames || '',
      walletAddress: child.walletAddress || child.id,
    };

    const calculatedHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(childData))
      .digest('hex')
      .toUpperCase();

    // Vérifier le hash stocké dans MongoDB
    const storedHash = child.dataHash?.toUpperCase() || null;
    const hashMatch = storedHash && calculatedHash === storedHash;

    // Récupérer le hash depuis la blockchain XRPL si transaction existe
    let blockchainHash = null;
    let blockchainVerified = false;
    let transactionDetails = null;

    if (child.blockchainTxHash) {
      try {
        // Connecter au réseau XRPL (testnet)
        const client = new Client('wss://s.altnet.rippletest.net:51233');
        await client.connect();

        // Récupérer la transaction
        const txResponse = await client.request({
          command: 'tx',
          transaction: child.blockchainTxHash,
        });

        if (txResponse.result && txResponse.result.Memos) {
          // Extraire le hash du Memo
          const memo = txResponse.result.Memos[0];
          if (memo && memo.Memo && memo.Memo.MemoData) {
            // Le MemoData est déjà en hex (comme on l'a stocké)
            // Le convertir en string hex directement
            blockchainHash = memo.Memo.MemoData.toUpperCase();
          }
        }

        // Vérifier que le hash blockchain correspond
        blockchainVerified = blockchainHash && calculatedHash === blockchainHash;

        transactionDetails = {
          hash: txResponse.result.hash,
          ledger_index: txResponse.result.ledger_index,
          validated: txResponse.result.validated,
          date: txResponse.result.date,
          fee: txResponse.result.Fee,
          Account: txResponse.result.Account,
          Destination: txResponse.result.Destination,
          Amount: txResponse.result.Amount,
        };

        await client.disconnect();
      } catch (blockchainError) {
        console.error('Erreur lors de la récupération de la transaction XRPL:', blockchainError);
      }
    }

    return NextResponse.json({
      success: true,
      childId: childId,
      verification: {
        // Hash calculé actuellement
        calculatedHash: calculatedHash,
        // Hash stocké dans MongoDB
        storedHash: storedHash,
        // Hash récupéré depuis XRPL
        blockchainHash: blockchainHash,
        // Vérifications
        hashMatch: hashMatch, // Hash calculé === Hash MongoDB
        blockchainVerified: blockchainVerified, // Hash calculé === Hash XRPL
        // Statut global
        integrity: hashMatch && (blockchainHash ? blockchainVerified : true),
      },
      transaction: transactionDetails,
      child: {
        id: child.id,
        alias: child.alias,
        fullName: child.fullName,
        walletAddress: child.walletAddress || child.id,
        blockchainTxHash: child.blockchainTxHash,
        isWalletActivated: child.isWalletActivated,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error verifying child:', error);
    return NextResponse.json(
      { error: `Erreur lors de la vérification: ${error.message}` },
      { status: 500 }
    );
  }
}

