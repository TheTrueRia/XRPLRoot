"use client";

import { useState, useEffect } from "react";
import { Header } from "../../components/Header";
import { useWallet } from "../../components/providers/WalletProvider";
import { useNgoWallet } from "../../hooks/useNgoWallet";
import Link from "next/link";

// Use Next.js API routes instead of external backend
const BACKEND_URL = "/api";

// Types de modes d'accès
const ACCESS_MODES = {
  NGO: "ngo",           // ONG : création, gestion complète
  CHILD: "child",       // Enfant avec wallet : modification de ses données
  VIEW: "view"          // Visualisation avec code : lecture seule
};

export default function NgoPortal() {
  const { showStatus: showWalletStatus } = useWallet();
  // Wallet ONG automatique - se connecte automatiquement au chargement
  const { 
    isInitialized: isNgoWalletReady, 
    walletAddress: ngoWalletAddress, 
    signAndSubmit: ngoSignAndSubmit,
    showStatus: showNgoStatus 
  } = useNgoWallet();
  
  // Utiliser le wallet ONG comme wallet principal
  const walletAddress = ngoWalletAddress;
  const isConnected = isNgoWalletReady;
  
  // Fonction pour afficher les messages de statut
  const showStatus = (message, type) => {
    if (showNgoStatus) {
      showNgoStatus(message, type);
    } else if (showWalletStatus) {
      showWalletStatus(message, type);
    }
  };

  // État du mode d'accès
  const [accessMode, setAccessMode] = useState(ACCESS_MODES.NGO);
  const [viewCode, setViewCode] = useState("");
  const [currentChildId, setCurrentChildId] = useState(null);

  // États pour la création d'enfant
  const [child, setChild] = useState({
    fullName: "",
    alias: "",
    dateOfBirth: "",
    birthPlace: "",
    gender: "",
    parentsNames: "",
  });

  // États pour les enfants suivis (6 enfants de démonstration)
  const [children, setChildren] = useState([
    {
      id: "child_ahmed01",
      fullName: "Ahmed Hassan",
      alias: "Ahmed",
      dateOfBirth: "2015-03-15",
      birthPlace: "Damas, Syrie",
      gender: "M",
      parentsNames: "Hassan et Fatima",
      createdAt: new Date().toISOString(),
    },
    {
      id: "child_sara02",
      fullName: "Sara Al-Mahmoud",
      alias: "Sara",
      dateOfBirth: "2017-08-22",
      birthPlace: "Alep, Syrie",
      gender: "F",
      parentsNames: "Mahmoud et Layla",
      createdAt: new Date().toISOString(),
    },
    {
      id: "child_omar03",
      fullName: "Omar Ibrahim",
      alias: "Omar",
      dateOfBirth: "2016-11-05",
      birthPlace: "Homs, Syrie",
      gender: "M",
      parentsNames: "Ibrahim et Nadia",
      createdAt: new Date().toISOString(),
    },
    {
      id: "child_fatima04",
      fullName: "Fatima Zahra",
      alias: "Fatima",
      dateOfBirth: "2018-02-14",
      birthPlace: "Idlib, Syrie",
      gender: "F",
      parentsNames: "Mohammed et Aisha",
      createdAt: new Date().toISOString(),
    },
    {
      id: "child_youssef05",
      fullName: "Youssef Al-Khalil",
      alias: "Youssef",
      dateOfBirth: "2014-07-30",
      birthPlace: "Deir ez-Zor, Syrie",
      gender: "M",
      parentsNames: "Khalil et Rania",
      createdAt: new Date().toISOString(),
    },
    {
      id: "child_amina06",
      fullName: "Amina Ben Ali",
      alias: "Amina",
      dateOfBirth: "2019-01-10",
      birthPlace: "Raqqa, Syrie",
      gender: "F",
      parentsNames: "Ali et Samira",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [loadingChildren, setLoadingChildren] = useState(false);

  // États pour les attestations
  const [credential, setCredential] = useState({
    childId: "",
    type: "vaccination",
    data: "",
    file: null,
    fileName: "",
  });

  // États pour la visualisation d'un enfant
  const [viewingChild, setViewingChild] = useState(null);
  const [childCredentials, setChildCredentials] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  // États pour la vérification
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // États de chargement
  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const [isCreatingCredential, setIsCreatingCredential] = useState(false);
  const [createdChildId, setCreatedChildId] = useState(null);
  const [blockchainInfo, setBlockchainInfo] = useState(null); // Hash et infos blockchain

  // Charger la liste des enfants (mode ONG)
  const loadChildren = async () => {
    setLoadingChildren(true);
    try {
      const response = await fetch(`${BACKEND_URL}/children`);
      if (response.ok) {
        const result = await response.json();
        setChildren(result.children || []);
      }
    } catch (error) {
      console.error("Erreur chargement enfants:", error);
    } finally {
      setLoadingChildren(false);
    }
  };

  // Charger les détails d'un enfant
  const loadChildDetails = async (childId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/children/${childId}`);
      if (response.ok) {
        const result = await response.json();
        setViewingChild(result.child);
        setEditForm(result.child);
      }

      // Charger les attestations
      const credResponse = await fetch(`${BACKEND_URL}/children/${childId}/credentials`);
      if (credResponse.ok) {
        const credResult = await credResponse.json();
        setChildCredentials(credResult.credentials || []);
      }
    } catch (error) {
      showStatus(`Erreur: ${error.message}`, "error");
      console.error("Erreur chargement détails:", error);
    }
  };

  // Vérifier le code de visualisation
  const verifyViewCode = async (code) => {
    // Pour le MVP, on simule la vérification
    // Dans une vraie implémentation, le code serait vérifié côté backend
    if (code.startsWith("view_") && code.length > 10) {
      // Extraire l'ID de l'enfant du code (simulation)
      const childId = code.split("_")[1]?.substring(0, 6);
      if (childId) {
        setCurrentChildId(`child_${childId}`);
        await loadChildDetails(`child_${childId}`);
        setAccessMode(ACCESS_MODES.VIEW);
        showStatus("Code de visualisation valide", "success");
        return true;
      }
    }
    showStatus("Code de visualisation invalide", "error");
    return false;
  };

  // Vérifier si le wallet connecté correspond à l'enfant
  const canEditChild = () => {
    if (accessMode === ACCESS_MODES.NGO && walletAddress) {
      return true; // ONG peut modifier
    }
    if (accessMode === ACCESS_MODES.CHILD && walletAddress && viewingChild) {
      // Vérifier si le wallet correspond à l'enfant
      // Pour le MVP, on suppose que l'enfant a un walletAddress stocké
      return viewingChild.walletAddress === walletAddress;
    }
    return false;
  };

  // Créer un enfant
  const createChild = async () => {
    if (!child.alias && !child.fullName) {
      showStatus("Au moins un identifiant est requis (alias ou nom complet)", "error");
      return;
    }

    if (!walletAddress) {
      showStatus("Veuillez connecter le wallet ONG pour créer un enfant", "error");
      return;
    }

    setIsCreatingChild(true);
    try {
      // Étape 1 : Créer l'enfant et obtenir le hash + transaction template
      const response = await fetch(`${BACKEND_URL}/children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...child,
          ngoWalletAddress: walletAddress, // Adresse du wallet ONG
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      const result = await response.json();
      setCreatedChildId(result.child.id);
      
      // Stocker les informations blockchain
      if (result.dataHash) {
        setBlockchainInfo({
          dataHash: result.dataHash,
          transactionHash: null, // Sera rempli après la transaction
        });
      }
      
      // Afficher un message avec la seed du wallet (clé privée)
      if (result.walletSeed) {
        showStatus(
          `Enfant créé ! Wallet XRPL généré. Hash calculé. Signature en cours...`,
          "info"
        );
        
        // Afficher un modal ou alerte avec la seed
        const seedMessage = `⚠️ IMPORTANT - Sauvegardez cette clé privée (seed) de manière sécurisée :\n\n${result.walletSeed}\n\nCette information ne sera plus affichée.`;
        alert(seedMessage);
        
        // Optionnel : copier dans le presse-papier
        navigator.clipboard.writeText(result.walletSeed).then(() => {
          showStatus("Clé privée copiée dans le presse-papier", "info");
        });
      }

      // Étape 2 : Signer et envoyer la transaction XRPL
      if (result.transactionTemplate && ngoSignAndSubmit) {
        try {
          showStatus("Signature et envoi de la transaction XRPL...", "info");
          
          // Signer et soumettre la transaction avec le wallet ONG
          const txResult = await ngoSignAndSubmit(result.transactionTemplate);
          
          // Mettre à jour le backend avec le hash de la transaction
          showStatus("Mise à jour des informations blockchain...", "info");
          
          const updateResponse = await fetch(`${BACKEND_URL}/children/${result.child.id}/blockchain`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              transactionHash: txResult.hash || txResult.id,
              transactionId: txResult.id,
              network: 'testnet',
            }),
          });

          if (updateResponse.ok) {
            const updateResult = await updateResponse.json();
            setBlockchainInfo({
              dataHash: result.dataHash,
              transactionHash: txResult.hash || txResult.id,
            });
            showStatus(
              `✅ Enfant créé et enregistré sur la blockchain XRPL !`,
              "success"
            );
          } else {
            setBlockchainInfo({
              dataHash: result.dataHash,
              transactionHash: txResult.hash || txResult.id,
            });
            showStatus(
              `✅ Transaction envoyée sur XRPL (${txResult.hash}) mais mise à jour échouée`,
              "warning"
            );
          }
        } catch (txError) {
          console.error("Erreur transaction blockchain:", txError);
          showStatus(
            `⚠️ Enfant créé mais transaction blockchain échouée: ${txError.message}. Vous pouvez réessayer plus tard.`,
            "warning"
          );
        }
      } else {
        showStatus(`Enfant créé avec succès ! ID: ${result.child.id}`, "success");
      }
      
      // Réinitialiser et recharger la liste
      setChild({
        fullName: "",
        alias: "",
        dateOfBirth: "",
        birthPlace: "",
        gender: "",
        parentsNames: "",
      });
      setBlockchainInfo(null);
      await loadChildren();
    } catch (error) {
      showStatus(`Erreur: ${error.message}`, "error");
      console.error("Erreur création enfant:", error);
    } finally {
      setIsCreatingChild(false);
    }
  };

  // Mettre à jour un enfant
  const updateChild = async () => {
    if (!viewingChild) return;

    try {
      const response = await fetch(`${BACKEND_URL}/children/${viewingChild.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }

      const result = await response.json();
      setViewingChild(result.child);
      setIsEditing(false);
      showStatus("Informations mises à jour avec succès", "success");
    } catch (error) {
      showStatus(`Erreur: ${error.message}`, "error");
      console.error("Erreur mise à jour:", error);
    }
  };

  // Gérer le téléversement de fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showStatus("Le fichier est trop volumineux (max 10MB)", "error");
        return;
      }
      setCredential({
        ...credential,
        file: file,
        fileName: file.name,
      });
    }
  };

  // Convertir le fichier en base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Créer une attestation
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
      // Convertir le fichier en base64 si présent
      let fileBase64 = null;
      let fileType = null;
      if (credential.file) {
        fileBase64 = await fileToBase64(credential.file);
        fileType = credential.file.type;
      }

      const response = await fetch(`${BACKEND_URL}/children/${credential.childId}/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: credential.type,
          data: credential.data,
          signerAddress: walletAddress,
          file: fileBase64,
          fileName: credential.fileName,
          fileType: fileType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      const result = await response.json();
      showStatus(`Attestation créée avec succès ! ID: ${result.credential.id}`, "success");
      
      // Réinitialiser et recharger
      setCredential({
        childId: "",
        type: "vaccination",
        data: "",
        file: null,
        fileName: "",
      });
      // Réinitialiser l'input file
      const fileInput = document.getElementById("credential-file");
      if (fileInput) fileInput.value = "";
      
      if (viewingChild) {
        await loadChildDetails(viewingChild.id);
      }
    } catch (error) {
      showStatus(`Erreur: ${error.message}`, "error");
      console.error("Erreur création attestation:", error);
    } finally {
      setIsCreatingCredential(false);
    }
  };


  // Charger les enfants au démarrage (mode ONG)
  useEffect(() => {
    if (accessMode === ACCESS_MODES.NGO) {
      loadChildren();
    }
  }, [accessMode]);

  // Charger les détails si on passe en mode enfant
  useEffect(() => {
    if (accessMode === ACCESS_MODES.CHILD && currentChildId) {
      loadChildDetails(currentChildId);
    }
  }, [accessMode, currentChildId]);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header avec sélecteur de mode */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Portail XRPLRoot</h1>
              <p className="text-gray-600">
                {accessMode === ACCESS_MODES.NGO && "Visualisation et gestion des dossiers enfants"}
                {accessMode === ACCESS_MODES.CHILD && "Modification de votre dossier personnel"}
                {accessMode === ACCESS_MODES.VIEW && "Visualisation du dossier - Lecture seule"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {walletAddress ? (
                <div className="text-sm text-green-600">
                  ✅ Wallet ONG connecté: {walletAddress.substring(0, 10)}...
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  ⚠️ Connexion du wallet ONG en cours...
                </div>
              )}
            </div>
          </header>

          {/* Sélecteur de mode d'accès */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Mode d'accès</h2>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setAccessMode(ACCESS_MODES.CHILD);
                  if (walletAddress) {
                    // Chercher l'enfant correspondant au wallet
                    const child = children.find(c => c.walletAddress === walletAddress);
                    if (child) {
                      setCurrentChildId(child.id);
                    }
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium ${
                  accessMode === ACCESS_MODES.CHILD
                    ? "bg-accent text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Modification
              </button>
              <button
                onClick={() => {
                  setAccessMode(ACCESS_MODES.NGO);
                  setViewingChild(null);
                  setCurrentChildId(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium ${
                  accessMode === ACCESS_MODES.NGO
                    ? "bg-accent text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Visualisation
              </button>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Code de visualisation"
                  value={viewCode}
                  onChange={(e) => setViewCode(e.target.value)}
                  className="input flex-1"
                />
                <button
                  onClick={() => verifyViewCode(viewCode)}
                  className="btn-primary"
                >
                  Accéder
                </button>
              </div>
            </div>
          </div>

          {/* Mode ONG : Création et gestion */}
          {accessMode === ACCESS_MODES.NGO && (
            <>
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
                <div className="p-4 bg-green-50 rounded-lg text-sm text-green-700 space-y-3">
                  <div>
                    ✅ <strong>Enfant créé ! Wallet XRPL généré</strong>
                  </div>
                  <div>
                    <strong>Adresse XRPL (ID):</strong>
                    <div className="mt-1">
                      <code className="font-mono text-xs bg-white p-2 rounded block break-all">{createdChildId}</code>
                    </div>
                  </div>
                  {blockchainInfo && (
                    <div className="space-y-2">
                      <div>
                        <strong>Hash des données (SHA-256):</strong>
                        <div className="mt-1">
                          <code className="font-mono text-xs bg-white p-2 rounded block break-all">
                            {blockchainInfo.dataHash}
                          </code>
                        </div>
                      </div>
                      {blockchainInfo.transactionHash && (
                        <div>
                          <strong>Transaction XRPL:</strong>
                          <div className="mt-1">
                            <code className="font-mono text-xs bg-white p-2 rounded block break-all">
                              {blockchainInfo.transactionHash}
                            </code>
                          </div>
                          <p className="text-xs mt-1 text-green-600">
                            ✅ Hash enregistré sur la blockchain XRPL
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-yellow-700 bg-yellow-50 p-3 rounded border border-yellow-200">
                    <strong>⚠️ IMPORTANT - Instructions pour utiliser le wallet :</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>La clé privée (seed) a été affichée dans une alerte et copiée dans le presse-papier</li>
                      <li><strong>Sauvegardez-la de manière sécurisée</strong> - elle ne sera plus affichée</li>
                      <li>Pour utiliser le wallet :</li>
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>Ouvrez l'extension <strong>GemWallet</strong> dans votre navigateur</li>
                        <li>Cliquez sur "Import Wallet" ou "Restore Wallet"</li>
                        <li>Collez la seed récupérée</li>
                        <li>Le wallet sera importé avec l'adresse ci-dessus</li>
                      </ul>
                      <li>Une fois importé, l'enfant peut se connecter sur ce portail avec GemWallet</li>
                    </ol>
                  </div>
                </div>
              )}
                </div>
              </div>

              {/* Liste des enfants suivis */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">2. Enfants suivis</h2>
                {loadingChildren ? (
                  <p className="text-gray-500">Chargement...</p>
                ) : children.length === 0 ? (
                  <p className="text-gray-500">Aucun enfant enregistré.</p>
                ) : (
                  <div className="space-y-3">
                    {children.map((c) => (
                      <div key={c.id} className="flex items-center justify-between border p-4 rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <p className="font-medium text-lg">{c.alias || c.fullName || "Sans nom"}</p>
                          <div className="text-sm text-gray-600 mt-1">
                            <span>ID: <code className="font-mono">{c.id}</code></span>
                            {c.fullName && <span className="ml-4">Nom: {c.fullName}</span>}
                            {c.dateOfBirth && <span className="ml-4">Né(e): {c.dateOfBirth}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => verifyChild(c.id)}
                            disabled={isVerifying}
                            className="btn-secondary text-sm disabled:bg-gray-400"
                            title="Vérifier le hash et la transaction XRPL"
                          >
                            {isVerifying ? "Vérification..." : "🔍 Vérifier"}
                          </button>
                          <button
                            onClick={() => {
                              setViewingChild(c);
                              loadChildDetails(c.id);
                            }}
                            className="btn-primary"
                          >
                            Voir détails
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Résultats de vérification */}
              {verificationResult && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">🔍 Résultats de la vérification</h2>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${verificationResult.verification.integrity ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {verificationResult.verification.integrity ? (
                          <span className="text-2xl">✅</span>
                        ) : (
                          <span className="text-2xl">❌</span>
                        )}
                        <strong className={verificationResult.verification.integrity ? 'text-green-800' : 'text-red-800'}>
                          {verificationResult.verification.integrity 
                            ? 'Données intègres - Aucune modification détectée' 
                            : 'Attention - Données modifiées ou transaction non trouvée'}
                        </strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Hash calculé (actuel)</h3>
                        <code className="text-xs break-all block bg-white p-2 rounded">
                          {verificationResult.verification.calculatedHash}
                        </code>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Hash stocké (MongoDB)</h3>
                        {verificationResult.verification.storedHash ? (
                          <>
                            <code className="text-xs break-all block bg-white p-2 rounded">
                              {verificationResult.verification.storedHash}
                            </code>
                            <p className={`text-xs mt-2 ${verificationResult.verification.hashMatch ? 'text-green-600' : 'text-red-600'}`}>
                              {verificationResult.verification.hashMatch ? '✅ Correspond' : '❌ Ne correspond pas'}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500 text-sm">Aucun hash stocké</p>
                        )}
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Hash blockchain (XRPL)</h3>
                        {verificationResult.verification.blockchainHash ? (
                          <>
                            <code className="text-xs break-all block bg-white p-2 rounded">
                              {verificationResult.verification.blockchainHash}
                            </code>
                            <p className={`text-xs mt-2 ${verificationResult.verification.blockchainVerified ? 'text-green-600' : 'text-red-600'}`}>
                              {verificationResult.verification.blockchainVerified ? '✅ Vérifié sur XRPL' : '❌ Ne correspond pas'}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            {verificationResult.child.blockchainTxHash 
                              ? 'Transaction trouvée mais hash non récupéré' 
                              : 'Aucune transaction XRPL trouvée'}
                          </p>
                        )}
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Transaction XRPL</h3>
                        {verificationResult.transaction ? (
                          <div className="space-y-1 text-sm">
                            <p><strong>Hash:</strong> <code className="text-xs">{verificationResult.transaction.hash}</code></p>
                            <p><strong>Ledger:</strong> {verificationResult.transaction.ledger_index}</p>
                            <p><strong>Validée:</strong> {verificationResult.transaction.validated ? '✅ Oui' : '⏳ En attente'}</p>
                            <p><strong>Montant:</strong> {verificationResult.transaction.Amount} drops</p>
                            <a 
                              href={`https://testnet.xrpl.org/transactions/${verificationResult.transaction.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              Voir sur XRPL Explorer →
                            </a>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Aucune transaction trouvée</p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold mb-2">Informations de l'enfant</h3>
                      <div className="text-sm space-y-1">
                        <p><strong>ID:</strong> <code className="text-xs">{verificationResult.child.id}</code></p>
                        <p><strong>Alias:</strong> {verificationResult.child.alias || 'N/A'}</p>
                        <p><strong>Nom:</strong> {verificationResult.child.fullName || 'N/A'}</p>
                        <p><strong>Wallet activé:</strong> {verificationResult.child.isWalletActivated ? '✅ Oui' : '❌ Non'}</p>
                        {verificationResult.child.blockchainTxHash && (
                          <p><strong>Transaction:</strong> <code className="text-xs">{verificationResult.child.blockchainTxHash}</code></p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setVerificationResult(null)}
                      className="btn-secondary w-full"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}

              {/* Création attestation */}
              <div id="create-credential" className="card">
                <h2 className="text-xl font-semibold mb-4">3. Créer et signer une attestation</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID de l'enfant *
                      </label>
                      <input
                        className="input"
                        placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
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

                  {/* Champ de téléversement de fichier */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document joint (PDF, image, etc.) - Optionnel
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        id="credential-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-accent file:text-white
                          hover:file:bg-accent/90
                          cursor-pointer"
                      />
                      {credential.fileName && (
                        <div className="text-sm text-gray-600">
                          📄 {credential.fileName}
                          <button
                            onClick={() => {
                              setCredential({ ...credential, file: null, fileName: "" });
                              const fileInput = document.getElementById("credential-file");
                              if (fileInput) fileInput.value = "";
                            }}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Formats acceptés : PDF, JPG, PNG, DOC, DOCX (max 10MB)
                    </p>
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
            </>
          )}

          {/* Mode Enfant ou Visualisation : Affichage du dossier */}
          {(accessMode === ACCESS_MODES.CHILD || accessMode === ACCESS_MODES.VIEW) && viewingChild && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Dossier de {viewingChild.alias || viewingChild.fullName || "l'enfant"}
                </h2>
                {accessMode === ACCESS_MODES.VIEW && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
                    Mode lecture seule
                  </span>
                )}
                {canEditChild() && (
                  <button
                    onClick={() => {
                      if (isEditing) {
                        updateChild();
                      } else {
                        setIsEditing(true);
                        setEditForm({ ...viewingChild });
                      }
                    }}
                    className="btn-primary"
                  >
                    {isEditing ? "Enregistrer" : "Modifier"}
                  </button>
                )}
              </div>

              {isEditing && canEditChild() ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom complet
                      </label>
                      <input
                        className="input"
                        value={editForm.fullName || ""}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom d'usage
                      </label>
                      <input
                        className="input"
                        value={editForm.alias || ""}
                        onChange={(e) => setEditForm({ ...editForm, alias: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de naissance
                      </label>
                      <input
                        type="date"
                        className="input"
                        value={editForm.dateOfBirth || ""}
                        onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lieu de naissance
                      </label>
                      <input
                        className="input"
                        value={editForm.birthPlace || ""}
                        onChange={(e) => setEditForm({ ...editForm, birthPlace: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">ID</p>
                      <p className="font-mono text-sm">{viewingChild.id}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Nom complet</p>
                      <p>{viewingChild.fullName || "Non renseigné"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Nom d'usage</p>
                      <p>{viewingChild.alias || "Non renseigné"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Date de naissance</p>
                      <p>{viewingChild.dateOfBirth || "Non renseigné"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Lieu de naissance</p>
                      <p>{viewingChild.birthPlace || "Non renseigné"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Sexe / genre</p>
                      <p>{viewingChild.gender || "Non renseigné"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded col-span-2">
                      <p className="text-sm text-gray-600">Nom des parents</p>
                      <p>{viewingChild.parentsNames || "Non renseigné"}</p>
                    </div>
                  </div>

                  {/* Liste des attestations */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Attestations</h3>
                    {childCredentials.length === 0 ? (
                      <p className="text-gray-500">Aucune attestation enregistrée</p>
                    ) : (
                      <div className="space-y-2">
                        {childCredentials.map((cred) => {
                          // Fonction pour télécharger le fichier
                          const downloadFile = () => {
                            if (cred.file && cred.fileName) {
                              // Convertir base64 en blob
                              const byteCharacters = atob(cred.file.split(',')[1]);
                              const byteNumbers = new Array(byteCharacters.length);
                              for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                              }
                              const byteArray = new Uint8Array(byteNumbers);
                              const blob = new Blob([byteArray], { type: cred.fileType || 'application/octet-stream' });
                              
                              // Créer un lien de téléchargement
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = cred.fileName;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                            }
                          };

                          return (
                            <div key={cred.id} className="p-3 border rounded">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">{cred.type}</p>
                                  <p className="text-sm text-gray-600 mt-1">{cred.data}</p>
                                  {cred.fileName && (
                                    <div className="mt-2">
                                      <button
                                        onClick={downloadFile}
                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                      >
                                        📄 Télécharger {cred.fileName}
                                      </button>
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Signé par: {cred.signerAddress?.substring(0, 10)}...
                                  </p>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(cred.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rappel sécurité */}
          <div className="card bg-blue-50">
            <h3 className="font-semibold mb-2">Sécurité & Blockchain</h3>
            <p className="text-sm text-gray-700">
              Les enfants conservent le contrôle de leur wallet. Les codes de visualisation ne permettent qu'un accès en lecture seule. 
              Les signatures sont vérifiées via XRPL. Aucune donnée sensible n'est stockée sur la blockchain.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
