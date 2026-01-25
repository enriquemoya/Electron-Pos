$src = "C:\enrique\pos\.codex\skills"
$dst = "C:\Users\lemoyatequira_qubeyo\.codex\skills"

Get-ChildItem -Directory $src | ForEach-Object {
  $target = Join-Path $dst $_.Name
  if (Test-Path $target) {
    Remove-Item -Recurse -Force $target
  }
}

Get-ChildItem -Directory $src | ForEach-Object {
  New-Item -ItemType SymbolicLink -Path (Join-Path $dst $_.Name) -Target $_.FullName | Out-Null
}

Write-Host "Symlinks created. Restart Codex."
