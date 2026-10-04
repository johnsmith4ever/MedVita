'use client'

/**
 * components/photo-strip.tsx
 *
 * A continuously scrolling strip of the 3 medical images provided by the user.
 * Images are triplicated so the infinite loop is seamless at any speed.
 * Hover pauses the animation. The strip is purely decorative — no data is sent.
 */

const IMAGES = [
  { src: '/images/pills-mixed.jpg', alt: 'Colourful mixed medication capsules and tablets' },
  { src: '/images/pharmacy-shelf.jpg', alt: 'Pharmacy shelf with rows of packaged medicines' },
  { src: '/images/blister-packs.jpg', alt: 'Blister packs of assorted pills and capsules' },
]

// Triplicate for a seamless infinite loop
const ALL_IMAGES = [...IMAGES, ...IMAGES, ...IMAGES]

export function PhotoStrip() {
  return (
    <div className="photo-strip-wrap w-full py-2">
      <div className="photo-strip-track">
        {ALL_IMAGES.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={img.src}
            alt={img.alt}
            className="photo-strip-img"
            draggable={false}
          />
        ))}
      </div>
    </div>
  )
}
