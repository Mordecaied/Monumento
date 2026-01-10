# UI Design Skill

**Purpose:** Guide Claude to create visually compelling, modern UI with strong aesthetic principles.

---

## Design Principles

When working on any UI/UX tasks, follow these core principles:

### 1. Typography
- **Don't use generic fonts** (Arial, Helvetica, sans-serif)
- **Pick something interesting** that matches the brand personality
- Examples for Monumento:
  - Headlines: Playfair Display, Bodoni, Didot (elegant, timeless)
  - Body: Inter, GT America, Söhne (modern, readable)
  - Accent: Space Grotesk, Monument Extended (bold, contemporary)
- Use font weights strategically (300, 400, 600, 800)
- Establish clear hierarchy with size, weight, and spacing

### 2. Colour & Theme
- **Commit to a cohesive colour palette**
- **Use 2-3 dominant colours** instead of 10
- For Monumento:
  - Primary: Purple gradient (#8B5CF6 → #6366F1) - creativity, memory
  - Secondary: Orange (#F97316) - warmth, storytelling
  - Neutral: Warm blacks (#0D0D0D), subtle whites (rgba(255,255,255,0.9))
- Use opacity variations (10%, 20%, 40%, 80%) instead of new colours
- Maintain consistent colour usage across all components

### 3. Motion
- **Use animation strategically** - not everything needs to move
- Purpose-driven animations:
  - Feedback: Button presses, hover states
  - Delight: Micro-interactions on key actions
  - Guidance: Drawing attention to important elements
  - Hierarchy: Stagger animations to show relationships
- Keep animations fast: 150-300ms for most interactions
- Use appropriate easing: ease-out for entrances, ease-in for exits

### 4. Spatial Composition
- **Break the grid** - don't rely on rigid 12-column layouts
- **Use asymmetry** to create visual interest
- **Overlap elements** to create depth and layers
- **Create unexpected layouts** that surprise and engage
- Examples:
  - Diagonal sections instead of horizontal rows
  - Cards that break container boundaries
  - Overlapping images with text
  - Variable column widths

### 5. Background & Details
- **Don't just use solid colours**
- Add visual richness:
  - Subtle gradients (radial, linear, mesh)
  - Textures (noise, grain, patterns)
  - Decorative elements (shapes, lines, blurs)
  - Depth through layering (backdrop-filter: blur)
- Match your aesthetic:
  - Monumento: Dark cinematic backgrounds, spotlight effects, film grain
  - Glass morphism for panels
  - Glow effects on interactive elements

---

## Implementation Guidelines

### When Creating New Components:
1. **Start with typography** - establish the text hierarchy first
2. **Apply colour system** - use only the defined palette
3. **Add spatial interest** - break expectations with layout
4. **Layer backgrounds** - never plain white or black
5. **Animate intentionally** - only what serves a purpose
6. **Test contrast** - ensure accessibility (WCAG AA minimum)

### When Refactoring Existing UI:
1. Audit current usage of fonts, colours, layouts
2. Identify inconsistencies and generic patterns
3. Apply design principles systematically
4. Enhance without over-designing

### Don'ts:
- ❌ Don't use more than 3 font families
- ❌ Don't add animations just because you can
- ❌ Don't use pure black (#000) or pure white (#FFF)
- ❌ Don't center-align everything
- ❌ Don't use default Bootstrap/Tailwind colours without customization

### Do's:
- ✅ Use consistent spacing scale (4px, 8px, 12px, 16px, 24px, 32px, 48px)
- ✅ Establish visual rhythm through repetition with variation
- ✅ Create focus with contrast and white space
- ✅ Use shadows and depth to establish hierarchy
- ✅ Think in systems, not individual components

---

## Examples from Monumento

### Good Typography Usage:
```css
/* Headlines */
font-family: 'Playfair Display', serif;
font-weight: 700;
font-size: 3rem;
letter-spacing: -0.02em;

/* Body */
font-family: 'Inter', sans-serif;
font-weight: 400;
font-size: 1rem;
line-height: 1.6;

/* Labels */
font-family: 'Inter', sans-serif;
font-weight: 600;
font-size: 0.75rem;
text-transform: uppercase;
letter-spacing: 0.1em;
```

### Good Colour Usage:
```css
/* Primary actions */
background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);

/* Hover states */
background: rgba(139, 92, 246, 0.1);

/* Borders */
border: 1px solid rgba(255, 255, 255, 0.08);

/* Text */
color: rgba(255, 255, 255, 0.9);  /* Primary */
color: rgba(255, 255, 255, 0.4);  /* Secondary */
```

### Good Background Usage:
```css
/* Cinematic background */
background: radial-gradient(circle at center, #16181d 0%, #050505 100%);

/* Glass panel */
background: rgba(255, 255, 255, 0.02);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.08);

/* Glow effect */
box-shadow: 0 0 30px rgba(139, 92, 246, 0.15);
```

---

## Quality Checklist

Before considering UI work complete:
- [ ] Typography uses interesting, brand-appropriate fonts
- [ ] Colour palette is cohesive (2-3 dominant colours)
- [ ] Animations serve a purpose and feel polished
- [ ] Layout breaks conventions in intentional ways
- [ ] Backgrounds have depth (gradients, textures, blur)
- [ ] Visual hierarchy is clear
- [ ] Design is accessible (colour contrast, focus states)
- [ ] Design feels cohesive across all screens

---

**Remember:** Great design isn't about adding more—it's about making intentional choices that create a memorable, cohesive experience.
