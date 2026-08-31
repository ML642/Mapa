import { useEffect, useState } from 'react'

type LoadingSpinnerProps = {
  size?: number
  className?: string
}

export default function LoadingSpinner({ size = 48, className = '' }: LoadingSpinnerProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev + 1) % 100)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  const rotation = (progress / 100) * 360
  const dashOffset = 260 - (progress / 100) * 180

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgba(255,126,85,0.15)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#FF7E55"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="260"
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 30ms linear' }}
        />
      </svg>
    </div>
  )
}
