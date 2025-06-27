const nodes = {
    AddVelocity: {
        label: "AddVelocity",
        params: [
            { name: "vx", label: "Vitesse X", min: -5, max: 5, step: 0.1, value: 1 },
            { name: "vy", label: "Vitesse Y", min: -5, max: 5, step: 0.1, value: 0 }
        ],
        apply: (p, params, t) => {
            // Ajoute une vitesse constante
            return {
                x: p.x + params.vx * t,
                y: p.y + params.vy * t
            };
        }
    },
    GravityForce: {
        label: "GravityForce",
        params: [
            { name: "g", label: "Gravité", min: -10, max: 10, step: 0.1, value: 2 }
        ],
        apply: (p, params, t) => {
            // Applique la gravité sur Y
            return {
                x: p.x,
                y: p.y + 0.5 * params.g * t * t
            };
        }
    },
    CurlNoiseForce: {
        label: "CurlNoiseForce",
        params: [
            { name: "amplitude", label: "Amplitude", min: 0, max: 5, step: 0.1, value: 2 }
        ],
        apply: (p, params, t) => {
            // Mouvement pseudo-aléatoire
            const angle = Math.sin(t + p.x * 0.1) * params.amplitude;
            return {
                x: p.x + Math.cos(angle) * params.amplitude,
                y: p.y + Math.sin(angle) * params.amplitude
            };
        }
    },
    PointAttractor: {
        label: "PointAttractor",
        params: [
            { name: "ax", label: "Attracteur X", min: 50, max: 350, step: 1, value: 200 },
            { name: "ay", label: "Attracteur Y", min: 50, max: 250, step: 1, value: 150 },
            { name: "force", label: "Force", min: 0, max: 5, step: 0.1, value: 1 }
        ],
        apply: (p, params, t) => {
            // Attire le point vers (ax, ay)
            const dx = params.ax - p.x;
            const dy = params.ay - p.y;
            return {
                x: p.x + dx * 0.01 * params.force * t,
                y: p.y + dy * 0.01 * params.force * t
            };
        }
    },
    SpawnRate: {
        label: "SpawnRate",
        params: [
            { name: "rate", label: "Taux de spawn", min: 1, max: 100, step: 1, value: 20 }
        ],
        apply: (p, params, t, i) => {
            // Affiche plus ou moins de particules
            return { x: p.x, y: p.y, visible: i < params.rate };
        }
    },
    ColorOverLife: {
        label: "ColorOverLife",
        params: [
            { name: "r", label: "Rouge", min: 0, max: 255, step: 1, value: 255 },
            { name: "g", label: "Vert", min: 0, max: 255, step: 1, value: 128 },
            { name: "b", label: "Bleu", min: 0, max: 255, step: 1, value: 0 }
        ],
        apply: (p, params, t, i, life, maxLife) => {
            // Couleur évolue sur la vie
            const ratio = life / maxLife;
            return {
                color: `rgb(${Math.round(params.r * ratio)},${Math.round(params.g * ratio)},${Math.round(params.b * ratio)})`
            };
        }
    }
};

const nodeSelect = document.getElementById('node-select');
const paramsForm = document.getElementById('params-form');
const canvas = document.getElementById('niagara-canvas');
const ctx = canvas.getContext('2d');
const pointsCountSelect = document.getElementById('points-count');

let currentNode = nodes.AddVelocity;
let currentParams = {};
let animationId = null;
let spawnMode = 'center';
let spawnPoints = [];

// Remplit le select
for (const key in nodes) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = nodes[key].label;
    nodeSelect.appendChild(opt);
}

// Génère les sliders
function renderParams(node) {
    paramsForm.innerHTML = '';
    node.params.forEach(param => {
        const group = document.createElement('div');
        group.className = 'param-group';
        const label = document.createElement('label');
        label.textContent = param.label;
        label.htmlFor = param.name;
        const input = document.createElement('input');
        input.type = 'range';
        input.id = param.name;
        input.name = param.name;
        input.min = param.min;
        input.max = param.max;
        input.step = param.step;
        input.value = param.value;
        const valueSpan = document.createElement('span');
        valueSpan.textContent = param.value;
        input.addEventListener('input', () => {
            valueSpan.textContent = input.value;
            currentParams[param.name] = parseFloat(input.value);
        });
        group.appendChild(label);
        group.appendChild(input);
        group.appendChild(valueSpan);
        paramsForm.appendChild(group);
        currentParams[param.name] = param.value;
    });
}

function generateSpawnPoints() {
    const particles = parseInt(pointsCountSelect.value, 10);
    spawnPoints = [];
    for (let i = 0; i < particles; i++) {
        if (spawnMode === 'center') {
            spawnPoints.push({ x: 200, y: 150 });
        } else {
            spawnPoints.push({
                x: Math.random() * 360 + 20,
                y: Math.random() * 260 + 20
            });
        }
    }
}

// Events
nodeSelect.addEventListener('change', () => {
    currentNode = nodes[nodeSelect.value];
    renderParams(currentNode);
    refreshAndDraw();
});
paramsForm.addEventListener('input', refreshAndDraw);
pointsCountSelect.addEventListener('change', refreshAndDraw);

const spawnCenterBtn = document.getElementById('spawn-center');
const spawnRandomBtn = document.getElementById('spawn-random');

spawnCenterBtn.addEventListener('click', () => {
    spawnMode = 'center';
    spawnCenterBtn.classList.add('active');
    spawnRandomBtn.classList.remove('active');
    refreshAndDraw();
});
spawnRandomBtn.addEventListener('click', () => {
    spawnMode = 'random';
    spawnRandomBtn.classList.add('active');
    spawnCenterBtn.classList.remove('active');
    refreshAndDraw();
});

function refreshAndDraw() {
    generateSpawnPoints();
    cancelAnimationFrame(animationId);
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = (Date.now() % 2000) / 200;
    const particles = spawnPoints.length;
    for (let i = 0; i < particles; i++) {
        let p = { ...spawnPoints[i] };
        let visible = true;
        let color = "#00d4ff";
        let life = i;
        let maxLife = particles;
        // Paramètres dynamiques
        if (currentNode === nodes.SpawnRate) {
            const res = currentNode.apply(p, currentParams, t, i);
            visible = res.visible !== false;
        } else if (currentNode === nodes.ColorOverLife) {
            const res = currentNode.apply(p, currentParams, t, i, life, maxLife);
            color = res.color || color;
        } else {
            p = currentNode.apply(p, currentParams, t + i * 0.05, i);
        }
        if (visible) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.7;
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(draw);
}

// Init
renderParams(currentNode);
generateSpawnPoints();
draw();