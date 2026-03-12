async function carregarFilmes(){

let data=await apiRequest("filmes",{page:1,limit:20});

let html="";

data.items.forEach(f=>{

html+=`
<div>
<img src="${f.poster}" width="150">
<h3>${f.title}</h3>
</div>
`;

});

document.getElementById("filmes").innerHTML=html;

}

carregarFilmes();
