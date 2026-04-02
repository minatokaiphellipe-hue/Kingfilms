// --- CONFIGURAÇÃO FIREBASE (KINGFILMS VIP) ---
const firebaseConfig = {
  apiKey: "AIzaSyC4J1kgFaxzUINkL8NfJ6mIRcUiblrNgDQ",
  authDomain: "kingfilms-app-7a1b5.firebaseapp.com",
  projectId: "kingfilms-app-7a1b5",
  storageBucket: "kingfilms-app-7a1b5.firebasestorage.app",
  messagingSenderId: "225789446793",
  appId: "1:225789446793:web:fce415131cb8c593f05458"
};

// Inicializa o Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

let todosDados=[], historicoNav=[];
let minhaLista = JSON.parse(localStorage.getItem('kf_lista')) || [];
let continuarView = JSON.parse(localStorage.getItem('kf_cont')) || [];
let listaAtual = [], itensExibidos = 0;
const ITENS_POR_PAGINA = 24;

function verificarLogin() {
    let user = localStorage.getItem('kf_user');
    if(user) {
        let userData = JSON.parse(user);
        document.getElementById('headerProfilePic').src = userData.avatar;
        document.getElementById('headerProfileName').innerText = userData.nome;
    } else {
        document.getElementById('headerProfilePic').src = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
        document.getElementById('headerProfileName').innerText = 'Entrar';
    }
}
window.gerirLogin = function() {
    let user = localStorage.getItem('kf_user');
    if(user) {
        if(confirm("Deseja terminar sessão na sua conta?")) {
            localStorage.removeItem('kf_user');
            verificarLogin();
            document.getElementById('loginOverlay').classList.remove('hidden');
        }
    } else { 
        document.getElementById('loginOverlay').classList.remove('hidden'); 
    }
};
window.fecharLogin = function() { document.getElementById('loginOverlay').classList.add('hidden'); };

window.logarComGoogle = function() {
    let erro = document.getElementById('authErro');
    erro.innerText = "A ligar ao Google...";
    
    auth.signInWithPopup(googleProvider)
    .then((result) => {
        const user = result.user;
        let nome = user.displayName ? user.displayName.split(" ")[0] : "Usuário";
        let avatar = user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png";
        fazerLogin(nome, avatar);
    })
    .catch((error) => {
        console.error("Erro no Google Sign-In:", error);
        erro.innerText = "Erro ao entrar com o Google.";
    });
};

window.fazerLogin = function(nome, avatar) {
    localStorage.setItem('kf_user', JSON.stringify({nome, avatar}));
    fecharLogin(); verificarLogin();
    minhaLista = []; continuarView = [];
    localStorage.removeItem('kf_lista'); localStorage.removeItem('kf_cont');
    renderizarHome(false);
};
verificarLogin();

document.addEventListener('DOMContentLoaded',async()=>{
  try{
    const r=await fetch('catalogo_pro.json?v='+Date.now());
    todosDados=await r.json(); todosDados.reverse();
    const params = new URLSearchParams(window.location.search);
    if(params.get('id')) abrirDetalhes(params.get('id'), false);
    else renderizarHome(false);
  }catch(e){document.getElementById('feedPrincipal').innerHTML='<p style="color:red;text-align:center;padding:50px">Erro ao carregar catálogo.</p>';}
});

window.addEventListener('popstate', () => {
    const p = new URLSearchParams(window.location.search);
    if(p.get('id')) abrirDetalhes(p.get('id'), false);
    else renderizarHome(false);
});
function voltarPagina(){
  if(historicoNav.length>1){
    historicoNav.pop();
    let t=historicoNav[historicoNav.length-1];
    if(t.t==='h')renderizarHome(false);
    else if(t.t==='c')verCategoriaCompleta(t.v,false);
    else if(t.t==='b'){document.getElementById('campoPesquisa').value=t.v;pesquisarConteudo(false,true);}
    else if(t.t==='d')abrirDetalhes(t.v,false);
  }else{
    if(window.history.length > 1) window.history.back();
    else renderizarHome();
  }
}
window.addLista = function(id) {
    if(minhaLista.includes(id)) minhaLista = minhaLista.filter(i => i !== id);
    else minhaLista.push(id);
    localStorage.setItem('kf_lista', JSON.stringify(minhaLista));
    if(document.getElementById('btnListaFlutuante')){
        let inList = minhaLista.includes(id);
        let btn = document.getElementById('btnListaFlutuante');
        btn.style.background = inList ? '#e50914' : 'rgba(0,0,0,0.5)';
        btn.style.borderColor = inList ? '#e50914' : 'rgba(255,255,255,0.2)';
        btn.innerHTML = inList ? '✓ Na Sua Lista' : '➕ Minha Lista';
    } else {
        renderizarHome(false);
    }
};

