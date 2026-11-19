// Between two steps of fake time the page needs a slice of real time for responses, cache reads,
// lazy chunks and renders. The pacing is not a guess at how long any of that takes: `done` is checked
// after every step, so the loop stops right after the awaited state, however long it took to arrive.
const PACE_MS = 25

// Advances timers faked with cy.clock() step by step until `done` holds.
export function tickUntil(done: () => boolean, description: string, stepMs = 250, remainingSteps = 400) {
    cy.then(() => {
        if (done()) return
        if (remainingSteps === 0) throw new Error(`Timed out advancing the clock until ${description}`)
        cy.tick(stepMs, { log: false })
        cy.wait(PACE_MS, { log: false })
        tickUntil(done, description, stepMs, remainingSteps - 1)
    })
}

export function pageText(window: Cypress.AUTWindow) {
    return window.document.body?.innerText ?? ''
}
