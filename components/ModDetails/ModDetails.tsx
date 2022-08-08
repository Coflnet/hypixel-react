import React from 'react'
import { Card } from 'react-bootstrap'

function ModDetails() {
    return (
        <>
            <Card>
                <Card.Header>
                    <Card.Title>Details</Card.Title>
                </Card.Header>
                <Card.Body>
                    <p>We provide a mod as a quality of life feature to use the flipper in minecraft directly.</p>
                    <p>To use the mod you will need to link it to the website and verify your Minecraft account.</p>
                    <hr />
                    <p>
                        The only legit place to download is on our{' '}
                        <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">
                            Discord
                        </a>{' '}
                        in the #mod-releases channel.
                    </p>
                    <p>
                        The entire mod is open source and you can check/compile it yourself here:{' '}
                        <a target="_blank" rel="noreferrer" href="https://github.com/Coflnet/SkyblockMod">
                            https://github.com/Coflnet/SkyblockMod
                        </a>
                    </p>
                    <hr />
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <iframe
                            width="560"
                            height="315"
                            src="https://www.youtube.com/embed/qwnvobFTcS0"
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </Card.Body>
            </Card>
        </>
    )
}

export default ModDetails
