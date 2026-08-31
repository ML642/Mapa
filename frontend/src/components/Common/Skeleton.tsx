import type { CSSProperties, ReactNode } from 'react'

type SkeletonProps = {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export default function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  className = '',
  style,
}: SkeletonProps) {
  return (
    <div
      className={`relative isolate overflow-hidden ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'rgba(107,40,94,0.08)',
        ...style,
      }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'skeleton-shimmer 1.8s ease-in-out infinite',
        }}
      />
    </div>
  )
}
