import React from 'react';
import { Container, Badge } from 'react-bootstrap';
import StartpageComponent from '../../components/Startpage/Startpage'
import './Startpage.css'
import Search from '../../components/Search/Search';

interface Props {

}

function Startpage(props: Props) {

    return (
        <div className="startpage">
            <Container>
                <Search currentElement={<p className="current"><Badge variant="primary">Current:</Badge> Startpage</p>} />
                <StartpageComponent />
            </Container>
        </div>
    );
}

export default Startpage;