let todosDados=[],heroInterval,currentSlide=0,totalSlides=0;
document.addEventListener('DOMContentLoaded',async()=>{
  try{
    const r=await fetch('catalogo_pro.json?v='+Date.now());
    todosDados=await r.json(); todosDados.reverse(); renderizarHome();
  }catch(e){document.getElementById('feedPrincipal').innerHTML='<p style="color:red;text-align:center;padding:50px">Erro ao carregar catálogo.</p>';}
});
function abrirMenu(){document.getElementById('sidebarMenu').classList.add('open');document.getElementById('sidebarOverlay').classList.add('open');}
function fecharMenu(){document.getElementById('sidebarMenu').classList.remove('open');document.getElementById('sidebarOverlay').classList.remove('open');}
const getIcon=(c)=>{
  let l=c.toLowerCase();
  if(l.includes('filme'))return '🎬';if(l.includes('série'))return '📺';if(l.includes('anime'))return '⛩️';
  if(l.includes('animaç'))return '🦄';if(l.includes('desenho'))return '🖍️';if(l.includes('ação'))return '💥';
  if(l.includes('comédia'))return '😂';if(l.includes('terror')||l.includes('horror'))return '👻';
  if(l.includes('romance'))return '❤️';if(l.includes('ficção'))return '👽';if(l.includes('doc'))return '🌍';
  return '🍿';
};

// CARTÃO PADRÃO VERTICAL COM TÍTULO PARA TUDO (FEED, RELACIONADOS E PESQUISA)
function criarCartaoHTML(item){
  return `<div class="content-card" onclick="abrirDetalhes('${item.id}')">
    <div style="position:relative;width:100%;">
      <img src="${item.logo}" alt="${item.titulo}" loading="lazy" style="display:block;width:100%;">
    </div>
    <div class="card-info">
      <h3>${item.titulo.replace(" 🌀","")}</h3>
      <div class="btn-assista">▶ Assista Já</div>
    </div>
  </div>`;
}

function gerarTop10(){
  if(todosDados.length<10)return"";let d=new Date(),s=Math.ceil((((d-new Date(Date.UTC(d.getUTCFullYear(),0,1)))/86400000)+1)/7)+d.getFullYear();
  let r=function(){let x=Math.sin(s++)*10000;return x-Math.floor(x);};
  let em=[...todosDados];for(let i=em.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[em[i],em[j]]=[em[j],em[i]];}
  let t10=em.slice(0,10),h=`<div class="top10-section"><h2 class="categoria-title" style="color:#fff;font-size:22px;">🔥 TOP 10 da Semana</h2><div class="top10-row">`;
  t10.forEach((i,x)=>{h+=`<div class="top10-card" onclick="abrirDetalhes('${i.id}')"><div class="top10-number">${x+1}</div><div class="top10-img-box"><img src="${i.logo}" alt="${i.titulo}" loading="lazy"></div></div>`;});
  return h+`</div></div>`;
}

