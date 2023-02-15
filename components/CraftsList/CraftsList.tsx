import { ChangeEvent, useEffect, useState } from 'react'
import { Form, ListGroup } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { convertTagToName, getMinecraftColorCodedElement, numberWithThousandsSeparators } from '../../utils/Formatter'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import Tooltip from '../Tooltip/Tooltip'
import { CraftDetails } from './CraftDetails/CraftDetails'
import styles from './CraftsList.module.css'

interface Props {
    crafts?: ProfitableCraft[]
    bazaarTags?: string[]
}

interface SortOption {
    label: string
    value: string
    sortFunction(crafts: ProfitableCraft[], bazaarTags: string[])
}

const SORT_OPTIONS: SortOption[] = [
    {
        label: 'Profit',
        value: 'profit',
        sortFunction: crafts => crafts.sort((a, b) => b.sellPrice - b.craftCost - (a.sellPrice - a.craftCost))
    },
    {
        label: 'Sell Price',
        value: 'sellPrice',
        sortFunction: crafts => crafts.sort((a, b) => b.sellPrice - a.sellPrice)
    },
    {
        label: 'Craft Cost',
        value: 'craftCost',
        sortFunction: crafts => crafts.sort((a, b) => b.craftCost - a.craftCost)
    },
    {
        label: 'Instant Sell (Bazaar)',
        value: 'bazaarCrafts',
        sortFunction: (crafts, bazaarTags) =>
            crafts
                .sort((a, b) => b.sellPrice - b.craftCost - (a.sellPrice - a.craftCost))
                .filter(craft => {
                    let searchFor = [...craft.ingredients.map(ingredients => ingredients.item.tag), craft.item.tag]
                    for (let i = 0; i < searchFor.length; i++) {
                        if (bazaarTags.indexOf(searchFor[i]) === -1) {
                            return false
                        }
                    }
                    return true
                })
    }
]

let observer: MutationObserver

