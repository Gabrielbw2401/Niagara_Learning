// Charge tous les fichiers JSON du dossier ../docs/nodes/ et construit le tableau de données
async function loadGlossary() {
    // Récupère la liste des fichiers via un index (à générer côté serveur ou à la main)
    // Exemple d'index à placer dans ../docs/nodes/index.json :
    // ["add_velocity.json", "apply_force.json", ...]
    const index = await fetch('docs/nodes/index.json').then(r => r.json());
    // Charge tous les fichiers JSON en parallèle
    const files = index.map(file => fetch('docs/nodes/' + file).then(r => r.json()));
    return Promise.all(files);
}

// Génère le DOM alphabétique du glossaire à partir des données
function renderGlossary(data) {
    const root = document.getElementById('glossary-root');
    root.innerHTML = '';
    // Trie les nodes par nom
    data.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    // Regroupe par première lettre
    const groups = {};
    data.forEach(node => {
        const letter = node.name[0].toUpperCase();
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(node);
    });
    // Construit le DOM
    Object.keys(groups).sort().forEach(letter => {
        const section = document.createElement('section');
        section.className = 'letter-group';
        section.dataset.letter = letter;
        const title = document.createElement('div');
        title.className = 'letter-title';
        title.textContent = letter;
        section.appendChild(title);
        groups[letter].forEach(node => {
            const entry = document.createElement('span');
            entry.className = 'glossary-entry';
            // Lien cliquable vers la fiche node
            entry.innerHTML = `<a class="glossary-link" href="${node.link}" target="_blank">${node.name}</a>
                <span class="glossary-tooltip">${node.description}</span>`;
            section.appendChild(entry);
        });
        root.appendChild(section);
    });
}

// Filtre les entrées selon la recherche utilisateur (temps réel)
function filterGlossary(term) {
    term = term.trim().toLowerCase();
    let found = false;
    document.querySelectorAll('.letter-group').forEach(section => {
        let sectionHas = false;
        section.querySelectorAll('.glossary-entry').forEach(entry => {
            const name = entry.querySelector('.glossary-link').textContent.toLowerCase();
            if (name.includes(term)) {
                entry.style.display = '';
                sectionHas = true;
                found = true;
            } else {
                entry.style.display = 'none';
            }
        });
        section.style.display = sectionHas ? '' : 'none';
    });
    document.getElementById('no-result').style.display = found ? 'none' : '';
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', async () => {
    const data = await loadGlossary();
    renderGlossary(data);
    document.getElementById('searchGlossary').addEventListener('input', e => {
        filterGlossary(e.target.value);
    });
});