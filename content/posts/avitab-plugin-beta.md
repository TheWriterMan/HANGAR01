---
title: "Checklists for X-Plane's AviTab Plugin (Beta)"
description: 'HANGAR01 checklists now run inside X-Plane on the AviTab tablet, in Quick, Normal or Full mode. The free plugin is in public beta. Here is how to install it.'
slug: 'avitab-plugin-beta'
date: '2026-05-30T12:00:00.000Z'
category: 'News'
timage: '/images/news/avitab-plugin-beta/featured.jpg'
bannerImage: ''
imageAltText: 'X-Plane flight simulator logo'
tags: []
---

HANGAR01 checklists are now available directly inside X-Plane via the AviTab tablet. This is a community-requested feature currently in public beta.

:::warning
This is a beta release. The plugin works but has not been tested on all aircraft or X-Plane configurations. Report issues on GitHub.
:::

## **What it does**

The plugin adds a Hangar01 app to the AviTab launcher. It connects to the same checklist data that powers this website. Select an aircraft, pick a detail level (Quick, Normal, or Full), and work through the checklist in VR or on your screen without leaving the cockpit.

## **Installation**

:::info
If you already have AviTab installed, you only need to replace one file. Your settings, charts, and preferences are not affected.
:::

Download the zip for your platform from the [releases page](https://github.com/hobi-design/avitab-hangar01/releases/latest) and extract it.

### New AviTab install

Copy the Avitab folder from the zip into your X-Plane plugins directory:

```plaintext
X-Plane/Resources/plugins/Avitab/
```

### Updating an existing AviTab install

Replace the plugin binary for your platform. The file is inside the zip at the same relative path:

```plaintext title=File to replace
macOS:   Avitab/mac_x64/Avitab.xpl
Windows: Avitab/win_x64/Avitab.xpl
Linux:   Avitab/lin_x64/Avitab.xpl
```

Do not delete your existing Avitab folder. Your charts and settings are stored there and will not be touched by the update.

## **Usage**

Once installed:

1. Open AviTab in X-Plane (Plugins menu or assigned key binding).

1. Tap the Hangar01 icon in the launcher.

1. Select an aircraft. The checklist loads live from the HANGAR01 API.

1. Use Quick / Normal / Full to filter by detail level.

1. Tap items to check them off. Items marked (i) show additional info at the bottom.

## **Source & Feedback**

The plugin is open source (AGPL-3.0). Source, builds, and issue tracker are on [GitHub](https://github.com/hobi-design/avitab-hangar01).

:::success
Found a bug or have a suggestion? Open an issue on the GitHub repo or reach out via the contact page on this site.
:::
