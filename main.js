// References DOM
const crossBtn = document.querySelector('.cross-btn');
const main = document.querySelector('main');
const footer = document.querySelector('footer');
const statsSpan = {
    po: document.querySelector('#po'),
    hp: document.querySelector('#hp'),
    frc: document.querySelector('#frc'),
    sag: document.querySelector('#sag'),
};
const inventoryBtn = document.querySelector('#inventory');

// Valeurs arbitraires
const writingTime = 30; // [ms/char]

// Initialisation
let currentnode = localStorage.getItem('currentnode') ?? 'start';
const historique = JSON.parse(localStorage.getItem('historique')) ?? [];
const inventory = JSON.parse(localStorage.getItem('inventory')) ?? [];

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
    localStorage.removeItem('currentnode');
    localStorage.removeItem('historique');
    localStorage.removeItem('inventory');
    localStorage.removeItem('stats');
})

// Obtenir les nodes a partie de nodes.json
// Et lancer la partie
let nodes = {};
fetch('./nodes.json')
    .then(reponse => reponse.json())
    .then(donnees => {
        nodes = donnees;
        startGame();
    })
    .catch(error => {
        console.error("Erreur de chargement :", error);
        alert("Impossible de charger le jeu ! Vérifier le fichier JSON. (" + error + ')');
    });

// Event lisiteners
inventoryBtn.addEventListener('click', () => {
    openInventory();
})

// Utilitaires
function openInventory() {
    const d = document.createElement('div');
    d.classList.add('inventory');
    inventory.forEach(obj => {
        const s = document.createElement('span');
        s.classList.add('inventory-obj');
        s.innerText = obj;
        d.appendChild(s);
    });
    if (d.innerHTML === '') {
        d.innerText = "L'inventaire est vide";
    }
    const btn = document.createElement('button');
    btn.classList.add('cross-btn');
    btn.innerText = '(X)';
    btn.addEventListener('click', () => {
        document.body.removeChild(d);
    });
    d.appendChild(btn);
    document.body.appendChild(d);
}

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
        resolvenode(next);
    });
    footer.appendChild(btn);
}

function resolvenode(nodeName, restaurer = false) {
    const node = nodes[nodeName];
    footer.innerHTML = '';
    if (restaurer) {
        node.choix.forEach(choix => {
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
        sendMessage(node.text);
        setTimeout(() => {
            if (node.stats) {
                appliquerModificationsStats(node.stats);
            }
            if (node.inventory) {
                appliquerModifInventory(node.inventory);
            }
            node.choix.forEach(choix => {
                propose(choix.text, choix.next);
            });
            save(nodeName);
        }, node.text.length * writingTime);
    }, node.text.length * writingTime);
}

function appliquerModificationsStats(modifications) {
    Object.entries(modifications).forEach(([stat, modification]) => {
        if (!Object.prototype.hasOwnProperty.call(statsParDefaut, stat)) {
            console.error(`Stat inconnue dans nodes.json : ${stat}`);
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
        console.error(`Modification invalide pour la stat ${stat} dans nodes.json`);
    });
}

function appliquerModifInventory(modifs) {
    modifs.forEach(modification => {
        Object.entries(modification).forEach(([action, objet]) => {
            if (action === 'give') {
                if (!inventory.includes(objet)) {
                    inventory.push(objet);
                }
                return;
            }
            if (action === 'remove') {
                const index = inventory.indexOf(objet);
                if (index !== -1) {
                    inventory.splice(index, 1);
                }
                return;
            }
            console.error(`Action de modification de l'inventaire inconnue : ${action}`);
        });
    });
}

function updateStat(stat, value) {
    stats[stat] = value;
    if (stat === 'hp') {
        statsSpan[stat].innerText = Math.max(value, 0) + '/20';
        return;
    }
    if (stat === 'po') {
        statsSpan[stat].innerText = Math.max(value, 0);
        return;
    }
    let modif = getModif(value);
    modif = modif >= 0 ? '+' + modif : modif;
    statsSpan[stat].innerText = Math.max(value, 0) + ' (' + modif + ')';
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
    resolvenode(currentnode, localStorage.getItem('currentnode') !== null);
}

function save(currentnode) {
    localStorage.setItem('currentnode', currentnode);
    localStorage.setItem('historique', JSON.stringify(historique));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('stats', JSON.stringify(stats));
}