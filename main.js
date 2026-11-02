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
let resolveDeath = false;
let currentNode = localStorage.getItem('currentNode') ?? 'start';
const historique = Array.isArray(safeReadJSON('historique', [])) ? safeReadJSON('historique', []) : [];
const storedInventory = safeReadJSON('inventory', defaultInventory);
const inventory = Array.isArray(storedInventory) && storedInventory.length > 0
    ? storedInventory
    : [...defaultInventory];
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

    resolveDeath = false;
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

// Obtenir les nodes a partie de hist.json
// Et lancer la partie
let nodes = {};
fetch('../nodes/gemini/hist.json')
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
