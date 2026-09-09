from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'module-manifest.json').read_text(encoding='utf-8'))
html=(ROOT/'index.html').read_text(encoding='utf-8')
for rel in manifest['css']:
    tag=f'<link rel="stylesheet" href="{rel}">'
    css=(ROOT/rel).read_text(encoding='utf-8')
    html=html.replace(tag,f'<style data-source="{rel}">\n{css}\n</style>')
for rel in manifest['js']:
    tag=f'<script src="{rel}"></script>'
    js=(ROOT/rel).read_text(encoding='utf-8')
    html=html.replace(tag,f'<script data-source="{rel}">\n{js}\n</script>')
out=ROOT/'build'/f"Unmanaged_Chaos_League_Companion_2026_v{manifest['version']}.html"
out.write_text(html,encoding='utf-8')
print(out)
