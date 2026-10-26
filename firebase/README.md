# Daily Games League: Firebase setup

The scoreboard at `/daily` reads from Firestore. Scores are entered at `/daily/admin`,
which only the board owner can write from. Everything that touches the Firebase SDK
lives in this folder; the app imports these modules with the `~firebase/*` alias.

| File | What it does |
|---|---|
| `client.ts` | Initializes the app once from env vars and exports `db` and `auth` |
| `types.ts` | `Player`, `Game`, `ScoreType`, `Result` |
| `scores.ts` | Live watchers and write functions for players, games and results |
| `auth.ts` | `signIn()`, `signOut()`, `watchUser()`, `isOwner(user)` |
| `firestore.rules` | Public read, owner-only writes with shape checks |
| `firestore.indexes.json` | Empty: every query uses a single-field index |
| `firebase.json` | Points the Firebase CLI at the two files above |

## One-time setup

1. **Create a project** at <https://console.firebase.google.com>. Analytics isn't needed.
2. **Add a web app.** Go to Project settings → General → Your apps → Web (`</>`).
   Copy `apiKey`, `authDomain`, `projectId` and `appId`.
3. **Create the database.** Go to Build → Firestore Database → Create database.
   Production mode is fine because the rules below replace the defaults.
4. **Turn on Google sign-in.** Go to Build → Authentication → Sign-in method → Google → Enable.
   Under Authentication → Settings → Authorized domains, add your production domain
   (e.g. `yoursite.vercel.app`). `localhost` is there by default.
5. **Set env vars.** Copy the block from `.env.example` in the repo root into `.env.local`
   and fill it in. Add the same variables in Vercel (Project → Settings → Environment Variables).
   Leave `NEXT_PUBLIC_FIREBASE_OWNER_UID` empty for now.
6. **Find your UID.** Run `pnpm dev`, open <http://localhost:3000/daily/admin> and sign in
   with Google. You'll see "This page is for the board owner". Then go to
   Authentication → Users in the console and copy the User UID for your account.
   Put it in `NEXT_PUBLIC_FIREBASE_OWNER_UID` and restart the dev server.
7. **Deploy the rules.** In `firestore.rules`, replace `REPLACE_WITH_OWNER_UID` with the
   same UID (rules can't read env vars). Then, from this folder:

   ```sh
   cd firebase
   cp .firebaserc.example .firebaserc   # then put your project ID in it
   npx firebase-tools login
   npx firebase-tools deploy --only firestore
   ```

   You can also paste `firestore.rules` into the console under Firestore → Rules.

The owner UID is checked in two places. The env var only decides whether the admin page
shows the entry panel. The rules are what actually stop anyone else from writing.

## Data model

- `players/{slug}`: `{ name, createdAt }`
- `games/{slug}`: `{ name, type, max?, canFail?, higherWins?, createdAt }`
- `results/{game}-{YYYY-MM-DD}-{player}`: `{ game, gameName, player, date, score, fail, shown, createdAt }`

Slugs come from names ("Mini Crossword" → `mini-crossword`). Renaming a player changes only
`name`; the slug stays, so their results stay linked. Logging the same game, day and
player again overwrites the earlier result. Removing a game deletes only the game document.
Its results stay, and adding a game with the same name brings them back on the board.

## Notes

- `watchResults` loads the newest 1000 results. That's about 6 months for 3 players
  playing 2 games a day. Older scores stay in Firestore but drop off the board.
- Writes time out after 10 seconds with "Couldn't save. Check your connection." because
  Firestore would otherwise queue them offline indefinitely.
