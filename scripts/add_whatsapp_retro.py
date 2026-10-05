"""One-off: adds the 8 jerseys from 'fotos whatsapp' (7 retro + Ajax 25/26) to the catalog.
Converts photos to webp, clones product pages from existing ones, updates category index,
search-index.json, sitemap.xml and data/clasificados.json."""
import json, os, re, urllib.parse
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = r"C:\Users\Fede\Desktop\fotos whatsapp"
files = sorted(f for f in os.listdir(SRC) if f.lower().endswith(".jpeg"))
PRICE = 48000

P = [
 dict(slug="ajax-away-95-96", name="Ajax Alternativa 95/96", section="retro", order=[1,5,0,9],
      desc="Camiseta retro del Ajax, alternativa 1995/96: azul con cuello negro y vivos blancos, escudo bordado y auspicio ABN AMRO. Diseño Umbro de los 90."),
 dict(slug="manchester-united-away-99-00", name="Manchester United Alternativa 99/00", section="retro", order=[29,3,2,16],
      desc="Camiseta retro del Manchester United, alternativa 1999/00: azul marino con rayas finas blancas, cuello negro y auspicio Sharp. Diseño Umbro."),
 dict(slug="arsenal-away-95-96", name="Arsenal Alternativa 95/96", section="retro", order=[7,15,6,4],
      desc="Camiseta retro del Arsenal, alternativa 1995/96: dos tonos de azul con el famoso diseño de rayos y auspicio JVC. Edición Nike de la temporada del debut de Bergkamp."),
 dict(slug="chelsea-away-98-00", name="Chelsea Alternativa 98/00", section="retro", order=[10,21,8,11,19],
      desc="Camiseta retro del Chelsea, alternativa 1998/00: blanca con cuello azul, escudo CFC y auspicio Autoglass. Diseño Umbro."),
 dict(slug="manchester-united-away-00-01", name="Manchester United Alternativa 00/01", section="retro", order=[22,12,13,24,28],
      desc="Camiseta retro del Manchester United, alternativa 2000/01: blanca con cuello y paneles azul marino en las mangas y auspicio Vodafone. Diseño Umbro."),
 dict(slug="tottenham-away-94-95", name="Tottenham Alternativa 94/95", section="retro", order=[23,17,14,32],
      desc="Camiseta retro del Tottenham, alternativa 1994/95: azul grisáceo con estampa violeta, cuello con vivos blancos y auspicio Holsten. Diseño Umbro."),
 dict(slug="inglaterra-away-euro-96", name="Inglaterra Alternativa Eurocopa 96", section="retro", order=[31,20,27],
      desc="Camiseta retro de Inglaterra, alternativa de la Eurocopa 1996: la famosa gris azulada a bandas con cuello de vivos rojos y escudo de los Tres Leones. Diseño Umbro."),
 dict(slug="ajax-home-25-26-amsterdam", name="Ajax Titular 25/26 · Amsterdam 750", section="clubes", league="resto-del-mundo", order=[25,18,30,26],
      desc="Camiseta titular del Ajax 25/26: franja central roja entre paneles blancos, cruces de San Andrés de Ámsterdam en el cuello y auspicio Ziggo."),
]
assert sorted(i for p in P for i in p["order"]) == list(range(len(files))), "photo grouping must cover every photo once"


def pre(p):
    return "../../../" if p.get("league") else "../../"


def wa_url(p):
    t = f"Hola! Me interesa la camiseta {p['name']}, ¿tienen stock?"
    return "https://wa.me/5493412025376?text=" + urllib.parse.quote(t, safe="!")


def card(p):
    href = f"../../tienda/{p['section']}/{p['league'] + '/' if p.get('league') else ''}{p['slug']}.html"
    retro = p["section"] == "retro"
    return f'''      <article class="product-card reveal" data-quality="player">
        <a class="product-media product-link" href="{href}">
          <img src="../../assets/tienda/{p['section']}/{p['slug']}/1.webp" alt="{p['name']}" loading="lazy" width="800" height="800">
        </a>
        <div class="product-body">
          <p class="product-tag">{'Retro' if retro else 'Clubes'}</p>
          <p class="product-price">$48.000</p>
          <h3><a href="{href}">{p['name']}</a></h3>
          <p>{'Retro · Importada.' if retro else 'Importada.'}</p>
          <a href="{href}" class="btn btn-primary-sm">Ver producto</a>
          <a href="{wa_url(p)}" target="_blank" rel="noopener" class="btn btn-ghost-sm">Consultar por WhatsApp</a>
        </div>
      </article>
'''


def rw(path, fn):
    s = open(path, encoding="utf8").read()
    open(path, "w", encoding="utf8", newline="").write(fn(s))


search = json.load(open(os.path.join(ROOT, "search-index.json"), encoding="utf8"))
clas = json.load(open(os.path.join(ROOT, "data", "clasificados.json"), encoding="utf8"))
sitemap_add = ""
cards = {"retro": "", "clubes": ""}

