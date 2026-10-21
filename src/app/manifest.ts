import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Blush",
    short_name: "Blush",
    description: "Kenalan yang nggak bikin capek. Swipe, match, chat.",
    start_url: "/app/discover",
    display: "standalone",
    background_color: "#f9f6f2",
    theme_color: "#f9f6f2",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
