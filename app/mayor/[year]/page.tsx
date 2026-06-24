import { Metadata } from "next";
import { YearlyMayor } from "../../../components/Mayor/YearlyMayor";
import { Container } from "react-bootstrap";
import NavBar from "../../../components/NavBar/NavBar";
import Search from "../../../components/Search/Search";

export const metadata: Metadata = {
    title: "Mayor Flips",
    description: "A list of items that are affected by the current or upcoming mayor.",
};

export default async function MayorPage({ params }: { params: { year: string } }) {
    const year = params.year;
    return (
        <Container>
            <NavBar />
            <Search />
            <h1>Mayor Data for Year {year}</h1>
            <hr />
            <YearlyMayor year={year} />
        </Container>
    );
}