/* REDIRECIONAMENTO EXATO PARA A URL FÍSICA NA PASTA /v/ */
window.playVid = function(id, link) {
    // 1. Grava no Continuar Assistindo
    continuarView = continuarView.filter(i => i !== id);
    continuarView.unshift(id);
    if(continuarView.length > 15) continuarView.pop();
    localStorage.setItem('kf_cont', JSON.stringify(continuarView));
    
    // 2. Leva o utilizador para a URL exata do filme
    window.location.href = link; 
};

function abrirMenu(){document.getElementById('sidebarMenu').classList.add('open');document.getElementById('sidebarOverlay').classList.add('open');}
function fecharMenu(){document.getElementById('sidebarMenu').classList.remove('open');document.getElementById('sidebarOverlay').classList.remove('open');}
const getIcon=(c)=>{let l=c.toLowerCase();if(l.includes('oscar'))return '🏆';if(l.includes('filme'))return '🎬';if(l.includes('série'))return '📺';if(l.includes('anime'))return '⛩️';if(l.includes('animaç'))return '🦄';if(l.includes('desenho'))return '🖍️';if(l.includes('ação'))return '💥';if(l.includes('comédia'))return '😂';if(l.includes('terror')||l.includes('horror'))return '👻';if(l.includes('romance'))return '❤️';if(l.includes('ficção'))return '👽';if(l.includes('doc'))return '🌍';return '🍿';};

function criarCartaoHTML(item,isHorizontal=false){
  let imgCapa=isHorizontal?(item.logo_horizontal||item.logo):item.logo;
  let notaBadge = (item.avaliacao && item.avaliacao !== "0.0" && item.avaliacao !== "N/A") ? `<div style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.5); color:#fff; padding:4px 8px; border-radius:8px; font-size:12px; font-weight:700; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.1); z-index:2; display:flex; align-items:center; gap:4px; box-shadow:0 4px 10px rgba(0,0,0,0.3);"><span style="color:#f5c518; font-size:10px;">★</span> ${item.avaliacao}</div>` : "";
  let classCor = "#0f0"; let tC = item.classificacao || "L";
  if(tC==="Livre"||tC==="L"){classCor="#10b981";tC="L";}else if(tC==="10")classCor="#0ea5e9";else if(tC==="12")classCor="#f59e0b";else if(tC==="14")classCor="#f97316";else if(tC==="16"||tC==="18"||tC.includes("TV-MA")||tC.includes("R"))classCor="#ef4444";
  let classBadge = `<div style="position:absolute; top:10px; left:10px; background:${classCor}; color:#fff; padding:3px 6px; border-radius:6px; font-size:11px; font-weight:800; z-index:2; box-shadow: 0 4px 10px rgba(0,0,0,0.3); text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${tC}</div>`;
  return `<div class="content-card" onclick="abrirDetalhes('${item.id}')"><div style="position:relative;width:100%;"><img src="${imgCapa}" alt="${item.titulo}" loading="lazy" style="display:block;width:100%;">${notaBadge}${classBadge}</div><div class="card-info"><h3>${item.titulo.replace(" 🌀","")}</h3></div></div>`;
}

