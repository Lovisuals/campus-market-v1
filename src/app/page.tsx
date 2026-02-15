"use client";

import { StreamFeed } from "@/components/nexus/stream-feed";

export default function Home() {
  return (
    <div className="bg-black min-h-screen">
      <StreamFeed />
    </div>
  );
}
