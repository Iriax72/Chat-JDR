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
const diceImg = document.querySelector('#dice-img');

const defaultInventory = ['🗡️', '📝', '🧳'];
const defaultEnemysHp = {
    "brigands": 4,
    "ours": 2,
    "gobelin_1": 2,
    "gobelin_2": 2,
    "gobelin_3": 3,
    "chef_gobelin": 6,
    "dragon": 10
};

function safeReadJSON(key, fallback) {
    const raw = localStorage.getItem(key);
    if (raw === null) {
        return fallback;
    }
    try {
        const parsed = JSON.parse(raw);
        return parsed === null ? fallback : parsed;
    } catch (error) {
        console.warn(`Données locales invalides pour ${key}:`, error);
        return fallback;
    }
}

// Valeurs arbitraires
const writingTime = 30; // [ms/char]
const thikingTime = 10; // [ms/char]
const rollTime = 3200; // [ms]
const rollInterval = 125; // [ms]

// Initialisation
let isDead = false;
let currentNode = localStorage.getItem('currentNode') ?? 'start';
const historique = Array.isArray(safeReadJSON('historique', [])) ? safeReadJSON('historique', []) : [];
const inventory = Array.isArray(safeReadJSON('inventory', defaultInventory)) ? safeReadJSON('inventory', defaultInventory) : defaultInventory;
const journal = Array.isArray(safeReadJSON('journal', [])) ? safeReadJSON('journal', []) : [];

const enemysHp = { ...defaultEnemysHp, ...safeReadJSON('enemysHp', defaultEnemysHp) };

const statsParDefaut = {
    po: 5,
    hp: 20,
    frc: 8,
    sag: 8,
};
const statsStockees = safeReadJSON('stats', null);
const stats = {
    ...statsParDefaut,
    ...(statsStockees && typeof statsStockees === 'object' && !Array.isArray(statsStockees)
        ? statsStockees
        : {})
};
Object.keys(statsParDefaut).forEach(stat => updateStat(stat, stats[stat]));

function resetGameState() {
    localStorage.removeItem('currentNode');
    localStorage.removeItem('pendingNode');
    localStorage.removeItem('historique');
    localStorage.removeItem('inventory');
    localStorage.removeItem('journal');
    localStorage.removeItem('enemysHp');
    localStorage.removeItem('stats');

    isDead = false;
    currentNode = 'start';
    historique.length = 0;
    inventory.splice(0, inventory.length, ...defaultInventory);
    journal.length = 0;
    Object.keys(enemysHp).forEach(key => delete enemysHp[key]);
    Object.assign(enemysHp, defaultEnemysHp);
    Object.keys(statsParDefaut).forEach(stat => {
        stats[stat] = statsParDefaut[stat];
        updateStat(stat, stats[stat]);
    });
    if (main) main.innerHTML = '';
    if (footer) footer.innerHTML = '';
    if (nodes && Object.prototype.hasOwnProperty.call(nodes, currentNode)) {
        resolveNode(currentNode);
    }
}

crossBtn.addEventListener('click', () => {
    resetGameState();
})

// Obtenir les nodes a partie de nodes.json
// Et lancer la partie
let nodes = {};
fetch('../nodes/hist.json')
    .then(reponse => reponse.json())
    .then(donnees => {
        nodes = donnees;
        historique.forEach(message => {
            const p = document.createElement('p');
            p.classList.add(message.from === 'player' ? 'player-text' : 'MJ-text');
            p.append(message.type === 'text' ? message.message
                : message.type === 'dice' ? createHTMLDice(message.message)
                : 'Erreur, type de message inconnu'
            );
            main.appendChild(p);
        });
        const savedCurrentNode = localStorage.getItem('currentNode');
        const pendingNode = localStorage.getItem('pendingNode');
        if (pendingNode && Object.prototype.hasOwnProperty.call(nodes, pendingNode)) {
            resolveNode(pendingNode);
        } else if (savedCurrentNode && Object.prototype.hasOwnProperty.call(nodes, savedCurrentNode)) {
            resolveNode(savedCurrentNode, true);
        } else {
            resolveNode('setup');
            resolveNode(currentNode);
        }
    })
    .catch(error => {
        console.error("Erreur de chargement :", error);
        alert("Impossible de charger le jeu ! Vérifier le fichier JSON. (" + error + ')');
    });

// Event lisiteners
inventoryBtn.addEventListener('click', () => {
    openPopup(inventory, 'inventaire', 'inventory');
});

journalBtn.addEventListener('click', () => {
    openPopup(journal, 'journal', 'journal');
});

mapBtn.addEventListener('click', () => {
    openPopup([mapImg], 'map', 'map');
});

