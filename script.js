let todosDados=[], heroInterval, currentSlide=0, totalSlides=0, historicoNav=[];
let minhaLista = JSON.parse(localStorage.getItem('kf_lista')) || [];
let continuarView = JSON.parse(localStorage.getItem('kf_cont')) || [];
let listaAtual = [];

function verificarLogin() {
    let user = localStorage.getItem('kf_user');
    if(user) {
        let userData = JSON.parse(user);
        document.getElementById('headerProfilePic').src = userData.avatar || 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
    } else {
        document.getElementById('headerProfilePic').src = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
    }
}
window.gerirLogin = function() {
    if(localStorage.getItem('kf_user')) {
        if(confirm("Deseja terminar sessão?")) {
            localStorage.removeItem('kf_user'); verificarLogin();
        }
    } else { document.getElementById('loginOverlay').classList.remove('hidden'); }
};
window.fecharLogin = function() { document.getElementById('loginOverlay').classList.add('hidden'); };
window.logarComEmail = function() {
    let email = document.getElementById('inputEmail').value.trim();
    if(email) {
        localStorage.setItem('kf_user', JSON.stringify({nome: email.split('@')[0], avatar: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png'}));
        fecharLogin(); verificarLogin(); renderizarHome(false);
    }
};
verificarLogin();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await fetch('catalogo_pro.json?v=' + Date.now());
    todosDados = await r.json(); 
    todosDados.reverse();
    const params = new URLSearchParams(window.location.search);
    if(params.get('id')) abrirDetalhes(params.get('id'), false);
    else renderizarHome(false);
  } catch(e) { document.getElementById('feedPrincipal').innerHTML='<p style="text-align:center;padding:50px">Erro ao carregar catálogo.</p>'; }
});

window.addEventListener('popstate', () => {
    const p = new URLSearchParams(window.location.search);
    if(p.get('id')) abrirDetalhes(p.get('id'), false);
    else renderizarHome(false);
});

// Correção do Bug de Voltar
function voltarPagina(){
  if(historicoNav.length > 1){
    historicoNav.pop();
    let t = historicoNav[historicoNav.length-1];
    if(t.t==='h') renderizarHome(false);
    else if(t.t==='c') verCategoriaCompleta(t.v,false);
    else if(t.t==='b'){ document.getElementById('campoPesquisa').value=t.v; pesquisarConteudo(false,true); }
    else if(t.t==='d') abrirDetalhes(t.v,false);
  } else { window.history.back(); }
  window.scrollTo({top: 0, behavior: 'instant'}); // Limpa o conflito de scroll
}

window.abrirMenu = function() {
    document.getElementById('sidebarMenu').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('open');
};
window.fecharMenu = function() {
    document.getElementById('sidebarMenu').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
};

window.addLista = function(id) {
    if(minhaLista.includes(id)) minhaLista = minhaLista.filter(i => i !== id);
    else minhaLista.push(id);
    localStorage.setItem('kf_lista', JSON.stringify(minhaLista));
    abrirDetalhes(id, false);
};
window.playVid = function(id, link) {
    continuarView = continuarView.filter(i => i !== id);
    continuarView.unshift(id);
    if(continuarView.length > 15) continuarView.pop();
    localStorage.setItem('kf_cont', JSON.stringify(continuarView));
    window.location.href = link;
};

function obterCorClassificacao(idade) {
    let tC = String(idade).toUpperCase();
    if(tC === "LIVRE" || tC === "L") return { bg: "#0C9447", color: "#FFFFFF", texto: "L" }; 
    if(tC.includes("10")) return { bg: "#0F7DC2", color: "#FFFFFF", texto: "10" }; 
    if(tC.includes("12")) return { bg: "#F8C311", color: "#000000", texto: "12" }; 
    if(tC.includes("14")) return { bg: "#E67724", color: "#FFFFFF", texto: "14" }; 
    if(tC.includes("16")) return { bg: "#DB2827", color: "#FFFFFF", texto: "16" }; 
    if(tC.includes("18") || tC.includes("MA") || tC.includes("R")) return { bg: "#1D1815", color: "#FFFFFF", texto: "18" }; 
    return { bg: "#0C9447", color: "#FFFFFF", texto: "L" };
}

function getIcon(c) {
    let l=c.toLowerCase();
    if(l.includes('filme')) return '🎬'; if(l.includes('série')) return '📺'; if(l.includes('anime')) return '⛩️'; 
    if(l.includes('ação')) return '💥'; if(l.includes('comédia')) return '😂'; if(l.includes('drama')) return '🍿';
    return '🔥';
}

