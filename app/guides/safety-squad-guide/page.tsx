import { Metadata } from 'next'
import Link from 'next/link'

const LAST_UPDATED_ISO = "2026-06-12";
const LAST_UPDATED_LABEL = "June 12, 2026";

export const metadata: Metadata = {
  title: 'Hypixel Skyblock Safety Squad Guide - Account Security and Scam Prevention',
  description:
    'Complete walkthrough of the Safety Squad quest in Hypixel Skyblock. Learn how to become a Safety Advocate, recognize common scams, protect your account, and understand the quiz answers.',
  keywords: ['Skyblock', 'Safety Squad', 'Account Security', 'Scam Prevention', 'Safety Advocate', 'Hypixel'],
}

export default function SafetySquadGuide() {
  return (
    <div className="flex justify-center">
      <div className="prose prose-invert max-w-4xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'HowTo',
              name: 'Hypixel Skyblock Safety Squad Guide',
              description:
                'Complete walkthrough of the Safety Squad quest in Hypixel Skyblock. Learn how to become a Safety Advocate, recognize common scams, protect your account, and understand the quiz answers.',
              step: [
                {
                  '@type': 'HowToStep',
                  position: 1,
                  name: 'Warp to the Hub',
                  text: 'Type /hub to warp to the Hub. Turn around 180 degrees, walk to the end of the building, and find Susan on the right.',
                },
                {
                  '@type': 'HowToStep',
                  position: 2,
                  name: 'Talk to Susan and volunteer',
                  text: 'Talk to Susan and select "[Absolutely!]" to volunteer for the Safety Squad. She will register you and send you to the Security Hall.',
                },
                {
                  '@type': 'HowToStep',
                  position: 3,
                  name: 'Listen to Brigette\'s safety training',
                  text: 'Inside the Security Hall, Brigette will teach you about account security, suspicious links, and the /report command.',
                },
                {
                  '@type': 'HowToStep',
                  position: 4,
                  name: 'Avoid Jimmy\'s scam',
                  text: 'Jimmy will try to scam you with a fake trade. Brigette stops him and explains how trading scams work.',
                },
                {
                  '@type': 'HowToStep',
                  position: 5,
                  name: 'Complete the Safety Quiz',
                  text: 'Answer three questions about account security to become a certified Safety Advocate.',
                },
                {
                  '@type': 'HowToStep',
                  position: 6,
                  name: 'Receive your Safety Badge',
                  text: 'Talk to the Security Clerk to receive your official Safety Badge.',
                },
                {
                  '@type': 'HowToStep',
                  position: 7,
                  name: 'Claim your Booster Cookie',
                  text: 'Travel to the Community Center and talk to Elizabeth to receive your Booster Cookie reward.',
                },
              ],
            }),
          }}
        />

        <h1>Hypixel Skyblock Safety Squad Guide</h1>

        <p className="text-gray-400 text-sm mb-4">
          Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
        </p>

        <p>
          The Safety Squad is a tutorial quest in Hypixel Skyblock that teaches you about account security and how to recognize common scams. 
          Completing it rewards you with a <strong>Booster Cookie</strong> and makes you a certified Safety Advocate. This guide walks you through 
          every step of the quest with the full dialogue and explains the correct quiz answers.
        </p>

        <h2>How to Reach Susan</h2>

        <p>To start the Safety Squad quest, you need to find Susan in the Hub. Follow these steps:</p>

        <ol>
          <li>Type <strong>/hub</strong> to warp to the Hub</li>
          <li>Turn around <strong>180 degrees</strong> (half rotation)</li>
          <li>Walk to the end of the building</li>
          <li>To the <strong>right</strong> you should see Susan</li>
        </ol>

        <div className="bg-blue-900 border border-blue-700 rounded p-4 my-4">
          <p className="font-semibold">💡 Tip</p>
          <p className="mt-2">
            If you don&apos;t see Susan, the update has probably not released yet (this guide is based on the version on alpha network alpha.hypixel.net and will be updated after the full release)
          </p>
        </div>

        <h2>How to Start the Safety Squad Quest</h2>

        <p>
          Talk to <strong>Susan</strong> in the Hub to volunteer for the Safety Squad. She will explain the role and ask if you are willing to become a 
          Safety Advocate.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-pink-400 mb-2">
            <strong>[NPC] Susan:</strong> Hey, are you here to volunteer for the Safety Squad?
          </p>

          <p className="text-gray-400 mb-2">Select: <span className="text-green-400">[Absolutely!]</span></p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Susan:</strong> The Safety Squad is dedicated to keeping SkyBlock safe.
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Susan:</strong> As such, we are recruiting Safety Advocates to help spread the importance of safety in SkyBlock.
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Susan:</strong> Are you willing to become a Safety Advocate?
          </p>

          <p className="text-gray-400 mb-2">Select: <span className="text-green-400">[Absolutely]</span></p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Susan:</strong> Good heavens, that&apos;s great news!
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Susan:</strong> With dangerous activity running rampant recently, we could really use your help.
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Susan:</strong> You&apos;ll need to undergo some training to become a Safety Advocate.
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Susan:</strong> Is this fine with you? I promise it won&apos;t take long.
          </p>

          <p className="text-gray-400 mb-2">Select: <span className="text-green-400">[Sounds good with me!]</span></p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Susan:</strong> Processing your registration...
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Susan:</strong> Awesome! You&apos;re our <span className="text-red-400">1314th</span> volunteer!
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Susan:</strong> Head into the doorway next to me, she&apos;ll be waiting for you!
          </p>
        </div>

        <div className="bg-yellow-900 border border-yellow-700 rounded p-4 my-4">
          <p className="text-yellow-300">
            <strong>NEW OBJECTIVE</strong>
            <br />
            Enter the <span className="text-blue-400">Security Hall</span>
          </p>
        </div>

        <p>Walk through the doorway next to Susan to warp to the Security Hall.</p>

        <h2>Meeting Brigette in the Security Hall</h2>

        <p>
          Inside the Security Hall, <strong>Brigette</strong> will greet you and begin your training on account safety.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Hey, recruit!
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Come this way.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Welcome to the <span className="text-blue-400">Security Hall</span>. It&apos;s the place for all safety matters.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> I believe <span className="text-pink-400">Elizabeth</span> has already introduced you to what we do.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> The goal of the Safety Squad is to keep SkyBlock safe, and it starts with <span className="text-red-400 font-bold">you</span>.
          </p>
        </div>

        <h3>Why Account Safety Matters</h3>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> If everyone is aware of the importance of safety, the number of safety-related incidents would greatly decrease.
          </p>

          <p className="text-gray-400 mb-2">Select: <span className="text-green-400">[What is a safety-related incident anyway?]</span></p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> I&apos;m glad you asked.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> On one hand, it is very <span className="italic">important</span> to do things to keep yourself as safe as possible.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Stay indoors when there&apos;s a thunderstorm, wear a safety hat while at a construction site, washing your hands frequently while in a hospital...
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> That being — <span className="text-red-400 font-bold">Account Safety</span>.
          </p>

          <p className="text-gray-400 mb-2">Select: <span className="text-green-400">[What&apos;s the point of Account Safety?]</span></p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Imagine logging in to SkyBlock and finding that all your belongings have disappeared.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Or even worse, trying to log into your Minecraft account but finding yourself locked out.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> The point of <span className="text-red-400 font-bold">Account Safety</span> is to prevent this from happening.
          </p>
        </div>

        <h3>Recognizing Suspicious Behaviour</h3>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> SkyBlock has a lot of players. You will meet a lot of them throughout playing SkyBlock. You could even make some very good friends!
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> However, not everyone is here to make friends.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Some of them are here to steal your coins, items, or even your account!
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Rule number 1, never trust strangers on the internet.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> If someone approaches you, they very likely want something from you.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> What looks like a seemingly innocent request could lead to you <span className="text-red-400 font-bold">losing your account</span>.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> The most common way to lose your account is by opening <span className="text-red-400 font-bold">suspicious</span> links.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> If someone sends a link in chat, chances are they are trying to <span className="text-red-400 font-bold">steal</span> your account.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> The thing is, the evil people who steal accounts will try to catch you <span className="font-bold">off guard</span>.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> They try to make you open links in situations where it seems reasonable.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Or situations where you&apos;re distracted, or least suspecting a scam.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> A way hackers can gain your trust is by messaging you from an account they&apos;ve already hacked.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> If it looks like your friend sent you that message, you&apos;d be inclined to trust them more, right?
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Just like that, your account is gone.
          </p>
        </div>

        <h3>The /report Command</h3>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> If you ever receive a <span className="text-red-400 font-bold">suspicious</span> message in-game, you should report the player with the /report command.
          </p>

          <p className="text-gray-400 mb-2">Select: <span className="text-green-400">[The /report command. Noted.]</span></p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> The dangers of clicking unverified links is not limited to within SkyBlock.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> It&apos;s something that applies all over the internet, really.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> There are some situations where you may encounter suspicious links for SkyBlock outside of the game itself.
          </p>

          <p className="text-gray-400 mb-2">Select: <span className="text-green-400">[Links for SkyBlock outside SkyBlock? Like what?]</span></p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> For example, you may be trying to download a mod for SkyBlock.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Or perhaps, you&apos;re linked a page to someone&apos;s SkyBlock profile, to check out their stats or something.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> While it&apos;s unlikely that these links are bad, you should be careful when clicking them, and try your best to verify whether they&apos;re trustworthy.
          </p>
        </div>

        <h2>The Jimmy Scam Demonstration</h2>

        <p>
          While Brigette is talking to you, a detainee named <strong>Jimmy</strong> pretends to be another recruit and tries to scam you. This is a live 
          demonstration of how trading scams work.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> Hi, the name&apos;s Jimmy.
          </p>

          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> This place looks awesome. I&apos;m all about security.
          </p>

          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> I got these really cool gauntlets. It lets me fight against baddies.
          </p>

          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> You don&apos;t look quite ready for a security job. Where&apos;s your gear, bro?
          </p>

          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> Say, would you like to trade for my gauntlets?
          </p>

          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> It will allow you to punch well above your weight.
          </p>

          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> For the lowly price of <span className="text-yellow-500">999 coins</span>, they can be yours.
          </p>

          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> If you&apos;re down for it, we can trade outside the <span className="text-blue-400">Security Hall</span>.
          </p>

          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> Deal?
          </p>

          <p className="text-gray-400 mb-2">Select: <span className="text-green-400">[Deal.]</span></p>

          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> Great, we&apos;re now besties!
          </p>
        </div>

        <p>
          Just as Jimmy is about to finalize the deal, Brigette returns and stops him, revealing that he is actually a wanted scammer.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> <span className="text-red-400 font-bold">STOP RIGHT THERE!</span>
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> That&apos;s not a recruit, he&apos;s supposed to be a detainee!
          </p>

          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> Aw shucks, I was so close!
          </p>

          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> I&apos;ll try again next time.
          </p>

          <p className="text-cyan-400 mb-2">
            <strong>[NPC] Jimmy:</strong> You haven&apos;t seen the last of me!
          </p>
        </div>

        <h3>The Trading Scam Explained</h3>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Jimmy is currently wanted for twelve counts of scamming and five more counts of assault.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Who knows what he could have done to you.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> I heard you were going to trade with Jimmy?
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Lucky for you, he couldn&apos;t pull off his scam within the Security Hall.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Jimmy wanted you to trade outside so that he wouldn&apos;t get caught.
          </p>

          <p className="text-gray-400 mb-2">Select: <span className="text-green-400">[How does this scam work?]</span></p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Jimmy would show you his &quot;very cool gauntlets&quot; in the trading menu.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> When you attempt to accept the trade, he would quickly swap it to something much cheaper.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> If the trade goes through, you&apos;d be stuck with the cheaper item!
          </p>
        </div>

        <h2>Other Common Scams</h2>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> There are many other forms of these scams.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Some people will set frequently used items up for auctions at a high price, hoping that someone accidentally clicks on them.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> It will ask you to enter your Microsoft email and sends you a login code.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> If you give them your code, you&apos;ve just lost your account entirely.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> There are a lot of scams lurking around every corner.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> We try our best to prevent scams from happening, but scammers always come up with new tricks.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> That&apos;s why it&apos;s always important to stay alert, and stay safe.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Be especially wary of people you just met!
          </p>
        </div>

        <h2>The Safety Quiz</h2>

        <p>
          After the training, Brigette will ask you to complete a quiz to test what you&apos;ve learned. Answer correctly to become a certified Safety Advocate.
        </p>

        <h3>Question #1</h3>
        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="font-semibold">Why is account security important?</p>
          <ul className="mt-2 space-y-1">
            <li><span className="text-green-400">✓</span> It can lead you to lose a lot of items and money.</li>
            <li><span className="text-green-400">✓</span> It can lead you to lose access to your Minecraft account.</li>
            <li><span className="text-green-400">✓</span> It can lead you to lose your Hypixel SkyBlock profile.</li>
          </ul>
          <p className="text-gray-400 mt-2 italic">All answers are correct.</p>
        </div>

        <h3>Question #2</h3>
        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="font-semibold">
            If someone in your party asks you to join their Discord to voice chat, and sends the invite code in chat without the &quot;discord.gg&quot;, what should you do?
          </p>
          <ul className="mt-2 space-y-1">
            <li><span className="text-red-400">✗</span> Manually type the invite link in the browser and join the discord.</li>
            <li><span className="text-green-400">✓</span> Leave the party and report the player.</li>
            <li><span className="text-red-400">✗</span> Add the player on discord and ask for the invite link there.</li>
          </ul>
          <p className="text-gray-400 mt-2 italic">
            You can report the player with the /report command, followed by the player&apos;s username.
          </p>
        </div>

        <h3>Question #3</h3>
        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="font-semibold">
            Your friend sends you a link telling you to go vote for their prize. You click the link, and it&apos;s asking you to log in with an account. What should you do?
          </p>
          <ul className="mt-2 space-y-1">
            <li><span className="text-red-400">✗</span> Register for an account and log in.</li>
            <li><span className="text-red-400">✗</span> Use a linked account (Google, Facebook etc.) to log in.</li>
            <li><span className="text-green-400">✓</span> Look for signs of your friend getting hacked, and don&apos;t click on that website any further.</li>
          </ul>
          <p className="text-gray-400 mt-2 italic">
            You can try to reach out to your friend through other methods of contact to verify if it&apos;s really them. Even so, you should try and verify 
            that the link is from a reputable website — google the domain name to make sure you&apos;re landing at the right website.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Congratulations! You aced the test!
          </p>
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Brigette:</strong> Fill in the following information so that we can issue you a membership card.
          </p>
        </div>

        <h2>Receiving Your Safety Badge</h2>

        <p>
          After passing the quiz, talk to the <strong>Security Clerk</strong> to receive your official Safety Badge.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Security Clerk:</strong> Your Safety Badge is ready! Your information has been digitally registered.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Security Clerk:</strong> Thank you for joining the Safety Squad.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Security Clerk:</strong> You&apos;re now a fully fledged Safety Advocate!
          </p>
        </div>

        <h2>Claiming Your Booster Cookie</h2>

        <p>
          After receiving your badge, travel to the <strong>Community Center</strong> and talk to <strong>Elizabeth</strong> for your reward.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-pink-400 mb-2">
            <strong>[NPC] Elizabeth:</strong> Hey Ekwav!
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Elizabeth:</strong> Sorry for roping you into all of this.
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Elizabeth:</strong> I hope that the things you learnt today will help keep yourself and other people safe.
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Elizabeth:</strong> Remember that safety in SkyBlock starts with you!
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Elizabeth:</strong> Here, take this <span className="text-yellow-500">Booster Cookie</span>.
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Elizabeth:</strong> A <span className="text-yellow-500">Booster Cookie</span> grants you perks and access to some convenient commands for 4 days.
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Elizabeth:</strong> It grants you skill wisdom to level skills faster, for one.
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Elizabeth:</strong> Eating a <span className="text-yellow-500">Booster Cookie</span> also gives you the ability to earn <span className="text-blue-400">Bits</span>.
          </p>

          <p className="text-pink-400 mb-2">
            <strong>[NPC] Elizabeth:</strong> You can spend your <span className="text-blue-400">Bits</span> in my Bits shop to purchase many useful items.
          </p>
        </div>

        <div className="bg-green-900 border border-green-700 rounded p-4 my-4">
          <p className="font-semibold">🎉 Congratulations!</p>
          <p className="mt-2">
            You have completed the Safety Squad quest and are now a certified Safety Advocate! You received a Booster Cookie which grants 4 days of 
            skill wisdom, access to convenient commands, and the ability to earn Bits.
          </p>
        </div>

        <h2>Safety Tips Summary</h2>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <ul className="space-y-2">
            <li>☐ Never trust strangers on the internet — they may want something from you</li>
            <li>☐ Never open suspicious links sent in chat — they are likely phishing attempts</li>
            <li>☐ Be wary even if a message appears to come from a friend — their account may be hacked</li>
            <li>☐ Use <strong>/report</strong> to report suspicious players</li>
            <li>☐ Be careful when clicking links outside the game too (mod downloads, profile links)</li>
            <li>☐ Watch out for trading scams — always double-check items in the trade menu</li>
            <li>☐ Never enter your Microsoft email or login code on third-party websites</li>
            <li>☐ Verify links by checking the domain name and reaching out through other contact methods</li>
          </ul>
        </div>

        <p>
          For a comprehensive breakdown of every scam type — market manipulation, item swapping, fake auctions, phishing, and more — read the dedicated{' '}
          <Link href="/guides/how-to-avoid-scams">How to Avoid Scams &amp; Trading Fraud</Link> guide.
        </p>

        <h2>Spending Your Bits Safely</h2>

        <p>
          The Booster Cookie you received allows you to earn <strong>Bits</strong>, which can be spent in Elizabeth&apos;s Bits shop. 
          The <Link href="/mod">SkyCofl mod</Link> gives you the best conversion options to spend Bits on by showing real-time profitability 
          for each item available in the Bits shop, helping you maximize the value of every Bit you earn.
        </p>

        <p>
          You can download the SkyCofl mod from its official sources:
        </p>
        <ul>
          <li>
            <a href="https://modrinth.com/mod/skycofl" target="_blank" rel="noopener noreferrer">Modrinth</a>
          </li>
          <li>
            <a href="https://www.curseforge.com/minecraft/mc-mods/skycofl" target="_blank" rel="noopener noreferrer">CurseForge</a> (recommended as they manually review each release)
          </li>
          <li>
            <a href="https://github.com/Coflnet/SkyblockMod" target="_blank" rel="noopener noreferrer">GitHub</a>
          </li>
        </ul>

        <h2>Staying Safe with Mods</h2>

        <p>
          As Brigette mentioned, mod downloads can be a source of unsafe links. Here are some important safety guidelines:
        </p>

        <ul>
          <li>
            <strong>Check mod safety:</strong> Use <a href="https://isthisarat.com" target="_blank" rel="noopener noreferrer">https://isthisarat.com</a> to 
            detect known malicious mods (RATs — Remote Access Trojans) before downloading them.
          </li>
          <li>
            <strong>SkyCofl mod is verified safe:</strong> The SkyCofl mod has been reviewed by multiple independent parties. As long as you download it 
            from official sources (Modrinth, CurseForge, or GitHub), it is safe to use.
          </li>
          <li>
            <strong>No login required:</strong> The SkyCofl mod only supports login with non-Microsoft accounts. It does <strong>not</strong> require 
            entering your email or a security code anywhere. Never pass in a security code to any mod, discord or website.
          </li>
          <li>
            <strong>Don&apos;t use random mods:</strong> Only download mods from trusted, well-known sources and authors. If a mod asks for your login 
            credentials or security codes, it is a scam — report and remove it immediately.
          </li>
          <li>
            <strong>Stick to safe tracker tools:</strong> Only use information-only mods that don&apos;t automate gameplay. See our{' '}
            <Link href="/guides/safe-tracker-tools">Safe and Reliable Third-Party Tracker Tools</Link> guide for a breakdown of which tools are approved and which to avoid.
          </li>
          <li>
            <strong>Never buy coins:</strong> Purchasing coins with real money violates Hypixel&apos;s ToS and puts your account at permanent risk of a ban or wipe. Read{' '}
            <Link href="/guides/buying-skyblock-coins">Buying Hypixel Skyblock Coins: Risks, Bans, and Safe Alternatives</Link> to understand why it&apos;s never worth it.
          </li>
          <li>
            <strong>Premium features are account-bound:</strong> Premium features of the SkyCofl mod are unlocked at the account level on the server, similar to Hypixel 
            ranks. It is not possible to crack or pirate these features — any website offering a cracked version is a scam.
          </li>
        </ul>

        <h2>Quick Reference Checklist</h2>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <ul className="space-y-2">
            <li>☐ Talk to Susan and volunteer for the Safety Squad</li>
            <li>☐ Enter the Security Hall</li>
            <li>☐ Listen to Brigette&apos;s safety training</li>
            <li>☐ Avoid getting scammed by Jimmy</li>
            <li>☐ Complete the Safety Quiz (3 questions)</li>
            <li>☐ Talk to the Security Clerk for your badge</li>
            <li>☐ Visit Elizabeth in the Community Center for your Booster Cookie</li>
            <li>☐ Install the SkyCofl mod from official sources for Bits shop profitability tools (/cofl bits)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
