const xrpl = require("xrpl");

async function testXRPLConnection() {
  const client = new xrpl.Client(process.env.XRPL_ENDPOINT);
  await client.connect();
  console.log("Connecté à XRPL testnet");

  // Optionnel : si vous avez déjà une adresse ONG, tu peux tester :
  // const response = await client.request({
  //   command: "account_info",
  //   account: process.env.XRPL_NGO_ADDRESS,
  //   ledger_index: "validated"
  // });
  // console.log("Account info ONG:", response);

  await client.disconnect();
}

// Lancer le test au démarrage
testXRPLConnection().catch(console.error);


require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

// "Base de données" en mémoire pour le MVP
const children = [];      // liste des enfants
const credentials = [];   // liste des attestations

// petite fonction utilitaire pour générer des IDs simples
function generateId(prefix) {
  return prefix + "_" + Math.random().toString(36).substring(2, 8);
}

app.use(cors());
app.use(express.json());

// Route de test
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend up" });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});


// Créer un enfant + premier enregistrement minimal (sans signature pour le moment)
app.post("/children", (req, res) => {
    const {
      fullName,           // Nom complet (si connu)
      alias,              // Nom d'usage ou surnom
      dateOfBirth,        // Date de naissance (ou estimation) - format ISO ou string
      birthPlace,         // Lieu de naissance (si connu)
      gender,             // Sexe / genre
      parentsNames        // Nom des parents si connu (peut être un string ou un objet)
    } = req.body;
  
    // Validation minimale : au moins un identifiant doit être fourni
    if (!alias && !fullName) {
      return res.status(400).json({ 
        error: "Au moins un identifiant est requis (alias ou fullName)" 
      });
    }
  
    const childId = generateId("child");
    const child = {
      id: childId,
      // Informations d'identité
      fullName: fullName || null,           // Nom complet (optionnel)
      alias: alias || null,                  // Nom d'usage ou surnom
      dateOfBirth: dateOfBirth || null,      // Date de naissance (ou estimation)
      birthPlace: birthPlace || null,        // Lieu de naissance (si connu)
      gender: gender || null,               // Sexe / genre
      parentsNames: parentsNames || null,    // Nom des parents si connu
      // Métadonnées
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  
    children.push(child);
  
    // Dans une prochaine étape : créer une "core identity credential" signée
    return res.status(201).json({ child });
  });

// Récupérer tous les enfants
app.get("/children", (req, res) => {
  return res.json({ children });
});

// Récupérer un enfant par ID
app.get("/children/:childId", (req, res) => {
  const { childId } = req.params;
  const child = children.find(c => c.id === childId);
  
  if (!child) {
    return res.status(404).json({ error: "Enfant introuvable" });
  }
  
  return res.json({ child });
});

// Mettre à jour les informations d'un enfant
app.put("/children/:childId", (req, res) => {
  const { childId } = req.params;
  const {
    fullName,
    alias,
    dateOfBirth,
    birthPlace,
    gender,
    parentsNames
  } = req.body;

  const childIndex = children.findIndex(c => c.id === childId);
  
  if (childIndex === -1) {
    return res.status(404).json({ error: "Enfant introuvable" });
  }

  // Mettre à jour uniquement les champs fournis
  const child = children[childIndex];
  if (fullName !== undefined) child.fullName = fullName;
  if (alias !== undefined) child.alias = alias;
  if (dateOfBirth !== undefined) child.dateOfBirth = dateOfBirth;
  if (birthPlace !== undefined) child.birthPlace = birthPlace;
  if (gender !== undefined) child.gender = gender;
  if (parentsNames !== undefined) child.parentsNames = parentsNames;
  
  child.updatedAt = new Date().toISOString();
  
  return res.json({ child });
});
  
  // Ajouter une attestation pour un enfant
app.post("/children/:childId/credentials", (req, res) => {
  const { childId } = req.params;
  const { type, data, signerAddress } = req.body;

  const child = children.find(c => c.id === childId);
  if (!child) {
    return res.status(404).json({ error: "Enfant introuvable" });
  }

  if (!type || !data || !signerAddress) {
    return res.status(400).json({ error: "type, data, signerAddress sont requis" });
  }

  const credId = generateId("cred");
  const credential = {
    id: credId,
    childId,
    type,
    data,
    signerAddress,
    // hash et signature viendront plus tard
    hash: null,
    signature: null,
    createdAt: new Date().toISOString(),
  };

  credentials.push(credential);

  return res.status(201).json({ credential });
});

// Récupérer toutes les attestations d'un enfant
app.get("/children/:childId/credentials", (req, res) => {
  const { childId } = req.params;
  const child = children.find(c => c.id === childId);
  
  if (!child) {
    return res.status(404).json({ error: "Enfant introuvable" });
  }
  
  const childCredentials = credentials.filter(c => c.childId === childId);
  
  return res.json({
    child,
    credentials: childCredentials,
  });
});

app.get("/credentials/:credId", (req, res) => {
  const { credId } = req.params;
  const cred = credentials.find(c => c.id === credId);

  if (!cred) {
    return res.status(404).json({ error: "Attestation introuvable" });
  }

  const child = children.find(c => c.id === cred.childId);

  return res.json({
    child,
    credential: cred,
  });
});
