$files = Get-ChildItem -Path "c:\Users\Welcome\Desktop\VSCODE\frontend" -Filter "*.html"
foreach ($f in $files) {
  $c = Get-Content $f.FullName -Raw -Encoding UTF8
  if ($c -match "firebase") {
    $c = $c -replace "  <!-- Firebase Compat SDK -->`r?`n", ""
    $c = $c -replace "  <script src=`"https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js`"></script>`r?`n", ""
    $c = $c -replace "  <script src=`"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js`"></script>`r?`n", ""
    $c = $c -replace "  <script src=`"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js`"></script>`r?`n", ""
    $c = $c -replace "  <script src=`"js/firebase-init.js`"></script>`r?`n", ""
    $c = $c -replace "<script src=`"js/firebase-init.js`"></script>`r?`n", ""
    Set-Content $f.FullName $c -Encoding UTF8
    Write-Host "Cleaned: $($f.Name)"
  }
}