function renderizarHome(){
  const f=document.getElementById('feedPrincipal');clearInterval(heroInterval);
  if(document.getElementById('campoPesquisa'))document.getElementById('campoPesquisa').value="";
  let cats=[...new Set(todosDados.map(i=>i.categoria||'Outros'))], hSidebar=`<div class="sidebar-item" onclick="fecharMenu(); fecharPesquisa();">🏠 Início</div>`;
  cats.forEach(c=>hSidebar+=`<div class="sidebar-item" onclick="fecharMenu(); verCategoriaCompleta('${c}')">${getIcon(c)} ${c}</div>`);
  document.getElementById('sidebarContent').innerHTML=hSidebar;
  let hFeed="";
  if(todosDados.length>0){
    let dest=todosDados.slice(0,5); hFeed+=`<div class="hero-slider" id="heroSlider">`;
    dest.forEach((d,i)=>{
      let cC="#0f0",tC=d.classificacao||"L";
      if(tC==="Livre"||tC==="L"){cC="#0f0";tC="Livre";}else if(tC==="10")cC="#00a5ff";else if(tC==="12")cC="#ffcc00";else if(tC==="14")cC="#ff6600";else if(tC==="16"||tC==="18"||tC.includes("TV-MA")||tC.includes("R"))cC="#e50914";
      let nH=d.avaliacao&&d.avaliacao!=="0.0"&&d.avaliacao!=="N/A"?`<span style="color:#46d369;">★ ${d.avaliacao}</span>`:"";
      hFeed+=`<div class="hero-slide ${i===0?'active':''}" id="slide-${i}" style="background-image:url('${d.logo_horizontal||d.logo}');"><div class="hero-overlay"></div><div class="hero-content"><h1 class="hero-title">${d.titulo.replace(" 🌀","")}</h1><div class="hero-meta">${nH}<span style="background:${cC};color:#000;padding:3px 8px;border-radius:4px;">${tC}</span><span style="color:#ccc;">${d.tipo==='filme'?'Filme':'Série'}</span></div><p class="hero-synopsis">${d.sinopse||'Assista agora no KINGFILMS.'}</p><div class="hero-buttons"><button class="btn-hero-play" onclick="abrirDetalhes('${d.id}')">▶ Assistir</button><button class="btn-hero-info" onclick="abrirDetalhes('${d.id}')">ℹ Mais Info</button></div></div></div>`;
    });
    hFeed+=`<div class="slider-dots">`; dest.forEach((_,i)=>{hFeed+=`<div class="dot ${i===0?'active':''}" id="dot-${i}" onclick="mudarSlide(${i})"></div>`;});
    hFeed+=`</div></div>`; setTimeout(()=>{iniciarSlider(dest.length);configurarSwipe();},100);
  }
  hFeed+=`<div class="quick-categories"><div class="quick-cat-card" onclick="document.getElementById('recem-adicionados').scrollIntoView({behavior:'smooth'})"><span class="quick-cat-icon">🔥</span><span class="quick-cat-title">Lançamentos</span></div>`;
  cats.forEach(c=>{hFeed+=`<div class="quick-cat-card" onclick="verCategoriaCompleta('${c}')"><span class="quick-cat-icon">${getIcon(c)}</span><span class="quick-cat-title">${c}</span></div>`;});
  hFeed+=`</div><div class="telegram-banner"><div class="tg-text"><div class="tg-title"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L2 9.5L8.5 12.5L18 5L10.5 14L15.5 19L22 2Z" fill="#fff"/></svg> Comunidade KINGFILMS</div><div class="tg-desc">Faça pedidos e receba atualizações!</div></div><a href="https://t.me/+kMxAz5AFIOIyYzJh" target="_blank" class="tg-btn">ENTRAR NO GRUPO</a></div>`+gerarTop10();
  let rec=todosDados.slice(0,10); hFeed+=`<div class="categoria-section" id="recem-adicionados"><h2 class="categoria-title">Acabaram de Chegar 🎬</h2><div class="content-row">`;
  rec.forEach(i=>{hFeed+=criarCartaoHTML(i);}); hFeed+=`</div></div>`;
  cats.forEach(c=>{
    let idS=c.replace(/\s+/g,'-').toLowerCase(), iCat=todosDados.filter(i=>(i.categoria||'Outros')===c), iCar=iCat.slice(0,10);
    hFeed+=`<div class="categoria-section" id="${idS}"><h2 class="categoria-title">${c.toUpperCase()}</h2><div class="content-row">`;
    iCar.forEach(i=>{hFeed+=criarCartaoHTML(i);}); hFeed+=`</div>`;
    if(iCat.length>10)hFeed+=`<button class="btn-ver-mais" onclick="verCategoriaCompleta('${c}')">Ver todos os conteúdos de ${c} ▾</button>`;
    hFeed+=`</div>`;
  });
  f.innerHTML=hFeed;
}

