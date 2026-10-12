'use client'
import {
    Agriculture,
    Article,
    Build,
    CompareArrows,
    DonutSmall,
    Download,
    EmojiEvents,
    Feedback,
    HowToVote,
    Info,
    JoinFull,
    LocalOffer,
    Home,
    MenuBook,
    NotificationsActive,
    Pets,
    Person,
    PersonAdd,
    Schedule,
    Shield,
    ShowChart,
    SmartToy,
    Storefront,
    SwapHoriz,
    TrendingUp,
    Update,
    Volcano,
    WorkspacePremium
} from '@mui/icons-material'
import type { SvgIconComponent } from '@mui/icons-material'
import styles from './Search.module.css'

const ICONS: Record<string, SvgIconComponent> = {
    home: Home,
    bazaar: Storefront,
    premiumBazaar: WorkspacePremium,
    flipper: LocalOffer,
    hub: ShowChart,
    crafts: Build,
    kat: Pets,
    forge: Volcano,
    fusion: JoinFull,
    upgrade: Agriculture,
    book: MenuBook,
    npc: SmartToy,
    mayor: HowToVote,
    supply: DonutSmall,
    recent: Schedule,
    movers: TrendingUp,
    leaderboard: EmojiEvents,
    trade: SwapHoriz,
    notifier: NotificationsActive,
    premium: WorkspacePremium,
    account: Person,
    mod: Download,
    referral: PersonAdd,
    about: Info,
    wiki: MenuBook,
    guides: MenuBook,
    updates: Update,
    feedback: Feedback,
    data: CompareArrows,
    article: Article
}

interface Props {
    iconKey?: string
}

/** 32px icon for page results, sized like the item/player icons */
export default function PageResultIcon(props: Props) {
    const Icon = (props.iconKey && ICONS[props.iconKey]) || Shield
    return <Icon className={`${styles.searchResultIcon} ${styles.pageResultIcon}`} data-testid="page-result-icon" />
}
