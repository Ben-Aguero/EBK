// ONE-FILE legend photo fetcher.  Usage (from anywhere):  node scripts/fetch-legend-photos.mjs   (Node 18+)
//
// - Works out the project folder from this file's location (put this file in <project>/scripts/).
// - Creates legends.json from the built-in list if it doesn't exist, otherwise uses yours.
// - Finds a freely licensed photo on Wikimedia Commons for each legend, saves it to images/legends/,
//   and records photographer + license in legends.json (the game shows it under the photo).
// - Safe to re-run: players who already have a photo file are skipped.
// - If a player can't be found, add  "wiki": "Exact Wikipedia Page Title"  to them in legends.json and re-run.
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const JSON_PATH=path.join(ROOT,"legends.json");
const IMG_DIR=path.join(ROOT,"images","legends");

const LEGENDS=`Tom Brady|QB|New England Patriots|Michigan|1
Peyton Manning|QB|Indianapolis Colts|Tennessee|1
Eli Manning|QB|New York Giants|Ole Miss|1
Drew Brees|QB|New Orleans Saints|Purdue|1
Brett Favre|QB|Green Bay Packers|Southern Mississippi|1
Joe Montana|QB|San Francisco 49ers|Notre Dame|1
John Elway|QB|Denver Broncos|Stanford|1
Dan Marino|QB|Miami Dolphins|Pittsburgh|1
Michael Vick|QB|Atlanta Falcons|Virginia Tech|1
Cam Newton|QB|Carolina Panthers|Auburn|1
Tim Tebow|QB|Denver Broncos|Florida|1
Barry Sanders|RB|Detroit Lions|Oklahoma State|1
Walter Payton|RB|Chicago Bears|Jackson State|1
Emmitt Smith|RB|Dallas Cowboys|Florida|1
Adrian Peterson|RB|Minnesota Vikings|Oklahoma|1
Marshawn Lynch|RB|Seattle Seahawks|California|1
Bo Jackson|RB|Los Angeles Raiders|Auburn|1
Jerry Rice|WR|San Francisco 49ers|Mississippi Valley State|1
Randy Moss|WR|Minnesota Vikings|Marshall|1
Terrell Owens|WR|San Francisco 49ers|Chattanooga|1
Larry Fitzgerald|WR|Arizona Cardinals|Pittsburgh|1
Calvin Johnson|WR|Detroit Lions|Georgia Tech|1
Rob Gronkowski|TE|New England Patriots|Arizona|1
Lawrence Taylor|LB|New York Giants|North Carolina|1
Ray Lewis|LB|Baltimore Ravens|Miami (FL)|1
Deion Sanders|CB|Dallas Cowboys|Florida State|1
J.J. Watt|DE|Houston Texans|Wisconsin|1
Aaron Donald|DT|Los Angeles Rams|Pittsburgh|1
Troy Aikman|QB|Dallas Cowboys|UCLA|2
Steve Young|QB|San Francisco 49ers|BYU|2
Terry Bradshaw|QB|Pittsburgh Steelers|Louisiana Tech|2
Roger Staubach|QB|Dallas Cowboys|Navy|2
Joe Namath|QB|New York Jets|Alabama|2
Kurt Warner|QB|St. Louis Rams|Northern Iowa|2
Ben Roethlisberger|QB|Pittsburgh Steelers|Miami (OH)|2
Philip Rivers|QB|San Diego Chargers|NC State|2
Tony Romo|QB|Dallas Cowboys|Eastern Illinois|2
Andrew Luck|QB|Indianapolis Colts|Stanford|2
Robert Griffin III|QB|Washington Redskins|Baylor|2
Matt Ryan|QB|Atlanta Falcons|Boston College|2
Jim Brown|RB|Cleveland Browns|Syracuse|2
LaDainian Tomlinson|RB|San Diego Chargers|TCU|2
Frank Gore|RB|San Francisco 49ers|Miami (FL)|2
Ricky Williams|RB|New Orleans Saints|Texas|2
Jerome Bettis|RB|Pittsburgh Steelers|Notre Dame|2
Michael Irvin|WR|Dallas Cowboys|Miami (FL)|2
Wes Welker|WR|New England Patriots|Texas Tech|2
Julian Edelman|WR|New England Patriots|Kent State|2
Antonio Brown|WR|Pittsburgh Steelers|Central Michigan|2
Tony Gonzalez|TE|Kansas City Chiefs|California|2
Reggie White|DE|Philadelphia Eagles|Tennessee|2
Ed Reed|S|Baltimore Ravens|Miami (FL)|2
Troy Polamalu|S|Pittsburgh Steelers|USC|2
Charles Woodson|CB|Oakland Raiders|Michigan|2
Brian Urlacher|LB|Chicago Bears|New Mexico|2
Michael Strahan|DE|New York Giants|Texas Southern|2
Ndamukong Suh|DT|Detroit Lions|Nebraska|2
Richard Sherman|CB|Seattle Seahawks|Stanford|2
Johnny Unitas|QB|Baltimore Colts|Louisville|3
Donovan McNabb|QB|Philadelphia Eagles|Syracuse|3
Randall Cunningham|QB|Philadelphia Eagles|UNLV|3
Jim Kelly|QB|Buffalo Bills|Miami (FL)|3
Warren Moon|QB|Houston Oilers|Washington|3
Bart Starr|QB|Green Bay Packers|Alabama|3
Carson Palmer|QB|Cincinnati Bengals|USC|3
Terrell Davis|RB|Denver Broncos|Georgia|3
Marshall Faulk|RB|St. Louis Rams|San Diego State|3
Eric Dickerson|RB|Los Angeles Rams|SMU|3
Earl Campbell|RB|Houston Oilers|Texas|3
Tony Dorsett|RB|Dallas Cowboys|Pittsburgh|3
Edgerrin James|RB|Indianapolis Colts|Miami (FL)|3
Curtis Martin|RB|New York Jets|Pittsburgh|3
Shaun Alexander|RB|Seattle Seahawks|Alabama|3
Chris Johnson|RB|Tennessee Titans|East Carolina|3
Franco Harris|RB|Pittsburgh Steelers|Penn State|3
Andre Johnson|WR|Houston Texans|Miami (FL)|3
Marvin Harrison|WR|Indianapolis Colts|Syracuse|3
Cris Carter|WR|Minnesota Vikings|Ohio State|3
Tim Brown|WR|Oakland Raiders|Notre Dame|3
Anquan Boldin|WR|Baltimore Ravens|Florida State|3
Reggie Wayne|WR|Indianapolis Colts|Miami (FL)|3
Torry Holt|WR|St. Louis Rams|NC State|3
Hines Ward|WR|Pittsburgh Steelers|Georgia|3
Antonio Gates|TE|San Diego Chargers|Kent State|3
Jason Witten|TE|Dallas Cowboys|Tennessee|3
Shannon Sharpe|TE|Denver Broncos|Savannah State|3
Mike Ditka|TE|Chicago Bears|Pittsburgh|3
Ronnie Lott|S|San Francisco 49ers|USC|3
Derrick Brooks|LB|Tampa Bay Buccaneers|Florida State|3
Bruce Smith|DE|Buffalo Bills|Virginia Tech|3
Dick Butkus|LB|Chicago Bears|Illinois|3
Mean Joe Greene|DT|Pittsburgh Steelers|North Texas|3
Junior Seau|LB|San Diego Chargers|USC|3
Champ Bailey|CB|Denver Broncos|Georgia|3
Darrelle Revis|CB|New York Jets|Pittsburgh|3
Patrick Willis|LB|San Francisco 49ers|Ole Miss|3
Luke Kuechly|LB|Carolina Panthers|Boston College|3
Terrell Suggs|LB|Baltimore Ravens|Arizona State|3
Julius Peppers|DE|Carolina Panthers|North Carolina|3
Dwight Freeney|DE|Indianapolis Colts|Syracuse|3
Jared Allen|DE|Minnesota Vikings|Idaho State|3
DeMarcus Ware|LB|Dallas Cowboys|Troy|3
Warren Sapp|DT|Tampa Bay Buccaneers|Miami (FL)|3
Joe Thomas|OT|Cleveland Browns|Wisconsin|3
Adam Vinatieri|K|Indianapolis Colts|South Dakota State|3
Fran Tarkenton|QB|Minnesota Vikings|Georgia|4
Dan Fouts|QB|San Diego Chargers|Oregon|4
Jim Plunkett|QB|Oakland Raiders|Stanford|4
Gale Sayers|RB|Chicago Bears|Kansas|4
Thurman Thomas|RB|Buffalo Bills|Oklahoma State|4
Jamal Lewis|RB|Baltimore Ravens|Tennessee|4
Priest Holmes|RB|Kansas City Chiefs|Texas|4
Arian Foster|RB|Houston Texans|Tennessee|4
Eddie George|RB|Tennessee Titans|Ohio State|4
Tiki Barber|RB|New York Giants|Virginia|4
Paul Hornung|RB|Green Bay Packers|Notre Dame|4
Steve Largent|WR|Seattle Seahawks|Tulsa|4
Lynn Swann|WR|Pittsburgh Steelers|USC|4
Isaac Bruce|WR|St. Louis Rams|Memphis|4
Ozzie Newsome|TE|Cleveland Browns|Alabama|4
Jack Lambert|LB|Pittsburgh Steelers|Kent State|4
Randy White|DT|Dallas Cowboys|Maryland|4
Charles Haley|LB|San Francisco 49ers|James Madison|4
Rod Woodson|CB|Pittsburgh Steelers|Purdue|4
Deacon Jones|DE|Los Angeles Rams|Mississippi Valley State|4
Jack Ham|LB|Pittsburgh Steelers|Penn State|4
Derrick Thomas|LB|Kansas City Chiefs|Alabama|4
Mike Singletary|LB|Chicago Bears|Baylor|4
Anthony Munoz|OT|Cincinnati Bengals|USC|4
Jonathan Ogden|OT|Baltimore Ravens|UCLA|4
Orlando Pace|OT|St. Louis Rams|Ohio State|4
Jason Peters|OT|Philadelphia Eagles|Arkansas|4
Larry Allen|G|Dallas Cowboys|Sonoma State|4
Sebastian Janikowski|K|Oakland Raiders|Florida State|4
Y.A. Tittle|QB|New York Giants|LSU|5
Otto Graham|QB|Cleveland Browns|Northwestern|5
Sammy Baugh|QB|Washington Redskins|TCU|5
Lenny Moore|RB|Baltimore Colts|Penn State|5
Mel Blount|CB|Pittsburgh Steelers|Southern|5
Bob Lilly|DT|Dallas Cowboys|TCU|5
Ray Nitschke|LB|Green Bay Packers|Illinois|5
Willie Lanier|LB|Kansas City Chiefs|Morgan State|5
Cortez Kennedy|DT|Seattle Seahawks|Miami (FL)|5
Jim Otto|C|Oakland Raiders|Miami (FL)|5
Bruce Matthews|OL|Tennessee Titans|USC|5
Dan Dierdorf|OT|St. Louis Cardinals|Michigan|5
Will Shields|G|Kansas City Chiefs|Nebraska|5
Jan Stenerud|K|Kansas City Chiefs|Montana State|5
Morten Andersen|K|Atlanta Falcons|Michigan State|5
Ray Guy|P|Oakland Raiders|Southern Mississippi|5`;
const HINTS={"Mean Joe Greene":"Joe Greene","Chris Johnson":"Chris Johnson (running back)","Tim Brown":"Tim Brown (wide receiver)"}; // tried first, falls back to search