window.iniciarSlider=function(t){totalSlides=t;currentSlide=0;clearInterval(heroInterval);if(t>1)heroInterval=setInterval(()=>{mudarSlide((currentSlide+1)%totalSlides);},6000);};
window.mudarSlide=function(i){
  let s=document.querySelectorAll('.hero-slide'),d=document.querySelectorAll('.dot');if(!s.length||!d.length)return;
  s.forEach(e=>e.classList.remove('active'));d.forEach(e=>e.classList.remove('active'));
  document.getElementById(`slide-${i}`).classList.add('active');document.getElementById(`dot-${i}`).classList.add('active');
  currentSlide=i;clearInterval(heroInterval);heroInterval=setInterval(()=>{mudarSlide((currentSlide+1)%totalSlides);},6000);
};
function configurarSwipe(){
  let s=document.getElementById('heroSlider');if(!s)return;let sx=0,ex=0;
  s.addEventListener('touchstart',e=>{sx=e.changedTouches[0].screenX;},{passive:true});
  s.addEventListener('touchend',e=>{ex=e.changedTouches[0].screenX;if(ex-sx<-50)mudarSlide((currentSlide+1)%totalSlides);else if(ex-sx>50)mudarSlide((currentSlide-1+totalSlides)%totalSlides);},{passive:true});
}

function verCategoriaCompleta(c){
  clearInterval(heroInterval);let f=document.getElementById('feedPrincipal'), iC=todosDados.filter(i=>(i.categoria||'Outros')===c);
  let h=`<div style="padding:15px 5%;"><button onclick="renderizarHome()" style="background:linear-gradient(45deg,#ff0a16,#8b0000);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin-bottom:20px;font-weight:bold;">← Voltar</button><h2 class="categoria-title" style="margin-left:0;margin-bottom:20px;">${getIcon(c)} TUDO EM: ${c.toUpperCase()}</h2></div><div class="grid-view">`;
  iC.forEach(i=>{h+=criarCartaoHTML(i);}); h+=`</div>`; f.innerHTML=h; window.scrollTo({top:0,behavior:'smooth'});
}

function pesquisarConteudo(){
  clearInterval(heroInterval);let t=document.getElementById('campoPesquisa').value.toLowerCase().trim(), f=document.getElementById('feedPrincipal');
  if(t===""){renderizarHome();return;} let r=todosDados.filter(i=>i.titulo.toLowerCase().includes(t));
  if(r.length===0){f.innerHTML=`<div style="padding:15px 5%;"><button onclick="fecharPesquisa()" style="background:linear-gradient(45deg,#ff0a16,#8b0000);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin-bottom:20px;font-weight:bold;">← Voltar</button></div><div style="text-align:center;margin-top:60px;color:#888;"><span style="font-size:45px;">😕</span><br><br><p>Nenhum resultado para "<b>${t}</b>"</p></div>`;return;}
  let h=`<div style="padding:15px 5%;"><button onclick="fecharPesquisa()" style="background:linear-gradient(45deg,#ff0a16,#8b0000);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin-bottom:20px;font-weight:bold;">← Voltar</button><h2 class="categoria-title" style="margin-left:0;color:#e50914;">Resultados para "${t}"</h2></div><div class="grid-view">`;
  r.forEach(i=>{h+=criarCartaoHTML(i);}); h+=`</div>`; f.innerHTML=h;
}
function fecharPesquisa(){renderizarHome();}

function mudarTemporada(id,t){
  document.querySelectorAll('.season-btn').forEach(b=>b.classList.remove('active'));
  let b=document.getElementById(`btn-temp-${t}`);if(b){b.classList.add('active');b.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});}
  renderEps(id,t);
}

