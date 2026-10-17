// References DOM
const main = document.querySelector('main');

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

setTimeout(() => {
    sendMessage('Salut', 1500)
}, 1000);

setTimeout(() => {
    sendMessage('Je suis le vieux sage de l\'antique maison du roi mage (héhéhé...)', 1000);
}, 500)