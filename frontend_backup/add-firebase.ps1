$files = @("index.html", "products.html", "product-detail.html", "cart.html", "checkout.html", "dashboard.html", "login.html", "admin.html", "categories.html", "search.html")

$firebaseScripts = @"
  <!-- Firebase Compat SDK -->
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
  <script src="js/firebase-init.js"></script>
"@

foreach ($f in $files) {
  $path = Join-Path "c:\Users\Welcome\Desktop\VSCODE\frontend" $f
  if (Test-Path $path) {
    $content = Get-Content $path -Raw -Encoding UTF8
    # Only add if not already present
    if ($content -notmatch "firebase-init\.js") {
      # Insert before first <script src="js/ tag or before </body>
      if ($content -match '<script src="js/') {
        $content = $content -replace '(<script src="js/)', "$firebaseScripts`n  `$1"
        # Only replace first occurrence — use regex with lazy matching
      } elseif ($content -match '</body>') {
        $content = $content -replace '</body>', "$firebaseScripts`n</body>"
      }
      Set-Content $path $content -Encoding UTF8
      Write-Host "Added Firebase to: $f"
    } else {
      Write-Host "Already has Firebase: $f"
    }
  } else {
    Write-Host "Not found: $f"
  }
}
