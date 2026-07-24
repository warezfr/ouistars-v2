import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import GoldWaves from '@/components/ui/GoldWaves';
import './legal.css';

/**
 * Pages légales (mentions légales, confidentialité RGPD, cookies).
 * Contenu volontairement en français (obligations FR). Les valeurs entre
 * crochets […] sont des PLACEHOLDERS à compléter par l'éditeur.
 */
type Doc = 'legal' | 'privacy' | 'cookies';

const goHome = () => { window.location.href = '/'; };

export default function LegalPage({ doc }: { doc: Doc }) {
  const content = doc === 'legal' ? <Legal /> : doc === 'privacy' ? <Privacy /> : <Cookies />;
  const title = doc === 'legal' ? 'Mentions légales'
    : doc === 'privacy' ? 'Politique de confidentialité'
    : 'Politique de gestion des cookies';

  return (
    <>
      <GoldWaves />
      <Nav onBook={goHome} />
      <main className="os-legal">
        <div className="os-legal__wrap">
          <p className="os-legal__eyebrow">Oui Stars</p>
          <h1 className="os-legal__title">{title}</h1>
          <p className="os-legal__updated">Dernière mise à jour : [date à compléter]</p>
          <div className="os-legal__body">{content}</div>
          <p className="os-legal__back"><a href="/">← Retour à l’accueil</a></p>
        </div>
      </main>
      <Footer onJoin={goHome} />
    </>
  );
}

/* ————————————————————————— Mentions légales ————————————————————————— */
function Legal() {
  return (
    <>
      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>www.ouistars.com</strong> est édité par&nbsp;:<br />
        <strong>[Raison sociale — ex. Oui Stars SAS]</strong><br />
        Forme juridique&nbsp;: [SAS / SARL / EI…]<br />
        Capital social&nbsp;: [montant] €<br />
        Siège social&nbsp;: [adresse complète du siège]<br />
        SIRET&nbsp;: [n° SIRET] — RCS [ville] [n°]<br />
        N° TVA intracommunautaire&nbsp;: [FR…]<br />
        Téléphone&nbsp;: +33&nbsp;6&nbsp;51&nbsp;03&nbsp;03&nbsp;06<br />
        E-mail&nbsp;: info@ouistars.com
      </p>

      <h2>Directeur de la publication</h2>
      <p>[Nom du directeur de la publication].</p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par&nbsp;:<br />
        <strong>GoDaddy.com, LLC</strong> — 2155 E. GoDaddy Way, Tempe, Arizona 85284, États-Unis.<br />
        Site&nbsp;: <a href="https://www.godaddy.com" target="_blank" rel="noopener noreferrer">www.godaddy.com</a>
      </p>
      <p>
        Les données (base et fichiers) sont stockées chez&nbsp;: <strong>Supabase</strong>
        (Supabase, Inc.), infrastructure située dans l’Union européenne.
      </p>

      <h2>Activité</h2>
      <p>
        Oui Stars propose des services de transport de personnes avec chauffeur (VTC),
        d’accueil aéroportuaire (Meet&nbsp;&amp;&nbsp;Greet), de gestion de destination (DMC)
        et de mobilité événementielle.
        [Le cas échéant&nbsp;: N° d’inscription au registre VTC / autorisation préfectorale à compléter.]
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L’ensemble des éléments du site (textes, visuels, logo, charte graphique, code)
        est protégé par le droit de la propriété intellectuelle et demeure la propriété
        exclusive de l’éditeur, sauf mention contraire. Toute reproduction non autorisée
        est interdite.
      </p>

      <h2>Responsabilité</h2>
      <p>
        L’éditeur s’efforce d’assurer l’exactitude des informations diffusées mais ne
        saurait être tenu responsable des erreurs, omissions ou indisponibilités du site.
      </p>

      <h2>Médiation et litiges</h2>
      <p>
        Conformément à l’article L.612-1 du Code de la consommation, le consommateur peut
        recourir gratuitement à un médiateur&nbsp;: [nom et coordonnées du médiateur à compléter].
        Tout litige relève du droit français.
      </p>
    </>
  );
}

