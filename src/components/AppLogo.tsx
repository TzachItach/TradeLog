import { useStore } from '../store';

interface AppLogoProps {
  /** Force white logo regardless of theme (for black sidebar) */
  forceLight?: boolean;
  /** Size variant — 'md' = 48px desktop/44px mobile, 'lg' = 160px (sidebar) */
  size?: 'md' | 'lg';
  onClick?: () => void;
}

export default function AppLogo({ forceLight = false, size = 'md', onClick }: AppLogoProps) {
  const { darkMode } = useStore();
  const isDark = forceLight || darkMode;
  const px = size === 'lg' ? 160 : 48;

  return (
    <img
      src={isDark ? '/logo.png?v=2' : '/logo-light.png?v=2'}
      alt="TraderYo"
      width={px}
      height={px}
      className={`app-logo app-logo--${size}`}
      onClick={onClick}
      draggable={false}
    />
  );
}
