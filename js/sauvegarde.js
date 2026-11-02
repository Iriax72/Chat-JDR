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
