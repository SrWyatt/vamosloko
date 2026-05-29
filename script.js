const menuBtn = document.getElementById('menu-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const navbar = document.querySelector('.navbar');
const scrollTopBtn = document.getElementById('scroll-to-top');
const postsContainer = document.getElementById('posts-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const headerTitle = document.getElementById('main-header');

let lastScrollY = window.scrollY;
let globalPosts = [];
let historyByYear = {};
let currentSortOrder = 'newToOld';

let SEASONS_LIST = [];
let activeSeasonIndex = 0;

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        dropdownMenu.classList.toggle('active');
    });
}

window.addEventListener('scroll', () => {
    if (window.scrollY > lastScrollY && window.scrollY > 80) {
        if (navbar) navbar.style.transform = 'translateY(-100%)';
        if (dropdownMenu) dropdownMenu.classList.remove('active');
    } else {
        if (navbar) navbar.style.transform = 'translateY(0)';
    }
    lastScrollY = window.scrollY;

    if (window.scrollY > 200) {
        if (scrollTopBtn) scrollTopBtn.classList.add('show');
    } else {
        if (scrollTopBtn) scrollTopBtn.classList.remove('show');
    }
});

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

const views = {
    home: document.getElementById('view-home'),
    post: document.getElementById('view-post'),
    page: document.getElementById('view-page')
};

function switchView(viewName) {
    Object.values(views).forEach(v => {
        if (v) v.classList.remove('active');
    });
    if (views[viewName]) views[viewName].classList.add('active');
    window.scrollTo(0, 0);
    if (headerTitle) headerTitle.style.display = viewName === 'home' ? 'block' : 'none';
}

function handleRoute() {
    const route = window.location.hash.replace('#', '');
    if (route === '' || route === '/') {
        switchView('home');
        return;
    }
    if (/^\d{3}$/.test(route)) {
        renderPost(route);
        return;
    }
    switchView('home');
}

function calculateTimezones(dateStr, timeStr) {
    try {
        let dStr = String(dateStr || "");
        let tStr = String(timeStr || "");
        let nums = (dStr + " " + tStr).match(/\d+/g);
        if (!nums || nums.length < 5) return { sv: (dStr + " " + tStr).trim(), ru: "ERROR FORMATO" };

        let day = parseInt(nums[0], 10);
        let month = parseInt(nums[1], 10);
        let year = parseInt(nums[2], 10);
        if (year < 100) year += 2000;
        let hour = parseInt(nums[3], 10);
        let minute = parseInt(nums[4], 10);

        const pad = n => n.toString().padStart(2, '0');
        let svString = `${pad(day)}/${pad(month)}/${year} - ${pad(hour)}:${pad(minute)}`;
        hour += 9;
        
        if (hour >= 24) {
            hour -= 24;
            day += 1;
            let daysInMonth = new Date(year, month, 0).getDate();
            if (day > daysInMonth) {
                day = 1;
                month += 1;
                if (month > 12) { month = 1; year += 1; }
            }
        }

        let ruString = `${pad(day)}/${pad(month)}/${year} - ${pad(hour)}:${pad(minute)}`;
        return { sv: svString, ru: ruString };
    } catch (e) {
        return { sv: "ERROR", ru: "ERROR FORMATO" };
    }
}

function createCardHTML(post) {
    const imgHTML = post.portada 
        ? `<img src="${post.portada}" onerror="this.outerHTML='<div class=\\'no-media\\'>NO MEDIA</div>'">`
        : `<div class="no-media">NO MEDIA</div>`;
    const times = calculateTimezones(post.date, post.time);
    
    const isPinned = post.pin === true || post.pin === "true";
    const pinHTML = isPinned ? `<div class="pin-label"><span class="svg-icon icon-star-shooting" style="color: gold; width: 16px; height: 16px;"></span> Destacado</div>` : '';

    return `
        <a href="#${post.id_str}" class="post-card" data-title="${post.title.toLowerCase()}" data-id="${post.id_str}">
            <div class="card-img-container">${pinHTML}${imgHTML}</div>
            <div class="card-main-content">
                <h3 class="card-title">${post.title}</h3>
                <p class="card-desc">${post.desc}</p>
            </div>
            <div class="card-side-info">
                <span class="card-id">#${post.id_str}</span>
                <div class="card-date-block">
                    <img src="icons/sv.webp" alt="SV" class="flag-img">
                    <span class="card-date">${times.sv}</span>
                </div>
                <div class="card-date-block">
                    <img src="icons/ru.webp" alt="RU" class="flag-img">
                    <span class="card-date">${times.ru}</span>
                </div>
            </div>
        </a>
    `;
}

