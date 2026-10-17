import { StyleSheet } from 'react-native';
export const learningStyles = StyleSheet.create({
  container:{paddingHorizontal:14,paddingTop:6,paddingBottom:12,gap:7,width:'100%',maxWidth:720,alignSelf:'center'},
  title:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:19,color:'#1e293b',textAlign:'center',alignSelf:'stretch'},
  text:{fontFamily:'IBMPlexSansArabic_400Regular',fontSize:15,color:'#475569',textAlign:'center',alignSelf:'stretch'},
  card:{backgroundColor:'#f1ebff',padding:12,borderRadius:24,gap:7,alignItems:'center'},
  emoji:{fontSize:42,textAlign:'center'},
  row:{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'center',width:'100%'},
  tile:{minWidth:62,minHeight:58,padding:8,borderRadius:18,backgroundColor:'#ffffff',borderWidth:2,borderColor:'#cbd5e1',justifyContent:'center',alignItems:'center'},
  glyph:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:32,color:'#1e293b',textAlign:'center'},
  button:{minHeight:48,paddingVertical:9,paddingHorizontal:12,borderRadius:18,backgroundColor:'#047857',alignItems:'center',justifyContent:'center',width:'100%',maxWidth:480,alignSelf:'center'},
  buttonText:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:18,color:'#ffffff',textAlign:'center'},
  secondary:{minHeight:42,paddingVertical:7,paddingHorizontal:12,borderRadius:16,backgroundColor:'#dbeafe',alignItems:'center',justifyContent:'center',maxWidth:480,alignSelf:'center'},
  correct:{backgroundColor:'#dcfce7',borderColor:'#16a34a'},
  retry:{backgroundColor:'#fef3c7',borderColor:'#d97706'},
  disabled:{opacity:0.4},
});