function abrirDetalhes(id){
  clearInterval(heroInterval);let i=todosDados.find(x=>x.id===id), f=document.getElementById('feedPrincipal');
  let tps=Object.keys(i.temporadas).sort((a,b)=>parseInt(a)-parseInt(b)), sT="";
  if(tps.length>1){sT=`<div class="season-tabs-container" id="seasonTabsContainer">`;tps.forEach((t,x)=>{sT+=`<button class="season-btn ${x===0?'active':''}" id="btn-temp-${t}" onclick="mudarTemporada('${id}','${t}')">Temporada ${t}</button>`;});sT+=`</div>`;}else{sT=`<input type="hidden" id="tempAtualOculta" value="${tps[0]}">`;}
  let cC="#0f0",tC=i.classificacao||"L";
  if(tC==="Livre"||tC==="L"){cC="#0f0";tC="Livre";}else if(tC==="10")cC="#00a5ff";else if(tC==="12")cC="#ffcc00";else if(tC==="14")cC="#ff6600";else if(tC==="16"||tC==="18"||tC.includes("TV-MA")||tC.includes("R"))cC="#e50914";
  let nH=i.avaliacao&&i.avaliacao!=="0.0"&&i.avaliacao!=="N/A"?`<span style="color:#46d369;font-weight:bold;">★ ${i.avaliacao}</span>`:"", sF=i.sinopse||"Sem sinopse.";
  let rel=todosDados.filter(x=>(x.categoria||'Outros')===(i.categoria||'Outros')&&x.id!==i.id).slice(0,10), hR="";
  if(rel.length>0){
    hR=`<div style="margin-top:50px;padding-top:30px;border-top:1px solid rgba(255,255,255,0.05);"><h2 style="font-size:20px;font-weight:bold;color:#f1f1f1;margin-bottom:20px;border-left:4px solid #e50914;padding-left:10px;">${i.tipo==='serie'?'Séries':'Filmes'} Relacionados</h2><div class="content-row" style="padding:0;">`;
    rel.forEach(r=>{hR+=criarCartaoHTML(r);}); hR+=`</div></div>`;
  }
  f.innerHTML=`<div style="padding:20px;color:white;max-width:900px;margin:0 auto;"><button onclick="renderizarHome()" style="background:linear-gradient(45deg,#ff0a16,#8b0000);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin-bottom:20px;font-weight:bold;">← Voltar</button><div style="background-image:url('${i.logo_horizontal||i.logo}');background-size:cover;background-position:center top;width:100%;aspect-ratio:16/9;border-radius:12px;position:relative;margin-bottom:25px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 4px 20px rgba(0,0,0,0.6);"><div style="position:absolute;bottom:0;left:0;width:100%;height:100%;background:linear-gradient(to top,rgba(7,16,34,1),rgba(0,0,0,0.5) 70%,transparent);border-radius:12px;"></div><div style="position:absolute;bottom:25px;left:25px;right:25px;"><h1 style="font-size:32px;font-weight:900;margin:0 0 10px 0;text-shadow:2px 2px 8px rgba(0,0,0,0.9);line-height:1.1;">${i.titulo.replace(" 🌀","")}</h1><div style="display:flex;align-items:center;gap:15px;font-size:14px;flex-wrap:wrap;">${nH}<span style="background:${cC};color:#000;padding:3px 8px;border-radius:4px;font-weight:bold;font-size:13px;">${tC}</span><span style="color:#ccc;font-weight:bold;">${i.tipo==='filme'?'Filme':'Série'}</span></div></div></div><p style="color:#ddd;font-size:16px;line-height:1.6;margin-bottom:30px;text-shadow:1px 1px 3px rgba(0,0,0,0.5);">${sF}</p>${sT}<div id="listaEps"></div>${hR}</div>`;
  renderEps(id,tps[0]);window.scrollTo({top:0,behavior:'smooth'});
}

function renderEps(id,t){
  let i=todosDados.find(x=>x.id===id);if(!t){let h=document.getElementById('tempAtualOculta');if(h)t=h.value;}if(!t||!i.temporadas[t])return;
  document.getElementById('listaEps').innerHTML=i.temporadas[t].map(e=>`<div style="display:flex;align-items:center;gap:15px;background:rgba(20,20,20,0.6);padding:12px;margin-bottom:12px;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,0.05);transition:0.3s;backdrop-filter:blur(5px);" onclick="window.location.href='${e.linkFisico}'" onmouseover="this.style.background='rgba(40,40,40,0.8)';this.style.borderColor='#e50914';" onmouseout="this.style.background='rgba(20,20,20,0.6)';this.style.borderColor='rgba(255,255,255,0.05)';"><img src="${e.logoEp}" style="width:140px;aspect-ratio:16/9;object-fit:cover;border-radius:6px;box-shadow:0 4px 10px rgba(0,0,0,0.5);" loading="lazy"><div style="flex:1;overflow:hidden;"><h4 style="font-size:15px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;margin-bottom:8px;color:#fff;">${e.tit}</h4><div style="display:inline-block;background:linear-gradient(45deg,#ff0a16,#8b0000);padding:4px 10px;border-radius:4px;font-size:12px;font-weight:bold;color:#fff;box-shadow:0 2px 5px rgba(229,9,20,0.4);">▶ Assista no Rave</div></div></div>`).join('');
}
