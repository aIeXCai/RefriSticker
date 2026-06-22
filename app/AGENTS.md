# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

The confirmed template source of truth is `/var/folders/bn/61rtkld10mx6zykws10ps7800000gn/T/codex-clipboard-91f279c6-03da-4579-a2ec-7e3f02502a58.png`. User output supports three fixed front-end templates: a white caption band, a dark integrated caption band, and a thin-frame collector card. Their warm-ivory frame, dark keylines, small corner radii, condensed uppercase title, compact uppercase subtitle, proportions, and spacing must match that reference. Preview and downloaded output must use the same template rules.

The three style-selection previews must be visibly distinct while using the same travel-scene composition: `illustration` is a flat mid-century destination-magnet illustration with simplified geometric shapes and bold outlines; `chinese` is unmistakable Chinese shui-mo ink wash with xuan-paper texture and restrained mineral color; `comic` uses crisp black linework, bright flat color, and cel-shaded hard shadows. Do not use three near-photographic variations of the same rendering style.

User-generated, editor-preview, and downloaded stickers always use normal regular outlines. Never apply an organic or die-cut silhouette to generated user output.

Only the homepage result showcase uses an organic die-cut magnet. It is a dedicated static product-mockup image matching `reference-design.png`, not a CSS-generated shape and not part of the user-generation pipeline.
