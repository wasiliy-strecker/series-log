"""Capture actual Store UI, never a reconstructed screen, on owned AVDs only."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shlex
import subprocess
import time
from capture import Capture, PACKAGE

ROOT = Path(__file__).resolve().parents[2]

class LocalizedCapture(Capture):
    def __init__(self, serial, locale, output, fixture):
        super().__init__(serial)
        self.locale, self.output, self.fixture = locale, output, fixture
        self.copy = json.loads((ROOT/'store'/locale/'copy.json').read_text())
        self.strings = json.loads((ROOT/'src/core/i18n/messages'/(self.copy['language']+'.json')).read_text())
        self.ids = json.loads((fixture/'fixture.json').read_text())['series'][0]
        installed = self.run('shell','pm','path',PACKAGE).decode().strip().removeprefix('package:')
        self.installed_sha = self.run('shell','sha256sum',shlex.quote(installed)).decode().split()[0]
        if self.installed_sha != hashlib.sha256((output.parent/'raw/store.apk').read_bytes()).hexdigest():
            raise ValueError('Installed APK differs from capture source')

    def tap_node(self, node):
        a,b,c,d=map(int,re.findall(r'\d+',node.get('bounds')))
        self.run('shell','input','tap',str((a+c)//2),str((b+d)//2))
        time.sleep(.8)

    def start(self):
        super().start()
        for _ in range(20):
            if self.has(self.copy['name']) or self.has('Series Log'): return
            nodes=list(self.nodes())
            waiting=[n for n in nodes if n.get('resource-id','').endswith('/aerr_wait')]
            text=' '.join(n.get('text','') for n in nodes).lower()
            if waiting and any(word in text for word in ['system-ui','system ui','sistema','interface']):
                self.tap_node(waiting[0])
            time.sleep(.5)
        raise ValueError('Dashboard did not become ready')

    def key(self, key): self.tap(self.strings[key])
    def seek(self, key): self.reveal(self.strings[key])
    def link(self, path):
        self.run('shell','am','start','-W','-a','android.intent.action.VIEW','-d',shlex.quote('serienlog://'+path),PACKAGE)
        time.sleep(2)

    def screenshot(self, profile, name):
        list(self.nodes())
        path=self.output/'raw'/profile/(name+'.png')
        super().capture(path)
        metadata=json.loads(path.with_suffix('.json').read_text())
        metadata.update(locale=self.locale,installedApkSha256=self.installed_sha)
        path.with_suffix('.json').write_text(json.dumps(metadata,indent=2)+'\n')
        path.with_suffix('.xml').write_bytes(self.run('shell','cat','/sdcard/sl-store-ui.xml'))

    def restore(self):
        self.start()
        name='Demo-'+self.locale+'.slbackup'
        self.run('push',str(self.fixture/'Demo.slbackup'),'/sdcard/Download/'+name)
        self.link('settings')
        self.seek('Backup wiederherstellen')
        self.key('Backup wiederherstellen')
        # The first DocumentsUI launch can be slow on a newly booted AVD.
        for _ in range(20):
            if any(n.get('package','').endswith('documentsui') for n in self.nodes()): break
            time.sleep(.5)
        else: raise ValueError('System document picker did not become ready')
        if not self.has(name):
            buttons=[n for n in self.nodes() if n.get('class')=='android.widget.ImageButton' and n.get('package','').endswith('documentsui')]
            if not buttons: raise ValueError('System document navigation missing')
            self.tap_node(buttons[0])
            downloads=[n for n in self.nodes() if n.get('text','') in ['Downloads','Descargas','Téléchargements','Download']]
            if not downloads: raise ValueError('Downloads root missing')
            self.tap_node(downloads[-1])
        self.tap(name)
        self.field(self.strings['Passwort'],'Demo2026')
        self.key('Weiter')
        for _ in range(30):
            if self.has(self.strings['Wiederherstellen']): break
            time.sleep(.5)
        self.key('Wiederherstellen')
        time.sleep(3)
        self.start()

    def capture_profile(self, profile):
        subprocess.run(['python3',str(ROOT/'scripts/store_assets/device.py'),self.serial,'status'],check=True,stdout=subprocess.DEVNULL)
        self.start()
        self.screenshot(profile,'01-overview')
        if profile == 'phone':
            self.link('settings')
            proof = self.output.parent/'verification'/('settings-'+self.locale+'.png')
            super().capture(proof)
            self.start()
        if profile=='phone':
            self.link('record/'+self.ids['recordId'])
            self.screenshot(profile,'02-details')
            self.link('entry/'+self.ids['entryId'])
            self.screenshot(profile,'03-progress')
        self.start()
        self.link('record/history?id='+self.ids['recordId'])
        self.screenshot(profile,'04-history')
        self.start()
        self.link('record/edit?id='+self.ids['recordId'])
        self.seek('Ans Weiterschauen erinnern')
        self.screenshot(profile,'05-reminders')
        self.start()
        self.link('record/'+self.ids['recordId'])
        self.seek('PDF erstellen')
        self.key('PDF erstellen')
        self.key('PDF ohne Foto erstellen')
        for _ in range(30):
            if self.has(self.strings['Drucken']): break
            time.sleep(.5)
        if not self.has(self.strings['Drucken']): raise ValueError('Expected generated PDF viewer')
        time.sleep(2)
        self.screenshot(profile,'06-pdf')
        if profile=='phone' and self.locale=='de-DE': self.verify_language()

    def verify_language(self):
        self.start()
        self.link('settings')
        self.tap('English')
        time.sleep(1)
        self.start()
        if not self.has('Series Log'): raise ValueError('Language did not persist after cold launch')
        self.link('entry/'+self.ids['entryId'])
        text=' '.join(n.get('text','')+n.get('content-desc','') for n in self.nodes())
        if '19.10.2026' not in text: raise ValueError('Device region changed with app language')
        self.link('settings')
        en=json.loads((ROOT/'src/core/i18n/messages/en.json').read_text())
        self.tap(en['Systemsprache'])
        time.sleep(1)
        self.start()
        if not self.has('SerienLog'): raise ValueError('System language was not restored')
        (self.output/'raw/language-check.json').write_text(json.dumps(dict(coldStart='passed',independentGermanRegion='passed',systemFallback='passed'),indent=2)+'\n')

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('serial');p.add_argument('locale');p.add_argument('output',type=Path);p.add_argument('fixture',type=Path);p.add_argument('profile',choices=['phone','tablet7','tablet10'])
    a=p.parse_args();c=LocalizedCapture(a.serial,a.locale,a.output,a.fixture)
    c.restore();c.capture_profile(a.profile)
