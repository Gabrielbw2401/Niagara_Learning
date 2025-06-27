// Moteur de recherche simple pour les pages HTML du dossier chapters/

const searchBar = document.getElementById('searchBar');
let resultsBox = null;
// Liste des pages à indexer (adapte si besoin)
const pages = [
    "introduction.html",
    "system-vs-emitter.html",
    "modules-niagara.html",
    "parametres-niagara.html",
    "scripts-niagara.html",
    "events-niagara.html",
    "cpu-vs-gpu.html",
    "rendu-niagara.html",
    "blueprint-niagara.html",
    "cas-pratiques-niagara.html",
    "perf-niagara.html",
    "faq-niagara.html"
];

// Récupère et extrait les titres et paragraphes d'une page
function fetchPageData(page) {
    return fetch('chapters/' + page)
        .then(res => res.ok ? res.text() : '')
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const h1 = doc.querySelector('h1') ? doc.querySelector('h1').textContent : '';
            const h2s = Array.from(doc.querySelectorAll('h2')).map(e => e.textContent);
            const ps = Array.from(doc.querySelectorAll('p')).map(e => e.textContent);
            return { page, h1, h2s, ps };
        });
}

// Indexation des pages (une seule fois)
let allPageData = null;
function loadAllPages() {
    if (allPageData) return Promise.resolve(allPageData);
    return Promise.all(pages.map(fetchPageData)).then(data => {
        allPageData = data;
        return data;
    });
}

// Recherche avec score de pertinence
function searchPages(keyword) {
    if (!keyword || keyword.length < 2) return [];
    keyword = keyword.toLowerCase();
    return allPageData.map(data => {
        let score = 0;
        let matches = [];
        if (data.h1 && data.h1.toLowerCase().includes(keyword)) {
            score += 3;
            matches.push(`<strong>H1:</strong> ${highlight(data.h1, keyword)}`);
        }
        data.h2s.forEach(h2 => {
            if (h2.toLowerCase().includes(keyword)) {
                score += 2;
                matches.push(`<strong>H2:</strong> ${highlight(h2, keyword)}`);
            }
        });
        data.ps.forEach(p => {
            if (p.toLowerCase().includes(keyword)) {
                score += 1;
                matches.push(`<strong>Résumé:</strong> ${highlight(p, keyword)}`);
            }
        });
        return score > 0 ? { page: data.page, score, matches } : null;
    }).filter(Boolean).sort((a, b) => b.score - a.score);
}

// Mise en valeur du mot-clé
function highlight(text, keyword) {
    const re = new RegExp(`(${keyword})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
}

// Affichage des résultats
function showResults(results) {
    if (!resultsBox) {
        resultsBox = document.createElement('div');
        resultsBox.className = 'search-results';
        searchBar.parentNode.appendChild(resultsBox);
    }
    if (!results.length) {
        resultsBox.innerHTML = '<div class="search-noresult">Aucun résultat</div>';
        resultsBox.style.display = 'none';
        return;
    }
    resultsBox.innerHTML = results.map(r =>
        `<div class="search-result">
            <a href="chapters/${r.page}">${r.page.replace('.html','').replace(/-/g,' ').replace(/_/g,' ')}</a>
            <span class="score">Score: ${r.score}</span>
            <div class="matches">${r.matches.slice(0,2).join('<br>')}</div>
        </div>`
    ).join('');
    resultsBox.style.display = 'block';
}

// Style minimal pour les résultats (à intégrer dans ton CSS principal si besoin)
if (!document.getElementById('search-style')) {
    const style = document.createElement('style');
    style.id = 'search-style';
    style.textContent = `
    .search-results {
        position: absolute;
        background: #23272b;
        color: #f2f2f2;
        border-radius: 8px;
        box-shadow: 0 4px 24px #0006;
        margin-top: 8px;
        min-width: 320px;
        max-width: 480px;
        z-index: 999;
        padding: 8px 0;
    }
    .search-result {
        padding: 8px 18px;
        border-bottom: 1px solid #222;
    }
    .search-result:last-child { border-bottom: none; }
    .search-result a {
        color: #00d4ff;
        font-weight: bold;
        text-decoration: none;
    }
    .search-result .score {
        float: right;
        color: #7cf7a7;
        font-size: 0.95em;
    }
    .search-result .matches {
        font-size: 0.97em;
        color: #e0e0e0;
        margin-top: 2px;
    }
    .search-noresult {
        padding: 12px 18px;
        color: #f7b07c;
    }
    mark {
        background: #00d4ff55;
        color: inherit;
        border-radius: 2px;
    }
    `;
    document.head.appendChild(style);
}

// Positionne la box sous la barre de recherche
function positionResultsBox() {
    if (!resultsBox) return;
    const rect = searchBar.getBoundingClientRect();
    resultsBox.style.left = rect.left + window.scrollX + "px";
    resultsBox.style.top = rect.bottom + window.scrollY + "px";
    resultsBox.style.width = rect.width + "px";
}
window.addEventListener('resize', positionResultsBox);
window.addEventListener('scroll', positionResultsBox);

// Événement principal
if (searchBar) {
    searchBar.addEventListener('input', function () {
        const keyword = searchBar.value.trim();
        if (keyword.length < 2) {
            if (resultsBox) resultsBox.style.display = 'none';
            return;
        }
        loadAllPages().then(() => {
            const results = searchPages(keyword);
            showResults(results);
            positionResultsBox();
        });
    });
    // Optionnel : cacher les résultats au blur
    searchBar.addEventListener('blur', function () {
        setTimeout(() => { if (resultsBox) resultsBox.innerHTML = ''; }, 200);
    });
}

const navToggle = document.getElementById('nav-toggle');
const nav = document.getElementById('main-nav');
if(navToggle && nav) {
    navToggle.addEventListener('click', function() {
        nav.classList.toggle('open');
    });
}