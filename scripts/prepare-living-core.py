"""Rebuild D02 sprites from owner references and the two imagegen source plates.

Development tool only: Python + Pillow. Original materials are never modified.
See docs/design/LIVING_CORE_IMPLEMENTATION_PLAN.md for source paths/prompts.
"""
import argparse
from collections import deque
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/living-core/v1"
SIZE = (320, 180)
RESAMPLE = Image.Resampling.NEAREST


def largest_component(mask):
    pixels = mask.load()
    visited, biggest = set(), []
    w, h = mask.size
    for y in range(h):
        for x in range(w):
            if not pixels[x, y] or (x, y) in visited:
                continue
            queue, points = deque([(x, y)]), []
            visited.add((x, y))
            while queue:
                px, py = queue.popleft()
                points.append((px, py))
                for nx, ny in [(px-1, py), (px+1, py), (px, py-1), (px, py+1)]:
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited and pixels[nx, ny]:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
            if len(points) > len(biggest):
                biggest = points
    result = Image.new("L", mask.size)
    for xy in biggest:
        result.putpixel(xy, 255)
    return result


def clean(image, opaque_reference=False):
    # Work on a smaller intermediate grid before removing isolated alpha flecks.
    image = image.convert("RGBA")
    image.thumbnail((180, 180), RESAMPLE)
    if opaque_reference:
        mask = Image.new("L", image.size)
        mask.putdata([255 if r > 85 and r > g * 1.12 and g > b * 1.25 else 0 for r, g, b, _ in image.getdata()])
        mask = largest_component(mask)
        # Flood only the exterior. Enclosed dark eyes/mouth belong to the sprite.
        exterior = Image.new("L", image.size)
        queue = deque([(0, 0)])
        while queue:
            x, y = queue.popleft()
            if not (0 <= x < image.width and 0 <= y < image.height) or exterior.getpixel((x, y)) or mask.getpixel((x, y)):
                continue
            exterior.putpixel((x, y), 255)
            queue.extend([(x-1, y), (x+1, y), (x, y-1), (x, y+1)])
        mask = exterior.point(lambda v: 255-v)
    else:
        mask = largest_component(image.getchannel("A").point(lambda v: 255 if v >= 200 else 0))
    image.putalpha(mask)
    return image.crop(mask.getbbox())


def pixel_sprite(image, size):
    image = image.resize(size, RESAMPLE)
    # No dither or resampling fringe. Fixed 24-color character palette across poses.
    alpha = image.getchannel("A").point(lambda v: 255 if v >= 128 else 0)
    rgb = image.convert("RGB").quantize(palette=CHAR_PALETTE, dither=Image.Dither.NONE).convert("RGBA")
    rgb.putalpha(alpha)
    return rgb


def layer(sprite, x, y):
    result = Image.new("RGBA", SIZE)
    result.alpha_composite(sprite, (x, y))
    return result


def sheet(name, frames):
    result = Image.new("RGBA", (320 * len(frames), 180))
    for index, frame in enumerate(frames):
        result.alpha_composite(frame, (320 * index, 0))
    result.save(OUT / name, optimize=True)


def validate():
    manifest = json.loads((OUT / "manifest.json").read_text())
    for name, asset in manifest["assets"].items():
        image = Image.open(OUT / asset["file"])
        assert image.mode == "RGBA", name
        assert image.size == (320 * asset["frames"], 180), name
        assert image.getchannel("A").getextrema() == (0, 255), name
        assert set(image.getchannel("A").getdata()) <= {0, 255}, name
        for frame in range(asset["frames"]):
            cell = image.crop((frame*320, 0, (frame+1)*320, 180))
            bbox = cell.getbbox()
            assert bbox and all((bbox[0] > 0, bbox[1] > 0, bbox[2] < 320, bbox[3] < 180)), (name, frame, bbox)
            if name.startswith("character"):
                assert bbox[3] == 150, (name, frame, "feet moved", bbox)
                assert 92 <= bbox[0] <= 99 and 168 <= bbox[2] <= 180, (name, frame, bbox)
                if manifest["version"] == "v2" and asset["frames"] > 1:
                    first = image.crop((0, 144, 320, 150))
                    assert cell.crop((0, 144, 320, 150)).tobytes() == first.tobytes(), (name, frame, "foot pixels moved")
    for pose, clip in manifest["clips"].items():
        assert clip["character"] in manifest["assets"], pose
        assert clip["crystal"] in manifest["assets"], pose
        assert clip["fps"] == 0 or 4 <= clip["fps"] <= 8, pose
    if manifest["version"] == "v2":
        # v2 is a retained historical asset version; runtime now binds v3.
        for pose, minimum in [("ready", 4), ("mining", 4)]:
            asset = manifest["assets"][manifest["clips"][pose]["character"]]
            image = Image.open(OUT / asset["file"])
            unique = {image.crop((i*320, 0, (i+1)*320, 180)).tobytes() for i in range(asset["frames"])}
            assert len(unique) >= minimum, (pose, "insufficient distinct motion frames")
    assert set(manifest["clips"]) == {"notConfigured", "ready", "starting", "mining", "miningQuiet", "paused", "stopping", "stopped", "error", "unavailable"}
    print(f"Validated {len(manifest['assets'])} RGBA assets, binary alpha, 320x180 cells, anchored feet and all 10 visual poses.")


