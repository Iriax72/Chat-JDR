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
const journalBtn = document.querySelector('#journal');
const mapBtn = document.querySelector('#map');

const mapImg = document.querySelector('#map-img');

// Valeurs arbitraires
const writingTime = 30; // [ms/char]

// Initialisation
let currentnode = localStorage.getItem('currentnode') ?? 'start';
const historique = JSON.parse(localStorage.getItem('historique')) ?? [];
const inventory = JSON.parse(localStorage.getItem('inventory')) ?? ['🗡️', '📝', '🧳'];
const journal = JSON.parse(localStorage.getItem('journal')) ?? [];

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
    localStorage.removeItem('journal');
    localStorage.removeItem('stats');
})

// Obtenir les nodes a partie de nodes.json
// Et lancer la partie
let nodes = {};
fetch('./nodes.json')
    .then(reponse => reponse.json())
    .then(donnees => {
        nodes = donnees;
        historique.forEach(message => {
            const p = document.createElement('p');
            p.innerText = message.text;
            p.classList.add(message.from === 'player' ? 'player-text' : 'MJ-text');
            main.appendChild(p);
        });
        resolvenode(currentnode, localStorage.getItem('currentnode') !== null)
    })
    .catch(error => {
        console.error("Erreur de chargement :", error);
        alert("Impossible de charger le jeu ! Vérifier le fichier JSON. (" + error + ')');
    });

// Event lisiteners
inventoryBtn.addEventListener('click', () => {
    openPopup(inventory, 'inventaire');
});

journalBtn.addEventListener('click', () => {
    openPopup(journal, 'journal');
});

mapBtn.addEventListener('click', () => {
    openPopup([mapImg], 'map');
});

// Utilitaires
function openPopup(listContent, popupName) {
    const d = document.createElement('div');
    d.classList.add('popup');
    listContent.forEach(obj => {
        const s = document.createElement('span');
        if (typeof obj === String) {
            s.innerText = obj;
        } else if (typeof obj === HTMLElement) {
            s.appendChild(obj);
        } else {
            console.error('type de donnée inaffichable');
        }
        d.appendChild(s);
    });
    if (d.innerHTML === '') {
        d.innerText = "Le " + popupName + " est vide";
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

function sendMessage(message, from, sendEffect = false) {
    historique.push({from: from, text: message});
    const p = document.createElement('p');
    p.classList.add(from+'-text');
    if (sendEffect) {
        p.innerText = "";
        main.appendChild(p);
        for (let i = 0; i < message.length; i++) {
            setTimeout(() => {
                p.innerText = message.slice(0, i+1);
            }, i * writingTime);
        }
    } else {
        p.innerText = message;
        main.appendChild(p);
    }
}

function propose(text, next) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.addEventListener('click', () => {
        sendMessage(text, 'player');
        resolvenode(next);
    });
    footer.appendChild(btn);
}

function resolvenode(nodeName, restaurer = false) {
    const node = nodes[nodeName];
    footer.innerHTML = '';
    if (restaurer) {
        node.choix.forEach(choix => {
            if (condition_ok(choix)) {
                propose(choix.text, choix.next);
            }
        });
        return;
    }

    const waitingP = document.createElement('p');
    waitingP.classList.add('MJ-text');
    waitingP.innerText = '...';
    main.appendChild(waitingP)
    setTimeout(() => {
        main.removeChild(waitingP);
        sendMessage(node.text, 'MJ', true);
        setTimeout(() => {
            if (node.stats) {
                appliquerModificationsStats(node.stats);
            }
            if (node.inventory) {
                appliquerModif(node.inventory, inventory);
            }
            if (node.journal) {
                appliquerModif(node.journal, journal);
            }
            node.choix.forEach(choix => {
                if (condition_ok(choix)) {
                    propose(choix.text, choix.next);
                }
            });
            save(nodeName);
        }, node.text.length * writingTime);
    }, node.text.length * writingTime);
}

function condition_ok(choix) {
    if (!choix.condition) return true;
    return choix.condition.every(cond => {
        if (Object.prototype.hasOwnProperty.call(cond, 'inventory')) {
            return inventory.includes(cond.inventory);
        }
        if (Object.prototype.hasOwnProperty.call(cond, 'journal')) {
            return journal.includes(cond.journal);
        }
        console.error(`Condition inconnue dans nodes.json`);
        return false;
    });
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

function appliquerModif(modifs, list) {
    const ret = list;
    modifs.forEach(modification => {
        Object.entries(modification).forEach(([action, objet]) => {
            if (action === 'give') {
                if (!ret.includes(objet)) {
                    ret.push(objet);
                    if (objet === '🗺️') {
                        mapBtn.classList.remove('hidden');
                    }
                }
                return ret;
            }
            if (action === 'remove') {
                const index = ret.indexOf(objet);
                if (index !== -1) {
                    ret.splice(index, 1);
                    if (objet === '🗺️') {
                        mapBtn.classList.add('hidden');
                    }
                }
                return ret;
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

function save(currentnode) {
    localStorage.setItem('currentnode', currentnode);
    localStorage.setItem('historique', JSON.stringify(historique));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('journal', JSON.stringify(journal));
    localStorage.setItem('stats', JSON.stringify(stats));
}