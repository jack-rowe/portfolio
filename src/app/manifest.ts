import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Golf Scoreboard",
    short_name: "Golf Scoreboard",
    description: "Track your golf games.",
    start_url: "/golf",
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
