
import { Card } from './card.js'
import * as draw from './draw.js'

export class Base extends Card {
    constructor(scale = 1.15, x=10, y=10, column=null) {
        super()
        this.x = x
        this.y = y
        this.scale = scale
        this.width = 5 * 20 * scale
        this.height = 7 * 20 * scale
        this.radius = 10 / 1.15 * scale

        this.column = column
        this.row = 0

        this.current_card = null

        this.hovering = false
        this.highlighted = false
    }

    update_scale(g) {
        this.scale = g.scale
        this.width = 5 * 20 * g.scale
        this.height = 7 * 20 * g.scale
        this.radius = 10 / 1.15 * g.scale
    }

    position_base(g) {
        let total_cols = g.num_columns
        let mid_x = (window.innerWidth - 10) / 2
        let left_x = mid_x - total_cols/2 * (this.width+10) - g.spacer_width/2

        this.x = left_x + this.column * (this.width + g.spacer_width)
        this.y = this.row * (this.height + g.spacer_width) + g.spacer_width
        
        if (this.column >= 0) {
            this.x = (window.innerWidth - 10)/2 + (this.column-g.num_columns/2)*(this.width+10)
        }
        if (this.column >= 0) {
            this.y = this.height*2 + g.spacer_width*4 + (this.row*this.height/5.5)
        }
    }

    draw_base(g) {
        draw.draw_card_border(g.ctx, g, this, g.dark_grey, g.dark_grey)
    }
}

export function find_hovering(g) {
    find_candidates(g)
    find_closest(g)
}

function find_candidates(g) {
    if (!g.dragging_card) return
    let d = g.dragging_card

    g.hovering_base = null
    let closest_distance = null
    g.closest_base = null

    g.bases.forEach(c => {
        if (c.current_card) return

        let x_distance = Math.abs(c.x - d.x)
        let y_distance = Math.abs(c.y - d.y)
        let distance = Math.sqrt(x_distance**2 + y_distance**2)

        if (x_distance < c.width && y_distance < c.height) {
            if (!closest_distance) {
                closest_distance = distance
                g.closest_base = c
            } else if (distance < closest_distance) {
                closest_distance = distance
                g.closest_base = c
            }
        }
    })
}

function find_closest(g) {
    g.bases.forEach(c => {
        if (c == g.closest_base) {
            console.log("found closest")
            c.hovering = true
            c.highlighted = true
            g.hovering_base = c
        } else {
            c.hovering = false
            c.highlighted = false
        }
    })
}

export function drop_onto_base(g) {
    if (!g.dragging_card.stack_size) g.dragging_card.stack_size = 1
    if (g.dragging_card.stack_size > g.smaller_stack_limit) return
    // move dragging card away from wherever it is
    g.dragging_card.move_out()
    // associate card with free space
    g.closest_base.current_card = g.dragging_card
    g.dragging_card.base = g.closest_base
    g.dragging_card.column = g.closest_base.column
    g.dragging_card.row = 0
}

export function clear_highlights(g) {
    g.hovering_base = null
    g.closest_base = null
    g.bases.forEach(b => {
        b.hovering = false
        b.highlighted = false
    })
}
