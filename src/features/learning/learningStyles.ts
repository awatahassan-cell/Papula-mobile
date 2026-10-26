import { StyleSheet } from 'react-native';
export const learningStyles = StyleSheet.create({
  container:{flexGrow:1,paddingHorizontal:14,paddingTop:6,paddingBottom:12,gap:7,width:'100%',maxWidth:720,alignSelf:'center'},
  title:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:19,color:'#1e293b',textAlign:'center',alignSelf:'stretch'},
  text:{fontFamily:'IBMPlexSansArabic_400Regular',fontSize:15,color:'#475569',textAlign:'center',alignSelf:'stretch'},
  card:{backgroundColor:'#fff7ed',padding:14,borderRadius:28,borderWidth:4,borderColor:'#fcd34d',gap:8,alignItems:'center'},
  emoji:{fontSize:42,textAlign:'center'},
  row:{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'center',width:'100%'},
  tile:{minWidth:70,minHeight:66,padding:8,borderRadius:22,backgroundColor:'#ffffff',borderWidth:4,borderBottomWidth:7,borderColor:'#a5b4fc',justifyContent:'center',alignItems:'center'},
  glyph:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:32,color:'#1e293b',textAlign:'center'},
  button:{minHeight:56,paddingVertical:9,paddingHorizontal:14,borderRadius:22,borderBottomWidth:6,borderBottomColor:'#d97706',backgroundColor:'#fbbf24',alignItems:'center',justifyContent:'center',width:'100%',maxWidth:480,alignSelf:'center'},
  buttonText:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:19,color:'#451a03',textAlign:'center'},
  secondary:{minHeight:48,paddingVertical:7,paddingHorizontal:14,borderRadius:20,borderBottomWidth:5,borderBottomColor:'#818cf8',backgroundColor:'#e0e7ff',alignItems:'center',justifyContent:'center',maxWidth:480,alignSelf:'center'},
  correct:{backgroundColor:'#d1fae5',borderColor:'#10b981'},
  retry:{backgroundColor:'#ffe4e6',borderColor:'#fb7185'},
  disabled:{opacity:0.4},
});
