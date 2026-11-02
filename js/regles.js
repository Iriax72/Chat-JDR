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
            resolveDeath = true;
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
