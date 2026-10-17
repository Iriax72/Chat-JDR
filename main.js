// References DOM
const main = document.querySelector('main');
const footer = document.querySelector('footer');

// Obtenir les noeuds a partie de noeuds.json
let noeuds = {};
fetch('./noeuds.json')
    .then(reponse => reponse.json())
    .then(donnees => {
        noeuds = donnees;
        startGame();
    })
    .catch(erreur => {
        console.error("Erreur de chargement :", erreur);
        alert("Impossible de charger le jeu ! Vérifier le fichier JSON.");
    });


function affichePlayerMessage(message) {
    const p = document.createElement('p');
    p.classList.add('player-text');
    p.innerText = message;
    main.appendChild(p);
}

function sendMessage(message) {
    const p = document.createElement('p');
    p.classList.add('MJ-text');
    p.innerText = message;
    main.appendChild(p);
}

function propose(text, next) {
    btn = document.createElement('button');
    btn.innerText = text;
    btn.addEventListener('click', () => {
        affichePlayerMessage(text);
        resolveNoeud(next);
    });
    footer.appendChild(btn);
}

function resolveNoeud(noeud) {
    const waitingDiv = document.createElement('div');
    waitingDiv.classList.add('MJ-text-div');
    waitingDiv.innerText = '...';
    main.appendChild(waitingDiv)
    footer.innerHTML = '';
    setTimeout(() => {
        main.removeChild(waitingDiv);
        sendMessage(noeud.text);
        noeud.choix.forEach(choix => {
            const next = noeuds[choix.next]
            propose(choix.text, next);
        });
    }, noeud.text.length * 100);
}

function startGame() {
    resolveNoeud(noeuds.start);
}