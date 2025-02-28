
export class Card {
    constructor(scale = 1.15, x=10, y=10, rank="A", rank_index=0, suit="♠", suit_size=1, suit_color="black") {
        this.x = x
        this.y = y
        this.scale = scale
        this.width = 5 * 20 * scale
        this.height = 7 * 20 * scale
        this.radius = 10 / 1.15 * scale
        this.dragging = false
        this.angle = Math.PI
        this.rank = rank
        this.rank_index = rank_index
        this.suit = suit
        this.suit_size = suit_size
        this.suit_color = suit_color

        this.column = null
        this.row = null
        this.free_space = null
        this.foundation = null
        this.base = null

        this.hovering = false
        this.highlighted = false
    }

    update_scale(g) {
        this.scale = g.scale
        this.width = 5 * 20 * g.scale
        this.height = 7 * 20 * g.scale
        this.radius = 10 / 1.15 * g.scale
    }

    deal_card(g, i) {
        this.column = i % g.num_columns
        this.row= Math.floor(i / g.num_columns)

        // Find the card under it (if any)
        let cards_in_column = g.columns[this.column].length
        let under_index = cards_in_column - 1 // or minus 2 ?
        let card_under = cards_in_column > 0 ? g.columns[this.column][under_index] : null
        if (card_under) {
            this.card_under = card_under
            card_under.card_over = this
        }

        g.columns[this.column].push(this)
    }

    position_card(g) {
        if(this.dragging) {
            if (g.dragging_card == this) return
            if (!this.card_under) return // just in case
            let parent = this.card_under
            // console.log("moving a child")
            this.x = parent.x
            this.y = parent.y + this.height/5.5
            return
        }

        if (this.column >= 0) {
            this.x = (window.innerWidth - 10)/2 + (this.column-g.num_columns/2)*(this.width+10)
        }
        if (this.column >= 0) {
            this.y = this.height*2 + g.spacer_width*4 + (this.row*this.height/5.5)
        }
        if (this.free_space) {
            this.x = this.free_space.x
            this.y = this.free_space.y
        }
        if (this.foundation) {
            this.x = this.foundation.x
            this.y = this.foundation.y
        }
    }
    
    is_hovering(x, y) {
        if (
            x > this.x && x < this.x + this.width &&
            y > this.y && y < this.y + this.height &&
            // !this.card_over // edit this to allow for moving stacks
            this.selectable
        ) {
            return true
        } else {
            return false
        }
    }

    move_out() {
        // remove card from tableau
        this.column = null
        this.row = null
        if (this.card_under) {
            this.card_under.card_over = null
            this.card_under = null
        }
        // move card out of current free space (if any)
        if (this.free_space) {
            this.free_space.current_card = null
            this.free_space = null
        }
        // move card out of current foundation (if any)
        if (this.foundation) {
            let current_cards = this.foundation.current_cards
            let index = current_cards.length-1
            if (index >= 0) {
                current_cards.splice(index, 1)
            }
            this.foundation.update_suit_and_rank()
            // if (current_cards == []) {
            //     this.foundation.current_suit = null
            //     this.foundation.current_rank = null
            // }

            this.foundation = null
        }
        // move card out of current base (if any)
        if (this.base) {
            this.base.current_card = null
            this.base = null
        }
    }
    
    is_child() {
        if (!this.card_under) return false
        if (this.suit_color == this.card_under.suit_color) return false
        if (this.rank_index != this.card_under.rank_index - 1) return false
        return true
    }

    move_to_end(g) {
        let index = g.cards.indexOf(this)
        if (index != -1) {
            g.cards.push(g.cards.splice(index, 1)[0])
        }
        if (this.card_over) {
            this.card_over.move_to_end(g)
        }
    }

    arrange_stack(g) {
        if (this.card_over) {
            this.card_over.column = this.column
            this.card_over.row = this.row + 1

            this.card_over.move_to_end(g)
            this.card_over.arrange_stack(g)
        }
    }
}

