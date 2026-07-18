"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { MasjidCard } from "@/components/masjid/masjid-card"
import { StaggerList, StaggerItem } from "@/components/shared/motion"

export interface MasjidListItem {
  id: number
  name: string
  area: string | null
  brotherCount: number
  aamaalCount: number
}

/**
 * The masjid list with an instant search box. Typing filters the list
 * on the spot (no page reload). Each row links to that masjid's page.
 */
export function MasjidBrowser({ masjids }: { masjids: MasjidListItem[] }) {
  const [query, setQuery] = useState("")

  const filtered = masjids.filter((m) =>
    `${m.name} ${m.area ?? ""}`.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search masjid or area…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-card pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {masjids.length === 0
            ? "No masjids yet. An admin can add the first one."
            : "No masjids match your search."}
        </p>
      ) : (
        <StaggerList as="ul" className="space-y-2">
          {filtered.map((m) => (
            <StaggerItem as="li" key={m.id}>
              <MasjidCard masjid={m} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  )
}
