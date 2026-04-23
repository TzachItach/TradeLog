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
  const src = forceLight || darkMode ? '/logo.png' : '/logo-light.png';

  return (
    <img
      src={src}
      alt="TradeLog"
      className={`app-logo app-logo--${size}`}
      onClick={onClick}
      draggable={false}
    />
  );
}
