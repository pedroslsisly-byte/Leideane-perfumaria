/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface ProductVisualProps {
  id: string;
  catalog: 'Natura' | 'O Boticario' | 'Croche';
  imageUrl: string;
}

export default function ProductVisual({ id, catalog, imageUrl }: ProductVisualProps) {
  // Determine gradient IDs based on product to prevent collisions
  const goldGradId = `gold-grad-${id}`;
  const darkGradId = `dark-grad-${id}`;
  const glassGradId = `glass-grad-${id}`;
  const amberGradId = `amber-grad-${id}`;

  const isExternalImage = imageUrl && (
    imageUrl.startsWith('http') || 
    imageUrl.startsWith('data:') || 
    imageUrl.includes('.') || 
    imageUrl.includes('/')
  );

  if (isExternalImage) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-3 overflow-hidden select-none">
        {/* Subtle backing glow matched to gold luxury */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gold/10 rounded-full filter blur-xl opacity-60 pointer-events-none" />
        <img 
          src={imageUrl} 
          alt="Product Picture" 
          className="max-w-[140px] max-h-[160px] w-auto h-auto object-contain filter drop-shadow-[0_12px_24px_rgba(212,175,55,0.25)] relative z-10 transition-transform duration-500 hover:scale-[1.03]"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const isPerfume = catalog === 'Natura' || catalog === 'O Boticario';

  if (isPerfume) {
    // Generate specialized bottle based on sub-style
    let bottleColor = '#D4AF37'; // Gold base
    let capStyle = 'tall';
    let liquidColor = 'url(#' + goldGradId + ')';

    if (imageUrl.includes('black') || imageUrl.includes('obsidian') || imageUrl.includes('pitch')) {
      bottleColor = '#151515';
      liquidColor = '#050505';
      capStyle = 'block';
    } else if (imageUrl.includes('bronze') || imageUrl.includes('jewelry')) {
      bottleColor = '#6B4F35';
      liquidColor = 'url(#' + amberGradId + ')';
      capStyle = 'ellipse';
    } else if (imageUrl.includes('crystal') || imageUrl.includes('rose_gold')) {
      bottleColor = '#EADCB9';
      liquidColor = 'url(#' + glassGradId + ')';
      capStyle = 'cylinder';
    }

    return (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <svg
          viewBox="0 0 200 240"
          className="w-full h-full max-h-[220px] filter drop-shadow-[0_10px_20px_rgba(212,175,55,0.08)]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <defs>
            {/* Fine Metallic gold gradient */}
            <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8C6E33" />
              <stop offset="25%" stopColor="#D4AF37" />
              <stop offset="50%" stopColor="#FFF9E6" />
              <stop offset="75%" stopColor="#B88936" />
              <stop offset="100%" stopColor="#4A3410" />
            </linearGradient>

            {/* Bronze Amber gradient */}
            <linearGradient id={amberGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A321F" />
              <stop offset="50%" stopColor="#A87A54" />
              <stop offset="100%" stopColor="#25160A" />
            </linearGradient>

            {/* Luxury glass reflection gradient */}
            <linearGradient id={glassGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
              <stop offset="15%" stopColor="rgba(255,255,255,0.22)" />
              <stop offset="50%" stopColor="rgba(212,175,55,0.1)" />
              <stop offset="85%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
            </linearGradient>

            {/* Obsidian Metallic black gradient */}
            <linearGradient id={darkGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E1E1E" />
              <stop offset="50%" stopColor="#0D0D0D" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>

          {/* Background Aura / Glow */}
          <circle cx="100" cy="130" r="55" fill="#D4AF37" opacity="0.04" filter="blur(25px)" />

          {/* Perfume Bottle Cap */}
          {capStyle === 'tall' && (
            <g>
              <rect x="85" y="25" width="30" height="35" fill="url(#" />
              <rect x="85" y="25" width="30" height="35" fill={`url(#${goldGradId})`} />
              <line x1="100" y1="25" x2="100" y2="60" stroke="#FFF" opacity="0.15" strokeWidth="1" />
              {/* Gold ring highlight */}
              <rect x="82" y="55" width="36" height="5" fill="#D4AF37" />
            </g>
          )}

          {capStyle === 'block' && (
            <g>
              <rect x="75" y="30" width="50" height="25" fill="#151515" stroke="#D4AF37" strokeWidth="1" />
              <rect x="75" y="30" width="50" height="4" fill="#D4AF37" />
              {/* Gold core nozzle connector */}
              <rect x="94" y="55" width="12" height="6" fill={`url(#${goldGradId})`} />
            </g>
          )}

          {capStyle === 'ellipse' && (
            <g>
              <ellipse cx="100" cy="40" rx="32" ry="16" fill={`url(#${amberGradId})`} stroke="#D4AF37" strokeWidth="0.5" />
              <rect x="92" y="48" width="16" height="12" fill={`url(#${goldGradId})`} />
            </g>
          )}

          {capStyle === 'cylinder' && (
            <g>
              <rect x="88" y="22" width="24" height="33" rx="1" fill={`url(#${goldGradId})`} />
              <line x1="88" y1="35" x2="112" y2="35" stroke="#000" opacity="0.3" />
            </g>
          )}

          {/* Bottle Neck spray dispenser */}
          <rect x="96" y="58" width="8" height="6" fill="#A87A54" opacity="0.6" />

          {/* Main Bottle Body */}
          <rect
            x="50"
            y="64"
            width="100"
            height="145"
            rx="4"
            fill={liquidColor}
            stroke="#D4AF37"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />

          {/* Reflections inside the glass body - simulating physical metallic reflection maps */}
          <rect x="54" y="68" width="14" height="137" fill="rgba(255,255,255,0.1)" />
          <rect x="132" y="68" width="14" height="137" fill="rgba(0,0,0,0.4)" />
          
          <path d="M 54 68 Q 100 80 146 68" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
          <path d="M 54 200 Q 100 205 146 200" stroke="rgba(212,175,55,0.3)" strokeWidth="1" fill="none" />

          {/* Glass body thickness / fine edge highlights */}
          <rect
            x="52"
            y="66"
            width="96"
            height="141"
            fill="none"
            stroke={`url(#${glassGradId})`}
            strokeWidth="3"
            opacity="0.8"
          />

          {/* Internal Tube (Straw) */}
          <line x1="100" y1="64" x2="100" y2="198" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Luxury Label / Seal */}
          <g transform="translate(68, 105)">
            <rect
              x="0"
              y="0"
              width="64"
              height="55"
              fill="#080808"
              stroke="#D4AF37"
              strokeWidth="0.75"
              opacity="0.95"
            />
            {/* Fine card line */}
            <rect x="3" y="3" width="58" height="49" fill="none" stroke="#D4AF37" strokeWidth="0.25" opacity="0.5" />
            
            {/* Minimalist perfume graphic */}
            <circle cx="32" cy="18" r="6" fill="none" stroke="#D4AF37" strokeWidth="1" />
            <line x1="32" y1="12" x2="32" y2="24" stroke="#D4AF37" strokeWidth="0.5" />
            
            {/* Brand/Product Mini Text Indicator */}
            <text
              x="32"
              y="38"
              fill="#FFFFFF"
              fontSize="4.5"
              fontWeight="900"
              textAnchor="middle"
              letterSpacing="1.2"
              fontFamily="var(--font-display)"
            >
              L’ÉLIXIR
            </text>
            <text
              x="32"
              y="46"
              fill="#D4AF37"
              fontSize="3.5"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              letterSpacing="0.5"
            >
              PREMIUM
            </text>
          </g>

          {/* Top-left Fine edge high lights reflecting metal light source */}
          <path d="M 50 78 L 50 66 L 70 64" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </svg>

        {/* Floating dust particle highlights representing noble aroma */}
        <div className="absolute top-[35%] left-[25%] lg:left-[35%] w-1.5 h-1.5 bg-gold rounded-full opacity-60 animate-ping" />
        <div className="absolute bottom-[35%] right-[25%] lg:right-[35%] w-1 h-1 bg-white rounded-full opacity-40 animate-pulse" />
      </div>
    );
  } else {
    // Elegant Geometric Crochet Render representing woven loops and sophisticated art mandalas
    return (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <svg
          viewBox="0 0 220 220"
          className="w-full h-full max-h-[220px] filter drop-shadow-[0_8px_16px_rgba(223,177,91,0.06)]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <defs>
            <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8C6E33" />
              <stop offset="50%" stopColor="#DFB15B" />
              <stop offset="100%" stopColor="#B88936" />
            </linearGradient>
            
            <linearGradient id={amberGradId} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2A1B0E" />
              <stop offset="100%" stopColor="#553A22" />
            </linearGradient>
          </defs>

          {/* Ambient Outer Aura */}
          <circle cx="110" cy="110" r="70" fill="#D4AF37" opacity="0.03" filter="blur(20px)" />

          {/* Mandala-like crochet background ring */}
          <circle cx="110" cy="110" r="82" fill="none" stroke="#25160A" strokeWidth="2" strokeDasharray="3, 3" />
          <circle cx="110" cy="110" r="72" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="1, 8" />

          {/* Interlocking Crochet Lace Ribbons - Generated with precise mathematical curves */}
          {Array.from({ length: 12 }).map((_, idx) => {
            const rot = idx * 30;
            return (
              <g key={idx} transform={`rotate(${rot}, 110, 110)`}>
                {/* Petal/Loop structure of the knit crochet */}
                <path
                  d="M 110 110 C 130 90, 150 70, 140 40 C 130 15, 110 30, 110 60 Z"
                  fill="none"
                  stroke={idx % 2 === 0 ? '#D4AF37' : '#6B4F35'}
                  strokeWidth={idx % 2 === 0 ? "1" : "0.5"}
                  strokeOpacity="0.7"
                />
                <circle cx="110" cy="55" r="2" fill="#EADCB9" opacity="0.8" />
                <path
                  d="M 110 40 L 110 110"
                  stroke="#D4AF37"
                  strokeWidth="0.25"
                  strokeDasharray="2, 5"
                  opacity="0.4"
                />
              </g>
            );
          })}

          {/* Geometric Inner Framing representing structure grid of crochet */}
          <polygon
            points="110,48 162,110 110,172 58,110"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="0.5"
            opacity="0.3"
          />
          <polygon
            points="110,65 145,110 110,155 75,110"
            fill="none"
            stroke="#6B4F35"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Focal Golden Core Symbol representing final touch of art */}
          <circle cx="110" cy="110" r="15" fill="none" stroke="url(#gold-grad-)" strokeWidth="1.5" />
          <circle cx="110" cy="110" r="15" fill="none" stroke={`url(#${goldGradId})`} strokeWidth="1.5" />
          <circle cx="110" cy="110" r="10" fill="#0D0D0D" stroke="#D4AF37" strokeWidth="0.5" />
          <circle cx="110" cy="110" r="4" fill="#D4AF37" />

          {/* Radial Knitted Spikes outlining the crochet piece */}
          {Array.from({ length: 24 }).map((_, idx) => {
            const rot = idx * 15;
            const yOffset = 110 - 78;
            return (
              <g key={`spike-${idx}`} transform={`rotate(${rot}, 110, 110)`}>
                <line x1="110" y1="28" x2="110" y2="34" stroke="#D4AF37" strokeWidth="1" opacity="0.8" />
                <circle cx="110" cy="27" r="1.5" fill="#FFF" />
              </g>
            );
          })}

          {/* Premium Fine overlay text for tech feel */}
          <text
            x="110"
            y="126"
            fill="#94A3B8"
            fontSize="4.5"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
            letterSpacing="2"
            opacity="0.6"
          >
            HANDMADE CAPTURE
          </text>
        </svg>

        {/* Ambient dust reflecting luxury crochet craft */}
        <div className="absolute top-[40%] right-[32%] w-1 bg-gold rounded-full h-1 animate-pulse" />
        <div className="absolute bottom-[28%] left-[28%] w-1.5 bg-bronze rounded-full h-1.5 animate-bounce" />
      </div>
    );
  }
}
