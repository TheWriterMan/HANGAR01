---
title: 'HANGAR01 is Open Source!'
description: 'All checklists and everything behind HANGAR01 are now open source on GitHub – contribute away!'
slug: 'hangar01-is-open-source'
date: '2026-11-08T12:00:00.000Z'
category: 'News'
status: 'draft'
timage: '/images/news/mods-this-week-2026-10-12/news-night-landing.webp'
bannerImage: '/images/news/mods-this-week-2026-10-12/news-night-landing.webp'
imageAltText: 'Long exposure of an airliner landing at night, its lights drawn into one streak down to the runway'
imageCredit: 'Photo: John Murphy, CC BY-SA 2.0, via Wikimedia Commons'
imageCreditUrl: 'https://commons.wikimedia.org/wiki/File:ATL_RWY_27L_Landing_(13205517103).jpg'
tags: []
---

In the [first post](/news/hangar01-v1-is-live), I said keeping the checklists accurate would become more of a community effort. As of today, it is.

Everything that runs this site is now public at [github.com/TheWriterMan/HANGAR01](https://github.com/TheWriterMan/HANGAR01): the code, the checklists and every post (this one included).

There are almost 4,000 checklist items on the site, and I'm sure some of them are still wrong. Now you can fix them yourself.

## Report a mistake

Found a wrong item? Hit **Report Inaccuracy** on the checklist page. You still don't need an account.

Your report now becomes a public GitHub issue, and the form hands you its link straight away so you can watch the fix happen. Your text shows up on the issue once it passes a spam check, which usually takes a minute or two.

The email field is optional. If you add your email, it comes only to me and never appears on GitHub.

## Send a new checklist

Fly something that isn't on the site? Send me the whole checklist. You don't need to write a line of code (or know what JSON is).

You'll need a Google account to copy the Sheet and a free GitHub account to open the issue.

1. Open the [sample checklist Sheet](https://docs.google.com/spreadsheets/d/1FOwrMW12GnBehLL55yKaKO_LF_Dew_CfiF2zfGhlkb4/copy) and make a copy. It comes filled in with a short Cessna 172 checklist, and the "How to fill this in" tab explains each column.
2. Replace the example rows with your aircraft's items, one row per item, in the order you do them in the sim.
3. Download it as a CSV (File > Download > Comma-separated values).
4. Open a [New checklist issue](https://github.com/TheWriterMan/HANGAR01/issues/new?template=new-checklist.yml), attach the CSV, and say which add-on, version and sim you flew it in.

I turn your CSV into a checklist and credit you on GitHub when it's added.

## Edit a checklist on GitHub

If you're already at home on GitHub, skip the Sheet. Each checklist is one JSON file in `content/checklists/`, so most fixes are a one-file pull request.

The [contributing guide](https://github.com/TheWriterMan/HANGAR01/blob/main/CONTRIBUTING.md) lists the checks to run first. The [checklist guide](https://github.com/TheWriterMan/HANGAR01/blob/main/docs/checklist-guide.md) explains the format and which items belong in Quick, Normal and Full.

## Licenses

The code is under the [MIT License](https://github.com/TheWriterMan/HANGAR01/blob/main/LICENSE), so you can do almost anything with it as long as the license notice stays.

The checklists and posts are under [CC BY-NC 4.0](https://github.com/TheWriterMan/HANGAR01/blob/main/content/LICENSE.md). Share them and adapt them for anything non-commercial, as long as you credit HANGAR01, link the license and say if you changed them.

Aircraft photos and add-on names belong to their owners and aren't covered by either license.

Selling the checklists or posts, or using them in a paid product needs my written permission first – ask me through the [contact form](/contact).
