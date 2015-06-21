var
bloem     = require('bloem.js')
Chart     = require('chart.js'),
numeral   = require('numeral'),
request   = require('superagent'),
tinycolor = require('tinycolor2');

var
// from https://github.com/doda/github-language-colors
colors = require('./colors.json');

var
canvas = document.getElementById('graph-canvas');

// === flow ===

var
renderFlow = validateRepoName()
  .map(getLanguageData)
  .map(calcLanguageData)
  .reduceMap(renderGraph, null)
  .map(updateLegend)
  .map(updateUrl),
renderStart = event('graph-data', 'submit')
  .map(value('user-repo'));

renderStart.connect(renderFlow)
  .rescue(function (err) {
    if (err) {
      alert(err.message || err);
      console.log(err);
    }
  });

if (location.search.length >= 1) {
  document.getElementById('user-repo').value = location.search.slice(1);
  bloem.fromArray([location.search.slice(1)]).connect(renderFlow);
}


// === actions ===

function event(id, eventName) {
  var
  pomp = bloem.Pomp();

  document.getElementById(id).addEventListener(eventName, function (e) {
    e.preventDefault();
    pomp.send(e);
  });

  return pomp;
}

function keyIsEnter(e) {
  return e.keyCode === 13; // Enter
}

function value(id) {
  var
  elem = document.getElementById(id);

  return function () {
    return elem.value;
  };
}

function validateRepoName() {
  return bloem.map(function validate(value) {
    value = value.trim().split('/');

    if (value.length !== 2 || !value[0] || !value[1]) {
      throw 'invalid repository name';
    }

    return value.map(encodeURI).join('/');
  }).reduce(function checkLastRepoName(lastRepoName, repo) {
    if (lastRepoName === repo) {
      throw false; // skip
    }

    return repo;
  }, '');
}

function getLanguageData(repo, next) {
  request.get('https://api.github.com/repos/' + repo + '/languages')
    .query({ access_token: '1c1d549be32bd9a094e78007628e7d1e8a46014b' })
    .end(function (err, res) {
      if (err !== null) {
        return next('request error');
      }
      console.log(res);

      var
      json = JSON.parse(res.text);
      if (json.message && json.documentation_url) {
        return next('request error');
      }

      next(null, {
        json: json,
        repo: repo,
      });
    });
}

function calcLanguageData(mem) {
  var
  json = mem.json,
  names = Object.keys(json),
  data = [],
  sum = 0;

  names.forEach(function (name) {
    sum += json[name];
  });

  names.forEach(function (name) {
    var
    color = tinycolor(colors[name] || '#d8d8d8'),
    val = json[name] / sum;

    data.push({
      label: name,
      color: color.toHexString(),
      highlight: color.lighten().toHexString(),
      value: val,
      bytes: json[name],
    });
  });

  data.sort(function (a, b) {
    return b.value - a.value;
  });

  mem.data = data;
  return mem;
}

function renderGraph(chart, mem) {
  if (chart && chart.destroy) chart.destroy();

  chart = new Chart(canvas.getContext('2d')).Pie(mem.data, {
    tooltipTemplate: function (context) {
      return context.label + ': ' + numeral(context.value).format('0.000%');
    },
    segmentShowStroke: false,
  });

  return [chart, mem];
}

function updateLegend(mem) {
  var
  data = mem.data,
  legendSection = document.getElementById('legend'),
  legendTable = document.getElementById('legend-table'),
  body;


  if (legendTable !== null) {
    legendSection.removeChild(legendTable);
  }
  legendTable = element('table', undefined, {id: 'legend-table'});

  legendTable.appendChild(element('caption', [
    element('a', mem.repo, {
      href: 'https://github.com/' + mem.repo,
    })]));

  legendTable.appendChild(element('thead', [
    element('tr', [
      element('th', 'Language'),
      element('th', 'Bytes (Percent)'),
    ])]));

  body = element('tbody');

  mem.data.forEach(function (data) {
    var
    row = element('tr', [
      element('td', [
        element('a', data.label, {
          href: 'https://github.com/' + mem.repo + '/search?q=' + encodeURIComponent('language:' + JSON.stringify(data.label)),
        })]),
      element('td', data.bytes + 'byte' + (data.bytes === 1 ? '' : 's') + 
        ' (' + numeral(data.value).format('0.000%') + ')'),
    ]);
    row.style.borderBottom = '3px solid ' + data.color;
    body.appendChild(row);
  });

  legendTable.appendChild(body);
  legendSection.appendChild(legendTable);

  return mem.repo;
}

function updateUrl(repo) {
  history.pushState(null, null, '?' + repo);
}


// == utilities ==

function element(tag, content, attr) {
  var
  el = document.createElement(tag);

  if (Array.isArray(content)) {
    content.forEach(function (child) {
      el.appendChild(child);
    });
  } else if (typeof content !== 'undefined') {
    el.textContent = el.innerText = content;
  }

  if (attr) {
    Object.keys(attr).forEach(function (name) {
      el.setAttribute(name, attr[name]);
    });
  }

  return el;
}
