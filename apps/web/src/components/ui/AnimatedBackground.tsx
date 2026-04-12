/**
 * RIVALRY — Animated Live Wallpaper Background
 * Adrenaline, intense fire, sparks, and premium fighting energy.
 */

import { useAuthStore } from '../../stores/authStore';
import { getArmyTheme } from '../../lib/theme';

export default function AnimatedBackground() {
  const user = useAuthStore((s) => s.user);
  
  const defaultArmyColor = user?.army?.colorHex || '#FF2D55';
  const teamTheme = getArmyTheme(user?.army?.name, defaultArmyColor);

  return (
    <div 
      className="fixed inset-0 z-0"
      style={{ background: teamTheme.bgGradient }}
    />
  );
}
