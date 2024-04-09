Push-Location D:\T3\Projects\self\spell-and-speak
npm run build
cd ..
rm -r .\spell-and-speak-build\static\
cp -R .\spell-and-speak\build\* spell-and-speak-build
cd .\spell-and-speak-build\

Get-ChildItem -Recurse -File | ForEach-Object {
    (Get-Content $_.FullName) -replace 'spell-and-speak', 'spell-and-speak-build' | Set-Content $_.FullName
}

git a "updates"
git push
Pop-Location
