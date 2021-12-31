import React, { useEffect } from 'react';
import './FlipTracking.css'
import { Container } from 'react-bootstrap';
import Search from '../../components/Search/Search';
import { FlipTracking as FlipTrackingComponent } from '../../components/FlipTracking/FlipTracking';

function FlipTracking() {

    useEffect(() => {
        document.title = "Flip Tracker";
    })

    return (
        <div className="flip-tracking-page">
            <Container>
                <Search />
                <FlipTrackingComponent />
            </Container>
        </div >
    );
}

export default FlipTracking;