// Utilitaires
function openPopup(listContent, popupName, className) {
    const d = document.createElement('div');
    d.classList.add('popup', className);
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

function sendMessage(type, message, from, sendEffect = false) {
    if (type === 'text') {
        historique.push({type: type, from: from, message: message});
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
    } else if (type === 'dice') {
        historique.push({type: type, message: message, from: from});
        const p = document.createElement('p');
        p.classList.add(from + '-text');
        main.appendChild(p)
        if (sendEffect) {
            const span = document.createElement('span');
            const dice = createHTMLDice(span);
            dice.classList.add('rolling');
            p.appendChild(dice);
            let time = 0;
            let interval = setInterval(() => {
                time += rollInterval;
                const rdm = Math.floor(Math.random() * 20) + 1;
                span.textContent = rdm;
                if (time > rollTime) {
                    clearInterval(interval);
                    span.textContent = message;
                    dice.classList.remove('rolling');
                }
            }, rollInterval);
        } else {
            p.appendChild(createHTMLDice(message));
        }
    } else {
        console.error('type de message incconu');
    }
}

function createHTMLDice(content = '') {
    const diceContainer = document.createElement('div');
    diceContainer.classList.add('dice-container');
    const dice = diceImg.cloneNode();
    dice.removeAttribute('id');
    const span = document.createElement('span');
    span.append(content);
    diceContainer.appendChild(dice);
    diceContainer.appendChild(span);
    return diceContainer;
}

function propose(text, next) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.addEventListener('click', () => {
        footer.innerHTML = '';
        sendMessage('text', text, 'player');
        if (typeof next === 'string') {
            savePendingNode(next);
            resolveNode(next);
        } else if (
            typeof next === 'object'
            && Object.keys(next).length === 1
            && Object.keys(next)[0] === 'roll'
        ) {
            const roll = next.roll;
            const diceResult = Math.floor(Math.random() * roll.type) + 1;
            const modif = getModif(roll.modif);
            const nextNode = diceResult + modif >= roll.DD
                ? roll['next (success)']
                : roll['next (echec)'];
            sendMessage('dice', diceResult, 'player', true);
            savePendingNode(nextNode);
            setTimeout(() => {
                resolveNode(nextNode);
            }, rollTime);
        } else {
            console.error('next est de type inconnu');
        }
    });
    footer.appendChild(btn);
}

function resolveNode(nodeName, restaurer = false) {
    const node = nodes[nodeName];
    if (restaurer) {
        node.choix.forEach(choix => {
            if (condition_ok(choix.condition)) {
                propose(choix.text, choix.next);
            }
        });
        return;
    }

    const waitingP = document.createElement('p');
    waitingP.classList.add('MJ-text');
    waitingP.innerText = '...';
    main.appendChild(waitingP);
    const text = choice(node.text);
    setTimeout(() => {
        main.removeChild(waitingP);
        sendMessage('text', text, 'MJ', true);
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
            if (isDead) {
                resolveNode('Mort');
                return;
            }
            node.choix.forEach(choix => {
                if (condition_ok(choix.condition)) {
                    propose(choix.text, choix.next);
                }
            });
            save(nodeName);
            localStorage.removeItem('pendingNode');
        }, text.length * writingTime);
    }, text.length * thikingTime);
}

function playRollAnim(roll) {
    const result = Math.floor(Math.random() * roll.type) + 1;
    const diceContainer = document.createElement('div');
    diceContainer.classList.add('dice-container', 'rolling');
    const dice = diceImg.cloneNode();
    dice.removeAttribute('id');
    const span = document.createElement('span');
    diceContainer.appendChild(dice);
    diceContainer.appendChild(span);
    document.body.appendChild(diceContainer);
    let time = 0;
    let interval = setInterval(() => {
        time += rollInterval
        span.textContent = Math.floor(Math.random() * roll.type) + 1
        if (time > rollTime) {
            clearInterval(interval);
            diceContainer.classList.remove('rolling');
            span.textContent = String(result);
            const modif = getModif(roll.modif);
            alert('Resultat du jet de force: ' + String(result + modif) + ',\nDD ' + String(roll.DD));
            if (result + modif >= roll.DD) {
                resolveNode(roll['next (success)']);
            } else {
                resolveNode(roll['next (echec)']);
            }
        }
    }, rollInterval);
}

