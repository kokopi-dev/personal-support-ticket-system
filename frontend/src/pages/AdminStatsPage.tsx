import { useState, useEffect } from 'react'
import { storage } from '../lib/storage.ts'
import type { Ticket, TicketType } from '../lib/types.ts'


interface SliceData {
  type: TicketType
  count: number
  pct: number      // 0–1
  color: string
  label: string
  startAngle: number
  endAngle: number
}

const TYPE_CONFIG: Record<TicketType, { label: string; color: string }> = {
  'bug': { label: 'Bug', color: '#f87171' }, // red-400
  'billing': { label: 'Billing', color: '#fb923c' }, // orange-400
  'account': { label: 'Account', color: '#facc15' }, // yellow-400
  'feature-request': { label: 'Feature Request', color: '#34d399' }, // emerald-400
  'feedback': { label: 'Feedback', color: '#60a5fa' }, // blue-400
  'other': { label: 'Other', color: '#a78bfa' }, // violet-400
}

const CX = 100
const CY = 100
const R = 80
const GAP_DEG = 1.5  // small gap between slices in degrees

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(startDeg: number, endDeg: number): string {
  // Inset the gap equally from each side
  const s = startDeg + GAP_DEG / 2
  const e = endDeg - GAP_DEG / 2

  const start = polarToCartesian(CX, CY, R, s)
  const end = polarToCartesian(CX, CY, R, e)
  const inner = { start: polarToCartesian(CX, CY, R * 0.45, s), end: polarToCartesian(CX, CY, R * 0.45, e) }
  const large = e - s > 180 ? 1 : 0

  return [
    `M ${start.x} ${start.y}`,
    `A ${R} ${R} 0 ${large} 1 ${end.x} ${end.y}`,
    `L ${inner.end.x} ${inner.end.y}`,
    `A ${R * 0.45} ${R * 0.45} 0 ${large} 0 ${inner.start.x} ${inner.start.y}`,
    'Z',
  ].join(' ')
}

function buildSlices(tickets: Ticket[]): SliceData[] {
  if (tickets.length === 0) return []

  const counts = new Map<TicketType, number>()
  for (const t of tickets) {
    counts.set(t.type, (counts.get(t.type) ?? 0) + 1)
  }

  // Sort descending by count for a cleaner visual
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])

  let angle = 0
  return sorted.map(([type, count]) => {
    const pct = count / tickets.length
    const sweep = pct * 360
    const start = angle
    const end = angle + sweep
    angle = end
    return {
      type,
      count,
      pct,
      color: TYPE_CONFIG[type].color,
      label: TYPE_CONFIG[type].label,
      startAngle: start,
      endAngle: end,
    }
  })
}


function PieChart({ slices }: { slices: SliceData[] }) {
  const [hovered, setHovered] = useState<TicketType | null>(null)

  if (slices.length === 0) return null

  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full max-w-[260px]"
      aria-label="Ticket type distribution pie chart"
    >
      {slices.map(slice => {
        const isHovered = hovered === slice.type
        // Scale up the hovered slice slightly
        const transform = isHovered
          ? `translate(${CX}px, ${CY}px) scale(1.04) translate(${-CX}px, ${-CY}px)`
          : undefined

        return (
          <path
            key={slice.type}
            d={describeArc(slice.startAngle, slice.endAngle)}
            fill={slice.color}
            opacity={hovered && !isHovered ? 0.4 : 1}
            style={{ transform, transformOrigin: 'center', transition: 'opacity 0.15s, transform 0.15s' }}
            onMouseEnter={() => setHovered(slice.type)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer"
          />
        )
      })}

      {/* Centre label — shows hovered slice detail or total */}
      {hovered ? (
        <>
          <text x={CX} y={CY - 7} textAnchor="middle" className="fill-fg-100" fontSize="13" fontWeight="600">
            {slices.find(s => s.type === hovered)?.count}
          </text>
          <text x={CX} y={CY + 8} textAnchor="middle" className="fill-fg-300" fontSize="7">
            {TYPE_CONFIG[hovered].label}
          </text>
          <text x={CX} y={CY + 19} textAnchor="middle" className="fill-fg-300" fontSize="7">
            {((slices.find(s => s.type === hovered)?.pct ?? 0) * 100).toFixed(1)}%
          </text>
        </>
      ) : (
        <>
          <text x={CX} y={CY - 5} textAnchor="middle" className="fill-fg-100" fontSize="13" fontWeight="600">
            {slices.reduce((s, d) => s + d.count, 0)}
          </text>
          <text x={CX} y={CY + 9} textAnchor="middle" className="fill-fg-300" fontSize="8">
            tickets
          </text>
        </>
      )}
    </svg>
  )
}

function Legend({ slices }: { slices: SliceData[] }) {
  return (
    <div className="flex flex-col gap-2 min-w-[160px]">
      {slices.map(slice => (
        <div key={slice.type} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-xs text-fg-200">{slice.label}</span>
          </div>
          <div className="flex items-center gap-2 text-xs tabular-nums">
            <span className="text-fg-100 font-medium">{slice.count}</span>
            <span className="text-fg-300 w-9 text-right">{(slice.pct * 100).toFixed(1)}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}


interface AdminStatsPageProps {
  isAuthenticated: boolean
}

export function AdminStatsPage({ isAuthenticated }: AdminStatsPageProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    const load = async () => {
      if (isAuthenticated) {
        // Fetch all pages until we have the full dataset
        let page = 1
        const all: Ticket[] = []
        while (true) {
          const res = await storage.getAllTickets(true, page, 100)
          all.push(...res.data)
          if (page >= res.totalPages) break
          page++
        }
        setTickets(all)
      } else {
        const local = await storage.getTickets(false)
        setTickets(local)
      }
      setLoading(false)
    }

    load()
  }, [isAuthenticated])

  const slices = buildSlices(tickets)
  const isEmpty = !loading && tickets.length === 0

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-fg-100">Stats</h1>
        <p className="mt-0.5 text-sm text-fg-300">
          {isAuthenticated ? 'Ticket breakdown across all users' : 'Breakdown of your local tickets'}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-fg-300">Loading…</p>
        </div>
      )}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border-100 bg-bg-200 py-16 text-center">
          <p className="text-sm text-fg-300">No tickets to display.</p>
        </div>
      )}

      {!loading && !isEmpty && (
        <div className="rounded-lg border border-border-100 bg-bg-200 p-6">
          <p className="mb-5 text-xs font-medium uppercase tracking-wider text-fg-300">
            Ticket type distribution
          </p>
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-12">
            <PieChart slices={slices} />
            <Legend slices={slices} />
          </div>
        </div>
      )}
    </>
  )
}
