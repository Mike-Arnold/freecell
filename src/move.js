
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
            this.new_card_under_new_card_over = this.moving_card
            this.new_column = this.new_card_under.column
            this.new_row = this.new_card_under.row + 1
        }
        if (moving_to == "free_space") {
            this.new_free_space = g.closest_free_space
            this.new_free_space_new_current_card = this.moving_card
        }
        if (moving_to == "foundation") {
            this.new_foundation = g.closest_foundation
            // more foundation notes?
        }
        if (moving_to == "base") {
            this.new_base = g.closest_base
            this.new_base_new_current_card = this.moving_card
            this.new_column = this.new_base.column
            this.new_row = 0
        }
    }

    do(g) {
        this.moving_card.move_out()

        if (this.moving_to == "parent") {
            this.new_card_under.card_over = this.moving_card
            this.moving_card.card_under = this.new_card_under
            this.moving_card.column = this.new_card_under.column
            this.moving_card.row = this.new_card_under.row + 1
        }
        if (this.moving_to == "free_space") {
            this.new_free_space.current_card = this.moving_card
            this.moving_card.free_space = this.new_free_space
        }
        if (this.moving_to == "foundation") {
            this.new_foundation.current_cards.push(this.moving_card)
            this.moving_card.foundation = this.new_foundation
            this.new_foundation.update_suit_and_rank()
        }
        if (this.moving_to == "base") {
            this.new_base.current_card = this.moving_card
            this.moving_card.base = this.new_base
            this.moving_card.column = this.new_base.column
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
