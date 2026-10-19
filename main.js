// References DOM
const crossBtn = document.querySelector('#cross-btn');
const main = document.querySelector('main');
const footer = document.querySelector('footer');
const statsSpan = {
    po: document.querySelector('#po'),
    hp: document.querySelector('#hp'),
    frc: document.querySelector('#frc'),
    sag: document.querySelector('#sag'),
};

// Valeurs arbitraires
const writingTime = 30; // [ms/char]

// Initialisation
let currentNoeud = localStorage.getItem('currentNoeud') ?? 'start';
const historique = JSON.parse(localStorage.getItem('historique')) ?? [];
const statsParDefaut = {
    po: 15,
    hp: 20,
    frc: 10,
    sag: 10,
};
const statsStockees = JSON.parse(localStorage.getItem('stats'));
const stats = {
    ...statsParDefaut,
    ...(statsStockees && typeof statsStockees === 'object' && !Array.isArray(statsStockees)
        ? statsStockees
        : {})
};
Object.keys(statsParDefaut).forEach(stat => updateStat(stat, stats[stat]));

crossBtn.addEventListener('click', () => {
    localStorage.removeItem('currentNoeud');
    localStorage.removeItem('historique');
    localStorage.removeItem('stats');
})

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

function resolveNoeud(noeudName, restaurer = false) {
    const noeud = noeuds[noeudName];
    footer.innerHTML = '';
    if (restaurer) {
        noeud.choix.forEach(choix => {
            propose(choix.text, choix.next);
        });
        return;
    }

    const waitingP = document.createElement('p');
    waitingP.classList.add('MJ-text');
    waitingP.innerText = '...';
    main.appendChild(waitingP)
    setTimeout(() => {
        main.removeChild(waitingP);
        sendMessage(noeud.text);
        setTimeout(() => {
            if (noeud.stats) {
                appliquerModificationsStats(noeud.stats);
            }
            noeud.choix.forEach(choix => {
                propose(choix.text, choix.next);
            });
            save(noeudName);
        }, noeud.text.length * writingTime);
    }, noeud.text.length * writingTime);
}

function appliquerModificationsStats(modifications) {
    Object.entries(modifications).forEach(([stat, modification]) => {
        if (!Object.prototype.hasOwnProperty.call(statsParDefaut, stat)) {
            console.error(`Stat inconnue dans noeuds.json : ${stat}`);
            return;
        }
        if (typeof modification === 'number' && Number.isFinite(modification)) {
            updateStat(stat, modification);
            return;
        }
        if (
            modification &&
            typeof modification === 'object' &&
            !Array.isArray(modification) &&
            typeof modification.add === 'number' &&
            Number.isFinite(modification.add)
        ) {
            updateStat(stat, stats[stat] + modification.add);
            return;
        }
        console.error(`Modification invalide pour la stat ${stat} dans noeuds.json`);
    });
}

function updateStat(stat, value) {
    stats[stat] = value;
    if (stat === 'hp') {
        statsSpan[stat].innerText = max(value, 0) + '/20';
        return;
    }
    if (stat === 'po') {
        statsSpan[stat].innerText = max(value, 0);
        return;
    }
    let modif = getModif(value);
    modif = modif >= 0 ? '+' + modif : modif;
    statsSpan[stat].innerText = max(value, 0) + ' (' + modif + ')';
}

function getModif(stat) {
    return Math.floor((stat-10) / 2);
}

function startGame() {
    historique.forEach(message => {
        const p = document.createElement('p');
        p.innerText = message.text;
        p.classList.add(message.from === 'player' ? 'player-text' : 'MJ-text');
        main.appendChild(p);
    });
    resolveNoeud(currentNoeud, localStorage.getItem('currentNoeud') !== null);
}

function save(currentNoeud) {
    localStorage.setItem('currentNoeud', currentNoeud);
    localStorage.setItem('historique', JSON.stringify(historique));
    localStorage.setItem('stats', JSON.stringify(stats));
}