function condition_ok(condition) {
    if (!condition) return true;
    if (Array.isArray(condition)) {
        return condition.every(singleCondition => condition_ok(singleCondition));
    }
    if (typeof condition !== 'object') {
        console.error('Condition non évaluable');
        return false;
    }
    return Object.entries(condition).every(([condType, cond]) => {
        if (condType === 'inventory') {
            return inventory.includes(cond);
        }
        if (condType === 'journal') {
            return journal.includes(cond);
        }
        if (condType === 'enemy') {
            if (!cond || typeof cond !== 'object') {
                console.error('Condition enemy invalide');
                return false;
            }
            const enemyName = cond.name;
            const enemyHp = enemyName && Object.prototype.hasOwnProperty.call(enemysHp, enemyName)
                ? enemysHp[enemyName]
                : 0;
            const hp = cond.hp;
            if (typeof hp === 'number') {
                return enemyHp === hp;
            }
            if (hp && typeof hp === 'object' && !Array.isArray(hp)) {
                const keys = Object.keys(hp);
                if (keys.length !== 1) {
                    console.error('Condition enemy.hp invalide');
                    return false;
                }
                const key = keys[0];
                if (key === 'min') {
                    return Number(hp.min) <= enemyHp;
                }
                if (key === 'max') {
                    return Number(hp.max) >= enemyHp;
                }
                console.error('clé de cond.enemy.hp inconnue');
                return false;
            }
            console.error('type de cond.enemy.hp inconnu');
            return false;
        }
        if (condType === 'stat') {
            if (!cond || typeof cond !== 'object') {
                console.error('Condition stats invalide');
                return false;
            }
            return Object.entries(cond).every(([stat, value]) => {
                if (!Object.prototype.hasOwnProperty.call(stats, stat)) {
                    return false;
                }
                if (typeof value === 'number') {
                    return value === stats[stat];
                }
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    const keys = Object.keys(value);
                    if (keys.length !== 1) {
                        console.error('condition stat illisible');
                        return false;
                    }
                    const key = keys[0];
                    if (key === 'min') {
                        return Number(value.min) <= stats[stat];
                    }
                    if (key === 'max') {
                        return Number(value.max) >= stats[stat];
                    }
                    console.error('la valeur est illisible');
                    return false;
                }
                console.error('condition non évaluable');
                return false;
            });
        }
        console.error(`Condition inconnue dans nodes.json : ${condType}`);
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
    if (!Array.isArray(modifs)) {
        return list;
    }
    if (modifs.length === 0) {
        list.splice(0, list.length);
        return list;
    }
    modifs.forEach(modification => {
        if (!modification || typeof modification !== 'object') {
            return;
        }
        Object.entries(modification).forEach(([action, objet]) => {
            if (action === 'give') {
                if (!list.includes(objet)) {
                    list.push(objet);
                    if (objet === '🗺️') {
                        mapBtn.classList.remove('hidden');
                    }
                }
                return;
            }
            if (action === 'remove') {
                const index = list.indexOf(objet);
                if (index !== -1) {
                    list.splice(index, 1);
                    if (objet === '🗺️') {
                        mapBtn.classList.add('hidden');
                    }
                }
                return;
            }
            console.error(`Action de modification de l'inventaire inconnue : ${action}`);
        });
    });
    return list;
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
    if (!Object.prototype.hasOwnProperty.call(stats, stat)) {
        console.error(`Stat inconnue : ${stat}`);
        return;
    }
    const safeValue = Number.isFinite(value) ? value : stats[stat] ?? 0;
    stats[stat] = safeValue;
    if (stat === 'hp') {
        if (safeValue <= 0) {
            isDead = true;
        }
        statsSpan[stat].innerText = Math.max(safeValue, 0) + '/20';
        return;
    }
    if (stat === 'po') {
        statsSpan[stat].innerText = Math.max(safeValue, 0);
        return;
    }
    let modif = getModif(safeValue);
    modif = modif >= 0 ? '+' + modif : modif;
    statsSpan[stat].innerText = Math.max(safeValue, 0) + ' (' + modif + ')';
}

function getModif(stat) {
    if (typeof stat === 'number' && Number.isFinite(stat)) {
        return Math.floor((stat - 10) / 2);
    }
    if (typeof stat === 'string' && Object.prototype.hasOwnProperty.call(stats, stat)) {
        return getModif(stats[stat]);
    }
    console.error('stat est de type inconnu');
    return 0;
}

function choice(arr) {
    if (typeof arr === 'string') {
        return arr;
    }
    if (!Array.isArray(arr) || arr.length === 0) {
        return '';
    }
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}

function savePendingNode(nodeName) {
    localStorage.setItem('pendingNode', nodeName);
    save(currentNode);
}

function save(nodeName) {
    currentNode = nodeName;
    localStorage.setItem('currentNode', nodeName);
    localStorage.setItem('historique', JSON.stringify(historique));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('journal', JSON.stringify(journal));
    localStorage.setItem('enemysHp', JSON.stringify(enemysHp));
    localStorage.setItem('stats', JSON.stringify(stats));
}