"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, GraduationCap } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface UlamaMember {
  id: number
  name: string
  detail: string | null // time spent, e.g. "1 year", "4 months"
}

/**
 * Ulama present in the area. Shows the count; tap it to reveal each
 * alim's name and the time he has spent, with a link to his full page.
 */
export function UlamaCard({ ulama }: { ulama: UlamaMember[] }) {
  const [open, setOpen] = useState(false)
  const has = ulama.length > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4 text-primary" /> Ulama
        </CardTitle>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          onClick={() => has && setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 text-left"
        >
          <span className="text-3xl font-semibold leading-none">
            {ulama.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {!has
              ? "None recorded yet"
              : open
                ? "Tap to hide names"
                : "Tap to see names"}
          </span>
        </button>

        {open && has && (
          <ul className="mt-3 space-y-1">
            {ulama.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/brothers/${u.id}`}
                  className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {u.name}
                    {u.detail && (
                      <span className="text-muted-foreground">· {u.detail}</span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
