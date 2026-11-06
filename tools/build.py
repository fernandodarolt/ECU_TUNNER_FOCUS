"""Bundle the complete editor into one offline HTML file."""
from pathlib import Path
import json
HERE=Path(__file__).resolve().parents[1]
html=(HERE/'src/shell.html').read_text(encoding='utf-8')
for marker,file in [('/*__CSS__*/','style.css'),('/*__PROFILE__*/','profile.json'),('/*__CORE__*/','core.js'),('/*__APP__*/','app.js')]:
    text=(HERE/'src'/file).read_text(encoding='utf-8')
    if file.endswith(('.js','.json')):text=text.replace('</script',r'<\/script')
    assert marker in html
    html=html.replace(marker,text)
html=html.replace('accept=".bin,application/octet-stream"','')
assert '/*__' not in html
(HERE/'Editor9M55AD.html').write_text(html,encoding='utf-8')
print(json.dumps({'output':str(HERE/'Editor9M55AD.html'),'bytes':len(html.encode('utf-8'))}))
