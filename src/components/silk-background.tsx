/**
 * Sfondo a tutto schermo: onde di seta verde/grafite. SVG statico con
 * gradienti, animato solo via transform CSS (economico per la GPU) e
 * fermo con prefers-reduced-motion.
 */
export function SilkBackground() {
  return (
    <div className="silk" aria-hidden>
      <svg className="w1" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="s1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2f5e4c" stopOpacity="0" />
            <stop offset="0.5" stopColor="#4d8a72" stopOpacity="0.55" />
            <stop offset="1" stopColor="#1b3a2f" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="s2" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#0f1a16" stopOpacity="0" />
            <stop offset="0.55" stopColor="#9ac7b2" stopOpacity="0.32" />
            <stop offset="1" stopColor="#24463a" stopOpacity="0" />
          </linearGradient>
          <filter id="sb" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="28" />
          </filter>
        </defs>
        <g filter="url(#sb)">
          <path d="M-100 620 C 300 420, 600 820, 1000 560 S 1600 300, 1800 420 L 1800 760 C 1400 620, 1100 980, 700 860 S 100 760, -100 900 Z" fill="url(#s1)" />
          <path d="M-100 300 C 400 120, 700 460, 1100 260 S 1500 60, 1800 140 L 1800 240 C 1400 200, 1200 520, 800 460 S 200 320, -100 420 Z" fill="url(#s2)" />
        </g>
      </svg>
      <svg className="w2" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="s3" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3d6b5a" stopOpacity="0" />
            <stop offset="0.6" stopColor="#c9e4d6" stopOpacity="0.22" />
            <stop offset="1" stopColor="#3d6b5a" stopOpacity="0" />
          </linearGradient>
          <filter id="sb2"><feGaussianBlur stdDeviation="14" /></filter>
        </defs>
        <path filter="url(#sb2)" d="M-100 760 C 350 600, 700 900, 1150 700 S 1600 520, 1800 600 L 1800 640 C 1500 580, 1200 780, 800 820 S 200 700, -100 820 Z" fill="url(#s3)" />
        <path filter="url(#sb2)" d="M200 -50 C 500 200, 900 100, 1200 300 S 1500 600, 1700 520 L 1700 560 C 1450 650, 1150 380, 900 300 S 450 260, 160 -20 Z" fill="url(#s3)" opacity="0.7" />
      </svg>
    </div>
  );
}
