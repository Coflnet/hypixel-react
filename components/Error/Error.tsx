import Link from "next/link";
import { Button, Container } from "react-bootstrap";

export function Error({ title, errorObject }: { title: string, errorObject: any }) {
    return <Container>
        <h1>{title}</h1>
        <Link href="/" className="disableLinkStyle">
            <Button>Return to main page</Button>
        </Link>
        <p>{JSON.stringify(errorObject)}</p>
    </Container>
}