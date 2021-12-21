import React, { ChangeEvent, useEffect, useState } from 'react';
import { Badge, Form, ListGroup } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import { convertTagToName, numberWithThousandsSeperators } from '../../utils/Formatter';
import './CraftsList.css'
import Tooltip from '../Tooltip/Tooltip';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';

export function CraftsList() {

    let [crafts, setCrafts] = useState<ProfitableCraft[]>([]);
    let [nameFilter, setNameFilter] = useState<string | null>();
    let [orderBy, setOrderBy] = useState<string>("profit");
    let [accountInfo, setAccountInfo] = useState<AccountInfo>();
    let [profiles, setProfiles] = useState<SkyblockProfile[]>();
    let [selectedProfile, setSelectedProfile] = useState<SkyblockProfile>();

    useEffect(() => {
        loadCrafts();
    }, []);

    function loadCrafts(playerId?: string, profileId?: string) {
        api.getProfitableCrafts(playerId, profileId).then(crafts => {
            setCrafts(crafts);
        })
    }

    function onAfterLogin() {
        api.getAccountInfo().then(info => {
            setAccountInfo(info);
            api.getPlayerProfiles(info.mcId).then(profiles => {
                profiles.forEach(profile => {
                    if (profile.current) {
                        setSelectedProfile(profile);
                    }
                })
                setProfiles(profiles);
            })
        })
    }

    function onNameFilterChange(e: any) {
        if (e.target.value) {
            setNameFilter(e.target.value);
        } else {
            setNameFilter(e.target.value);
        }
    }

    function updateOrderBy(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex;
        let value = event.target.options[selectedIndex].getAttribute('value')!;
        setOrderBy(value);
    }

    function onProfileChange(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex;
        let value = event.target.options[selectedIndex].getAttribute('value')!;
        let newSelectedProfile = profiles?.find(p => p.cuteName === value);
        setSelectedProfile(newSelectedProfile);
        loadCrafts(accountInfo?.mcId, newSelectedProfile?.id);
    }

    function getListElement(craft: ProfitableCraft) {
        if (nameFilter && craft.item.name?.toLowerCase().indexOf(nameFilter.toLowerCase()) === -1) {
            return <span />;
        }
        return <ListGroup.Item action className="list-group-item">
            <h4>
                <img crossOrigin="anonymous" src={craft.item.iconUrl} height="32" width="32" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                {convertTagToName(craft.item.name)}
            </h4>
            <p><span className="label">Crafting-Cost:</span> {numberWithThousandsSeperators(Math.round(craft.craftCost))}</p>
            <p><span className="label">Sell-Price:</span> {numberWithThousandsSeperators(Math.round(craft.sellPrice))}</p>
            <p><span className="label">Req. Collection:</span> {craft.requiredCollection ? convertTagToName(craft.requiredCollection.name) + " " + craft.requiredCollection.level : <span style={{ color: "red" }}>---</span>}</p>
        </ListGroup.Item>
    }

    function getHoverElement(craft: ProfitableCraft) {
        return <div style={{ width: "auto" }}>
            <div style={{ width: "auto", whiteSpace: "nowrap" }}>
                {craft.ingredients.map(ingredient => {
                    return <p key={ingredient.item.tag} style={{ textAlign: "left" }}>
                        <img crossOrigin="anonymous" src={ingredient.item.iconUrl} height="24" width="24" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                        {ingredient.item.name + " (" + ingredient.count + "x)"}
                        <Badge style={{ marginLeft: "5px" }} variant="secondary">{numberWithThousandsSeperators(Math.round(ingredient.cost * ingredient.count))}</Badge>
                    </p>
                })}
            </div>
        </div>
    }


    if (orderBy) {
        if (orderBy === "profit") {
            crafts = crafts.sort((a, b) => (b.sellPrice - b.craftCost) - (a.sellPrice - a.craftCost));
        } else {
            crafts = crafts.sort((a, b) => (b[orderBy] as number) - (a[orderBy] as number));
        }
    }

    let list = crafts.map((craft, i) => {
        return (
            <Tooltip key={craft.item.tag} type="hover" id="tooltip-container" content={getListElement(craft)} tooltipContent={getHoverElement(craft)} />
        )
    });

    const selectWidth = profiles ? "32%" : "49%";

    return (
        <div>
            {
                wasAlreadyLoggedIn() ?
                    <div style={{ visibility: "collapse" }}>
                        <GoogleSignIn onAfterLogin={onAfterLogin} />
                    </div> : null
            }
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Form.Control style={{ width: selectWidth }} placeholder="Item name..." onChange={onNameFilterChange} />
                <Form.Control style={{ width: selectWidth }} className="select-filter" defaultValue={orderBy} as="select" onChange={updateOrderBy}>
                    <option value={""}>-</option>
                    <option value={"craftCost"}>Craft-Cost</option>
                    <option value={"sellPrice"}>Sell-Price</option>
                    <option value={"profit"}>Profit</option>
                </Form.Control>
                {
                    profiles ?
                        <Form.Control style={{ width: selectWidth }} className="select-filter" defaultValue={selectedProfile?.cuteName} as="select" onChange={onProfileChange}>
                            {
                                profiles.map(profile =>
                                    <option value={profile.cuteName}>{profile.cuteName}</option>
                                )
                            }
                        </Form.Control>
                        : ""
                }
            </div>
            <hr />
            <div className="crafts-list">
                <ListGroup className="list">
                    {list}
                </ListGroup>
            </div>
        </div>
    )
}