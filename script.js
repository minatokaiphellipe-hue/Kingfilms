let todosDados = [];
let heroInterval; 
let currentSlide = 0;
let totalSlides = 0;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // --- CIRURGIA DE ALTA PERFORMANCE (Lê os 3 catálogos simultaneamente) ---
        const tempo = Date.now();
        const [resFilmes, resSeries, resAnimes] = await Promise.all([
            fetch('catalogo_filmes.json?v=' + tempo).catch(() => null),
            fetch('catalogo_series.json?v=' + tempo).catch(() => null),
            fetch('catalogo_animes.json?v=' + tempo).catch(() => null)
        ]);

        let filmes = (resFilmes && resFilmes.ok) ? await resFilmes.json() : [];
        let series = (resSeries && resSeries.ok) ? await resSeries.json() : [];
        let animes = (resAnimes && resAnimes.ok) ? await resAnimes.json() : [];

        // Junta tudo e inverte para os últimos lançamentos aparecerem primeiro
        todosDados = [...filmes, ...series, ...animes];
        todosDados.reverse(); 
        
        renderizarHome();
    } catch (e) { 
        document.getElementById('feedPrincipal').innerHTML = `<p style="color:red; text-align:center; padding:50px;">Erro ao carregar catálogo: ${e.message}</p>`;
    }
});

function abrirMenu() {
    document.getElementById('sidebarMenu').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('open');
}
function fecharMenu() {
    document.getElementById('sidebarMenu').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
}

const getIcon = (cat) => {
    const lower = cat.toLowerCase();
    if (lower.includes('filme')) return '🎬';
    if (lower.includes('série')) return '📺';
    if (lower.includes('anime')) return '⛩️';
    if (lower.includes('animaç')) return '🦄';
    if (lower.includes('desenho')) return '🖍️';
    if (lower.includes('ação')) return '💥';
    if (lower.includes('comédia')) return '😂';
    if (lower.includes('terror') || lower.includes('horror')) return '👻';
    if (lower.includes('romance')) return '❤️';
    if (lower.includes('ficção')) return '👽';
    if (lower.includes('doc')) return '🌍';
    return '🍿'; 
};

function criarCartaoHTML(item) {
    return `
        <div class="content-card" onclick="abrirDetalhes('${item.id}')">
            <img src="${item.logo}" alt="${item.titulo}" loading="lazy">
            <div class="card-info">
                <h3>${item.titulo}</h3>
                <div class="btn-assista">▶ Assista Já</div>
            </div>
        </div>`;
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
}

function gerarTop10() {
    if(todosDados.length < 10) return ""; 
    let dataAtual = new Date();
    let semana = getWeekNumber(dataAtual);
    let ano = dataAtual.getFullYear();
    let semente = semana + ano; 

    let randomSeeded = function() {
        var x = Math.sin(semente++) * 10000;
        return x - Math.floor(x);
    };

    let embaralhado = [...todosDados];
    for (let i = embaralhado.length - 1; i > 0; i--) {
        let j = Math.floor(randomSeeded() * (i + 1));
        [embaralhado[i], embaralhado[j]] = [embaralhado[j], embaralhado[i]];
    }

    let top10 = embaralhado.slice(0, 10);
    
    let html = `
    <div class="top10-section">
        <h2 class="categoria-title" style="color: #fff; font-size: 22px;">🔥 TOP 10 da Semana</h2>
        <div class="top10-row">`;
    
    top10.forEach((item, index) => {
        html += `
        <div class="top10-card" onclick="abrirDetalhes('${item.id}')">
            <div class="top10-number">${index + 1}</div>
            <div class="top10-img-box">
                <img src="${item.logo}" alt="${item.titulo}" loading="lazy">
            </div>
        </div>`;
    });
    
    html += `</div></div>`;
    return html;
}

