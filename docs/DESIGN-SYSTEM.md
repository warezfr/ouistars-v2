# Design System

Identité « luxe » : mono-page sombre premium, or champagne comme accent, typographie éditoriale. Tous les tokens vivent dans `src/styles/tokens.css` ; les classes utilitaires dans `src/styles/global.css`.

## Palette

Nuit profonde / or champagne / ivoire.

| Token | Valeur | Usage |
|---|---|---|
| `--os-black` | `#0b0c10` | Fond le plus profond |
| `--os-night` | `#111318` | Fond principal |
| `--os-surface` | `#171a21` | Surfaces / cartes |
| `--os-surface-2` | `#1e222b` | Surfaces surélevées |
| `--os-line` | `#2a2f3a` | Bordures, séparateurs |
| `--os-ivory` | `#f4f1ea` | Texte principal |
| `--os-mut` | `#9aa1ad` | Texte secondaire |
| `--os-mut-2` | `#6b7280` | Texte tertiaire |
| `--os-gold` | `#c9a24b` | Accent or (principal) |
| `--os-gold-soft` | `#e3c988` | Or clair (dégradés, hover) |
| `--os-gold-deep` | `#a17e2f` | Or profond (bordures actives) |
| `--os-success` | `#4ade80` | État succès |
| `--os-warning` | `#f5b13d` | État avertissement |
| `--os-danger` | `#ef5350` | État erreur |

## Typographies

| Token | Police | Rôle |
|---|---|---|
| `--os-font-display` | **Cormorant Garamond** (fallback Playfair Display, Georgia, serif) | Titres, display éditorial |
| `--os-font-sans` | **Inter** (fallback Rubik, system-ui) | Corps, UI |

## Tokens de layout & style

| Token | Valeur |
|---|---|
| `--os-radius` / `--os-radius-sm` / `--os-radius-lg` | `14px` / `10px` / `22px` |
| `--os-shadow` | `0 20px 60px rgba(0,0,0,.45)` |
| `--os-shadow-gold` | `0 10px 40px rgba(201,162,75,.18)` |
| `--os-container` | `1180px` |
| `--os-gutter` | `clamp(20px, 5vw, 64px)` |
| `--os-ease` | `cubic-bezier(.22,1,.36,1)` |

## Composants & utilitaires

| Classe / composant | Rôle |
|---|---|
| `.os-container` | Largeur max `--os-container`, gouttières responsives |
| `.os-section` | Rythme vertical `clamp(56px, 9vw, 120px)` |
| `.os-eyebrow` | Suréti­tre (petite capitale au-dessus des titres) |
| `.os-btn` | Bouton de base |
| `.os-btn--gold` | Variante or (dégradé champagne, hover surélevé + ombre or) |
| `.os-btn--ghost` | Variante contour (bordure `--os-line`, hover or) |
| `.os-card` | Carte surface, hover : bordure or + translation `-4px` |
| `<Reveal>` | Composant (`src/components/ui/Reveal.tsx`) : révèle son contenu à l'entrée dans le viewport via `IntersectionObserver` (seuil 0.12), classe `.os-reveal.is-visible` |

## Principes

- **Sombre par défaut**, l'or n'est jamais un aplat de fond mais un accent (texte, filet, CTA).
- **Hiérarchie éditoriale** : display serif pour l'émotion, sans-serif pour l'information.
- **Micro-interactions sobres** : translations discrètes, transitions via `--os-ease`, révélation au scroll.
- **Espacement fluide** : `clamp()` sur gouttières et sections pour un rendu cohérent mobile → desktop.
</content>
