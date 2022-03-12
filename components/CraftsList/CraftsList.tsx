import React, { ChangeEvent, useEffect, useState } from 'react'
import { Form, ListGroup } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { convertTagToName, numberWithThousandsSeperators } from '../../utils/Formatter'
import Tooltip from '../Tooltip/Tooltip'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { CraftDetails } from './CraftDetails/CraftDetails'
import styles from './CraftsList.module.css'

interface Props {
    crafts?: ProfitableCraft[]
}

export function CraftsList(props: Props) {
    let [crafts, setCrafts] = useState<ProfitableCraft[]>(props.crafts || [])
    let [nameFilter, setNameFilter] = useState<string | null>()
    let [orderBy, setOrderBy] = useState<string>('profit')
    let [accountInfo, setAccountInfo] = useState<AccountInfo>()
    let [profiles, setProfiles] = useState<SkyblockProfile[]>()
    let [selectedProfile, setSelectedProfile] = useState<SkyblockProfile>()
    let [isLoadingProfileData, setIsLoadingProfileData] = useState(true)
    let [hasPremium, setHasPremium] = useState(false)
    let [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        setIsLoadingProfileData(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function loadCrafts(playerId?: string, profileId?: string) {
        api.getProfitableCrafts(playerId, profileId).then(crafts => {
            setCrafts(crafts)
        })
    }

    function loadHasPremium(): Promise<void> {
        let googleId = localStorage.getItem('googleId')
        return api.hasPremium(googleId!).then(hasPremiumUntil => {
            let hasPremium = false
            if (hasPremiumUntil !== undefined && hasPremiumUntil.getTime() > new Date().getTime()) {
                hasPremium = true
            }
            setHasPremium(hasPremium)
        })
    }

    function onAfterLogin() {
        setIsLoggedIn(true)
        loadHasPremium().then(() => {
            api.getAccountInfo().then(info => {
                setAccountInfo(info)
                if (info.mcId) {
                    api.getPlayerProfiles(info.mcId).then(profiles => {
                        profiles.forEach(profile => {
                            if (profile.current) {
                                setSelectedProfile(profile)
                            }
                        })
                        setProfiles(profiles)
                    })
                }
                setIsLoadingProfileData(false)
            })
        })
    }

    function onNameFilterChange(e: any) {
        if (e.target.value) {
            setNameFilter(e.target.value)
        } else {
            setNameFilter(e.target.value)
        }
    }

    function updateOrderBy(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex
        let value = event.target.options[selectedIndex].getAttribute('value')!
        setOrderBy(value)
    }

    function onProfileChange(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex
        let value = event.target.options[selectedIndex].getAttribute('value')!
        let newSelectedProfile = profiles?.find(p => p.cuteName === value)
        setSelectedProfile(newSelectedProfile)
        loadCrafts(accountInfo?.mcId, newSelectedProfile?.id)
    }

    function getListElement(craft: ProfitableCraft, blur: boolean) {
        if (nameFilter && craft.item.name?.toLowerCase().indexOf(nameFilter.toLowerCase()) === -1) {
            return <span />
        }
        return (
            <ListGroup.Item action={!blur}>
                {blur ? (
                    <p style={{ position: 'absolute', top: '25%', left: '25%', width: '50%', fontSize: 'large', fontWeight: 'bold', textAlign: 'center' }}>
                        The top 3 crafts can only be seen with premium
                    </p>
                ) : (
                    ''
                )}
                <div className={blur ? styles.blur : ''}>
                    <h4>{getCraftHeader(craft)}</h4>
                    <p>
                        <span className={styles.label}>Crafting-Cost:</span> {numberWithThousandsSeperators(Math.round(craft.craftCost))} Coins
                    </p>
                    <p>
                        <span className={styles.label}>Sell-Price:</span> {numberWithThousandsSeperators(Math.round(craft.sellPrice))} Coins
                    </p>
                    <p>
                        <span className={styles.label}>Req. Collection:</span>{' '}
                        {craft.requiredCollection ? (
                            convertTagToName(craft.requiredCollection.name) + ' ' + craft.requiredCollection.level
                        ) : (
                            <span style={{ color: 'red' }}>---</span>
                        )}
                    </p>
                </div>
            </ListGroup.Item>
        )
    }

    function getCraftHeader(craft) {
        return (
            <span>
                <img crossOrigin="anonymous" src={craft.item.iconUrl} height="32" width="32" alt="" style={{ marginRight: '5px' }} loading="lazy" />
                {convertTagToName(craft.item.name)}
            </span>
        )
    }

    if (orderBy) {
        if (orderBy === 'profit') {
            crafts = crafts.sort((a, b) => b.sellPrice - b.craftCost - (a.sellPrice - a.craftCost))
        } else {
            crafts = crafts.sort((a, b) => (b[orderBy] as number) - (a[orderBy] as number))
        }
    }

    let list = crafts.map((craft, i) => {
        return !hasPremium && i < 3 ? (
            <div key={craft.item.tag} className={styles.preventSelect}>
                {getListElement(craft, true)}
            </div>
        ) : (
            <Tooltip
                key={craft.item.tag}
                type="click"
                content={getListElement(craft, false)}
                tooltipTitle={getCraftHeader(craft)}
                tooltipContent={<CraftDetails craft={craft} />}
            />
        )
    })

    const selectWidth = profiles ? '32%' : '49%'

    let connectMinecraftTooltip = (
        <Tooltip
            type="hover"
            content={<span style={{ color: '#007bff' }}>connect your Minecraft Account</span>}
            tooltipContent={
                <div style={{ width: 'max-width' }}>
                    <p>
                        To connect your Minecraft Account, search your ingame name in the search bar. On the player page you should see a text "You? Claim
                        account."
                    </p>
                </div>
            }
        />
    )

    return (
        <div>
            <div>
                {isLoadingProfileData && isLoggedIn ? (
                    getLoadingElement()
                ) : (
                    <div>
                        {!isLoggedIn ? (
                            <p>To use the the profile filter please login with Google and {connectMinecraftTooltip}:</p>
                        ) : !accountInfo?.mcId ? (
                            <p>To use the the profile filter please {connectMinecraftTooltip}</p>
                        ) : (
                            ''
                        )}
                    </div>
                )}
                <GoogleSignIn onAfterLogin={onAfterLogin} />
                {!isLoggedIn || !accountInfo?.mcId ? <hr /> : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Form.Control style={{ width: selectWidth }} placeholder="Item name..." onChange={onNameFilterChange} />
                <Form.Control style={{ width: selectWidth }} defaultValue={orderBy} as="select" onChange={updateOrderBy}>
                    <option value={''}>-</option>
                    <option value={'craftCost'}>Craft-Cost</option>
                    <option value={'sellPrice'}>Sell-Price</option>
                    <option value={'profit'}>Profit</option>
                </Form.Control>
                {profiles ? (
                    <Form.Control style={{ width: selectWidth }} defaultValue={selectedProfile?.cuteName} as="select" onChange={onProfileChange}>
                        {profiles.map(profile => (
                            <option key={profile.cuteName} value={profile.cuteName}>
                                {profile.cuteName}
                            </option>
                        ))}
                    </Form.Control>
                ) : (
                    ''
                )}
            </div>
            <hr />
            <p>Click on a craft for further details</p>
            <div className={styles.craftsList}>
                <ListGroup className={styles.list}>{list}</ListGroup>
            </div>
        </div>
    )
}
