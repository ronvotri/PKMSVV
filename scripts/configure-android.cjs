'use strict';
// A landscape mobile game: apply after 'npx cap add android' (fresh every CI run).
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'..','android','app','src','main','AndroidManifest.xml');
if(!fs.existsSync(file))throw Error('Native Android project not generated');
let xml=fs.readFileSync(file,'utf8');
const main='android:name=".MainActivity"';
if(!xml.includes(main))throw Error('Unexpected Capacitor native template');
if(!xml.includes('android:screenOrientation=')){
 xml=xml.replace(main,main+'\n            android:screenOrientation="sensorLandscape"');
}
fs.writeFileSync(file,xml,'utf8');
console.log('PKMSVV Android forced landscape orientation.');
