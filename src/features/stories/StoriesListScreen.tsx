import { useResponsive } from '../../theme/responsive';
import React,{useEffect,useState} from 'react';
import {FlatList,Image,View,TouchableOpacity,StyleSheet,ScrollView} from 'react-native';
import {Text} from '../../components/RTLText';
import {BookOpen,Shapes,Headphones,ArrowLeft,Check,Lock,Sparkles,WholeWord} from 'lucide-react-native';
import {useAppearance,useThemeStyles} from '../../theme/useAppearance';
import {storiesRepo} from '../../services/repositories';
import {soundService} from '../../services/soundService';
import {StoryItem} from '../../services/types';
import {useAppStore} from '../../store/useAppStore';
import {PERSONAL_STORY_TEMPLATES,templateWords,personalStories} from '../../services/learningEngine';
import {readingPracticeStories} from '../../services/foundationalLearning';
import {lessonPath} from '../../services/lessonPath';
import {WordBuilder} from '../learning/WordBuilder';
import {getLetterStories} from '../../data/letterStories';
import {alfubeNweStories} from '../../data/alfubeNweStories';
import {mockLetters} from '../../data/mockLetters';

type ShelfItem={id:string;story?:StoryItem;template?:typeof PERSONAL_STORY_TEMPLATES[number];heading?:string;subtitle?:string};
export const StoriesListScreen:React.FC=()=>{
 const s=useThemeStyles(baseStyles),{colors:c}=useAppearance();
 const {currentProfile,parentSettings,setSelectedStory,setRoute,setPaywallOpen}=useAppStore();
 const {tablet,wide,pageMax}=useResponsive();
 const columns=wide?3:tablet?2:1;
 const [category,setCategory]=useState<'letters'|'words'>('letters');
 const [letterId,setLetterId]=useState<string|null>(()=>lessonPath(currentProfile).find(item=>item.status==='current')?.letter.id||mockLetters[0].id);
 const [stories,setStories]=useState<StoryItem[]>([]);
 const [wordLesson,setWordLesson]=useState<string|null>(null);
 const [loadError,setLoadError]=useState(false);
 useEffect(()=>{let active=true;void storiesRepo.getAllStories().then(items=>{if(active)setStories(items);}).catch(()=>{if(active)setLoadError(true);});return()=>{active=false;void soundService.stopSpeaking();};},[]);
 const open=(story:StoryItem)=>{void soundService.stopSpeaking();if(story.isPremium&&!parentSettings.isSubscribed){setPaywallOpen(true);return;}setSelectedStory(story);setRoute('story-reader');};
 const ready=personalStories(currentProfile),reading=readingPracticeStories(currentProfile);
 const letterStories=letterId?getLetterStories(letterId):alfubeNweStories;
 const selectedLetter=mockLetters.find(letter=>letter.id===letterId);
 const data:ShelfItem[]=category==='letters'?letterStories.map(story=>({id:story.id,story})):[
  ...PERSONAL_STORY_TEMPLATES.map(template=>({id:template.id,template})),
  {id:'reading-heading',heading:'خۆم دەخوێنمەوە',subtitle:reading.length?'ڕستەی کورت بە پیت و وشە ناسراوەکانت.':'بە فێربوونی پیت و وشە، چیرۆکی گونجاو لێرە بۆت دەکرێتەوە.'},
  ...reading.map(story=>({id:story.id,story})),
  {id:'listening-heading',heading:'با گوێ لە چیرۆک بگرین',subtitle:'چیرۆکی هەمەڕەنگ بۆ کاتی گوێگرتن.'},
  ...stories.filter(story=>!story.targetLetterId&&!story.sourceBook).map(story=>({id:story.id,story})),
 ];
 if(wordLesson)return <WordBuilder key={wordLesson} initialWords={templateWords(wordLesson)} onExit={()=>setWordLesson(null)} onComplete={()=>setWordLesson(null)}/>;
 const header=<View style={s.intro}>
  <View style={s.welcome}><View style={s.welcomeIcon}><BookOpen size={29} color={c.mint} strokeWidth={1.7}/></View><View style={s.copy}><Text style={s.welcomeTitle}>دنیای چیرۆکەکان</Text><Text style={s.hint}>چیرۆکێک هەڵبژێرە و گوێ بگرە.</Text></View><Sparkles size={21} color={c.coralDark}/></View>
  <View accessibilityRole="tablist" style={s.categoryTabs}>{([{id:'letters',label:'چیرۆکی پیتەکان',Icon:Shapes},{id:'words',label:'چیرۆکی وشەکان',Icon:WholeWord}] as const).map(({id,label,Icon})=><TouchableOpacity key={id} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{selected:category===id}} aria-selected={category===id} onPress={()=>setCategory(id)} style={[s.categoryTab,category===id&&s.categoryActive]}><Icon size={24} color={category===id?c.mint:c.muted} strokeWidth={1.8}/><Text style={[s.categoryLabel,category===id&&s.categoryLabelActive]}>{label}</Text></TouchableOpacity>)}</View>
  {category==='letters'?<>
   <View style={s.sectionHeading}><Text style={s.sectionTitle}>پیتێک هەڵبژێرە</Text><Text style={s.sectionCount}>{alfubeNweStories.length} چیرۆکی وێنەدار</Text></View>
   <ScrollView testID="story-letter-rail" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.letterRail} style={s.railFrame}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="هەموو چیرۆکی پیتەکان" accessibilityState={{selected:letterId===null}} onPress={()=>setLetterId(null)} style={[s.letterChip,s.allChip,letterId===null&&s.letterActive]}><Shapes size={18} color={letterId===null?'#fff':c.mint}/><Text style={[s.allText,letterId===null&&s.chipActiveText]}>هەمووی</Text></TouchableOpacity>
    {mockLetters.map(letter=><TouchableOpacity key={letter.id} accessibilityRole="button" accessibilityLabel={`چیرۆکی پیتی ${letter.glyph}`} accessibilityState={{selected:letterId===letter.id}} onPress={()=>setLetterId(letter.id)} style={[s.letterChip,letterId===letter.id&&s.letterActive]}><Text style={[s.letterGlyph,letterId===letter.id&&s.chipActiveText]}>{letter.glyph}</Text></TouchableOpacity>)}
   </ScrollView>
   <View style={s.shelfHeading}><View style={s.smallIcon}><Headphones size={18} color={c.mint}/></View><View style={s.copy}><Text style={s.shelfTitle}>{selectedLetter?`چیرۆکی پیتی «${selectedLetter.glyph}»`:'هەموو چیرۆکی پیتەکان'}</Text><Text style={s.hint}>پیتەکە لە ناو چیرۆکدا بدۆزەوە.</Text></View></View>
  </>:<View style={s.shelfHeading}><View style={s.smallIcon}><WholeWord size={20} color={c.mint}/></View><View style={s.copy}><Text style={s.shelfTitle}>وشەکان فێر ببە، چیرۆکەکە بکەرەوە</Text><Text style={s.hint}>سێ وشەی بچووک، سەرەتای چیرۆکێکی خۆش.</Text></View></View>}
 </View>;
 const renderItem=({item}:{item:ShelfItem})=>{
  if(item.heading)return <View style={s.groupHeading}><Text style={s.sectionTitle}>{item.heading}</Text><Text style={s.hint}>{item.subtitle}</Text>{loadError&&item.id==='listening-heading'&&<Text style={s.hint}>چیرۆکەکان بار نەکران؛ تکایە دووبارە بەشەکە بکەرەوە.</Text>}</View>;
  const template=item.template,words=template?templateWords(template.id):[];
  const story=template?ready.find(entry=>entry.id===template.id):item.story;
  const title=template?.title||story!.titleKu;
  const completed=!!story&&currentProfile.readStoryIds.includes(story.id),premium=!!story?.isPremium&&!parentSettings.isSubscribed;
  const learned=words.filter(word=>currentProfile.learnedWordIds?.includes(word.id)).length;
  const action=()=>template&&!story?setWordLesson(template.id):open(story!);
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${title}، ${template&&!story?'فێربوونی وشەکان':premium?'چیرۆکی تایبەت':'خوێندنەوەی چیرۆک'}`} onPress={action} activeOpacity={.88} style={s.bookCard}>
   <View style={[s.cover,template&&s.wordCover]}>
    {story?.coverImage!==undefined?<Image source={story.coverImage} accessible={false} resizeMode="contain" style={s.coverImage}/>:<View style={s.coverScene}><View style={s.coverHalo}><Text style={s.coverEmoji}>{template?.emoji||story?.coverEmoji||'📖'}</Text></View><View style={s.coverStar}><Sparkles size={26} color={c.coralDark}/></View><View style={s.coverBook}><BookOpen size={25} color={c.mint}/></View></View>}
    <View style={s.coverBadge}>{completed?<Check size={15} color={c.mint}/>:premium?<Lock size={15} color={c.muted}/>:category==='letters'?<Shapes size={15} color={c.mint}/>:<Headphones size={15} color={c.mint}/>}<Text style={s.badgeText}>{completed?'خوێندراوەتەوە':premium?'پەپوولە پڵەس':template?'بە وشەکانی تۆ':category==='letters'?'چیرۆکی پیت':'چیرۆکی گوێگرتن'}</Text></View>
   </View>
   <View style={s.bookBody}><Text style={s.bookTitle}>{title}</Text>
    {template?<><View style={s.wordChips}>{words.map(word=><View key={word.id} style={[s.wordChip,currentProfile.learnedWordIds?.includes(word.id)&&s.wordKnown]}>{currentProfile.learnedWordIds?.includes(word.id)&&<Check size={13} color={c.mint}/>}<Text style={s.wordText}>{word.word}</Text></View>)}</View><View style={s.wordProgress} accessibilityRole="progressbar" accessibilityLabel="وشە فێربووەکان" accessibilityValue={{min:0,max:words.length,now:learned}}>{words.map((word,index)=><View key={word.id} style={[s.wordProgressPart,index<learned&&s.wordProgressDone]}/>)}</View></>:<Text numberOfLines={2} style={s.summary}>{story?.summaryKu||story?.pages[0]?.textKu}</Text>}
    <View style={s.bookFooter}><View style={s.readButton}>{template&&!story?<WholeWord size={19} color="#fff"/>:<BookOpen size={19} color="#fff"/>}<Text style={s.readText}>{template&&!story?'وشەکان فێر ببە':'چیرۆکەکە بخوێنەوە'}</Text><ArrowLeft size={17} color="#fff"/></View>{story&&story.pages.length>1&&<Text style={s.pageCount}>{story.pages.length} لاپەڕە</Text>}</View>
   </View>
  </TouchableOpacity>;
 };
 // Books sit in rows of `columns`; headings always take a full row of their own.
 type Row={id:string;items:ShelfItem[]};
 const rows:Row[]=[];
 for(const item of data){
  const last=rows[rows.length-1];
  if(item.heading||!last||last.items[0].heading||last.items.length>=columns)rows.push({id:item.id,items:[item]});else last.items.push(item);
 }
 const renderRow=({item:row}:{item:Row})=>row.items[0].heading||columns===1?renderItem({item:row.items[0]}):<View style={s.bookRow}>
  {row.items.map(entry=><View key={entry.id} style={s.bookCell}>{renderItem({item:entry})}</View>)}
  {Array.from({length:columns-row.items.length}).map((_,i)=><View key={'pad'+i} style={s.bookCell}/>)}
 </View>;
 return <FlatList key={category+columns} data={rows} keyExtractor={row=>row.id} renderItem={renderRow} ListHeaderComponent={header} contentContainerStyle={[s.container,tablet&&{maxWidth:pageMax}]} initialNumToRender={4} maxToRenderPerBatch={4} windowSize={5} showsVerticalScrollIndicator={false}/>;
};
const baseStyles=StyleSheet.create({
 bookRow:{flexDirection:'row',gap:16,alignItems:'stretch'},bookCell:{flex:1,minWidth:0},
 container:{padding:16,paddingBottom:28,gap:16,direction:'rtl'},intro:{gap:16},welcome:{flexDirection:'row',alignItems:'center',gap:10,padding:12,borderRadius:24,backgroundColor:'#e3f5ec'},welcomeIcon:{width:44,height:48,borderRadius:17,backgroundColor:'#ffffff',alignItems:'center',justifyContent:'center'},copy:{flex:1,minWidth:0,gap:4},welcomeTitle:{fontSize:20,lineHeight:30,fontFamily:'IBMPlexSansArabic_700Bold',color:'#243b3a'},hint:{fontSize:13,lineHeight:24,color:'#657d79'},categoryTabs:{flexDirection:'row',backgroundColor:'#eaf0ed',borderRadius:22,padding:5,gap:6},categoryTab:{flex:1,minWidth:0,minHeight:86,padding:10,borderRadius:18,alignItems:'center',justifyContent:'center',gap:8},categoryActive:{backgroundColor:'#ffffff'},categoryLabel:{fontSize:15,lineHeight:24,textAlign:'center',fontFamily:'IBMPlexSansArabic_600SemiBold',color:'#657d79'},categoryLabelActive:{color:'#176445'},sectionHeading:{flexDirection:'row',gap:10,alignItems:'center',justifyContent:'space-between'},sectionTitle:{fontSize:19,fontFamily:'IBMPlexSansArabic_700Bold',color:'#243b3a',flexShrink:1},sectionCount:{fontSize:11,color:'#657d79'},railFrame:{width:'100%'},letterRail:{flexDirection:'row',gap:8,paddingVertical:4},letterChip:{width:50,height:54,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:'#ffffff',borderWidth:1,borderColor:'#dce9e1'},allChip:{width:94,flexDirection:'row',gap:6},letterActive:{backgroundColor:'#23875f',borderColor:'#23875f'},letterGlyph:{fontSize:27,lineHeight:43,fontFamily:'IBMPlexSansArabic_700Bold',color:'#243b3a'},allText:{fontSize:13,color:'#176445'},chipActiveText:{color:'#ffffff'},shelfHeading:{flexDirection:'row',alignItems:'center',gap:10},smallIcon:{width:40,height:40,borderRadius:14,backgroundColor:'#e3f5ec',alignItems:'center',justifyContent:'center'},shelfTitle:{fontSize:17,fontFamily:'IBMPlexSansArabic_600SemiBold',color:'#243b3a'},groupHeading:{gap:5,paddingTop:12,paddingBottom:4},bookCard:{flexGrow:1,backgroundColor:'#ffffff',borderWidth:1,borderColor:'#dce9e1',borderRadius:27,overflow:'hidden'},cover:{width:'100%',aspectRatio:1.55,backgroundColor:'#fff0df',position:'relative'},wordCover:{backgroundColor:'#eeebff',aspectRatio:1.85},coverImage:{position:'absolute',top:0,left:0,width:'100%',height:'100%'},coverScene:{flex:1,alignItems:'center',justifyContent:'center'},coverHalo:{width:108,height:108,borderRadius:54,backgroundColor:'#ffffff',alignItems:'center',justifyContent:'center'},coverEmoji:{fontSize:66},coverStar:{position:'absolute',top:'20%',right:'16%'},coverBook:{position:'absolute',bottom:'18%',left:'17%'},coverBadge:{position:'absolute',top:12,right:12,flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:9,paddingVertical:5,borderRadius:11,backgroundColor:'#ffffff'},badgeText:{fontSize:11,color:'#176445'},bookBody:{padding:18,gap:12},bookTitle:{fontSize:25,lineHeight:37,fontFamily:'IBMPlexSansArabic_700Bold',color:'#243b3a'},summary:{fontSize:15,lineHeight:28,color:'#657d79'},bookFooter:{flexDirection:'row',alignItems:'center',gap:12},readButton:{minHeight:54,flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#23875f',borderBottomWidth:3,borderBottomColor:'#176445',padding:10,borderRadius:17},readText:{fontSize:15,fontFamily:'IBMPlexSansArabic_700Bold',color:'#ffffff',flexShrink:1},pageCount:{fontSize:11,color:'#657d79'},wordChips:{flexDirection:'row',flexWrap:'wrap',gap:8},wordChip:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:6,borderRadius:12,backgroundColor:'#f4f9f6',borderWidth:1,borderColor:'#dce9e1'},wordKnown:{backgroundColor:'#e3f5ec'},wordText:{fontSize:15,color:'#243b3a'},wordProgress:{flexDirection:'row',gap:5},wordProgressPart:{flex:1,height:5,borderRadius:3,backgroundColor:'#eaf0ed'},wordProgressDone:{backgroundColor:'#23875f'},
});
