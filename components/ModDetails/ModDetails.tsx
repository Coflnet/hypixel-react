import React from 'react'
import { Card, Button } from 'react-bootstrap'
import DownloadIcon from '@mui/icons-material/Download'
import styles from './ModDetails.module.css'
function ModDetails() {

    return (
        <>
            <Card style={{ marginBottom: "20px" }}>
                <Card.Header>
                    <Card.Title><h1>Cofl Skyblock Mod</h1></Card.Title>
                </Card.Header>
                <Card.Body>
                    <p>
                        Say goodbye to window switching! The CoflMod provides you with data directly in Hypixel Skyblock. You can access price paid, the Auction
                        Flipper, median price, lowest BIN, bazaar prices and more!
                    </p>
                    <h3>Installation</h3>
                    <ol>
                        <li>Get and install Forge 1.8.9 (if you don't have already watch the video below)</li>
                        <li>Download and put the mod into your <span style={{ fontFamily: "monospace" }}>.minecraft/mods</span> folder</li>
                        <li>Launch Minecraft and join Skyblock</li>
                        <li>
                            Get a list of commands with <span style={{ fontFamily: "monospace" }}>/cofl help</span> or watch the{' '}
                            <a href="https://www.youtube.com/watch?v=dv66Y_cra8U&list=PLDpPmxIcq9tAssQlyJMBlSmSg5JOpq699">YouTube playlist</a> explaining them
                        </li>
                    </ol>
                    <hr />
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: "center" }} className={styles.modDetailsFooter}>
                        <a href="https://www.youtube.com/watch?v=dv66Y_cra8U&list=PLDpPmxIcq9tAssQlyJMBlSmSg5JOpq699">
                            <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid meet" focusable="false" style={{ pointerEvents: "none", display: "block", "height": "38px" }}>
                                <g>
                                    <path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" fill="#FF0000"></path>
                                    <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white"></path>
                                </g>
                            </svg></a>
                        <Button href="https://github.com/coflnet/skyblockmod/releases/latest">
                            Download <DownloadIcon />
                        </Button>
                        <a href="https://github.com/coflnet/skyblockmod/">
                            <img src="/github_logo.png" alt="Github logo" width="38" height="38"/>
                        </a>
                    </div>
                </Card.Body>
            </Card>
        </>
    )
}

export default ModDetails
