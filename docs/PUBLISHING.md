# Publishing checklist

Step-by-step guide to put Clockwork Butterfly on GitHub, turn on the live demo, and present it on your profile, CV and LinkedIn.

## 1. Create the repository

1. Go to <https://github.com/new>.
2. **Repository name:** `clockwork-butterfly`
3. **Description:** `A procedural mechanical butterfly in three.js — meshing gears, 3 aesthetic modes, exploded anatomy view and live kinematics telemetry.`
4. Choose **Public**. Leave "Add a README", ".gitignore" and "license" **unchecked** (they are already in this folder).
5. Click **Create repository**.

## 2. Replace the placeholder username

The README links use `YOUR-USERNAME`. Replace it with your GitHub username before pushing.

```bash
# macOS / Linux / Git Bash on Windows
sed -i 's/YOUR-USERNAME/your-real-username/g' README.md
```

Or open `README.md` in VS Code, press `Ctrl+H`, and replace all.

## 3. Push the code

From inside the `clockwork-butterfly` folder:

```bash
git init
git add .
git commit -m "Clockwork Butterfly: procedural three.js automaton"
git branch -M main
git remote add origin https://github.com/your-real-username/clockwork-butterfly.git
git push -u origin main
```

No terminal? In the empty repository page, click **uploading an existing file**, drag the whole folder's contents in, and commit.

## 4. Turn on the live demo (GitHub Pages)

1. Repository → **Settings** → **Pages**.
2. *Build and deployment* → Source: **Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)` → **Save**.
4. Wait about a minute. The site appears at `https://your-real-username.github.io/clockwork-butterfly/`.

The empty `.nojekyll` file tells Pages to serve the files as they are.

## 5. Polish the repository page

- **About** (gear icon on the right of the repo page):
  - Website: paste the Pages URL and tick "Use your GitHub Pages website".
  - Topics: `threejs` `webgl` `javascript` `procedural-generation` `creative-coding` `3d` `data-visualization` `signal-processing` `github-pages` `portfolio`
- **Social preview:** Settings → General → Social preview → upload `docs/images/social.png` (1280×640). This is the image shown when the link is shared on LinkedIn, X or WhatsApp.
- **Pin it:** on your profile page, click *Customize your pins* and select the repository.
- **Release:** Releases → *Draft a new release* → tag `v1.0.0` → title "Clockwork Butterfly 1.0" → attach `index.html` (the single-file build).

## 6. CV / portfolio line

> **Clockwork Butterfly** — interactive 3D automaton in three.js (JavaScript, WebGL). Procedural geometry with correctly meshing gear trains; live telemetry that resamples the wing signals at 60 Hz and estimates the fore/hind phase lag by cross-correlation (≈50 ms, true value 46 ms); 3 theme modes; deployed on GitHub Pages. *github.com/your-real-username/clockwork-butterfly*

## 7. LinkedIn post (English)

> I built a mechanical butterfly entirely from code.
>
> No 3D model files: every gear, vein and wing is generated in three.js from maths. The gears really mesh (pitch radius N·m/2, speed ratio −N₁/N₂), and a telemetry panel records the wing angles as a time series and recovers the fore/hind wing lag by cross-correlation, the same tool I use in statistics for lagged signals.
>
> It has three looks (Porcelain, Verdigris, Midnight), an exploded anatomy view, and runs on a phone.
>
> Live demo: https://your-real-username.github.io/clockwork-butterfly/
> Code: https://github.com/your-real-username/clockwork-butterfly
>
> #threejs #dataviz #creativecoding #javascript #statistics

## 7b. Version française

> J'ai créé un papillon mécanique entièrement en code.
>
> Aucun modèle 3D importé : chaque engrenage, nervure et aile est généré en three.js à partir de formules. Les engrenages s'engrènent vraiment (rayon primitif N·m/2, rapport de vitesse −N₁/N₂), et un panneau de télémétrie enregistre l'angle des ailes comme une série temporelle et retrouve le déphasage entre ailes antérieures et postérieures par corrélation croisée, le même outil que j'utilise en statistique pour les séries décalées.
>
> Trois ambiances visuelles, une vue anatomique éclatée, et ça tourne sur mobile.
>
> Démo : https://your-real-username.github.io/clockwork-butterfly/
> Code : https://github.com/your-real-username/clockwork-butterfly
