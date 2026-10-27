# Optional asset-generation tool: pip install fonttools brotli
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
import base64,io
root=Path(__file__).resolve().parents[1]
font=TTFont(root/'public/fonts/playfair-display-v40-latin.woff2',recalcTimestamp=False)
reference=instantiateVariableFont(font,{'wght':500},inplace=False)
original={c:reference['hmtx'][reference.getBestCmap()[ord(c)]][0] for c in 'NOMADE'}
options=subset.Options();options.flavor='woff2';options.recalc_timestamp=False
subsetter=subset.Subsetter(options=options);subsetter.populate(text='NOMADE ');subsetter.subset(font)
for nid,text in [(1,'NOMADE Headline'),(2,'Regular'),(3,'NOMADEHeadline500-v1'),(4,'NOMADE Headline'),(6,'NOMADEHeadline500'),(16,'NOMADE Headline'),(17,'Regular'),(25,'NOMADEHeadline')]:
 for name in font['name'].names:
  if name.nameID==nid:name.string=text.encode(name.getEncoding())
font.flavor='woff2';out=root/'public/fonts/nomade-headline-v1.woff2';font.save(out)
check=instantiateVariableFont(TTFont(out),{'wght':500},inplace=False);actual={c:check['hmtx'][check.getBestCmap()[ord(c)]][0] for c in 'NOMADE'};assert original==actual
payload=base64.b64encode(out.read_bytes()).decode()
p=root/'app/fonts.css';s=p.read_text().replace("font-family:'Playfair Display';font-style:normal;font-weight:400 600;font-display:optional", "font-family:'Playfair Display';font-style:normal;font-weight:400 600;font-display:swap")
s=s.split('\n/* NOMADE Headline:')[0]
s+='\n/* NOMADE Headline: six-glyph subset of Playfair Display; renamed under the bundled SIL OFL. */\n'
s+="@font-face{font-family:'NOMADE Headline';font-style:normal;font-weight:400 900;font-display:swap;src:url(data:font/woff2;base64,"+payload+") format('woff2')}\n.heroContent h1{font-family:'NOMADE Headline','Playfair Display',serif}.heroContent h1 .srOnly{font-family:serif}\n"
p.write_text(s)
from fontTools.pens.recordingPen import RecordingPen
for c in 'NOMADE':
 pa,pb=RecordingPen(),RecordingPen();reference.getGlyphSet()[reference.getBestCmap()[ord(c)]].draw(pa);check.getGlyphSet()[check.getBestCmap()[ord(c)]].draw(pb);assert pa.value==pb.value,c
print({'subsetBytes':out.stat().st_size,'originalBytes':(root/'public/fonts/playfair-display-v40-latin.woff2').stat().st_size,'glyphWidthsUnchanged':True})
