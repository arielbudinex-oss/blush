import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Blush",
    short_name: "Blush",
    description: "Kenalan yang nggak bikin capek — swipe, match, chat.",
    start_url: "/app/discover",
    display: "standalone",
    background_color: "#f7f2ee",
    theme_color: "#f7f2ee",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