function gerarTop10(){
  if(todosDados.length<10)return"";let d=new Date(),s=Math.ceil((((d-new Date(Date.UTC(d.getUTCFullYear(),0,1)))/86400000)+1)/7)+d.getFullYear(),r=function(){let x=Math.sin(s++)*10000;return x-Math.floor(x);},em=[...todosDados];
  for(let i=em.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[em[i],em[j]]=[em[j],em[i]];}
  let t10=em.slice(0,10),h=`<div class="top10-section"><h2 class="categoria-title">🔥 TOP 10 da Semana</h2><div class="top10-row">`;
  t10.forEach((i,x)=>{h+=`<div class="top10-card" onclick="abrirDetalhes('${i.id}')"><div class="top10-number">${x+1}</div><div class="top10-img-box"><img src="${i.logo}" alt="${i.titulo}" loading="lazy"></div></div>`;});return h+`</div></div>`;
}

let currHero=0, totHero=0, heroInt;
let currShow=0, totShow=0, showInt;
function renderizarHome(salvarUrl=true){
  if(salvarUrl){history.pushState(null, '', window.location.pathname); historicoNav=[{t:'h'}];}
  const f=document.getElementById('feedPrincipal');
  clearInterval(heroInt); clearInterval(showInt);
  if(document.getElementById('campoPesquisa'))document.getElementById('campoPesquisa').value="";
  
  let cats=[...new Set(todosDados.map(i=>i.categoria||'Outros'))],hSidebar=`<div class="sidebar-item" onclick="fecharMenu(); renderizarHome();">🏠 Início</div>`;
  cats.forEach(c=>{if(!c.toLowerCase().includes('oscar'))hSidebar+=`<div class="sidebar-item" onclick="fecharMenu(); verCategoriaCompleta('${c}')">${getIcon(c)} ${c}</div>`;});document.getElementById('sidebarContent').innerHTML=hSidebar;
  let hFeed="";
  
  if(todosDados.length>0){
    let destHero=todosDados.slice(0,5);
    hFeed+=`<div class="hero-slider" id="heroSlider">`;
    destHero.forEach((d,i)=>{
      let cC="#0f0",tC=d.classificacao||"L";if(tC==="Livre"||tC==="L"){cC="#10b981";tC="Livre";}else if(tC==="10")cC="#0ea5e9";else if(tC==="12")cC="#f59e0b";else if(tC==="14")cC="#f97316";else if(tC==="16"||tC==="18"||tC.includes("TV-MA")||tC.includes("R"))cC="#ef4444";
      let nH=d.avaliacao&&d.avaliacao!=="0.0"&&d.avaliacao!=="N/A"?`<span style="color:#f5c518;">★</span> ${d.avaliacao}`:"";
      let tituloHeroHTML = d.logo_png ? `<img src="${d.logo_png}" alt="${d.titulo}" class="hero-title-img">` : `<h1 class="hero-title">${d.titulo.replace(" 🌀","")}</h1>`;
      
      hFeed+=`<div class="hero-slide ${i===0?'active':''}" id="h-slide-${i}" style="background-image:url('${d.logo_horizontal||d.logo}');"><div class="hero-overlay"></div><div class="hero-content">${tituloHeroHTML}<div class="hero-meta">${nH!=""?`<span style="background:rgba(0,0,0,0.5);color:#fff;padding:4px 10px;border-radius:6px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.1);">${nH}</span>`:""}<span style="background:${cC};color:#fff;padding:4px 10px;border-radius:6px;">${tC}</span><span style="color:#e2e8f0;">${d.tipo==='filme'?'Filme':'Série'}</span></div><p class="hero-synopsis">${d.sinopse||'Assista agora no KINGFILMS.'}</p><div class="hero-buttons"><button class="btn-hero-play" onclick="abrirDetalhes('${d.id}')">▶ Assistir</button><button class="btn-hero-info" onclick="abrirDetalhes('${d.id}')">ℹ Mais Info</button></div></div></div>`;
    });
    hFeed+=`<div class="slider-dots">`;destHero.forEach((_,i)=>{hFeed+=`<div class="dot ${i===0?'active':''}" id="h-dot-${i}" onclick="mudarHero(${i})"></div>`;});hFeed+=`</div></div>`;
  }
  
  hFeed+=`<div class="quick-categories"><div class="quick-cat-card" onclick="document.getElementById('recem-adicionados').scrollIntoView({behavior:'smooth'})"><span class="quick-cat-icon">🔥</span><span class="quick-cat-title">Lançamentos</span></div>`;
  cats.forEach(c=>{if(!c.toLowerCase().includes('oscar'))hFeed+=`<div class="quick-cat-card" onclick="verCategoriaCompleta('${c}')"><span class="quick-cat-icon">${getIcon(c)}</span><span class="quick-cat-title">${c}</span></div>`;});
  hFeed+=`</div>`;

  let itensCont = continuarView.map(id => todosDados.find(i=>i.id===id)).filter(i=>i);
  if(itensCont.length > 0){hFeed+=`<div class="categoria-section"><h2 class="categoria-title" style="color:#f59e0b;">▶ Continuar Assistindo</h2><div class="content-row">`;itensCont.forEach(i=>{hFeed+=criarCartaoHTML(i,false);}); hFeed+=`</div></div>`;}

  let itensLista = minhaLista.map(id => todosDados.find(i=>i.id===id)).filter(i=>i);
  if(itensLista.length > 0){hFeed+=`<div class="categoria-section"><h2 class="categoria-title" style="color:#10b981;">➕ Minha Lista</h2><div class="content-row">`;itensLista.forEach(i=>{hFeed+=criarCartaoHTML(i,false);}); hFeed+=`</div></div>`;}

  hFeed+=`<div class="telegram-banner"><div class="tg-text"><div class="tg-title"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L2 9.5L8.5 12.5L18 5L10.5 14L15.5 19L22 2Z" fill="#fff"/></svg> Comunidade KINGFILMS</div><div class="tg-desc">Faça pedidos e receba atualizações!</div></div><a href="https://t.me/+kMxAz5AFIOIyYzJh" target="_blank" class="tg-btn">ENTRAR NO GRUPO</a></div>`;
  
  hFeed+=gerarTop10();

  if(todosDados.length > 5){
    let destShowcase = todosDados.slice(5, 9);
    if(destShowcase.length < 4) destShowcase = todosDados.slice(0, 4);
    
    hFeed+=`<div class="showcase-slider-container" id="showcaseSlider"><div class="showcase-track" id="showcaseTrack">`;
    destShowcase.forEach((d,i)=>{
      let tC=d.classificacao||"L";if(tC==="Livre"||tC==="L"){tC="Livre";}
      let nH=d.avaliacao&&d.avaliacao!=="0.0"&&d.avaliacao!=="N/A"?d.avaliacao:"";
      let tituloHeroHTML = d.logo_png ? `<img src="${d.logo_png}" alt="${d.titulo}" class="showcase-title-img">` : `<h1 class="showcase-title">${d.titulo.replace(" 🌀","")}</h1>`;
      let classCSS = "";
      if(i === 0) classCSS = "active";
      else if(i === 1) classCSS = "next";
      else if(i === destShowcase.length - 1) classCSS = "prev";

      hFeed+=`
      <div class="showcase-slide ${classCSS}" id="s-slide-${i}" onclick="if(!this.classList.contains('active')) mudarShowcase(${i}); else abrirDetalhes('${d.id}');">
          <div class="showcase-img-box">
              <img src="${d.logo}" alt="${d.titulo}">
              <div class="showcase-overlay"></div>
              <div class="showcase-play-icon"></div>
          </div>
          <div class="showcase-content">
              ${tituloHeroHTML}
              <div class="showcase-meta">
                  <span style="border:1px solid #777; padding:1px 5px; border-radius:4px; color:#ccc;">${tC}</span>
                  <span class="showcase-meta-divider">|</span>
                  <span>${d.tipo==='filme'?'Filme':'Série'}</span>
                  ${nH?`<span class="showcase-meta-divider">|</span><span style="color:#f5c518;">★</span> ${nH}`:''}
              </div>
          </div>
      </div>`;
    });
    hFeed+=`</div><div class="slider-dots">`;
    destShowcase.forEach((_,i)=>{hFeed+=`<div class="dot ${i===0?'active':''}" id="s-dot-${i}" onclick="mudarShowcase(${i})"></div>`;});
    hFeed+=`</div></div>`;
  }

  let itensOscar=todosDados.filter(i=>(i.categoria||'').toLowerCase().includes('oscar'));
  if(itensOscar.length>0){hFeed+=`<div class="oscar-section" id="oscar-2026"><h2 class="oscar-title"><span class="oscar-icon">🏆</span> Vencedores do Oscar</h2><div class="content-row">`;itensOscar.forEach(item=>{hFeed+=criarCartaoHTML(item,false);});hFeed+=`</div></div>`;}
  
  let rec=todosDados.slice(0,10);hFeed+=`<div class="categoria-section" id="recem-adicionados"><h2 class="categoria-title">ACABARAM DE CHEGAR</h2><div class="content-row">`;rec.forEach(i=>{hFeed+=criarCartaoHTML(i,false);});hFeed+=`</div></div>`;
  
  cats.forEach(c=>{if(c.toLowerCase().includes('oscar'))return;let idS=c.replace(/\s+/g,'-').toLowerCase(),iCat=todosDados.filter(i=>(i.categoria||'Outros')===c),iCar=iCat.slice(0,10);hFeed+=`<div class="categoria-section" id="${idS}"><h2 class="categoria-title">${c.toUpperCase()}</h2><div class="content-row">`;iCar.forEach(i=>{hFeed+=criarCartaoHTML(i,false);});hFeed+=`</div>`;if(iCat.length>10)hFeed+=`<button class="btn-ver-mais" onclick="verCategoriaCompleta('${c}')">Ver todos os conteúdos de ${c} ▾</button>`;hFeed+=`</div>`;});
  
  f.innerHTML=hFeed;

  setTimeout(()=>{ 
      if(todosDados.length>0) iniciarHero(5);
      if(todosDados.length>5) iniciarShowcase(4);
      configurarSwipe();
  }, 100);
}

