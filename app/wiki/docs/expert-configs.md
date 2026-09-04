---
title: "Expert Configs"
description: "How to get, load and publish SkyCofl Expert Configs"
order: 9
---

# Expert Configs

## What is an Expert Config?

An Expert Config is a ready-made set of flip filters, blacklists/whitelists and
other mod settings, built and tuned by an experienced SkyCofl player. Loading
one saves you the time of building your own filters from scratch, and you keep
receiving managed updates whenever the creator improves it — see
[Managed updates](#managed-updates) below for how long that lasts.

Some Configs are free. Others have a price in CoflCoins, set by the creator.

## Getting a Config

1. Run `/cofl configs` to browse what's available (or `/cofl configs help` for
   sorting and rating options — see the [command reference](./mod-commands)
   for the full list).
2. Run `/cofl buyconfig <expert name> <config name>` for the one you want,
   whether it's free or paid.
3. If you haven't accepted the current Expert Marketplace agreement yet, the
   mod shows you that prompt first — accept it, then run `buyconfig` again.
4. Review the Expert, version, change notes and price, then click the
   confirmation. A free Config is added immediately; a paid one charges your
   CoflCoins and adds the licence right after. If the confirmation is still
   processing, just run `buyconfig` again — it resumes the same order instead
   of charging you twice.
5. The Config loads automatically once it's added. Full terms for buying
   Configs, including your rights as a buyer, are in the
   [Expert Marketplace terms](https://coflnet.com/legal/expert-marketplace-terms).

### Receiving a gift from a creator

A creator can give you complimentary access with
`/cofl giftconfig <config name> <your ign>` — you'll need to have already
accepted the Expert Marketplace agreement (running `/cofl buyconfig` once
takes care of that). The creator can take a gifted Config back later with
`/cofl takeconfig <config name> <your ign>`, for example if it was shared or
copied against the terms it was given under.

## Managing your configs

- **List what you own:** `/cofl ownconfigs` shows every Config you've added,
  with a clickable **[Load]** button for each.
- **Load or switch:** `/cofl loadconfig <expert name> <config name>` loads a
  Config you already own — this is what the **[Load]** button runs for you.
- **Back up first:** loading a Config overwrites your current filters. Run
  `/cofl backup add <name>` before loading one, so you can restore your own
  setup with `/cofl restore <name>` afterwards if you want it back. See the
  [command reference](./mod-commands) for details.

### Managed updates

Buying or adding a Config gives you a personal licence to that version plus a
5-year managed update facility — while it runs, you automatically receive
newer versions whenever the creator publishes them (they're not obligated to
keep updating it). Coflnet may extend that period by up to 2 more years free
of charge, though an extension isn't guaranteed. `/cofl ownconfigs` shows you
when the update period for each Config ends.

## If a purchase is undone

A refund or chargeback on a Config purchase removes your licence and the
managed copy. Simply opening a payment dispute does not, by itself, remove
anything.

If your payment went through but the Config never showed up, run
`/cofl buyconfig` again first — it safely resumes the same order. Contact
support if it still doesn't appear.

## Want to publish a Config?

Run `/cofl sellconfig <name> [price] [change notes]` to publish your current
filter setup as a Config (leave out the price, or set it to `0`, to publish it
for free). The first time, you'll be asked to accept the current Creator
Marketplace agreement — accept it, then run `sellconfig` again to publish. New
creators apply through the Coflnet Discord. Fees, payout details and the
creator approval process are covered in the
[Creator licence](https://coflnet.com/legal/creator-license).
