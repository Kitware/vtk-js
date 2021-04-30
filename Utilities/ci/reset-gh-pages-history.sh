git checkout gh-pages
git checkout --orphan tmp
git add -A
git commit -am "Reset website history"
git branch -D gh-pages
git branch -m gh-pages
git push -f origin gh-pages
