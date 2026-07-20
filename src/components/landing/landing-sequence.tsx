'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'

/*
  The landing page's orchestrated entrance — the one place in the app
  where motion is allowed to be ceremonial. The Arabic appears word by
  word at a gentle recitation-like pace (right to left, each word
  softly un-blurring into place), the translation follows once the
  ayah completes, and the button arrives last.

  Words are split on spaces, which is safe for Arabic shaping: letters
  only join within a word, never across a space.
*/

const EASE = [0.25, 0.4, 0.25, 1] as const

const AYAHS = [
  {
    arabic:
      'كُنْتُمْ خَيْرَ أُمَّةٍ أُخْرِجَتْ لِلنَّاسِ تَأْمُرُونَ بِالْمَعْرُوفِ وَتَنْهَوْنَ عَنِ الْمُنْكَرِ وَتُؤْمِنُونَ بِاللّٰهِ',
    translation:
      'You are the best nation ever brought up for mankind. You enjoin what is right and forbid what is wrong and believe in Allah.',
    reference: 'Aal-Imran 3:110',
  },
  {
    arabic: 'وَّذَكِّرۡ فَاِنَّ الذِّكۡرٰى تَنۡفَعُ الۡمُؤۡمِنِيۡنَ',
    translation: 'And keep reminding, because reminding benefits the believers.',
    reference: 'Adh-Dhariyat 51:55',
  },
]

const WORD_STAGGER = 0.09
const words1 = AYAHS[0].arabic.split(' ')
const words2 = AYAHS[1].arabic.split(' ')

// The whole timeline, laid out as absolute delays from page load.
const T = (() => {
  const ayah1Start = 0.7
  const ayah1End = ayah1Start + words1.length * WORD_STAGGER
  const divider = ayah1End + 0.4
  const ayah2Start = ayah1End + 0.7
  const ayah2End = ayah2Start + words2.length * WORD_STAGGER
  return {
    wordmark: 0,
    goldRule: 0.4,
    ayah1Start,
    translation1: ayah1End + 0.1,
    divider,
    ayah2Start,
    translation2: ayah2End + 0.1,
    button: ayah2End + 0.4,
  }
})()

export function LandingSequence({
  amiriClass,
  showAuthLinks,
}: {
  amiriClass: string
  showAuthLinks: boolean
}) {
  const reduced = useReducedMotion()

  return (
    <div className="flex flex-col items-center gap-10">
      <FadeIn delay={T.wordmark} reduced={reduced} className="flex flex-col items-center">
        <h1 className="text-[2rem] font-bold tracking-[-0.01em]">Rahber</h1>
        {reduced ? (
          <span aria-hidden className="mt-2 block h-[3px] w-8 rounded-full bg-gold" />
        ) : (
          <motion.span
            aria-hidden
            className="mt-2 block h-[3px] w-8 origin-center rounded-full bg-gold"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: T.goldRule, ease: EASE }}
          />
        )}
      </FadeIn>

      <Ayah
        {...AYAHS[0]}
        words={words1}
        wordsStart={T.ayah1Start}
        translationAt={T.translation1}
        amiriClass={amiriClass}
        reduced={reduced}
      />

      <Divider delay={T.divider} reduced={reduced} />

      <Ayah
        {...AYAHS[1]}
        words={words2}
        wordsStart={T.ayah2Start}
        translationAt={T.translation2}
        amiriClass={amiriClass}
        reduced={reduced}
      />

      <FadeIn
        delay={T.button}
        reduced={reduced}
        className="flex w-full flex-col items-center gap-3 pt-2"
      >
        <Button asChild className="w-full max-w-xs">
          <Link href="/masjids">Bismillah, let&apos;s get started</Link>
        </Button>
        {showAuthLinks && (
          <p className="text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{' '}
            or{' '}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              create an account
            </Link>
          </p>
        )}
      </FadeIn>
    </div>
  )
}

function Ayah({
  arabic,
  words,
  translation,
  reference,
  wordsStart,
  translationAt,
  amiriClass,
  reduced,
}: {
  arabic: string
  words: string[]
  translation: string
  reference: string
  wordsStart: number
  translationAt: number
  amiriClass: string
  reduced: boolean | null
}) {
  return (
    <figure className="space-y-3">
      <p
        dir="rtl"
        lang="ar"
        className={`${amiriClass} text-2xl leading-[2.2] text-foreground`}
      >
        {reduced
          ? arabic
          : words.map((word, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.6,
                  delay: wordsStart + i * WORD_STAGGER,
                  ease: EASE,
                }}
              >
                {word}
                {i < words.length - 1 && ' '}
              </motion.span>
            ))}
      </p>
      <FadeIn delay={translationAt} reduced={reduced}>
        <figcaption className="space-y-1">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {translation}
          </p>
          <p className="text-xs font-medium text-primary">{reference}</p>
        </figcaption>
      </FadeIn>
    </figure>
  )
}

function Divider({ delay, reduced }: { delay: number; reduced: boolean | null }) {
  if (reduced) {
    return (
      <div aria-hidden className="flex w-full items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-gold">◆</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    )
  }
  return (
    <div aria-hidden className="flex w-full items-center gap-3">
      <motion.span
        className="h-px flex-1 origin-right bg-border"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, delay: delay + 0.15, ease: EASE }}
      />
      <motion.span
        className="text-xs text-gold"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay, ease: EASE }}
      >
        ◆
      </motion.span>
      <motion.span
        className="h-px flex-1 origin-left bg-border"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, delay: delay + 0.15, ease: EASE }}
      />
    </div>
  )
}

function FadeIn({
  delay,
  reduced,
  className,
  children,
}: {
  delay: number
  reduced: boolean | null
  className?: string
  children: React.ReactNode
}) {
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
