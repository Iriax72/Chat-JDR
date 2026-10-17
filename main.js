// References DOM
const main = document.querySelector('main');
const footer = document.querySelector('footer');

// Obtenir les noeuds a partie de noeuds.json
let noeuds = {};
fetch('./noeuds.json')
    .then(reponse => reponse.json())
    .then(donnees => {
        noeuds = donnees;
    })
    .catch(erreur => {
        console.error("Erreur de chargement :", erreur);
        alert("Impossible de charger le jeu ! Vérifier le fichier JSON.");
    });


function sendMessage(message) {
    /*const waiting_div = document.createElement('div');
    waiting_div.classList.add('MJ-text-div');
    waiting_div.innerText = '...';
    main.appendChild(waiting_div);
    setTimeout(() => {
        main.removeChild(waiting_div);
    */
    const text_div = document.createElement('div');
    text_div.classList.add('MJ-text-div');
    text_div.innerText = message;
    main.appendChild(text_div);
    /*}, waitingTime)*/
}

function propose(text, next) {
    btn = document.createElement('btn');
    btn.innerText = text;
    btn.addEventListener('click', () => {
        alert('soyez redirigés vers' + next);
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
            propose(choix.text, choix.next);
        });
    }, noeud.text.length * 100);
}

/*
setTimeout(() => {
    sendMessage('Salut', 2000);
    setTimeout(() => {
        sendMessage('Je suis le vieux sage de l\'antique maison du roi mage (héhéhé...) Tu veux partie a l\'aventure avec moi ?', 4500);
        propose('Oh! oui', 'adventure');
        propose('Nannn', 'end');
    }, 3500)
}, 1500);
*/

resolveNoeud(noeuds.start);