// Wikimedia asks scripts to identify themselves with a contact email.
let email=process.env.WIKI_EMAIL||process.argv[2];
if(!email){
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  email=(await rl.question("Your email (sent to Wikimedia as a contact, nothing else): ")).trim();rl.close();
}
if(!email.includes("@")){console.log("That doesn't look like an email. Run again.");process.exit(1)}
const UA=`WhereDidHePlay/1.0 (personal hobby project; contact: ${email})`;

const plain=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const slug=s=>plain(s).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const strip=h=>(h||"").replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim();
const exists=f=>fs.access(f).then(()=>true,()=>false);

const get=async u=>{
  for(let i=0;i<5;i++){
    const r=await fetch(u,{headers:{"User-Agent":UA,"Api-User-Agent":UA}});
    if(r.ok)return r;
    if(r.status===429||r.status>=500){const w=Number(r.headers.get("retry-after"))||3*(i+1);console.log(`  waiting ${w}s (HTTP ${r.status})...`);await sleep(w*1000);continue}
    throw new Error(`HTTP ${r.status} for ${u.slice(0,90)}`);
  }
  throw new Error("still rate limited after retries");
};
const api=async(host,params)=>(await get(`https://${host}/w/api.php?format=json&origin=*&`+new URLSearchParams(params))).json();

