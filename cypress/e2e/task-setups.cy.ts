import { taskFixtures, publicTaskSetups } from '../../test-fixtures/tasks'

// Runs against the TEST_RUNNER build: /tasks/gear-task and /tasks/plain-task are served from test-fixtures/tasks.ts.
const DETAILS = '**/api/tasks/gear-task/setups/details'

// A syntactically valid, unexpired fake JWT (exp in the year 2100), see market-analysis.cy.ts.
const token =
    'eyJhbGciOiJub25lIn0.eyJzdWIiOiJjeXByZXNzLW1hcmtldC1hbmFseXNpcyIsImVtYWlsIjoibWFya2V0LWFuYWx5c2lzQGV4YW1wbGUuY29tIiwiZXhwIjo0MTAyNDQ0ODAwfQ==.signature'

const MID_UUID = 'a11ce5a11ce5a11ce5a11ce5a11ce5a1'
const DIRECT_UUID = 'b0d6e7b0d6e7b0d6e7b0d6e7b0d6e7b0'
const BASE_UUID = 'ba5eba5eba5eba5eba5eba5eba5eba5e'
// the sentinel of the locked tiers in test-fixtures/tasks.ts
const LEAK_UUID = '5ec2e7a15ec2e7a15ec2e7a15ec2e7a1'

const LOCKED_CELL = 'td[data-locked]'
const ROW = (name: string) => cy.contains('[data-cy="task-setups-table"] tbody tr', name)

// Distinct per tier, so a value in the page proves which tier it came from.
const BUDGET = { delta: '+210.0k', buy: '3.1M', resale: '2.7M', borrow: '420.0k', net50: '+10.1M' }
const MID_PREMIUM = { delta: '+350.0k', buy: '7.7M' }
const ENDGAME_PREMIUM = { delta: '-50.0k', buy: '88.0M', borrow: '18.0M' }

function item(overrides: Record<string, unknown>) {
    return { tradeable: true, buyPrice: 1000000, resaleValue: 900000, stability: 'stable', cv: 0.05, trendPerWeek: 0.01, volumePerDay: 120, ...overrides }
}

function premiumSetup(overrides: Record<string, unknown>): Record<string, unknown> {
    return { confidence: 'medium', assumptions: [], sources: [], locked: false, stability: 'stable', ...overrides }
}

const detailsFixture = {
    slug: 'gear-task',
    locked: false,
    baselineCoinsPerHour: 1500000,
    comparisonCoinsPerHour: 1500000,
    modifierEffects: [
        { changes: [{ component: 'tool.enchants.harvesting', from: '5', to: '6' }], players: 2, playersAtLeast: true, playersLabel: '2+', pairs: 3, ratio: 1.12, percentChange: 12.1 },
        { changes: [{ component: 'tool.reforge', from: null, to: 'fruitful' }], players: 6, playersAtLeast: false, playersLabel: '6', pairs: 8, ratio: 0.95, percentChange: -5 }
    ],
    baseline: premiumSetup({ id: 'baseline', name: 'Baseline gear', tier: 'baseline', status: 'baseline', coinsPerHour: 1500000, deltaCoinsPerHour: 0, items: [item({ slot: 'tool', itemTag: 'STONE_PICKAXE', itemName: 'Stone Pickaxe' })] }),
    setups: [
        premiumSetup({
            id: 'budget', name: 'Budget upgrade', tier: 'budget', status: 'upgrade', deltaCoinsPerHour: 210000, buyCost: 3130000, resaleValue: 2710000, borrowCost: 420000,
            paybackHoursBorrow: 2, paybackHoursFull: 14.9, netGain10h: 1680000, netGain50h: 10080000,
            items: [item({ slot: 'tool', itemTag: 'MITHRIL_PICKAXE', itemName: 'Mithril Pickaxe' })]
        }),
        // reached gear has costs but no payback
        premiumSetup({
            id: 'mid', name: 'Mid upgrade', tier: 'mid', status: 'reached', basis: 'measured', playersLabel: '3', hours: 40, confidence: 'low', statMedians: { mining_speed: 1234, mining_fortune: 410 }, deltaCoinsPerHour: 350000, buyCost: 7700000, resaleValue: 6900000, borrowCost: 800000, stability: 'moderate',
            items: [
                item({
                    slot: 'helmet', itemTag: 'MINER_HELMET', itemName: null, spec: { reforge: 'jaded', enchants: { growth: 7 } },
                    acquisition: { cost: 7700000, costSource: 'direct', direct: { price: 7700000, auctionUuid: MID_UUID, command: `/viewauction ${MID_UUID}` } }
                })
            ]
        }),
        // no profit gain: the delta is not positive and there is no payback
        premiumSetup({
            id: 'endgame', name: 'Endgame upgrade', tier: 'endgame', status: 'upgrade', noProfitGain: true, deltaCoinsPerHour: -50000, buyCost: 88000000, resaleValue: 70000000, borrowCost: 18000000,
            items: [
                item({ slot: 'tool', itemTag: 'DIVAN_DRILL', itemName: 'Divan Drill' }),
                item({ slot: 'pet', itemTag: 'SOULBOUND_PET', itemName: 'Soulbound Pet', tradeable: false, buyPrice: null, resaleValue: null })
            ]
        })
    ]
}

