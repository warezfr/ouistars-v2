/**
 * Styles des documents HTML (facture / devis / bon / ordre de mission)
 * — papier clair, ondulations dorées à traits noirs, Manrope — alignés sur les PDF serveur.
 * Exportés en chaîne pour être injectés aussi dans la fenêtre d'impression.
 */

/* Ondulations (SVG inline) — identiques à celles des PDF */
const WAVE_TOP = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 595 70' preserveAspectRatio='none'%3E%3Cpath d='M0,0 L595,0 L595,26 C430,56 180,2 0,44 Z' fill='%23c9a24b'/%3E%3Cpath d='M0,50 C180,8 430,62 595,32' fill='none' stroke='%23101218' stroke-width='1.6'/%3E%3Cpath d='M0,57 C180,15 430,69 595,39' fill='none' stroke='%23a17e2f' stroke-width='1'/%3E%3C/svg%3E")`;
const WAVE_BOTTOM = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 595 80' preserveAspectRatio='none'%3E%3Cpath d='M0,22 C180,-8 420,42 595,8' fill='none' stroke='%23101218' stroke-width='1.6'/%3E%3Cpath d='M0,29 C180,-1 420,49 595,15' fill='none' stroke='%23a17e2f' stroke-width='1'/%3E%3Cpath d='M0,36 C180,6 420,56 595,22 L595,80 L0,80 Z' fill='%23c9a24b'/%3E%3C/svg%3E")`;

export const DOC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;800&display=swap');

.osdoc { background:#fff; color:#191b21; width:210mm; max-width:100%; margin:0 auto;
  font-family:'Manrope','Helvetica Neue',Arial,sans-serif; box-shadow:0 10px 40px rgba(0,0,0,.35);
  position:relative; overflow:hidden; }

/* ————— Papier à en-tête : ondulation dorée + marque sur blanc ————— */
.osdoc__band { position:relative; background:#fff; color:#191b21; display:flex;
  justify-content:space-between; align-items:flex-end; padding:66px 34px 14px; }
.osdoc__band::before { content:''; position:absolute; top:0; left:0; right:0; height:52px;
  background:${WAVE_TOP} center / 100% 100% no-repeat; }