window.iniciarHero = function(t){ totHero=t; currHero=0; clearInterval(heroInt); if(t>1) heroInt=setInterval(()=>{mudarHero((currHero+1)%totHero);}, 8000); };
window.mudarHero = function(i){
    let s=document.querySelectorAll('.hero-slide'), d=document.querySelectorAll('#heroSlider .dot');
    if(!s.length||!d.length)return;
    s.forEach(e=>e.classList.remove('active')); d.forEach(e=>e.classList.remove('active'));
    document.getElementById(`h-slide-${i}`).classList.add('active');
    document.getElementById(`h-dot-${i}`).classList.add('active');
    currHero=i; clearInterval(heroInt); heroInt=setInterval(()=>{mudarHero((currHero+1)%totHero);}, 8000);
};

window.iniciarShowcase = function(t){ totShow=t; currShow=0; clearInterval(showInt); if(t>1) showInt=setInterval(()=>{mudarShowcase((currShow+1)%totShow);}, 6000); };
window.mudarShowcase = function(i){
    let s = document.querySelectorAll('.showcase-slide');
    let d = document.querySelectorAll('#showcaseSlider .dot');
    if(!s.length || !d.length) return;
    s.forEach(e => e.classList.remove('active', 'prev', 'next'));
    d.forEach(e => e.classList.remove('active'));
    let prevIdx = (i - 1 + totShow) % totShow;
    let nextIdx = (i + 1) % totShow;
    document.getElementById(`s-slide-${prevIdx}`).classList.add('prev');
    document.getElementById(`s-slide-${i}`).classList.add('active');
    document.getElementById(`s-slide-${nextIdx}`).classList.add('next');
    document.getElementById(`s-dot-${i}`).classList.add('active');
    currShow=i; clearInterval(showInt); showInt=setInterval(()=>{mudarShowcase((currShow+1)%totShow);}, 6000);
};

