---
title: 'FlyByWire A320neo: Cold and Dark to Engine Start'
description: 'Power up the FlyByWire A32NX in MSFS from cold and dark, align the IRS, set up the FCU and start both engines. Short steps with a checklist after each one.'
slug: 'a320-cold-and-dark-to-engine-start'
date: '2026-09-28T10:00:00.000Z'
category: 'Tutorial'
status: 'draft'
timage: '/images/news/a320-cold-and-dark-to-engine-start/a320-featured-cyan.webp'
bannerImage: '/images/news/a320-cold-and-dark-to-engine-start/a320-featured-cyan.webp'
imageAltText: 'Top view of an A320neo with rings around engine 2 as it starts'
tags: []
---

A cold and dark A320 has about forty switches between you and a running engine. Most of them follow one rule: work the overhead from top to bottom, left to right, and turn off every white light. This guide takes the FlyByWire A32NX from dark cockpit to both engines stable, in the order a crew would do it.

Allow fifteen minutes the first time. Most of that is waiting for the IRS.

![A320neo from above with the start order: 1 batteries, 2 external power, 3 APU then APU bleed, 4 engine 2 first, 5 engine 1](/images/news/a320-cold-and-dark-to-engine-start/a320-start-order-cyan.webp)

## 1. Get electrical power

Batteries first, then ground power, then the APU. Once the APU shows AVAIL, it takes over from ground power and supplies bleed air for the engine start.

:::checklist Power-Up
Gear | DOWN
Parking Brake | SET
Battery 1+2 | ON | Check each battery reads above 25.5 V on the ELEC page before switching on
External Power | ON
APU | START | Press MASTER SW, wait a few seconds, then START
APU Bleed | ON | Only once the APU shows AVAIL
:::

## 2. Align the IRS

Turn all three ADIRS knobs to NAV now. Alignment runs in the background while you do everything else. In the EFB you can set it to instant, but a realistic alignment is a good habit if you ever fly on a network.

:::checklist Overhead Flow
ADIRS | NAV | All three. Alignment takes several minutes depending on latitude
Fuel Pumps | ON
Oxygen Crew Supply | ON
Probe Window Heat | AUTO
Emergency Exit Lights | ARM
Seatbelt Sign | ON
:::

When you're done, the overhead should have no white lights left. A white light on an Airbus switch means it's off when it shouldn't be.

## 3. Program the MCDU

Enter the route, performance data and takeoff speeds. SimBrief import through the EFB saves typing. At the end, V1, VR and V2 should appear on the PERF TAKEOFF page and the speed tape.

:::checklist Glareshield
Altimeters | SET QNH
Flight Directors | ON
FCU Altitude | SET | Your initial cleared altitude
Transponder | STBY
:::

## 4. Before start

Close the doors and turn on the beacon. The beacon tells ground crew the engines are about to run, so it's the last thing before start.

:::checklist Before Start
Doors | CLOSED
Beacon | ON
Thrust Levers | IDLE
Parking Brake | VERIFY SET
APU Bleed | VERIFY ON
:::

## 5. Start the engines

Engine 2 goes first. It powers the yellow hydraulic system, which also runs the parking brake accumulator and nosewheel steering. The start is automatic once you select IGN/START and switch a master on.

:::checklist Engine Start
ENG Mode | IGN/START
Engine Master 2 | ON
Engine 2 Parameters | MONITOR | N2, fuel flow, then EGT rising. Wait for AVAIL on the ECAM
Engine Master 1 | ON
Engine 1 Parameters | MONITOR
ENG Mode | NORM
:::

With both engines stable, turn the APU bleed off, then the APU. You're ready for the after start flow. The full [A320 checklist](/aircraft/a320) picks up from here through to shutdown.
