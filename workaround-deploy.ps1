# Checkout to a temporary branch with the contents of the build directory
git checkout --orphan gh-pages-temp
git reset --hard
git clean -df
cp -r path/to/build/* .
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages-temp:gh-pages --force
git checkout main
git branch -D gh-pages-temp