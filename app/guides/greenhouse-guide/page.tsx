import { Metadata } from 'next'
import Link from 'next/link'

const LAST_UPDATED_ISO = "2026-04-19";
const LAST_UPDATED_LABEL = "April 19, 2026";

export const metadata: Metadata = {
  title: 'Hypixel Skyblock Greenhouse Guide - Setup and Farming',
  description:
    'Complete guide to unlocking and setting up your first Greenhouse in Hypixel Skyblock. Learn how to reach Garden Level 7, get the Blueprint, collect resources, and start planting crops.',
  keywords: ['Skyblock', 'Greenhouse', 'Garden', 'Farming', 'Setup', 'Blueprint'],
}

export default function GreenhouseGuide() {
  return (
    <div className="flex justify-center">
      <div className="prose prose-invert max-w-4xl">
        <h1>Hypixel Skyblock Greenhouse Guide</h1>

        <p className="text-gray-400 text-sm mb-4">
          Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
        </p>

        <p>
          The Greenhouse is one of the most rewarding features added in the Skyblock Garden update. This guide will walk you through unlocking your first
          Greenhouse and getting started with crop farming.
        </p>

        <h2>How to Unlock the Greenhouse</h2>

        <p>
          Unlocking the Greenhouse requires completing a series of steps in the Garden. Follow this guide carefully to get your own Greenhouse set up and
          running.
        </p>

        <h3>Step 1: Reach Garden Level 7</h3>

        <p>
          The first requirement to unlock the Greenhouse is to reach <strong>Garden Level 7</strong>. You can check your current Garden level by opening
          the Skyblock menu or visiting the Garden area.
        </p>

        <p>To increase your Garden level, you need to:</p>

        <ul>
          <li>Harvest crops</li>
          <li>Complete Garden visitor tasks</li>
        </ul>

        <h3>Step 2: Wait for the Carpenter Visitor</h3>

        <p>
          Once you reach Garden Level 7, a special visitor named the <strong>Carpenter</strong> will eventually arrive at your Garden. You'll see the chat
          message:
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <code className="text-yellow-400">[CHAT] Carpenter has arrived on your Garden!</code>
        </div>

        <p>Click on the Carpenter NPC to interact with them. They will say:</p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Carpenter:</strong> Hey, <span className="text-cyan-400">NAME</span>. I found this blueprint laying around in my house, just
            collecting dust. Thought it might catch your interest.
          </p>
        </div>

        <h3>Step 3: Accept the Blueprint</h3>

        <p>Accept the offer from the Carpenter. They will respond:</p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400">
            <strong>[NPC] Carpenter:</strong> Here you go! Hopefully, you'll make better use of it than I ever could.
          </p>
        </div>

        <p>You will now receive the Greenhouse Blueprint in your inventory.</p>

        <h3>Step 4: Give the Blueprint to Sam</h3>

        <p>
          Find Sam in the Garden and give them the Blueprint. Sam will react with excitement and provide you with a new objective: <strong>Collect resources for Sam</strong>
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> What's this? ... A <span className="text-blue-400">blueprint</span> for a <span className="text-green-400">Greenhouse</span>?!
          </p>

          <div className="bg-yellow-900 border border-yellow-700 rounded p-2 my-2">
            <p className="text-yellow-300">
              <strong>NEW OBJECTIVE</strong>
              <br />
              Collect resources for Sam
            </p>
          </div>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Do you know what this means??
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> We can build our very own <span className="text-green-400">Greenhouse</span>!
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> I'm so excited, I can't wait to get started on it!
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> I'm sorry, I just can't help myself. Let me calm myself down a bit.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> <em>*deep breathing noises*</em>
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Alright, I feel better now. First we need to gather <span className="text-green-400">some resources</span> to build
            the <span className="text-green-400">Greenhouse</span>.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Looking at the <span className="text-blue-400">blueprint</span>, it seems we need about <span className="text-green-400">64 Enchanted Oak Logs</span> and ...?{' '}
            <span className="text-green-400">128 Enchanted Sand</span>??
          </p>

          <p className="text-blue-400">
            <strong>[NPC] Sam:</strong> If you can find these items, we'll be one step closer to building our very own <span className="text-green-400">Greenhouse</span>!
          </p>
        </div>

        <h3>Step 5: Collect Required Resources</h3>

        <p>Sam has asked you to collect the following resources for the Greenhouse construction:</p>

        <ul>
          <li>
            <strong>64 Enchanted Oak Logs</strong> - These can be obtained by harvesting Oak Trees in the Garden or purchasing them from other players
          </li>
          <li>
            <strong>128 Enchanted Sand</strong> - These can be obtained by harvesting sand in the Desert or from other players
          </li>
        </ul>

        <p>
          <strong>Tip:</strong> Make sure you have enough inventory space before collecting all the resources. Consider using a storage system to manage your items efficiently.
        </p>

        <h3>Step 6: Give Resources to Sam</h3>

        <p>Once you've collected all the required resources, return to Sam and give them the items. Upon delivery, Sam will say:</p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Perfect! Now that we have enough resources, we can finally build this <span className="text-green-400">Greenhouse</span>.
          </p>

          <p className="text-blue-400">
            <strong>[NPC] Sam:</strong> Head over to the <span className="text-cyan-400">Desk</span> and configure one of the plots you already own and place a{' '}
            <span className="text-green-400">Greenhouse</span> on it.
          </p>
        </div>

        <p>
          <strong>Note:</strong> You will have completed the "Gathering Greenhouse Resources" objective.
        </p>

        <h2>Setting Up Your First Greenhouse</h2>

        <h3>Step 7: Place the Greenhouse on a Plot</h3>

        <p>To place your Greenhouse, you need to:</p>

        <ol>
          <li>
            Open the <strong>Desk</strong> in your Garden or access it via the Skyblock Menu
          </li>
          <li>
            Select one of your existing plots in the <strong>Plot Modification</strong> screen
          </li>
          <li>
            Click <strong>"Convert to Greenhouse"</strong> in the lower left corner
          </li>
        </ol>

        <div className="bg-blue-900 border border-blue-700 rounded p-4 my-4">
          <p className="font-semibold">⚠️ Patience Required</p>

          <p className="mt-2">
            After placing the Greenhouse, Skyblock will need approximately <strong>2 minutes</strong> to fill and paste the plot structure. During this time,
            do not leave the Garden. Wait for the process to complete before proceeding.
          </p>
        </div>

        <h3>Step 8: Start Planting Your First Crops</h3>

        <p>Once your Greenhouse has been successfully built, Sam will teleport in to help you plant the very first crop.</p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Wow, it looks even better than I imagined!
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Now, let's get to work. It's time to plant our <span className="text-yellow-300">first crop</span>.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Why don't you do the honor? Here, take this <span className="text-yellow-500">carrot</span> and plant it in the <span className="text-green-400">Greenhouse</span>!
          </p>

          <p className="text-blue-400">
            <strong>[NPC] Sam:</strong> Inside the <span className="text-green-400">Greenhouse</span>, crops usually grow at a much slower speed than normal, but they will also yield way more!
          </p>
        </div>

        <h4>Preparing the Plot</h4>

        <p>
          Use a <strong>hoe</strong> to convert the dirt block in the center of the Greenhouse into <strong>farmland</strong>. Then place the carrot provided by Sam
          on that center farmland block.
        </p>

        <h4>Watering: HydroCan 1000</h4>

        <p>
          After planting, Sam will give you a <strong>HydroCan 1000</strong> to water the carrot. Watering in the Greenhouse is done by holding
          <strong> right-click</strong> while aiming at the crop. A small indicator will appear showing the watering level — make sure it fills to
          <strong> 100%</strong> before letting go.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Nice! But crops need water to grow. Use this watering can to water the plot.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Watering a crop inside the <span className="text-green-400">Greenhouse</span> is different than normal.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> In here, you need to <span className="text-blue-400">water crops</span> from time to time to keep them healthy.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Just aim the can at the crop you want to water and hold right-click!
          </p>

          <p className="text-blue-400">
            <strong>[NPC] Sam:</strong> Look at that! It's already growing! It should be ready to harvest soon.
          </p>
        </div>

        <h4>Harvesting the First Crop</h4>

        <p>When the carrot reaches full growth, harvest it as usual. Sam will congratulate you:</p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Amazing! We've done it! Our very first harvest from the <span className="text-green-400">Greenhouse</span>. You've really got the hang of this.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Now that you are familiar with the <span className="text-green-400">basics</span>, let's move on to the more <span className="text-blue-400">advanced</span> techniques.
          </p>
        </div>

        <h4>Advanced: Buffs, Debuffs, and Diagnostics</h4>

        <p>
          Sam will teach you that planted crops can apply <strong>buffs</strong> and <strong>debuffs</strong> to nearby plants. He will ask you to plant two
          seeds next to each other and water them so you can observe interactions.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Planted crops in your <span className="text-green-400">Greenhouse</span> apply <span className="text-green-400">buffs</span> and <span className="text-red-400">debuffs</span> to nearby crops!
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Take these <span className="text-gray-400">Seeds x2</span> and plant them next to each other in the <span className="text-green-400">Greenhouse</span>.
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> And don't forget to <span className="text-blue-400">water</span> them!
          </p>
        </div>

        <p>
          Note: there is a known bug where not all seed set-ups register correctly. If Sam doesn't continue after planting the pair, try planting a few
          more seeds nearby and watering them — this usually resolves the issue.
        </p>

        <h4>Claim the Plant Diagnostics Tool</h4>

        <p>
          After the seed exercise Sam will give you the <strong>Plant Diagnostics Tool</strong>, which is essential to visualize how crops affect one another and
          to check growth and water requirements.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Nice! Now that both plants are growing, take this <span className="text-blue-400">Plant Diagnostics Tool</span> to learn how crops are affected by each other.
          </p>

          <p className="text-blue-400">
            <strong>[NPC] Sam:</strong> It's also great for knowing when a crop will <span className="text-green-400">finish growing</span> and for how much <span className="text-blue-400">water</span> it needs!
          </p>
        </div>

        <p>
          <strong>Tip:</strong> Use the Plant Diagnostics Tool regularly to optimize plot layouts and watering schedules. This tool is a core part of Greenhouse
          mechanics.
        </p>

        <h3>Step 9: Mutations — Spread and Harvest</h3>

        <p>
          Once you understand how plants interact, Sam will give you a new objective to <strong>spread a mutation</strong> in the Greenhouse. Mutations are
          special plants that can appear when certain crops are arranged and watered correctly.
        </p>

        <div className="bg-yellow-900 border border-yellow-700 rounded p-4 my-4">
          <p className="text-yellow-300">
            <strong>NEW OBJECTIVE</strong>
            <br />
            Spread a mutation in the Greenhouse
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Hmmmm I think that's right. I watered them too so they grow strong and healthy!
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Wow, it worked!
          </p>

          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> Go ahead and harvest the mutated crop. Right there, in the middle of the wheat!
          </p>
        </div>

        <p>
          After you placed seeds around one empty farmland Sam will water them for you and a mutation should appear shortly.
          When a mutation appears you'll receive another objective to <strong>harvest the mutation</strong>. Harvest the mutated crop as you would any fully-grown
          plant — it often appears visually distinct and may be located inside the patch where you arranged the seeds.
        </p>

        <div className="bg-yellow-900 border border-yellow-700 rounded p-4 my-4">
          <p className="text-yellow-300">
            <strong>NEW OBJECTIVE</strong>
            <br />
            Harvest the mutation in the Greenhouse
          </p>
        </div>

        <p>
          After harvesting the mutation Sam will wrap up the tutorial with some final words of encouragement.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <p className="text-blue-400 mb-2">
            <strong>[NPC] Sam:</strong> You are pretty much a <span className="text-green-400">Greenhouse Expert</span> now!
          </p>

          <p className="text-blue-400">
            <strong>[NPC] Sam:</strong> I taught you all I know about <span className="text-green-400">Greenhouses</span>, you are on your own from now on!
          </p>
        </div>

        <p>
          Mutations drop unique items — for example you should just have received <Link href="/item/DUSTGRAIN">Dustgrain</Link>. Check the Dustgrain item page for Bazaar history,
          current pricing, and demand to decide whether to sell or keep mutation drops.
        </p>

        <div className="bg-green-900 border border-green-700 rounded p-4 my-4">
          <p className="font-semibold">🎉 Congratulations!</p>

          <p className="mt-2">
            You've successfully unlocked and set up your first Greenhouse and completed the Sam tutorial. Your journey to becoming a master farmer has begun.
            Next you should talk to the Carpenter to see stats about your greenhouse and start the journey to unlock all mutations
            Happy farming!
          </p>
        </div>
        <p>
          The best way to profit off of the Hypixel Skyblock Garden v2 Update is to bazaar flip its mutations. See <Link href="/premiumBazaar">Top realtime Bazaar Flips</Link> to find the most profitable mutations to buy and sell. 
        </p>
        <h2>Quick Reference Checklist</h2>

        <div className="bg-slate-900 border border-slate-700 rounded p-4 my-4">
          <ul className="space-y-2">
            <li>☐ Reach Garden Level 7</li>
            <li>☐ Wait for Carpenter visitor to arrive</li>
            <li>☐ Click Carpenter and accept the Blueprint</li>
            <li>☐ Give Blueprint to Sam</li>
            <li>☐ Collect 64 Enchanted Oak Logs</li>
            <li>☐ Collect 128 Enchanted Sand</li>
            <li>☐ Give resources to Sam</li>
            <li>☐ Open the Desk and select a plot</li>
            <li>☐ Convert plot to Greenhouse</li>
            <li>☐ Wait 2 minutes for Greenhouse to be built</li>
            <li>☐ Start planting crops!</li>
            <li>☐ Spread a mutation in the Greenhouse</li>
            <li>☐ Harvest the mutation in the Greenhouse</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
