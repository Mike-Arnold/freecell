
export class Move {
    constructor(g, moving_to="none") {
        g.move_index = g.moves.length
        g.undone_moves = []
        // console.log(g.move_index)
        this.moving_card = g.dragging_card
        this.moving_to = moving_to

        // previous card values - many will be null
        this.old_column = this.moving_card.column
        this.old_row = this.moving_card.row
        this.old_card_under = this.moving_card.card_under
        this.old_free_space = this.moving_card.free_space
        this.old_foundation = this.moving_card.foundation
        this.old_base = this.moving_card.base

        if (moving_to == "parent") {
            this.new_card_under = g.closest_parent_card
            // this.new_card_under_old_card_over = this.new_card_under.card_over
            this.new_card_under_new_card_over = this.moving_card
            this.new_column = this.new_card_under.column
            this.new_row = this.new_card_under.row + 1
        }
        if (moving_to == "free_space") {
            this.new_free_space = g.closest_free_space
            // this.new_free_space_old_current_card = this.new_free_space.current_card
            this.new_free_space_new_current_card = this.moving_card
        }
        if (moving_to == "foundation") {
            this.new_foundation = g.closest_foundation
            // this.new_foundation.update_suit_and_rank()
            // more foundation notes?
        }
        if (moving_to == "base") {
            this.new_base = g.closest_base
            // this.new_base_old_current_card = this.new_base.current_card
            this.new_base_new_current_card = this.moving_card
            this.new_column = this.new_base.column
            this.new_row = 0
        }
    }

    do(g) {
        this.moving_card.move_out()

        if (this.moving_to == "parent") {
            g.closest_parent_card.card_over = this.moving_card
            this.moving_card.card_under = g.closest_parent_card
            this.moving_card.column = g.closest_parent_card.column
            this.moving_card.row = g.closest_parent_card.row + 1
        }
        if (this.moving_to == "free_space") {
            g.closest_free_space.current_card = this.moving_card
            this.moving_card.free_space = g.closest_free_space
        }
        if (this.moving_to == "foundation") {
            g.closest_foundation.current_cards.push(this.moving_card)
            this.moving_card.foundation = g.closest_foundation
            g.closest_foundation.update_suit_and_rank()
        }
        if (this.moving_to == "base") {
            g.closest_base.current_card = this.moving_card
            this.moving_card.base = g.closest_base
            this.moving_card.column = g.closest_base.column
            this.moving_card.row = 0
        }
    }

    undo(g) {
        this.moving_card.column = this.old_column
        this.moving_card.row = this.old_row
        this.moving_card.card_under = this.old_card_under
        this.moving_card.free_space = this.old_free_space
        this.moving_card.foundation = this.old_foundation
        this.moving_card.base = this.old_base

        this.moving_card.arrange_stack(g)
        this.moving_card.move_to_end(g)

        if (this.old_card_under) {
            this.old_card_under.card_over = this.moving_card
        }
        if (this.old_free_space) {
            this.old_free_space.current_card = this.moving_card
        }
        if (this.old_foundation) {
            this.old_foundation.current_cards.push(this.moving_card)
            this.new_foundation.update_suit_and_rank()
        }
        if (this.old_base) {
            this.old_base.current_card = this.moving_card
        }

        if (this.new_card_under) {
            this.new_card_under.card_over = null
        }
        if (this.new_free_space) {
            this.new_free_space.current_card = null
        }
        if (this.new_foundation) {
            this.new_foundation.current_cards.pop()
            this.new_foundation.update_suit_and_rank()
        }
        if (this.new_base) {
            this.new_base.current_card = null
        }
    }
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

export function drop_onto_free_space(g) {
    // move dragging card away from wherever it is
    g.dragging_card.move_out()
    // associate card with free space
    g.closest_free_space.current_card = g.dragging_card
    g.dragging_card.free_space = g.closest_free_space
}

export function drop_onto_foundation(g) {
    // move dragging card away from wherever it is
    g.dragging_card.move_out()
    // associate card with foundation
    g.closest_foundation.current_cards.push(g.dragging_card)
    g.dragging_card.foundation = g.closest_foundation
    f.update_suit_and_rank()
    // update foundation stats
    g.closest_foundation.current_rank = g.dragging_card.rank
    g.closest_foundation.current_rank_index = g.dragging_card.rank_index
    g.closest_foundation.current_suit = g.dragging_card.suit
}

export function drop_onto_base(g) {
    if (!g.dragging_card.stack_size) {
        g.dragging_card.stack_size = 1
        // console.log("no stack size, defaulting to 1")
    }
    // console.log("stack size", g.dragging_card.stack_size)
    if (g.dragging_card.stack_size > g.smaller_stack_limit) return
    // move dragging card away from wherever it is
    g.dragging_card.move_out()
    // associate card with free space
    g.closest_base.current_card = g.dragging_card
    g.dragging_card.base = g.closest_base
    g.dragging_card.column = g.closest_base.column
    g.dragging_card.row = 0
}

export function auto_move_to_foundations(g, limit = 0) {

    let matched_at_least_once = false
    
    g.foundations.forEach(f => {
        g.cards.forEach(c => {
            if (c.card_over) return
            if (c.foundation) return

            let match = false

            if (c.rank == "A" && !f.current_suit) match = true
            if (c.rank_index == f.current_rank_index + 1 && 
                c.suit == f.current_suit) match = true
            if (!match) return

            // move dragging card away from wherever it is
            c.move_out()
            // associate card with foundation
            f.current_cards.push(c)
            c.foundation = f
            // update foundation stats
            f.current_rank = c.rank
            f.current_rank_index = c.rank_index
            f.current_suit = c.suit
            // move the card to the end of the list of cards
            let index = g.cards.indexOf(c)
            if (index != -1) {
                g.cards.push(g.cards.splice(index, 1)[0])
            }
            matched_at_least_once = true
        })
    })

    if (matched_at_least_once && limit <= g.num_decks * 52) {
        auto_move_to_foundations(g, limit+1)
    }
}
