# Contributing to HANGAR01

Thanks for helping. Fixes to existing checklists are the most useful contribution.

## Report a problem

Use **Report Inaccuracy** on any checklist on [hangar01.space](https://www.hangar01.space), or open a [checklist error issue](https://github.com/TheWriterMan/HANGAR01/issues/new?template=checklist-error.yml) with the aircraft, the phase and the item. For a security problem, follow [SECURITY.md](SECURITY.md) instead of opening an issue.

## Send a new checklist without writing JSON

1. Open the [sample checklist Sheet](https://docs.google.com/spreadsheets/d/1FOwrMW12GnBehLL55yKaKO_LF_Dew_CfiF2zfGhlkb4/copy) and make your own copy. Its "How to fill this in" tab explains each column.
2. Replace the example rows with your aircraft's items, one row per item, in the order you do them in the sim.
3. Download it as a CSV file (File > Download > Comma-separated values).
4. Open a [New checklist issue](https://github.com/TheWriterMan/HANGAR01/issues/new?template=new-checklist.yml), attach the CSV, and say which add-on and version you flew it in.

A maintainer turns it into the JSON file and credits you in the pull request.

## Fix or add a checklist in JSON

1. Read the [Checklist Guide](docs/checklist-guide.md). It covers the JSON shape, the three views (quick, normal, full) and the writing style.
2. Edit or add `content/checklists/<slug>.json`. Keep every existing item `id` as it is; users' progress is saved against it.
   A new aircraft also needs its photo in `public/images/aircraft/`: `<slug>.webp` (up to 1280 px wide), `<slug>-640.webp` and `og/<slug>.jpg` (1200×630).
3. Run the checks:

   ```bash
   npm install
   npm run validate:checklists
   npm test
   ```

4. Open a pull request against `dev`. Say which add-on and version you tested in the sim.

Checklists are for simulator add-ons, not real aircraft: values should match the add-on, not a real-world manual.

## Code changes

- Follow [DESIGN.md](DESIGN.md) for styling. Interactive elements must work with a keyboard and a screen reader (WCAG 2.1 AA). `npm run test:a11y` runs the automated checks.
- Before opening a pull request, run `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test` and `npm run build`. CI runs the same checks.
- Open pull requests against `dev`. `main` is the live site.

## License

By contributing, you agree that code is licensed under the MIT License and checklist and post content under CC BY-NC 4.0 (see the [README](README.md#license)).
