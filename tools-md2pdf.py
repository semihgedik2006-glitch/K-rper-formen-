#!/usr/bin/env python3
"""Markdown -> HTML fuer den PDF-Satz.

Bewusst klein gehalten: es muss genau die Teilmenge koennen, die im
Handbuch vorkommt (Ueberschriften, Tabellen, Listen, fett, Code, Links,
Trennlinien). Kein allgemeiner Markdown-Parser.
"""
import io, re, sys, html as H

def inline(t):
    t = H.escape(t)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<!\*)\*([^*\n]+)\*(?!\*)', r'<em>\1</em>', t)
    t = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', t)
    return t

def entfalten(zeilen):
    """Weich umbrochene Zeilen wieder zusammenziehen.

    Im Markdown sind Absaetze und Listenpunkte auf mehrere Quellzeilen
    umbrochen. Ohne dieses Zusammenziehen wuerde jede Folgezeile ein eigener
    Absatz - der Text bricht dann mitten im Satz aus der Liste heraus."""
    neu = []
    def eigenstaendig(z):
        s = z.strip()
        return (not s
                or s.startswith('#') or s.startswith('|') or s.startswith('>')
                or s.startswith('```')
                or (set(s) == {'-'} and len(s) >= 3)
                or re.match(r'^\s*([-*]|\d+\.)\s+', z) is not None)
    for z in zeilen:
        if neu and not eigenstaendig(z) and neu[-1].strip() and not neu[-1].strip().startswith('|'):
            neu[-1] = neu[-1].rstrip() + ' ' + z.strip()
        else:
            neu.append(z)
    return neu

def anchor(t):
    a = t.lower()
    for x, y in [('ä','a'),('ö','o'),('ü','u'),('ß','ss')]:
        a = a.replace(x, y)
    a = re.sub(r'[^a-z0-9 -]', '', a)
    return a.strip().replace(' ', '-')

def konvert(md):
    zeilen = entfalten(md.split('\n'))
    out, i = [], 0
    listen = []          # offene <ul>/<ol>-Ebenen als (tag, einzug)

    def listen_zu(bis=-1):
        while listen and listen[-1][1] > bis:
            out.append('</%s>' % listen.pop()[0])

    while i < len(zeilen):
        z = zeilen[i]
        s = z.strip()

        if not s:
            listen_zu(); i += 1; continue

        if s.startswith('---') and set(s) == {'-'}:
            listen_zu(); out.append('<hr/>'); i += 1; continue

        m = re.match(r'^(#{1,6})\s+(.*)$', s)
        if m:
            listen_zu()
            n, txt = len(m.group(1)), m.group(2)
            out.append('<h%d id="%s">%s</h%d>' % (n, anchor(txt), inline(txt), n))
            i += 1; continue

        # Tabelle: Kopfzeile, Trennzeile, dann Datenzeilen
        if s.startswith('|') and i + 1 < len(zeilen) and re.match(r'^\|[\s:|-]+\|$', zeilen[i+1].strip()):
            listen_zu()
            def zellen(r):
                return [c.strip() for c in r.strip().strip('|').split('|')]
            kopf = zellen(s)
            i += 2
            rows = []
            while i < len(zeilen) and zeilen[i].strip().startswith('|'):
                rows.append(zellen(zeilen[i])); i += 1
            out.append('<table><thead><tr>' +
                       ''.join('<th>%s</th>' % inline(c) for c in kopf) +
                       '</tr></thead><tbody>')
            for r in rows:
                out.append('<tr>' + ''.join('<td>%s</td>' % inline(c) for c in r) + '</tr>')
            out.append('</tbody></table>')
            continue

        m = re.match(r'^(\s*)([-*]|\d+\.)\s+(.*)$', z)
        if m:
            einzug = len(m.group(1))
            tag = 'ol' if m.group(2)[0].isdigit() else 'ul'
            listen_zu(einzug)
            if not listen or listen[-1][1] < einzug:
                out.append('<%s>' % tag); listen.append((tag, einzug))
            out.append('<li>%s</li>' % inline(m.group(3)))
            i += 1; continue

        if s.startswith('>'):
            listen_zu()
            out.append('<blockquote>%s</blockquote>' % inline(s.lstrip('> ')))
            i += 1; continue

        listen_zu()
        out.append('<p>%s</p>' % inline(s))
        i += 1

    listen_zu()
    return '\n'.join(out)


CSS = """
@page { size: A4; margin: 19mm 17mm 20mm 17mm; }
*{box-sizing:border-box}
body{font-family:"DejaVu Sans","Helvetica Neue",Arial,sans-serif;
  font-size:9.7pt; line-height:1.52; color:#1d2430; margin:0}
h1{font-size:23pt;line-height:1.15;margin:0 0 4pt;color:#0b3b57;
  letter-spacing:-.3pt}
h2{font-size:14pt;margin:19pt 0 7pt;padding-bottom:4pt;color:#0b3b57;
  border-bottom:1.4pt solid #0b3b57;break-after:avoid;page-break-after:avoid}
h3{font-size:11pt;margin:13pt 0 4pt;color:#14607f;break-after:avoid;page-break-after:avoid}
h4{font-size:9.9pt;margin:10pt 0 3pt;color:#31405a;break-after:avoid}
p{margin:0 0 6pt}
ul,ol{margin:0 0 7pt;padding-left:15pt}
li{margin:0 0 2.6pt}
li>ul,li>ol{margin-top:2.6pt}
strong{color:#0b2233}
code{font-family:"DejaVu Sans Mono",Consolas,monospace;font-size:8.6pt;
  background:#eef2f6;padding:1pt 3.4pt;border-radius:3pt;color:#12455f}
a{color:#14607f;text-decoration:none}
hr{border:none;border-top:.7pt solid #d8dfe8;margin:15pt 0}
table{width:100%;border-collapse:collapse;margin:5pt 0 10pt;
  font-size:8.9pt;break-inside:avoid;page-break-inside:avoid}
th{background:#0b3b57;color:#fff;text-align:left;padding:5pt 7pt;
  font-weight:600;font-size:8.7pt}
td{padding:4.4pt 7pt;border-bottom:.6pt solid #e2e8ef;vertical-align:top}
tbody tr:nth-child(even){background:#f6f9fb}
blockquote{margin:6pt 0;padding:6pt 11pt;background:#f2f7fa;
  border-left:2.6pt solid #14607f;color:#31405a}
/* Inhalt zweispaltig. Mehr Einzug, sonst schneidet die Spalte die
   zweistellige Nummer an ("10." wird zu "l0."). */
h2#inhalt + ol{columns:2;column-gap:20pt;padding-left:22pt;break-inside:avoid}
h2#inhalt + ol li{break-inside:avoid}
"""

def main(md_pfad, html_pfad):
    md = io.open(md_pfad, encoding='utf-8').read()
    titel = md.split('\n')[0].lstrip('# ').strip()
    koerper = konvert(md)
    html = ('<!doctype html><html lang="de"><head><meta charset="utf-8">'
            '<title>' + H.escape(titel) + '</title><style>' + CSS +
            '</style></head><body>' + koerper + '</body></html>')
    io.open(html_pfad, 'w', encoding='utf-8').write(html)
    print('HTML geschrieben:', html_pfad, len(html), 'Zeichen')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
