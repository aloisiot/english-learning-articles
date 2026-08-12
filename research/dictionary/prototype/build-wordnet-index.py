import os, re, json, gzip, sqlite3, collections
D='node_modules/wordnet-db/dict'
POS={'noun':'n','verb':'v','adj':'a','adv':'r'}
entries=collections.defaultdict(list)
for pos,code in POS.items():
    with open(f'{D}/data.{pos}', encoding='latin-1') as f:
        offs={}
        for line in f:
            if line.startswith('  '): continue
            head,_,gloss=line.partition('|')
            parts=head.split()
            off=parts[0]
            w_cnt=int(parts[3],16)
            words=[parts[4+2*i].replace('_',' ') for i in range(w_cnt)]
            g=gloss.strip()
            # split gloss into definition + examples
            segs=[s.strip() for s in g.split(';')]
            defs=[s for s in segs if not s.startswith('"')]
            exs=[s.strip('"') for s in segs if s.startswith('"')]
            definition='; '.join(defs)
            for w in words:
                entries[w.lower()].append({'p':code,'d':definition,'e':exs[:1]})
print('headwords:', len(entries))
print('senses:', sum(len(v) for v in entries.values()))
js=json.dumps(entries, separators=(',',':'), ensure_ascii=False).encode()
open('wordnet.json','wb').write(js)
open('wordnet.json.gz','wb').write(gzip.compress(js,9))
print('json MB %.1f  gz MB %.1f' % (len(js)/1e6, os.path.getsize('wordnet.json.gz')/1e6))

# SQLite
if os.path.exists('wordnet.sqlite'): os.remove('wordnet.sqlite')
con=sqlite3.connect('wordnet.sqlite')
con.execute('CREATE TABLE entry(word TEXT PRIMARY KEY, json TEXT)')
con.executemany('INSERT INTO entry VALUES(?,?)', ((w, json.dumps(v,separators=(',',':'),ensure_ascii=False)) for w,v in entries.items()))
con.commit(); con.execute('VACUUM'); con.close()
print('sqlite MB %.1f' % (os.path.getsize('wordnet.sqlite')/1e6))