function visitSignedIn(path = '/tasks/gear-task') {
    cy.visit(path, {
        onBeforeLoad(window) {
            window.localStorage.setItem('googleId', token)
            window.sessionStorage.setItem('googleId', token)
        }
    })
}

function expectNoPageOverflow() {
    cy.window().then(win => expect(win.document.documentElement.scrollWidth, 'page scroll width').to.be.at.most(win.innerWidth))
}

describe('Task gear setups', () => {
    beforeEach(() => {
        cy.intercept('GET', /\/api\/tasks\/[^/]+\/setups$/, request => {
            const slug = new URL(request.url).pathname.split('/')[3]
            const body = taskFixtures.setups[slug]
            request.reply({ statusCode: body ? 200 : 404, body: body ?? { slug: 'task_not_found' } })
        }).as('publicSetups')
        cy.intercept('GET', '**/api/tasks/*/setups/details', { statusCode: 403, body: { slug: 'premium_required' } })
    })
    it('keeps all gear out of anonymous server HTML and serialized props', () => {
        cy.request('/tasks/gear-task').then(response => {
            const html: string = response.body
            expect(response.status).to.equal(200)
            ;['gear-setups', 'Baseline gear', 'Budget upgrade', 'DIVAN_DRILL', DIRECT_UUID, LEAK_UUID, 'leakedreforge', '987654321'].forEach(value => expect(html.includes(value), value).to.equal(false))
            expect(html).not.to.contain('data-locked="true"')
        })
    })

    it('shows three distinct progression cards and labels measured gear', () => {
        visitSignedIn()

        cy.get('[data-basis="measured"]').should('have.length', 1).and('contain.text', 'Measured · 2+ players · 14 h')
        cy.get('#gear-setups .card').should('have.length', 3)
        cy.get('#gear-setups .card h3').then(headings => expect(Array.from(headings, h => h.textContent)).to.deep.equal(['Early', 'Mid', 'Late']))
        cy.contains('.card', 'Budget upgrade').should('contain.text', 'Low confidence').and('not.contain.text', 'Medium confidence')
    })

    it('explains estimates and unmeasured modifiers on a supplied progression setup', () => {
        const budget = publicTaskSetups.setups[0]
        cy.intercept('GET', '**/api/tasks/gear-task/setups', {
            statusCode: 200,
            body: { ...publicTaskSetups, setups: [{ ...budget, basis: 'estimate', items: budget.items.map(item => ({ ...item, modifiersMeasured: false })) }] }
        })
        visitSignedIn()

        cy.get('[data-basis="estimate"]').should('have.text', 'Estimate').trigger('mouseover')
        cy.contains('Not enough player data yet, modelled from stats').should('be.visible')
        cy.get('[data-cy="item-acquisition"]').should('contain.text', 'modifiers not measured')
    })

    it('copies the view auction command of the buy now button', () => {
        cy.visit('/tasks/gear-task', {
            onBeforeLoad(window) {
                window.localStorage.setItem('googleId', token)
                window.sessionStorage.setItem('googleId', token)
                Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: cy.stub().as('copy').resolves() } })
            }
        })

        cy.get('[data-cy="buy-now"]').should('contain.text', 'Buy now: 3.1M').find('button').click()
        cy.get('@copy').should('have.been.calledOnceWithExactly', `/viewauction ${DIRECT_UUID}`)
    })

    it('shows spec, the cheapest base breakdown, grinding and incomplete prices', () => {
        visitSignedIn()

        cy.contains('[data-cy="item-acquisition"]', 'Harvesting 6, Cultivating 10').should('contain.text', 'Fruitful · 5★ · 10 HPB')
        cy.get('[data-cy="cheapest-base"]').should('contain.text', 'Cheapest base: 2.0M + upgrades = 2.7M')
        cy.get('[data-cy="upgrade-list"] summary').click()
        cy.get('[data-cy="upgrade-list"]').should('contain.text', 'Harvesting 4 → 6: 450.0k').and('contain.text', 'price unavailable')
        cy.get('[data-cy="grind-required"]').should('contain.text', 'needs grinding: Farmed Cultivating (have 1000 / need 5000)')
        cy.get('[data-cy="cheapest-base"]').should('contain.text', 'price incomplete')
    })

    it('copies the base auction command and has no page overflow on a phone', () => {
        cy.viewport(390, 844)
        cy.visit('/tasks/gear-task', {
            onBeforeLoad(window) {
                window.localStorage.setItem('googleId', token)
                window.sessionStorage.setItem('googleId', token)
                Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: cy.stub().as('copy').resolves() } })
            }
        })

        cy.get('[data-cy="cheapest-base"] button').click()
        cy.get('@copy').should('have.been.calledOnceWithExactly', `/viewauction ${BASE_UUID}`)
        expectNoPageOverflow()
    })

    it('renders stat medians and the modifier effects from the premium details', () => {
        cy.intercept('GET', DETAILS, { statusCode: 200, body: detailsFixture }).as('details')
        visitSignedIn()

        cy.wait('@details')
        cy.get('[data-cy="modifier-effects"]').should('contain.text', 'What upgrades changed for players')
        cy.contains('li', 'Harvesting 5 → 6: +12% coins/h (2+ players)').should('be.visible')
        cy.contains('li', 'Tool reforge none → Fruitful: -5% coins/h (6 players)').should('be.visible')
        cy.get('[data-cy="stat-medians"]').should('contain.text', 'Mid upgrade').and('contain.text', 'Mining Speed 1,234')
        // the locked tier opens with its gear, prettified tag for the nameless measured item and the buy button
        cy.get('[data-cy="premium-tier-details"]').contains('Mid upgrade').should('be.visible')
        cy.get('[data-cy="premium-tier-details"]').should('contain.text', 'Miner Helmet').and('contain.text', 'Measured · 3 players · 40 h')
        cy.get('[data-cy="premium-tier-details"] [data-cy="buy-now"]').should('contain.text', 'Buy now: 7.7M')
    })

    it('shows premium mid details with low confidence and the comparison reference', () => {
        cy.intercept('GET', DETAILS, { statusCode: 200, body: detailsFixture }).as('details')
        visitSignedIn()

        cy.wait('@details')
        cy.get('[data-cy="premium-tier-details"]').contains('Mid upgrade').parent().should('contain.text', 'Low confidence')
        cy.get('[data-cy="comparison-note"]').should('contain.text', 'relative to the community average (1.5M coins/h)')
    })

    it('shows a community average row and a lower bound note without a baseline', () => {
        cy.request('/tasks/community-task').then(response => {
            expect(response.body).not.to.contain('Community average')
            expect(response.body).not.to.contain('≥ 4.2M')
            expect(response.body).not.to.contain(LEAK_UUID)
        })
        visitSignedIn('/tasks/community-task')

        ROW('Community average').contains('1.5M coins/h').should('exist')
        ROW('Community average').find(LOCKED_CELL).should('not.exist')
        ROW('Budget upgrade').contains('≥ 4.2M').should('be.visible')
        ROW('Mid upgrade').should('not.exist')
        cy.get('[data-cy="lower-bound-note"]').scrollIntoView().should('be.visible')
        cy.get('[data-cy="lower-bound"]').should('contain.text', 'lower bound')
        cy.get('[data-cy="cheapest-base"]').should('contain.text', '≥ 4.2M')
        cy.get('[data-cy="grind-required"]').should('contain.text', 'have 10 / need 90')
    })

    it('renders only the tiers that exist', () => {
        visitSignedIn('/tasks/sparse-task')

        cy.get('[data-cy="task-setups-table"] tbody tr').should('have.length', 2)
        ROW('Baseline gear').should('exist')
        ROW('Endgame upgrade').find(LOCKED_CELL).should('have.length', 9)
        cy.contains('Budget upgrade').should('not.exist')
        cy.contains('Mid upgrade').should('not.exist')
        cy.get('[data-cy="premium-gate"] summary').click()
        cy.contains('Endgame numbers require Premium').should('be.visible')
        cy.get('#gear-setups .card').should('have.length', 2)
        cy.get('#gear-setups .card h3').then(headings => expect(Array.from(headings, h => h.textContent)).to.deep.equal(['Early', 'Late']))
    })

    it('labels the buttons with the item and says Premium only once per locked row', () => {
        visitSignedIn()

        cy.get('[data-cy="buy-now"] button').should('have.attr', 'aria-label', 'View auction of Mithril Pickaxe')
        cy.get('[data-cy="cheapest-base"] button').should('have.attr', 'aria-label', 'View base of Mithril Pickaxe')
        ROW('Mid upgrade').find('.visually-hidden').should('have.length', 1).and('have.text', 'Premium only')
        ROW('Mid upgrade').find(LOCKED_CELL).should('have.length', 9)
        cy.get('[data-cy="task-setups-table"] tbody th').first().should('have.css', 'z-index', '1')
    })

    it('shows an error toast instead of Copied when the clipboard rejects', () => {
        cy.visit('/tasks/gear-task', {
            onBeforeLoad(window) {
                window.localStorage.setItem('googleId', token)
                window.sessionStorage.setItem('googleId', token)
                Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: cy.stub().as('copy').rejects(new Error('denied')) } })
            }
        })

        cy.get('[data-cy="buy-now"] button').click()
        cy.get('@copy').should('have.been.calledOnce')
        cy.get('.Toastify__toast').should('contain.text', `Couldn't copy, command: /viewauction ${DIRECT_UUID}`)
        cy.contains('Copied ingame link').should('not.exist')
    })

    it('renders nothing for an empty acquisition', () => {
        const emptied = {
            ...detailsFixture,
            setups: detailsFixture.setups.map(s =>
                s.id === 'mid' ? { ...s, items: [item({ slot: 'helmet', itemTag: 'MINER_HELMET', itemName: 'Miner Helmet', acquisition: {} })] } : s
            )
        }
        cy.intercept('GET', DETAILS, { statusCode: 200, body: emptied }).as('details')
        visitSignedIn()

        cy.wait('@details')
        cy.get('[data-cy="premium-tier-details"]').should('contain.text', 'Miner Helmet')
        cy.get('[data-cy="premium-tier-details"] [data-cy="item-acquisition"]').should('not.exist')
    })

    it('asks to sign in again after a 401 and keeps the free numbers', () => {
        cy.intercept('GET', DETAILS, { statusCode: 401, body: { slug: 'invalid_token', message: 'x', trace: null } }).as('details')
        visitSignedIn()

        cy.wait('@details')
        cy.get('[data-cy="premium-gate"] summary').click()
        cy.get('[data-cy="task-setups-premium"]').contains(/sign in/i).should('be.visible')
        cy.contains('Go to Premium').should('not.exist')
        ROW('Budget upgrade').contains(BUDGET.buy).should('be.visible')
        ROW('Mid upgrade').find(LOCKED_CELL).should('have.length', 9)
    })

    it('shows an error alert for a 500 and keeps the free numbers', () => {
        cy.intercept('GET', DETAILS, { statusCode: 500, body: { slug: 'boom', message: 'x', trace: null } }).as('details')
        visitSignedIn()

        cy.wait('@details')
        cy.contains('The premium numbers could not be loaded').should('be.visible')
        cy.contains('Go to Premium').should('not.exist')
        cy.get('[data-cy="task-setups-premium"]').contains(/sign in/i).should('not.exist')
        ROW('Budget upgrade').contains(BUDGET.buy).should('be.visible')
    })

    it('does not mount the sign-in while the details load', () => {
        cy.intercept('GET', DETAILS, req => req.reply({ delay: 1500, statusCode: 200, body: detailsFixture })).as('details')
        visitSignedIn()

        cy.get('[data-cy="task-setups-premium"]').find('[role="status"]').should('exist')
        cy.get('[data-cy="task-setups-premium"]').contains(/sign in/i).should('not.exist')
        cy.contains('Go to Premium').should('not.exist')
        cy.wait('@details')
        ROW('Mid upgrade').contains(MID_PREMIUM.buy).should('be.visible')
    })

    it('hides the entire section for anonymous users without fetching gear or showing a gate', () => {
        cy.intercept('GET', '**/api/tasks/*/setups/details', cy.spy().as('details'))
        cy.visit('/tasks/gear-task')

        cy.contains('h1', 'Gear Task').should('be.visible')
        cy.get('#gear-setups').should('not.exist')
        cy.get('[data-cy="premium-gate"]').should('not.exist')
        cy.get('@publicSetups.all').should('have.length', 0)
        cy.get('@details').should('not.have.been.called')
    })

    it('shows public gear after login and removes it after logout', () => {
        cy.visit('/tasks/gear-task')
        cy.get('#gear-setups').should('not.exist')
        cy.window().then(window => {
            window.localStorage.setItem('googleId', token)
            window.sessionStorage.setItem('googleId', token)
            window.document.dispatchEvent(new CustomEvent('googleLogin'))
        })
        cy.wait('@publicSetups')
        cy.get('#gear-setups .card').should('have.length', 3)
        cy.window().then(window => {
            window.localStorage.removeItem('googleId')
            window.sessionStorage.removeItem('googleId')
            window.document.dispatchEvent(new CustomEvent('googleLogin'))
        })
        cy.get('#gear-setups').should('not.exist')
        cy.get('[data-cy="premium-gate"]').should('not.exist')
    })

    it('shows two real options as Early and Late and keeps the baseline only in the table', () => {
        cy.intercept('GET', '**/api/tasks/gear-task/setups', {
            statusCode: 200,
            body: { ...publicTaskSetups, setups: [publicTaskSetups.setups[0], publicTaskSetups.setups[2]] }
        })
        visitSignedIn()

        cy.get('#gear-setups .card').should('have.length', 2)
        cy.get('#gear-setups .card h3').then(headings => expect(Array.from(headings, h => h.textContent)).to.deep.equal(['Early', 'Late']))
        cy.get('#gear-setups .card').should('not.contain.text', 'Baseline gear')
        cy.get('#gear-setups .card').should('not.contain.text', 'Mid upgrade')
        ROW('Baseline gear').should('contain.text', '1.5M coins/h')
    })

    it('loads the single real kit from Premium+ details when public gear is only a bare locked placeholder', () => {
        cy.intercept('GET', '**/api/tasks/gear-task/setups', {
            statusCode: 200,
            body: { slug: 'gear-task', baseline: { items: [] }, setups: [{ id: 'locked-endgame', tier: 'endgame', locked: true, requiredTier: 'premium_plus', items: [] }] }
        })
        cy.intercept('GET', DETAILS, { statusCode: 200, body: { ...detailsFixture, baseline: null, setups: [detailsFixture.setups[2]] } }).as('details')
        visitSignedIn()

        cy.wait('@details').its('request.headers').should('have.property', 'googletoken', token)
        cy.get('#gear-setups .card').should('have.length', 1).and('contain.text', 'Divan Drill')
        cy.get('#gear-setups .card h3').should('have.text', 'Recommended')
        cy.get('[data-cy="premium-gate"]').should('not.exist')
        cy.get('@details.all').should('have.length', 1)
    })

    it('shows lower M3 gear as the Early starting option before the Late M7 upgrade', () => {
        const starting = premiumSetup({ id: 'mid', name: 'M3 setup', tier: 'mid', status: 'reached', unlocksTask: 'catacombs-master-floor-3', items: [item({ slot: 'weapon', itemTag: 'GIANTS_SWORD', itemName: "Giant's Sword" })] })
        const upgrade = premiumSetup({ id: 'endgame', name: 'M7 setup', tier: 'endgame', status: 'upgrade', unlocksTask: 'gear-task', items: [item({ slot: 'weapon', itemTag: 'HYPERION', itemName: 'Hyperion' })] })
        cy.intercept('GET', '**/api/tasks/gear-task/setups', {
            statusCode: 200,
            body: { slug: 'gear-task', taskName: 'Master Mode Floor VII', setups: [{ ...starting, locked: true }, { id: 'locked-endgame', tier: 'endgame', locked: true, requiredTier: 'premium_plus', items: [] }] }
        })
        cy.intercept('GET', DETAILS, { statusCode: 200, body: { slug: 'gear-task', setups: [starting, upgrade] } }).as('details')
        visitSignedIn()

        cy.wait('@details')
        cy.get('#gear-setups .card').should('have.length', 2)
        cy.get('#gear-setups .card').first().should('contain.text', 'Early').and('contain.text', 'M3 setup').and('contain.text', 'Starting gear').and('not.contain.text', 'Typical gear for this or a lower tier')
        cy.get('#gear-setups .card').last().should('contain.text', 'Late').and('contain.text', 'M7 setup').and('contain.text', 'Hyperion').and('not.contain.text', 'Starting gear')
    })

    it('keeps a bare endgame placeholder out of progression cards and routes its gate to Premium+', () => {
        cy.intercept('GET', '**/api/tasks/gear-task/setups', {
            statusCode: 200,
            body: { slug: 'gear-task', setups: [{ id: 'locked-endgame', tier: 'endgame', locked: true, requiredTier: 'premium_plus', items: [] }] }
        })
        visitSignedIn()

        cy.get('[data-cy="premium-gate"] summary').click()
        cy.get('#gear-setups .card').should('not.exist')
        cy.get('[data-cy="premium-gate"]').should('contain.text', 'Premium+')
        cy.contains('Go to Premium').should('have.attr', 'href', '/premium?tier=premium_plus')
    })

    it('shows real baseline gear as Recommended when there are no alternative setups', () => {
        cy.intercept('GET', '**/api/tasks/gear-task/setups', { statusCode: 200, body: { ...publicTaskSetups, setups: [] } })
        cy.intercept('GET', DETAILS, cy.spy().as('details'))
        visitSignedIn()

        cy.get('#gear-setups .card').should('have.length', 1).and('contain.text', 'Stone Pickaxe')
        cy.get('#gear-setups .card h3').should('have.text', 'Recommended')
        ROW('Baseline gear').should('contain.text', '1.5M coins/h')
        cy.get('@details').should('not.have.been.called')
    })

    it('retains authorized mid details from a partial Premium response while endgame stays locked', () => {
        const placeholder = { id: 'locked-endgame', tier: 'endgame', locked: true, requiredTier: 'premium_plus', items: [] }
        cy.intercept('GET', '**/api/tasks/gear-task/setups', { statusCode: 200, body: { ...publicTaskSetups, setups: [...publicTaskSetups.setups.slice(0, 2), placeholder] } })
        cy.intercept('GET', DETAILS, { statusCode: 200, body: { ...detailsFixture, locked: true, setups: [...detailsFixture.setups.slice(0, 2), placeholder] } }).as('details')
        visitSignedIn()

        cy.wait('@details')
        ROW('Mid upgrade').should('contain.text', MID_PREMIUM.buy)
        ROW('endgame').find(LOCKED_CELL).should('have.length', 9)
        cy.get('#gear-setups .card').should('have.length', 2)
        cy.get('#gear-setups .card').should('contain.text', 'Miner Helmet').and('not.contain.text', 'Divan Drill')
        cy.get('[data-cy="stat-medians"]').should('contain.text', 'Mining Speed 1,234')
        cy.get('[data-cy="premium-gate"] summary').click()
        cy.get('[data-cy="premium-gate"]').should('contain.text', 'Endgame gear require').and('contain.text', 'Premium+')
        cy.contains('Go to Premium').should('have.attr', 'href', '/premium?tier=premium_plus')
        cy.get('@details.all').should('have.length', 1)
    })

    it('shows the Go to Premium gate for a 403 and keeps the free numbers', () => {
        cy.intercept('GET', DETAILS, { statusCode: 403, body: { slug: 'premium_required', message: 'x', trace: null } }).as('details')
        visitSignedIn()

        cy.wait('@details').its('request.headers').should('have.property', 'googletoken', token)
        cy.contains('Go to Premium').should('not.be.visible')
        cy.get('[data-cy="premium-gate"] summary').click()
        cy.contains('Go to Premium').should('be.visible')
        cy.contains('Go to Premium').should('have.attr', 'href', '/premium?tier=premium')
        cy.get('[data-cy="premium-gate"] summary').click()
        cy.contains('Go to Premium').should('not.be.visible')
        cy.get('@details.all').should('have.length', 1)
        ROW('Budget upgrade').contains(BUDGET.buy).should('be.visible')
        ROW('Mid upgrade').find(LOCKED_CELL).should('have.length', 9)
    })

    it('fills mid and endgame with the premium numbers, without touching the login', () => {
        const termsRequests = cy.spy().as('terms')
        cy.intercept('GET', '**/api/user/terms*', termsRequests)
        cy.intercept('GET', DETAILS, { statusCode: 200, body: detailsFixture }).as('details')
        visitSignedIn()

        cy.wait('@details')
        ROW('Mid upgrade').contains(MID_PREMIUM.buy).should('be.visible')
        ROW('Mid upgrade').contains(MID_PREMIUM.delta).should('be.visible')
        ROW('Endgame upgrade').contains(ENDGAME_PREMIUM.buy).should('be.visible')
        ROW('Endgame upgrade').contains(ENDGAME_PREMIUM.delta).should('be.visible')
        ROW('Endgame upgrade').contains('No extra profit on this task').should('exist')
        cy.get(LOCKED_CELL).should('not.exist')
        cy.contains('Go to Premium').should('not.exist')
        cy.contains('numbers require').should('not.exist')
        cy.get('.Toastify__toast').should('not.exist')
        cy.get('@terms').should('not.have.been.called')
    })

    it('shows reached without payback, price unavailable and untradeable items', () => {
        const withMissingPrice = {
            ...detailsFixture,
            setups: detailsFixture.setups.map(s => (s.id === 'endgame' ? { ...s, noProfitGain: false, priceIncomplete: true, buyCost: null, resaleValue: null, borrowCost: null } : s))
        }
        cy.intercept('GET', DETAILS, { statusCode: 200, body: withMissingPrice }).as('details')
        visitSignedIn()

        cy.wait('@details')
        ROW('Mid upgrade').contains(MID_PREMIUM.buy).should('be.visible')
        ROW('Mid upgrade').find('td').filter(':contains("–")').should('have.length.at.least', 4)
        ROW('Endgame upgrade').contains('Price unavailable').should('be.visible')
        cy.contains('summary', 'Endgame upgrade').click()
        cy.contains('Not sellable on the market').should('be.visible')
    })

    it('explains long payback only for the setup flagged by the API', () => {
        const withLongPayback = {
            ...detailsFixture,
            setups: detailsFixture.setups.map(s => (s.id === 'endgame' ? { ...s, noProfitGain: false, paybackTooLong: true } : s))
        }
        cy.intercept('GET', DETAILS, { statusCode: 200, body: withLongPayback }).as('details')
        visitSignedIn()

        cy.wait('@details')
        ROW('Endgame upgrade').contains('Full buy cost takes more than 150 hours to recover').scrollIntoView().should('be.visible')
        ROW('Budget upgrade').should('not.contain.text', '150 hours')
        ROW('Mid upgrade').should('not.contain.text', '150 hours')
    })

    it('shows the borrow cost explanation and the item breakdown of a free tier', () => {
        visitSignedIn()

        cy.contains('Borrow cost: you buy the gear now and sell it back later').should('be.visible')
        cy.contains('summary', 'Budget upgrade').click()
        cy.contains('Volatility (CV)').should('be.visible')
        cy.contains('5.0%').should('be.visible')
        cy.contains('summary', 'Mid upgrade').should('not.exist')
    })

    it('scrolls the table sideways on a phone without scrolling the page', () => {
        cy.viewport(390, 844)
        visitSignedIn()

        cy.get('[data-cy="task-setups-table"]').parent().should('have.class', 'table-responsive').then($wrapper => {
            const wrapper = $wrapper[0]
            expect(wrapper.scrollWidth, 'table wider than its wrapper').to.be.greaterThan(wrapper.clientWidth)
            wrapper.scrollLeft = wrapper.scrollWidth
            expect(wrapper.scrollLeft, 'wrapper scrolls').to.be.greaterThan(0)
        })
        cy.contains('th', 'Net gain 50h').should('be.visible')
        expectNoPageOverflow()
    })

    it('hides the section when the task has no setups', () => {
        visitSignedIn('/tasks/plain-task')

        cy.contains('h1', 'Plain Task').should('be.visible')
        cy.contains('Gear setups').should('not.exist')
        cy.get('[data-cy="task-setups-premium"]').should('not.exist')
    })
})