function buildHistorySidebar() {
    const accordion = document.getElementById('history-accordion');
    if (!accordion) return;
    accordion.innerHTML = '';
    const years = Object.keys(historyByYear).sort((a, b) => b - a);

    years.forEach(year => {
        const btn = document.createElement('button');
        btn.className = 'year-btn';
        btn.innerHTML = `${year} <span>▼</span>`;
        const content = document.createElement('div');
        content.className = 'history-content';
        
        historyByYear[year].forEach(post => {
            const nums = String(post.date).match(/\d+/g);
            const shortDate = (nums && nums.length >= 2) ? `${nums[0].padStart(2, '0')}/${nums[1].padStart(2, '0')}` : post.date;
            content.innerHTML += `
                <a href="#${post.id_str}" class="history-item">
                    <span>#${post.id_str}</span> ${shortDate}
                </a>
            `;
        });

        btn.addEventListener('click', () => {
            content.classList.toggle('active');
            btn.innerHTML = content.classList.contains('active') ? `${year} <span>▲</span>` : `${year} <span>▼</span>`;
        });

        accordion.appendChild(btn);
        accordion.appendChild(content);
    });
}

function renderPost(idStr) {
    const post = globalPosts.find(p => p.id_str === idStr);
    if(post) {
        const times = calculateTimezones(post.date, post.time);
        const idContainer = document.getElementById('single-post-id');
        const dateContainer = document.getElementById('single-post-date');
        const titleContainer = document.getElementById('single-post-title');
        const imgContainer = document.getElementById('single-post-image-container');
        const bodyContainer = document.getElementById('single-post-body');

        if(idContainer) idContainer.innerText = `#${post.id_str}`;
        if(dateContainer) dateContainer.innerHTML = `
            <span><img src="icons/sv.webp" alt="SV" class="flag-img"> ${times.sv}</span>
            <span><img src="icons/ru.webp" alt="RU" class="flag-img"> ${times.ru}</span>
        `;
        if(titleContainer) titleContainer.innerText = post.title;
        if(imgContainer) {
            let imgHtml = post.portada 
                ? `<img src="${post.portada}" onerror="this.outerHTML='<div class=\\'no-media\\'>NO MEDIA</div>'">`
                : `<div class="no-media">NO MEDIA</div>`;
            
            if (post.portada && post.creditos && post.creditos.trim() !== "") {
                imgHtml += `<span class="image-credit">${post.creditos}</span>`;
            }
            imgContainer.innerHTML = imgHtml;
        }
        if(bodyContainer) {
            bodyContainer.innerHTML = '';
            if (post.body && Array.isArray(post.body)) {
                post.body.forEach(item => {
                    if (item.type === 'parrafo') {
                        bodyContainer.innerHTML += `<p>${item.content}</p>`;
                    } else if (item.type === 'imagen') {
                        let imgItem = `<div class="body-image-wrapper"><img src="${item.content}" onerror="this.style.display='none'">`;
                        if (item.creditos && item.creditos.trim() !== "") {
                            imgItem += `<span class="image-credit">${item.creditos}</span>`;
                        }
                        imgItem += `</div>`;
                        bodyContainer.innerHTML += imgItem;
                    } else if (item.type === 'subtitulo') {
                        bodyContainer.innerHTML += `<h3>${item.content}</h3>`;
                    }
                });
            }
        }
        switchView('post');
    } else {
        switchView('home');
    }
}