.osdoc__brand { display:flex; align-items:center; gap:14px; }
.osdoc__brand img { height:46px; }
.osdoc__brand-name { font-size:1.2rem; font-weight:800; letter-spacing:.22em; }
.osdoc__brand-name span { color:#a17e2f; }
.osdoc__brand-sub { font-size:.48rem; letter-spacing:.2em; color:#6d7078; font-weight:800; }
.osdoc__contacts { text-align:right; font-size:.66rem; white-space:nowrap; display:flex; flex-direction:column; gap:3px; }
.osdoc__contacts b { color:#a17e2f; font-size:.48rem; letter-spacing:.18em; margin-right:8px; font-weight:800; }

.osdoc__body { padding:22px 34px 0; border-top:1px solid #e4dfd2; margin-top:0; }

/* ————— Titre + méta / client ————— */
.osdoc__top { display:flex; flex-direction:row-reverse; justify-content:space-between; gap:24px;
  margin-bottom:20px; flex-wrap:wrap; }
.osdoc__title { text-align:left; }
.osdoc__title h2 { margin:0; font-weight:800; font-size:1.8rem; letter-spacing:.14em;
  color:#191b21; text-transform:uppercase; white-space:nowrap; line-height:1.05; }
.osdoc__title h2.long { font-size:1.25rem; }
.osdoc__title h2::after { content:''; display:block; width:44px; height:3px; background:#c9a24b; margin-top:9px; }
.osdoc__meta { font-size:.68rem; color:#6d7078; margin-top:10px; }
.osdoc__meta div { margin-bottom:4px; }
.osdoc__meta b { color:#191b21; font-weight:600; font-size:.76rem; }
.osdoc__to h5 { margin:0 0 6px; font-size:.54rem; letter-spacing:.2em; color:#a17e2f; font-weight:800; text-transform:uppercase; }
.osdoc__to .name { font-size:1.05rem; font-weight:800; margin:0 0 5px; }
.osdoc__to .line { font-size:.72rem; color:#6d7078; }

/* ————— Tableau des prestations ————— */
.osdoc__table { width:100%; border-collapse:collapse; font-size:.78rem; border-top:2px solid #c9a24b; }
.osdoc__table thead th { background:transparent; color:#6d7078; text-align:left; font-size:.54rem;
  letter-spacing:.2em; padding:10px 10px 8px; border-bottom:1px solid #e4dfd2; font-weight:800; }
.osdoc__table thead th.num, .osdoc__table td.num { text-align:right; }
.osdoc__table tbody td { padding:12px 10px; border-bottom:1px solid #e4dfd2; vertical-align:top; }
.osdoc__table tbody td:first-child b { font-size:.84rem; font-weight:600; }
.osdoc__table tbody td.num { color:#6d7078; }
.osdoc__table tbody td.num b { color:#191b21; font-weight:800; }
.osdoc__table .sub { display:block; font-size:.64rem; color:#8a8d94; margin-top:3px; font-weight:500; }

/* ————— Règlement / totaux ————— */
.osdoc__bottom { display:flex; justify-content:space-between; gap:24px; margin-top:18px; }
.osdoc__pay { font-size:.7rem; color:#6d7078; max-width:46%; }
.osdoc__pay h6 { margin:0 0 5px; font-size:.54rem; letter-spacing:.2em; color:#a17e2f; text-transform:uppercase; font-weight:800; }
.osdoc__pay .gold { color:#191b21; font-weight:600; }
.osdoc__totals { min-width:260px; font-size:.76rem; }
.osdoc__totals .row { display:flex; justify-content:space-between; padding:4px 12px; color:#6d7078; }
.osdoc__totals .row span:last-child { color:#191b21; font-weight:800; }
.osdoc__grand { display:flex; justify-content:space-between; align-items:center; background:#c9a24b;
  border-bottom:2.5px solid #101218; color:#101218; padding:11px 14px; margin-top:9px;
  font-size:.56rem; letter-spacing:.18em; font-weight:800; }
.osdoc__grand span:last-child { font-size:1.1rem; letter-spacing:.02em; }

/* ————— Ordre de mission ————— */
.osdoc__mission { display:grid; grid-template-columns:1fr 1fr; gap:15px 28px; margin:4px 0 8px; }
.osdoc__mission .cell b { display:block; font-size:.52rem; letter-spacing:.2em; color:#a17e2f;
  margin-bottom:3px; text-transform:uppercase; font-weight:800; }
.osdoc__mission .cell span { font-size:.84rem; font-weight:600; }
.osdoc__mission .cell { border-bottom:1px solid #e4dfd2; padding-bottom:9px; }
.osdoc__notes { margin-top:16px; font-size:.74rem; color:#33363d; background:#f7f5ef;
  border-left:3px solid #c9a24b; padding:11px 13px; }

/* ————— Pied : ondulation dorée à traits noirs ————— */
.osdoc__wave { margin-top:34px; position:relative; height:92px; }
.osdoc__wave .gold { position:absolute; inset:0; clip-path:none;
  background:${WAVE_BOTTOM} center / 100% 100% no-repeat; }
.osdoc__wave .night { position:absolute; left:34px; right:34px; bottom:8px; background:transparent;
  clip-path:none; display:flex; flex-direction:column; justify-content:flex-end; padding:0; }
.osdoc__wave .night b { color:#101218; font-size:.86rem; font-weight:800; }
.osdoc__wave .night small { color:#3d3418; font-size:.58rem; font-weight:600; }
.osdoc__wave::after { content:'OUISTARS.COM'; position:absolute; right:34px; bottom:16px;
  color:#101218; letter-spacing:.22em; font-size:.56rem; font-weight:800; }

/* ————— Écran d'accueil tablette (paysage) ————— */
.oswel { position:fixed; inset:0; z-index:3000; background:#101218; color:#fff;
  font-family:'Manrope','Helvetica Neue',Arial,sans-serif;
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
.oswel__brand { font-size:1.5rem; font-weight:800; letter-spacing:.22em; line-height:1; }
.oswel__brand span { color:#c9a24b; }
.oswel__hello { color:#c9a24b; letter-spacing:.5em; font-size:clamp(.65rem,1.4vw,.9rem);
  font-weight:800; margin:5vh 0 2.5vh; }
.oswel__name { font-weight:800; line-height:1.04; letter-spacing:-.01em;
  font-size:clamp(2.4rem, 9vw, 7.5rem); max-width:92vw; overflow-wrap:break-word; }
.oswel__rule { width:80px; height:1px; background:#c9a24b; margin:3.5vh auto 2.5vh; position:relative; }
.oswel__rule::after { content:''; position:absolute; left:50%; top:-2.5px; width:6px; height:6px;
  border-radius:50%; background:#c9a24b; transform:translateX(-50%); }
.oswel__sub { color:#c9c7c0; font-size:clamp(.82rem,1.7vw,1.1rem); font-weight:600; }
.oswel__ref { color:#c9a24b; font-size:clamp(.62rem,1.2vw,.85rem); letter-spacing:.2em; margin-top:1.6vh; font-weight:800; }
.oswel__foot { position:absolute; bottom:3.2vh; left:0; right:0; color:#63666f;
  letter-spacing:.26em; font-size:clamp(.5rem,1vw,.7rem); font-weight:800; }
.oswel__bar { position:absolute; top:18px; right:52px; display:flex; gap:8px; }
.oswel__bar button { border:1px solid rgba(255,255,255,.3); background:rgba(0,0,0,.35); color:#fff;
  border-radius:8px; padding:8px 14px; cursor:pointer; font-size:.85rem; }
@media print { .no-print { display:none !important; } body { background:#fff; } .osdoc { box-shadow:none; } }
`;
