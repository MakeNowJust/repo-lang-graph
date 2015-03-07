var
Chart     = require('chart.js'),
numeral   = require('numeral'),
request   = require('superagent'),
tinycolor = require('tinycolor2');

global.numeral = numeral;

var
// from https://github.com/doda/github-language-colors
colors = require('./colors.json');

var
ctx = document.getElementById('graph-canvas').getContext('2d'),
pie = new Chart(ctx);

if (location.search.length !== 0) {
  document.getElementById('user-repo').value = location.search.slice(1);
  graph(location.search.slice(1));
}

document.getElementById('render').addEventListener('click', function () {
  var
  repo = document.getElementById('user-repo').value;

  graph(repo);
});

function graph(repo) {
  repo = repo.trim().split('/');

  if (repo.length === 2) {
    request.get('https://api.github.com/repos/' + repo[0] + '/' + repo[1] + '/languages')
      .query({ access_token: '1c1d549be32bd9a094e78007628e7d1e8a46014b' })
      .end(function (err, res) {
        if (err) {
          alert('network error');
          return;
        }
        console.log(res);
        var
        json = JSON.parse(res.text);
        if (json.message && json.documentation_url) {
          alert('invalid repository name');
          return;
        }
        render(repo.join('/'), json);
      });
  } else {
    alert('invalid repository name');
  }
}

function render(repo, json) {
  var
  names = Object.keys(json),
  data = [],
  sum = 0;

  names.forEach(function (name) {
    sum += json[name];
  });

  names.forEach(function (name) {
    var
    color = tinycolor(colors[{
      'C++': 'cpp',
      'C#': 'C Sharp',
    }[name] || name] || '#d8d8d8'),
    val = json[name] / sum;

    data.push({
      label: name,
      color: color.toHexString(),
      highlight: color.lighten().toHexString(),
      value: val,
    });
  });

  data.sort(function (a, b) {
    return b.value - a.value;
  });

  if (pie.clear) pie.clear();
  if (pie.destroy) pie.destroy();
  pie.Pie(data, {
    tooltipTemplate: '<%if (label){%><%=label+": "%><%}%><%=numeral(value).format("0.000%")%>',
    segmentShowStroke: false,
  });

  updateURL('?' + repo);
}

function updateURL(url) {
  history.pushState(null, null, url);

  var
  elems = document.getElementsByClassName('twitter-share-button'),
  i, elem, len = elems.length;

  for (i = 0; i < len; i++) {
    elem = document.createElement('a');
    elem.setAttribute('class', 'twitter-share-button')
    elem.setAttribute('data-via', 'make_now_just');
    elem.setAttribute('data-hashtags', 'repo-lang-graph');
    elem.setAttribute('data-size', 'large');
    elem.setAttribute('data-url', location.href);
    elems[i].parentNode.replaceChild(elem, elems[i]);
  }

  twttr.widgets.load();
}
