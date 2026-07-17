# Déploiement — ouistars-v2

Ce sandbox cloud ne peut pas joindre GitHub (création de repo) ni Vercel.
Lance depuis ta machine (ton CLI Vercel est déjà connecté) :

## Option A — Preview Vercel directe (le plus rapide, pas besoin de repo)
```bash
cd ouistars-v2
npm install
npx vercel            # répond aux prompts → crée un déploiement PREVIEW
# (ne fais PAS `vercel --prod` : on reste en preview)
```

## Option B — Nouveau repo GitHub + Vercel (avec le CLI gh)
```bash
cd ouistars-v2
gh repo create ouistars-v2 --private --source=. --push   # crée le repo et pousse `main`
npx vercel link       # relie le dossier à un nouveau projet Vercel
npx vercel            # déploiement preview
```

## Variables d'environnement (à ajouter dans Vercel → Settings → Environment Variables)
Voir `.env.example` : VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, etc.
Sans elles, le front et le calculateur fonctionnent ; l'enregistrement Supabase et les PDF nécessitent la config.
