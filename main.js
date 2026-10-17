// References DOM
const main = document.querySelector('main');

function sendMessage(message, time) {
    const waiting_div = document.createElement('div');
    waiting_div.classList.add('MJ-text-div');
    waiting_div.innerText = '...';
    main.appendChild(waiting_div);
    setTimeout(time, () => {
        main.removeChild(waiting_div);
    })

    const text_div = document.createElement('div');
    text_div.classList.add('MJ-text-div');
    text_div.innerText = message;
    main.appendChild(text_div);
}

sendMessage('Salut', 1500);

setTimeout(500);

sendMessage('Je suis le vieux sage de l\'antique maison du roi mage (héhéhé...)', 1000);