function renderizarHome() {
    const feed = document.getElementById('feedPrincipal');
    clearInterval(heroInterval); 
    if(document.getElementById('campoPesquisa')) document.getElementById('campoPesquisa').value = "";
    feed.innerHTML = ''; 
    let htmlFeed = "";

    const categoriasExistentes = [...new Set(todosDados.map(item => item.categoria || 'Outros'))];

    let htmlSidebar = `<div class="sidebar-item" onclick="fecharMenu(); fecharPesquisa();">🏠 Início</div>`;
    categoriasExistentes.forEach(cat => {
        htmlSidebar += `<div class="sidebar-item" onclick="fecharMenu(); verCategoriaCompleta('${cat}')">${getIcon(cat)} ${cat}</div>`;
    });
    document.getElementById('sidebarContent').innerHTML = htmlSidebar;

    if(todosDados.length > 0) {
        const destaques = todosDados.slice(0, 5); 
        htmlFeed += `<div class="hero-slider" id="heroSlider">`;
        destaques.forEach((destaque, index) => {
            let corClass = "#0f0"; let textoClass = destaque.classificacao || "L";
            if(textoClass === "Livre" || textoClass === "L") { corClass = "#0f0"; textoClass = "Livre"; }
            else if(textoClass === "10") corClass = "#00a5ff"; else if(textoClass === "12") corClass = "#ffcc00"; 
            else if(textoClass === "14") corClass = "#ff6600"; else if(textoClass === "16" || textoClass === "18" || textoClass.includes("TV-MA") || textoClass.includes("R")) corClass = "#e50914"; 

            let notaHtml = destaque.avaliacao && destaque.avaliacao !== "0.0" && destaque.avaliacao !== "N/A" ? `<span style="color:#46d369;">★ ${destaque.avaliacao}</span>` : "";

            htmlFeed += `
            <div class="hero-slide ${index === 0 ? 'active' : ''}" id="slide-${index}" style="background-image: url('${destaque.logo}');">
                <div class="hero-overlay"></div>
                <div class="hero-content">
                    <h1 class="hero-title">${destaque.titulo}</h1>
                    <div class="hero-meta">${notaHtml}<span style="background:${corClass}; color:#000; padding:3px 8px; border-radius:4px;">${textoClass}</span><span style="color:#ccc;">${destaque.tipo === 'filme' ? 'Filme' : 'Série'}</span></div>
                    <p class="hero-synopsis">${destaque.sinopse || 'Assista a este incrível lançamento agora no KINGFILMS em Alta Definição.'}</p>
                    <div class="hero-buttons">
                        <button class="btn-hero-play" onclick="abrirDetalhes('${destaque.id}')">▶ Assistir</button>
                        <button class="btn-hero-info" onclick="abrirDetalhes('${destaque.id}')">ℹ Mais Info</button>
                    </div>
                </div>
            </div>`;
        });
        htmlFeed += `<div class="slider-dots">`;
        destaques.forEach((_, index) => { htmlFeed += `<div class="dot ${index === 0 ? 'active' : ''}" id="dot-${index}" onclick="mudarSlide(${index})"></div>`; });
        htmlFeed += `</div></div>`; 
        setTimeout(() => { iniciarSlider(destaques.length); configurarSwipe(); }, 100);
    }

    htmlFeed += `<div class="quick-categories">`;
    htmlFeed += `<div class="quick-cat-card" onclick="document.getElementById('recem-adicionados').scrollIntoView({behavior:'smooth'})"><span class="quick-cat-icon">🔥</span><span class="quick-cat-title">Lançamentos</span></div>`;
    categoriasExistentes.forEach(cat => {
        htmlFeed += `<div class="quick-cat-card" onclick="verCategoriaCompleta('${cat}')"><span class="quick-cat-icon">${getIcon(cat)}</span><span class="quick-cat-title">${cat}</span></div>`;
    });
    htmlFeed += `</div>`;

    htmlFeed += `
    <div class="telegram-banner">
        <div class="tg-text">
            <div class="tg-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L2 9.5L8.5 12.5L18 5L10.5 14L15.5 19L22 2Z" fill="#fff"/>
                </svg>
                Comunidade KINGFILMS
            </div>
            <div class="tg-desc">Faça pedidos de filmes, séries e receba atualizações em primeira mão!</div>
        </div>
        <a href="https://t.me/+kMxAz5AFIOIyYzJh" target="_blank" class="tg-btn">ENTRAR NO GRUPO</a>
    </div>`;

    htmlFeed += gerarTop10();

    const limiteEcraInicial = 10;
    const itensRecentes = todosDados.slice(0, limiteEcraInicial);
    
    htmlFeed += `<div class="categoria-section" id="recem-adicionados"><h2 class="categoria-title">Acabaram de Chegar 🎬</h2><div class="content-row">`;
    itensRecentes.forEach(item => { htmlFeed += criarCartaoHTML(item); });
    htmlFeed += `</div></div>`;

    categoriasExistentes.forEach(cat => {
        const idSecao = cat.replace(/\s+/g, '-').toLowerCase();
        const itensDestaCategoria = todosDados.filter(item => (item.categoria || 'Outros') === cat);
        const itensCarrossel = itensDestaCategoria.slice(0, limiteEcraInicial);

        htmlFeed += `<div class="categoria-section" id="${idSecao}"><h2 class="categoria-title">${cat.toUpperCase()}</h2><div class="content-row">`;
        itensCarrossel.forEach(item => { htmlFeed += criarCartaoHTML(item); });
        htmlFeed += `</div>`;
        if(itensDestaCategoria.length > limiteEcraInicial) {
            htmlFeed += `<button class="btn-ver-mais" onclick="verCategoriaCompleta('${cat}')">Ver todos os conteúdos de ${cat} ▾</button>`;
        }
        htmlFeed += `</div>`; 
    });

    feed.innerHTML = htmlFeed;
}

