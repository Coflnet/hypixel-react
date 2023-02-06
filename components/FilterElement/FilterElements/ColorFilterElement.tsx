import  { useState } from 'react';
import { HexColorInput } from "react-colorful";

interface Props {
    onChange(n: string),
    defaultValue: any
}

export function ColorFilterElement(props: Props) {

    const [color, setColor] = useState(props.defaultValue || "000000");


    function _onChange(color) {
        color = color.replace('#', '');
        setColor(color);
        props.onChange(color);
    }

    return (
        <div>
            <HexColorInput className='form-control' style={{ textTransform: "uppercase" }} color={color} onChange={_onChange} prefixed />
        </div>
    )
}