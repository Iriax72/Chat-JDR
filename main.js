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


function sendMessage(message) {
    const text_div = document.createElement('div');
    text_div.classList.add('MJ-text-div');
    text_div.innerText = message;
    main.appendChild(text_div);
}

function propose(text, next) {
    btn = document.createElement('btn');
    btn.innerText = text;
    btn.addEventListener('click', () => {
        resolveNoeud(next);
    });
    footer.appendChild(btn);
}

function resolveNoeud(noeud) {
    const waitingDiv = document.createElement('div');
    waitingDiv.classList.add('MJ-text-div');
    waitingDiv.innerText = '...';
    main.appendChild(waitingDiv)
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