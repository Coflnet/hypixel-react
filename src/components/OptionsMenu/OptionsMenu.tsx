import React, { useState } from 'react';
import './OptionsMenu.css';
import SideNav from 'react-simple-sidenav';
import { Link } from 'react-router-dom';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { Button, Fade, Menu, MenuItem } from '@material-ui/core';
import MoreVert from '@material-ui/icons/MoreVert';

interface Props {
    selected?: Player | Item
}
interface AvailableLinks {
    title: string;
    url: string;
}

function OptionsMenu(props: Props) {

    let { trackEvent } = useMatomo();
    let [anchorEl, setAnchorEl] = useState(null);

    let available: AvailableLinks[] = [];
    const isItemPage = window.location.href.indexOf("/item/") > 0;
    const isPlayerPage = window.location.href.indexOf("/player/") > 0;
    if (isItemPage) {
        available.push({ title: "Wiki", url: "https://hypixel-skyblock.fandom.com/wiki/" + props.selected?.name })
    } else if(isPlayerPage) {
        let player = (props.selected as Player);
        available.push({ title: "SkyCrypt", url: "https://sky.shiiyu.moe/stats/" + player?.uuid })
        available.push({ title: "Plancke", url: "https://plancke.io/hypixel/player/stats/" + player?.uuid })
        available.push({ title: "HyAuctions", url: "https://auctions.craftlink.xyz/players/" + player?.uuid })
    } 


    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const navigate = (url: string) => {
        window.location.href = url;
    }

    return (
        <span>
            <div className="d-none d-md-block">
                {available.map((result, i) => (
                    <Button variant="outlined" onClick={(e: any) => { navigate(result.url) }}>{result.title}</Button>
                ))}
            </div>

        {available.length == 0 ? "" :
            <div className="d-md-none">
                <Button aria-controls="fade-menu" aria-haspopup="true" onClick={handleClick}>
                    <MoreVert />
                </Button>
                <Menu
                    id="fade-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={open}
                    onClose={handleClose}
                    TransitionComponent={Fade}
                >
                    {available.map((result, i) => (
                        <MenuItem onClick={(e: any) => { navigate(result.url) }}>{result.title}</MenuItem>
                    ))}
                </Menu>
            </div>
                    }
        </span >
    );
}

export default OptionsMenu;