function configurarSwipe(){
    let hs=document.getElementById('heroSlider');
    if(hs){
        let sx=0, ex=0;
        hs.addEventListener('touchstart',e=>{sx=e.changedTouches[0].screenX;},{passive:true});
        hs.addEventListener('touchend',e=>{ex=e.changedTouches[0].screenX; if(sx-ex>50) mudarHero((currHero+1)%totHero); else if(ex-sx>50) mudarHero((currHero-1+totHero)%totHero);},{passive:true});
    }
    let ss=document.getElementById('showcaseSlider');
    if(ss){
        let sx=0, ex=0;
        ss.addEventListener('touchstart',e=>{sx=e.changedTouches[0].screenX;},{passive:true});
        ss.addEventListener('touchend',e=>{ex=e.changedTouches[0].screenX; if(sx-ex>50) mudarShowcase((currShow+1)%totShow); else if(ex-sx>50) mudarShowcase((currShow-1+totShow)%totShow);},{passive:true});
    }
}

function verCategoriaCompleta(c,salvar=true){
  if(salvar){history.pushState(null, '', window.location.pathname); historicoNav.push({t:'c',v:c});}
  clearInterval(heroInt); clearInterval(showInt); listaAtual=todosDados.filter(i=>(i.categoria||'Outros')===c);itensExibidos=ITENS_POR_PAGINA;
  let f=document.getElementById('feedPrincipal');
  let h=`<div style="padding:15px 5%;"><button onclick="voltarPagina()" style="background:#e50914;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin-bottom:20px;font-weight:bold;box-shadow:0 4px 10px rgba(229,9,20,0.3);">← Voltar</button><h2 class="categoria-title" style="margin-left:0;margin-bottom:20px;">${getIcon(c)} TUDO EM: ${c.toUpperCase()}</h2></div><div class="grid-view" id="gridResultados">`;
  let exibidos=listaAtual.slice(0,itensExibidos);exibidos.forEach(i=>{h+=criarCartaoHTML(i,false);});h+=`</div>`;
  if(listaAtual.length>itensExibidos){h+=`<button id="btnCarregarMais" onclick="carregarMais()" style="display:block;width:90%;max-width:400px;margin:30px auto;background:rgba(255,255,255,0.05);color:#fff;border:1px solid #e50914;padding:15px;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;transition:0.3s;box-shadow:0 4px 15px rgba(229,9,20,0.2);">Carregar Mais ▾</button>`;}
  f.innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
}

