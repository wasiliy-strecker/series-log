"""Check the six message catalogs and generate matching Android and Apple resources."""
import argparse
import hashlib
import json
from pathlib import Path
import re
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
LANGUAGES = {"en": "values", "de": "values-de", "es": "values-es",
             "fr": "values-fr", "it": "values-it", "pt": "values-pt-rBR"}
NAMES = {"en": "Series Log", "de": "SerienLog", "es": "Diario de series",
         "fr": "Journal de séries", "it": "Diario delle serie", "pt": "Diário de séries"}


def catalogs():
    data = {lang: json.loads((ROOT / "src/core/i18n/messages" / f"{lang}.json").read_text())
            for lang in LANGUAGES}
    for lang, messages in data.items():
        if messages.keys() != data["en"].keys():
            raise ValueError(f"Message keys differ for {lang}")
        for key, value in messages.items():
            if not isinstance(value, str):
                raise ValueError(f"Non-string message: {lang}/{key}")
            if set(re.findall(r"\{\w+\}", value)) != set(re.findall(r"\{\w+\}", data["en"][key])):
                raise ValueError(f"Placeholders differ for {lang}/{key}")
            if ";" in value:
                raise ValueError(f"Semicolon in user-facing text: {lang}/{key}")
    return data


def android_string(value):
    value = value.replace("\\", "\\\\").replace("%", "%%")
    value = re.sub(r"\{p(\d+)\}", lambda m: f"%{int(m[1]) + 1}$s", value)
    return escape(value).replace("'", "\\'").replace('"', '\\"').replace("\n", "\\n")


def outputs(data, android):
    result = {}
    module = ROOT / "modules/series-native/android/src/main/res"
    for lang, folder in LANGUAGES.items():
        lines = ['<?xml version="1.0" encoding="utf-8"?>', '<!-- Generated from the app message catalogs. -->', '<resources>']
        for key, value in sorted(data[lang].items()):
            lines.append(f'    <string name="sl_{hashlib.sha1(key.encode()).hexdigest()[:12]}">{android_string(value)}</string>')
        result[module / folder / "localized_strings.xml"] = "\n".join(lines + ['</resources>', ''])
        for flavor in ("dev", "store"):
            name = NAMES[lang] + (" Dev" if flavor == "dev" else "")
            result[android / "app/src" / flavor / "res" / folder / "app_name.xml"] = (
                '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
                f'    <string name="app_name">{escape(name)}</string>\n</resources>\n')
    result[android / "app/src/main/res/xml/locale_config.xml"] = (
        '<?xml version="1.0" encoding="utf-8"?>\n<locale-config xmlns:android="http://schemas.android.com/apk/res/android">\n'
        + ''.join(f'    <locale android:name="{lang}" />\n' for lang in ('en', 'de', 'es', 'fr', 'it', 'pt-BR'))
        + '</locale-config>\n')
    for lang, messages in data.items():
        result[ROOT / "modules/series-native/ios/Resources" / f"{lang}.json"] = (
            json.dumps(messages, ensure_ascii=False, indent=2) + "\n")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--android-dir", type=Path, default=ROOT / "android")
    args = parser.parse_args()
    data = catalogs()
    for path, text in outputs(data, args.android_dir).items():
        if args.check:
            if not path.exists() or path.read_text() != text:
                raise ValueError(f"Generated localization is stale: {path.relative_to(ROOT)}")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text)
    print(f"Verified {len(data['en'])} messages in six languages and Android/Apple resources")


if __name__ == "__main__":
    main()
