export const THEMES = {
  ICE: {
    id: 'ICE',
    name: 'Glacial Luxury',
    primary: '#E0F2FF', // Ice White
    secondary: '#0066FF', // Electric Blue
    glow: '#4488FF',
    background: '#000814',
    light: '#aaccff'
  },
  CLASSIC: {
    id: 'CLASSIC',
    name: 'Royal Tradition',
    primary: '#FFD700', // Gold
    secondary: '#0F5132', // Deep Green
    glow: '#C41E3A', // Cardinal Red
    background: '#051005',
    light: '#ffddaa'
  },
  NEON: {
    id: 'NEON',
    name: 'Cyber Night',
    primary: '#00FFFF', // Cyan
    secondary: '#FF00FF', // Magenta
    glow: '#9D00FF', // Purple
    background: '#0a0014',
    light: '#ffaaee'
  }
};

export const COLORS = THEMES.ICE; // Default fallback

export const PARTICLE_COUNT = 8000;
export const TREE_HEIGHT = 12;
export const TREE_RADIUS = 5;
export const EXPLOSION_RADIUS = 25;