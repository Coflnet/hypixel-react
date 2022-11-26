import React from 'react'
import { Card } from 'react-bootstrap'

function ModDetails() {
    return (
        <>
            <Card>
                <Card.Header>
                    <Card.Title>Cofl skyblock mod details</Card.Title>
                </Card.Header>
                <Card.Body>
                    <p>
                        Say goodbye to window switching. The cofl mod provides you with data directly in Hypixel Skyblock. You can access price paid, the ah
                        flipper, median, lbin, bazaar prices and more.
                    </p>
                    <h3>Installation</h3>
                    <ol>
                        <li>Get and install Forge 1.8.9 (if you don&apos;t have already watch the video below)</li>
                        <li>Download and put the mod into your mods folder</li>
                        <li>Launch Minecraft and join Skyblock</li>
                        <li>
                            Get a list of commands with /cofl help or watch the{' '}
                            <a href="https://www.youtube.com/watch?v=dv66Y_cra8U&list=PLDpPmxIcq9tAssQlyJMBlSmSg5JOpq699">YouTube playlist</a> explaining them
                        </li>
                    </ol>
                    <hr />
                    <p>
                        Mod downloads including source code can be found on the{' '}
                        <a target="_blank" rel="noreferrer" href="https://github.com/coflnet/skyblockmod/releases  ">
                            Cofl Mod Github release page
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
