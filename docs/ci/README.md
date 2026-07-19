# CI GitHub Actions — à activer manuellement

Le jeton utilisé par l'assistant n'a pas le scope `workflow`, GitHub refuse
donc tout push contenant `.github/workflows/*`. Pour activer la CI :

1. Sur GitHub : **Add file → Create new file** → nommez-le
   `.github/workflows/ci.yml`.
2. Collez le contenu de [`ci.yml`](./ci.yml) (dans ce dossier).
3. Commit — la CI (typecheck → lint → tests + gates de couverture → build +
   garde-fous secrets → E2E Playwright) tournera à chaque push et PR.

Alternative : recréer un jeton avec les scopes `repo` + `workflow`, et
l'assistant pourra déplacer ce fichier au bon endroit lui-même.
