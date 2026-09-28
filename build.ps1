# Builds index.html (single self-contained file, CSS + JS inline)
# and mirrors src into the WordPress theme's front-page.php.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

$body = Get-Content "$root\src\_body.html" -Raw
$css  = Get-Content "$root\src\css\theme.css" -Raw
$js   = Get-Content "$root\src\js\main.js"    -Raw

$title = "AZ Garage Door | Garage door repair in Phoenix, Scottsdale, Tempe, Mesa and Chandler"
$desc  = "Garage door repair across Phoenix, Scottsdale, Tempe, Mesa and Chandler, any hour. " +
         "Springs from `$175 plus `$99 labour, openers from `$129, no trip fee and a five-year " +
         "spring warranty. Owner operated since 2011. Call or text 480-821-1111."

# ---- HTML page ---------------------------------------------------------

$head = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>$title</title>
<meta name="description" content="$desc">
<meta name="theme-color" content="#1a3e9c">
<meta name="format-detection" content="telephone=yes">

<link rel="icon" href="assets/images/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="assets/images/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="assets/images/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="assets/images/favicon-180.png">

<meta property="og:type" content="website">
<meta property="og:title" content="$title">
<meta property="og:description" content="$desc">
<meta property="og:image" content="assets/images/favicon-512.png">
<meta name="twitter:card" content="summary_large_image">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Archivo:wght@400;500;600;700&display=swap">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "AZ Garage Door",
  "url": "https://azgaragedoor.com/",
  "telephone": "+1-480-821-1111",
  "email": "service@azgaragedoor.com",
  "foundingDate": "2011",
  "priceRange": "`$`$",
  "areaServed": ["Phoenix","Scottsdale","Tempe","Mesa","Chandler"],
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "00:00",
    "closes": "23:59"
  }
}
</script>

<style>
$css
</style>
</head>
<body>
"@

$tail = @"

<script>
$js
</script>
</body>
</html>
"@

Set-Content -Path "$root\index.html" -Value ($head + $body + $tail) -Encoding utf8
Write-Host "index.html written"

# ---- WordPress theme ---------------------------------------------------

$wp = "$root\wordpress-theme"

# assets referenced from PHP go through get_template_directory_uri()
$wpBody = $body -replace 'assets/', '<?php echo esc_url( get_template_directory_uri() ); ?>/assets/'

$fp = @"
<?php
/**
 * Front page template for AZ Garage Door.
 *
 * @package AZ_Garage_Door
 */

get_header();
?>
$wpBody
<?php
get_footer();
"@

Set-Content -Path "$wp\front-page.php" -Value $fp -Encoding utf8

Set-Content -Path "$wp\assets\css\theme.css" -Value $css -Encoding utf8
Set-Content -Path "$wp\assets\js\main.js"    -Value $js  -Encoding utf8

Copy-Item "$root\assets\images\*" "$wp\assets\images\" -Recurse -Force

Write-Host "wordpress-theme updated"
