// Usage: node scripts/build-players.mjs [--no-photos]   (Node 18+)
// Builds players.json with every current starter (name, position, team, college, popularity tier, photo)
// from ESPN's UNOFFICIAL public API. Keeps photos you already downloaded. Fine for testing;
// license photos/data (Sportradar, SportsDataIO, ...) before a public launch.
import fs from "node:fs/promises";
const NO_PHOTOS=process.argv.includes("--no-photos");
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,"");
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const get=async u=>{const r=await fetch(u);if(!r.ok)throw new Error(r.status+" "+u);return r};

// Popularity tiers: 1 = household names, 2 = well-known. Everyone else is tiered by position below.
const T1=["Patrick Mahomes","Josh Allen","Lamar Jackson","Joe Burrow","Jalen Hurts","Justin Jefferson|WR","Ja'Marr Chase","CeeDee Lamb","Tyreek Hill","Travis Kelce","Saquon Barkley","Derrick Henry","Christian McCaffrey","Myles Garrett","Micah Parsons","Caleb Williams","Jayden Daniels","C.J. Stroud","Trevor Lawrence","Brock Purdy","Aaron Rodgers","Bijan Robinson","Jahmyr Gibbs","Puka Nacua","Amon-Ra St. Brown","T.J. Watt","Nick Bosa","Dak Prescott","Drake Maye","Justin Herbert","Kyler Murray","Tua Tagovailoa","Malik Nabers","Brock Bowers","Matthew Stafford","Baker Mayfield","Jordan Love","Davante Adams","Mike Evans","Stefon Diggs"];
const T2=["George Kittle","Cooper Kupp","Jonathan Taylor","Josh Jacobs","Jaxon Smith-Njigba","Garrett Wilson","Sauce Gardner","Patrick Surtain II","Maxx Crosby","Trey Hendrickson","Fred Warner","Kyle Hamilton","Penei Sewell","Aidan Hutchinson","Sam Darnold","Bo Nix","Jared Goff","Russell Wilson","Marvin Harrison Jr.","Rome Odunze","Ladd McConkey","Trey McBride","Sam LaPorta","Mark Andrews","T.J. Hockenson","A.J. Brown","DeVonta Smith","Terry McLaurin","DK Metcalf","Chris Olave","Tee Higgins","Amari Cooper","Zay Flowers","Jaylen Waddle","Brian Thomas Jr.","Joe Mixon","Kyren Williams","James Cook","Breece Hall","De'Von Achane","Alvin Kamara","Aaron Jones","Kenneth Walker III","Jordan Mailata","Quinnen Williams","Will Anderson Jr.","Danielle Hunter","Haason Reddick","Rashan Gary","Chris Jones","Cameron Heyward","Roquan Smith","Lavonte David","Micah Hyde","Minkah Fitzpatrick","Derwin James","Jalen Ramsey","Trevon Diggs","Pat Surtain II","Devin White","Justin Tucker","Harrison Butker","Jake Elliott","Jordan Davis","Dexter Lawrence","Jeffrey Simmons","Za'Darius Smith","Brandon Aiubo","Quenton Nelson","Lane Johnson","Zack Martin","Tristan Wirfs","Creed Humphrey","Joe Thuney","Trent Williams","Rashee Rice","Xavier Worthy","Jayden Reed","George Pickens","Jauan Jennings","Deebo Samuel","Courtland Sutton","Nico Collins","Tank Dell","Drake London","Kyle Pitts","Jerry Jeudy","Michael Pittman Jr.","Khalil Shakir","Calvin Ridley","Jerry Rice Jr."];
// A name can be written "Name|POS" to pin it to one position (needed when two players share a name).
const key=x=>{const [n,p]=x.split("|");return p?norm(n)+"|"+p:norm(n)};
const t1=new Set(T1.map(key)),t2=new Set(T2.map(key));
const tierFor=(name,pos,unique)=>{
  const n=norm(name);
  if(t1.has(n+"|"+pos)||(unique&&t1.has(n)))return 1;
  if(t2.has(n+"|"+pos)||(unique&&t2.has(n)))return 2;
  if(["QB","RB","WR","TE","FB"].includes(pos))return 3;
  if(["DE","OLB","LB","ILB","MLB","CB","S","FS","SS","DB","EDGE"].includes(pos))return 4;
  return 5; // OL, DT, K, P, LS, etc.
};

const base="https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams";
const teams=(await (await get(base)).json()).sports[0].leagues[0].teams.map(t=>t.team);

async function starterIds(id){
  try{
    const j=await (await get(`${base}/${id}/depthcharts`)).json();
    const ids=new Set();
    for(const ch of j.depthchart||[])for(const [key,v] of Object.entries(ch.positions||{})){
      const k=key.toLowerCase(),lim=k==="wr"?3:/cb/.test(k)?2:1;
      for(const a of (v.athletes||[]).slice(0,lim)){
        const x=a.athlete?.id??(a.athlete?.$ref||a.$ref||"").match(/athletes\/(\d+)/)?.[1];
        if(x)ids.add(String(x));
      }
    }
    return ids.size>=15?ids:null;
  }catch{return null}
}

let old=[];try{old=JSON.parse(await fs.readFile("players.json","utf8"))}catch{}
const oldPhoto=new Map(old.filter(p=>p.photo).map(p=>[norm(p.name)+"|"+p.pos,p.photo]));
await fs.mkdir("images",{recursive:true});

const out=[],jobs=[];
for(const t of teams){
  const j=await (await get(`${base}/${t.id}/roster`)).json();
  const items=(j.athletes||[]).flatMap(g=>g.items||[g]);
  const st=await starterIds(t.id);
  if(!st)console.log("No depth chart for",t.displayName,"- including full roster");
  for(const a of items){
    const college=a.college?.name,pos=a.position?.abbreviation;
    if(!a.fullName||!college||!pos)continue;
    if(st&&!st.has(String(a.id)))continue;
    const p={name:a.fullName,pos,team:t.displayName,college,d:0,photo:oldPhoto.get(norm(a.fullName)+"|"+pos)||null};
    out.push(p);
    if(!p.photo&&!NO_PHOTOS&&a.headshot?.href){
      const file=`images/${slug(p.name)}.png`;
      jobs.push(async()=>{try{await fs.writeFile(file,Buffer.from(await (await get(a.headshot.href)).arrayBuffer()));p.photo=file}catch{console.log("No photo:",p.name)}});
    }
  }
}
const counts={};out.forEach(p=>counts[norm(p.name)]=(counts[norm(p.name)]||0)+1);
out.forEach(p=>{const u=counts[norm(p.name)]===1;p.d=tierFor(p.name,p.pos,u);if(!u&&(t1.has(norm(p.name))||t2.has(norm(p.name))))console.log("Same name, check tiers:",p.name,p.pos,p.team,"-> tier",p.d)});
for(let i=0;i<jobs.length;i+=8)await Promise.all(jobs.slice(i,i+8).map(f=>f()));
out.sort((a,b)=>a.d-b.d||a.name.localeCompare(b.name));
await fs.writeFile("players.json",JSON.stringify(out,null,1));
const c={};out.forEach(p=>c[p.d]=(c[p.d]||0)+1);
console.log(`Wrote ${out.length} players. By tier:`,c);
