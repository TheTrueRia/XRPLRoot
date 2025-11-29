"use client";

import { useState } from "react";
import { Header } from "../../components/Header";
import { useWallet } from "../../components/providers/WalletProvider";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function NgoPortal() {
  const { isConnected, accountInfo, showStatus } = useWallet();
  const walletAddress = accountInfo?.address || null;

  const [child, setChild] = useState({
    fullName: "",
    alias: "",
    dateOfBirth: "",
    birthPlace: "",
    gender: "",
    parentsNames: "",
  });

  const [credential, setCredential] = useState({
    childId: "",
    type: "vaccination",
    data: "",
  });

  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const [isCreatingCredential, setIsCreatingCredential] = useState(false);
  const [createdChildId, setCreatedChildId] = useState(null);

  const createChild = async () => {
    if (!child.alias && !child.fullName) {
      showStatus("Au moins un identifiant est requis (alias ou nom complet)", "error");
      return;
    }

    setIsCreatingChild(true);
    try {
      const response = await fetch(`${BACKEND_URL}/children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(child),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      const result = await response.json();
      setCreatedChildId(result.child.id);
      showStatus(`Enfant créé avec succès ! ID: ${result.child.id}`, "success");
      
      // Réinitialiser le formulaire
      setChild({
        fullName: "",
        alias: "",
        dateOfBirth: "",
        birthPlace: "",
        gender: "",
        parentsNames: "",
      });
    } catch (error) {
      showStatus(`Erreur: ${error.message}`, "error");
      console.error("Erreur création enfant:", error);
    } finally {
      setIsCreatingChild(false);
    }
  };

  const createCredential = async () => {
    if (!walletAddress) {
      showStatus("Veuillez connecter le wallet ONG pour signer", "error");
      return;
    }

    if (!credential.childId || !credential.data) {
      showStatus("ID de l'enfant et données sont requis", "error");
      return;
    }

    setIsCreatingCredential(true);
    try {
      const response = await fetch(`${BACKEND_URL}/children/${credential.childId}/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: credential.type,
          data: credential.data,
          signerAddress: walletAddress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      const result = await response.json();
      showStatus(`Attestation créée avec succès ! ID: ${result.credential.id}`, "success");
      
      // Réinitialiser le formulaire
      setCredential({
        childId: "",
        type: "vaccination",
        data: "",
      });
    } catch (error) {
      showStatus(`Erreur: ${error.message}`, "error");
      console.error("Erreur création attestation:", error);
    } finally {
      setIsCreatingCredential(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Portail ONG – Identité Enfant</h1>
              <p className="text-gray-600">Création et signature des attestations officielles</p>
            </div>
            <div>
              {walletAddress ? (
                <div className="text-sm text-green-600">
                  ✅ Wallet connecté : {walletAddress.substring(0, 10)}...
                </div>
              ) : (
                <div className="text-sm text-red-500">
                  ⚠️ Veuillez connecter votre wallet via le header
                </div>
              )}
            </div>
          </header>

          {/* Création enfant */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">1. Créer un dossier enfant</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet (si connu)
                  </label>
                  <input
                    className="input"
                    placeholder="Ahmed Hassan"
                    value={child.fullName}
                    onChange={(e) => setChild({ ...child, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom d'usage ou surnom *
                  </label>
                  <input
                    className="input"
                    placeholder="Ahmed"
                    value={child.alias}
                    onChange={(e) => setChild({ ...child, alias: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance (ou estimation)
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={child.dateOfBirth}
                    onChange={(e) => setChild({ ...child, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lieu de naissance (si connu)
                  </label>
                  <input
                    className="input"
                    placeholder="Damas, Syrie"
                    value={child.birthPlace}
                    onChange={(e) => setChild({ ...child, birthPlace: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sexe / genre
                  </label>
                  <select
                    className="input"
                    value={child.gender}
                    onChange={(e) => setChild({ ...child, gender: e.target.value })}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom des parents (si connu)
                  </label>
                  <input
                    className="input"
                    placeholder="Hassan et Fatima"
                    value={child.parentsNames}
                    onChange={(e) => setChild({ ...child, parentsNames: e.target.value })}
                  />
                </div>
              </div>

              <button
                onClick={createChild}
                disabled={isCreatingChild}
                className="btn-primary w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isCreatingChild ? "Création en cours..." : "Créer le dossier enfant"}
              </button>

              {createdChildId && (
                <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  ✅ Enfant créé ! ID: <code className="font-mono">{createdChildId}</code>
                </div>
              )}
            </div>
          </div>

          {/* Création attestation */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">2. Créer et signer une attestation</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID de l'enfant *
                  </label>
                  <input
                    className="input"
                    placeholder="child_xxxxxx"
                    value={credential.childId}
                    onChange={(e) => setCredential({ ...credential, childId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'attestation *
                  </label>
                  <select
                    className="input"
                    value={credential.type}
                    onChange={(e) => setCredential({ ...credential, type: e.target.value })}
                  >
                    <option value="vaccination">Vaccination</option>
                    <option value="scolarite">Scolarité</option>
                    <option value="identite">Identité</option>
                    <option value="evaluation-age">Évaluation d'âge</option>
                    <option value="sante">Santé</option>
                    <option value="protection">Protection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Données principales *
                  </label>
                  <input
                    className="input"
                    placeholder="Détails de l'attestation"
                    value={credential.data}
                    onChange={(e) => setCredential({ ...credential, data: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={createCredential}
                  disabled={!walletAddress || isCreatingCredential}
                  className="btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isCreatingCredential ? "Création en cours..." : "Créer et signer l'attestation"}
                </button>
                {!walletAddress && (
                  <span className="text-sm text-red-500">
                    Veuillez connecter le wallet ONG pour signer
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rappel sécurité */}
          <div className="card bg-blue-50">
            <h3 className="font-semibold mb-2">Sécurité & Blockchain</h3>
            <p className="text-sm text-gray-700">
              Aucune donnée sensible n'est stockée sur la blockchain. Seules les signatures
              cryptographiques des ONG sont vérifiées via le réseau XRPL. Les données restent
              hors-chaîne et sont accessibles uniquement aux parties autorisées.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