window.iniciarSlider = function(total) {
    totalSlides = total; currentSlide = 0; clearInterval(heroInterval);
    if(total > 1) { heroInterval = setInterval(() => { mudarSlide((currentSlide + 1) % totalSlides); }, 6000); }
};
window.mudarSlide = function(index) {
    const slides = document.querySelectorAll('.hero-slide'); const dots = document.querySelectorAll('.dot');
    if(!slides.length || !dots.length) return;
    slides.forEach(el => el.classList.remove('active')); dots.forEach(el => el.classList.remove('active'));
    document.getElementById(`slide-${index}`).classList.add('active');
    document.getElementById(`dot-${index}`).classList.add('active');
    currentSlide = index;
    clearInterval(heroInterval);
    heroInterval = setInterval(() => { mudarSlide((currentSlide + 1) % totalSlides); }, 6000);
};
function configurarSwipe() {
    const slider = document.getElementById('heroSlider');
    if (!slider) return;
    let touchStartX = 0; let touchEndX = 0;
    slider.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
    slider.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX - touchStartX < -50) mudarSlide((currentSlide + 1) % totalSlides);
        else if (touchEndX - touchStartX > 50) mudarSlide((currentSlide - 1 + totalSlides) % totalSlides);
    }, {passive: true});
}

function verCategoriaCompleta(categoriaDesejada) {
    clearInterval(heroInterval); 
    const feed = document.getElementById('feedPrincipal');
    const itensCompletos = todosDados.filter(item => (item.categoria || 'Outros') === categoriaDesejada);

    let html = `
        <div style="padding: 15px 5%;">
            <button onclick="renderizarHome()" style="background: linear-gradient(45deg, #ff0a16, #8b0000); color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; margin-bottom:20px; font-weight:bold;">← Voltar ao Início</button>
            <h2 class="categoria-title" style="margin-left:0; margin-bottom:20px;">${getIcon(categoriaDesejada)} TUDO EM: ${categoriaDesejada.toUpperCase()}</h2>
        </div>
        <div class="grid-view">`;
    itensCompletos.forEach(item => { html += criarCartaoHTML(item); });
    html += `</div>`;
    feed.innerHTML = html;
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function pesquisarConteudo() {
    clearInterval(heroInterval); 
    const termo = document.getElementById('campoPesquisa').value.toLowerCase().trim();
    const feed = document.getElementById('feedPrincipal');

    if (termo === "") { renderizarHome(); return; }
    const resultados = todosDados.filter(item => item.titulo.toLowerCase().includes(termo));

    if (resultados.length === 0) {
        feed.innerHTML = `<div style="padding: 15px 5%;"><button onclick="fecharPesquisa()" style="background: linear-gradient(45deg, #ff0a16, #8b0000); color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; margin-bottom:20px; font-weight:bold;">← Voltar</button></div><div style="text-align:center; margin-top:60px; color:#888;"><span style="font-size:45px;">😕</span><br><br><p style="font-size:16px;">Nenhum resultado encontrado para "<b>${termo}</b>"</p></div>`;
        return;
    }
    let htmlResultados = `<div style="padding: 15px 5%;"><button onclick="fecharPesquisa()" style="background: linear-gradient(45deg, #ff0a16, #8b0000); color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; margin-bottom:20px; font-weight:bold;">← Voltar</button><h2 class="categoria-title" style="margin-left:0; color:#e50914;">Resultados para "${termo}"</h2></div><div class="grid-view">`;
    resultados.forEach(item => { htmlResultados += criarCartaoHTML(item); });
    htmlResultados += `</div>`;
    feed.innerHTML = htmlResultados;
}

function fecharPesquisa() { renderizarHome(); }

function mudarTemporada(idItem, tempDesejada) {
    const botoes = document.querySelectorAll('.season-btn');
    botoes.forEach(btn => btn.classList.remove('active'));
    
    const btnAtivo = document.getElementById(`btn-temp-${tempDesejada}`);
    if(btnAtivo) {
        btnAtivo.classList.add('active');
        btnAtivo.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    
    renderEps(idItem, tempDesejada);
}

function abrirDetalhes(idItem) {
    clearInterval(heroInterval); 
    const item = todosDados.find(i => i.id === idItem);
    const feed = document.getElementById('feedPrincipal');
    
    const temps = Object.keys(item.temporadas).sort((a,b) => parseInt(a) - parseInt(b));
    
    let selectTemporada = "";
    if (temps.length > 1) {
        selectTemporada = `<div class="season-tabs-container" id="seasonTabsContainer">`;
        temps.forEach((t, index) => {
            const activeClass = index === 0 ? 'active' : '';
            selectTemporada += `<button class="season-btn ${activeClass}" id="btn-temp-${t}" onclick="mudarTemporada('${idItem}', '${t}')">Temporada ${t}</button>`;
        });
        selectTemporada += `</div>`;
    } else {
        selectTemporada = `<input type="hidden" id="tempAtualOculta" value="${temps[0]}">`;
    }

    let corClass = "#0f0"; let textoClass = item.classificacao || "L";
    if(textoClass === "Livre" || textoClass === "L") { corClass = "#0f0"; textoClass = "Livre"; } else if(textoClass === "10") corClass = "#00a5ff"; else if(textoClass === "12") corClass = "#ffcc00"; else if(textoClass === "14") corClass = "#ff6600"; else if(textoClass === "16" || textoClass === "18" || textoClass.includes("TV-MA") || textoClass.includes("R")) corClass = "#e50914"; 

    let notaHtml = item.avaliacao && item.avaliacao !== "0.0" && item.avaliacao !== "N/A" ? `<span style="color:#46d369; font-weight:bold;">★ ${item.avaliacao}</span>` : "";
    let sinopseFixa = item.sinopse || "Nenhuma sinopse disponível no momento.";

    const categoriaAtual = item.categoria || 'Outros';
    const relacionados = todosDados.filter(i => (i.categoria || 'Outros') === categoriaAtual && i.id !== item.id).slice(0, 10);
    
    let htmlRelacionados = "";
    if (relacionados.length > 0) {
        let tituloRelacionados = item.tipo === 'serie' ? 'Séries Relacionadas' : 'Filmes Relacionados';
        htmlRelacionados += `
        <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.05);">
            <h2 style="font-size: 20px; font-weight: bold; color: #f1f1f1; margin-bottom: 20px; border-left: 4px solid #e50914; padding-left: 10px;">${tituloRelacionados}</h2>
            <div class="content-row" style="padding-left: 0; padding-right: 0;">`;
        
        relacionados.forEach(rel => {
            htmlRelacionados += `
                <div class="content-card" onclick="abrirDetalhes('${rel.id}')" title="${rel.titulo}" style="display: block; border: none; background: transparent; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">
                    <img src="${rel.logo}" alt="${rel.titulo}" loading="lazy" style="width: 100%; height: 100%; border-bottom: none; border-radius: 10px;">
                </div>`;
        });
        
        htmlRelacionados += `</div></div>`;
    }

    feed.innerHTML = `
        <div style="padding:20px; color:white; max-width:900px; margin:0 auto;">
            <button onclick="renderizarHome()" style="background: linear-gradient(45deg, #ff0a16, #8b0000); color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; margin-bottom:20px; font-weight:bold;">← Voltar</button>
            <div style="background-image:url('${item.logo}'); background-size:cover; background-position:center top; width:100%; aspect-ratio:16/9; border-radius:12px; position:relative; margin-bottom:25px; border:1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.6);">
                <div style="position:absolute; bottom:0; left:0; width:100%; height:100%; background:linear-gradient(to top, rgba(7,16,34,1), rgba(0,0,0,0.4) 50%, transparent); border-radius:12px;"></div>
                <div style="position:absolute; bottom:25px; left:25px; right:25px;">
                    <h1 style="font-size:32px; font-weight:900; margin:0 0 10px 0; text-shadow: 2px 2px 8px rgba(0,0,0,0.9); line-height: 1.1;">${item.titulo}</h1>
                    <div style="display:flex; align-items:center; gap:15px; font-size:14px; flex-wrap:wrap;">
                        ${notaHtml}<span style="background:${corClass}; color:#000; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:13px;">${textoClass}</span><span style="color:#ccc; font-weight:bold;">${item.tipo === 'filme' ? 'Filme' : 'Série'}</span>
                    </div>
                </div>
            </div>
            <p style="color:#ddd; font-size:16px; line-height:1.6; margin-bottom:30px; text-shadow: 1px 1px 3px rgba(0,0,0,0.5);">${sinopseFixa}</p>
            
            ${selectTemporada}
            
            <div id="listaEps"></div>
            
            ${htmlRelacionados}
            
        </div>`;
        
    renderEps(idItem, temps[0]); 
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function renderEps(idItem, temporadaDesejada) {
    const item = todosDados.find(i => i.id === idItem);
    
    if(!temporadaDesejada) {
        const hiddenInput = document.getElementById('tempAtualOculta');
        if(hiddenInput) temporadaDesejada = hiddenInput.value;
    }

    if(!temporadaDesejada || !item.temporadas[temporadaDesejada]) return;

    document.getElementById('listaEps').innerHTML = item.temporadas[temporadaDesejada].map(e => `
        <div style="display:flex; align-items:center; gap:15px; background:rgba(20,20,20,0.6); padding:12px; margin-bottom:12px; border-radius:10px; cursor:pointer; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; backdrop-filter: blur(5px);" 
             onclick="window.location.href='${e.linkFisico}'" onmouseover="this.style.background='rgba(40,40,40,0.8)'; this.style.borderColor='#e50914';" onmouseout="this.style.background='rgba(20,20,20,0.6)'; this.style.borderColor='rgba(255,255,255,0.05)';">
            <img src="${e.logoEp}" style="width:140px; aspect-ratio:16/9; object-fit:cover; border-radius:6px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);" loading="lazy">
            <div style="flex:1; overflow:hidden;">
                <h4 style="font-size:15px; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; margin-bottom:8px; color:#fff;">${e.tit}</h4>
                <d