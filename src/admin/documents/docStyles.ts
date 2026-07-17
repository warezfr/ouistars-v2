/**
 * Styles des documents HTML (facture / devis / bon / ordre de mission)
 * — inspirés du template fourni, adaptés à l'identité noir & or Oui Stars.
 * Exportés en chaîne pour être injectés aussi dans la fenêtre d'impression.
 */
export const DOC_CSS = `
.osdoc { background:#fff; color:#1a1a1a; width:210mm; max-width:100%; margin:0 auto;
  font-family:'Helvetica Neue',Arial,sans-serif; box-shadow:0 10px 40px rgba(0,0,0,.35); position:relative; overflow:hidden; }
.osdoc__band { background:#14161c; color:#fff; display:flex; justify-content:space-between; align-items:center;
  padding:18px 32px; border-bottom:4px solid #c9a227; }
.osdoc__brand { display:flex; align-items:center; gap:12px; }
.osdoc__brand img { height:44px; }
.osdoc__brand-name { font-size:1.25rem; font-weight:800; letter-spacing:.08em; }
.osdoc__brand-name span { color:#c9a227; }
.osdoc__brand-sub { font-size:.55rem; letter-spacing:.14em; color:#9aa0aa; }
.osdoc__contacts { display:flex; gap:22px; font-size:.68rem; white-space:nowrap; }
.osdoc__contacts b { display:block; color:#c9a227; font-size:.6rem; letter-spacing:.08em; margin-bottom:2px; }
.osdoc__body { padding:26px 32px 0; }
.osdoc__top { display:flex; justify-content:space-between; gap:24px; margin-bottom:22px; }
.osdoc__to h5 { margin:0 0 2px; font-size:.62rem; letter-spacing:.14em; color:#888;
  border-bottom:1px solid #ddd; padding-bottom:4px; width:180px; }
.osdoc__to .name { font-size:1.05rem; font-weight:700; margin:8px 0 4px; }
.osdoc__to .line { font-size:.78rem; color:#666; }
.osdoc__title { text-align:right; }
.osdoc__title h2 { margin:0 0 10px; font-size:1.9rem; letter-spacing:.05em; color:#c9a227; font-weight:800; white-space:nowrap; }
.osdoc__title h2.long { font-size:1.3rem; }
.osdoc__meta { font-size:.74rem; color:#666; }
.osdoc__meta div { margin-bottom:3px; }
.osdoc__meta b { color:#1a1a1a; }
.osdoc__table { width:100%; border-collapse:collapse; font-size:.8rem; }
.osdoc__table thead th { background:#14161c; color:#fff; text-align:left; font-size:.66rem;
  letter-spacing:.1em; padding:9px 10px; }
.osdoc__table thead th.num, .osdoc__table td.num { text-align:right; }
.osdoc__table tbody td { padding:9px 10px; border-bottom:1px solid #eee; vertical-align:top; }
.osdoc__table tbody tr:nth-child(odd) td { background:#f4f4f6; }
.osdoc__table .sub { display:block; font-size:.68rem; color:#888; margin-top:2px; font-weight:400; }
.osdoc__bottom { display:flex; justify-content:space-between; gap:24px; margin-top:18px; }
.osdoc__pay { font-size:.72rem; color:#666; max-width:46%; }
.osdoc__pay h6 { margin:0 0 4px; font-size:.72rem; color:#1a1a1a; }
.osdoc__pay .gold { color:#a17e2f; font-weight:700; }
.osdoc__totals { min-width:250px; font-size:.8rem; }
.osdoc__totals .row { display:flex; justify-content:space-between; padding:4px 10px; color:#555; }
.osdoc__grand { display:flex; justify-content:space-between; align-items:center; background:#c9a227;
  color:#14161c; font-weight:800; padding:10px 12px; margin-top:8px; font-size:.95rem; }
.osdoc__mission { display:grid; grid-template-columns:1fr 1fr; gap:14px 28px; margin:4px 0 8px; }
.osdoc__mission .cell b { display:block; font-size:.6rem; letter-spacing:.12em; color:#888; margin-bottom:2px; }
.osdoc__mission .cell span { font-size:.9rem; font-weight:600; }
.osdoc__notes { margin-top:14px; font-size:.78rem; color:#444; background:#f4f4f6;
  border-left:3px solid #c9a227; padding:10px 12px; }
.osdoc__wave { margin-top:26px; position:relative; height:86px; }
.osdoc__wave .gold { position:absolute; inset:0;
  background:#c9a227; clip-path:ellipse(75% 100% at 30% 115%); }
.osdoc__wave .night { position:absolute; inset:0; background:#14161c;
  clip-path:ellipse(80% 90% at 62% 132%); display:flex; flex-direction:column;
  justify-content:flex-end; padding:0 32px 12px; }
.osdoc__wave .night b { color:#fff; font-size:.95rem; }
.osdoc__wave .night small { color:#9aa0aa; font-size:.62rem; }

/* ————— Écran d'accueil tablette (paysage) ————— */
.oswel { position:fixed; inset:0; z-index:3000; background:#14161c; color:#fff;
  display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
.oswel::before, .oswel::after { content:''; position:absolute; left:0; right:0; height:6px; background:#c9a227; }
.oswel::before { top:0; } .oswel::after { bottom:0; }
.oswel__corner { position:absolute; width:34px; height:34px; border:1.5px solid #c9a227; }
.oswel__corner.tl { top:26px; left:26px; border-right:0; border-bottom:0; }
.oswel__corner.tr { top:26px; right:26px; border-left:0; border-bottom:0; }
.oswel__corner.bl { bottom:26px; left:26px; border-right:0; border-top:0; }
.oswel__corner.br { bottom:26px; right:26px; border-left:0; border-top:0; }
.oswel__brandrow { display:flex; align-items:center; gap:16px; }
.oswel__logo { height:58px; display:block; }
.oswel__brand { font-size:1.7rem; font-weight:800; letter-spacing:.12em; line-height:1; }
.oswel__brand span { color:#c9a227; }
.oswel__hello { color:#c9a227; letter-spacing:.5em; font-size:clamp(.7rem,1.6vw,1rem); margin:5vh 0 3vh; }
.oswel__name { font-weight:800; text-transform:uppercase; line-height:1.05;
  font-size:clamp(2.2rem, 9vw, 7.5rem); max-width:92vw; overflow-wrap:break-word; }
.oswel__rule { width:150px; height:2px; background:#c9a227; margin:4vh auto 2.5vh; }
.oswel__sub { color:#9aa0aa; font-size:clamp(.8rem,1.8vw,1.15rem); }
.oswel__ref { color:#c9a227; font-size:clamp(.7rem,1.4vw,.95rem); margin-top:1.2vh; }
.oswel__foot { position:absolute; bottom:3.2vh; left:0; right:0; color:#6a6f7a;
  letter-spacing:.2em; font-size:clamp(.55rem,1.1vw,.75rem); }
.oswel__bar { position:absolute; top:18px; right:52px; display:flex; gap:8px; }
.oswel__bar button { border:1px solid rgba(255,255,255,.3); background:rgba(0,0,0,.35); color:#fff;
  border-radius:8px; padding:8px 14px; cursor:pointer; font-size:.85rem; }
@media print { .no-print { display:none !important; } body { background:#fff; } .osdoc { box-shadow:none; } }
`;
