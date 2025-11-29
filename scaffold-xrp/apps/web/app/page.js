"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger automatiquement vers le portail ONG
    router.replace("/ngo-portal");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirection vers le portail ONG...</p>
      </div>
    </div>
  );
}
