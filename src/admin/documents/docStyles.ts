/**
 * Styles des documents HTML (facture / devis / bon / ordre de mission)
 * — « papier de maison » noir & or, Cormorant Garamond, alignés sur les PDF serveur.
 * Exportés en chaîne pour être injectés aussi dans la fenêtre d'impression.
 */
export const DOC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&display=swap');

.osdoc { background:#fff; color:#191b21; width:210mm; max-width:100%; margin:0 auto;
  font-family:'Helvetica Neue',Arial,sans-serif; box-shadow:0 10px 40px rgba(0,0,0,.35); position:relative; overflow:hidden; }

/* ————— Papier à en-tête ————— */
.osdoc__band { background:#101218; color:#fff; display:flex; justify-content:space-between; align-items:center;
  padding:20px 34px; border-bottom:3px solid #c9a24b; box-shadow:inset 0 -6px 0 -5px #a17e2f; }
.osdoc__brand { display:flex; align-items:center; gap:14px; }
.osdoc__brand img { height:48px; }
.osdoc__brand-name { font-family:'Cormorant Garamond',Georgia,serif; font-size:1.5rem; font-weight:700; letter-spacing:.14em; }
.osdoc__brand-name span { color:#c9a24b; }
.osdoc__brand-sub { font-size:.5rem; letter-spacing:.18em; color:#8b8f99; font-weight:700; }
.osdoc__contacts { text-align:right; font-size:.66rem; white-space:nowrap; display:flex; flex-direction:column; gap:3px; }
.osdoc__contacts b { color:#c9a24b; font-size:.5rem; letter-spacing:.16em; margin-right:8px; font-weight:700; }

.osdoc__body { padding:28px 34px 0; }

/* ————— Titre + méta / client ————— */
.osdoc__top { display:flex; flex-direction:row-reverse; justify-content:space-between; gap:24px;
  margin-bottom:22px; flex-wrap:wrap; }
.osdoc__title { text-align:left; }
.osdoc__title h2 { margin:0; font-family:'Cormorant Garamond',Georgia,serif; font-weight:700;
  font-size:2.6rem; letter-spacing:0; color:#191b21; text-transform:capitalize; white-space:nowrap; line-height:1.05; }
.osdoc__title h2.long { font-size:2rem; }
.osdoc__title h2::first-letter { text-transform:uppercase; }
.osdoc__title h2::after { content:''; display:block; width:44px; height:2px; background:#c9a24b; margin-top:8px; }
.osdoc__meta { font-size:.72rem; color:#6d7078; margin-top:10px; }
.osdoc__meta div { margin-bottom:4px; }
.osdoc__meta b { color:#191b21; font-family:'Cormorant Garamond',Georgia,serif; font-size:.92rem; font-weight:600; }
.osdoc__to h5 { margin:0 0 6px; font-size:.56rem; letter-spacing:.2em; color:#a17e2f; font-weight:700; text-transform:uppercase; }
.osdoc__to .name { font-family:'Cormorant Garamond',Georgia,serif; font-size:1.35rem; font-weight:600; margin:0 0 5px; }
.osdoc__to .line { font-size:.74rem; color:#6d7078; }

/* ————— Tableau des prestations ————— */
.osdoc__table { width:100%; border-collapse:collapse; font-size:.8rem; border-top:2px solid #c9a24b; }
.osdoc__table thead th { background:transparent; color:#6d7078; text-align:left; font-size:.56rem;
  letter-spacing:.18em; padding:10px 10px 8px; border-bottom:1px solid #e4dfd2; font-weight:700; }
.osdoc__table thead th.num, .osdoc__table td.num { text-align:right; }
.osdoc__table tbody td { padding:12px 10px; border-bottom:1px solid #e4dfd2; vertical-align:top; }
.osdoc__table tbody td:first-child b { font-family:'Cormorant Garamond',Georgia,serif;
  font-size:1.05rem; font-weight:600; }
.osdoc__table tbody td.num { color:#6d7078; }
.osdoc__table tbody td.num b { color:#191b21; }
.osdoc__table .sub { display:block; font-size:.66rem; color:#8a8d94; margin-top:3px; font-weight:400; }

/* ————— Règlement / totaux ————— */
.osdoc__bottom { display:flex; justify-content:space-between; gap:24px; margin-top:20px; }
.osdoc__pay { font-size:.72rem; color:#6d7078; max-width:46%; }
.osdoc__pay h6 { margin:0 0 5px; font-size:.56rem; letter-spacing:.18em; color:#a17e2f; text-transform:uppercase; }
.osdoc__pay .gold { color:#191b21; font-weight:400; }
.osdoc__totals { min-width:260px; font-size:.78rem; }
.osdoc__totals .row { display:flex; justify-content:space-between; padding:4px 12px; color:#6d7078; }
.osdoc__totals .row span:last-child { color:#191b21; font-weight:700; }
.osdoc__grand { display:flex; justify-content:space-between; align-items:center; background:#101218;
  border-left:3px solid #c9a24b; color:#c9a24b; padding:11px 14px; margin-top:9px;
  font-size:.58rem; letter-spacing:.16em; font-weight:700; }
.osdoc__grand span:last-child { font-family:'Cormorant Garamond',Georgia,serif; color:#fff;
  font-size:1.25rem; letter-spacing:0; font-weight:700; }

/* ————— Ordre de mission ————— */
.osdoc__mission { display:grid; grid-template-columns:1fr 1fr; gap:16px 28px; margin:4px 0 8px; }
.osdoc__mission .cell b { display:block; font-size:.54rem; letter-spacing:.18em; color:#a17e2f;
  margin-bottom:3px; text-transform:uppercase; }
.osdoc__mission .cell span { font-family:'Cormorant Garamond',Georgia,serif; font-size:1.05rem; font-weight:600; }
.osdoc__mission .cell { border-bottom:1px solid #e4dfd2; padding-bottom:9px; }
.osdoc__notes { margin-top:16px; font-size:.76rem; color:#33363d; background:#f7f5ef;
  border-left:3px solid #c9a24b; padding:11px 13px; }

/* ————— Pied éditorial ————— */
.osdoc__wave { margin-top:30px; position:relative; padding:18px 0 0; text-align:center; }
.osdoc__wave .gold { width:80px; height:1px; background:#c9a24b; margin:0 auto 12px; position:relative; }
.osdoc__wave .gold::after { content:''; position:absolute; left:50%; top:-2.5px; width:6px; height:6px;
  border-radius:50%; background:#c9a24b; transform:translateX(-50%); }
.osdoc__wave .night { background:transparent; display:block; padding:0 0 14px; }
.osdoc__wave .night b { display:block; color:#191b21; font-family:'Cormorant Garamond',Georgia,serif;
  font-style:italic; font-weight:600; font-size:1.2rem; }
.osdoc__wave .night small { color:#6d7078; font-size:.6rem; letter-spacing:.06em; }
.osdoc__wave::after { content:'OUI STARS  ·  PREMIUM MOBILITY  ·  OUISTARS.COM'; display:block;
  background:#101218; color:#c9a24b; font-size:.55rem; letter-spacing:.28em; font-weight:700;
  padding:8px 0 9px; border-top:2px solid #c9a24b; }

/* ————— Écran d'accueil tablette (paysage) ————— */
.oswel { position:fixed; inset:0; z-index:3000; background:#101218; color:#fff;
  display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
.oswel::before, .oswel::after { content:''; position:absolute; left:0; right:0; height:5px; background:#c9a24b; }
.oswel::before { top:0; } .oswel::after { bottom:0; }
.oswel__corner { position:absolute; width:34px; height:34px; border:1.5px solid #c9a24b; }
.oswel__corner.tl { top:26px; left:26px; border-right:0; border-bottom:0; }
.oswel__corner.tr { top:26px; right:26px; border-left:0; border-bottom:0; }
.oswel__corner.bl { bottom:26px; left:26px; border-right:0; border-top:0; }
.oswel__corner.br { bottom:26px; right:26px; border-left:0; border-top:0; }
.oswel__brandrow { display:flex; flex-direction:column; align-items:center; gap:10px; }
.oswel__logo { height:62px; display:block; }
.oswel__brand { font-family:'Cormorant Garamond',Georgia,serif; font-size:1.8rem; font-weight:700;
  letter-spacing:.18em; line-height:1; }
.oswel__brand span { color:#c9a24b; }
.oswel__hello { color:#c9a24b; letter-spacing:.5em; font-size:clamp(.65rem,1.4vw,.9rem);
  font-weight:700; margin:5vh 0 2.5vh; }
.oswel__name { font-family:'Cormorant Garamond',Georgia,serif; font-weight:700; line-height:1.02;
  font-size:clamp(2.6rem, 10vw, 8.5rem); max-width:92vw; overflow-wrap:break-word; }
.oswel__rule { width:80px; height:1px; background:#c9a24b; margin:3.5vh auto 2.5vh; position:relative; }
.oswel__rule::after { content:''; position:absolute; left:50%; top:-2.5px; width:6px; height:6px;
  border-radius:50%; background:#c9a24b; transform:translateX(-50%); }
.oswel__sub { color:#c9c7c0; font-family:'Cormorant Garamond',Georgia,serif; font-style:italic;
  font-size:clamp(.9rem,1.9vw,1.25rem); }
.oswel__ref { color:#c9a24b; font-size:clamp(.62rem,1.2vw,.85rem); letter-spacing:.2em; margin-top:1.6vh; font-weight:700; }
.oswel__foot { position:absolute; bottom:3.2vh; left:0; right:0; color:#63666f;
  letter-spacing:.26em; font-size:clamp(.5rem,1vw,.7rem); font-weight:700; }
.oswel__bar { position:absolute; top:18px; right:52px; display:flex; gap:8px; }
.oswel__bar button { border:1px solid rgba(255,255,255,.3); background:rgba(0,0,0,.35); color:#fff;
  border-radius:8px; padding:8px 14px; cursor:pointer; font-size:.85rem; }
@media print { .no-print { display:none !important; } body { background:#fff; } .osdoc { box-shadow:none; } }
`;
