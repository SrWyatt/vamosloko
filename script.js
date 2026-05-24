const menuBtn = document.getElementById('menu-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const postsContainer = document.getElementById('posts-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const headerTitle = document.getElementById('main-header');
const navbar = document.querySelector('.navbar');
const scrollTopBtn = document.getElementById('scroll-to-top');

const views = {
    home: document.getElementById('view-home'),
    post: document.getElementById('view-post'),
    page: document.getElementById('view-page')
};

let globalPosts = [];
let historyByYear = {};
let lastScrollY = window.scrollY;

const pageTemplates = {
    "estado-del-equipo": { title: "ESTADO DEL EQUIPO", body: "PRÓXIMAMENTE" },
    "sobre-mi": { title: "SOBRE MÍ", body: "BIOGRAFÍA Y DATOS PERSONALES.\n\nSISTEMAS INFORMATICOS Y MÁS." },
    "contacto": { title: "CONTACTO", body: "PONTE EN CONTACTO.\n\nCORREO: TU-CORREO@EJEMPLO.COM\nTELÉFONO: +503 0000-0000" }
};

window.addEventListener('scroll', () => {
    if (window.scrollY > lastScrollY && window.scrollY > 80) {
        navbar.style.transform = 'translateY(-100%)';
        dropdownMenu.classList.remove('active');
    } else {
        navbar.style.transform = 'translateY(0)';
    }
    lastScrollY = window.scrollY;

    if (window.scrollY > 400) {
        scrollTopBtn.classList.add('show');
    } else {
        scrollTopBtn.classList.remove('show');
    }
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

function calculateTimezones(dateStr, timeStr) {
    try {
        let dStr = String(dateStr || "");
        let tStr = String(timeStr || "");
        let nums = (dStr + " " + tStr).match(/\d+/g);

        if (!nums || nums.length < 5) {
            return { sv: (dStr + " " + tStr).trim(), ru: "ERROR FORMATO" };
        }

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
                if (month > 12) {
                    month = 1;
                    year += 1;
                }
            }
        }

        let ruString = `${pad(day)}/${pad(month)}/${year} - ${pad(hour)}:${pad(minute)}`;
        return { sv: svString, ru: ruString };

    } catch (e) {
        return { sv: "ERROR", ru: "ERROR FORMATO" };
    }
}

menuBtn.addEventListener('click', () => { dropdownMenu.classList.toggle('active'); });

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        dropdownMenu.classList.remove('active');
    });
});

window.addEventListener('hashchange', handleRoute);

function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');
    window.scrollTo(0, 0);
    headerTitle.style.display = viewName === 'home' ? 'block' : 'none';
}

function handleRoute() {
    const route = window.location.hash.replace('#', '');
    
    if (route === '' || route === '/') { switchView('home'); return; }
    if (/^\d{3}$/.test(route)) { renderPost(route); return; }
    if (pageTemplates[route]) { renderPage(route); return; }
    
    switchView('home');
}

function createCardHTML(post) {
    const imgHTML = post.portada 
        ? `<img src="${post.portada}" onerror="this.outerHTML='<div class=\\'no-media\\'>NO MEDIA</div>'">`
        : `<div class="no-media">NO MEDIA</div>`;

    const times = calculateTimezones(post.date, post.time);

    return `
        <a href="#${post.id_str}" class="post-card" data-title="${post.title.toLowerCase()}" data-id="${post.id_str}">
            <div class="card-img-container">${imgHTML}</div>
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

async function loadPosts() {
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
            globalPosts.unshift(data);
            
            const nums = String(data.date).match(/\d+/g);
            let year = "OTRO";
            if (nums && nums.length >= 3) {
                year = nums[2].length === 2 ? `20${nums[2]}` : nums[2];
            }
            
            if (!historyByYear[year]) historyByYear[year] = [];
            historyByYear[year].push(data);

            currentFetchId++;
        } catch (e) { break; }
    }

    const topPosts = globalPosts.slice(0, 5);
    topPosts.forEach(post => { postsContainer.innerHTML += createCardHTML(post); });

    buildHistorySidebar();
    
    handleRoute();
}

function buildHistorySidebar() {
    const accordion = document.getElementById('history-accordion');
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
        
        document.getElementById('single-post-id').innerText = `#${post.id_str}`;
        document.getElementById('single-post-date').innerHTML = `
            <span><img src="icons/sv.webp" alt="SV" class="flag-img"> ${times.sv}</span>
            <span><img src="icons/ru.webp" alt="RU" class="flag-img"> ${times.ru}</span>
        `;
        document.getElementById('single-post-title').innerText = post.title;
        
        const imgContainer = document.getElementById('single-post-image-container');
        imgContainer.innerHTML = post.portada 
            ? `<img src="${post.portada}" onerror="this.outerHTML='<div class=\\'no-media\\'>NO MEDIA</div>'">`
            : `<div class="no-media">NO MEDIA</div>`;

        const bodyContainer = document.getElementById('single-post-body');
        bodyContainer.innerHTML = '';
        
        if (post.body && Array.isArray(post.body)) {
            post.body.forEach(item => {
                if (item.type === 'parrafo') {
                    bodyContainer.innerHTML += `<p>${item.content}</p>`;
                } else if (item.type === 'imagen') {
                    bodyContainer.innerHTML += `<img src="${item.content}" onerror="this.style.display='none'">`;
                } else if (item.type === 'subtitulo') {
                    bodyContainer.innerHTML += `<h3>${item.content}</h3>`;
                }
            });
        }

        switchView('post');
    } else {
        switchView('home');
    }
}

function renderPage(route) {
    const data = pageTemplates[route];
    document.getElementById('page-title').innerText = data.title;
    document.getElementById('page-body').innerText = data.body;
    switchView('page');
}

function executeSearch() {
    const term = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.post-card');
    
    cards.forEach(card => {
        const title = card.getAttribute('data-title');
        const id = card.getAttribute('data-id');
        if (title.includes(term) || id.includes(term)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

searchBtn.addEventListener('click', executeSearch);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        executeSearch();
    }
});

document.addEventListener('DOMContentLoaded', loadPosts);
