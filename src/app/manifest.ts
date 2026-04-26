import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gauntlet Golf",
    short_name: "Gauntlet",
    description:
      "Track your Gauntlet golf game. Beat your target, advance, score a point.",
    start_url: "/gauntlet",
    display: "standalone",
    background_color: "#1e1e1e",
    theme_color: "#1e1e1e",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/gauntlet.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/gauntlet-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
