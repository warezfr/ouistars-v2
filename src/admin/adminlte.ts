/**
 * Chargement d'AdminLTE 4 (MIT) — CSS Bootstrap 5 intégré + Bootstrap Icons —
 * uniquement pendant que le back-office est monté, afin de ne pas impacter le
 * design du site public (Tailwind). Les liens sont retirés au démontage.
 */
const ASSETS: { id: string; href: string }[] = [
  { id: 'adminlte-icons', href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css' },
  { id: 'adminlte-css', href: 'https://cdn.jsdelivr.net/npm/admin-lte@4.0.0-rc4/dist/css/adminlte.min.css' },
];

const BODY_CLASSES = ['layout-fixed', 'sidebar-expand-lg', 'bg-body-tertiary', 'adminlte-active'];

export function mountAdminLTE(): () => void {
  const links: HTMLLinkElement[] = [];
  for (const a of ASSETS) {
    if (document.getElementById(a.id)) continue;
    const link = document.createElement('link');
    link.id = a.id;
    link.rel = 'stylesheet';
    link.href = a.href;
    document.head.appendChild(link);
    links.push(link);
  }
  document.body.classList.add(...BODY_CLASSES);

  return () => {
    for (const l of links) l.remove();
    document.body.classList.remove(...BODY_CLASSES);
  };
}
