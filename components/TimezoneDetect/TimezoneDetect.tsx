"use client"
import React, { useEffect, useState } from "react"

export default function TimezoneDetect() {
  const [tzName, setTzName] = useState<string | null>(null)
  const [preciseOffsetMinutes, setPreciseOffsetMinutes] = useState<number | null>(null)
  const [roundedHour, setRoundedHour] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null
      setTzName(tz)
    } catch (e) {
      setTzName(null)
    }

    const minutes = -new Date().getTimezoneOffset() // minutes east of UTC (positive for UTC+)
    setPreciseOffsetMinutes(minutes)
    setRoundedHour(Math.round(minutes / 60))
  }, [])

  if (preciseOffsetMinutes === null || roundedHour === null) return null

  const absMinutes = Math.abs(preciseOffsetMinutes)
  const hh = Math.floor(absMinutes / 60)
  const mm = absMinutes % 60
  const sign = preciseOffsetMinutes >= 0 ? "+" : "-"
  const preciseLabel = `UTC${sign}${hh}${mm ? `:${mm.toString().padStart(2, "0")}` : ""}`

  const roundedLabel = roundedHour! >= 0 ? `UTC+${roundedHour}` : `UTC${roundedHour}`

  const command = `/cofl settimezone ${roundedHour}`

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      // ignore
    }
  }

  // Try to get a short timezone name like CEST, CET, IST if available
  let shortName: string | null = null
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(new Date())
    const tzPart = parts.find(p => p.type === "timeZoneName")
    if (tzPart && tzPart.value) {
      shortName = tzPart.value
    }
  } catch (e) {
    shortName = null
  }

  const didRound = mm !== 0

  return (
    <div className="timezone-detect" style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <strong>Detected timezone:</strong>{' '}
          <span>{preciseLabel}{shortName ? ` (${shortName})` : tzName ? ` (${tzName})` : ''}</span>
        </div>

        <div>
          <strong>Copy command:</strong>{' '}
          <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>{command}</code>
        </div>

        <div>
          <button onClick={copyCommand} style={{ padding: '6px 10px', borderRadius: 6 }} aria-label="Copy settimezone command">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {didRound ? (
        <div style={{ marginTop: 6, color: '#6b7280' }}>
          Note: your timezone includes minutes; we round to the nearest hour for the command shown above.
        </div>
      ) : null}
    </div>
  )
}