const words=n=>plain(n).replace(/\(.*?\)/g,"").replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w&&!/^(jr|sr|ii|iii|iv)$/.test(w));
const titleOk=(title,name)=>{const t=words(title),n=words(name);return t.length&&n.length&&t[t.length-1]===n[n.length-1]&&n.some(w=>w[0]===t[0][0])};
const PROPS={prop:"pageprops|pageimages",ppprop:"wikibase_item|disambiguation",piprop:"name"};

async function findPage(p){
  const forced=p.wiki||HINTS[p.name];
  if(forced){
    const s=await api("en.wikipedia.org",{action:"query",titles:forced,redirects:"1",...PROPS});
    const pg=Object.values(s.query?.pages||{})[0];
    if(pg&&pg.missing===undefined&&!pg.pageprops?.disambiguation)return pg;
    if(p.wiki)return null; // you set it explicitly, so don't guess
  }
  const s=await api("en.wikipedia.org",{action:"query",generator:"search",gsrsearch:`${p.name.replace(/^Mean /,"")} American football`,gsrlimit:"5",...PROPS});
  const pages=Object.values(s.query?.pages||{}).sort((a,b)=>(a.index||0)-(b.index||0));
  return pages.find(x=>!x.pageprops?.disambiguation&&titleOk(x.title,p.name))||null;
}
async function commonsInfo(file){
  const c=await api("commons.wikimedia.org",{action:"query",titles:"File:"+file,prop:"imageinfo",iiprop:"url|extmetadata",iiurlwidth:"320"});
  const info=Object.values(c.query?.pages||{})[0]?.imageinfo?.[0];
  if(!info?.thumburl)return null;
  const md=info.extmetadata||{},license=strip(md.LicenseShortName?.value);
  if(!license||/fair use|non-free/i.test(license))return null;
  return {url:info.thumburl,credit:[strip(md.Artist?.value).slice(0,60),license,"Wikimedia Commons"].filter(Boolean).join(" / ")};
}