def refine():
    """D02B: exact-pixel edits of the delivered art; v1 and owner sources stay intact."""
    global OUT
    original = OUT
    OUT = ROOT / "public/living-core/v2"
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((original / "manifest.json").read_text())

    def read(name):
        return Image.open(original / (name + ".png")).convert("RGBA")

    ready = read("character-ready").crop((0, 0, 320, 180))
    blink = read("character-ready").crop((9*320, 0, 10*320, 180))
    tending = read("character-mining").crop((0, 0, 320, 180))
    # Keep the exact same feet in every animated frame. Only the upper body breathes.
    feet = ready.crop((95, 144, 171, 150))

    def breath(frame, amount=0):
        result = Image.new("RGBA", SIZE)
        torso = frame.crop((95, 70, 171, 144)).resize((76, 74+amount), RESAMPLE)
        result.alpha_composite(torso, (95, 70-amount))
        result.alpha_composite(feet, (95, 144))
        return result

    # Articulated tiny limb from the supplied front sprite; no new mascot artwork.
    hand = ready.crop((162, 127, 171, 140))
    tending.paste((0, 0, 0, 0), (164, 127, 172, 140))

    def tend(reach):
        result = breath(tending)
        draw = ImageDraw.Draw(result)
        draw.line((164, 130, 167+reach, 133-reach*2), fill=(193, 49, 7, 255), width=4)
        draw.line((164, 129, 167+reach, 132-reach*2), fill=(253, 132, 8, 255), width=2)
        result.alpha_composite(hand, (163+reach, 127-reach*2))
        return result

    idle = [breath(ready, d) for d in [0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
    idle[12] = breath(blink)
    sheet("character-ready.png", idle)
    sheet("character-mining.png", [tend(r) for r in [0, 1, 3, 5, 5, 3, 1, 0, 0, 0, 0, 0]])
    sheet("character-starting.png", [breath(ready), breath(ready, -2), breath(ready), tend(0), tend(1), tend(3)])
    sleepy = read("character-stopped")
    # Settle the upper body to the canonical sleepy face without sliding the feet.
    sheet("character-stopping.png", [tend(3), tend(1), tend(0), breath(ready), breath(sleepy), breath(sleepy)])
    for name in ["waiting", "paused", "stopped", "attention", "unavailable"]:
        sheet("character-"+name+".png", [read("character-"+name)])

    backdrop = read("workshop")
    sheet("workshop.png", [backdrop])
    # Bring the cradle within tending reach, lower the shard into its socket and
    # soften the dormant state. No particle layer or independent glow animation.
    def shift(frame, dx, dy):
        result = Image.new("RGBA", SIZE)
        result.alpha_composite(frame, (dx, dy))
        return result
    pedestal = shift(read("pedestal"), -22, 0)
    crystal = shift(read("crystal-lit"), -22, 5)
    dormant = ImageEnhance.Brightness(crystal).enhance(.36)
    sheet("pedestal.png", [pedestal])
    sheet("crystal-lit.png", [crystal])
    sheet("crystal-dormant.png", [dormant])
    shadows = Image.new("RGBA", SIZE)
    draw = ImageDraw.Draw(shadows)
    draw.ellipse((96, 147, 172, 154), fill=(16, 13, 12, 255))
    draw.ellipse((164, 147, 222, 155), fill=(16, 13, 12, 255))
    sheet("shadows.png", [shadows])
    fallback = backdrop.copy()
    for image in [shadows, pedestal, dormant, ready]:
        fallback.alpha_composite(image)
    sheet("scene-fallback.png", [fallback])
    for asset in manifest["assets"].values():
        asset["frames"] = Image.open(OUT / asset["file"]).width // 320
    for name in ["starting", "stopping"]:
        manifest["clips"][name]["fps"] = 6
    manifest["version"] = "v2"
    manifest["artworkStatus"] = "D02B-owner-acceptance-pending"
    manifest["characterSize"] = {"width": 76, "height": 80, "maxWidth": 82, "maxHeight": 82, "groundY": 150}
    manifest["notes"] = "D02B exact-pixel refinement from v1, owner references unchanged. 320x180 RGBA cells; 240px central safe crop (192px at 1x under zoom). Fixed foot pixels at y144..149 for animated clips. Upper-body breath and articulated right-hand reach; no body translation. Ready 4fps/4s, tending 6fps/2s, transitions 6fps/one second. Static first poses; dormant neutral fallback. No event reactions."
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2)+"\n", encoding="utf-8")
    # Vite's public directory is served by URL, not intended for module imports.
    # Bundle the identical generated manifest as a source module for typed clips.
    # v1/v2 are retained sources; prepare-workshop.py owns the runtime v3 manifest.
    contact = Image.new("RGB", (640, 900), (16, 18, 17))
    for i, clip in enumerate(manifest["clips"].values()):
        still = backdrop.copy()
        for image in [shadows, pedestal, crystal if clip["crystal"] == "crystal-lit" else dormant]:
            still.alpha_composite(image)
        still.alpha_composite(Image.open(OUT / manifest["assets"][clip["character"]]["file"]).crop((0, 0, 320, 180)))
        contact.paste(still, ((i % 2)*320, (i // 2)*180))
    contact.save(OUT / "contact-sheet.png")
    validate()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--background", type=Path)
    parser.add_argument("--prop", type=Path)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--refine", action="store_true", help="Build v2 from existing v1 assets (no generated source plates required)")
    args = parser.parse_args()
    if args.check:
        validate()
        OUT = ROOT / "public/living-core/v2"
        validate()
        raise SystemExit
    if args.refine:
        refine()
        raise SystemExit
    if not args.background or not args.prop:
        parser.error("--background and --prop imagegen source paths are required (or use --check)")
    OUT.mkdir(parents=True, exist_ok=True)

    source = ROOT / "ember-squish"
    front_sheet = Image.open(source / "Three-Frame Chibi Flame Sprite Sheet.png")
    ready = clean(front_sheet.crop((0, 0, 724, 724)))
    blink = clean(front_sheet.crop((724, 0, 1448, 724)))
    tending_sheet = Image.open(source / "Six-Frame Pixel Flame Mascot Sprite Sheet.png")
    tending = clean(tending_sheet.crop((0, 120, 362, 580)))
    reference = Image.open(source / "Ember the Squish Character Sheet.png")
    sleepy = clean(reference.crop((540, 445, 752, 670)), True)
    concerned = clean(reference.crop((793, 447, 1000, 674)), True)
    palette_source = Image.new("RGB", (180*5, 180))
    for i, sprite in enumerate([ready, blink, tending, sleepy, concerned]):
        palette_source.paste(sprite.convert("RGB"), (i*180, 0))
    CHAR_PALETTE = palette_source.quantize(colors=24, dither=Image.Dither.NONE)
    ready, blink, tending, sleepy, concerned = [pixel_sprite(im, (76, 80)) for im in [ready, blink, tending, sleepy, concerned]]

    def pose(sprite, height=80, width=76, shift=0):
        return layer(sprite.resize((width, height), RESAMPLE), 133-width//2+shift, 150-height)

    # Feet stay at y=150. One logical pixel of breath, with a brief blink at rest.
    idle = [pose(ready, 80 + delta) for delta in [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]]
    idle[9], idle[10] = pose(blink), pose(blink)
    sheet("character-ready.png", idle)
    sheet("character-mining.png", [pose(tending, 80+d, 76, s) for d, s in [(0,0), (0,0), (1,0), (1,1), (0,1), (0,0), (0,0), (0,0)]])
    sheet("character-starting.png", [pose(ready if i < 3 else tending, 80 + (1 if 2 <= i <= 5 else 0), 76, 0) for i in range(8)])
    sheet("character-stopping.png", [pose(tending if i < 3 else ready if i < 5 else sleepy) for i in range(8)])
    sheet("character-waiting.png", [pose(ready)])
    sheet("character-paused.png", [pose(blink)])
    sheet("character-stopped.png", [pose(sleepy)])
    sheet("character-attention.png", [pose(concerned)])
    sheet("character-unavailable.png", [pose(ready)])

    # Pixelize and quieten the generated background; binary perimeter alpha blends
    # into the graphite DOM backdrop without any blurred or scaled sprite edges.
    backdrop = Image.open(args.background).convert("RGB").resize(SIZE, RESAMPLE)
    backdrop = ImageEnhance.Brightness(backdrop).enhance(.64).quantize(colors=24, dither=Image.Dither.NONE).convert("RGBA")
    backdrop.putalpha(Image.new("L", SIZE))
    mask = Image.new("L", SIZE)
    ImageDraw.Draw(mask).rounded_rectangle((1, 1, 318, 178), radius=5, fill=255)
    backdrop.putalpha(mask)
    backdrop.save(OUT / "workshop.png", optimize=True)

    prop = Image.open(args.prop).convert("RGBA")
    crystal = clean(prop.crop((210, 65, 800, 1110)))
    pedestal = clean(prop.crop((200, 1110, 810, 1510)))
    # Prop palette is separate from the character so the machinery stays graphite.
    def prop_sprite(image, size):
        image = image.resize(size, RESAMPLE)
        alpha = image.getchannel("A").point(lambda v: 255 if v >= 128 else 0)
        image = image.convert("RGB").quantize(colors=16, dither=Image.Dither.NONE).convert("RGBA")
        image.putalpha(alpha)
        return image

    pedestal = layer(prop_sprite(pedestal, (54, 30)), 188, 121)
    crystal = layer(prop_sprite(crystal, (34, 66)), 198, 54)
    crystal_dim = ImageEnhance.Brightness(crystal).enhance(.48)
    sheet("pedestal.png", [pedestal])
    sheet("crystal-lit.png", [crystal])
    sheet("crystal-dormant.png", [crystal_dim])
    shadows = Image.new("RGBA", SIZE)
    draw = ImageDraw.Draw(shadows)
    draw.ellipse((96, 147, 172, 154), fill=(16, 13, 12, 255))
    draw.ellipse((186, 147, 244, 155), fill=(16, 13, 12, 255))
    sheet("shadows.png", [shadows])

    assets = {}
    for path in sorted(OUT.glob("*.png")):
        if path.name in {"scene-fallback.png", "contact-sheet.png"}:
            continue
        image = Image.open(path)
        assets[path.stem] = {"file": path.name, "frames": image.width // 320, "cellWidth": 320, "cellHeight": 180, "anchor": [0, 0]}
    clips = {}
    for name, character, lit, fps, loop in [
        ("notConfigured", "waiting", False, 0, False), ("ready", "ready", False, 4, True),
        ("starting", "starting", False, 8, False), ("mining", "mining", True, 6, True),
        ("miningQuiet", "unavailable", False, 0, False), ("paused", "paused", False, 0, False),
        ("stopping", "stopping", False, 8, False), ("stopped", "stopped", False, 0, False),
        ("error", "attention", False, 0, False), ("unavailable", "unavailable", False, 0, False),
    ]:
        clips[name] = {"character": "character-"+character, "crystal": "crystal-lit" if lit else "crystal-dormant", "fps": fps, "loop": loop}
    fallback = backdrop.copy()
    for image in [shadows, pedestal, crystal_dim, pose(ready)]:
        fallback.alpha_composite(image)
    sheet("scene-fallback.png", [fallback])
    assets["scene-fallback"] = {"file": "scene-fallback.png", "frames": 1, "cellWidth": 320, "cellHeight": 180, "anchor": [0, 0]}
    manifest = {
        "version": "v1", "artworkStatus": "prototype-owner-review-pending", "canvas": {"width": 320, "height": 180},
        "reference": "ember-squish/Ember the Squish Character Sheet.png",
        "sources": ["ember-squish/Three-Frame Chibi Flame Sprite Sheet.png", "ember-squish/Six-Frame Pixel Flame Mascot Sprite Sheet.png", "ember-squish/Ember the Squish Character Sheet.png", "imagegen workshop and crystal/pedestal plates; see implementation documentation"],
        "notes": "Horizontal RGBA sheets. Full-scene cells share origin [0,0]. Feet anchored at y=150. Binary alpha and nearest-neighbour sampling. Character palette: 24 colors. Starting/stopping are one-shot; other non-static clips loop. No event reactions. Static fallback is neutral with a dormant crystal.",
        "baseLayers": ["workshop", "shadows", "pedestal"], "fallback": "scene-fallback.png", "assets": assets, "clips": clips,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2)+"\n", encoding="utf-8")
    validate()
    contact = Image.new("RGB", (640, 180*5), (16, 18, 17))
    for i, clip in enumerate(clips.values()):
        still = backdrop.copy()
        for image in [shadows, pedestal, crystal if clip["crystal"] == "crystal-lit" else crystal_dim]:
            still.alpha_composite(image)
        frame = Image.open(OUT / assets[clip["character"]]["file"]).crop((0, 0, 320, 180))
        still.alpha_composite(frame)
        contact.paste(still, ((i % 2)*320, (i // 2)*180))
    contact.save(OUT / "contact-sheet.png")
