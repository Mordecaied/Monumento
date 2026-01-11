import { StudioVibe } from '../types';

export interface VirtualStudio {
  id: string;
  name: string;
  vibe: StudioVibe;
  imageUrl: string;
  description: string;
}

// Virtual studio backgrounds mapped to each vibe
export const VIRTUAL_STUDIOS: Record<StudioVibe, VirtualStudio> = {
  [StudioVibe.HISTORIAN]: {
    id: 'library',
    name: 'Classic Library',
    vibe: StudioVibe.HISTORIAN,
    imageUrl: '/virtual-studios/library.jpg',
    description: 'Elegant library with books and warm lighting - perfect for historical storytelling'
  },
  [StudioVibe.JOURNALIST]: {
    id: 'newsdesk',
    name: 'Modern News Desk',
    vibe: StudioVibe.JOURNALIST,
    imageUrl: '/virtual-studios/newsdesk.jpg',
    description: 'Professional news studio with clean lines and bright lighting'
  },
  [StudioVibe.CELEBRATOR]: {
    id: 'celebration',
    name: 'Celebration Hall',
    vibe: StudioVibe.CELEBRATOR,
    imageUrl: '/virtual-studios/celebration.jpg',
    description: 'Festive space with warm ambient lighting and celebration vibes'
  },
  [StudioVibe.JESTER]: {
    id: 'comedy-club',
    name: 'Comedy Club Stage',
    vibe: StudioVibe.JESTER,
    imageUrl: '/virtual-studios/comedy-club.jpg',
    description: 'Intimate comedy club setting with spotlight and exposed brick'
  },
  [StudioVibe.ROAST_MASTER]: {
    id: 'roast-stage',
    name: 'Roast Battle Arena',
    vibe: StudioVibe.ROAST_MASTER,
    imageUrl: '/virtual-studios/roast-stage.jpg',
    description: 'Dramatic stage with dramatic lighting for comedic roasting'
  }
};

// Fallback: Generate placeholder background if image not found
export function createPlaceholderBackground(vibe: StudioVibe): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  // Gradient background based on vibe
  const gradients: Record<StudioVibe, [string, string]> = {
    [StudioVibe.HISTORIAN]: ['#2d1810', '#1a0f0a'],
    [StudioVibe.JOURNALIST]: ['#1a3a52', '#0f1f2e'],
    [StudioVibe.CELEBRATOR]: ['#4a1942', '#2d0f28'],
    [StudioVibe.JESTER]: ['#3d2817', '#1f140b'],
    [StudioVibe.ROAST_MASTER]: ['#4a0e0e', '#2d0808']
  };

  const [color1, color2] = gradients[vibe];
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add subtle noise texture
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 2;
    const opacity = Math.random() * 0.1;
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fillRect(x, y, size, size);
  }

  // Add vibe name watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.font = 'bold 120px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(vibe, canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL('image/jpeg', 0.8);
}

export async function loadVirtualStudioBackground(vibe: StudioVibe): Promise<string> {
  const studio = VIRTUAL_STUDIOS[vibe];

  // Try to load the actual image
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      console.log(`[VirtualStudio] Loaded background for ${vibe}:`, studio.imageUrl);
      resolve(studio.imageUrl);
    };
    img.onerror = () => {
      console.warn(`[VirtualStudio] Image not found for ${vibe}, using placeholder`);
      const placeholder = createPlaceholderBackground(vibe);
      resolve(placeholder);
    };
    img.src = studio.imageUrl;
  });
}