export function CraftsList(props: Props) {
    let [crafts, setCrafts] = useState<ProfitableCraft[]>(props.crafts || [])
    let [nameFilter, setNameFilter] = useState<string | null>()
    let [orderBy, setOrderBy] = useState<SortOption>(SORT_OPTIONS[0])
    let [accountInfo, setAccountInfo] = useState<AccountInfo>()
    let [profiles, setProfiles] = useState<SkyblockProfile[]>()
    let [selectedProfile, setSelectedProfile] = useState<SkyblockProfile>()
    let [isLoadingProfileData, setIsLoadingProfileData] = useState(true)
    let [hasPremium, setHasPremium] = useState(false)
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [bazaarTags, setBazaarTags] = useState<string[]>(props.bazaarTags || [])
    let [showTechSavvyMessage, setShowTechSavvyMessage] = useState(false)

    useEffect(() => {
        setIsLoadingProfileData(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        // reset the blur observer, when something changed
        setTimeout(() => {
            setBlurObserver()
        }, 100)
    })

    function loadCrafts(playerId?: string, profileId?: string) {
        api.getProfitableCrafts(playerId, profileId).then(crafts => {
            setCrafts(crafts)
        })
    }

    function setBlurObserver() {
        if (observer) {
            observer.disconnect()
        }
        observer = new MutationObserver(function () {
            setShowTechSavvyMessage(true)
        })

        var targets = document.getElementsByClassName('blur')
        for (var i = 0; i < targets.length; i++) {
            var config = {
                attributes: true,
                childList: true,
                characterData: true,
                attributeFilter: ['style']
            }
            observer.observe(targets[i], config)
        }
    }

    function onAfterLogin() {
        setIsLoggedIn(true)
        api.refreshLoadPremiumProducts(products => {
            setHasPremium(hasHighEnoughPremium(products, PREMIUM_RANK.STARTER))
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
        setNameFilter(e.target.value)
    }

    function updateOrderBy(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex
        let value = event.target.options[selectedIndex].getAttribute('value')!
        let sortOption = SORT_OPTIONS.find(option => option.value === value)
        if (sortOption) {
            setOrderBy(sortOption)
        }
    }

    function onProfileChange(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex
        let value = event.target.options[selectedIndex].getAttribute('value')!
        let newSelectedProfile = profiles?.find(p => p.cuteName === value)
        setSelectedProfile(newSelectedProfile)
        loadCrafts(accountInfo?.mcId, newSelectedProfile?.id)
    }

    let blurStyle: React.CSSProperties = {
        WebkitFilter: 'blur(5px)',
        msFilter: 'blur(5px)',
        filter: 'blur(5px)'
    }

    function getListElement(craft: ProfitableCraft, blur: boolean) {
        if (nameFilter && craft.item.name?.toLowerCase().indexOf(nameFilter.toLowerCase()) === -1) {
            return <span />
        }
        return (
            <ListGroup.Item action={!blur}>
                {blur ? (
                    <p style={{ position: 'absolute', top: '25%', left: '25%', width: '50%', fontSize: 'large', fontWeight: 'bold', textAlign: 'center' }}>
                        The top 3 crafts can only be seen with starter premium or better
                    </p>
                ) : (
                    ''
                )}
                {showTechSavvyMessage && blur ? (
                    <p
                        style={{
                            position: 'absolute',
                            top: '25%',
                            left: '25%',
                            width: '50%',
                            fontSize: 'large',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            backgroundColor: 'gray'
                        }}
                    >
                        You seem like a tech savvy person, join our development team to get premium for free. :)
                    </p>
                ) : (
                    ''
                )}
                <div className={`${blur ? 'blur' : null}`} style={blur ? blurStyle : {}}>
                    <h4>{getCraftHeader(craft)}</h4>
                    <p>
                        <span className={styles.label}>Crafting Cost:</span> {numberWithThousandsSeparators(Math.round(craft.craftCost))} Coins
                    </p>
                    <p>
                        <span className={styles.label}>Sell Price:</span> {numberWithThousandsSeparators(Math.round(craft.sellPrice))} Coins
                    </p>
                    <p>
                        <span className={styles.label}>Median:</span>{' '}
                        {craft.median > 0 ? `${numberWithThousandsSeparators(Math.round(craft.median))} Coins` : 'unknown'}
                    </p>
                    <p>
                        <span className={styles.label}>Volume:</span>{' '}
                        {craft.volume > 0 ? `${numberWithThousandsSeparators(Math.round(craft.volume))}` : 'unknown'}
                    </p>
                    {craft.requiredCollection ? (
                        <p className={styles.craftRequirement}>
                            <span className={styles.craftRequirementLabel}>Req. Collection:</span>
                            {convertTagToName(craft.requiredCollection.name) + ' ' + craft.requiredCollection.level}
                        </p>
                    ) : null}
                    {craft.requiredSlayer ? (
                        <p className={styles.craftRequirement}>
                            <span className={styles.craftRequirementLabel}>Req. Slayer:</span>
                            {convertTagToName(craft.requiredSlayer.name) + ' ' + craft.requiredSlayer.level}
                        </p>
                    ) : null}
                    {!craft.requiredCollection && !craft.requiredSlayer ? <p className={styles.craftRequirement}>No Collection/Slayer required</p> : null}
                </div>
            </ListGroup.Item>
        )
    }

    function getCraftHeader(craft: ProfitableCraft): JSX.Element {
        return (
            <span>
                <img crossOrigin="anonymous" src={craft.item.iconUrl} height="32" alt="" style={{ marginRight: '5px' }} loading="lazy" />
                {getMinecraftColorCodedElement(craft.item.name)}
            </span>
        )
    }

    let orderedCrafts = crafts
    if (orderBy) {
        let sortOption = SORT_OPTIONS.find(option => option.value === orderBy.value)
        orderedCrafts = sortOption?.sortFunction(crafts, bazaarTags)
    }

    let shown = 0
    let list = orderedCrafts.map((craft, i) => {
        if (nameFilter && craft.item.name?.toLowerCase().indexOf(nameFilter.toLowerCase()) === -1) {
            return null
        }
        shown++

        if (!hasPremium && shown <= 3) {
            let censoredCraft = { ...craft }
            censoredCraft.item = {
                tag: '',
                name: '§6You cheated the blur ☺',
                iconUrl: 'https://sky.coflnet.com/static/icon/BARRIER'
            }
            censoredCraft.craftCost = 42
            censoredCraft.sellPrice = 69
            censoredCraft.ingredients = [
                {
                    cost: 119999545.7,
                    count: 80,
                    item: {
                        tag: 'ASPECT_OF_THE_DRAGONS',
                        name: 'Sword',
                        iconUrl: 'https://sky.coflnet.com/static/icon/BARRIER'
                    }
                }
            ]
            censoredCraft.median = -1
            censoredCraft.volume = 123123
            censoredCraft.requiredCollection = null
            censoredCraft.requiredSlayer = null

            return (
                <div key={craft.item.tag} className={styles.preventSelect}>
                    {getListElement(censoredCraft, true)}
                </div>
            )
        } else {
            return (
                <Tooltip
                    key={craft.item.tag}
                    type="click"
                    content={getListElement(craft, false)}
                    tooltipTitle={getCraftHeader(craft)}
                    tooltipContent={<CraftDetails craft={craft} />}
                />
            )
        }
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
                            <p>To use the the profile filter, please login with Google and {connectMinecraftTooltip}:</p>
                        ) : !accountInfo?.mcId ? (
                            <p>To use the the profile filter, please {connectMinecraftTooltip}</p>
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
                <Form.Control style={{ width: selectWidth }} defaultValue={orderBy.value} as="select" onChange={updateOrderBy}>
                    {SORT_OPTIONS.map(option => (
                        <option value={option.value}>{option.label}</option>
                    ))}
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
