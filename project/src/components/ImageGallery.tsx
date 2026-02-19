import { useMemo, useState } from 'react';
import { X } from 'lucide-react';

// All images from src/images at build time (Vite)
const imageGlob = import.meta.glob('../images/*', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function excludeLogo(path: string): boolean {
  return !path.toLowerCase().includes('logo sunny beach');
}

export function ImageGallery() {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const images = useMemo(() => {
    const entries = Object.entries(imageGlob)
      .filter(([path]) => excludeLogo(path))
      .map(([, url]) => (typeof url === 'string' ? url : (url as { default?: string })?.default ?? ''))
      .filter(Boolean);
    return shuffle(entries);
  }, []);

  if (images.length === 0) {
    return null;
  }

  return (
    <section id="gallery" className="py-24 bg-gradient-to-b from-amber-50/80 via-white to-sky-50/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-orange-500 font-semibold tracking-widest uppercase text-sm mb-3">
            Nos moments
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-5 tracking-tight">
            Galerie
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Découvrez l’ambiance Sunny Beach en images.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {images.map((src, i) => (
            <button
              type="button"
              key={`${src}-${i}`}
              onClick={() => setLightboxSrc(src)}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-orange-200/40 transition-all duration-500 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
            >
              <img
                src={src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <button
          type="button"
          onClick={() => setLightboxSrc(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 focus:outline-none"
          aria-label="Fermer"
        >
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-6 h-6 text-white" />
          </span>
        </button>
      )}
    </section>
  );
}
