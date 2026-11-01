# TODO - Problèmes restants

Les deux premiers problèmes ont été corrigés :
- le texte de narration accepte désormais des chaînes et des tableaux,
- le fichier [nodes/hist.json](./nodes/hist.json) a été normalisé pour être compatible avec le moteur de jeu.

Ce document recense les problèmes restants, classés par ordre de difficulté de correction (du plus simple au plus complexe).

## 1. La logique des conditions de combat et de stats est incorrecte

- Fichier concerné : [main.js](./main.js)
- Problème : `condition_ok()` évalue les conditions de façon incohérente pour `stat` et `enemy`.
- Exemple : le code teste `value.length === 1` sur un objet, ce qui ne marche pas pour des structures comme `{ "min": 12 }`.
- Autre point : les vérifications sur `enemy.hp` comparent avec les PV du joueur (`stats.hp`) au lieu des PV de l’ennemi (`enemysHp[name]`).
- Impact : les branchements de combat et certaines quêtes ne s’ouvrent pas au bon moment, ce qui casse la progression du jeu.
- Difficulté de correctif : moyenne.

## 2. Le reset d’inventaire est cassé dans `appliquerModif()`

- Fichier concerné : [main.js](./main.js)
- Problème : le code teste `typeof modifs === 'Array'`, alors que `typeof []` vaut `"object"`.
- Impact : le cas “inventaire vide” est jamais déclenché.
- Difficulté de correctif : faible.

## 3. `getModif()` et `updateStat()` peuvent produire des valeurs incohérentes

- Fichier concerné : [main.js](./main.js)
- Problème : il manque une validation robuste des valeurs de stats. Un `undefined`, un `NaN`, ou une donnée incomplète peut remonter dans le calcul de modificateur.
- Impact : certains affichages de stats deviennent faux et des comportements imprévisibles apparaissent.
- Difficulté de correctif : moyenne.

## 4. Le bouton de reset ne réinitialise pas l’état interne du jeu

- Fichier concerné : [main.js](./main.js)
- Problème : le bouton de fermeture supprime les clés localeStorage, mais ne remet pas les variables JavaScript (`isDead`, `historique`, `inventory`, `stats`, `enemysHp`, etc.).
- Impact : l’application peut conserver des états obsolètes en mémoire malgré un apparent reset.
- Difficulté de correctif : moyenne.

## 5. Les valeurs lues dans `localStorage` ne sont pas protégées

- Fichier concerné : [main.js](./main.js)
- Problème : `JSON.parse(...)` est appelé sans `try/catch` sur des données qui peuvent être corrompues, vides ou non conformes.
- Impact : toute donnée locale mal formée peut casser le chargement du jeu au démarrage.
- Difficulté de correctif : moyenne.

## 6. Le moteur de narration souffre de collisions asynchrones

- Fichier concerné : [main.js](./main.js)
- Problème : plusieurs `setTimeout()` et `setInterval()` s’empilent sans protection. Le joueur peut déclencher de nouvelles transitions pendant qu’une ancienne est encore en cours.
- Impact : messages dupliqués, nœuds de dialogue qui se chevauchent, logique de scénario décalée ou fragmentée.
- Difficulté de correctif : élevée.

## 7. Les nœuds du scénario ne sont pas validés avant utilisation

- Fichiers concernés : [main.js](./main.js), [nodes/hist.json](./nodes/hist.json)
- Problème : le code suppose que chaque nœud a une structure complète. Si un nœud manque, est vide, ou porte un mauvais format, le moteur peut planter.
- Impact : certains chemins du jeu sont non fiables, et des nœuds incomplètement définis comme `Ermite` peuvent devenir des points de rupture.
- Difficulté de correctif : élevée.

## 8. La structure du projet mélange trop de responsabilités

- Fichiers concernés : [main.js](./main.js), [nodes/hist.json](./nodes/hist.json)
- Problème : le rendu DOM, la logique de jeu, la persistance locale, la mécanique de combat et la narration sont mélangés dans un même fichier.
- Impact : le code est difficile à maintenir, à tester et à faire évoluer sans casser des branches entières.
- Difficulté de correctif : élevée.

## 9. Il n’existe pas de tests automatiques pour les parcours du jeu

- Fichiers concernés : [main.js](./main.js), [nodes/hist.json](./nodes/hist.json)
- Problème : aucune validation unitaire ou de scénarios ne garantit que les choix, les stats, les inventaires et les conditions restent cohérents.
- Impact : chaque correction a un risque élevé de régression, car le projet n’a pas de garde-fou fonctionnel.
- Difficulté de correctif : élevée.

## 10. Le JSON de scénario reste fragile malgré les corrections de base

- Fichier concerné : [nodes/hist.json](./nodes/hist.json)
- Problème : plusieurs sections du fichier dépendent encore d’une convention implicite très fragile entre tableaux et objets.
- Impact : le code fonctionne seulement si le format est strictement respecté, ce qui rend le scénario difficile à étendre et sujet aux erreurs.
- Difficulté de correctif : élevée.

## Priorité recommandée

1. Corriger les conditions de combat et de stats.
2. Corriger `appliquerModif()` et `getModif()`.
3. Sécuriser l’état local et le reset.
4. Introduire une couche de validation du scénario.
5. Refactorer le moteur de narration et ajouter des tests de régression.
