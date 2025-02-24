
import * as card from './card.js'
import * as draw from './draw.js'
import * as event from './event.js'
import * as game from './game.js'

const g = new game.Game()
event.add_listeners(g)

// load fonts
const cardCharacters = new FontFace('CardCharacters', 'url(../fonts/cardcharacters.ttf)')
const cardCharactersNarrow = new FontFace('CardCharactersNarrow', 'url(../fonts/cardcharactersnarrow.ttf)')
// draw after loading fonts
Promise.all([
    cardCharacters.load(), 
    cardCharactersNarrow.load()
]).then(([cardFont1, cardFont2]) => {
    document.fonts.add(cardFont1)
    document.fonts.add(cardFont2)
    draw.draw_game(g) // Now draw with loaded fonts
})

// set frame rate / rendering loop
let last_time = 0
function gameLoop(timestamp) {

    g.timestamp = timestamp % 1000
    g.delta_time = timestamp - last_time

    if (g.delta_time >= g.interval) {
        last_time = timestamp - (g.delta_time % g.interval)
        g.find_scale()
        draw.draw_game(g)
    }
    
    requestAnimationFrame(gameLoop)
}
requestAnimationFrame(gameLoop)