for p in P:
    sec = p["section"]
    lg = p.get("league")
    imgdir = os.path.join(ROOT, "assets", "tienda", sec, p["slug"])
    os.makedirs(imgdir, exist_ok=True)
    for n, i in enumerate(p["order"], 1):
        im = Image.open(os.path.join(SRC, files[i])).convert("RGB")
        im.thumbnail((1024, 1024), Image.LANCZOS)
        im.save(os.path.join(imgdir, f"{n}.webp"), "WEBP", quality=80, method=6)
    N = len(p["order"])
    pf = pre(p)
    tpl_slug, tpl_dir = ("ajax-home-fan-25-26", "clubes/resto-del-mundo") if lg else ("brasil-home-2002", "retro")
    html = open(os.path.join(ROOT, "tienda", tpl_dir, tpl_slug + ".html"), encoding="utf8").read()
    old_name = re.search(r'<h1 class="pdp-title">(.*?)</h1>', html).group(1)
    old_desc = re.search(r'<p class="pdp-desc">(.*?)</p>', html).group(1)
    old_assets = f"assets/tienda/{'clubes' if lg else 'retro'}/{tpl_slug}"
    new_assets = f"assets/tienda/{sec}/{p['slug']}"
    old_page = f"tienda/{tpl_dir}/{tpl_slug}.html"
    new_page = f"tienda/{sec}/{(lg + '/') if lg else ''}{p['slug']}.html"

    thumbs = "".join(f'''          <button{' class="active"' if n == 1 else ''} aria-label="Ver foto {n}">
            <img src="{pf}{new_assets}/{n}.webp" alt="{p['name']}, foto {n}" width="1024" height="1024">
          </button>
''' for n in range(1, N + 1))
    html = re.sub(r'(<div class="pdp-gallery-thumbs">\n).*?(        </div>\n      </div>\n\n      <div class="pdp-info">)',
                  lambda m: m.group(1) + thumbs + m.group(2), html, flags=re.S)
    html = re.sub(r'<p class="pdp-subtitle">.*?</p>',
                  '<p class="pdp-subtitle">Camiseta retro</p>' if sec == "retro" else '<p class="pdp-subtitle">Temporada 25/26</p>', html)
    html = re.sub(r'<ul class="pdp-specs">.*?</ul>', f'''<ul class="pdp-specs">
            <li><span>Modelo</span><strong>{p['name']}</strong></li>
            <li><span>Talles</span><strong>Consultá los talles disponibles</strong></li>
            <li><span>Origen</span><strong>Importada</strong></li>
          </ul>''', html, flags=re.S)
    html = re.sub(r'(<a class="btn btn-primary" href=")[^"]*(")', lambda m: m.group(1) + wa_url(p) + m.group(2), html)
    html = html.replace(old_desc, p["desc"]).replace(old_name, p["name"])
    html = html.replace(old_assets, new_assets).replace(old_page, new_page).replace(tpl_slug, p["slug"])
    html = re.sub(r'<p class="pdp-price">.*?</p>', '<p class="pdp-price">$48.000</p>', html)
    html = re.sub(r'"price": "\d+"', f'"price": "{PRICE}"', html)
    ld_imgs = ",\n".join(f'    "https://rdhimports.vercel.app/{new_assets}/{n}.webp"' for n in range(1, N + 1))
    html = re.sub(r'("image": \[\n).*?(\n  \])', lambda m: m.group(1) + ld_imgs + m.group(2), html, flags=re.S)
    html = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + p["name"] + " — RDH Imports", html)
    html = re.sub(r'(<meta name="twitter:title" content=")[^"]*', lambda m: m.group(1) + p["name"] + " — RDH Imports", html)
    html = re.sub(r'<title>.*?</title>', f'<title>{p["name"]} — RDH Imports</title>', html)
    html = re.sub(r'(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*',
                  lambda m: m.group(1) + p["desc"], html)
    outdir = os.path.join(ROOT, "tienda", sec, lg or "")
    os.makedirs(outdir, exist_ok=True)
    open(os.path.join(outdir, p["slug"] + ".html"), "w", encoding="utf8", newline="").write(html)

    cards[sec] += card(p)
    search.append({"name": p["name"], "href": new_page, "img": new_assets + "/1.webp", "tag": "Retro" if sec == "retro" else "Clubes · Resto del Mundo"})
    sitemap_add += f"  <url>\n    <loc>https://rdhimports.vercel.app/{new_page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n"
    clas.append({"name": p["name"], "slug": p["slug"], "section": sec, "league": lg, "quality": "player",
                 "price": PRICE, "priceDisplay": PRICE, "teamKey": p["name"],
                 "localImages": [f"{n}.webp" for n in range(1, N + 1)], "source": "fotos whatsapp"})

rw(os.path.join(ROOT, "tienda/retro/index.html"),
   lambda s: s.replace('    </div>\n    <div class="empty-state', cards["retro"] + '    </div>\n    <div class="empty-state', 1))


def clubes(s):
    i = s.index('id="resto-del-mundo"')
    j = s.index("    </div>", i)
    return s[:j] + cards["clubes"] + s[j:]


rw(os.path.join(ROOT, "tienda/clubes/index.html"), clubes)
json.dump(search, open(os.path.join(ROOT, "search-index.json"), "w", encoding="utf8", newline=""), ensure_ascii=False, separators=(",", ":"))
json.dump(clas, open(os.path.join(ROOT, "data/clasificados.json"), "w", encoding="utf8", newline=""), ensure_ascii=False, indent=2)
rw(os.path.join(ROOT, "sitemap.xml"), lambda s: s.replace("</urlset>", sitemap_add + "</urlset>"))
print("ok")
