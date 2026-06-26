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

// ── BODY (white fill + outline). Rows 7-12 reserved for face.
const BODY = [
  '.....OO....OO.....',
  '....OBBO..OBBO....',
  '....OBBO..OBBO....',
  '...OBBBBOOBBBBO...',
  '..OBBBBBBBBBBBBO..',
  '.OBBBBBBBBBBBBBBO.',
  'OBBBBBBBBBBBBBBBBO',
  'OBBBBBBBBBBBBBBBBO',     // face row 1 (eye row)
  'OBBBBBBBBBBBBBBBBO',     // face row 2
  'OBBBBBBBBBBBBBBBBO',     // face row 3 (cheek row)
  'OBBBBBBBBBBBBBBBBO',     // face row 4 (mouth row)
  'OBBBBBBBBBBBBBBBBO',     // face row 5
  'OBBBBBBBBBBBBBBBBO',
  '.OBBBBBBBBBBBBBBO.',
  '..OBBBBBBBBBBBBO..',
  '...OBBBBBBBBBBO...',
  '....OOBBBBBBOO....',
  '.....OOOOOOOO.....',
]

// ── FACE OVERLAYS (18 wide × 6 tall, stamped at row 7) ──
// Chars: 'X' = ink, 'P' = pink blush, 'H' = red heart,
//        'S' = sparkle, 'Z' = z-particle, '.' = no change
const FACES: Record<FaceKey, string[]> = {
  default: [
    '..................',       // row 7
    '.....X......X.....',       // row 8 — tiny dot eyes
    '..................',       // row 9
    '....PP......PP....',       // row 10 — pink blush
    '........XX........',       // row 11 — tiny ω mouth
    '..................',       // row 12
  ],
  happy: [
    '..................',
    '.....X......X.....',
    '..................',
    '....PP......PP....',
    '.......XXXX.......',       // wider smile
    '........XX........',
  ],
  sparkle: [
    'S................S',       // sparkles at corners
    '....XX......XX....',       // bigger eyes
    '....XX......XX....',
    '...PPPP....PPPP...',       // big blush
    '......XXXXXX......',       // huge smile
    '......XXXXXX......',
  ],
  blink: [
    '..................',
    '....XXX....XXX....',       // closed eye lines
    '..................',
    '....PP......PP....',
    '........XX........',
    '..................',
  ],
  look_left: [
    '..................',
    '....X......X......',       // eyes shifted left
    '..................',
    '....PP......PP....',
    '........XX........',
    '..................',
  ],
  look_right: [
    '..................',
    '......X......X....',       // eyes shifted right
    '..................',
    '....PP......PP....',
    '........XX........',
    '..................',
  ],
  sad: [
    '....X......X......',       // angled brow tops
    '.....X......X.....',
    '.....X......X.....',       // droopy eyes
    '....PP......PP....',
    '.......XXXX.......',       // frown (inverted)
    '......X....X......',
  ],
  miserable: [
    '....X......X......',
    '.....X......X.....',
    '....TX......XT....',       // tears (T)
    '....TT......TT....',
    '.......X..X.......',       // wobbly frown
    '........XX........',
  ],

  // actions ─────────────────────────────────────────────
  eating: [
    '..................',
    '..X.X......X.X....',       // ^_^ closed happy
    '...X........X.....',
    '....PP......PP....',
    '........OO........',       // open O mouth (lower lip)
    '.......XOOX.......',
  ],
  partying: [
    'S......S.S......S.',       // star sparkles around
    '....SS......SS....',       // star eyes
    '....SS......SS....',
    '...PPPP....PPPP...',
    '......XXXXXX......',       // big grin
    '......XXXXXX......',
  ],
  bathing: [
    '..O.....O........O',       // bubbles
    '..X.X......X.X....',       // ^_^ eyes
    '...X........X.....',
    '....PP......PP....',
    '........XX........',
    '..................',
  ],
  sleeping: [
    '.............ZZ...',       // floating Z
    '............ZZZZ..',
    '..XXXX......XXXX..',       // closed flat eyes
    '....PP......PP....',
    '........OO........',       // small snore
    '..................',
  ],
  lovestruck: [
    '....H.H....H.H....',       // heart eye tops
    '...HHHHH..HHHHH...',       // heart bodies
    '....HHH....HHH....',       // heart points
    '...PPPP....PPPP...',       // big blush
    '......XXXXXX......',       // smile
    '.......XXXX.......',
  ],
  delighted: [
    'S................S',
    '....XX......XX....',       // sparkle eyes
    '....XX......XX....',
    '...PPPP....PPPP...',       // big blush
    '........OO........',       // open mouth
    '.......XOOX.......',
  ],
}

function compose(face: string[], inkColor: string) {
  const grid = BODY.map(r => r.split(''))
  for (let r = 0; r < face.length; r++) {
    const targetRow = r + 7
    for (let c = 0; c < face[r].length; c++) {
      const ch = face[r][c]
      if (ch === '.' || ch === ' ') continue
      if (targetRow >= grid.length || c >= grid[targetRow].length) continue
      grid[targetRow][c] = ch
    }
  }
  return grid
}

// egg sprite (special)
const EGG = [
  '......OOOOOO......','....OOBBBBBBOO....','...OBBBBBBBBBBO...',
  '..OBBBBBBBBBBBBO..','..OBBBBXXBBBBBBO..','.OBBBXXBBXXBBBBBO.',
  '.OBBBBXXBBBBBBBBO.','.OBBBBBBBBBBBBBBO.','OBBBBBBBBBBBBBBBBO',
  'OBBBBBBBBBBBBBBBBO','OBBBBBBBBBBBBBBBBO','OBBBBBBBBBBBBBBBBO',
  '.OBBBBBBBBBBBBBBO.','.OBBBBBBBBBBBBBBO.','..OBBBBBBBBBBBBO..',
  '...OOBBBBBBBBOO...','.....OOOOOOOO.....','..................',
]

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

    const composed = pet.stage === 'egg' ? null : compose(FACES[faceKey], inkColor)

    const PIXEL = 10           // ← bigger pet (was 7)
    const cols = 18
    const rows = 18
    const width = cols * PIXEL
    const height = rows * PIXEL

    let animClass = ''
    if (activeAction === 'feed' || activeAction === 'treat') animClass = 'tama-chomp'
    else if (activeAction === 'play')  animClass = 'tama-jump'
    else if (activeAction === 'clean') animClass = 'tama-wiggle'
    else if (activeAction === 'hug')   animClass = 'tama-squish'
    else if (activeAction === 'sleep') animClass = 'tama-sleep'

    // colour mapping for face characters
    const colorOf = (ch: string): string | null => {
      switch (ch) {
        case 'B': return '#FFFFFF'
        case 'O': return inkColor
        case 'X': return inkColor
        case 'P': return '#FFA5C0'
        case 'H': return '#E85a7a'
        case 'S': return '#F5C656'
        case 'Z': return inkColor
        case 'T': return '#7DB8E0'    // tear
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
            {pet.stage === 'egg'
              ? EGG.map((row, y) =>
                  row.split('').map((ch, x) => {
                    if (ch === '.') return null
                    const color = ch === 'B' ? '#FFFFFF'
                                : ch === 'O' ? inkColor
                                : ch === 'X' ? '#FFA5C0' : inkColor
                    return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color}/>
                  })
                )
              : composed!.map((row, y) =>
                  row.map((ch, x) => {
                    const color = colorOf(ch)
                    if (!color) return null
                    return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color}/>
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