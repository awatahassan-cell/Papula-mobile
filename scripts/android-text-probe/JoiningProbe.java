import android.graphics.*;
import android.text.*;
import android.text.style.*;
import org.json.*;
import java.nio.file.*;
import java.io.*;

/** Shell-only raster probe: no app installation, account or app-data changes. */
public class JoiningProbe {
  static final int W=760,H=125;
  static Typeface face;
  static Bitmap render(JSONObject sample,int mode) throws Exception {
    TextPaint paint=new TextPaint(Paint.ANTI_ALIAS_FLAG);
    paint.setTextSize(64);paint.setTypeface(face);paint.setColor(Color.BLACK);
    CharSequence text=sample.getString("text");
    if(mode>0){
      SpannableStringBuilder builder=new SpannableStringBuilder();
      JSONArray runs=sample.getJSONArray("runs");
      for(int i=0;i<runs.length();i++){
        JSONObject run=runs.getJSONObject(i);int start=builder.length();
        builder.append(run.getString(mode==2?"displayText":"text"));int end=builder.length();
        builder.setSpan(new TypefaceSpan(face),start,end,Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        builder.setSpan(new AbsoluteSizeSpan(64),start,end,Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        if(run.getBoolean("target"))builder.setSpan(new ForegroundColorSpan(0xffdc2626),start,end,Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
      }
      text=builder;
    }
    Bitmap image=Bitmap.createBitmap(W,H,Bitmap.Config.ARGB_8888);
    StaticLayout layout=StaticLayout.Builder.obtain(text,0,text.length(),paint,W-48)
      .setTextDirection(TextDirectionHeuristics.RTL).setIncludePad(false).build();
    Canvas canvas=new Canvas(image);canvas.translate(24,8);layout.draw(canvas);return image;
  }
  static int difference(Bitmap a,Bitmap b){int n=0;for(int y=0;y<H;y++)for(int x=0;x<W;x++)if((Color.alpha(a.getPixel(x,y))>100)!=(Color.alpha(b.getPixel(x,y))>100))n++;return n;}
  public static void main(String[] args)throws Exception {
    // app_process bypasses Zygote's normal font preloading.
    java.lang.reflect.Method preload=Typeface.class.getDeclaredMethod("loadPreinstalledSystemFontMap");
    preload.setAccessible(true);preload.invoke(null);
    face=Typeface.createFromFile(args[0]);
    JSONArray cases=new JSONArray(new String(Files.readAllBytes(Paths.get(args[1])),"UTF-8"));
    Bitmap sheet=Bitmap.createBitmap(W*3,(H+30)*cases.length()+40,Bitmap.Config.ARGB_8888);
    Canvas canvas=new Canvas(sheet);canvas.drawColor(Color.WHITE);
    Paint labels=new Paint(Paint.ANTI_ALIAS_FLAG);labels.setColor(Color.BLACK);labels.setTextSize(22);
    canvas.drawText("Original",16,28,labels);canvas.drawText("Old color spans",W+16,28,labels);canvas.drawText("Joining context",W*2+16,28,labels);
    for(int i=0;i<cases.length();i++){
      JSONObject sample=cases.getJSONObject(i);Bitmap base=render(sample,0),old=render(sample,1),joined=render(sample,2);
      int y=40+i*(H+30);canvas.drawBitmap(base,0,y,null);canvas.drawBitmap(old,W,y,null);canvas.drawBitmap(joined,W*2,y,null);
      System.out.println(sample.getString("text")+" oldDiff="+difference(base,old)+" joinedDiff="+difference(base,joined));
    }
    try(FileOutputStream stream=new FileOutputStream(args[2])){sheet.compress(Bitmap.CompressFormat.PNG,100,stream);}
  }
}
