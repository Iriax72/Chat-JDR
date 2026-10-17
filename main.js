// References DOM
const main = document.querySelector('main');
const footer = document.querySelector('footer');

// Valeurs arbitraires
const writingTime = 30; // [ms/char]

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
    p.innerText = "";
    main.appendChild(p);
    for (let i = 0; i < message.length; i++) {
        setTimeout(() => {
            p.innerText = message.slice(0, i+1);
        }, i * writingTime);
    }
}

function propose(text, next) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.addEventListener('click', () => {
        affichePlayerMessage(text);
        resolveNoeud(next);
    });
    footer.appendChild(btn);
}

function resolveNoeud(noeud) {
    const waitingP = document.createElement('p');
    waitingP.classList.add('MJ-text');
    waitingP.innerText = '...';
    main.appendChild(waitingP)
    footer.innerHTML = '';
    setTimeout(() => {
        main.removeChild(waitingP);
        sendMessage(noeud.text);
        setTimeout(() => {
            noeud.choix.forEach(choix => {
                const next = noeuds[choix.next]
                propose(choix.text, next);
            });
        }, noeud.text.length * writingTime);
    }, noeud.text.length * writingTime);
}

function startGame() {
    resolveNoeud(noeuds.start);
}