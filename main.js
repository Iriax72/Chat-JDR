// References DOM
const main = document.querySelector('main');
const footer = document.querySelector('footer');

function sendMessage(message, waitingTime) {
    const waiting_div = document.createElement('div');
    waiting_div.classList.add('MJ-text-div');
    waiting_div.innerText = '...';
    main.appendChild(waiting_div);
    setTimeout(() => {
        main.removeChild(waiting_div);
        const text_div = document.createElement('div');
        text_div.classList.add('MJ-text-div');
        text_div.innerText = message;
        main.appendChild(text_div);
    }, waitingTime)
}

function propose(text, next) {
    btn = document.createElement('btn');
    btn.innerText = text;
    btn.addEventListener('click', () => {
        alert('soyez redirigés vers' + next);
    });
    footer.appendChild(btn);
}

setTimeout(() => {
    sendMessage('Salut', 2000);
    setTimeout(() => {
        sendMessage('Je suis le vieux sage de l\'antique maison du roi mage (héhéhé...) Tu veux partie a l\'aventure avec moi ?', 4500);
        propose('Oh! oui', 'adventure');
        propose('Nannn', 'end');
    }, 3500)
}, 1500);