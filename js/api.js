const API_URL="https://qcrhfzckhdsryjlesrsu.supabase.co/functions/v1/content-api";
const TOKEN="SEU_TOKEN";

async function apiRequest(action,params={}){

let url=`${API_URL}?action=${action}&token=${TOKEN}`;

for(let k in params){
url+=`&${k}=${params[k]}`;
}

let r=await fetch(url,{
headers:{
"Origin":"https://kingfilms.shop",
"Referer":"https://kingfilms.shop/"
}
});

return await r.json();

}
