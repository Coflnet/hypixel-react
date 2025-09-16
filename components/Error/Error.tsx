import Link from "next/link";
import { Button, Container } from "react-bootstrap";

export function Error({ title, errorObject, errorMessage }: { title: string, errorObject?: any, errorMessage?: string }) {
    return <Container>
        <h1>{title}</h1>
        {errorObject ? <p>{JSON.stringify(errorObject)}</p> : null}
        {errorMessage ? <p>{errorMessage}</p> : null}

        <Link href="/" className="disableLinkStyle">
            <Button>Return to main page</Button>
        </Link>
    </Container>
}