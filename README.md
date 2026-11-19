# Cake Dash 🍰

A square strawberry shortcake leaves a magical shortcake trail behind it. It flies past five long candy pipes, then lands in a strawberry candy world where it has to jump over obstacles instead of flying.

## Play
- **Phone:** host the folder on any static site (for example GitHub Pages) and open it in Safari. For full screen, choose Share → *Add to Home Screen*.
- **Computer:** open `index.html`, or run `python3 -m http.server` in this folder and visit http://localhost:8000.

## Controls
- **Tap / click / Space**: flap (Level 1) or jump (Level 2). Holding does nothing extra; every flap or jump needs a new tap.
- 🔊 button: turns sound on or off. The setting is remembered.

## Levels
1. **Fly**: fly through exactly 5 candy pipe pairs. After that you see *LEVEL COMPLETE! 🍓* and Level 2 starts automatically, with your score kept.
2. **Run**: the cake runs by itself and can't fly any more. Tap to jump over giant strawberries, chocolate blocks, rolling sweets, candy spikes, frosting barriers and gaps in the ground, all the way to the finish line.

Unlocked levels, best score and the mute setting are saved in `localStorage`.

## Code
Plain HTML5 Canvas + JavaScript with no dependencies or build step. All art and sound are generated in code.
- `js/cake.js`: the shortcake character
- `js/particles.js`: shortcake trail and confetti
- `js/level1.js`, `js/level2.js`: the two levels
- `js/background.js`: parallax scenery
- `js/audio.js`: Web Audio sound effects and music
- `js/main.js`: game loop, menus, input and saving