export function populate_selections(g, limit=0) {
    if (limit > g.num_decks * 52) return
    let found_a_selection = false

    // initially, select only showing cards
    if (limit == 0) {
        g.selections = []
        g.cards.forEach(c => {
            c.selectable = false
            if (!c.card_over) {
                g.selections.push(c)
                c.selectable = true
                found_a_selection = true
            }
        })
    }
    // then look again for parents
    g.selections.forEach(c => {
        if (c.is_child() && !c.card_under.selectable) {
            g.selections.push(c.card_under)
            c.card_under.selectable = true
            // console.log(c.suit, c.rank, " is child of ", c.card_under.suit, c.card_under.rank)
            found_a_selection = true
        }
    })

    if (found_a_selection) {
        populate_selections(g, limit+1)
    }
}

export function remove_deep_parents(g) {
    g.find_stack_limit()
    // console.log("Max stack size is", g.stack_limit)

    let maxRowPerColumn = {}

    // determine max row for each column
    for (let selection of g.selections) {
        let { row, column } = selection
        if (!(column in maxRowPerColumn)) {
            maxRowPerColumn[column] = 0
        }
        maxRowPerColumn[column] = Math.max(maxRowPerColumn[column], row)
    }

    // console.log("Max row per column:", maxRowPerColumn)

    // mark selections as unselectable if too deep
    for (let selection of g.selections) {
        let { row, column } = selection
        selection.stack_size = maxRowPerColumn[column] - row + 1
        // if (row <= maxRowPerColumn[column] - g.stack_limit) {
        if (selection.stack_size > g.stack_limit) {
            selection.selectable = false
            // console.log(`Setting selectable=false: row ${row}, column ${column}`)
        }
    }
}

export function find_hovering_card(g, e) { //card to pick up
    if (g.dragging_card) return
    g.hovering_card = null
    g.cards.forEach(c => {
        c.hovering = false
        c.highlighted = false
        if (c.is_hovering(e.offsetX, e.offsetY)) {
            g.hovering_card = c
        }
    })
    if (g.hovering_card) {
        g.hovering_card.hovering = true
        g.hovering_card.highlighted = true
    }
}

export function find_hovering_parent(g) {
    if (!g.dragging_card) return
    find_candidates(g)
    find_closest(g)
}

function find_candidates(g) {
    let d = g.dragging_card

    g.hovering_card = null
    let closest_distance = null
    g.closest_parent_card = null

    g.cards.forEach(c => {
        // can't pick yourself
        if (c.dragging) return
        // only open cards
        if (c.card_over) return
        // no cards on free spaces or foundations
        if (c.free_space || c.foundation) return
        // picky about color
        if (c.suit_color == g.dragging_card.suit_color) return
        // picky about rank
        let parent_card_rank_index = c.rank_index
        let dragging_card_rank_index = g.dragging_card.rank_index
        if (parent_card_rank_index != dragging_card_rank_index + 1) return

        let x_distance = Math.abs(c.x - d.x)
        let y_distance = Math.abs(c.y - d.y)
        let distance = Math.sqrt(x_distance**2 + y_distance**2)

        if (x_distance < c.width && y_distance < c.height) {
            if (!closest_distance) {
                closest_distance = distance
                g.closest_parent_card = c
            } else if (distance < closest_distance) {
                closest_distance = distance
                g.closest_parent_card = c
            }
        }
    })
}

function find_closest(g) {
    g.cards.forEach(c => {
        if (c == g.dragging_card) return
        if (c == g.closest_parent_card) {
            c.hovering = true
            c.highlighted = true
            g.hovering_card = c
        } else {
            c.hovering = false
            c.highlighted = false
        }
    })
}

export function drop_onto_parent_card(g) {
    // move dragging card away from wherever it is
    g.dragging_card.move_out()
    // associate card with parent
    g.closest_parent_card.card_over = g.dragging_card
    g.dragging_card.card_under = g.closest_parent_card
    g.dragging_card.column = g.closest_parent_card.column
    g.dragging_card.row = g.closest_parent_card.row + 1
}

export function clear_dragging(g) {
    g.cards.forEach(c => {
        c.dragging = false
    })
}

export function clear_highlights(g) {
    g.closest_parent_card = null
    g.cards.forEach(c => {
        c.hovering = false
        c.highlighted = false
    })
}