function executeSearch() {
    if (!searchInput) return;
    const term = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.post-card');
    cards.forEach(card => {
        const title = card.getAttribute('data-title');
        const id = card.getAttribute('data-id');
        if (title && id) {
            if (title.includes(term) || id.includes(term)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

if (searchBtn) searchBtn.addEventListener('click', executeSearch);
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeSearch();
    });
}

function renderPostList() {
    if (!postsContainer) return;
    postsContainer.innerHTML = '';
    
    let sortedPosts = [...globalPosts];
    sortedPosts.sort((a, b) => {
        const pinA = (a.pin === true || a.pin === "true") ? 1 : 0;
        const pinB = (b.pin === true || b.pin === "true") ? 1 : 0;
        
        if (pinA !== pinB) {
            return pinB - pinA;
        }
        
        const idA = parseInt(a.id_str, 10);
        const idB = parseInt(b.id_str, 10);
        
        if (pinA === 1 && pinB === 1) {
            return idB - idA;
        }
        
        if (currentSortOrder === 'newToOld') {
            return idA - idB;
        } else {
            return idB - idA;
        }
    });

    sortedPosts.forEach(post => {
        postsContainer.innerHTML += createCardHTML(post);
    });
}

const sortToggleBtn = document.getElementById('sort-toggle-btn');
const sortIcon = document.getElementById('sort-icon');
const sortText = document.getElementById('sort-text');

if (sortToggleBtn) {
    sortToggleBtn.addEventListener('click', () => {
        if (currentSortOrder === 'newToOld') {
            currentSortOrder = 'oldToNew';
            sortIcon.className = 'svg-icon icon-pan-down';
            sortText.textContent = 'Más antiguo';
        } else {
            currentSortOrder = 'newToOld';
            sortIcon.className = 'svg-icon icon-pan-up';
            sortText.textContent = 'Más reciente';
        }
        renderPostList();
    });
}

async function loadPosts() {
    if (!postsContainer) return;
    postsContainer.innerHTML = '';
    globalPosts = [];
    historyByYear = {};
    let currentFetchId = 1;

    while (true) {
        const idStr = String(currentFetchId).padStart(3, '0');
        try {
            const res = await fetch(`entrada/${idStr}.json?t=${Date.now()}`);
            if (!res.ok) break;
            const data = await res.json();
            if (!data || !data.id_str) break;
            globalPosts.unshift(data);
            const nums = String(data.date).match(/\d+/g);
            let year = "OTRO";
            if (nums && nums.length >= 3) {
                year = nums[2].length === 2 ? `20${nums[2]}` : nums[2];
            }
            if (!historyByYear[year]) historyByYear[year] = [];
            historyByYear[year].push(data);
            currentFetchId++;
        } catch {
            break;
        }
    }

    renderPostList();
    buildHistorySidebar();
    handleRoute();
}

async function loadAvailableSeasons() {
    SEASONS_LIST = [{ label: "Actual", dataPath: "equipo/cifras.json" }];
    const currentYear = new Date().getFullYear();
    
    for (let y = currentYear + 1; y >= 2023; y--) {
        const label = `${y}-${y + 1}`;
        const path = `equipo/historial/${label}.json`;
        try {
            const res = await fetch(path);
            if (res.ok) {
                SEASONS_LIST.push({ label: label, dataPath: path });
            }
        } catch (e) {
        }
    }
}

async function loadDashboard(idx = activeSeasonIndex) {
    activeSeasonIndex = idx;
    const season = SEASONS_LIST[idx];
    const wrapper = document.getElementById('dashboard-wrapper');
    if (!wrapper) return;

    try {
        let data = { club: {}, estadisticas: { partidos: {}, goles: {} }, tabla: {}, ultimosEnfrentamientos: [] };
        let dataPlayers = null;

        try {
            const resData = await fetch(`${season.dataPath}?t=${Date.now()}`);
            if (resData.ok) {
                const fullData = await resData.json();
                data = fullData;
                dataPlayers = fullData;
            } else {
                console.warn("No se pudo obtener el archivo JSON consolidado.");
            }
        } catch (e) {
            console.error("Error al cargar los datos:", e);
        }

        const clubName = data?.club?.nombre || data?.club?.nombre_club || data?.nombre || "Lokomotiv";
        const clubLogo = data?.club?.logo || data?.logo || "escudos/loko.webp";
        
        const stats = data?.estadisticas || data?.estadísticas || {};
        const partidos = stats?.partidos || {};
        const goles = stats?.goles || {};

        const jugados = partidos?.jugados || 0;
        const ganados = partidos?.ganados || 0;
        const empatados = partidos?.empatados || 0;
        const perdidos = partidos?.perdidos !== undefined ? partidos.perdidos : (jugados - ganados - empatados);

        const anotados = goles?.anotados || goles?.favor || 0;
        const recibidos = goles?.recibidos || goles?.contra || 0;
        const diff = anotados - recibidos;

        let diffClass = "";
        let diffText = diff;
        if (diff > 0) {
            diffText = `+${diff}`;
            diffClass = "color-green";
        } else if (diff < 0) {
            diffClass = "color-red";
        }

        const tablaObj = data?.tabla || data?.clasificacion || {};
        const posicion = tablaObj?.posicion || tablaObj?.posición || '-';

        let valData = tablaObj?.valoracion?.valor !== undefined ? tablaObj.valoracion.valor : (tablaObj?.variacion || '');
        let valStr = String(valData || '');
        let cleanValStr = valStr.replace('+', '').replace('-', '');
        let valNum = parseFloat(valStr);

        let posIcon = "icon-equal-box";
        let posColor = "#171718";
        if (valStr.includes('+') || valNum > 0) { 
            posIcon = "icon-arrow-up-box"; 
            posColor = "#348d8b"; 
        } else if (valStr.includes('-') || valNum < 0) { 
            posIcon = "icon-arrow-down-box"; 
            posColor = "#e33046"; 
        }

        let ultimosHTML = (data?.ultimosEnfrentamientos || []).map((m) => {
            let boxColor = "bg-dark";
            if (m.resultado === "G") boxColor = "bg-green";
            if (m.resultado === "P") boxColor = "bg-red";

            return `
                <div class="form-box ${boxColor}" data-partido="${m.partido}" data-fecha="${m.fecha}">
                    ${m.resultado}
                </div>
            `;
        }).join('');

        const getLogo = src => src && src.trim() !== "" ? `<img src="${src}" alt="Logo">` : `<div class="match-no-logo">NO MEDIA</div>`;

        const renderMatch = (title, md, isPrev) => {
            if (!md) return '';
            let cornerBadge = '';
            let isWin = false;
            let isLoss = false;

            if (isPrev) {
                let evalStr = md.resultadoPenales || md.resultadoGlobal || md.marcador || '';
                if (evalStr) {
                    const parts = evalStr.replace(/[()]/g, '').replace(/Pen\./gi, '').split('-').map(n => parseInt(n.trim(), 10));
                    if (parts.length === 2) {
                        if (md.local) {
                            if (parts[0] > parts[1]) isWin = true;
                            else if (parts[0] < parts[1]) isLoss = true;
                        } else {
                            if (parts[1] > parts[0]) isWin = true;
                            else if (parts[1] < parts[0]) isLoss = true;
                        }
                    }
                }

                let iconStr = "icon-equal-box";
                let colStr = "#171718";
                if (isWin) { iconStr = "icon-check"; colStr = "#348d8b"; }
                else if (isLoss) { iconStr = "icon-close"; colStr = "#e33046"; }

                cornerBadge = `
                    <div class="match-corner-icons">
                        <span class="svg-icon ${md.local ? 'icon-home' : 'icon-airplane'}" style="color:#171718;width:24px;height:24px;"></span>
                        <span class="svg-icon ${iconStr}" style="color:${colStr};width:24px;height:24px;"></span>
                    </div>
                `;
            } else {
                cornerBadge = `
                    <div class="match-corner-icons">
                        <span class="svg-icon ${md.local ? 'icon-home' : 'icon-airplane'}" style="color:#171718;width:24px;height:24px;"></span>
                    </div>
                `;
            }

            let compInfo = md.competicion ? `<div class="match-competicion">${md.competicion}</div>` : '';
            let extraInfo = '';
            if (md.fecha) extraInfo += `<div style="font-size: 1.1rem; color: #171718; font-family: sans-serif; font-weight: bold; margin-bottom: 5px;">${md.fecha}</div>`;
            if (md.hora) extraInfo += `<div style="font-size: 1.4rem; color: #e33046; margin-bottom: 15px;">${md.hora}</div>`;

            let scoreHTML = '';
            if (isPrev && md.marcador) {
                let marginBottom = (md.global || md.penales) ? '5px' : '15px';
                scoreHTML += `<div class="match-score" style="color: #171718; margin-bottom: ${marginBottom};">${md.marcador}</div>`;
            }

            if (md.global && md.resultadoGlobal) {
                let mbGlobal = (isPrev && md.penales) ? '5px' : '15px';
                let formattedGlobal = md.resultadoGlobal.includes('(') ? md.resultadoGlobal : `(${md.resultadoGlobal})`;
                scoreHTML += `<div style="font-size: 1.2rem; color: #171718; font-weight: bold; margin-bottom: ${mbGlobal};">${formattedGlobal}</div>`;
            }

            if (isPrev && md.penales && md.resultadoPenales) {
                let formattedPenales = md.resultadoPenales.includes('(') ? md.resultadoPenales : `(${md.resultadoPenales})`;
                scoreHTML += `<div style="font-size: 1.2rem; color: #171718; font-weight: bold; margin-bottom: 15px;">Pen. ${formattedPenales}</div>`;
            }

            return `
                <div class="dash-panel grid-span-3 match-panel">
                    <div class="match-label">${title}</div>
                    ${cornerBadge}
                    ${compInfo}
                    <div class="match-logo" style="margin-top:10px;">${getLogo(md.logo)}</div>
                    <div class="match-rival">${md.rival}</div>
                    ${scoreHTML}
                    ${extraInfo}
                </div>
            `;
        };

        const createPlayerCard = (title, player) => {
            if (!player) return '';
            
            let badgesHTML = '';
            if ((player.camiseta !== undefined && player.camiseta !== null) || player.motm) {
                let numHTML = (player.camiseta !== undefined && player.camiseta !== null)
                    ? `<div class="player-badge-row">
                           <span class="svg-icon shirt-icon"></span>
                           <span class="shirt-number">${player.camiseta}</span>
                       </div>` 
                    : '';
                let motmHTML = player.motm 
                    ? `<div class="player-badge-row">
                           <span class="svg-icon icon-medal motm-icon"></span>
                           <span class="motm-number">${player.total_motm !== undefined ? player.total_motm : ''}</span>
                       </div>` 
                    : '';
                
                badgesHTML = `
                    <div class="player-badges-container">
                        ${numHTML}
                        ${motmHTML}
                    </div>
                `;
            }

            const foto = player.foto 
                ? `<img src="${player.foto}" alt="Foto">` 
                : `<div style="width:100%;height:100%;color:#e33046;display:flex;align-items:center;justify-content:center;border:2px dashed #171718;">NO MEDIA</div>`;

            let statsHTML = '';
            if (player.partidos_jugados !== undefined) statsHTML += `<div class="player-stat"><span class="svg-icon icon-soccer-field"></span><span class="player-stat-val">${player.partidos_jugados}</span></div>`;
            if (player.minutos_jugados !== undefined) statsHTML += `<div class="player-stat"><span class="svg-icon icon-clock player-white"></span><span class="player-stat-val">${player.minutos_jugados}'</span></div>`;
            
            if (player.goles !== undefined || player.porterias_a_cero !== undefined) {
                const isGoalkeeper = player.portero === true || player.portero === "true";
                const goles = player.goles || 0;
                const penales = player.penales !== undefined ? player.penales : (player.penales_convertidos || 0);
                const porterias = player.porterias_a_cero || 0;
                
                if (isGoalkeeper) {
                    statsHTML += `<div class="player-stat stat-cyclable" data-state="0" data-portero="true" data-goles="${goles}" data-penales="${penales}" data-porterias="${porterias}"><span class="svg-icon icon-shield-check player-white"></span><span class="player-stat-val">${porterias}</span></div>`;
                } else {
                    statsHTML += `<div class="player-stat stat-cyclable" data-state="0" data-portero="false" data-goles="${goles}" data-penales="${penales}"><span class="svg-icon icon-soccer player-white"></span><span class="player-stat-val">${goles}</span></div>`;
                }
            }
            
            if (player.asistencias !== undefined) statsHTML += `<div class="player-stat"><span class="svg-icon icon-hand-clap player-white"></span><span class="player-stat-val">${player.asistencias}</span></div>`;

            return `
            <div class="dash-panel grid-span-2 player-panel">
                <div class="player-section-subtitle">${title}</div>
                ${badgesHTML}
                <div class="player-photo">${foto}</div>
                <div class="player-name-container">
                    ${player.pais ? `<img src="${player.pais}" class="player-flag">` : ''}
                    <span class="player-name">${player.nombre}</span>
                </div>
                <div class="player-stats-grid">${statsHTML}</div>
            </div>
            `;
        };

        const matchAnt = data?.anterior || data?.enfrentamiento_anterior;
        const matchProx = data?.proximo || data?.proximo_enfrentamiento;
        
        let seasonsOptionsHTML = SEASONS_LIST.map((s, i) => 
            `<a href="#" class="history-item season-option" data-idx="${i}"><span>#</span> ${s.label}</a>`
        ).join('');

        let playersHTML = '';
        if (dataPlayers && (dataPlayers.jugador_mas_goleador || dataPlayers.jugador_mas_asistidor || dataPlayers.jugador_con_mas_minutos)) {
            playersHTML += `<div class="player-section-title">JUGADORES DESTACADOS</div>`;
            playersHTML += createPlayerCard("MÁXIMO GOLEADOR", dataPlayers.jugador_mas_goleador);
            playersHTML += createPlayerCard("MÁXIMO ASISTIDOR", dataPlayers.jugador_mas_asistidor);
            playersHTML += createPlayerCard("MÁS MINUTOS", dataPlayers.jugador_con_mas_minutos);
        }

        let teamStatsHTML = `
            <div class="dash-panel grid-span-4 dash-header-panel">
                <div class="dash-logo">${clubLogo ? `<img src="${clubLogo}">` : ''}</div>
                <div class="dash-title"><h1>${clubName}</h1></div>
            </div>
            <div class="dash-panel grid-span-2 pos-panel">
                <div class="stat-card-title">Posición</div>
                <div class="pos-value-container">
                    <span class="stat-card-value">${posicion}</span>
                    <span style="font-size: 1.5rem; font-weight: 900; color: ${posColor}; margin-left: 8px;">${valStr !== '=' && valStr !== '0' && valStr !== '' ? cleanValStr : ''}</span>
                    <span class="svg-icon ${posIcon}" style="color:${posColor};width:35px;height:35px;margin-left:5px;"></span>
                </div>
            </div>
            <div class="dash-panel stat-card grid-span-2">
                <span class="svg-icon icon-soccer-field" style="color:#171718;width:40px;height:40px;"></span>
                <div class="stat-card-title">Partidos Jugados</div>
                <div class="stat-card-value">${jugados}</div>
            </div>
            <div class="dash-panel stat-card grid-span-2">
                <span class="svg-icon icon-check" style="color:#348d8b;width:40px;height:40px;"></span>
                <div class="stat-card-title">Ganados</div>
                <div class="stat-card-value color-green">${ganados}</div>
            </div>
            <div class="dash-panel stat-card grid-span-2">
                <span class="svg-icon icon-equal-box" style="color:#171718;width:40px;height:40px;"></span>
                <div class="stat-card-title">Empatados</div>
                <div class="stat-card-value">${empatados}</div>
            </div>
            <div class="dash-panel stat-card grid-span-2">
                <span class="svg-icon icon-close" style="color:#e33046;width:40px;height:40px;"></span>
                <div class="stat-card-title">Perdidos</div>
                <div class="stat-card-value color-red">${perdidos}</div>
            </div>
            <div class="dash-panel stat-card grid-span-2">
                <span class="svg-icon icon-soccer" style="color:#348d8b;width:40px;height:40px;"></span>
                <div class="stat-card-title">Goles a Favor</div>
                <div class="stat-card-value color-green">${anotados}</div>
            </div>
            <div class="dash-panel stat-card grid-span-2">
                <span class="svg-icon icon-soccer" style="color:#e33046;width:40px;height:40px;"></span>
                <div class="stat-card-title">Goles en Contra</div>
                <div class="stat-card-value color-red">${recibidos}</div>
            </div>
            <div class="dash-panel stat-card grid-span-6" style="border-color:#348d8b;">
                <div class="stat-card-title">Diferencia de Goles</div>
                <div class="stat-card-value ${diffClass}">${diffText}</div>
            </div>
            <div class="dash-panel grid-span-6 form-section">
                <h3>Últimos Enfrentamientos</h3>
                <div class="form-boxes-container">${ultimosHTML}</div>
            </div>
            ${renderMatch('PARTIDO ANTERIOR', matchAnt, true)}
            ${renderMatch('PRÓXIMO PARTIDO', matchProx, false)}
        `;

        wrapper.innerHTML = `
            <div class="sidebar-block" style="max-width: 400px; margin: 0 auto 30px auto; width: 100%;">
                <h3 style="color: #ffffff; border-bottom-color: #e33046;">TEMPORADA</h3>
                <div class="history-accordion" style="position: relative;">
                    <button id="season-toggle-btn" class="year-btn" style="margin-bottom: 0;">
                        ${season.label} <span id="season-toggle-icon" style="float: right;">▼</span>
                    </button>
                    <div id="season-options" class="history-content" style="position: absolute; width: 100%; top: 100%; left: 0; box-shadow: 6px 6px 0px #171718; z-index: 50; display: none;">
                        ${seasonsOptionsHTML}
                    </div>
                </div>
            </div>
            <div class="dashboard-grid">
                ${teamStatsHTML}
                ${playersHTML}
            </div>
            <div class="mini-overlay" id="miniOverlay">
                <div class="mini-popup">
                    <div class="mini-popup-header"><span style="font-weight:900;">DETALLES DEL PARTIDO</span></div>
                    <div class="mini-popup-body">
                        <h4 id="miniPartido" style="color:#203837; font-size:1.5rem; margin-bottom:10px;"></h4>
                        <p id="miniFecha" style="background:#171718; color:#fcfcfc; padding:5px 10px; display:inline-block; font-size:0.9rem;"></p>
                    </div>
                    <button class="mini-popup-close" id="miniClose" style="margin-top:20px; padding:10px 20px; background:#e33046; color:#fcfcfc; border:none; font-family:'Arial Black',sans-serif; cursor:pointer;">CERRAR</button>
                </div>
            </div>
        `;

        const toggleBtn = document.getElementById('season-toggle-btn');
        const optionsDiv = document.getElementById('season-options');
        const toggleIcon = document.getElementById('season-toggle-icon');

        if (toggleBtn && optionsDiv && toggleIcon) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = optionsDiv.style.display === 'block';
                optionsDiv.style.display = isVisible ? 'none' : 'block';
                toggleIcon.innerText = isVisible ? '▼' : '▲';
            });

            document.querySelectorAll('.season-option').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const nextIdx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
                    optionsDiv.style.display = 'none';
                    loadDashboard(nextIdx);
                });
            });
        }

        const overlay = document.getElementById('miniOverlay');
        const miniPartido = document.getElementById('miniPartido');
        const miniFecha = document.getElementById('miniFecha');

        document.querySelectorAll('.form-box').forEach(box => {
            box.addEventListener('click', () => {
                miniPartido.textContent = box.dataset.partido;
                miniFecha.textContent = box.dataset.fecha;
                overlay.classList.add('active');
            });
        });

        const closeBtn = document.getElementById('miniClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.classList.remove('active');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) overlay.classList.remove('active');
            });
        }

    } catch (err) {
        wrapper.innerHTML = `<div style="text-align:center;color:#e33046;font-size:1.5rem;margin-top:50px;">${err.message}</div>`;
    }
}

