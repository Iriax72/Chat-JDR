# TODO - Problèmes

Ce document recense les problèmes, classés par ordre de difficulté de correction (du plus simple au plus complexe).

## 1. Le moteur de narration souffre de collisions asynchrones

- Fichier concerné : [main.js](./main.js)
- Problème : plusieurs `setTimeout()` et `setInterval()` s’empilent sans protection. Le joueur peut déclencher de nouvelles transitions pendant qu’une ancienne est encore en cours.
- Impact : messages dupliqués, nœuds de dialogue qui se chevauchent, logique de scénario décalée ou fragmentée.
- Difficulté de correctif : élevée.

## 2. Les nœuds du scénario ne sont pas validés avant utilisation

- Fichiers concernés : [main.js](./main.js), [nodes/hist.json](./nodes/hist.json)
- Problème : le code suppose que chaque nœud a une structure complète. Si un nœud manque, est vide, ou porte un mauvais format, le moteur peut planter.
- Impact : certains chemins du jeu sont non fiables, et des nœuds incomplètement définis comme `Ermite` peuvent devenir des points de rupture.
- Difficulté de correctif : élevée.

## 3. La structure du projet mélange trop de responsabilités

- Fichiers concernés : [main.js](./main.js), [nodes/hist.json](./nodes/hist.json)
- Problème : le rendu DOM, la logique de jeu, la persistance locale, la mécanique de combat et la narration sont mélangés dans un même fichier.
- Impact : le code est difficile à maintenir, à tester et à faire évoluer sans casser des branches entières.
- Difficulté de correctif : élevée.

## 4. Il n’existe pas de tests automatiques pour les parcours du jeu

- Fichiers concernés : [main.js](./main.js), [nodes/hist.json](./nodes/hist.json)
- Problème : aucune validation unitaire ou de scénarios ne garantit que les choix, les stats, les inventaires et les conditions restent cohérents.
- Impact : chaque correction a un risque élevé de régression, car le projet n’a pas de garde-fou fonctionnel.
- Difficulté de correctif : élevée.

## 5. Le JSON de scénario reste fragile malgré les corrections de base

- Fichier concerné : [nodes/hist.json](./nodes/hist.json)
- Problème : plusieurs sections du fichier dépendent encore d’une convention implicite très fragile entre tableaux et objets.
- Impact : le code fonctionne seulement si le format est strictement respecté, ce qui rend le scénario difficile à étendre et sujet aux erreurs.
- Difficulté de correctif : élevée.