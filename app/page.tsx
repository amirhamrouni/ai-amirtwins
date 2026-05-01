import dynamic from "next/dynamic";
import { SearchBar } from "@/components/search-bar";

// Loaded client-side only — Leaflet accesses `window` at import time and
// will throw during SSR without this guard.
const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted rounded-lg">
      <p className="text-muted-foreground text-sm">Loading map...</p>
    </div>
  ),
});

export default function HomePage() {
  return (
    <main className="flex flex-col h-screen">
      <header className="flex items-center gap-4 px-6 py-4 border-b bg-background z-10">
        <h1 className="text-xl font-bold tracking-tight shrink-0">
          Marktplaats Plus
        </h1>
        <SearchBar />
      </header>

      <div className="flex-1 relative">
        <Map />
      </div>
    </main>
  );
}
