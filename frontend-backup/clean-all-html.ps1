$files = Get-ChildItem -Path "c:\Users\Welcome\Desktop\VSCODE\frontend" -Filter "*.html"
foreach ($f in $files) {
  $c = Get-Content $f.FullName -Raw -Encoding UTF8
  
  # Remove all Firebase scripts using regex
  $c = $c -replace '(?s)\s*<!-- Firebase Compat SDK -->.*?<script src="js/firebase-init\.js"></script>', ''
  
  # Inject it cleanly once right before <script src="js/app.js">
  $firebaseBlock = @"

  <!-- Firebase Compat SDK -->
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
  <script src="js/firebase-init.js"></script>
"@

  $c = $c -replace '(<script src="js/app\.js")', "$firebaseBlock`n  `$1"
  
  Set-Content $f.FullName $c -Encoding UTF8
  Write-Host "Cleaned: $($f.Name)"
}
