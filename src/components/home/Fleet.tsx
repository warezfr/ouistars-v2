import { useEffect, useRef, useState } from 'react';
import { useI18n, pickL } from '@/i18n';
import { FLEET, FLEET_I18N, type FleetVehicle } from '@/data/fleet';
import { usePublished } from '@/lib/cms';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

/** Ligne « véhicule » telle qu'éditée dans le back-office (collection vehicle). */
interface CmsVehicle {
  name?: string; brand?: string; type?: string; className?: string;
  seats?: number; luggage?: number; image?: string; descFr?: string; show_on_site?: boolean;
}

/** Flotte — « showroom » : rail de sélection + grande scène véhicule
    (lettrage fantôme doré, socle lumineux) + fiche specs en filets or.
    Contenu piloté par le back-office (collection vehicle). */
export default function Fleet() {
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState<FleetVehicle | null>(null);
  const [idx, setIdx] = useState(0);

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
    : FLEET.map((v) => ({
        ...v,
        name: FLEET_I18N[v.id] ? FLEET_I18N[v.id].name[lang] : v.name,
        descFr: FLEET_I18N[v.id] ? FLEET_I18N[v.id].desc[lang] : v.descFr,
      }));

  const cur = list[Math.min(idx, list.length - 1)] ?? list[0];

  return (
    <section className="os-section os-flx" id="fleet">
      <div className="os-container">
        <Reveal>
          <div className="os-flx__head">
            <div>
              <p className="os-eyebrow">{t.fleet.eyebrow}</p>
              <h2 className="os-flx__title">{t.fleet.title}</h2>
            </div>
            <span className="os-flx__count">{String(list.length).padStart(2, '0')} {pickL(lang, { fr: 'véhicules', en: 'vehicles', es: 'vehículos', ru: 'автомобилей', ar: 'سيارات' })}</span>
          </div>
        </Reveal>

        <div className="os-flx__layout">
          {/* Rail de sélection */}
          <ol className="os-flx__rail">
            {list.map((v, i) => (
              <li key={v.id}>
                <button
                  type="button"
                  className={`os-flx__railbtn${i === idx ? ' is-active' : ''}`}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => setIdx(i)}
                >
                  <span className="os-flx__railclass">{v.className}</span>
                  <span className="os-flx__railname">{v.name}</span>
                </button>
              </li>
            ))}
          </ol>

          {/* Scène showroom */}
          <div className="os-flx__stage">
            <span className="os-flx__ghost" aria-hidden>{cur?.className}</span>
            <div className="os-flx__pedestal" aria-hidden />
            {list.map((v, i) => (
              <img
                key={v.id}
                src={v.image}
                alt={v.name}
                loading={i === 0 ? 'eager' : 'lazy'}
                className={`os-flx__car${i === idx ? ' is-on' : ''}`}
              />
            ))}

            {/* Fiche : nom, description, specs, action */}
            {cur && (
              <div className="os-flx__sheet">
                <div className="os-flx__sheet-id">
                  <h3 className="os-flx__name">{cur.name}</h3>
                  <p className="os-flx__desc">{cur.descFr}</p>
                </div>
                <dl className="os-flx__specs">
                  <div><dt>{t.fleet.classLabel}</dt><dd>{cur.className}</dd></div>
                  <div><dt>{t.fleet.passengers}</dt><dd>{cur.seats}</dd></div>
                  <div><dt>{t.fleet.luggage}</dt><dd>{cur.luggage}</dd></div>
                </dl>
                <button type="button" className="os-flx__more" onClick={() => setSelected(cur)}>
                  {t.fleet.hint} →
                </button>
              </div>
            )}
          </div>
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
