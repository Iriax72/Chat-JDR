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
            if (resolveDeath) {
                resolveNode('Mort');
                resolveDeath = false;
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

/*
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
*/

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
