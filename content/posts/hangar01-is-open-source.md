---
title: 'HANGAR01 is Open Source'
description: 'The code, all 29 checklists and every post behind HANGAR01 are now public on GitHub and free to reuse. Here is how to report a mistake or send a new checklist.'
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

When HANGAR01 launched, I said keeping the checklists accurate would become a community effort. As of today, everything that runs the site is public at [github.com/TheWriterMan/HANGAR01](https://github.com/TheWriterMan/HANGAR01): the code, all 29 checklists and every post on this site. Anyone can read it, correct it or build on it.

## Report a mistake

The quickest way to fix a checklist is still the Report Inaccuracy button on every checklist page, and it needs no account. What has changed is where a report goes. It now opens a public GitHub issue, and the form shows you its link straight away so you can follow the fix. Your text appears there once it passes a spam check, usually within a minute or two. If you add your email for a reply, it comes only to me and never appears on GitHub.

## Send a new checklist from a spreadsheet

Adding an aircraft needs only Google Sheets, because the people who know an add-on best are the ones who fly it every week, and they have no reason to learn a file format to share what they know.

1. Open the [sample checklist Sheet](https://docs.google.com/spreadsheets/d/1FOwrMW12GnBehLL55yKaKO_LF_Dew_CfiF2zfGhlkb4/copy) and make your own copy. It comes filled in with a short Cessna 172 checklist, and its "How to fill this in" tab explains each column.
2. Replace the example rows with your aircraft's items, in the order you do them in the sim.
3. Download your sheet as a CSV file (File, Download, Comma-separated values).
4. Open a [New checklist issue](https://github.com/TheWriterMan/HANGAR01/issues/new?template=new-checklist.yml), attach the CSV, and say which add-on, version and sim you flew it in.

Copying the Sheet needs a Google account, and opening the issue needs a free GitHub account. I turn what you send into a checklist and credit you on GitHub when it's added.

## Fix a checklist on GitHub

If you're comfortable with GitHub, you can edit a checklist directly. Each one is a JSON file in `content/checklists/`, so a wrong, missing or out-of-order item is usually a change to one file, sent as a pull request. The [contributing guide](https://github.com/TheWriterMan/HANGAR01/blob/main/CONTRIBUTING.md) lists the checks to run first, and the [checklist guide](https://github.com/TheWriterMan/HANGAR01/blob/main/docs/checklist-guide.md) explains the format and which items go in the Quick, Normal and Full views.

## Security problems

If you find a security problem, such as a leaked key or a way to abuse one of the forms, report it privately from the repository's Security tab rather than in a public issue. [SECURITY.md](https://github.com/TheWriterMan/HANGAR01/blob/main/SECURITY.md) has the details.

## Reusing the checklists

The code is under the [MIT License](https://github.com/TheWriterMan/HANGAR01/blob/main/LICENSE), and the checklists and posts are under [CC BY 4.0](https://github.com/TheWriterMan/HANGAR01/blob/main/content/LICENSE.md). Both allow any use, commercial use included, as long as you credit HANGAR01 and keep the licence notice, and each licence file has the exact terms. Aircraft photos and add-on names belong to their owners and aren't covered by either.
