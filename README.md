# Ball Knowledge

Guess where NFL players went to college. 5 rounds, 3 strikes, typed answers.

## Run it
Needs a web server (opening index.html directly won't load players.json):

    npx serve .          # or: python3 -m http.server 8000

## Add photos
    node scripts/fetch-photos.mjs

Downloads headshots into images/, sets each player's `photo` in players.json, and refreshes their current team.
It uses ESPN's unofficial API: fine for testing, but license photos (Sportradar, SportsDataIO, etc.) before a public launch.
You can also drop your own files in images/ and set `photo` by hand. Players without a photo show initials.

## Add players
Edit players.json: name, pos, team, college (last school), d (1 easy, 2 medium, 3 hard).

## Next
- All-time mode: a second JSON file, plus a mode picker
- Friends/app: accounts + backend for head-to-head matches; game logic ports to React Native
