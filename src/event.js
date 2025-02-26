
import * as card from './card.js'
import * as free_space from './free_space.js'
import * as foundation from './foundation.js'
import * as base from './base.js'

export function add_listeners(g) {

    g.canvas.addEventListener('pointerdown', (e) => {
        if (e.button == 2) return // right mouse button
        if (e.button == 1) { // middle mouse button
            if (g.dragging_card) return
            e.preventDefault()
            
            auto_move_to_foundations(g)
            card.populate_selections(g)
            return
        }
        const mouseX = e.offsetX
        const mouseY = e.offsetY

        for (let i = g.cards.length - 1; i >= 0; i--) {
            let c = g.cards[i]
            if (
                mouseX > c.x && mouseX < c.x + c.width &&
                mouseY > c.y && mouseY < c.y + c.height &&
                c.selectable // found by population_selections
            ) {
                c.dragging = true
                if (c.stack_size) {
                    // console.log("stack size", c.stack_size)
                    // console.log("stack limit", g.stack_limit)
                }
                g.dragging_card = c
                g.offsetX = mouseX - c.x
                g.offsetY = mouseY - c.y
                c.move_to_end(g)
                break
            }
        }
    })
 
    g.canvas.addEventListener('pointermove', (e) => {
        g.cards.forEach(c => {
            if (c.dragging) {
                c.x = e.offsetX - g.offsetX
                c.y = e.offsetY - g.offsetY
            }
        })

        g.find_stack_limit()
        card.populate_selections(g)
        card.remove_deep_parents(g)
        card.find_hovering_card(g, e) //card to pick up

        // places to put the cards
        card.find_hovering_parent(g)
        free_space.find_hovering(g)
        foundation.find_hovering(g)
        base.find_hovering(g)
        pick_highlight(g) //choose from among the different drop site types
    })
    
    g.canvas.addEventListener('pointerup', (e) => {
        if (g.dragging_card) {
            if (g.closest_parent_card) {
                card.drop_onto_parent_card(g)
                // console.log("dropping onto parent")
            } else if (g.closest_free_space) {
                free_space.drop_onto_free_space(g)
                // console.log("dropping onto free space")
            } else if (g.closest_foundation) {
                foundation.drop_onto_foundation(g)
                // console.log("drogging onto foundation")
            } else if (g.closest_base) {
                base.drop_onto_base(g)
                // console.log("drogging onto base")
            }
            
            g.dragging_card.arrange_stack()
            g.dragging_card = null
            card.clear_dragging(g)
        }

        card.clear_highlights(g)
        free_space.clear_highlights(g)
        foundation.clear_highlights(g)
        base.clear_highlights(g)

        // auto_move_to_foundations(g)
        card.populate_selections(g)
        card.remove_deep_parents(g)
    })
}

function pick_highlight(g) {
    // choose among the different highlight types, only do one
    if (!g.dragging_card) return
    let d = g.dragging_card

    let is_parent = false
    if (d.card_over) is_parent = true

    let c_distance = null
    let fs_distance = null
    let fd_distance = null
    let b_distance = null

    if (g.closest_parent_card) {
        let c = g.closest_parent_card
        c_distance = Math.sqrt(Math.abs(c.x - d.x)**2 + Math.abs(c.y - d.y)**2)
    }
    if (g.closest_free_space && !is_parent) {
        let fs = g.closest_free_space
        fs_distance = Math.sqrt(Math.abs(fs.x - d.x)**2 + Math.abs(fs.y - d.y)**2)
    }
    if (g.closest_foundation && !is_parent) {
        let fd = g.closest_foundation
        fd_distance = Math.sqrt(Math.abs(fd.x - d.x)**2 + Math.abs(fd.y - d.y)**2)
    }
    if (g.closest_base) {
        let b = g.closest_base
        b_distance = Math.sqrt(Math.abs(b.x - d.x)**2 + Math.abs(b.y - d.y)**2)
    }

    let values = [c_distance, fs_distance, fd_distance, b_distance].filter(v => v !== null)
    let min_value = values.length > 0 ? Math.min(...values) : null
    
    if (!min_value) return

    if (c_distance == min_value) {
        foundation.clear_highlights(g)
        free_space.clear_highlights(g)
        base.clear_highlights(g)
    } else if (fs_distance == min_value) {
        card.clear_highlights(g)
        foundation.clear_highlights(g)
        base.clear_highlights(g)
    } else if (fd_distance == min_value) {
        card.clear_highlights(g)
        free_space.clear_highlights(g)
        base.clear_highlights(g)
    } else if (b_distance == min_value) {
        card.clear_highlights(g)
        foundation.clear_highlights(g)
        free_space.clear_highlights(g)
    }
}

function auto_move_to_foundations(g, limit = 0) {

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