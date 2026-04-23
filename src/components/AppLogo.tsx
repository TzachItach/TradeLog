import { useStore } from '../store';

interface AppLogoProps {
  /** Force white logo regardless of theme (for black sidebar) */
  forceLight?: boolean;
  /** Size variant — 'md' = 48px desktop/32px mobile, 'lg' = 160px (sidebar) */
  size?: 'md' | 'lg';
  onClick?: () => void;
}

export default function AppLogo({ forceLight = false, size = 'md', onClick }: AppLogoProps) {
  const { darkMode } = useStore();

  // When forced (black sidebar) always use the white-on-black logo.
  // Otherwise follow the store theme.
  const isDark = forceLight || darkMode;

  // Pixel size for the explicit width/height attributes (prevents CLS)
  const px = size === 'lg' ? 160 : 48;

  return (
    <picture onClick={onClick} style={{ display: 'contents' }}>
      {/*
        <source> with prefers-color-scheme lets the browser pick the right
        asset even before JS runs (SSR / slow hydration / no-JS fallback).
        The JS-driven src on <img> wins once the store is available.
      */}
      {!forceLight && (
        <>
          <source srcSet="/logo.png" media="(prefers-color-scheme: dark)" />
          <source srcSet="/logo-light.png" media="(prefers-color-scheme: light)" />
        </>
      )}
      <img
        src={isDark ? '/logo.png' : '/logo-light.png'}
        alt="TradeLog"
        width={px}
        height={px}
        className={`app-logo app-logo--${size}`}
        draggable={false}
      />
    </picture>
  );
}
