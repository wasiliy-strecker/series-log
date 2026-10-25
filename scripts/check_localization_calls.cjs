// Check literal translation calls against catalog keys and required parameters.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, 'src/core/i18n/messages/de.json'), 'utf8'),
);
let checked = 0;
for (const file of fs
  .readdirSync(path.join(root, 'src'), { recursive: true })
  .filter((file) => /\.tsx?$/.test(file))) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(path.join(root, 'src', file), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  function visit(node) {
    if (
      ts.isJsxAttribute(node) &&
      /^(label|title|placeholder|accessibilityLabel|message|text)$/.test(
        node.name.getText(),
      ) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      node.initializer.text.trim()
    )
      throw Error(`Untranslated UI attribute in ${file}: ${node.getText()}`);
    if (
      ts.isJsxText(node) &&
      /[\p{L}]/u.test(node.text) &&
      node.text.trim() !== 'Wasiliy Strecker · AppFabrik AI'
    )
      throw Error(`Untranslated UI text in ${file}: ${node.text.trim()}`);
    if (
      ts.isCallExpression(node) &&
      /^(t|this\.t|translator\(.+\))$/.test(node.expression.getText()) &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const key = node.arguments[0].text;
      if (!(key in catalog)) throw Error(`Unknown message in ${file}: ${key}`);
      const required = new Set(
        [...catalog[key].matchAll(/\{(\w+)\}/g)].map((match) => match[1]),
      );
      const parameters = node.arguments[1];
      if (
        required.size &&
        (!parameters || !ts.isObjectLiteralExpression(parameters))
      )
        throw Error(`Missing message parameters in ${file}: ${key}`);
      if (parameters && ts.isObjectLiteralExpression(parameters)) {
        const supplied = new Set(
          parameters.properties.map((property) =>
            property.name?.getText().replace(/['"]/g, ''),
          ),
        );
        if ([...required].some((name) => !supplied.has(name)))
          throw Error(`Missing message placeholder in ${file}: ${key}`);
      }
      checked++;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
process.stdout.write(`Checked ${checked} literal translation calls\n`);
