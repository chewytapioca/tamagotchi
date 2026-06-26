'use client'

import { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import type { Pet, PetMood, PetAction } from '@/types/pet'

interface Props {
  pet: Pet
  mood: PetMood
  onPet?: () => void
  inkColor?: string
}
export interface PetDisplayHandle { playAction: (action: PetAction) => void }

type FaceKey =
  | 'default' | 'happy' | 'sparkle' | 'sad' | 'miserable'
  | 'eating' | 'partying' | 'bathing' | 'sleeping'
  | 'lovestruck' | 'delighted'
  | 'blink' | 'look_left' | 'look_right'

function pickFace(mood: PetMood['label'], action: PetAction | null): FaceKey {
  if (action === 'feed')  return 'eating'
  if (action === 'treat') return 'delighted'
  if (action === 'play')  return 'partying'
  if (action === 'clean') return 'bathing'
  if (action === 'hug')   return 'lovestruck'
  if (action === 'sleep') return 'sleeping'
  if (mood === 'ecstatic')  return 'sparkle'
  if (mood === 'happy')     return 'happy'
  if (mood === 'content')   return 'default'
  if (mood === 'sad')       return 'sad'
  return 'miserable'
}

// ── Grid size (higher-res = smaller pixels) ──
const W = 28
const H = 28

// ── BODY: hooded bunny. Long ears, big rounded hood/head, small body, two feet.
//   B = body fill,  O = outline,  I = inner-ear blush
const BODY: string[] = [
  '..........OO..OO............',  // 0  ear tips
  '.........OBBO..OBBO.........',  // 1
  '.........OBBO..OBBO.........',  // 2
  '.........OBIO..OIBO.........',  // 3  inner-ear pink
  '.........OBIO..OIBO.........',  // 4
  '.........OBBO..OBBO.........',  // 5
  '.........OBBO..OBBO.........',  // 6
  '......OBBBBBBBBBBBBBBO......',  // 7  hood begins
  '.....OBBBBBBBBBBBBBBBBO.....',  // 8
  '....OBBBBBBBBBBBBBBBBBBO....',  // 9
  '....OBBBBBBBBBBBBBBBBBBO....',  // 10
  '...OBBBBBBBBBBBBBBBBBBBBO...',  // 11
  '...OBBBBBBBBBBBBBBBBBBBBO...',  // 12  (face: eyes)
  '...OBBBBBBBBBBBBBBBBBBBBO...',  // 13  (face: eyes)
  '...OBBBBBBBBBBBBBBBBBBBBO...',  // 14  (face: eyes)
  '...OBBBBBBBBBBBBBBBBBBBBO...',  // 15  (face: eyes / cheeks)
  '...OBBBBBBBBBBBBBBBBBBBBO...',  // 16  (face: mouth)
  '....OBBBBBBBBBBBBBBBBBBO....',  // 17
  '....OBBBBBBBBBBBBBBBBBBO....',  // 18
  '.....OBBBBBBBBBBBBBBBBO.....',  // 19
  '......OBBBBBBBBBBBBBBO......',  // 20
  '.......OBBBBBBBBBBBBO.......',  // 21  head bottom
  '........OBBBBBBBBBBO........',  // 22  body
  '........OBBBBBBBBBBO........',  // 23
  '........OBBBBBBBBBBO........',  // 24
  '........OBBBBBBBBBBO........',  // 25
  '........OBBBO..OBBBO........',  // 26  feet
  '........OOOOO..OOOOO........',  // 27  feet base
]

// egg sprite (special) — smooth rounded egg with a couple of pattern dots
const EGG: string[] = [
  '............................',  // 0
  '............................',  // 1
  '..........OBBBBBBO..........',  // 2
  '........OBBBBBBBBBBO........',  // 3
  '.......OBBBBBBBBBBBBO.......',  // 4
  '......OBBBBBBBBBBBBBBO......',  // 5
  '.....OBBBBBBBBBBBBBBBBO.....',  // 6
  '.....OBBBBBBBBBBBBBBBBO.....',  // 7
  '....OBBBBBBBBBBBBBBBBBBO....',  // 8
  '....OBBBBXXBBBBBBBBBBBBO....',  // 9
  '....OBBBXXBBBBBBBBXXBBBO....',  // 10
  '....OBBBBBBBBBBBBBXXBBBO....',  // 11
  '....OBBBBBBBBBBBBBBBBBBO....',  // 12
  '....OBBBBBBBBXXBBBBBBBBO....',  // 13
  '....OBBBBBBBXXBBBBBBBBBO....',  // 14
  '....OBBBBBBBBBBBBBBBBBBO....',  // 15
  '....OBBBBBBBBBBBBBBBBBBO....',  // 16
  '....OBBBBBBBBBBBBBBBBBBO....',  // 17
  '....OBBBBBBBBBBBBBBBBBBO....',  // 18
  '....OBBBBBBBBBBBBBBBBBBO....',  // 19
  '....OBBBBBBBBBBBBBBBBBBO....',  // 20
  '.....OBBBBBBBBBBBBBBBBO.....',  // 21
  '......OBBBBBBBBBBBBBBO......',  // 22
  '.......OBBBBBBBBBBBBO.......',  // 23
  '........OBBBBBBBBBBO........',  // 24
  '..........OBBBBBBO..........',  // 25
  '............................',  // 26
  '............................',  // 27
]

// ── Face is drawn from reusable parts onto a clone of BODY ──
// Eye boxes: left cols 8-10, right cols 17-19. Mouth cols 12-15.
const L = [8, 9, 10]   // left-eye columns
const R = [17, 18, 19] // right-eye columns

type Grid = string[][]
const set = (g: Grid, x: number, y: number, ch: string) => {
  if (y >= 0 && y < g.length && x >= 0 && x < g[y].length) g[y][x] = ch
}

// open, big sparkly eyes (rows 12-15) with a white shine
function eyesOpen(g: Grid, dx = 0) {
  for (const col of [...L, ...R]) {
    for (let y = 12; y <= 15; y++) set(g, col + dx, y, 'X')
  }
  set(g, L[0] + dx, 13, 'W')  // shine, outer-top
  set(g, R[2] + dx, 13, 'W')
}
function eyesBlink(g: Grid) {
  for (const col of [...L, ...R]) set(g, col, 14, 'X')
}
function eyesHappy(g: Grid) {          // ^   ^
  set(g, L[0], 14, 'X'); set(g, L[1], 13, 'X'); set(g, L[2], 14, 'X')
  set(g, R[0], 14, 'X'); set(g, R[1], 13, 'X'); set(g, R[2], 14, 'X')
}
function eyesSleep(g: Grid) {           // ‿   ‿
  set(g, L[0], 13, 'X'); set(g, L[1], 14, 'X'); set(g, L[2], 13, 'X')
  set(g, R[0], 13, 'X'); set(g, R[1], 14, 'X'); set(g, R[2], 13, 'X')
}
function eyesSad(g: Grid) {             // droopy, lower lids
  for (const col of [...L, ...R]) {
    for (let y = 13; y <= 15; y++) set(g, col, y, 'X')
  }
  // sad brows
  set(g, L[0], 12, 'X'); set(g, R[2], 12, 'X')
}
function eyesStar(g: Grid) {            // ✦ ✦ sparkle eyes
  for (const [cx] of [[L[1]], [R[1]]] as const) {
    set(g, cx, 12, 'S'); set(g, cx - 1, 13, 'S'); set(g, cx, 13, 'S'); set(g, cx + 1, 13, 'S')
    set(g, cx, 14, 'S'); set(g, cx - 1, 15, 'S'); set(g, cx + 1, 15, 'S')
  }
}
function eyesHeart(g: Grid) {           // ♥ ♥
  for (const c of [L[0], R[0]]) {
    set(g, c, 12, 'H');     set(g, c + 2, 12, 'H')
    set(g, c, 13, 'H'); set(g, c + 1, 13, 'H'); set(g, c + 2, 13, 'H')
    set(g, c + 1, 14, 'H')
  }
}

function mouthOmega(g: Grid) {          // small ω
  set(g, 12, 16, 'X'); set(g, 15, 16, 'X')
  set(g, 13, 17, 'X'); set(g, 14, 17, 'X')
}
function mouthSmile(g: Grid) {          // wide :)
  set(g, 11, 16, 'X'); set(g, 16, 16, 'X')
  set(g, 12, 17, 'X'); set(g, 13, 17, 'X'); set(g, 14, 17, 'X'); set(g, 15, 17, 'X')
}
function mouthOpen(g: Grid) {           // happy open O
  set(g, 12, 16, 'X'); set(g, 13, 16, 'X'); set(g, 14, 16, 'X'); set(g, 15, 16, 'X')
  set(g, 12, 17, 'M'); set(g, 13, 17, 'M'); set(g, 14, 17, 'M'); set(g, 15, 17, 'M')
  set(g, 13, 18, 'X'); set(g, 14, 18, 'X')
}
function mouthFrown(g: Grid) {          // ∩
  set(g, 13, 16, 'X'); set(g, 14, 16, 'X')
  set(g, 12, 17, 'X'); set(g, 15, 17, 'X')
}

function blush(g: Grid) {
  for (const y of [15, 16]) { set(g, 5, y, 'P'); set(g, 6, y, 'P'); set(g, 21, y, 'P'); set(g, 22, y, 'P') }
}
function blushBig(g: Grid) {
  for (const y of [14, 15, 16]) {
    set(g, 4, y, 'P'); set(g, 5, y, 'P'); set(g, 6, y, 'P')
    set(g, 21, y, 'P'); set(g, 22, y, 'P'); set(g, 23, y, 'P')
  }
}
function sparkles(g: Grid) {
  set(g, 2, 8, 'S'); set(g, 25, 9, 'S'); set(g, 3, 20, 'S'); set(g, 24, 19, 'S'); set(g, 13, 6, 'S')
}
function zzz(g: Grid) {
  set(g, 22, 11, 'Z'); set(g, 23, 10, 'Z'); set(g, 24, 9, 'Z'); set(g, 25, 8, 'Z')
}
function tears(g: Grid) {
  set(g, 7, 15, 'T'); set(g, 7, 16, 'T'); set(g, 20, 15, 'T'); set(g, 20, 16, 'T')
}
function bubbles(g: Grid) {
  set(g, 2, 9, 'U'); set(g, 4, 6, 'U'); set(g, 24, 8, 'U'); set(g, 25, 12, 'U'); set(g, 3, 14, 'U')
}

const FACES: Record<FaceKey, (g: Grid) => void> = {
  default:    g => { eyesOpen(g);  blush(g);    mouthOmega(g) },
  happy:      g => { eyesOpen(g);  blush(g);    mouthSmile(g) },
  sparkle:    g => { eyesOpen(g);  blushBig(g); mouthOpen(g);  sparkles(g) },
  blink:      g => { eyesBlink(g); blush(g);    mouthOmega(g) },
  look_left:  g => { eyesOpen(g, -1); blush(g); mouthOmega(g) },
  look_right: g => { eyesOpen(g, 1);  blush(g); mouthOmega(g) },
  sad:        g => { eyesSad(g);   mouthFrown(g) },
  miserable:  g => { eyesSad(g);   mouthFrown(g); tears(g) },
  eating:     g => { eyesHappy(g); blush(g);    mouthOpen(g) },
  partying:   g => { eyesStar(g);  blushBig(g); mouthSmile(g); sparkles(g) },
  bathing:    g => { eyesHappy(g); blush(g);    mouthOmega(g); bubbles(g) },
  sleeping:   g => { eyesSleep(g); blush(g);    mouthOmega(g); zzz(g) },
  lovestruck: g => { eyesHeart(g); blushBig(g); mouthSmile(g) },
  delighted:  g => { eyesStar(g);  blushBig(g); mouthOpen(g);  sparkles(g) },
}

function compose(faceKey: FaceKey): Grid {
  const grid = BODY.map(r => r.split(''))
  FACES[faceKey](grid)
  return grid
}

const PetDisplay = forwardRef<PetDisplayHandle, Props>(
  ({ pet, mood, onPet, inkColor = '#2A1810' }, ref) => {
    const [activeAction, setActiveAction] = useState<PetAction | null>(null)
    const [bob, setBob] = useState(0)
    const [idlePose, setIdlePose] = useState<FaceKey>('default')

    useImperativeHandle(ref, () => ({
      playAction(action: PetAction) {
        setActiveAction(action)
        setTimeout(() => setActiveAction(null), 1900)
      },
    }))

    // gentle bob
    useEffect(() => {
      const id = setInterval(() => setBob(b => (b + 1) % 2), 800)
      return () => clearInterval(id)
    }, [])

    // idle pose rotation: blink, look around
    useEffect(() => {
      if (activeAction) return
      const poses: { face: FaceKey; duration: number }[] = [
        { face: 'default',    duration: 4200 + Math.random() * 1500 },
        { face: 'blink',      duration: 160 },
        { face: 'default',    duration: 2800 + Math.random() * 1200 },
        { face: 'look_left',  duration: 800 },
        { face: 'default',    duration: 3200 + Math.random() * 1500 },
        { face: 'look_right', duration: 800 },
        { face: 'default',    duration: 2500 },
        { face: 'blink',      duration: 140 },
      ]
      let i = 0
      let timeoutId: any
      const next = () => {
        const p = poses[i % poses.length]
        setIdlePose(p.face)
        timeoutId = setTimeout(() => { i++; next() }, p.duration)
      }
      next()
      return () => clearTimeout(timeoutId)
    }, [activeAction])

    const faceKey: FaceKey = activeAction
      ? pickFace(mood.label, activeAction)
      : (mood.label === 'content' ? idlePose : pickFace(mood.label, null))

    const composed = pet.stage === 'egg' ? null : compose(faceKey)

    const PIXEL = 7            // ← smaller pixels (higher-res grid)
    const cols = W
    const rows = H
    const width = cols * PIXEL
    const height = rows * PIXEL

    let animClass = ''
    if (activeAction === 'feed' || activeAction === 'treat') animClass = 'tama-chomp'
    else if (activeAction === 'play')  animClass = 'tama-jump'
    else if (activeAction === 'clean') animClass = 'tama-wiggle'
    else if (activeAction === 'hug')   animClass = 'tama-squish'
    else if (activeAction === 'sleep') animClass = 'tama-sleep'

    // colour mapping for pixel characters
    const colorOf = (ch: string): string | null => {
      switch (ch) {
        case 'B': return '#FAF7F5'   // soft off-white body
        case 'O': return inkColor    // outline (theme ink)
        case 'I': return '#FFD0DE'   // inner-ear pink
        case 'X': return inkColor    // eyes / mouth ink
        case 'W': return '#FFFFFF'   // eye shine
        case 'M': return '#E58BA6'   // open-mouth fill
        case 'P': return '#FFA5C0'   // blush
        case 'H': return '#E85A7A'   // heart
        case 'S': return '#F5C656'   // sparkle
        case 'Z': return inkColor    // zzz
        case 'T': return '#7DB8E0'   // tear
        case 'U': return '#CFE8F5'   // bubble
        default:  return null
      }
    }

    return (
      <>
        <style>{`
          @keyframes tama-chomp  { 0%,100%{transform:translateY(0) scaleY(1)} 25%,75%{transform:translateY(3px) scaleY(0.86)} }
          @keyframes tama-jump   { 0%{transform:translateY(0)} 25%{transform:translateY(-16px) rotate(-6deg)} 50%{transform:translateY(0)} 75%{transform:translateY(-16px) rotate(6deg)} 100%{transform:translateY(0)} }
          @keyframes tama-wiggle { 0%,100%{transform:translateX(0) rotate(0)} 20%{transform:translateX(-6px) rotate(-5deg)} 40%{transform:translateX(6px) rotate(5deg)} 60%{transform:translateX(-6px) rotate(-5deg)} 80%{transform:translateX(6px) rotate(5deg)} }
          @keyframes tama-squish { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18,0.84)} }
          @keyframes tama-sleep  { 0%{transform:translateY(0) scale(1)} 100%{transform:translateY(10px) scale(1.04,0.93)} }
          .tama-chomp  { animation: tama-chomp 0.4s steps(2) 4; }
          .tama-jump   { animation: tama-jump 0.7s steps(4) 2; }
          .tama-wiggle { animation: tama-wiggle 0.4s steps(2) 4; }
          .tama-squish { animation: tama-squish 0.45s steps(2) 4; }
          .tama-sleep  { animation: tama-sleep 1.5s steps(2) forwards; }
        `}</style>
        <div
          onClick={onPet}
          className={animClass}
          style={{
            cursor: onPet ? 'pointer' : 'default',
            display: 'inline-block',
            imageRendering: 'pixelated',
            transform: !animClass ? `translateY(${bob ? -3 : 0}px)` : undefined,
            transition: !animClass ? 'transform 0.4s steps(2)' : undefined,
            transformOrigin: 'center bottom',
          }}
          aria-label={`${pet.name} the ${pet.stage}, feeling ${mood.label}`}
          role="img"
        >
          <svg
            width={width} height={height}
            viewBox={`0 0 ${cols} ${rows}`}
            shapeRendering="crispEdges"
            style={{ display: 'block', imageRendering: 'pixelated', overflow: 'visible' }}
          >
            {(pet.stage === 'egg' ? EGG.map(r => r.split('')) : composed!).map((row, y) =>
              row.map((ch, x) => {
                const color = colorOf(ch)
                if (!color) return null
                return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />
              })
            )}
          </svg>
        </div>
      </>
    )
  }
)

PetDisplay.displayName = 'PetDisplay'
export default PetDisplay
