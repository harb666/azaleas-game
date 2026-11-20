# Cake Dash 🍰

A square strawberry shortcake leaves a magical shortcake trail behind it. It flies past five long candy pipes, then lands in a strawberry candy world where it has to jump over obstacles instead of flying.

## Play
- **Phone:** host the folder on any static site (for example GitHub Pages) and open it in Safari. For full screen, choose Share → *Add to Home Screen*.
- **Computer:** open `index.html`, or run `python3 -m http.server` in this folder and visit http://localhost:8000.

## Controls
- **Tap / click / Space**: flap (Level 1) or jump (Level 2). Holding does nothing extra; every flap or jump needs a new tap.
- 🔊 button: turns sound on or off. The setting is remembered.

## Levels
Pick either level from the main menu.
1. **Fly forever**: tap to flap through candy pipes. There's no end: the further you fly, the faster it scrolls and the narrower and closer the gaps get. You'll see cheers at 5, 10, 15, 20 and 30 pipes.
2. **Run & jump**: the cake runs by itself; tap to jump over strawberries, chocolate blocks, rolling sweets, candy spikes, frosting barriers and holes. It speeds up, and the obstacles get closer together, all the way to the finish line.

## Points and cakes
Every pipe, obstacle and strawberry is worth 1 point, and reaching the finish line is worth 10. Points from every game are added up and can be spent in the **Cakes** shop:

| Cake | Points |
|---|---|
| Shortcake | free |
| Choco Cake | 20 |
| Mint Choc Chip | 60 |
| Blueberry Cheesecake | 120 |
| Rainbow Sprinkle | 200 |
| Royal Gold Cake | 400 |

Points, owned cakes, the chosen cake, best scores and the mute setting are saved on the device (`localStorage`).

## Code
Plain HTML5 Canvas + JavaScript with no dependencies or build step. All art and sound are generated in code.
- `js/cake.js`: the shortcake character
- `js/particles.js`: shortcake trail and confetti
- `js/level1.js`, `js/level2.js`: the two levels
- `js/background.js`: parallax scenery
- `js/audio.js`: Web Audio sound effects and music
- `js/main.js`: game loop, menus, input and saving
