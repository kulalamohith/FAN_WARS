export const getArmyTheme = (armyName: string = '', fallbackColor: string) => {
  const n = armyName.toUpperCase();
  // Using radial gradients to create an atmospheric, team-colored background
  if (n.includes('RCB') || n.includes('ROYAL')) return { bgGradient: 'radial-gradient(circle at 50% 0%, #2a0000 0%, #000 100%)', color: '#E51837', secondary: '#000000' };
  if (n.includes('MI') || n.includes('MUMBAI')) return { bgGradient: 'radial-gradient(circle at 50% 0%, #001f3f 0%, #000 100%)', color: '#004B8D', secondary: '#002244' };
  if (n.includes('LSG') || n.includes('LUCKNOW')) return { bgGradient: 'radial-gradient(circle at 50% 0%, #2e1a1a 0%, #000 100%)', color: '#8B4513', secondary: '#4A2511' };
  if (n.includes('PBKS') || n.includes('PUNJAB')) return { bgGradient: 'radial-gradient(circle at 50% 0%, #2e0808 0%, #000 100%)', color: '#ED1B24', secondary: '#5C0B0E' };
  if (n.includes('CSK') || n.includes('CHENNAI')) return { bgGradient: 'radial-gradient(circle at 50% 0%, #2a2500 0%, #000 100%)', color: '#F9CD05', secondary: '#5A4A00' };
  if (n.includes('SRH') || n.includes('SUNRISERS')) return { bgGradient: 'radial-gradient(circle at 50% 0%, #331400 0%, #000 100%)', color: '#FF822A', secondary: '#663300' };
  if (n.includes('DC') || n.includes('DELHI')) return { bgGradient: 'radial-gradient(circle at 50% 0%, #001033 0%, #000 100%)', color: '#00008B', secondary: '#8B0000' }; // DC gets blue radial background, red accents
  if (n.includes('GT') || n.includes('GUJARAT')) return { bgGradient: 'radial-gradient(circle at 50% 0%, #110e24 0%, #000 100%)', color: '#1B2133', secondary: '#0A0D1A' };
  if (n.includes('KKR') || n.includes('KOLKATA')) return { bgGradient: 'radial-gradient(circle at 50% 0%, #1a0033 0%, #000 100%)', color: '#3A225D', secondary: '#110A1C' };
  if (n.includes('RR') || n.includes('RAJASTHAN')) return { bgGradient: 'radial-gradient(circle at 50% 0%, #33001a 0%, #000 100%)', color: '#EA1A85', secondary: '#001D48' };

  return { bgGradient: `radial-gradient(circle at 50% 0%, ${fallbackColor}15 0%, #000 100%)`, color: fallbackColor, secondary: fallbackColor };
};
