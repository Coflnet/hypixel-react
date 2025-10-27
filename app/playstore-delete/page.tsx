import React from 'react'
import NavBar from '../../components/NavBar/NavBar'
import { Card, Container } from 'react-bootstrap'

export default function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Account deletion (Play Store)
                </h2>
                <hr />
                <Card style={{ padding: '30px' }}>
                    <p>
                        If you want your account deleted that was created via the Play Store,
                        please contact <a href="mailto:support@coflnet.com">support@coflnet.com</a>.
                        Writing from the email you want to have deleted is enough state "I want the account with this email be deleted from SkyCofl".
                    </p>
                </Card>
            </Container>
        </>
    )
}

export const metadata = {
    title: 'Play Store Account Deletion',
    robots: {
        index: false,
        follow: true,
    },
}
