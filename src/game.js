
import { Card } from './card.js'
import { FreeSpace } from './free_space.js'
import { Foundation } from './foundation.js'
import { Base } from './base.js'

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas')
        this.ctx = this.canvas.getContext('2d')
        
        this.background_grey = "rgb(24, 24, 24)"
        this.dark_grey = "rgb(32, 32, 32)"
        this.light_grey = "rgb(212, 212, 212)"
        this.bright_red = "rgb(255, 68, 59)"
        this.dark_red = "rgb(30, 18, 18)"
        this.bright_green = "rgb(50, 216, 76)"
        this.dark_green = "rgb(17, 29, 17)"
        this.bright_blue = "rgb(12, 131, 255)"
        this.dark_blue = "rgb(17, 17, 29)"

        this.num_decks = 4
        this.num_suits = 4
        this.rows = 2
        this.num_free_spaces = 14
        this.num_columns = 14

        // this.num_decks = 1
        // this.num_suits = 4
        // this.rows = 1
        // this.num_free_spaces = 4
        // this.num_columns = 8

        this.max_row = 15
        this.scale = 1.15
        this.spacer_width = 10

        this.set_timers()

        this.ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "=", "J", "Q", "K"] // '=' is 10
        this.suits = ["♦", "♥", "♣", "♠", "֍", "߷", "※", "⌘"]
        this.suit_sizes = [1, 1, 1, 1, .7, .8, .9, 1]
        this.cards = []
        this.make_new_cards()
        this.shuffle()

        this.free_spaces = []
        this.make_free_spaces()

        this.foundations = []
        this.make_foundations()

        this.bases = []
        this.make_bases()

        this.deal()
        this.selections = []

        this.moves = []
        this.move_index = 0
        this.undone_moves = []
    }
    
    set_timers() {
        this.fps = 200
        this.interval = 1000 / this.fps
        this.timestamp = 0
        this.loading = false
    }

    find_scale() {
        this.find_canvas_dimensions()

        // spacers to the left and right of each card space
        let free_space_cols = this.num_free_spaces / this.rows
        let foundation_cols = this.num_decks * this.num_suits / this.rows
        let num_spacers_above = 1 + free_space_cols + 1 + foundation_cols + 1
        let num_spacers_below = 1 + this.num_columns

        // full card spaces
        let num_cards_above = free_space_cols + foundation_cols
        let num_cards_below = this.num_columns

        let max_card_width_above = ( this.canvas.width - num_spacers_above * this.spacer_width ) / num_cards_above
        let max_card_width_below = ( this.canvas.width - num_spacers_below * this.spacer_width ) / num_cards_below
        let max_card_width = Math.min(max_card_width_above, max_card_width_below)

        this.scale = max_card_width / (5 * 20)
    }

    find_canvas_dimensions() {
        this.canvas.width = window.innerWidth - this.spacer_width*3
        this.canvas.height = window.innerHeight - this.spacer_width*2
        let card_height = 7*20*this.scale
        this.find_max_row()
        this.max_card_y = card_height*(this.rows+1) + this.spacer_width*4 + (this.max_row*card_height/5.5)
        if (this.canvas.height < this.max_card_y) {
            this.canvas.width = window.innerWidth - this.spacer_width*3
            this.canvas.height = this.max_card_y
        }
    }

    find_max_row() {
        this.max_row = 0
        this.cards.forEach(card => {
            this.max_row = Math.max(this.max_row, card.row+1)
        })
    }

    make_new_cards() {
        for(let i = 0; i < this.num_decks; i++) {
            this.make_deck()
        }
    }

    make_deck() {
        let suit_colors = [
            this.bright_red, this.bright_red,
            this.light_grey, this.light_grey,
            this.bright_green, this.bright_green,
            this.bright_blue, this.bright_blue
        ]

        let back_colors = [
            this.dark_red, this.dark_red,
            this.dark_grey, this.dark_grey,
            this.dark_green, this.dark_green,
            this.dark_blue, this.dark_blue
        ]
        
        for (let suit of this.suits.slice(0, this.num_suits)) {
            for (let rank of this.ranks) {
                let rank_index = this.ranks.indexOf(rank)
                let suit_index = this.suits.indexOf(suit)
                let suit_size = this.suit_sizes[suit_index]
                let suit_color = suit_colors[suit_index]
                let back_color = back_colors[suit_index]
                const c = new Card(this.scale, 0, 0, rank, rank_index, suit, suit_size, suit_color, back_color)
                this.cards.push(c)
            }
        }
    }

    make_free_spaces() {
        let rows = this.rows
        let cols = this.num_free_spaces / rows

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const space = new FreeSpace(this.scale, 0, 0, col, row)
                this.free_spaces.push(space)
            }
        }
    }

    make_foundations() {
        let rows = this.rows
        let cols = this.num_decks * this.num_suits / rows

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const space = new Foundation(this.scale, 0, 0, col, row)
                this.foundations.push(space)
            }
        }
    }

    make_bases() {
        let cols = this.num_columns

        for (let col = 0; col < cols; col++) {
            const space = new Base(this.scale, 0, 0, col)
            this.bases.push(space)
        }
    }

    shuffle() {
        let array = this.cards
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1)); // Random index
            [array[i], array[j]] = [array[j], array[i]] // Swap
        }
    }

    deal() {
        this.columns = Array.from({ length: this.num_columns }, () => [])
    
        this.cards.forEach((card, i) => {
            card.deal_card(this, i)
            if (i < this.num_columns) { // attach top cards to the base spots
                card.base = this.bases[i]
                this.bases[i].current_card = card
            }
        })
    }

    position_cards() {
        this.free_spaces.forEach(space => {
            space.position_space(this)
        })
        this.foundations.forEach(space => {
            space.position_foundation(this)
        })
        this.bases.forEach(space => {
            space.position_base(this)
        })

        this.enable_dragging_stacks()
        this.cards.forEach(card => {
            card.position_card(this)
        })
    }

    enable_dragging_stacks(limit=0) {
        if (limit > this.num_decks * 52) return
        let found_child = false
        this.cards.forEach(card => {
            if (card.dragging) return
            if (!card.card_under) return
            if (!card.card_under.dragging) return
            if (card.is_child()) {
                card.dragging = true
                // console.log(card.suit, card.rank, "is a child")
                found_child = true
            }
        })
        
        if (found_child) {
            this.enable_dragging_stacks(limit+1)
        }
    }

    find_stack_limit() {
        this.count_open_free_spaces()
        this.count_open_bases()

        let spaces = this.num_open_free_spaces
        let bases = this.num_open_bases

        this.stack_limit = (spaces+1) * Math.pow(2, bases)
        this.smaller_stack_limit = this.stack_limit/2
    }

    count_open_free_spaces() {
        this.num_open_free_spaces = 0
        this.free_spaces.forEach(fs => {
            if(!fs.current_card) {
                this.num_open_free_spaces += 1
            }
        })
    }

    count_open_bases() {
        this.num_open_bases = 0
        this.bases.forEach(b => {
            if (!b.current_card) {
                this.num_open_bases += 1
            }
        })
    }

    undo() {
        let last_move = this.moves.pop()
        this.move_index = this.moves.length
        if (last_move) {
            this.undone_moves.push(last_move)
            last_move.undo(this)
        }
    }

    redo() {
        if (this.undone_moves.length > 0) {
            let move = this.undone_moves.pop()
            this.moves.push(move)
            move.do(this)
        }
    }
}
