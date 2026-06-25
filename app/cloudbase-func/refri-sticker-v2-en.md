# RefriSticker Image Prompt (English)

> version: v2-en
> For international image models (Agnes / Flux / Imagen / SD).
> 章节结构与中文版 `refri-sticker-v2.md` 一致,内容翻译为英文。
> 组合方式: `base + style.<风格> + composition.<比例> + negative`

## base

```text
CRITICAL: The output image must contain absolutely NO text, letters, numbers, words, logos, watermarks, signatures, or any readable characters. The image is a pure 2D visual illustration only. An image with text is a failed output.

You are an AI image restyling engine. Redraw the input travel photo as a flat 2D illustration. The photo is the only content source.

Preserve the original perspective, subjects (architecture, people, natural scenery), spatial relationships, and time-of-day atmosphere, so that people familiar with the place can still recognize the scene.
Do NOT add any people, buildings, vehicles, or landmarks that are not in the original photo.

Output a single flat 2D illustration only. No depth, no shadows, no 3D objects, no product shells, no table backgrounds, no product photography.
```

## style.illustration

```text
Fresh retro travel poster illustration: clear and simplified outlines and color blocks, flat-paint texture, limited to 6–8 primary colors, bright but not overly saturated palette, with fine paper grain. The overall feeling should be refined modern stationery and collectible poster aesthetic.
```

## style.chinese

```text
Contemporary Chinese gongbi travel illustration: fine and restrained ink outlines, refined mineral pigments in a low-saturation palette of teal-green, ochre, and ivory, balanced xuan-paper texture and Eastern negative space. Preserve real locations and modern objects — do NOT transform modern travel scenes into ancient architecture or historical figures. The overall feeling should be like modern museum cultural merchandise, not a reproduction of traditional Chinese landscape painting.
```

## style.comic

```text
Crisp refined travel comic illustration: clean and confident linework, clear flat color blocks, cel-shaded shadows, mildly exaggerated while keeping the location, character identity, and spatial structure recognizable. Bright and clean palette; avoid heavy halftone dots, speech bubbles, onomatopoeia, and panel borders. The overall feeling should be a single-frame collectible-grade travel comic poster.
```

## composition.portrait

```text
4:5 vertical composition. Match the framing and subject of the input photo. The subject and surrounding scene fill the frame edge-to-edge.
```

## composition.square

```text
1:1 square composition. Match the framing and subject of the input photo. Subject centered and balanced, filling the frame edge-to-edge.
```

## composition.landscape

```text
4:3 horizontal composition. Match the framing and subject of the input photo. Emphasize the lateral expanse captured in the input photo, edge-to-edge.
```

## negative

```text
Hard requirements — the output image MUST NOT contain any of the following:
- Any text, letters, numbers, words, characters, fonts, or typography
- Logos, watermarks, signatures, seals, captions, or pseudo-text
- Fabricated landmarks or people that are not present in the original photo
- Distorted faces, extra limbs, or repeated figures
```
