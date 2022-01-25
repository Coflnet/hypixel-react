import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import StartpageComponent from '../../components/Startpage/Startpage'
import './Startpage.css'
import Search from '../../components/Search/Search';

interface Props {

}

function Startpage(props: Props) {

    useEffect(() => {
        document.title = "Auction house tracker for hypixel skyblock";
    })

    return (
        <div className="startpage">
            <Container>
                <Search />
                <StartpageComponent />
            </Container>
        </div>
    );
}

export default Startpage;