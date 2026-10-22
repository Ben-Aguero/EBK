// Usage: node scripts/fetch-photos.mjs   (Node 18+)
// Downloads headshots + current teams from ESPN's UNOFFICIAL public API into images/ and updates players.json.
// Fine for testing. Before a public launch, license photos (Sportradar, SportsDataIO, etc.) and replace this.
import fs from "node:fs/promises";
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,"");
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const get=async u=>{const r=await fetch(u);if(!r.ok)throw new Error(r.status+" "+u);return r};
const base="https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams";
const teams=(await (await get(base)).json()).sports[0].leagues[0].teams.map(t=>t.team);
const found=new Map();
for(const t of teams){
  const j=await (await get(`${base}/${t.id}/roster`)).json();
  const items=(j.athletes||[]).flatMap(g=>g.items||[g]);
  for(const a of items)if(a.fullName)found.set(norm(a.fullName),{photo:a.headshot?.href,team:t.displayName});
}
const players=JSON.parse(await fs.readFile("players.json","utf8"));
await fs.mkdir("images",{recursive:true});
for(const p of players){
  const f=found.get(norm(p.name));
  if(!f){console.log("NOT FOUND:",p.name);continue}
  p.team=f.team;
  if(f.photo){
    const file=`images/${slug(p.name)}.png`;
    await fs.writeFile(file,Buffer.from(await (await get(f.photo)).arrayBuffer()));
    p.photo=file;
  }else console.log("NO PHOTO:",p.name);
}
await fs.writeFile("players.json",JSON.stringify(players,null,2));
console.log("Done.");
