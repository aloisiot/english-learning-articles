import json,gzip,os,brotli,sqlite3,collections
e=json.load(open('wordnet.json'))
# variant A: single-word headwords only, max 3 senses
a={w:v[:3] for w,v in e.items() if ' ' not in w and w.isascii()}
def rep(name,obj):
    b=json.dumps(obj,separators=(',',':'),ensure_ascii=False).encode()
    print(f'{name}: {len(obj)} headwords | raw {len(b)/1e6:.1f}MB | gzip {len(gzip.compress(b,9))/1e6:.1f}MB | brotli {len(brotli.compress(b,quality=11))/1e6:.1f}MB')
rep('A single-word, <=3 senses', a)
# variant B: also cap definition length
b_={w:[{**s,'d':s['d'][:120]} for s in v] for w,v in a.items()}
rep('B + defs capped 120 chars', b_)
# variant C: top 20k most common English words (approx: shortest/most frequent proxy unavailable) - use first 20k alphabetically? use word length proxy
# instead: measure per-letter shards for variant A
import string
tot=0
for L in string.ascii_lowercase:
    sub={w:v for w,v in a.items() if w.startswith(L)}
    if not sub: continue
    bb=brotli.compress(json.dumps(sub,separators=(',',':'),ensure_ascii=False).encode(),quality=11)
    tot+=len(bb)
print(f'per-letter brotli shards total {tot/1e6:.1f}MB, avg shard {tot/26/1e3:.0f}KB')
# sqlite for variant A
if os.path.exists('wn_a.sqlite'): os.remove('wn_a.sqlite')
con=sqlite3.connect('wn_a.sqlite')
con.execute('CREATE TABLE entry(word TEXT PRIMARY KEY, json TEXT)')
con.executemany('INSERT INTO entry VALUES(?,?)',((w,json.dumps(v,separators=(',',':'),ensure_ascii=False)) for w,v in a.items()))
con.commit(); con.execute('PRAGMA page_size=4096'); con.execute('VACUUM'); con.close()
print(f'variant A sqlite {os.path.getsize("wn_a.sqlite")/1e6:.1f}MB')
