import { motion } from 'framer-motion';

type MarkerOffset = [number, number];

type ClusterMarkerVisualProps = {
  kind: 'cluster';
  count: number;
  isActive: boolean;
};

type EventMarkerVisualProps = {
  kind: 'event';
  icon: string;
  label: string;
  isActive: boolean;
  offset?: MarkerOffset;
  isSpiderfied?: boolean;
};

type MapMarkerVisualProps = ClusterMarkerVisualProps | EventMarkerVisualProps;

const positionSpring = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
  mass: 0.8,
} as const;

const scaleSpring = {
  type: 'spring',
  stiffness: 420,
  damping: 24,
  mass: 0.7,
} as const;

const markerPalette = {
  accent: 'var(--color-accent)',
  accentRing: 'var(--color-accent-ring)',
  surface: 'var(--color-surface-frost)',
  surfaceActive: 'var(--color-surface-frost-strong)',
  brand: 'var(--color-brand)',
  textOnAccent: 'var(--color-surface-base)',
};

export default function MapMarkerVisual(props: MapMarkerVisualProps) {
  if (props.kind === 'cluster') {
    const { count, isActive } = props;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.84, y: 10 }}
        animate={{
          opacity: 1,
          scale: isActive ? 1.06 : 1,
          y: isActive ? -2 : 0,
        }}
        transition={{
          opacity: { duration: 0.18, ease: 'easeOut' },
          scale: scaleSpring,
          y: positionSpring,
        }}
        whileHover={{ scale: isActive ? 1.1 : 1.05 }}
        whileTap={{ scale: 0.94 }}
        style={{
          minWidth: isActive ? '54px' : '46px',
          height: isActive ? '54px' : '46px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          cursor: 'pointer',
          border: `2px solid ${isActive ? markerPalette.accent : markerPalette.accentRing}`,
          boxShadow: isActive ? 'var(--shadow-marker-cluster-active)' : 'var(--shadow-marker-cluster)',
          backgroundColor: isActive ? markerPalette.surfaceActive : markerPalette.surface,
          color: markerPalette.brand,
          fontSize: isActive ? '16px' : '14px',
          fontWeight: 700,
          lineHeight: 1,
          userSelect: 'none',
          willChange: 'transform',
          backdropFilter: 'blur(8px)',
          transformOrigin: 'center center',
        }}
      >
        {count}
      </motion.div>
    );
  }

  const { icon, label, isActive, isSpiderfied = false } = props;
  const [offsetX, offsetY] = props.offset ?? [0, 0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.84, x: 0, y: 0 }}
      animate={{
        opacity: 1,
        x: offsetX,
        y: offsetY,
        scale: isActive ? 1.12 : isSpiderfied ? 1.03 : 1,
      }}
      transition={{
        opacity: { duration: 0.16, ease: 'easeOut' },
        x: positionSpring,
        y: positionSpring,
        scale: scaleSpring,
      }}
      whileHover={{ scale: isActive ? 1.16 : 1.08 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        cursor: 'pointer',
        boxShadow: isActive
          ? 'var(--shadow-marker-event-active)'
          : isSpiderfied
            ? 'var(--shadow-marker-event-spider)'
            : 'none',
        backgroundColor: isActive ? markerPalette.surfaceActive : 'transparent',
        willChange: 'transform',
        transformOrigin: 'center bottom',
        zIndex: isActive ? 3 : isSpiderfied ? 2 : 1,
      }}
    >
      <motion.img
        src={icon}
        alt={label}
        animate={{
          width: isActive ? 48 : isSpiderfied ? 42 : 40,
          height: isActive ? 48 : isSpiderfied ? 42 : 40,
          rotate: isSpiderfied ? offsetX * 0.03 : 0,
        }}
        transition={{
          width: scaleSpring,
          height: scaleSpring,
          rotate: positionSpring,
        }}
        style={{
          display: 'block',
          pointerEvents: 'none',
          filter: isSpiderfied && !isActive ? 'drop-shadow(var(--shadow-marker-drop))' : 'none',
        }}
      />
    </motion.div>
  );
}
