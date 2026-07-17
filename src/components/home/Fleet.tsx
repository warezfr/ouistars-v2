import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import { FLEET, type FleetVehicle } from '@/data/fleet';
import { usePublished } from '@/lib/cms';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/** Ligne « véhicule » telle qu'éditée dans le back-office (collection vehicle). */
interface CmsVehicle {
  name?: string; brand?: string; type?: string; className?: string;
  seats?: number; luggage?: number; image?: string; descFr?: string; show_on_site?: boolean;
}

/** Flotte — cartes cliquables + modal détaillée. Contenu piloté par le back-office. */
export default function Fleet() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<FleetVehicle | null>(null);

  const cmsVehicles = usePublished<CmsVehicle>('vehicle', []);
  const list: FleetVehicle[] = cmsVehicles.length
    ? cmsVehicles
        .filter((v) => v.show_on_site !== false && v.name && v.image)
        .map((v, i) => ({
          id: `cms-${i}`,
          name: v.name!,
          category: 'business',
          className: (v.className as FleetVehicle['className']) ?? 'E-Class',
          image: v.image!,
          seats: v.seats ?? 3,
          luggage: v.luggage ?? 3,
          descFr: v.descFr ?? '',
        }))
    : FLEET;

  return (
    <section className="os-section" id="fleet">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">{t.fleet.eyebrow}</p>
          <h2>{t.fleet.title}</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((v) => (
            <Reveal key={v.id}>
              <button
                type="button"
                onClick={() => setSelected(v)}
                className="group relative block w-full overflow-hidden rounded-2xl border border-gold-deep/20 bg-surface/60 text-left transition-colors duration-500 hover:border-gold-deep/60"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={v.image}
                    alt={v.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-transparent to-transparent" aria-hidden />
                  <span className="absolute left-4 top-4 rounded-full border border-gold-deep bg-night/60 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-gold backdrop-blur-sm">
                    {v.className}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="os-card-title font-display text-ivory">{v.name}</h3>
                  <p className="os-small os-flush">{v.descFr}</p>
                  <div className="mt-3 flex items-center gap-2 text-[0.8rem] tracking-wide text-gold-soft/85">
                    <span>{v.seats} {t.fleet.passengers}</span>
                    <span aria-hidden>·</span>
                    <span>{v.luggage} {t.fleet.luggage}</span>
                  </div>
                  <span className="os-fleet__hint">{t.fleet.hint} →</span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <FleetModal vehicle={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

/** Modal accessible : fermeture Échap + clic overlay, focus sur le bouton fermer. */
function FleetModal({ vehicle, onClose }: { vehicle: FleetVehicle | null; onClose: () => void }) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!vehicle) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [vehicle, onClose]);

  if (!vehicle) return null;

  return (
    <div className="os-fleetmodal" onClick={onClose}>
      <div
        className="os-fleetmodal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fleetmodal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} className="os-fleetmodal__close" aria-label={t.common.close} onClick={onClose}>×</button>

        <div className="os-fleetmodal__media">
          <img src={vehicle.image} alt={vehicle.name} />
          <span className="os-fleetmodal__badge">{t.fleet.classLabel} · {vehicle.className}</span>
        </div>

        <div className="os-fleetmodal__body">
          <h3 id="fleetmodal-title" className="os-fleetmodal__name">{vehicle.name}</h3>
          <div className="os-fleetmodal__meta">
            <span>{vehicle.seats} {t.fleet.passengers}</span>
            <span aria-hidden>·</span>
            <span>{vehicle.luggage} {t.fleet.luggage}</span>
          </div>
          <p className="os-fleetmodal__desc">{vehicle.descFr}</p>

          <p className="os-fleetmodal__perkstitle">{t.fleet.highlights}</p>
          <ul className="os-fleetmodal__perks">
            {t.fleet.perks.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
