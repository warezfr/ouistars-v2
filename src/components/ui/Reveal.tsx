import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Révèle son contenu en douceur lorsqu'il entre dans le viewport. */
export default function Reveal({ children, as: Tag = 'div' }: { children: ReactNode; as?: 'div' | 'section' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref as never} className={`os-reveal${visible ? ' is-visible' : ''}`}>
      {children}
    </Tag>
  );
}
