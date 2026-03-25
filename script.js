let todosDados=[],heroInterval,currentSlide=0,totalSlides=0,historicoNav=[];
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
        if(confirm("Deseja terminar sessão na sua conta ou trocar de perfil?")) {
            localStorage.removeItem('kf_user');
            verificarLogin();
            document.getElementById('loginOverlay').classList.remove('hidden');
            alternarPaineis('email');
        }
    } else { 
        document.getElementById('loginOverlay').classList.remove('hidden'); 
        alternarPaineis('email');
    }
};
window.fecharLogin = function() { document.getElementById('loginOverlay').classList.add('hidden'); };
window.alternarPaineis = function(painel) {
    document.getElementById('painelEmail').style.display = painel === 'email' ? 'flex' : 'none';
    document.getElementById('painelPerfis').style.display = painel === 'perfis' ? 'flex' : 'none';
    document.getElementById('authErro').innerText = "";
};
window.logarComEmail = function() {
    let email = document.getElementById('inputEmail').value.trim();
    let senha = document.getElementById('inputSenha').value.trim();
    let erro = document.getElementById('authErro');
    if(!email || !senha) { erro.innerText = "Preencha e-mail e senha!"; return; }
    if(!email.includes('@')) { erro.innerText = "E-mail inválido!"; return; }
    let db = JSON.parse(localStorage.getItem('kf_users_db')) || {};
    if(db[email]) {
        if(db[email].senha === senha) {
            fazerLogin(email.split('@')[0], 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png');
            document.getElementById('inputSenha').value = "";
        } else { erro.innerText = "Senha incorreta!"; }
    } else {
        db[email] = { senha: senha };
        localStorage.setItem('kf_users_db', JSON.stringify(db));
        fazerLogin(email.split('@')[0], 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png');
        document.getElementById('inputSenha').value = "";
    }
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
    abrirDetalhes(id, false);
};
window.playVid = function(id, link) {
    continuarView = continuarView.filter(i => i !== id);
    continuarView.unshift(id);
    if(continuarView.length > 15) continuarView.pop();
    localStorage.setItem('kf_cont', JSON.stringify(continuarView));
    window.location.href = link;
};

function abrirMenu(){document.getElementById('sidebarMenu').classList.add('open');document.getElementById('sidebarOverlay').classList.add('open');}
function fecharMenu(){document.getElementById('sidebarMenu').classList.remove('open');document.getElementById('sidebarOverlay').classList.remove('open');}
const getIcon=(c)=>{let l=c.toLowerCase();if(l.includes('oscar'))return '🏆';if(l.includes('filme'))return '🎬';if(l.includes('série'))return '📺';if(l.includes('anime'))return '⛩️';if(l.includes('animaç'))return '🦄';if(l.includes('desenho'))return '🖍️';if(l.includes('ação'))return '💥';if(l.includes('comédia'))return '😂';if(l.includes('terror')||l.includes('horror'))return '👻';if(l.includes('romance'))return '❤️';if(l.includes('ficção'))return '👽';if(l.includes('doc'))return '🌍';return '🍿';};
/* CARD CIRÚRGICO: Somente Capa e Título, sem texto abaixo */
function criarCartaoHTML(item,isHorizontal=false){
  let imgCapa=isHorizontal?(item.logo_horizontal||item.logo):item.logo;
  let notaBadge = (item.avaliacao && item.avaliacao !== "0.0" && item.avaliacao !== "N/A") ? `<div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.8); color:#46d369; padding:4px 6px; border-radius:6px; font-size:11px; font-weight:900; border:1px solid #46d369; z-index:2; box-shadow: 0 2px 5px rgba(0,0,0,0.8); backdrop-filter:blur(4px);">★ ${item.avaliacao}</div>` : "";
  let classCor = "#0f0"; let tC = item.classificacao || "L";
  if(tC==="Livre"||tC==="L"){classCor="#0f0";tC="L";}else if(tC==="10")classCor="#00a5ff";else if(tC==="12")classCor="#ffcc00";else if(tC==="14")classCor="#ff6600";else if(tC==="16"||tC==="18"||tC.includes("TV-MA")||tC.includes("R"))classCor="#e50914";
  let classBadge = `<div style="position:absolute; top:8px; left:8px; background:${classCor}; color:#000; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:900; z-index:2; box-shadow: 0 2px 5px rgba(0,0,0,0.8);">${tC}</div>`;
  
  return `<div class="content-card" onclick="abrirDetalhes('${item.id}')"><div style="position:relative;width:100%;"><img src="${imgCapa}" alt="${item.titulo}" loading="lazy" style="display:block;width:100%;">${notaBadge}${classBadge}</div><div class="card-info"><h3>${item.titulo.replace(" 🌀","")}</h3></div></div>`;
}

function gerarTop10(){
  if(todosDados.length<10)return"";let d=new Date(),s=Math.ceil((((d-new Date(Date.UTC(d.getUTCFullYear(),0,1)))/86400000)+1)/7)+d.getFullYear(),r=function(){let x=Math.sin(s++)*10000;return x-Math.floor(x);},em=[...todosDados];
  for(let i=em.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[em[i],em[j]]=[em[j],em[i]];}
  let t10=em.slice(0,10),h=`<div class="top10-section"><h2 class="categoria-title">🔥 TOP 10 da Semana</h2><div class="top10-row">`;
  t10.forEach((i,x)=>{h+=`<div class="top10-card" onclick="abrirDetalhes('${i.id}')"><div class="top10-number">${x+1}</div><div class="top10-img-box"><img src="${i.logo}" alt="${i.titulo}" loading="lazy"></div></div>`;});return h+`</div></div>`;
}

function renderizarHome(salvarUrl=true){
  if(salvarUrl){history.pushState(null, '', window.location.pathname); historicoNav=[{t:'h'}];}
  const f=document.getElementById('feedPrincipal');clearInterval(heroInterval);if(document.getElementById('campoPesquisa'))document.getElementById('campoPesquisa').value="";
  let cats=[...new Set(todosDados.map(i=>i.categoria||'Outros'))],hSidebar=`<div class="sidebar-item" onclick="fecharMenu(); renderizarHome();">🏠 Início</div>`;
  cats.forEach(c=>{if(!c.toLowerCase().includes('oscar'))hSidebar+=`<div class="sidebar-item" onclick="fecharMenu(); verCategoriaCompleta('${c}')">${getIcon(c)} ${c}</div>`;});document.getElementById('sidebarContent').innerHTML=hSidebar;
  let hFeed="";
  
  if(todosDados.length>0){
    let dest=todosDados.slice(0,5);hFeed+=`<div class="hero-slider" id="heroSlider">`;
    dest.forEach((d,i)=>{
      let cC="#0f0",tC=d.classificacao||"L";if(tC==="Livre"||tC==="L"){cC="#0f0";tC="Livre";}else if(tC==="10")cC="#00a5ff";else if(tC==="12")cC="#ffcc00";else if(tC==="14")cC="#ff6600";else if(tC==="16"||tC==="18"||tC.includes("TV-MA")||tC.includes("R"))cC="#e50914";
      let nH=d.avaliacao&&d.avaliacao!=="0.0"&&d.avaliacao!=="N/A"?`<span style="color:#46d369;">★ ${d.avaliacao}</span>`:"";
      
      /* Lógica do Logo PNG Transparente */
      let tituloHeroHTML = d.logo_png ? `<img src="${d.logo_png}" alt="${d.titulo}" class="hero-title-img">` : `<h1 class="hero-title">${d.titulo.replace(" 🌀","")}</h1>`;
      
      hFeed+=`<div class="hero-slide ${i===0?'active':''}" id="slide-${i}" style="background-image:url('${d.logo_horizontal||d.logo}');"><div class="hero-overlay"></div><div class="hero-content">${tituloHeroHTML}<div class="hero-meta">${nH}<span style="background:${cC};color:#000;padding:3px 8px;border-radius:4px;">${tC}</span><span style="color:#ccc;">${d.tipo==='filme'?'Filme':'Série'}</span></div><p class="hero-synopsis">${d.sinopse||'Assista agora no KINGFILMS.'}</p><div class="hero-buttons"><button class="btn-hero-play" onclick="abrirDetalhes('${d.id}')">▶ Assistir</button><button class="btn-hero-info" onclick="abrirDetalhes('${d.id}')">ℹ Mais Info</button></div></div></div>`;
    });
    hFeed+=`<div class="slider-dots">`;dest.forEach((_,i)=>{hFeed+=`<div class="dot ${i===0?'active':''}" id="dot-${i}" onclick="mudarSlide(${i})"></div>`;});hFeed+=`</div></div>`;
    setTimeout(()=>{iniciarSlider(dest.length);configurarSwipe();},100);
  }
  
  hFeed+=`<div class="quick-categories"><div class="quick-cat-card" onclick="document.getElementById('recem-adicionados').scrollIntoView({behavior:'smooth'})"><span class="quick-cat-icon">🔥</span><span class="quick-cat-title">Lançamentos</span></div>`;
  cats.forEach(c=>{if(!c.toLowerCase().includes('oscar'))hFeed+=`<div class="quick-cat-card" onclick="verCategoriaCompleta('${c}')"><span class="quick-cat-icon">${getIcon(c)}</span><span class="quick-cat-title">${c}</span></div>`;});
  hFeed+=`</div>`;

  let itensCont = continuarView.map(id => todosDados.find(i=>i.id===id)).filter(i=>i);
  if(itensCont.length > 0){hFeed+=`<div class="categoria-section"><h2 class="categoria-title" style="color:#ffcc00;">▶ Continuar Assistindo</h2><div class="content-row">`;itensCont.forEach(i=>{hFeed+=criarCartaoHTML(i,false);}); hFeed+=`</div></div>`;}

  let itensLista = minhaLista.map(id => todosDados.find(i=>i.id===id)).filter(i=>i);
  if(itensLista.length > 0){hFeed+=`<div class="categoria-section"><h2 class="categoria-title" style="color:#46d369;">➕ Minha Lista</h2><div class="content-row">`;itensLista.forEach(i=>{hFeed+=criarCartaoHTML(i,false);}); hFeed+=`</div></div>`;}

  hFeed+=`<div class="telegram-banner"><div class="tg-text"><div class="tg-title"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L2 9.5L8.5 12.5L18 5L10.5 14L15.5 19L22 2Z" fill="#fff"/></svg> Comunidade KINGFILMS</div><div class="tg-desc">Faça pedidos e receba atualizações!</div></div><a href="https://t.me/+kMxAz5AFIOIyYzJh" target="_blank" class="tg-btn">ENTRAR NO GRUPO</a></div>`+gerarTop10();
  
  let itensOscar=todosDados.filter(i=>(i.categoria||'').toLowerCase().includes('oscar'));
  if(itensOscar.length>0){hFeed+=`<div class="oscar-section" id="oscar-2026"><h2 class="oscar-title"><span class="oscar-icon">🏆</span> Vencedores do Oscar</h2><div class="content-row">`;itensOscar.forEach(item=>{hFeed+=criarCartaoHTML(item,false);});hFeed+=`</div></div>`;}
  
  let rec=todosDados.slice(0,10);hFeed+=`<div class="categoria-section" id="recem-adicionados"><h2 class="categoria-title">ACABARAM DE CHEGAR</h2><div class="content-row">`;rec.forEach(i=>{hFeed+=criarCartaoHTML(i,false);});hFeed+=`</div></div>`;
  
  cats.forEach(c=>{if(c.toLowerCase().includes('oscar'))return;let idS=c.replace(/\s+/g,'-').toLowerCase(),iCat=todosDados.filter(i=>(i.categoria||'Outros')===c),iCar=iCat.slice(0,10);hFeed+=`<div class="categoria-section" id="${idS}"><h2 class="categoria-title">${c.toUpperCase()}</h2><div class="content-row">`;iCar.forEach(i=>{hFeed+=criarCartaoHTML(i,false);});hFeed+=`</div>`;if(iCat.length>10)hFeed+=`<button class="btn-ver-mais" onclick="verCategoriaCompleta('${c}')">Ver todos os conteúdos de ${c} ▾</button>`;hFeed+=`</div>`;});f.innerHTML=hFeed;
}
window.iniciarSlider=function(t){totalSlides=t;currentSlide=0;clearInterval(heroInterval);if(t>1)heroInterval=setInterval(()=>{mudarSlide((currentSlide+1)%totalSlides);},6000);};
window.mudarSlide=function(i){let s=document.querySelectorAll('.hero-slide'),d=document.querySelectorAll('.dot');if(!s.length||!d.length)return;s.forEach(e=>e.classList.remove('active'));d.forEach(e=>e.classList.remove('active'));document.getElementById(`slide-${i}`).classList.add('active');document.getElementById(`dot-${i}`).classList.add('active');currentSlide=i;clearInterval(heroInterval);heroInterval=setInterval(()=>{mudarSlide((currentSlide+1)%totalSlides);},6000);};
function configurarSwipe(){let s=document.getElementById('heroSlider');if(!s)return;let sx=0,ex=0;s.addEventListener('touchstart',e=>{sx=e.changedTouches[0].screenX;},{passive:true});s.addEventListener('touchend',e=>{ex=e.changedTouches[0].screenX;if(ex-sx<-50)mudarSlide((currentSlide+1)%totalSlides);else if(ex-sx>50)mudarSlide((currentSlide-1+totalSlides)%totalSlides);},{passive:true});}
function verCategoriaCompleta(c,salvar=true){
  if(salvar){history.pushState(null, '', window.location.pathname); historicoNav.push({t:'c',v:c});}
  clearInterval(heroInterval);listaAtual=todosDados.filter(i=>(i.categoria||'Outros')===c);itensExibidos=ITENS_POR_PAGINA;
  let f=document.getElementById('feedPrincipal');
  let h=`<div style="padding:15px 5%;"><button onclick="voltarPagina()" style="background:linear-gradient(45deg,#ff0a16,#8b0000);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin-bottom:20px;font-weight:bold;">← Voltar</button><h2 class="categoria-title" style="margin-left:0;margin-bottom:20px;">${getIcon(c)} TUDO EM: ${c.toUpperCase()}</h2></div><div class="grid-view" id="gridResultados">`;
  let exibidos=listaAtual.slice(0,itensExibidos);exibidos.forEach(i=>{h+=criarCartaoHTML(i,false);});h+=`</div>`;
  if(listaAtual.length>itensExibidos){h+=`<button id="btnCarregarMais" onclick="carregarMais()" style="display:block;width:90%;max-width:400px;margin:30px auto;background:rgba(255,255,255,0.05);color:#fff;border:1px solid #e50914;padding:15px;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;transition:0.3s;box-shadow:0 4px 15px rgba(229,9,20,0.2);">Carregar Mais ▾</button>`;}
  f.innerHTML=h;window.scrollTo({top:0,behavior:'smooth'});
}

function pesquisarConteudo(salvar=true, ignorarPilha=false){
  clearInterval(heroInterval);let t=document.getElementById('campoPesquisa').value.toLowerCase().trim(),f=document.getElementById('feedPrincipal');
  if(t===""){renderizarHome();return;}
  if(salvar && !ignorarPilha){let ult=historicoNav.length>0?historicoNav[historicoNav.length-1]:null;if(!ult||ult.t!=='b')historicoNav.push({t:'b',v:t});else ult.v=t;}
  listaAtual=todosDados.filter(i=>i.titulo.toLowerCase().includes(t));itensExibidos=ITENS_POR_PAGINA;
  if(listaAtual.length===0){f.innerHTML=`<div style="padding:15px 5%;"><button onclick="voltarPagina()" style="background:linear-gradient(45deg,#ff0a16,#8b0000);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin-bottom:20px;font-weight:bold;">← Voltar</button></div><div style="text-align:center;margin-top:60px;color:#888;"><span style="font-size:45px;">😕</span><br><br><p>Nenhum resultado para "<b>${t}</b>"</p></div>`;return;}
  let h=`<div style="padding:15px 5%;"><button onclick="voltarPagina()" style="background:linear-gradient(45deg,#ff0a16,#8b0000);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin-bottom:20px;font-weight:bold;">← Voltar</button><h2 class="categoria-title" style="margin-left:0;color:#e50914;">Resultados para "${t}"</h2></div><div class="grid-view" id="gridResultados">`;
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

function abrirDetalhes(id,salvarUrl=true){
  if(salvarUrl){history.pushState(null, '', '?id=' + id); historicoNav.push({t:'d',v:id});}
  clearInterval(heroInterval);let i=todosDados.find(x=>x.id===id),f=document.getElementById('feedPrincipal'),tps=Object.keys(i.temporadas).sort((a,b)=>parseInt(a)-parseInt(b)),sT="";if(tps.length>1){sT=`<div class="season-tabs-container" id="seasonTabsContainer">`;tps.forEach((t,x)=>{sT+=`<button class="season-btn ${x===0?'active':''}" id="btn-temp-${t}" onclick="mudarTemporada('${id}','${t}')">Temporada ${t}</button>`;});sT+=`</div>`;}else{sT=`<input type="hidden" id="tempAtualOculta" value="${tps[0]}">`;}let cC="#0f0",tC=i.classificacao||"L";if(tC==="Livre"||tC==="L"){cC="#0f0";tC="Livre";}else if(tC==="10")cC="#00a5ff";else if(tC==="12")cC="#ffcc00";else if(tC==="14")cC="#ff6600";else if(tC==="16"||tC==="18"||tC.includes("TV-MA")||tC.includes("R"))cC="#e50914";let nH=i.avaliacao&&i.avaliacao!=="0.0"&&i.avaliacao!=="N/A"?`<span style="color:#46d369;font-weight:bold;">★ ${i.avaliacao}</span>`:"",sF=i.sinopse||"Sem sinopse.",rel=todosDados.filter(x=>(x.categoria||'Outros')===(i.categoria||'Outros')&&x.id!==i.id).slice(0,10),hR="";
  if(rel.length>0){hR=`<div style="margin-top:50px;padding-top:30px;border-top:1px solid rgba(255,255,255,0.05);"><h2 style="font-size:20px;font-weight:bold;color:#f1f1f1;margin-bottom:20px;border-left:4px solid #e50914;padding-left:10px;">${i.tipo==='serie'?'Séries':'Filmes'} Relacionados</h2><div class="content-row" style="padding:0;">`;rel.forEach(r=>{hR+=criarCartaoHTML(r,false);});hR+=`</div></div>`;}
  let inList = minhaLista.includes(id);
  let btnLista = `<button onclick="addLista('${id}')" style="background:${inList?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.05)'}; color:#fff; border:1px solid rgba(255,255,255,0.3); padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold; margin-left:10px; transition:0.3s;">${inList?'✓ Na Sua Lista':'➕ Minha Lista'}</button>`;
  
  /* Lógica para colocar o Logo PNG também na página de abrir o filme! */
  let tituloDetalheHTML = i.logo_png ? `<img src="${i.logo_png}" alt="${i.titulo}" style="max-width:80%; max-height:140px; object-fit:contain; filter:drop-shadow(2px 4px 10px rgba(0,0,0,0.8)); margin-bottom:10px;">` : `<h1 style="font-size:32px;font-weight:900;margin:0 0 10px 0;text-shadow:2px 2px 8px rgba(0,0,0,0.9);line-height:1.1;">${i.titulo.replace(" 🌀","")}</h1>`;

  f.innerHTML=`<div style="padding:20px;color:white;max-width:900px;margin:0 auto;"><div style="display:flex; margin-bottom:20px;"><button onclick="voltarPagina()" style="background:linear-gradient(45deg,#ff0a16,#8b0000);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold;">← Voltar</button>${btnLista}</div><div style="background-image:url('${i.logo_horizontal||i.logo}');background-size:cover;background-position:center top;width:100%;aspect-ratio:16/9;border-radius:12px;position:relative;margin-bottom:25px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 4px 20px rgba(0,0,0,0.6);"><div style="position:absolute;bottom:0;left:0;width:100%;height:100%;background:linear-gradient(to top,rgba(7,16,34,1),rgba(0,0,0,0.5) 70%,transparent);border-radius:12px;"></div><div style="position:absolute;bottom:25px;left:25px;right:25px;">${tituloDetalheHTML}<div style="display:flex;align-items:center;gap:15px;font-size:14px;flex-wrap:wrap;">${nH}<span style="background:${cC};color:#000;padding:3px 8px;border-radius:4px;font-weight:bold;font-size:13px;">${tC}</span><span style="color:#ccc;font-weight:bold;">${i.tipo==='filme'?'Filme':'Série'}</span></div></div></div><p style="color:#ddd;font-size:16px;line-height:1.6;margin-bottom:30px;text-shadow:1px 1px 3px rgba(0,0,0,0.5);">${sF}</p>${sT}<div id="listaEps"></div>${hR}</div>`;
  renderEps(id,tps[0]);window.scrollTo({top:0,behavior:'smooth'});
}

function renderEps(id,t){
    let i=todosDados.find(x=>x.id===id);if(!t){let h=document.getElementById('tempAtualOculta');if(h)t=h.value;}if(!t||!i.temporadas[t])return;
    document.getElementById('listaEps').innerHTML=i.temporadas[t].map(e=>`<div style="display:flex;align-items:center;gap:15px;background:rgba(20,20,20,0.6);padding:12px;margin-bottom:12px;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,0.05);transition:0.3s;backdrop-filter:blur(5px);" onclick="playVid('${id}', '${e.linkFisico}')" onmouseover="this.style.background='rgba(40,40,40,0.8)';this.style.borderColor='#e50914';" onmouseout="this.style.background='rgba(20,20,20,0.6)';this.style.borderColor='rgba(255,255,255,0.05)';"><img src="${e.logoEp}" style="width:140px;aspect-ratio:16/9;object-fit:cover;border-radius:6px;box-shadow:0 4px 10px rgba(0,0,0,0.5);" loading="lazy"><div style="flex:1;overflow:hidden;"><h4 style="font-size:15px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;margin-bottom:8px;color:#fff;">${e.tit}</h4><div style="display:inline-block;background:linear-gradient(45deg,#ff0a16,#8b0000);padding:4px 10px;border-radius:4px;font-size:12px;font-weight:bold;color:#fff;box-shadow:0 2px 5px rgba(229,9,20,0.4);">▶ Assista </div></div></div>`).join('');
      }
        
