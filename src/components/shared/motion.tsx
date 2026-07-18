'use client'

import { motion, useReducedMotion, type Variants } from 'motion/react'

/*
  The app's entire motion vocabulary lives here — two patterns, reused
  everywhere rather than redefined per component:

  - <Reveal>      one element fades in and settles upward when it
                  scrolls into view (or on mount, for step changes)
  - <StaggerList> a list whose children cascade in one after another

  Both render plain, unanimated elements when the user prefers
  reduced motion.
*/

export const fadeRiseVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] },
  },
}

const staggerContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      variants={fadeRiseVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerList({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'ul'
}) {
  const reduced = useReducedMotion()
  if (reduced) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  const Tag = as === 'ul' ? motion.ul : motion.div
  return (
    <Tag
      className={className}
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
      {children}
    </Tag>
  )
}

/** A single item inside a <StaggerList>. */
export function StaggerItem({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'li'
}) {
  const reduced = useReducedMotion()
  if (reduced) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  const Tag = as === 'li' ? motion.li : motion.div
  return (
    <Tag className={className} variants={fadeRiseVariants}>
      {children}
    </Tag>
  )
}
