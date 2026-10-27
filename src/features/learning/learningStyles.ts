import { StyleSheet } from 'react-native';
export const learningStyles = StyleSheet.create({
  container:{flexGrow:1,paddingHorizontal:14,paddingTop:8,paddingBottom:16,gap:10,width:'100%',maxWidth:720,alignSelf:'center'},
  title:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:21,lineHeight:34,color:'#1e1b4b',textAlign:'center',alignSelf:'stretch'},
  text:{fontFamily:'IBMPlexSansArabic_600SemiBold',fontSize:15,lineHeight:25,color:'#334155',textAlign:'center',alignSelf:'stretch'},
  card:{backgroundColor:'#fffbeb',padding:16,borderRadius:30,borderWidth:4,borderBottomWidth:8,borderColor:'#fbbf24',borderBottomColor:'#d97706',gap:12,alignItems:'center',width:'100%'},
  emoji:{fontSize:54,textAlign:'center'},
  row:{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'center',width:'100%'},
  tile:{minWidth:76,minHeight:76,paddingHorizontal:12,paddingVertical:10,borderRadius:24,backgroundColor:'#ffffff',borderWidth:4,borderBottomWidth:7,borderColor:'#818cf8',borderBottomColor:'#4f46e5',justifyContent:'center',alignItems:'center'},
  glyph:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:36,lineHeight:52,color:'#1e1b4b',textAlign:'center'},
  button:{minHeight:60,paddingVertical:10,paddingHorizontal:18,borderRadius:24,borderWidth:3,borderColor:'#fde68a',borderBottomWidth:7,borderBottomColor:'#d97706',backgroundColor:'#fbbf24',alignItems:'center',justifyContent:'center',width:'100%',maxWidth:480,alignSelf:'center'},
  buttonText:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:20,color:'#451a03',textAlign:'center'},
  secondary:{minHeight:50,paddingVertical:8,paddingHorizontal:16,borderRadius:22,borderWidth:3,borderColor:'#c7d2fe',borderBottomWidth:6,borderBottomColor:'#6366f1',backgroundColor:'#e0e7ff',alignItems:'center',justifyContent:'center',maxWidth:480,alignSelf:'center'},
  correct:{backgroundColor:'#d1fae5',borderColor:'#34d399',borderBottomColor:'#059669'},
  retry:{backgroundColor:'#ffe4e6',borderColor:'#fb7185',borderBottomColor:'#e11d48'},
  disabled:{opacity:0.42},
});