// --- load or create legends.json ---
let players;
if(await exists(JSON_PATH)){players=JSON.parse(await fs.readFile(JSON_PATH,"utf8"));console.log(`Using existing legends.json (${players.length} players).`)}
else{
  players=LEGENDS.trim().split("\n").map(l=>{const [name,pos,team,college,d]=l.split("|");return {name,pos,team,college,d:+d,photo:null}});
  console.log(`Created legends.json from the built-in list (${players.length} players).`);
}
await fs.mkdir(IMG_DIR,{recursive:true});

const noPage=[],noPhoto=[],errors=[];let got=0,skipped=0;
const save=()=>fs.writeFile(JSON_PATH,JSON.stringify(players,null,1));
for(const p of players){
  if(p.photo&&await exists(path.join(ROOT,p.photo))){skipped++;continue}
  try{
    const hit=await findPage(p);
    if(!hit){console.log("NO PAGE FOUND:",p.name);noPage.push(p.name);await sleep(800);continue}
    const files=[];
    if(hit.pageimage)files.push(hit.pageimage);
    if(hit.pageprops?.wikibase_item){ // fallback: the image chosen on Wikidata
      const w=await api("www.wikidata.org",{action:"wbgetclaims",entity:hit.pageprops.wikibase_item,property:"P18"});
      const f=w.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if(f&&!files.includes(f.replace(/_/g," ")))files.push(f.replace(/_/g," "));
    }
    let found=null;
    for(const f of files){found=await commonsInfo(f);if(found)break}
    if(!found){console.log("NO FREE PHOTO:",p.name,"<-",hit.title);noPhoto.push(p.name);await sleep(800);continue}
    const rel=`images/legends/${slug(p.name)}.jpg`;
    await fs.writeFile(path.join(ROOT,rel),Buffer.from(await (await get(found.url)).arrayBuffer()));
    p.photo=rel;p.credit=found.credit;got++;
    console.log("OK:",p.name,"<-",hit.title);
    await save(); // save as we go so nothing is lost if you stop it
  }catch(e){console.log("ERROR:",p.name,e.message);errors.push(p.name)}
  await sleep(1200);
}
await save();
console.log(`\nDone. New photos: ${got}. Already had: ${skipped}.`);
if(noPage.length)console.log(`No Wikipedia page found (add a "wiki" title in legends.json): ${noPage.join(", ")}`);
if(noPhoto.length)console.log(`No freely licensed photo exists (they keep initials): ${noPhoto.join(", ")}`);
if(errors.length)console.log(`Errors (just re-run to retry): ${errors.join(", ")}`);
console.log("Check the \"<-\" page titles above for wrong matches, then commit legends.json and images/legends/.");