function criarCartaoHTML(item) {
  let classInfo = obterCorClassificacao(item.classificacao || "L");
  let notaBadge = (item.avaliacao && item.avaliacao !== "0.0" && item.avaliacao !== "N/A") ? `<div class="badge-rating"><span style="color:#10B981;">★</span> ${item.avaliacao}</div>` : "";
  let classBadge = `<div class="badge-age" style="background-color: ${classInfo.bg}; color: ${classInfo.color};">${classInfo.texto}</div>`;
  
  return `
    <div class="movie-card" onclick="abrirDetalhes('${item.id}')">
        <div class="card-img-wrapper">
            <img class="card-img" src="${item.logo}" alt="${item.titulo}" loading="lazy">
            ${classBadge}
            ${notaBadge}
        </div>
        <h3 class="card-title">${item.titulo.replace(" 🌀","")}</h3>
    </div>`;
}
function renderSectionHeader(titulo, icone = "") {
    let iconeHtml = icone ? `<span class="section-icon">${icone}</span>` : "";
    return `
    <div class="section-header">
        <div class="section-line"></div>
        ${iconeHtml}
        <h2 class="section-title">${titulo}</h2>
    </div>`;
}

// Controle do Slider Deslizável Nativo
window.onHeroScroll = function(el) {
    let idx = Math.round(el.scrollLeft / el.clientWidth);
    document.querySelectorAll('.dot').forEach((d, i) => {
        d.classList.toggle('active', i === idx);
    });
    currentSlide = idx;
};
window.irParaSlide = function(i) {
    let el = document.getElementById('heroSlider');
    if(el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    iniciarSlider(totalSlides);
};
window.iniciarSlider = function(t){
    totalSlides = t; clearInterval(heroInterval);
    if(t > 1) heroInterval = setInterval(()=>{
        let el = document.getElementById('heroSlider');
        if(!el) return;
        currentSlide = (currentSlide + 1) % totalSlides;
        el.scrollTo({ left: currentSlide * el.clientWidth, behavior: 'smooth' });
    }, 6000);
};

function renderizarHome(salvarUrl=true) {
  if(salvarUrl){ history.pushState(null, '', window.location.pathname); historicoNav=[{t:'h'}]; }
  const f = document.getElementById('feedPrincipal'); clearInterval(heroInterval);
  if(document.getElementById('campoPesquisa')) document.getElementById('campoPesquisa').value="";
  window.scrollTo({top: 0, behavior: 'instant'}); // Correção de Sobreposição

  let cats = [...new Set(todosDados.map(i => i.categoria || 'Outros'))];
  
  let hSidebar = `<div class="sidebar-item" onclick="fecharMenu(); renderizarHome();">🏠 Início</div>`;
  cats.forEach(c => { hSidebar += `<div class="sidebar-item" onclick="fecharMenu(); verCategoriaCompleta('${c}')">${getIcon(c)} ${c}</div>`; });
  document.getElementById('sidebarContent').innerHTML = hSidebar;

  let hFeed = ""; 

  if(todosDados.length > 0) {
    let dest = todosDados.slice(0,5);
    hFeed += `<div class="hero-slider-container"><div class="hero-slider" id="heroSlider" onscroll="onHeroScroll(this)">`;
    dest.forEach((d, i) => {
        let classInfo = obterCorClassificacao(d.classificacao || "L");
        let nH = d.avaliacao && d.avaliacao !== "0.0" ? `<span class="hero-meta-star">★ ${d.avaliacao}</span>` : "";
        hFeed += `
        <div class="hero-slide" id="slide-${i}" style="background-image:url('${d.logo_horizontal || d.logo}');">
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <h1 class="hero-title">${d.titulo.replace(" 🌀","")}</h1>
                <div class="hero-meta">
                    ${nH} 
                    <span class="hero-meta-age" style="background-color: ${classInfo.bg}; color: ${classInfo.color};">${classInfo.texto}</span> 
                    <span style="color:var(--text-muted);">${d.tipo === 'filme' ? 'Filme' : 'Série'}</span>
                </div>
                <p class="hero-synopsis">${d.sinopse || 'Assista agora em alta definição no KINGFILMS.'}</p>
                <div class="hero-buttons">
                    <button class="btn-play" onclick="abrirDetalhes('${d.id}')">▶ Assistir</button>
                    <button class="btn-info" onclick="abrirDetalhes('${d.id}')">ℹ Mais Info</button>
                </div>
            </div>
        </div>`;
    });
    hFeed += `</div><div class="slider-dots">`;
    dest.forEach((_, i) => { hFeed += `<div class="dot ${i === 0 ? 'active' : ''}" id="dot-${i}" onclick="irParaSlide(${i})"></div>`; });
    hFeed += `</div></div>`;
    setTimeout(() => { iniciarSlider(dest.length); }, 100);
  }

  hFeed += `<div class="quick-categories">`;
  cats.slice(0, 8).forEach(c => { hFeed += `<div class="quick-cat-card" onclick="verCategoriaCompleta('${c}')"><span style="font-size:16px;">${getIcon(c)}</span> <span style="font-weight:600; font-size:12px;">${c.toUpperCase()}</span></div>`; });
  hFeed += `</div>`;

  // ABA ACABARAM DE CHEGAR
  let recemChegados = todosDados.slice(0, 15);
  if(recemChegados.length > 0){
      hFeed += `<div class="categoria-section">` + renderSectionHeader('Acabaram de Chegar', '🔥') + `<div class="content-row">`;
      recemChegados.forEach(i => { hFeed += criarCartaoHTML(i); }); hFeed += `</div></div>`;
  }

  let itensCont = continuarView.map(id => todosDados.find(i=>i.id===id)).filter(i=>i);
  if(itensCont.length > 0){ 
      hFeed += `<div class="categoria-section">` + renderSectionHeader('Continuar Assistindo', '▶') + `<div class="content-row">`; 
      itensCont.forEach(i => { hFeed += criarCartaoHTML(i); }); hFeed += `</div></div>`; 
  }

  let itensLista = minhaLista.map(id => todosDados.find(i=>i.id===id)).filter(i=>i);
  if(itensLista.length > 0){ 
      hFeed += `<div class="categoria-section">` + renderSectionHeader('Minha Lista', '➕') + `<div class="content-row">`; 
      itensLista.forEach(i => { hFeed += criarCartaoHTML(i); }); hFeed += `</div></div>`; 
  }

  hFeed += `
  <div class="telegram-banner">
      <div>
          <div class="tg-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L2 9.5L8.5 12.5L18 5L10.5 14L15.5 19L22 2Z" fill="#fff"/></svg> 
              Comunidade KINGFILMS
          </div>
          <div class="tg-desc">Faça pedidos de filmes e receba as novidades primeiro!</div>
      </div>
      <a href="https://t.me/+kMxAz5AFIOIyYzJh" target="_blank" class="tg-btn">ENTRAR NO GRUPO</a>
  </div>`;

  cats.forEach(c => {
      let iCat = todosDados.filter(i => (i.categoria || 'Outros') === c);
      let iCar = iCat.slice(0, 15);
      hFeed += `<div class="categoria-section">` + renderSectionHeader(c) + `<div class="content-row">`;
      iCar.forEach(i => { hFeed += criarCartaoHTML(i); });
      hFeed += `</div>`;
      if(iCat.length > 15) hFeed += `<button class="btn-ver-mais" onclick="verCategoriaCompleta('${c}')">Ver Mais</button>`;
      hFeed += `</div>`;
  });
  
  f.innerHTML = hFeed;
}

function verCategoriaCompleta(c, salvar=true){
  if(salvar){ history.pushState(null, '', window.location.pathname); historicoNav.push({t:'c',v:c}); }
  listaAtual = todosDados.filter(i => (i.categoria || 'Outros') === c);
  let h = `<div style="padding: 10px 4%;"><h2 class="section-title" style="margin-bottom:20px; cursor:pointer;" onclick="voltarPagina()">← ${c.toUpperCase()}</h2><div class="grid-view">`;
  listaAtual.forEach(i => { h += criarCartaoHTML(i); }); h += `</div></div>`;
  document.getElementById('feedPrincipal').innerHTML = h; window.scrollTo({top:0, behavior:'instant'});
}

function pesquisarConteudo(salvar=true, ignorarPilha=false) {
  let t = document.getElementById('campoPesquisa').value.toLowerCase().trim();
  if(t === "") { renderizarHome(); return; }
  if(salvar && !ignorarPilha){ let ult=historicoNav.length>0?historicoNav[historicoNav.length-1]:null; if(!ult||ult.t!=='b') historicoNav.push({t:'b',v:t}); else ult.v=t; }
  
  listaAtual = todosDados.filter(i => i.titulo.toLowerCase().includes(t));
  let h = `<div style="padding: 10px 4%;"><h2 class="section-title" style="margin-bottom:20px; cursor:pointer;" onclick="voltarPagina()">← Resultados para "${t}"</h2><div class="grid-view">`;
  
  if(listaAtual.length === 0) h = `<div style="text-align:center; padding:100px 0;"><p style="color:var(--text-muted);">Nenhum resultado encontrado.</p></div>`;
  else listaAtual.forEach(i => { h += criarCartaoHTML(i); });
  
  document.getElementById('feedPrincipal').innerHTML = h + `</div></div>`;
  window.scrollTo({top:0, behavior:'instant'});
}

window.mudarTemporada = function(id, t) {
    document.querySelectorAll('.season-btn').forEach(b => { 
        b.style.color = 'var(--text-muted)'; 
        b.style.borderBottom = '2px solid transparent';
    });
    let btnAtivo = document.getElementById(`btn-temp-${t}`);
    if(btnAtivo) {
        btnAtivo.style.color = '#fff';
        btnAtivo.style.borderBottom = '2px solid var(--brand-red)';
    }
    renderEps(id, t);
};

function abrirDetalhes(id, salvarUrl=true) {
  if(salvarUrl){ history.pushState(null, '', '?id=' + id); historicoNav.push({t:'d',v:id}); }
  let i = todosDados.find(x => x.id === id);
  let tps = Object.keys(i.temporadas).sort((a,b) => parseInt(a) - parseInt(b));
  let inList = minhaLista.includes(id);
  let classInfo = obterCorClassificacao(i.classificacao || "L");

  let sT = "";
  if(tps.length > 1) {
      sT = `<div style="display:flex; gap:20px; overflow-x:auto; margin-bottom:30px; border-bottom:1px solid var(--glass-border); scrollbar-width:none;">`;
      tps.forEach((t, x) => { 
          let color = x === 0 ? `#fff` : `var(--text-muted)`;
          let border = x === 0 ? `border-bottom: 2px solid var(--brand-red);` : `border-bottom: 2px solid transparent;`;
          sT += `<button class="season-btn" id="btn-temp-${t}" onclick="mudarTemporada('${id}','${t}')" style="background:transparent; border:none; ${border} font-weight:700; font-size:15px; cursor:pointer; color:${color}; padding-bottom:10px; transition:0.3s; white-space:nowrap;">Temporada ${t}</button>`; 
      });
      sT += `</div>`;
  } else { sT = `<input type="hidden" id="tempAtualOculta" value="${tps[0]}">`; }

  let html = `
    <div style="width: 100%; position: relative;">
        <div class="detail-hero-fullscreen" style="background-image:url('${i.logo_horizontal || i.logo}');">
            <div class="detail-gradient-fullscreen"></div>
            <div class="voltar-btn-fullscreen" onclick="voltarPagina()">← Voltar</div>
            <div class="detail-content-fullscreen">
                <h1 class="detail-title-fs">${i.titulo.replace(" 🌀","")}</h1>
                <div class="detail-meta-fs">
                    <span style="background-color:${classInfo.bg}; color:${classInfo.color}; padding:4px 10px; border-radius:6px; font-weight:800;">${classInfo.texto}</span>
                    <span style="color:#10B981;">★ ${i.avaliacao || "N/A"}</span>
                    <span style="color:var(--text-muted);">${i.categoria}</span>
                </div>
                <button class="btn-add-lista-fs ${inList ? 'active' : ''}" onclick="addLista('${id}')">
                    ${inList ? '✓ Adicionado à Lista' : '➕ Adicionar à Lista'}
                </button>
            </div>
        </div>
        
        <div class="detail-body-container">
            <div class="synopsis-container">
                <h3 class="synopsis-title">Sinopse</h3>
                <p class="synopsis-text">${i.sinopse || "Sinopse não disponível no momento."}</p>
            </div>
            
            ${sT}
            <div id="listaEps"></div>
        </div>
    </div>`;
    
  document.getElementById('feedPrincipal').innerHTML = html;
  renderEps(id, tps[0]); window.scrollTo({top: 0, behavior: 'instant'});
}

function renderEps(id, t) {
    let i = todosDados.find(x => x.id === id);
    if(!t) { let h = document.getElementById('tempAtualOculta'); if(h) t = h.value; }
    if(!t || !i.temporadas[t]) return;
    
    document.getElementById('listaEps').innerHTML = i.temporadas[t].map((e) => {
        let epTitle = e.tit.replace(" 🌀", "");
        if(epTitle.toLowerCase().trim() === "assistir" || epTitle.trim() === "1") {
            epTitle = "Filme Completo";
        }
        
        return `
        <div class="ep-card-modern" onclick="playVid('${id}', '${e.linkFisico}')">
            <div class="ep-card-left">
                <img src="${e.logoEp}" class="ep-img-modern" loading="lazy">
                <div>
                    <h4 class="ep-title-modern">${epTitle}</h4>
                    <span style="font-size:12px; color:var(--text-muted); font-weight:500;">Clique para iniciar a reprodução</span>
                </div>
            </div>
            <div class="ep-play-btn">▶</div>
        </div>
        `;
    }).join('');
}