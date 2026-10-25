"""Capture one locale/profile, using only a disposable and explicitly named AVD."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import time

ROOT=Path(__file__).resolve().parents[2]
ADB=Path.home()/'.local/android-sdk/platform-tools/adb'


def run(locale,profile,root,aab,port):
    output=root/locale
    raw=output/'raw'
    raw.mkdir(parents=True,exist_ok=True)
    apk=raw/'store.apk'
    source=root/'raw/store.apk'
    if not apk.exists(): apk.symlink_to(os.path.relpath(source,raw))
    logpath=raw/(profile+'-emulator.log')
    environment={**os.environ,'SL_EMULATOR_PORT':str(port)}
    with logpath.open('w') as log:
        process=subprocess.Popen(['bash','scripts/store_assets/prepare_emulator.sh',profile,str(output),str(aab),locale],cwd=ROOT,env=environment,stdout=log,stderr=subprocess.STDOUT)
        for _ in range(360):
            if 'Ready:' in logpath.read_text(): break
            if process.poll() is not None: raise RuntimeError(logpath.read_text())
            time.sleep(1)
        else: raise RuntimeError(f'Emulator did not start: {logpath}')
        command=['python3','scripts/store_assets/capture_localized.py',f'emulator-{port}',locale,str(output),str(root/'fixtures'/locale),profile]
        result=subprocess.run(command,cwd=ROOT,stdout=log,stderr=subprocess.STDOUT)
        if result.returncode:
            # Keep the isolated emulator for diagnosis. Never touch another device.
            raise RuntimeError(f'Capture failed, emulator retained: {logpath}')
        subprocess.run([str(ADB),'-s',f'emulator-{port}','emu','kill'],check=True,stdout=subprocess.DEVNULL)
        process.wait(timeout=30)
    workspace=Path((raw/(profile+'-workspace.txt')).read_text().strip())
    if workspace.parent != Path('/dev/shm') or not workspace.name.startswith('sl-store-assets-'): raise ValueError('Unexpected workspace')
    shutil.rmtree(workspace)
    print(f'Captured {locale} {profile}',flush=True)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('locale')
    p.add_argument('profile',choices=['phone','tablet7','tablet10'])
    p.add_argument('output',type=Path)
    p.add_argument('aab',type=Path)
    p.add_argument('--port',type=int,default=5586)
    a=p.parse_args()
    run(a.locale,a.profile,a.output.resolve(),a.aab.resolve(),a.port)