window.closeSeasonDropdown = (e) => {
    const btn = document.getElementById('season-toggle-btn');
    const opt = document.getElementById('season-options');
    const icon = document.getElementById('season-toggle-icon');
    if (btn && opt && icon && !btn.contains(e.target) && !opt.contains(e.target)) {
        opt.style.display = 'none';
        icon.innerText = '▼';
    }
};

document.removeEventListener('click', window.closeSeasonDropdown);
document.addEventListener('click', window.closeSeasonDropdown);

document.addEventListener('click', e => {
    const cyclable = e.target.closest('.stat-cyclable');
    if (cyclable) {
        const isGK = cyclable.dataset.portero === 'true';
        let state = parseInt(cyclable.dataset.state, 10);
        const icon = cyclable.querySelector('.svg-icon');
        const val = cyclable.querySelector('.player-stat-val');
        
        if (isGK) {
            state = (state + 1) % 3;
            cyclable.dataset.state = state;
            if (state === 0) {
                icon.className = 'svg-icon icon-shield-check player-white';
                val.textContent = cyclable.dataset.porterias;
            } else if (state === 1) {
                icon.className = 'svg-icon icon-soccer player-white';
                val.textContent = cyclable.dataset.goles;
            } else if (state === 2) {
                icon.className = 'svg-icon icon-penalty player-red';
                val.textContent = cyclable.dataset.penales;
            }
        } else {
            state = (state + 1) % 2;
            cyclable.dataset.state = state;
            if (state === 0) {
                icon.className = 'svg-icon icon-soccer player-white';
                val.textContent = cyclable.dataset.goles;
            } else if (state === 1) {
                icon.className = 'svg-icon icon-penalty player-red';
                val.textContent = cyclable.dataset.penales;
            }
        }
    }
});

async function loadGallery() {
    const container = document.getElementById('gallery-container');
    if (!container) return;
    try {
        const res = await fetch(`articulos/sitios.json?t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        data.sort((a, b) => parseInt(a.posicion, 10) - parseInt(b.posicion, 10));
        container.innerHTML = data.map(item => `
            <div class="gallery-card">
                <div class="gallery-img-container">
                    <img src="${item.imagen}" onerror="this.outerHTML='<div class=\\'no-media\\'>NO MEDIA</div>'">
                    <a href="${item.sitio}" target="_blank" class="gallery-btn">
                        Ver sitio <span class="svg-icon icon-arrow-top-right" style="width:16px;height:16px;background-color:#fcfcfc;"></span>
                    </a>
                </div>
                <div class="gallery-content">
                    <h3 class="gallery-card-title">${item.titulo}</h3>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

async function init() {
    if (document.getElementById('view-home')) {
        window.addEventListener('hashchange', handleRoute);
        loadPosts();
    }
    if (document.getElementById('dashboard-wrapper')) {
        await loadAvailableSeasons();
        loadDashboard(activeSeasonIndex);
    }
    if (document.getElementById('gallery-container')) {
        loadGallery();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}