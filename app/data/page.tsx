import Link from 'next/link'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import RBCard from '../../components/ReactBootstrapWrapper/Card'
import RBCardHeader from '../../components/ReactBootstrapWrapper/RBCardHeader'
import RBCardTitle from '../../components/ReactBootstrapWrapper/RBCardTitle'
import Search from '../../components/Search/Search'
import RBCardBody from '../../components/ReactBootstrapWrapper/RBCardBody'
import { getHeadMetadata } from '../../utils/SSRUtils'

export default function Page() {
    return (
        <>
            <RBContainer>
                <Search />
                <hr />
                <RBCard>
                    <RBCardHeader>
                        <RBCardTitle>An app you use gets the data from us</RBCardTitle>
                    </RBCardHeader>
                    <RBCardBody>
                        <p>
                            If you want to make another app yourself take a look at the API docs at{' '}
                            <a href="https://sky.coflnet.com/api" target="_blank">
                                https://sky.coflnet.com/api
                            </a>{' '}
                            (If you do please link this page as well).
                        </p>

                        <p>Besides providing the data for other projects we also have some useful features:</p>

                        <ul>
                            <li>
                                <Link href="/flipper">An AH flipper</Link>
                            </li>
                            <li>
                                <Link href="/">An AH Browser</Link>
                            </li>
                        </ul>

                        <p>These folks use our API:</p>
                        <ul>
                            <li>
                                <a
                                    href="https://discord.com/api/oauth2/authorize?client_id=854722092037701643&permissions=2147601408&scope=bot"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Hypixel Skyblock Community Discord
                                </a>
                            </li>
                            <li>
                                <a href="https://frogpixel.bubbleapps.io/version-test/" target="_blank" rel="noreferrer">
                                    Item Calculator by Froggily
                                </a>
                            </li>
                            <li>
                                <a href="https://skyhelper.altpapier.dev/" target="_blank" rel="noreferrer">
                                    SkyHelper Discord Bot
                                </a>
                            </li>
                            <li>
                                <a href="https://discord.gg/uK9csKB9qJ" target="_blank" rel="noreferrer">
                                    The Exotics Mod
                                </a>
                            </li>

                            <li>You use the API as well? Tell use and get listed here :)</li>
                        </ul>
                    </RBCardBody>
                </RBCard>
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('API')
