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
const thikingTime = 10; // [ms/char]

// Initialisation
let currentnode = localStorage.getItem('currentnode') ?? 'start';
const historique = JSON.parse(localStorage.getItem('historique')) ?? [];
const inventory = JSON.parse(localStorage.getItem('inventory')) ?? ['🗡️', '📝', '🧳'];
const journal = JSON.parse(localStorage.getItem('journal')) ?? [];

const enemysHp = JSON.parse(localStorage.getItem('enemysHp')) ?? {
    "brigands": 4
}

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
    localStorage.removeItem('enemysHp');
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
        if (typeof obj === 'string') {
            s.textContent = obj;
        } else if (obj instanceof HTMLElement) {
            s.appendChild(obj.cloneNode(true));
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
        if (typeof next === 'string') {
            resolvenode(next);
        } else if (
            typeof next === 'object'
            && Object.keys(next).length === 1
            && Object.keys(next)[0] === 'roll'
        ) {
            playRollAnim(next.roll);
        } else {
            console.error('next est de type inconnu');
        }
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
            if (node.enemy) {
                appliquerModifEnemys(node.enemy);
            }
            node.choix.forEach(choix => {
                if (condition_ok(choix.condition)) {
                    propose(choix.text, choix.next);
                }
            });
            save(nodeName);
        }, node.text.length * writingTime);
    }, node.text.length * thikingTime);
}

function playRollAnim(roll) {
    const result = Math.ceil(Math.random() * roll.type) + getModif(roll.modif);
    alert('Resultat du jet de force: ' + String(result) + ',\nDD ' + String(roll.DD));
    if (result >= roll.DD) {
        resolvenode(roll['next (success)']);
    } else {
        resolvenode(roll['next (echec)']);
    }
}

function condition_ok(condition) {
    if (!condition) return true;
    return Object.entries(condition).every(([condType, cond]) => {
        if (condType === 'inventory') {
            return inventory.includes(cond);
        }
        if (condType === 'journal') {
            return journal.includes(cond);
        }
        if (condType === 'enemy') {
            const hp = cond.hp;
            if (typeof hp === 'number') {
                return enemysHp[cond.name] === hp;
            } else if (typeof hp === 'object' && Object.keys(hp).length === 1) {
                if (Object.keys(hp)[0] === 'min') {
                    return hp.min <= stats.hp
                } else if (Object.keys(hp)[0] === 'max') {
                    return hp.max >= stats.hp
                } else {
                    console.error("clé de cond.enemy.hp inconnue");
                }
            } else {
                console.error('type de cond.enemy.hp inconnu');
            }
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

function appliquerModifEnemys(modifs) {
    modifs.forEach(modif => {
        const name = modif.name;
        const hp = modif.hp;
        if (typeof hp === 'number') {
            enemysHp[name] = hp
        } else if (
            typeof hp === 'object'
            && typeof hp.add === 'number'
        ) {
            enemysHp[name] = enemysHp[name] + hp.add;
        } else {
            console.error('type de hp inconnu');
        }
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
    if (typeof stat === 'number') {
        return Math.floor((stat-10) / 2);
    } else if (typeof stat === 'string' && Object.keys(stats).includes(stat)) {
        return getModif(stats[stat]);
    }
    console.error('stat est de type inconnu');
}

function save(currentnode) {
    localStorage.setItem('currentnode', currentnode);
    localStorage.setItem('historique', JSON.stringify(historique));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('journal', JSON.stringify(journal));
    localStorage.setItem('enemysHp', JSON.stringify(enemysHp));
    localStorage.setItem('stats', JSON.stringify(stats));
}