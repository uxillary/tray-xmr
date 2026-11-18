"""D03C production normalization of imagegen plates; owner references stay intact.

This asset build crops the four generated cells, aligns their baselines, quantizes
to a small shared palette and samples onto the runtime pixel grid. No AI claims
of exact sheet geometry are trusted. Requires Pillow, like the existing pipeline.
"""
import argparse
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/living-core/v3"
NEAREST = Image.Resampling.NEAREST


def validate():
    manifest = json.loads((OUT / "manifest.json").read_text())
    assert manifest == json.loads((ROOT / "src/livingCoreManifest.json").read_text())
    for name, asset in manifest["assets"].items():
        image = Image.open(OUT / asset["file"])
        assert image.mode == "RGBA", name
        assert image.size == (asset["cellWidth"] * asset["frames"], asset["cellHeight"]), name
        assert set(image.getchannel("A").getdata()) <= {0, 255}, name
    sprite = Image.open(OUT / "character.png")
    for i in range(4):
        bbox = sprite.crop((i*32, 0, (i+1)*32, 32)).getbbox()
        assert bbox and bbox[3] == 32 and 28 <= bbox[3] - bbox[1] <= 32, bbox
    assert len({sprite.crop((i*32, 0, (i+1)*32, 32)).tobytes() for i in range(4)}) == 4
    assert (ROOT / "public/living-core/v2/scene-fallback.png").exists()
    print("Validated v3: 4 distinct 32px poses, shared ground, binary alpha, layers and fallback.")


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(ROOT / "docs/design/d03c-sources/squish.png").convert("RGBA")
    palette = source.convert("RGB").quantize(colors=24)
    sheet = Image.new("RGBA", (128, 32))
    for i in range(4):
        cell = source.crop((i*source.width//4, 0, (i+1)*source.width//4, source.height))
        cell.putalpha(cell.getchannel("A").point(lambda a: 255 if a >= 160 else 0))
        cell = cell.crop(cell.getbbox()).resize((28, 32), NEAREST)
        alpha = cell.getchannel("A")
        cell = cell.convert("RGB").quantize(palette=palette, dither=Image.Dither.NONE).convert("RGBA")
        cell.putalpha(alpha)
        sheet.alpha_composite(cell, (i*32+2, 0))
    sheet.save(OUT / "character.png")
    background = Image.open(ROOT / "docs/design/d03c-sources/workshop.png").convert("RGB").resize((320, 144), NEAREST)
    background = background.quantize(colors=48, dither=Image.Dither.NONE).convert("RGBA")
    background.save(OUT / "workshop.png")
    for name in ["pedestal", "crystal-dormant", "crystal-lit"]:
        source = Image.open(ROOT / f"public/living-core/v2/{name}.png").convert("RGBA")
        sprite = source.crop(source.getbbox())
        sprite.thumbnail((24, 28) if name.startswith("crystal") else (28, 12), NEAREST)
        layer = Image.new("RGBA", (320, 144))
        layer.alpha_composite(sprite, (230-sprite.width//2, (108 if name.startswith("crystal") else 120)-sprite.height))
        layer.save(OUT / f"{name}.png")
    fallback = background.copy()
    for name in ["pedestal", "crystal-dormant"]:
        fallback.alpha_composite(Image.open(OUT / f"{name}.png"))
    fallback.alpha_composite(sheet.crop((0, 0, 32, 32)), (62, 86))
    fallback.save(OUT / "scene-fallback.png")
    assets = {name: {"file": f"{name}.png", "frames": 4 if name == "character" else 1,
                     "cellWidth": 32 if name == "character" else 320, "cellHeight": 32 if name == "character" else 144,
                     "anchor": [0, 0]} for name in ["workshop", "pedestal", "crystal-lit", "crystal-dormant", "character", "scene-fallback"]}
    poses = ["notConfigured", "ready", "starting", "mining", "miningQuiet", "paused", "stopping", "stopped", "error", "unavailable"]
    manifest = {"version": "v3", "artworkStatus": "D03C-owner-review-pending", "canvas": {"width": 320, "height": 144},
                "reference": "ember-squish/Ember the Squish Character Sheet.png", "baseLayers": ["workshop", "pedestal"],
                "fallback": "scene-fallback.png", "assets": assets,
                "clips": {pose: {"character": "character", "crystal": "crystal-lit" if pose == "mining" else "crystal-dormant", "fps": 4 if pose in ["ready", "starting", "mining", "stopping"] else 0, "loop": True} for pose in poses},
                "characterSize": {"width": 32, "height": 32, "maxWidth": 32, "maxHeight": 32, "groundY": 118},
                "notes": "Dedicated simplified imagegen sprite normalized to 32px with four poses. Bounded 4fps DOM movement; no per-result reactions. Source plates and limitations: docs/design/D03C_WORKSPACE.md."}
    encoded = json.dumps(manifest, indent=2)+"\n"
    (OUT / "manifest.json").write_text(encoded, encoding="utf-8")
    (ROOT / "src/livingCoreManifest.json").write_text(encoded, encoding="utf-8")
    validate()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    if parser.parse_args().check:
        validate()
    else:
        build()
