import { Metadata } from "next";
import { YearlyMayor } from "../../../components/Mayor/YearlyMayor";
import { Container } from "react-bootstrap";
import NavBar from "../../../components/NavBar/NavBar";
import Search from "../../../components/Search/Search";

export const metadata: Metadata = {
    title: "Mayor Flips",
    description: "A list of items that are affected by the current or upcoming mayor.",
};

type Props = {
    params: {
        year: string;
    }
}

export default function MayorPage({ params }: Props) {
    return (
        <Container>
            <NavBar />
            <Search />
            <h1>Mayor Data for Year {params.year}</h1>
            <hr />
            <YearlyMayor year={params.year} />
        </Container>
    );
}