function pesquisarConteudo(salvar=true, ignorarPilha=false){
  clearInterval(heroInt); clearInterval(showInt); let t=document.getElementById('campoPesquisa').value.toLowerCase().trim(),f=document.getElementById('feedPrincipal');
  if(t===""){renderizarHome();return;}
  if(salvar && !ignorarPilha){let ult=historicoNav.length>0?historicoNav[historicoNav.length-1]:null;if(!ult||ult.t!=='b')historicoNav.push({t:'b',v:t});else ult.v=t;}
  listaAtual=todosDados.filter(i=>i.titulo.toLowerCase().includes(t));itensExibidos=ITENS_POR_PAGINA;
  if(listaAtual.length===0){f.innerHTML=`<div style="padding:15px 5%;"><button onclick="voltarPagina()" style="background:#e50914;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin-bottom:20px;font-weight:bold;box-shadow:0 4px 10px rgba(229,9,20,0.3);">← Voltar</button></div><div style="text-align:center;margin-top:60px;color:#888;"><span style="font-size:45px;">😕</span><br><br><p>Nenhum resultado para "<b>${t}</b>"</p></div>`;return;}
  let h=`<div style="padding:15px 5%;"><button onclick="voltarPagina()" style="background:#e50914;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin-bottom:20px;font-weight:bold;box-shadow:0 4px 10px rgba(229,9,20,0.3);">← Voltar</button><h2 class="categoria-title" style="margin-left:0;color:#e50914;">Resultados para "${t}"</h2></div><div class="grid-view" id="gridResultados">`;
  let exibidos=listaAtual.slice(0,itensExibidos);exibidos.forEach(i=>{h+=criarCartaoHTML(i,false);});h+=`</div>`;
  if(listaAtual.length>itensExibidos){h+=`<button id="btnCarregarMais" onclick="carregarMais()" style="display:block;width:90%;max-width:400px;margin:30px auto;background:rgba(255,255,255,0.05);color:#fff;border:1px solid #e50914;padding:15px;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;transition:0.3s;box-shadow:0 4px 15px rgba(229,9,20,0.2);">Carregar Mais ▾</button>`;}
  f.innerHTML=h;
}

window.carregarMais = function() {
    let grid=document.getElementById('gridResultados'),btn=document.getElementById('btnCarregarMais'),proximos=listaAtual.slice(itensExibidos,itensExibidos+ITENS_POR_PAGINA),h="";
    proximos.forEach(i=>{h+=criarCartaoHTML(i,false);});grid.insertAdjacentHTML('beforeend',h);itensExibidos+=ITENS_POR_PAGINA;
    if(itensExibidos>=listaAtual.length)btn.style.display='none';
};

