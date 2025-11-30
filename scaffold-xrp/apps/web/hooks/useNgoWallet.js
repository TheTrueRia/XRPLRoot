"use client";

import { useEffect, useState } from "react";
import { Wallet, Client } from "xrpl";
import { useWallet } from "../components/providers/WalletProvider";

// Wallet ONG par défaut
// Seed: sEd7TmfxnK2wmHtB1qoSEwrp4nVXA7X
// Adresse attendue: ramqkotTB7LP4Ck2CoBpqboGSGzR61kyKd
const NGO_WALLET_SEED = "sEd7TmfxnK2wmHtB1qoSEwrp4nVXA7X";
const NGO_WALLET_ADDRESS = "ramqkotTB7LP4Ck2CoBpqboGSGzR61kyKd"; // Adresse XRPL (pas la clé publique)

/**
 * Hook pour connecter automatiquement le wallet ONG
 * Ce wallet sera utilisé pour signer toutes les transactions
 */
export function useNgoWallet() {
  const { setIsConnected, setAccountInfo } = useWallet();
  const [ngoWallet, setNgoWallet] = useState(null);
  const [xrplClient, setXrplClient] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    const initializeNgoWallet = async () => {
      try {
        // Créer le wallet à partir de la seed
        const wallet = Wallet.fromSeed(NGO_WALLET_SEED);
        
        // Vérifier que l'adresse correspond
        if (wallet.address !== NGO_WALLET_ADDRESS) {
          console.warn(`L'adresse du wallet (${wallet.address}) ne correspond pas à l'adresse attendue (${NGO_WALLET_ADDRESS})`);
          console.log("Utilisation de l'adresse générée:", wallet.address);
        }

        // Connecter au réseau XRPL (testnet)
        const client = new Client("wss://s.altnet.rippletest.net:51233");
        await client.connect();

        setNgoWallet(wallet);
        setXrplClient(client);

        // Mettre à jour l'état de connexion
        setIsConnected(true);
        setAccountInfo({
          address: wallet.address,
          network: "testnet",
          walletName: "Wallet ONG (Automatique)",
        });

        setStatusMessage({ message: "Wallet ONG connecté automatiquement", type: "success" });
        setIsInitialized(true);

        console.log("Wallet ONG initialisé:", wallet.address);
      } catch (error) {
        console.error("Erreur lors de l'initialisation du wallet ONG:", error);
        setStatusMessage({ message: "Erreur lors de la connexion du wallet ONG", type: "error" });
      }
    };

    initializeNgoWallet();

    // Cleanup: déconnecter le client à la fermeture
    return () => {
      if (xrplClient) {
        xrplClient.disconnect().catch(console.error);
      }
    };
  }, [setIsConnected, setAccountInfo]);

  /**
   * Signe et soumet une transaction XRPL
   * @param {Object} transaction - Transaction XRPL à signer
   * @returns {Promise<Object>} Résultat de la transaction
   */
  const signAndSubmit = async (transaction) => {
    if (!ngoWallet || !xrplClient) {
      throw new Error("Wallet ONG non initialisé");
    }

    try {
      // Préparer la transaction
      const prepared = await xrplClient.autofill(transaction);
      
      // Signer avec le wallet ONG
      const signed = ngoWallet.sign(prepared);
      
      // Soumettre la transaction
      const result = await xrplClient.submitAndWait(signed.tx_blob);
      
      return {
        hash: result.result.hash,
        id: result.result.hash,
        result: result.result,
      };
    } catch (error) {
      console.error("Erreur lors de la signature/soumission:", error);
      throw error;
    }
  };

  /**
   * Signe une transaction sans la soumettre
   * @param {Object} transaction - Transaction XRPL à signer
   * @returns {Promise<Object>} Transaction signée
   */
  const sign = async (transaction) => {
    if (!ngoWallet || !xrplClient) {
      throw new Error("Wallet ONG non initialisé");
    }

    try {
      const prepared = await xrplClient.autofill(transaction);
      const signed = ngoWallet.sign(prepared);
      
      return {
        tx_blob: signed.tx_blob,
        hash: signed.hash,
      };
    } catch (error) {
      console.error("Erreur lors de la signature:", error);
      throw error;
    }
  };

  // Fonction pour afficher les messages de statut
  const showStatus = (message, type) => {
    setStatusMessage({ message, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  return {
    ngoWallet,
    xrplClient,
    isInitialized,
    walletAddress: ngoWallet?.address || null,
    signAndSubmit,
    sign,
    showStatus,
    statusMessage,
  };
}

