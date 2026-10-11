const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'web');
const output = path.join(root, 'www');
if (!fs.existsSync(path.join(source, 'login.html'))) {
  throw new Error('Missing web/login.html. Extract the COMPLETE project ZIP first.');
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
// Never copy credentials, env files, test artifacts, or backend source into Android assets.
const allowedExtensions = new Set(['.html','.css','.js','.jpg','.jpeg','.png','.webp','.svg','.gif','.mp4','.ico','.woff','.woff2','.ttf','.json']);
function copyTree(from, to) {
  for (const entry of fs.readdirSync(from,{withFileTypes:true})) {
    if (entry.name.startsWith('.') || entry.name.toLowerCase().includes('secret')) continue;
    const src = path.join(from,entry.name), dest = path.join(to,entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dest,{recursive:true}); copyTree(src,dest);
    } else if (entry.isFile() && allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
      fs.copyFileSync(src,dest);
    }
  }
}
copyTree(source,output);

// Bundle native Google credentials picker into an Android WebView-safe browser script.
// Plugin is only used for account chooser; backend still verifies the signed Google ID token.
require('esbuild').buildSync({
  entryPoints:[path.join(root,'native-src','native-google.js')],
  outfile:path.join(output,'mobile-google-native.js'),
  bundle:true,platform:'browser',format:'iife',target:'es2020',minify:true
});

// Add Android-only style / connection gate to all HTML files, preserving original page scripts and UI.
for (const file of fs.readdirSync(output).filter(x => x.endsWith('.html'))) {
  const filePath = path.join(output,file);
  let html = fs.readFileSync(filePath,'utf8');
  if (/<head\b[^>]*>/i.test(html)) {
    html = html.replace(/<head\b[^>]*>/i,(tag) => `${tag}\n<link rel="stylesheet" href="mobile-app.css"/>\n<script defer src="mobile-app.js"></script>\n<link rel="stylesheet" href="mobile-auth-recovery.css"/>\n<script defer src="mobile-auth-recovery.js"></script>`);
  } else {
    html = `<link rel="stylesheet" href="mobile-app.css"/><script defer src="mobile-app.js"></script>\n` + html;
  }
  // Install native Google sign-in module before original google-auth.js.
  if (['login.html','register.html'].includes(file)) {
    html = html.replace(/<script[^>]+src=["']google-auth\.js[^"']*["'][^>]*><\/script>/i,
      (tag) => `<script defer src="mobile-google-native.js"></script>\n${tag}`);
  }
  // Native WebView does not support Google One Tap sign-in.
  if (['login.html','register.html'].includes(file)) {
    html = html.replace(/\s*<script[^>]+src=["']https:\/\/accounts\.google\.com\/gsi\/client["'][^>]*><\/script>/gi,'');
  }
  fs.writeFileSync(filePath,html);
}

// Keep the original public website landing page as the APK home screen.
// The existing navigation handles Sign In / Create Account / Dashboard.
// IMPORTANT: do not overwrite www/index.html here; doing so caused the APK to
// start on Login instead of showing the website-style home page.
 console.log('ProTrader landing page preserved as Android start screen.');
