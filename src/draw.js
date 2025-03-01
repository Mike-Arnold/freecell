
export function draw_game(g) {
    g.find_canvas_dimensions()
    g.ctx.clearRect(0, 0, g.canvas.width, g.canvas.height)
    
    draw_free_cells(g)
    draw_foundation_spaces(g)
    draw_bases(g)

    g.position_cards()
    g.cards.forEach(c => {
        draw_card(g.ctx, g, c)
    })
}

function draw_free_cells(g) {
    g.free_spaces.forEach(space => {
        space.update_scale(g)
        space.draw_space(g)
    }) 
}

function draw_foundation_spaces(g) {
    g.foundations.forEach(foundation => {
        foundation.update_scale(g)
        foundation.draw_foundation(g)
    }) 
}

function draw_bases(g) {
    g.bases.forEach(base => {
        base.update_scale(g)
        base.draw_base(g)
    })
}

function draw_card(ctx, g, c) {
    c.update_scale(g)

    let back_color = g.dark_grey
    if (c.suit_color == g.bright_red) {
        back_color = g.dark_red
    }

    draw_card_border(ctx, g, c, c.back_color, g.light_grey)
    c.angle = 0
    draw_corner(ctx, g, c)
    c.angle = Math.PI
    draw_corner(ctx, g, c)
    draw_large(ctx, g, c)
}

export function draw_card_border(ctx, g, c, fill_color, line_color) {
    ctx.beginPath()
    ctx.moveTo(c.x + c.radius, c.y)
    ctx.arcTo(c.x + c.width, c.y, c.x + c.width, c.y + c.height, c.radius)
    ctx.arcTo(c.x + c.width, c.y + c.height, c.x, c.y + c.height, c.radius)
    ctx.arcTo(c.x, c.y + c.height, c.x, c.y, c.radius)
    ctx.arcTo(c.x, c.y, c.x + c.width, c.y, c.radius)
    ctx.closePath()
    ctx.fillStyle = fill_color
    ctx.fill()
    ctx.strokeStyle = line_color
    ctx.lineWidth = 1
    ctx.stroke()
    if (c.highlighted) {
        ctx.strokeStyle = g.light_grey
        ctx.lineWidth = 3
        ctx.stroke()
    }
}

function draw_corner(ctx, g, c) {
    ctx.save()
    ctx.translate(c.x + c.width * .5, c.y + c.height * .5)
    ctx.rotate(c.angle)

    ctx.fillStyle = c.suit_color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    let font_size = 20 * g.scale
    ctx.font = `${font_size}px CardCharacters`
    // special case where '10' is thinner text
    //if (c.rank == "10") ctx.font = `${font_size}px CardCharactersNarrow`
    ctx.fillText(c.rank, c.width*-.4, c.height*-.4)
    ctx.font = `${font_size*c.suit_size*1.3}px Arial`
    if (c.suit == "♣") ctx.font = `${font_size*c.suit_size*.9}px CardCharacters`
    //ctx.fillText(c.suit, c.width*-.4, c.height*-.27)
    ctx.fillText(c.suit, c.width*-.24, c.height*-.4)

    ctx.restore()
}

function draw_large(ctx, g, c) {
    ctx.save()
    ctx.translate(c.x + c.width * .53, c.y + c.height * .5)

    ctx.fillStyle = c.suit_color
    ctx.textBaseline = 'middle'
    
    let font_size = 50 * g.scale
    ctx.font = `${font_size}px CardCharacters`
    // special case where '10' is thinner text
    // if (c.rank == "10") ctx.font = `${font_size}px CardCharactersNarrow`
    ctx.textAlign = 'right'
    ctx.fillText(c.rank, 0, 0)

    ctx.font = `${font_size * c.suit_size}px Arial`
    if (c.suit == "♣") ctx.font = `${font_size * c.suit_size * .7}px CardCharacters`
    ctx.textAlign = 'left'
    ctx.fillText(c.suit, 0, 0)

    ctx.restore()
}
