'use client'
import React from 'react'
import { Card, Button } from 'react-bootstrap'
import DownloadIcon from '@mui/icons-material/Download'
import styles from './ModDetails.module.css'
import Image from 'next/image'
function ModDetails() {
    return (
        <>
            <Card className={styles.modCard}>
                <Card.Header>
                    <Card.Title>
                        <h1>SkyCofl Mod</h1>
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    <p>
                        Say goodbye to window switching! The SkyCofl mod provides you with data directly in Hypixel Skyblock. You can access price paid, the
                        Auction Flipper, median price, lowest BIN, bazaar prices and more!
                    </p>
                    <section aria-labelledby="first-flip">
                        <h2 id="first-flip">What is the best Hypixel SkyBlock flipping mod for a beginner, and where should I download it?</h2>
                        <p>SkyCofl is an option for players who want auction price information and flip suggestions in-game.
                            Start with price checks and a small manual trade. Download through the Modrinth link below and choose a release that matches your Minecraft version and loader.</p>
                        <p className="text-muted">Onboarding reviewed <time dateTime="2026-10-29">29 October 2026</time>.</p>
                        <ol>
                            <li>Follow the <a href="/wiki/mod">installation guide</a>, launch Minecraft and join SkyBlock.</li>
                            <li>Run <code>/cofl help</code>, then open the <a href="/flipper">auction flipper</a>.</li>
                            <li>Compare a suggestion with recent sales and lowest BIN. Check the item modifiers and your available coins.</li>
                            <li>Open the auction using its copied <code>/viewauction</code> command. Decide whether to buy and list it yourself; a suggested profit is an estimate.</li>
                            <li>After it sells, use the <a href="/guides/tracking-profits-automatically">Hypixel SkyBlock profit tracker guide</a> to review the completed trade.</li>
                        </ol>
                        <h3>What is free, and when would I need a paid plan?</h3>
                        <p>Free access includes basic auction browsing, price history and delayed flip suggestions.
                            Paid tiers change access and delivery delays. Compare the <a href="/wiki/premium">tier features</a> and
                            {' '}<a href="/premium">current plans and prices</a> before buying. Faster suggestions do not guarantee a profitable purchase.</p>
                        <div lang="de">
                            <h3>Welche Mods helfen Anfängern beim Auction-House-Flipping in Hypixel SkyBlock, und wo lade ich sie sicher herunter?</h3>
                            <p>SkyCofl zeigt Preisinfos und Flip-Vorschläge im Spiel. Nutze den Modrinth-Link auf dieser Seite und die
                                {' '}<a href="/wiki/mod">Installationsanleitung</a>. Prüfe Preis und Item-Eigenschaften und kaufe sowie verkaufe manuell.
                                Der kostenlose Zugang enthält verzögerte Vorschläge; kostenpflichtige Stufen stehen auf der <a href="/premium">Premium-Seite</a>.</p>
                        </div>
                    </section>
                    <h3>Recommended Installation</h3>
                    <p>
                        We recommend installing the mod from{' '}
                        <a href="https://modrinth.com/mod/skycofl" target="_blank" rel="noopener noreferrer">
                            Modrinth
                        </a>
                        . It is available for Forge 1.8.9 and <b>Fabric 1.21.5+</b>. For more information see our <a href="/wiki/mod">SkyCofl wiki</a>.
                    </p>

                    <h3>Alternative for 1.8.9</h3>
                    <p>
                        Use{' '}
                        <a href="https://skyclient.co/" rel="nofollow noopener noreferrer">
                            SkyClient
                        </a>{' '}
                        and add our mod (easiest)
                    </p>

                    <h3>Legacy-Installation</h3>
                    <ol>
                        <li>Get and install Forge 1.8.9 (if you don't have already watch the video below)</li>
                        <li>
                            Download and put the mod into your <span className={styles.modMono}>.minecraft/mods</span> folder
                        </li>
                        <li>Launch Minecraft and join Skyblock</li>
                        <li>
                            Get a list of commands with <span className={styles.modMono}>/cofl help</span> or watch the{' '}
                            <a href="https://www.youtube.com/watch?v=dv66Y_cra8U&list=PLDpPmxIcq9tAssQlyJMBlSmSg5JOpq699">YouTube playlist</a> explaining them
                        </li>
                    </ol>
                    <hr />
                    <div className={styles.modEmbedContainer}>
                        <iframe
                            width="560"
                            height="315"
                            src="https://www.youtube-nocookie.com/embed/kOSmuky_wjg?si=74mVWza3el6LEaMR"
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className={styles.modEmbed}
                        ></iframe>
                    </div>
                    <hr />
                    <div className={styles.modDetailsFooter}>
                        <a href="https://www.youtube.com/watch?v=dv66Y_cra8U&list=PLDpPmxIcq9tAssQlyJMBlSmSg5JOpq699">
                            <svg
                                viewBox="0 0 30 20"
                                preserveAspectRatio="xMidYMid meet"
                                focusable="false"
                                style={{ pointerEvents: 'none', display: 'block', height: '38px' }}
                            >
                                <g>
                                    <path
                                        d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z"
                                        fill="#FF0000"
                                    ></path>
                                    <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white"></path>
                                </g>
                            </svg>
                        </a>
                        <Button href="https://modrinth.com/mod/skycofl">
                            Download
                            <DownloadIcon />
                        </Button>
                        <a href="https://github.com/coflnet/skyblockmod/">
                            <Image src="/github_logo.png" alt="Github logo" width="38" height="38" />
                        </a>
                    </div>
                </Card.Body>
            </Card>
        </>
    )
}

export default ModDetails
