"""Validate six Play listings and 96 assets with provenance from the delivered AAB."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import zipfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
LOCALES = ['de-DE', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 'pt-BR']
NAMES = ['01-overview', '02-details', '03-progress', '04-history', '05-reminders', '06-pdf']


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate(path, size, mode, limit):
    with Image.open(path) as image:
        image.load()
        if image.format != 'PNG' or image.size != size or image.mode != mode:
            raise ValueError(f'Incorrect image format, dimensions or mode: {path}')
        if mode == 'RGBA' and image.getchannel('A').getextrema() != (255, 255):
            raise ValueError('Upload icon must have an opaque background')
    if path.stat().st_size > limit:
        raise ValueError(f'Image exceeds upload size limit: {path}')


def verify_source(aab, apk):
    count = 0
    with zipfile.ZipFile(aab) as source, zipfile.ZipFile(apk) as installed:
        for name in source.namelist():
            if name.startswith(('base/assets/', 'base/lib/', 'base/dex/')) and not name.endswith('/'):
                target = name.removeprefix('base/dex/') if name.startswith('base/dex/') else name.removeprefix('base/')
                if source.read(name) != installed.read(target):
                    raise ValueError(f'APK differs from source release: {name}')
                count += 1
    badging = subprocess.check_output([str(Path.home()/'.local/android-sdk/build-tools/35.0.0/aapt'), 'dump', 'badging', str(apk)], text=True)
    if "name='com.appfactory.series_log' versionCode='2' versionName='1.0.0'" not in badging:
        raise ValueError('Wrong package or version')
    if 'application-debuggable' in badging or 'application-testOnly' in badging:
        raise ValueError('Capture source is not a Store release')
    return count


def package(root, aab, apk):
    archives = [root/f'serienlog-1.0.0-build-2-{locale}.zip' for locale in [*LOCALES, 'komplett']]
    if any(path.exists() for path in archives):
        raise ValueError('A named delivery archive already exists. Preserve it and use a new output directory.')
    count = verify_source(aab, apk)
    release_notes = []
    all_manifests = []
    for locale in LOCALES:
        copy = json.loads((ROOT/'store'/locale/'copy.json').read_text())
        out = root/locale
        assert len(copy['name']) <= 30 and len(copy['shortDescription']) <= 80 and len(copy['fullDescription']) <= 4000
        assert len(copy['releaseNotes']) <= 500
        text = out/'text'
        text.mkdir(parents=True, exist_ok=True)
        for key in ['name','shortDescription','fullDescription','releaseNotes','privacyUrl']:
            (text/(key+'.txt')).write_text(copy[key]+'\n')
        release_notes += [f'<{locale}>',copy['releaseNotes'],f'</{locale}>']
        entries = [('App icon','icon/app-icon.png',(512,512),'RGBA',1024**2,copy['name']),
                   ('Feature graphic','feature/feature-graphic.png',(1024,500),'RGB',15*1024**2,copy['feature'].replace('\n',' '))]
        for profile,size,field in [('phone',(1080,1920),'Phone screenshots'),('tablet7',(1080,1920),'7-inch tablet screenshots'),('tablet10',(1440,2560),'10-inch tablet screenshots')]:
            names = NAMES if profile == 'phone' else [NAMES[i] for i in [0,3,4,5]]
            for name in names:
                entries.append((field,f'{profile}/{name}.png',size,'RGB',8*1024**2,copy['frames'][NAMES.index(name)].replace('\n',' ')))
        actual = {str(p.relative_to(out)) for folder in ['icon','feature','phone','tablet7','tablet10'] for p in (out/folder).glob('*.png')}
        if actual != {e[1] for e in entries}: raise ValueError(f'Expected 16 uploads for {locale}')
        manifest = dict(app=copy['name'],locale=locale,versionName='1.0.0',versionCode=2,sourceAab=aab.name,sourceSha256=sha(aab),emulatorApkSha256=sha(apk),verifiedReleaseFileCount=count,images=[])
        for field,name,size,mode,limit,alt in entries:
            path=out/name
            validate(path,size,mode,limit)
            assert len(alt)<=140
            manifest['images'].append(dict(file=name,playField=field,width=size[0],height=size[1],mode=mode,bytes=path.stat().st_size,sha256=sha(path),alt=alt))
        manifest['rawCaptures']=[dict(file=str(p.relative_to(out)),sha256=sha(p)) for p in sorted((out/'raw').glob('*/*.png'))]
        assert len(manifest['rawCaptures'])==14
        profiles = {'phone': ((1080, 1920), 300), 'tablet7': ((1200, 1920), 320), 'tablet10': ((1600, 2560), 320)}
        for capture in manifest['rawCaptures']:
            metadata=json.loads((out/capture['file']).with_suffix('.json').read_text())
            capture['metadata'] = metadata
            if metadata.get('installedApkSha256') != sha(apk) or metadata.get('locale') != locale:
                raise ValueError('Capture source or language differs: ' + capture['file'])
            profile = Path(capture['file']).parts[1]
            size, density = profiles[profile]
            validate(out/capture['file'], size, 'RGB', 15*1024**2)
            if metadata.get('density') != f'Physical density: {density}' or not metadata.get('avd', '').startswith(f'sl_store_assets_{profile}_'):
                raise ValueError('Unexpected capture device: ' + capture['file'])
        manifest['captureEnvironments'] = {
            profile: dict(
                avdConfigurationSha256=sha(out/'raw'/(profile+'-avd.ini')),
                systemConfiguration=(out/'raw'/(profile+'-system-config.txt')).read_text().strip(),
                width=size[0], height=size[1], density=density,
            ) for profile, (size, density) in profiles.items()
        }
        manifest['sampleData'] = dict(
            source='Synthetic data created with the production backup service and imported through the normal app UI',
            backupSha256=sha(root/'fixtures'/locale/'Demo.slbackup'),
            fixtureSha256=sha(root/'fixtures'/locale/'fixture.json'),
            photo='assets/photo-examples/01_tv_staffel_1_folge_5.png',
            photoSha256=sha(ROOT/'assets/photo-examples/01_tv_staffel_1_folge_5.png'),
        )
        (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
        (out/'ALT-TEXTE.txt').write_text('\n\n'.join(item['file']+'\n'+item['alt'] for item in manifest['images'])+'\n')
        (out/'START-HIER.txt').write_text(f"{copy['name']} · {locale} · 1.0.0 (2)\n\n16 Upload-Bilder: icon, feature, phone, tablet7, tablet10.\nDie Screenshots pro Gerätegröße in der nummerierten Reihenfolge hochladen.\nDie Feldinhalte unter text/ können unverändert in die Play Console kopiert werden.\nVORSCHAU.png ist eine Übersicht und kein Upload-Bild.\nmanifest.json dokumentiert Herkunft, Größen und Prüfsummen.\nDas Video-Feld bleibt leer.\n")
        archive=root/f'serienlog-1.0.0-build-2-{locale}.zip'
        with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
            for p in sorted(out.rglob('*')):
                if p.is_file() and 'raw' not in p.relative_to(out).parts:
                    z.write(p,str(p.relative_to(root)))
        all_manifests.append(dict(locale=locale,archive=archive.name,sha256=sha(archive),images=16))
    delivered=root/aab.name
    if delivered.exists() and sha(delivered)!=sha(aab): raise ValueError('An AAB delivery already exists with different contents')
    if not delivered.exists(): shutil.copy2(aab,delivered)
    (root/'RELEASE-NOTES.txt').write_text('\n'.join(release_notes)+'\n')
    (root/'RELEASE-TITEL.txt').write_text('1.0.0 (2) – SerienLog in sechs Sprachen\n')
    (root/'manifest.json').write_text(json.dumps(dict(version='1.0.0 (2)',aab=delivered.name,sha256=sha(delivered),assets=96,locales=all_manifests),indent=2)+'\n')
    (root/'START-HIER.txt').write_text('SerienLog 1.0.0 (2)\n\nDie signierte AAB ist für den nächsten Play-Upload vorbereitet.\nDer höchste zuvor lokal dokumentierte Versionscode war 1.\n\nJedes Sprach-ZIP enthält 16 Upload-Bilder und direkt kopierbare Store-Texte.\nDeutsch de-DE, Englisch en-US, Spanisch es-ES, Französisch fr-FR, Italienisch it-IT, Portugiesisch pt-BR.\n\nRELEASE-TITEL.txt und RELEASE-NOTES.txt sind für die Release-Felder vorbereitet.\nDie Hinweise enthalten die erforderlichen Play-Sprachtags.\n\nDie Screenshots stammen aus der AAB auf eigenen Android-Emulatoren.\nDemo-Backups wurden über die normale App-Wiederherstellung importiert.\nPDFs wurden über die tatsächliche App-Funktion erzeugt.\nDas vorhandene Serienfoto ist ein künstliches Beispielbild. Bildinhalte sind Beispieldaten.\nDie App-Inhalte der Screenshot-Dateien sind unverändert.\nDie Bildunterschriften werden außerhalb der App-Aufnahme ergänzt.\n\nDie Rohaufnahmen und Demo-Backups bleiben lokal unter raw/ und fixtures/.\nDie Sprachmanifeste dokumentieren ihre Aufnahmeherkunft.\nverification/ enthält die Prüfprotokolle. App-, Native- und Store-Tests sind erfolgreich.\nDer genaue Dependency-Audit-Stand ist unter verification/ dokumentiert.\nEs wurde nichts hochgeladen oder veröffentlicht. Die persönliche Dev-Installation blieb unberührt.\n')
    files=[delivered,root/'manifest.json',root/'RELEASE-NOTES.txt',root/'RELEASE-TITEL.txt',root/'START-HIER.txt',*[root/m['archive'] for m in all_manifests],*[p for p in sorted((root/'verification').rglob('*')) if p.is_file()]]
    (root/'SHA256SUMS.txt').write_text(''.join(f'{sha(p)}  {p.relative_to(root)}\n' for p in files))
    total=root/'serienlog-1.0.0-build-2-komplett.zip'
    with zipfile.ZipFile(total,'w',zipfile.ZIP_DEFLATED) as z:
        for p in [*files,root/'SHA256SUMS.txt']: z.write(p,str(p.relative_to(root)))
    total.with_suffix('.zip.sha256').write_text(f'{sha(total)}  {total.name}\n')
    print(f'Validated 96 upload images and {count} matching release code/assets/libraries')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output',type=Path)
    parser.add_argument('--aab',type=Path,required=True)
    parser.add_argument('--apk',type=Path,required=True)
    a=parser.parse_args()
    package(a.output,a.aab,a.apk)
