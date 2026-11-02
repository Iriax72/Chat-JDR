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