function fecharPesquisa(){renderizarHome();}
function mudarTemporada(id,t){document.querySelectorAll('.season-btn').forEach(b=>b.classList.remove('active'));let b=document.getElementById(`btn-temp-${t}`);if(b){b.classList.add('active');b.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});}renderEps(id,t);}

function abrirDetalhes(id, salvarUrl=true){
  if(salvarUrl){history.pushState(null, '', '?id=' + id); historicoNav.push({t:'d',v:id});}
  clearInterval(heroInt); clearInterval(showInt);
  let i=todosDados.find(x=>x.id===id), f=document.getElementById('feedPrincipal');
  let tps=Object.keys(i.temporadas).sort((a,b)=>parseInt(a)-parseInt(b)), sT="";
  
  if(tps.length>1){
      sT=`<div class="season-tabs-container" id="seasonTabsContainer" style="margin-bottom:30px;">`;
      tps.forEach((t,x)=>{sT+=`<button class="season-btn ${x===0?'active':''}" id="btn-temp-${t}" onclick="mudarTemporada('${id}','${t}')">Temporada ${t}</button>`;});
      sT+=`</div>`;
  } else {
      sT=`<input type="hidden" id="tempAtualOculta" value="${tps[0]}">`;
  }
  
  let cC="#0f0", tC=i.classificacao||"L";
  if(tC==="Livre"||tC==="L"){cC="#10b981";tC="Livre";}else if(tC==="10")cC="#0ea5e9";else if(tC==="12")cC="#f59e0b";else if(tC==="14")cC="#f97316";else if(tC==="16"||tC==="18"||tC.includes("TV-MA")||tC.includes("R"))cC="#ef4444";
  
  let nH=i.avaliacao&&i.avaliacao!=="0.0"&&i.avaliacao!=="N/A"?`<span style="color:#f5c518;font-weight:bold;">★</span> <span style="font-weight:bold;color:#fff;">${i.avaliacao}</span>`:"";
  let sF=i.sinopse||"Assista agora no KINGFILMS.";
  let rel=todosDados.filter(x=>(x.categoria||'Outros')===(i.categoria||'Outros')&&x.id!==i.id).slice(0,10), hR="";
  
  if(rel.length>0){
      hR=`<div style="margin-top:60px; border-top:1px solid rgba(255,255,255,0.05); padding-top:40px;"><h2 class="categoria-title" style="margin-left:0;">${i.tipo==='serie'?'Séries':'Filmes'} Relacionados</h2><div class="content-row" style="padding:0 0 20px 0;">`;
      rel.forEach(r=>{hR+=criarCartaoHTML(r,false);});
      hR+=`</div></div>`;
  }
  
  let inList = minhaLista.includes(id);
  let btnLista = `<button id="btnListaFlutuante" onclick="addLista('${id}')" style="background:${inList?'#e50914':'rgba(0,0,0,0.5)'}; color:#fff; border:1px solid ${inList?'#e50914':'rgba(255,255,255,0.2)'}; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold; transition:all 0.3s ease; backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); box-shadow: 0 4px 15px rgba(0,0,0,0.5);" onmouseover="this.style.transform='scale(1.05)';" onmouseout="this.style.transform='scale(1)';">${inList?'✓ Na Sua Lista':'➕ Minha Lista'}</button>`;
  
  let tituloDetalheHTML = i.logo_png ? `<img src="${i.logo_png}" alt="${i.titulo}" style="max-width:100%; max-height:160px; object-fit:contain; filter:drop-shadow(0 10px 15px rgba(0,0,0,0.8)); margin-bottom:15px; display:block;">` : `<h1 style="font-size:3.5rem;font-weight:900;margin:0 0 15px 0;text-shadow:0 4px 15px rgba(0,0,0,0.9);line-height:1.1;letter-spacing:-1px;">${i.titulo.replace(" 🌀","")}</h1>`;

  f.innerHTML=`
  <div style="position:relative; width:100%; height:75vh; min-height:550px; background-image:url('${i.logo_horizontal||i.logo}'); background-size:cover; background-position:center top; margin-top:-5px;">
      <div style="position:absolute; inset:0; background:linear-gradient(to top, #071022 0%, rgba(7,16,34,0.8) 35%, rgba(0,0,0,0.2) 100%);"></div>
      <div style="position:absolute; top:25px; left:5%; right:5%; display:flex; justify-content:space-between; z-index:10; max-width:1200px; margin:0 auto;">
          <button onclick="voltarPagina()" style="background:rgba(0,0,0,0.5); color:white; border:1px solid rgba(255,255,255,0.2); padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold; backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); box-shadow:0 4px 15px rgba(0,0,0,0.5); transition:all 0.3s ease;" onmouseover="this.style.background='#e50914'; this.style.borderColor='#e50914'; this.style.transform='scale(1.05)';" onmouseout="this.style.background='rgba(0,0,0,0.5)'; this.style.borderColor='rgba(255,255,255,0.2)'; this.style.transform='scale(1)';">← Voltar</button>
          ${btnLista}
      </div>
      <div style="position:absolute; bottom:0; left:0; width:100%; padding:0 5% 40px 5%; z-index:10;">
          <div style="max-width:1000px; margin:0 auto;">
              ${tituloDetalheHTML}
              <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px; font-size:14px; flex-wrap:wrap; text-shadow:1px 1px 4px rgba(0,0,0,0.8);">
                  ${nH!=""?`<span style="background:rgba(0,0,0,0.5);padding:4px 10px;border-radius:6px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.1);">${nH}</span>`:""}
                  <span style="background:${cC};color:#fff;padding:4px 10px;border-radius:6px;font-weight:bold;font-size:13px;box-shadow:0 2px 5px rgba(0,0,0,0.3); text-shadow:none;">${tC}</span>
                  <span style="color:#e2e8f0;font-weight:600;">${i.tipo==='filme'?'Filme':'Série'}</span>
              </div>
              <p style="color:#cbd5e1; font-size:16px; line-height:1.6; font-weight:400; max-width:800px; text-shadow:1px 1px 4px rgba(0,0,0,0.8); display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden;">${sF}</p>
          </div>
      </div>
  </div>
  <div style="max-width:1000px; margin:0 auto; padding:30px 5%;">
      ${sT}
      <div id="listaEps"></div>
      ${hR}
  </div>
  `;
  renderEps(id,tps[0]);window.scrollTo({top:0,behavior:'smooth'});
}

