'use client'
import { useEffect } from 'react'
import { Card } from 'react-bootstrap'

function FlipperFAQ() {
    useEffect(() => {
        if (!location.hash) {
            return
        }
        let element = document.getElementById(location.hash.replace('#', ''))
        if (element) {
            setTimeout(() => {
                window.scrollTo({
                    top: element!.offsetTop - 50
                })
            }, 200)
        }
    }, [])

    return (
        <div id="faq">
            <Card>
                <Card.Header>
                    <Card.Title>
                        <h2>FAQ</h2>
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    <h3>How are profitable flips found?</h3>
                    <p>
                        New flips are found by comparing every new auction with the sell price of already finished auctions of the same item with the same or
                        similar modifiers (e.g. enchantments) and/or comparing to lowest bin.
                    </p>
                    <h3>What auctions are new auctions compared with?</h3>
                    <p>
                        Reference auctions depend on the individual item, its modifiers, and how often it is sold. The algorithm to determine which auctions can
                        be used as reference is changing frequently.
                        <br />
                        You can see the auctions used for reference by clicking on the (?) next to <code>Estimated Profit</code>.
                    </p>
                    <h3>How reliable is the flipper?</h3>
                    <p>
                        Statistically very reliable. Still, some flips might not sell as fast as others or at all. If you encounter a flip that can not be sold,
                        please post a link to it in the skyblock channel on our discord so we can improve the flipper further.
                    </p>
                    <h3>Why is there a "premium" version?</h3>
                    <p>
                        TLDR: Servercosts and compensation for development.
                        <br />
                        To run the flipper and the auction explorer we have to pay for servers to run it on. While we work hard to keep the cost down they are
                        currently up to about 503$ per month. And will increase further the more auctions we save and the the more users are using the site.
                        Furthermore we collectively spent more than 4000 hours of our spare time developing it and would like to get a some compensation for our
                        efforts. The best case would be to develop this and similar projects full time if we could.
                    </p>
                    <h3>What can the free version do?</h3>
                    <p>
                        The free version of the auction flipper can be used if you just got started with ah-flipping. It displays flips with a delay and has
                        some features deactivated. Other than that, there are no limitations. <b>No cap on profit</b>, no need to do anything. (although we
                        would appreciate it, if you support us, either with feedback or money) The more users we have the more feedback we can get and the
                        better the flips will become.
                    </p>
                    <h3>What do I get if I buy premium?</h3>
                    <p>
                        You get flips as soon as they are found. That allows you to buy up the most profitable flips before anyone else. Furthermore you get
                        more filter options. Which allow you to only see flips that you are actually interested in. For a full list see{' '}
                        <a target="_blank" href="/premium" rel="noreferrer">
                            the premium page
                        </a>
                    </p>
                    <h3>What do these labels mean?</h3>
                    <h4>Cost</h4>
                    <p>Cost is the auction price that you would have to pay. </p>
                    <h4>Median Price</h4>
                    <p>
                        Median Price is the median price for that item. Taking into account ultimate enchantments, valuable enchantments (eg. snipe 4), price
                        paid at dark auctions, Pet level, Pet item, Reforges, Cake years, Kill counts, Rarity and stars. (basically everything that could change
                        the price)
                    </p>
                    <h4>Volume</h4>
                    <p>Volume is the number of auctions that were sold in a 24 hour window. It is capped at 60 to keep the flipper fast.</p>
                    <h4>Lowest bin</h4>
                    <p>
                        The lowest bin gives you an indication how much this item type is worth. It displays the lowest price for a given item type and ignores
                        modifiers. You can click it.
                    </p>
                    <h3>Should I flip an item with low volume?</h3>
                    <p>
                        If you have to ask this question, the answer probably no. Low volume items require some user expertise to determine if the item actually
                        is a good flip or not. However since its sold so infrequently it may be a niche item that has a higher profit margin.
                    </p>
                    <h3>I have another question/ Bug report</h3> Ask via{' '}
                    <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">
                        discord
                    </a>{' '}
                    or{' '}
                    <a target="_blank" href="/feedback" rel="noreferrer">
                        feedback site
                    </a>
                </Card.Body>
            </Card>
        </div>
    )
}

export default FlipperFAQ
