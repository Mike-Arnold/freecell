
import { Card } from './card.js'
import * as draw from './draw.js'

export class FreeSpace extends Card {
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

        this.current_card = null

        // this.hovering = false
        this.highlighted = false
    }

    update_scale(g) {
        this.scale = g.scale
        this.width = 5 * 20 * g.scale
        this.height = 7 * 20 * g.scale
        this.radius = 10 / 1.15 * g.scale
    }

    position_space(g) {
        let rows = 2
        let total_cols = (g.num_free_spaces + g.num_decks*g.num_suits) / rows
        let mid_x = (window.innerWidth - 10) / 2
        let left_x = mid_x - total_cols/2 * (this.width+10) - g.spacer_width/2

        this.x = left_x + this.column * (this.width + g.spacer_width)
        this.y = this.row * (this.height + g.spacer_width) + g.spacer_width
    }

    draw_space(g) {
        draw.draw_card_border(g.ctx, g, this, g.dark_grey, g.dark_grey)
    }
}

export function find_hovering(g) {
    if (g.dragging_card.stack_size > 1) return
    find_candidates(g)
    find_closest(g)
}

function find_candidates(g) {
    let d = g.dragging_card

    g.hovering_free_space = null
    let closest_distance = null
    g.closest_free_space = null

    g.free_spaces.forEach(c => {
        if (c.current_card) return

        let x_distance = Math.abs(c.x - d.x)
        let y_distance = Math.abs(c.y - d.y)
        let distance = Math.sqrt(x_distance**2 + y_distance**2)

        if (x_distance < c.width && y_distance < c.height) {
            if (!closest_distance) {
                closest_distance = distance
                g.closest_free_space = c
            } else if (distance < closest_distance) {
                closest_distance = distance
                g.closest_free_space = c
            }
        }
    })
}

function find_closest(g) {
    g.free_spaces.forEach(c => {
        if (c == g.closest_free_space) {
            // c.hovering = true
            c.highlighted = true
            g.hovering_free_space = c
        } else {
            // c.hovering = false
            c.highlighted = false
        }
    })
}

export function clear_highlights(g) {
    // g.hovering_free_space = null
    // g.closest_free_space = null
    g.free_spaces.forEach(c => {
        // c.hovering = false
        c.highlighted = false
    })
}