function renderEps(id,t){
    let i=todosDados.find(x=>x.id===id);if(!t){let h=document.getElementById('tempAtualOculta');if(h)t=h.value;}if(!t||!i.temporadas[t])return;
    document.getElementById('listaEps').innerHTML=i.temporadas[t].map(e=>`<div style="display:flex;align-items:center;gap:15px;background:rgba(255,255,255,0.03);padding:12px;margin-bottom:15px;border-radius:12px;cursor:pointer;border:1px solid rgba(255,255,255,0.05);transition:all 0.3s ease;backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);" onclick="playVid('${id}', '${e.linkFisico}')" onmouseover="this.style.transform='translateY(-3px)';this.style.background='rgba(255,255,255,0.08)';this.style.borderColor='rgba(255,255,255,0.2)';this.style.boxShadow='0 10px 25px rgba(0,0,0,0.5)';" onmouseout="this.style.transform='translateY(0)';this.style.background='rgba(255,255,255,0.03)';this.style.borderColor='rgba(255,255,255,0.05)';this.style.boxShadow='none';"><img src="${e.logoEp}" style="width:150px;aspect-ratio:16/9;object-fit:cover;border-radius:8px;box-shadow:0 4px 10px rgba(0,0,0,0.4);" loading="lazy"><div style="flex:1;overflow:hidden;"><h4 style="font-size:15px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;margin-bottom:10px;color:#f8fafc;font-weight:600;">${e.tit}</h4><div style="display:inline-flex;align-items:center;gap:6px;background:#e50914;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:bold;color:#fff;box-shadow:0 4px 10px rgba(229,9,20,0.3);">▶ Assista Agora</div></div></div>`).join('');
}