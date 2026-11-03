# Chat-JDR

**Une aventure de jeu de rôle fantastique, racontée comme une conversation.**

Chat-JDR est un petit jeu narratif jouable dans un navigateur. Explorez un royaume, discutez avec ses habitants, acceptez des quêtes et tentez votre chance avec un dé à vingt faces. Le projet est un site statique : pas de compte, de serveur de jeu ni de dépendance à installer.

## Pour les joueurs

### L’aventure

Vous prenez part à une aventure médiévale fantastique autour de l’auberge du Dragon d’or, entre Westelle et Estillon. Les conversations peuvent vous entraîner à la recherche d’une tiare perdue ou dans une expédition contre les gobelins. La forêt, les marécages, la ville et d’autres lieux réservent leurs propres rencontres et détours.

L’histoire se déroule dans une interface de messagerie : le maître du jeu raconte la scène, puis vous choisissez parmi les réponses proposées. Certains choix sont soumis à une condition ou à un jet de dé, et vos décisions peuvent modifier vos caractéristiques, votre inventaire et votre journal de quêtes.

### Comment jouer

1. Ouvrez la page d’accueil et sélectionnez **Jouer**.
2. Lisez le récit, puis choisissez l’une des réponses en bas de l’écran.
3. Consultez vos caractéristiques en haut de la page, et ouvrez l’inventaire ou le journal avec leurs boutons.
4. Quand une action demande un jet, le résultat du d20 est comparé au seuil indiqué par l’histoire. Votre Force ou votre Sagesse peut améliorer vos chances.

La progression est enregistrée dans le stockage local du navigateur. Revenir sur le jeu dans le même navigateur permet donc de reprendre sa partie. **Le bouton `(X)` réinitialise la partie et ramène à l’accueil.**

## Pour les développeurs

### Lancer le jeu en local

Le projet n’a ni étape de compilation ni dépendances npm. Il faut toutefois le servir en HTTP : le jeu charge son scénario avec `fetch`, ce qui ne fonctionne généralement pas en ouvrant directement `index.html` depuis le système de fichiers.

Depuis la racine du dépôt, lancez par exemple :

```bash
python3 -m http.server 8000
```

Puis ouvrez [http://localhost:8000](http://localhost:8000). Pour arrêter le serveur, utilisez `Ctrl+C` dans le terminal.

### Architecture

```text
.
├── index.html                  # Accueil et navigation
├── main.js                     # Initialisation, état et chargement du scénario
├── pages/
│   ├── game.html               # Page de jeu et chargement des scripts
│   └── remerciements.html      # Crédits
├── js/
│   ├── jeu.js                  # Parcours des scènes et choix du joueur
│   ├── regles.js               # Conditions, caractéristiques et effets
│   ├── affichage.js            # Messages, dés, inventaire et journal
│   └── sauvegarde.js           # Sauvegarde dans localStorage
├── nodes/
│   ├── gemini/hist.json        # Scénario actuellement chargé par le jeu
│   └── hist.json               # Autre version du scénario, non chargée
├── css/                        # Feuilles de style
└── assets/                     # Carte et image du dé
```

Le jeu est entièrement côté navigateur. `main.js` charge `nodes/gemini/hist.json`, restaure la progression et relie l’interface aux autres scripts. `jeu.js` affiche une scène puis ses choix ; `regles.js` évalue les conditions et applique les changements ; `affichage.js` construit les éléments de conversation ; `sauvegarde.js` persiste l’état dans `localStorage`.

### Modifier le scénario

Les scènes sont des entrées d’un objet JSON, identifiées par leur nom. Un choix avec `next` sous forme de chaîne renvoie vers une autre scène. Les textes peuvent être une chaîne ou une liste de variantes parmi lesquelles le jeu en choisit une.

```json
{
  "Une rencontre": {
    "text": ["Un voyageur vous interpelle sur la route."],
    "choix": [
      {
        "text": "Lui répondre",
        "next": "La suite",
        "condition": { "stat": { "sag": { "min": 10 } } }
      }
    ],
    "stats": { "hp": { "add": -2 } },
    "inventory": [{ "give": "Potion" }],
    "journal": [{ "give": "Retrouver le voyageur" }]
  }
}
```

Les propriétés de scène suivantes sont prises en charge :

| Propriété | Rôle |
| --- | --- |
| `text` | Texte affiché par le maître du jeu, sous forme de chaîne ou de liste de variantes. |
| `choix` | Réponses proposées. Chaque choix contient `text`, `next` et, facultativement, `condition`. |
| `stats` | Modifications de `hp`, `po`, `frc` ou `sag`. Une valeur numérique remplace la caractéristique ; `{ "add": n }` lui ajoute `n`. |
| `inventory` / `journal` | Liste d’actions `{ "give": "..." }` ou `{ "remove": "..." }`. Une liste vide efface la liste concernée. |
| `enemy` | Modifications des points de vie d’ennemis : `{ "name": "...", "hp": n }` fixe les PV, `{ "name": "...", "hp": { "add": n } }` les modifie, et `{ "name": "...", "reset": true }` restaure la valeur initiale définie dans `main.js`. |

Une `condition` est facultative ; sans elle, le choix est disponible. Les conditions peuvent vérifier la présence d’un objet ou d’une entrée du journal (`inventory`, `journal`), une caractéristique (`stat`) ou les points de vie d’un ennemi (`enemy`). Pour les caractéristiques et les ennemis, utilisez une valeur exacte ou une borne `min` / `max`. Un tableau de conditions signifie qu’elles doivent toutes être vraies.

Pour proposer un jet, donnez à `next` la forme suivante. Le jeu tire un résultat entre 1 et `type`, ajoute le modificateur de la caractéristique, puis compare le total à `DD`.

```json
{
  "text": "Tenter de forcer la porte",
  "next": {
    "roll": {
      "type": 20,
      "DD": 12,
      "modif": "frc",
      "next (success)": "Victoire",
      "next (echec)": "Echec"
    }
  }
}
```

Les modificateurs de caractéristique suivent `floor((valeur - 10) / 2)`. Toute référence dans `next` (scène normale, réussite ou échec) doit correspondre à une clé existante du scénario.

Après une modification du JSON, vérifiez sa syntaxe depuis la racine du dépôt :

```bash
python3 -m json.tool nodes/gemini/hist.json > /dev/null
```

Si vous ajoutez une scène, pensez à vérifier ses conditions, ses effets et toutes les transitions qui y mènent. Le scénario chargé est `nodes/gemini/hist.json` ; modifier `nodes/hist.json` seul ne changera pas l’histoire jouée.

## Licence et crédits

Le code est distribué sous licence [MIT](./LICENSE). L’icône du dé est créditée à [Magnific sur Flaticon](https://www.flaticon.com/free-icons/d20). Les fichiers dans `/nodes/gemini/` ainsi qur `/assets/map.jpg` sont générés par IA (``Gemini 3``), basés sur le fichiers `/nodes/hist.json`. Le reste a été fait par Léandre Touma, assisté de ``Gemini 3`` et de ``GitHub Copilot``. Ce `README.md` est, mis-à-part ce dernier paragraphe, généré par ``GitHub Copilot``