import React from 'react';
import StartpageComponent from '../../components/Startpage/Startpage'
import './Startpage.css'

interface Props {

}

function Startpage(props: Props) {

    return (
        <div className="startpage">
            <StartpageComponent />
        </div>
    );
}

export default Startpage;