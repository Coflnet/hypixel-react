import { redirect } from 'next/navigation'

export default function Page() {
    // Server-side redirect to canonical route
    redirect('/recentFlips')
}
