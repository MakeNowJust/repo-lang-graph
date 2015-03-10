#!/bin/bash

set -ve

export LC_ALL=C

npm run gulp build
cd .dest
git init
git remote add origin git@github.com:MakeNowJust/repo-lang-graph.git
git checkout -b gh-pages
git add .
git commit -m "update `date`"
git push --force origin gh-pages
