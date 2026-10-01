**Kickoff prompt — Map Maker**

> Read CLAUDE.md and PLAN.md in this folder first — they define the stack, architecture rules, and milestones for a local US state map tool. Follow them exactly.
>
> Build the app milestone by milestone, M1 through M7. After each milestone, run `npm run build` to confirm zero TypeScript errors, tick the checkbox in PLAN.md, and give me a one-line status before moving on. Don't stop between milestones unless something is blocked or a decision isn't covered by the docs — if so, ask me.
>
> The non-negotiables: the preview and the export must come from the same SVG render function; stroke widths are defined in 2160px export space so the preview is a true scaled representation; and the PNG export must be exactly 2160×2160 with a transparent background. In M5, actually verify the exported PNG's dimensions and alpha channel with the check script — don't assume it's right.
>
> Before hardcoding the state filter in M2, inspect us-atlas/states-10m.json and confirm which FIPS codes it contains, then confirm the filtered set is exactly 50 states.
>
> I'm a brand designer, so keep the UI clean and minimal: a dark neutral controls panel on the right, compact grouped controls, color pickers paired with editable hex fields, and a checkerboard behind the map preview to show transparency. When everything's done, write a short README with how to run it on Windows, and tell me the command to start it.
