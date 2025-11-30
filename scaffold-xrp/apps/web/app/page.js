"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger automatiquement vers le portail ONG
    router.replace("/ngo-portal");
  }, [router]);

  // Redirection immédiate sans afficher de message
  return null;
}
