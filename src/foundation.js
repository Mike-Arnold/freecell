
import { Card } from './card.js'
import * as draw from './draw.js'

export class Foundation extends Card {
    constructor(scale = 1.15, x=10, y=10, column=null, row=null) {
        super()
        this.x = x
        this.y = y
        this.scale = scale
        this.width = 5 * 20 * scale
        this.height = 7 * 20 * scale
        this.radius = 10 / 1.15 * scale

        this.column = column
        this.row = row

        this.current_cards = []
        this.current_suit = null
        this.current_rank = null
        this.current_rank_index = null

        this.hovering = false
        this.highlighted = false
    }

    update_scale(g) {
        this.scale = g.scale
        this.width = 5 * 20 * g.scale
        this.height = 7 * 20 * g.scale
        this.radius = 10 / 1.15 * g.scale
    }

    position_foundation(g) {
        let rows = 2
        let total_cols = (g.num_free_spaces + g.num_decks*g.num_suits) / rows
        let mid_x = (window.innerWidth - 10) / 2
        let left_x = mid_x - total_cols/2 * (this.width+10) - g.spacer_width/2
        let free_spaces = g.num_free_spaces / rows

        this.x = left_x + (free_spaces + this.column) * (this.width + g.spacer_width) + g.spacer_width
        this.y = this.row * (this.height + g.spacer_width) + g.spacer_width
    }

    draw_foundation(g) {
        draw.draw_card_border(g.ctx, g, this, g.dark_grey, g.dark_grey)

        g.ctx.save()
        g.ctx.translate(this.x + this.width * .5, this.y + this.height * .5)
        
        let font_size = 50 * g.scale
        g.ctx.fillStyle = g.background_grey
        g.ctx.textAlign = 'center'
        g.ctx.textBaseline = 'middle'
        g.ctx.font = `${font_size}px CardCharacters`
        g.ctx.fillText("A", 0, 0)
    
        g.ctx.restore()
    }

    update_suit_and_rank() {
        let top_card = this.current_cards.at(-1)
        if (top_card) {
            this.current_suit = top_card.suit
            this.current_rank = top_card.rank
            this.current_rank_index = top_card.rank_index
        } else {
            this.current_suit = null
            this.current_rank = null
            this.current_rank_index = null
        }
    }
}

export function find_hovering(g) {
    if (g.dragging_card.stack_size > 1) return
    find_candidates(g)
    find_closest(g)
}

function find_candidates(g) {
    let d = g.dragging_card

    g.hovering_foundation = null
    let closest_distance = null
    g.closest_foundation = null

    g.foundations.forEach(c => {
        c.update_suit_and_rank()
        if (c.current_suit) {
            if (c.current_suit != d.suit) return
        } else if (d.rank != "A") return
        if (c.current_rank) {
            let foundation_rank_index = c.current_rank_index
            let dragging_card_rank_index = d.rank_index
            if (foundation_rank_index != dragging_card_rank_index - 1) return
        }

        let x_distance = Math.abs(c.x - d.x)
        let y_distance = Math.abs(c.y - d.y)
        let distance = Math.sqrt(x_distance**2 + y_distance**2)

        if (x_distance < c.width && y_distance < c.height) {
            if (!closest_distance) {
                closest_distance = distance
                g.closest_foundation = c
            } else if (distance < closest_distance) {
                closest_distance = distance
                g.closest_foundation = c
            }
        }
    })
}

function find_closest(g) {
    g.foundations.forEach(c => {
        if (c == g.closest_foundation) {
            c.hovering = true
            c.highlighted = true
            g.hovering_foundation = c
            let top_card = c.current_cards.at(-1)
            if (top_card) {
                top_card.hovering = true
                top_card.highlighted = true
            }
        } else {
            c.hovering = false
            c.highlighted = false
            let top_card = c.current_cards.at(-1)
            if (top_card) {
                top_card.hovering = false
                top_card.highlighted = false
            }
        }
    })
}

export function drop_onto_foundation(g) {
    // move dragging card away from wherever it is
    g.dragging_card.move_out()
    // associate card with foundation
    g.closest_foundation.current_cards.push(g.dragging_card)
    g.dragging_card.foundation = g.closest_foundation
    // update foundation stats
    g.closest_foundation.update_suit_and_rank()
    // g.closest_foundation.current_rank = g.dragging_card.rank
    // g.closest_foundation.current_rank_index = g.dragging_card.rank_index
    // g.closest_foundation.current_suit = g.dragging_card.suit
}

export function clear_highlights(g) {
    g.hovering_foundation = null
    g.closest_foundation = null
    g.foundations.forEach(c => {
        c.hovering = false
        c.highlighted = false
    })
}
