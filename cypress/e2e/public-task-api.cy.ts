import { getPublicTask, getPublicTasks, getPublicTaskSetups, normalizeSetups, type PublicTask } from '../../api/publicTaskApi'
import { isUnavailableAt } from '../../components/Tasks/taskUtils'

type Answer = { body: string; status: number; contentType?: string }

function answerTaskRequestsWith(answer: Answer) {
    const realFetch = globalThis.fetch
    return cy.stub(globalThis, 'fetch').callsFake((input: RequestInfo | URL, init?: RequestInit) =>
        String(input).includes('/api/tasks')
            ? Promise.resolve(new Response(answer.body, { status: answer.status, headers: { 'content-type': answer.contentType ?? 'application/json' } }))
            : realFetch(input, init)
    )
}

function task(overrides: Record<string, unknown> = {}) {
    return { slug: 'mining', name: 'Mining', category: 'Mining', coinsPerHour: 1, ...overrides }
}

const unknownTaskBody = JSON.stringify({ slug: 'task_not_found', message: 'No task with slug nope', trace: null })

describe('Public task api', () => {
    it('reports an unknown slug as not found', () => {
        answerTaskRequestsWith({ body: unknownTaskBody, status: 404 })

        cy.wrap(null)
            .then(() => getPublicTask('nope'))
            .then(result => expect(result).to.deep.equal({ status: 'notFound' }))
    })

    it('treats a 404 without the task_not_found slug as an outage', () => {
        answerTaskRequestsWith({ body: '<html>404 page not found</html>', status: 404, contentType: 'text/html' })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => expect(result).to.deep.equal({ status: 'error' }))
    })

    it('treats a 404 with another error slug as an outage', () => {
        answerTaskRequestsWith({ body: JSON.stringify({ slug: 'route_not_found' }), status: 404 })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => expect(result).to.deep.equal({ status: 'error' }))
    })

    it('reports an unavailable estimator as an error', () => {
        answerTaskRequestsWith({ body: JSON.stringify({ slug: 'tasks_unavailable', message: 'x', trace: null }), status: 503 })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => expect(result).to.deep.equal({ status: 'error' }))
    })

    it('keeps only https wiki links', () => {
        const body = task({ wikiUrl: 'https://wiki.hypixel.net/Mining', whereWikiUrl: 'javascript:alert(1)' })
        answerTaskRequestsWith({ body: JSON.stringify(body), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => {
                expect(result.status).to.equal('ok')
                const loaded = result.status === 'ok' ? result.task : undefined
                expect(loaded?.wikiUrl).to.equal('https://wiki.hypixel.net/Mining')
                expect(loaded?.whereWikiUrl).to.equal(undefined)
            })
    })

    it('drops plain http wiki links', () => {
        answerTaskRequestsWith({ body: JSON.stringify(task({ wikiUrl: 'http://wiki.hypixel.net/Mining' })), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => expect(result.status === 'ok' && result.task.wikiUrl).to.equal(undefined))
    })

    it('encodes the slug and asks for a cached response with a timeout', () => {
        const fetchStub = answerTaskRequestsWith({ body: JSON.stringify(task()), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTask('a/../b'))
            .then(() => {
                const [url, init] = fetchStub.firstCall.args as [string, RequestInit]
                expect(url).to.equal('https://sky.coflnet.com/api/tasks/a%2F..%2Fb')
                expect(init.next).to.deep.equal({ revalidate: 600 })
                expect(init.signal).to.be.instanceOf(AbortSignal)
            })
    })

    it('sorts the task list by coins per hour, best first', () => {
        const body = [task({ slug: 'low', coinsPerHour: 5 }), task({ slug: 'high', coinsPerHour: 50 }), task({ slug: 'mid', coinsPerHour: 20 })]
        answerTaskRequestsWith({ body: JSON.stringify(body), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTasks())
            .then(tasks => expect(tasks?.map(t => t.slug)).to.deep.equal(['high', 'mid', 'low']))
    })

    it('asks for unavailable tasks only when told to', () => {
        const fetchStub = answerTaskRequestsWith({ body: JSON.stringify([task()]), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTasks())
            .then(() => getPublicTasks({ includeUnavailable: true }))
            .then(() => {
                expect(String(fetchStub.firstCall.args[0])).to.equal('https://sky.coflnet.com/api/tasks')
                expect(String(fetchStub.secondCall.args[0])).to.equal('https://sky.coflnet.com/api/tasks?includeUnavailable=true')
            })
    })

    it('treats a task without the available flag as available', () => {
        const body = [task({ slug: 'old' }), task({ slug: 'off', available: false, availabilityNote: 'Only during the Spooky Festival' })]
        answerTaskRequestsWith({ body: JSON.stringify(body), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTasks({ includeUnavailable: true }))
            .then(tasks => expect(tasks?.map(t => [t.slug, t.available])).to.deep.equal([['old', true], ['off', false]]))
    })

    it('stops calling a task unavailable once its event started by schedule', () => {
        const now = new Date('2026-12-01T00:00:01Z')
        const unavailable = (available: boolean, nextAvailableAt?: string) => isUnavailableAt({ available, nextAvailableAt } as PublicTask, now)

        expect(unavailable(true)).to.equal(false)
        expect(unavailable(false)).to.equal(true)
        expect(unavailable(false, '2026-12-01T00:00:02Z')).to.equal(true)
        expect(unavailable(false, '2026-12-01T00:00:00Z')).to.equal(false)
    })

    it('returns no list when the estimator is unavailable', () => {
        answerTaskRequestsWith({ body: JSON.stringify({ slug: 'tasks_unavailable' }), status: 503 })

        cy.wrap(null)
            .then(() => getPublicTasks())
            .then(tasks => expect(tasks).to.equal(null))
    })

    it('returns no list when a 200 body is not JSON', () => {
        answerTaskRequestsWith({ body: '<html>maintenance</html>', status: 200, contentType: 'text/html' })

        cy.wrap(null)
            .then(() => getPublicTasks())
            .then(tasks => expect(tasks).to.equal(null))
    })

    it('reports a task whose 200 body is not JSON as an error', () => {
        answerTaskRequestsWith({ body: '<html>maintenance</html>', status: 200, contentType: 'text/html' })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => expect(result).to.deep.equal({ status: 'error' }))
    })

    it('drops list entries without a usable slug', () => {
        const body = [task({ slug: 'kept' }), task({ slug: undefined }), task({ slug: '' }), task({ slug: 42 }), task({ slug: null })]
        answerTaskRequestsWith({ body: JSON.stringify(body), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTasks())
            .then(tasks => expect(tasks?.map(t => t.slug)).to.deep.equal(['kept']))
    })

    it('removes steps without text', () => {
        const steps = [{ number: 1, text: 'Warp to the mines' }, { number: 2, text: null }, { number: 3, text: '' }, { number: 4 }]
        answerTaskRequestsWith({ body: JSON.stringify(task({ steps })), status: 200 })

        cy.wrap(null)
            .then(() => getPublicTask('mining'))
            .then(result => expect(result.status === 'ok' && result.task.steps).to.deep.equal([{ number: 1, text: 'Warp to the mines' }]))
    })

    describe('gear setups', () => {
        const setup = (overrides: Record<string, unknown> = {}) => ({
            id: 'budget',
            name: 'Budget',
            status: 'upgrade',
            items: [{ itemTag: 'MITHRIL_PICKAXE', tradeable: true }],
            ...overrides
        })

        it('keeps only https sources and items with a tag', () => {
            const body = {
                locked: true,
                setups: [
                    setup({
                        sources: ['https://wiki.hypixel.net/Mining', 'http://example.com', 'javascript:alert(1)', 42],
                        items: [{ itemTag: 'A', tradeable: true }, { itemName: 'No tag', tradeable: true }]
                    })
                ]
            }
            const result = normalizeSetups(body)

            expect(result?.setups[0].sources).to.deep.equal(['https://wiki.hypixel.net/Mining'])
            expect(result?.setups[0].items.map(i => i.itemTag)).to.deep.equal(['A'])
            expect(result?.setups[0].assumptions).to.deep.equal([])
        })

        it('keeps the numbers of unlocked setups and strips them from locked ones', () => {
            const numbers = { coinsPerHour: 5, buyCost: 7, noProfitGain: false, paybackTooLong: true, unknownField: 'x' }
            const result = normalizeSetups({
                locked: true,
                setups: [
                    setup({ id: 'free', locked: false, ...numbers, items: [{ itemTag: 'A', tradeable: true, buyPrice: 3 }] }),
                    setup({ id: 'paid', locked: true, ...numbers, items: [{ itemTag: 'B', tradeable: true, buyPrice: 4 }] }),
                    setup({ id: 'unknown', ...numbers, items: [{ itemTag: 'C', tradeable: true, buyPrice: 5 }] })
                ]
            })

            const [free, paid, unknown] = result?.setups ?? []
            expect(free.locked).to.equal(false)
            expect(free.buyCost).to.equal(7)
            expect(free.paybackTooLong).to.equal(true)
            expect(free.items[0].buyPrice).to.equal(3)
            expect(free).not.to.have.property('unknownField')
            ;[paid, unknown].forEach(locked => {
                expect(locked.locked).to.equal(true)
                expect(locked.coinsPerHour).to.equal(undefined)
                expect(locked.buyCost).to.equal(undefined)
                expect(locked).not.to.have.property('paybackTooLong')
                expect(locked.items[0].buyPrice).to.equal(undefined)
            })
            expect(result?.locked).to.equal(true)
        })

        it('keeps basis, spec and acquisition of unlocked setups and strips them from locked ones', () => {
            const acquisition = {
                cost: 5,
                direct: { price: 5, auctionUuid: 'abcdef0123456789abcdef0123456789', command: '/viewauction abcdef0123456789abcdef0123456789' },
                cheapestBase: { basePrice: 2, total: 4, incomplete: false, command: '/viewauction abcdef0123456789abcdef0123456789', upgrades: null }
            }
            const measured = { basis: 'measured', playersLabel: '2+', hours: 14, statMedians: { farming_fortune: 1 } }
            const items = [{ itemTag: 'A', tradeable: true, spec: { stars: 5 }, acquisition, modifiersMeasured: false }]
            const result = normalizeSetups(
                {
                    locked: false,
                    setups: [setup({ id: 'free', locked: false, ...measured, items }), setup({ id: 'paid', locked: true, ...measured, items })]
                },
                { details: true }
            )

            const [free, paid] = result?.setups ?? []
            expect(free.basis).to.equal('measured')
            expect(free.playersLabel).to.equal('2+')
            expect(free.statMedians).to.deep.equal({ farming_fortune: 1 })
            expect(free.items[0].spec?.stars).to.equal(5)
            expect(free.items[0].modifiersMeasured).to.equal(false)
            expect(free.items[0].acquisition?.cheapestBase?.upgrades).to.deep.equal([])
            ;['basis', 'playersLabel', 'hours', 'statMedians'].forEach(key => expect(paid, key).not.to.have.property(key))
            expect(paid.items[0].acquisition).to.equal(undefined)
            expect(paid.items[0].spec).to.equal(undefined)
        })

        it('keeps the modifier effects of a fully unlocked response and drops malformed ones', () => {
            const effects = [{ changes: [{ component: 'tool', from: 'a', to: 'b' }], percentChange: 12 }, { changes: [], percentChange: 1 }, { percentChange: 2 }]
            const result = normalizeSetups({ locked: false, modifierEffects: effects, category: 'Mining', setups: [setup({ locked: false })] }, { details: true })

            expect(result?.modifierEffects).to.have.length(1)
            expect(result?.category).to.equal('Mining')
        })

        it('keeps the community rates without a baseline and the lower bound flag only of unlocked setups', () => {
            const items = [{ itemTag: 'A', tradeable: true, buyPrice: 5, priceLowerBound: true }]
            const result = normalizeSetups({
                locked: true,
                baseline: null,
                baselineCoinsPerHour: 100,
                comparisonCoinsPerHour: 90,
                setups: [setup({ id: 'free', locked: false, priceLowerBound: true, items }), setup({ id: 'paid', locked: true, priceLowerBound: true, items })]
            })

            expect(result?.baseline).to.equal(undefined)
            expect(result?.baselineCoinsPerHour).to.equal(100)
            expect(result?.comparisonCoinsPerHour).to.equal(90)
            const [free, paid] = result?.setups ?? []
            expect(free.priceLowerBound).to.equal(true)
            expect(free.items[0].priceLowerBound).to.equal(true)
            expect(paid).not.to.have.property('priceLowerBound')
            expect(paid.items[0]).not.to.have.property('priceLowerBound')
        })

        it('hides the rates when the baseline is locked', () => {
            const result = normalizeSetups({ locked: true, baselineCoinsPerHour: 100, comparisonCoinsPerHour: 90, baseline: setup({ id: 'baseline', locked: true }) })

            expect(result?.baselineCoinsPerHour).to.equal(undefined)
            expect(result?.comparisonCoinsPerHour).to.equal(undefined)
        })

        it('drops stat medians and modifier effects unless the details are asked for', () => {
            const body = {
                locked: false,
                modifierEffects: [{ changes: [{ component: 'tool', from: 'a', to: 'b' }], percentChange: 12 }],
                setups: [setup({ locked: false, statMedians: { mining_speed: 5 } })]
            }

            const publicResult = normalizeSetups(body)
            expect(publicResult?.modifierEffects).to.equal(undefined)
            expect(publicResult?.setups[0]).not.to.have.property('statMedians')
            expect(normalizeSetups(body, { details: false })?.modifierEffects).to.equal(undefined)
            expect(normalizeSetups(body, { details: true })?.setups[0].statMedians).to.deep.equal({ mining_speed: 5 })
        })

        it('copies only known fields down to acquisition and spec', () => {
            const uuid = 'abcdef01-2345-6789-abcd-ef0123456789'
            const item = {
                itemTag: 'A',
                tradeable: true,
                spec: {
                    stars: 5,
                    rarity: { nested: 'x' },
                    unknownField: 'x',
                    enchants: { harvesting: 6, bad: 'x', worse: { a: 1 } },
                    gems: { slot: 'RUBY', bad: 3 },
                    stats: 'not a record'
                },
                acquisition: {
                    cost: 1,
                    unknownField: 'x',
                    direct: { price: 1, command: `/viewauction ${uuid}`, unknownField: 'x', auctionUuid: { a: 1 } },
                    cheapestBase: {
                        basePrice: 1,
                        total: 2,
                        unknownField: 'x',
                        incomplete: false,
                        upgrades: [{ kind: 'enchant', name: 'x', amount: 1, cost: 1, priced: true, unknownField: 'x', itemTag: { a: 1 } }, null],
                        grindRequired: [{ kind: 'counter', name: 'c', have: 1, need: 2, deficit: 1, unknownField: 'x' }]
                    }
                }
            }
            const result = normalizeSetups({ locked: false, setups: [setup({ locked: false, items: [item] })] })
            const normalized = result?.setups[0].items[0]
            const base = normalized?.acquisition?.cheapestBase

            expect(normalized?.spec).to.deep.equal({
                stars: 5,
                enchants: { harvesting: 6 },
                gems: { slot: 'RUBY' },
                parts: undefined,
                counters: undefined,
                applied: undefined,
                stats: undefined
            })
            expect(normalized?.acquisition).not.to.have.property('unknownField')
            expect(normalized?.acquisition?.direct).to.deep.equal({ price: 1, auctionUuid: undefined, command: `/viewauction ${uuid}` })
            expect(base).not.to.have.property('unknownField')
            expect(base?.upgrades).to.have.length(1)
            expect(base?.upgrades?.[0]).not.to.have.property('unknownField')
            expect(base?.upgrades?.[0]).not.to.have.property('itemTag')
            expect(base?.grindRequired?.[0]).not.to.have.property('unknownField')
        })

        it('accepts only a 32 hex or a dashed uuid in the buy command', () => {
            const command = (c: string) => normalizeSetups({ locked: false, setups: [setup({ locked: false, items: [{ itemTag: 'A', tradeable: true, acquisition: { direct: { price: 1, command: c } } }] })] })?.setups[0].items[0].acquisition?.direct?.command
            expect(command('/viewauction abcdef0123456789abcdef0123456789')).to.equal('/viewauction abcdef0123456789abcdef0123456789')
            expect(command('/viewauction abcdef01-2345-6789-abcd-ef0123456789')).to.equal('/viewauction abcdef01-2345-6789-abcd-ef0123456789')
            expect(command('/viewauction abcdef01')).to.equal(undefined)
            expect(command('/viewauction ----------')).to.equal(undefined)
            expect(command('/viewauction abcdef0123456789abcdef0123456789 x')).to.equal(undefined)
        })

        it('falls back to the tier before the index for a missing id', () => {
            const result = normalizeSetups({ locked: true, setups: [setup({ id: undefined, tier: 'mid' }), setup({ id: undefined, tier: undefined })] })

            expect(result?.setups.map(s => s.id)).to.deep.equal(['mid', 'setup-1'])
        })

        it('drops buy commands that are not a plain view auction and effects of locked responses', () => {
            const acquisition = {
                direct: { price: 1, command: '/viewauction abc; /op me' },
                cheapestBase: { basePrice: 1, total: 1, incomplete: false, command: '/pay someone 100' }
            }
            const result = normalizeSetups({
                locked: true,
                modifierEffects: [{ changes: [{ component: 'tool' }], percentChange: 5 }],
                setups: [setup({ locked: false, items: [{ itemTag: 'A', tradeable: true, acquisition }] }), setup({ id: 'paid', locked: true })]
            })

            expect(result?.setups[0].items[0].acquisition?.direct?.command).to.equal(undefined)
            expect(result?.setups[0].items[0].acquisition?.cheapestBase?.command).to.equal(undefined)
            expect(result?.setups[0].items[0].acquisition?.direct?.price).to.equal(1)
            expect(result?.modifierEffects).to.equal(undefined)
        })

        it('is unlocked as a whole only when every setup is', () => {
            expect(normalizeSetups({ locked: true, setups: [setup({ locked: false })] })?.locked).to.equal(false)
        })

        it('drops setups without items and returns null when nothing is left', () => {
            expect(normalizeSetups({ locked: true, setups: [setup({ items: [] }), setup({ items: null })] })).to.equal(null)
            expect(normalizeSetups({ locked: true })).to.equal(null)
            expect(normalizeSetups(null)).to.equal(null)
            expect(normalizeSetups('<html>maintenance</html>')).to.equal(null)
        })

        it('keeps a baseline without upgrades and fills missing names', () => {
            const result = normalizeSetups({ locked: true, baseline: setup({ id: undefined, name: undefined, tier: 'baseline' }) })

            expect(result?.baseline?.id).to.equal('baseline')
            expect(result?.baseline?.name).to.equal('baseline')
            expect(result?.setups).to.deep.equal([])
        })

        it('loads setups from the cached public endpoint', () => {
            const fetchStub = answerTaskRequestsWith({ body: JSON.stringify({ locked: true, setups: [setup()] }), status: 200 })

            cy.wrap(null)
                .then(() => getPublicTaskSetups('mining'))
                .then(result => {
                    expect(result?.setups).to.have.length(1)
                    const [url, init] = fetchStub.firstCall.args as [string, RequestInit]
                    expect(url).to.equal('https://sky.coflnet.com/api/tasks/mining/setups')
                    expect(init.next).to.deep.equal({ revalidate: 600 })
                    expect(init.signal).to.be.instanceOf(AbortSignal)
                })
        })

        it('returns null for a task without setups', () => {
            answerTaskRequestsWith({ body: JSON.stringify({ slug: 'gear_setups_not_found' }), status: 404 })
            cy.wrap(null).then(() => getPublicTaskSetups('mining')).then(r => expect(r).to.equal(null))
        })

        it('returns null during an outage', () => {
            answerTaskRequestsWith({ body: JSON.stringify({ slug: 'x' }), status: 503 })
            cy.wrap(null).then(() => getPublicTaskSetups('mining')).then(r => expect(r).to.equal(null))
        })

        it('never throws when the request fails', () => {
            cy.stub(globalThis, 'fetch').rejects(new Error('network down'))
            cy.wrap(null).then(() => getPublicTaskSetups('mining')).then(r => expect(r).to.equal(null))
        })
    })
})
