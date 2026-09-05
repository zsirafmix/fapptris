# 🎮 Flapptris - Flappy Bird x Tetris Crossover

Egy böngészőben futó, modern arcade játék, amely ötvözi a Flappy Bird repülési fizikáját a Tetris forgatásával, rácshoz illesztésével és sortörlésével.

![Flapptris Screenshot](screenshot.png) <!-- Opcionális -->

## 🕹️ Irányítás

| Funkció | Billentyűzet | Egér / Érintés |
|---|---|---|
| **Felfelé impulzus (Flap)** | `Space` | Kattintás / Érintés / Flap gomb |
| **Forgatás balra (90° CCW)** | `Q` vagy `Balra nyíl` | ↶ Q gomb |
| **Forgatás jobbra (90° CW)** | `E` vagy `Jobbra nyíl` | ↷ E gomb |
| **Gyors lehelyezés (Drop)** | `S` vagy `Le nyíl` | ⤓ S gomb |
| **Szünet (Pause)** | `P` vagy `Escape` | ⏸ gomb |
| **Hang némítás / bekapcsolás** | - | 🔊 / 🔇 gomb |

## 🌟 Főbb funkciók

- **Fizika & csúszás**: Különválasztott X és Y integráció; felületre érve az elem továbbcsúszik vízszintesen.
- **10 oszlopos Tetris Lock-zóna**: Rácshoz tapadás és rögzülés a jobb oldali veremben.
- **Sortörlés & bónuszok**: 1, 2, 3 és 4 soros (Tetris!) törlés pontszorzókkal.
- **Web Audio API**: 100% procedurális retro szintetizált hangeffektek.
- **Top 10 Ranglista**: Névvalidációval és perzisztens mentéssel (`localStorage`).
- **Reszponzivitás**: Teljes értékű virtuális érintőgombok mobilhoz és tablethez.

## 🚀 Futtatás helyileg

```bash
# 1. Klónozás
git clone https://github.com/zsirafmix/fapptris.git
cd flapptris

# 2. Indítás Node.js-szel:
npm start

# Vagy egyszerű Python HTTP szerverrel:
python3 -m http.server 8080
```
Nyisd meg a böngészőben: `http://localhost:3000` (vagy `http://localhost:8080`).

## 🌐 Telepítés Renderre (render.com)

1. Menj a [dashboard.render.com](https://dashboard.render.com/) oldalra.
2. Kattints a **New +** gombra, majd válaszd a **Web Service** (vagy **Static Site**) opciót.
3. Csatlakoztasd a GitHub fiókodat és válaszd ki a `flapptris` repót.
4. Beállítások:
   - **Environment / Runtime**: `Node`
   - **Build Command**: hagyd üresen vagy `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Kattints a **Create Web Service** gombra, és a Render automatikusan lefordítja és közzéteszi a játékot!
