$files = Get-ChildItem -Path "c:\Users\Welcome\Desktop\VSCODE\frontend" -Filter "*.html"
foreach ($f in $files) {
  $c = Get-Content $f.FullName -Raw -Encoding UTF8
  
  if ($c -notmatch '<script src="js/firebase-config\.js"></script>') {
    $c = $c -replace '<script src="js/firebase-init\.js"></script>', "<script src=`"js/firebase-config.js`"></script>`n  <script src=`"js/firebase-init.js`"></script>"
    Set-Content $f.FullName $c -Encoding UTF8
    Write-Host "Updated $($f.Name)"
  }
}
