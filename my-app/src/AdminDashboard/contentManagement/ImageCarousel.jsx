import { useState } from "react";
import styles from "../AdminDashboard.module.css";

export function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;
  return (
    <div className={styles.carousel}>
      <img
        src={images[idx]}
        alt={`slide-${idx}`}
        className={styles.carouselImg}
      />
      {images.length > 1 && (
        <>
          <div className={styles.carouselDots}>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dot} ${i === idx ? styles.dotActive : ""}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className={`${styles.carouselBtn} ${styles.carouselPrev}`}
            onClick={() =>
              setIdx((i) => (i - 1 + images.length) % images.length)
            }
          >
            ‹
          </button>
          <button
            type="button"
            className={`${styles.carouselBtn} ${styles.carouselNext}`}
            onClick={() => setIdx((i) => (i + 1) % images.length)}
          >
            ›
          </button>
        </>
      )}
      <div className={styles.carouselCount}>
        {idx + 1} / {images.length}
      </div>
    </div>
  );
}
