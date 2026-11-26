import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Envoi du logo des reçus (1 Mo maximum, vérifié aussi par le serveur et le stockage)
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
};

export default nextConfig;
