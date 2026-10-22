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


// Native fullscreen control: the Fullscreen API can be restricted by WebView.
const mainJava=path.join(__dirname,'..','android','app','src','main','java');
function findMain(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,entry.name);
  if(entry.isDirectory()){const found=findMain(p);if(found)return found;}
  else if(entry.name==='MainActivity.java')return p;
 }
 return null;
}
const mainFile=findMain(mainJava);
if(!mainFile)throw Error('Android MainActivity.java not found');
const src=fs.readFileSync(mainFile,'utf8');
const packageMatch=src.match(/package\s+([\w.]+)\s*;/);
if(!packageMatch)throw Error('Android package declaration not found');
const pkg=packageMatch[1];
fs.writeFileSync(mainFile,[
 'package '+pkg+';',
 'import android.os.Bundle;',
 'import com.getcapacitor.BridgeActivity;',
 'public class MainActivity extends BridgeActivity {',
 '  @Override protected void onCreate(Bundle state){',
 '    registerPlugin(PKMSVVScreen.class);',
 '    super.onCreate(state);',
 '  }',
 '  @Override public void onWindowFocusChanged(boolean focused){',
 '    super.onWindowFocusChanged(focused);',
 '    if(focused) PKMSVVScreen.reapply(this);',
 '  }',
 '}',''
].join('\n'),'utf8');
const nativeSource="package __PACKAGE__;\n\nimport android.app.Activity;\nimport android.view.View;\nimport android.view.Window;\nimport android.view.WindowManager;\nimport com.getcapacitor.JSObject;\nimport com.getcapacitor.Plugin;\nimport com.getcapacitor.PluginCall;\nimport com.getcapacitor.PluginMethod;\nimport com.getcapacitor.annotation.CapacitorPlugin;\n\n@CapacitorPlugin(name = \"PKMSVVScreen\")\npublic class PKMSVVScreen extends Plugin {\n  private static volatile boolean immersive = false;\n  public static void reapply(Activity activity) { if (immersive) apply(activity,true); }\n  private static void apply(Activity activity,boolean enabled) {\n    immersive=enabled;\n    final Window window=activity.getWindow();\n    final View decor=window.getDecorView();\n    if(enabled) {\n      window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);\n      decor.setSystemUiVisibility(\n        View.SYSTEM_UI_FLAG_FULLSCREEN |\n        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |\n        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |\n        View.SYSTEM_UI_FLAG_LAYOUT_STABLE |\n        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |\n        View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION\n      );\n    } else {\n      window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);\n      decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);\n    }\n  }\n  @PluginMethod\n  public void toggle(PluginCall call) {\n    final Boolean requested=call.getBoolean(\"enabled\",true);\n    final boolean enabled=requested!=null && requested;\n    getActivity().runOnUiThread(()->{\n      apply(getActivity(),enabled);\n      JSObject result=new JSObject();\n      result.put(\"enabled\",enabled);\n      call.resolve(result);\n    });\n  }\n}\n";
fs.writeFileSync(path.join(path.dirname(mainFile),'PKMSVVScreen.java'),
  nativeSource.replace('__PACKAGE__',pkg),'utf8');
console.log('PKMSVV: Android native fullscreen bridge ready');
