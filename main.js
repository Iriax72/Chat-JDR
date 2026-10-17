// References DOM
const main = document.querySelector('main');
const footer = document.querySelector('footer');

// Valeurs arbitraires
const writingTime = 30; // [ms/char]

// Initialisation
let currentNoeud = localStorage.getItem('currentNoeud') ?? 'start';
const historique = JSON.parse(localStorage.getItem('historique')) ?? [];
const stats = JSON.parse(localStorage.getItem('stats')) ?? {
    hp: 20,
    frc: 9,
    dext: 16,
    char: 12,
    intel: 15,
    sag: 14,
    constit: 10,
};

// Obtenir les noeuds a partie de noeuds.json
let noeuds = {};
fetch('./noeuds.json')
    .then(reponse => reponse.json())
    .then(donnees => {
        noeuds = donnees;
        startGame();
    })
    .catch(error => {
        console.error("Erreur de chargement :", error);
        alert("Impossible de charger le jeu ! Vérifier le fichier JSON. (" + error + ')');
    });


function affichePlayerMessage(message) {
    historique.push({from: 'player', text: message});
    const p = document.createElement('p');
    p.classList.add('player-text');
    p.innerText = message;
    main.appendChild(p);
}

function sendMessage(message) {
    historique.push({from: 'MJ', text: message});
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

function resolveNoeud(noeudName) {
    save(noeudName);
    const noeud = noeuds[noeudName];
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
                propose(choix.text, choix.next);
            });
        }, noeud.text.length * writingTime);
    }, noeud.text.length * writingTime);
}

function startGame() {
    historique.forEach(message => {
        const p = document.createElement('p');
        p.innerText = message.text;
        p.classList.add(message.from === 'player' ? 'player-text' : 'MJ-text');
        main.appendChild(p);
    });
    resolveNoeud(currentNoeud);
}

function save(currentNoeud) {
    localStorage.setItem('currentNoeud', currentNoeud);
    localStorage.setItem('historique', JSON.stringify(historique));
    localStorage.setItem('stats', JSON.stringify(stats));
}