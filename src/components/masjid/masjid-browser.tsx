"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {masjids.length === 0
            ? "No masjids yet. An admin can add the first one."
            : "No masjids match your search."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((m) => (
            <li key={m.id}>
              <Link href={`/masjids/${m.id}`} className="block">
                <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.name}</p>
                    {m.area && (
                      <p className="truncate text-sm text-muted-foreground">
                        {m.area}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <Badge variant="secondary">
                        {m.brotherCount}{" "}
                        {m.brotherCount === 1 ? "brother" : "brothers"}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {m.aamaalCount}/6 aamaal
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
