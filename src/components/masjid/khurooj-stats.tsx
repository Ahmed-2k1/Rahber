"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface KhuroojMember {
  id: number
  name: string
}

export interface KhuroojGroup {
  key: string
  label: string
  members: KhuroojMember[]
}

/**
 * A row of stat tiles (4 months / 40 days / 3 days / Others) showing how
 * many brothers in this area have given that much time in jamaat. Tapping
 * a tile reveals the names below; tapping a name opens that brother's page.
 */
export function KhuroojStats({ groups }: { groups: KhuroojGroup[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const open = groups.find((g) => g.key === openKey) ?? null

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {groups.map((g) => {
          const active = g.key === openKey
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setOpenKey(active ? null : g.key)}
              aria-expanded={active}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                active ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              )}
            >
              <p className="text-2xl font-semibold leading-none tabular-nums">
                {g.members.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{g.label}</p>
            </button>
          )
        })}
      </div>

      {open && (
        <div className="mt-2 rounded-lg border bg-muted/30 p-2">
          <p className="px-1 py-1 text-sm font-medium">{open.label} brothers</p>
          {open.members.length === 0 ? (
            <p className="px-1 pb-1 text-sm text-muted-foreground">
              None recorded yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {open.members.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/brothers/${m.id}`}
                    className="flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {m.name}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
