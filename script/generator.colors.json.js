var
yaml    = require('js-yaml'),
request = require('superagent');

var
LANGUAGE_YAML_URL = 'https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml';

request
  .get(LANGUAGE_YAML_URL)
  .end(function (err, res) {
    if (err) throw err;
    var
    langs = yaml.safeLoad(res.text),
    colors = Object.keys(langs).reduce(function (colors, name) {
      if (langs[name].color) {
        colors[name] = langs[name].color;
      } else {
        console.error('Missing color: ' + name);
      }
      return colors;
    }, {});
    console.log(JSON.stringify(colors, null, '  '));
  });