/* ———————————————————— Politique de confidentialité (RGPD) ———————————————————— */
function Privacy() {
  return (
    <>
      <p>
        La présente politique décrit la manière dont Oui Stars collecte et traite vos
        données personnelles, conformément au Règlement (UE) 2016/679 (RGPD) et à la loi
        « Informatique et Libertés ».
      </p>

      <h2>Responsable de traitement</h2>
      <p>
        [Raison sociale], [adresse du siège] — Contact&nbsp;:
        <a href="mailto:info@ouistars.com"> info@ouistars.com</a>.
      </p>

      <h2>Données collectées et finalités</h2>
      <p>Nous collectons uniquement les données nécessaires aux finalités suivantes&nbsp;:</p>
      <ul>
        <li>
          <strong>Réservations et devis</strong>&nbsp;: nom, prénom, e-mail, téléphone,
          adresses de prise en charge et de destination, dates et détails du trajet —
          afin de traiter votre demande et d’exécuter la prestation.
        </li>
        <li>
          <strong>Demandes de contact</strong>&nbsp;: coordonnées et contenu du message —
          afin de vous répondre.
        </li>
        <li>
          <strong>Candidatures chauffeurs</strong>&nbsp;: identité, coordonnées, carte
          professionnelle VTC, permis de conduire, pièce d’identité, RIB, Kbis, assurance,
          informations et photos du véhicule — afin d’étudier la candidature et, le cas
          échéant, de contractualiser. Ces documents peuvent constituer des données
          sensibles&nbsp;; ils sont conservés dans un espace de stockage privé à accès restreint.
        </li>
      </ul>

      <h2>Base légale</h2>
      <p>
        Les traitements reposent sur l’exécution de mesures précontractuelles ou du contrat
        (réservations, candidatures), sur votre consentement (formulaires de contact) et
        sur notre intérêt légitime (sécurité, gestion de l’activité).
      </p>

      <h2>Destinataires</h2>
      <p>
        Vos données sont destinées aux services habilités d’Oui Stars et à ses
        sous-traitants techniques agissant pour son compte&nbsp;: <strong>Supabase</strong>
        (hébergement base de données et fichiers, UE), <strong>Zoho / ZeptoMail</strong>
        (envoi d’e-mails), <strong>GoDaddy</strong> (hébergement du site). Elles ne sont
        jamais vendues à des tiers.
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Les données de réservation sont conservées le temps nécessaire à la prestation puis
        archivées conformément aux obligations légales (notamment comptables, jusqu’à
        10&nbsp;ans pour les factures). Les candidatures non retenues sont conservées
        [durée — ex. 2 ans] puis supprimées. Les demandes de contact sont conservées
        [durée — ex. 1 an].
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation,
        d’opposition et de portabilité de vos données, ainsi que du droit de retirer votre
        consentement. Pour les exercer&nbsp;: <a href="mailto:info@ouistars.com">info@ouistars.com</a>.
        Vous pouvez également introduire une réclamation auprès de la CNIL
        (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>).
      </p>

      <h2>Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées
        (chiffrement HTTPS, contrôle d’accès, stockage privé des pièces sensibles) pour
        protéger vos données.
      </p>
    </>
  );
}

/* ————————————————————————— Cookies ————————————————————————— */
function Cookies() {
  return (
    <>
      <p>
        Le site www.ouistars.com utilise un stockage strictement nécessaire à son
        fonctionnement et <strong>ne dépose aucun cookie de suivi ni de publicité</strong>.
        Aucun consentement préalable n’est donc requis pour naviguer.
      </p>

      <h2>Stockage utilisé</h2>
      <ul>
        <li><strong>os-lang</strong>&nbsp;: mémorise la langue choisie (stockage local).</li>
        <li><strong>ouistars-admin-theme</strong>&nbsp;: mémorise le thème clair/sombre du
          back-office (stockage local, réservé aux administrateurs).</li>
        <li>
          Lors de la connexion au back-office, un jeton de session technique est stocké
          localement par notre prestataire d’authentification (Supabase) — strictement
          nécessaire à la sécurité de la connexion.
        </li>
      </ul>

      <p>
        Ces éléments sont fonctionnels et n’assurent aucun pistage. Si, à l’avenir, des
        outils de mesure d’audience ou de marketing étaient ajoutés, cette page serait mise
        à jour et un bandeau de consentement serait affiché.
      </p>

      <h2>Gestion</h2>
      <p>
        Vous pouvez à tout moment effacer le stockage local via les réglages de votre
        navigateur (« Effacer les données de navigation »).
      </p>
    </>
  );
}
