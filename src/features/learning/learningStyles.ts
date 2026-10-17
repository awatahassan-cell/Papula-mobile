import { StyleSheet } from 'react-native';
export const learningStyles = StyleSheet.create({
  container:{padding:20,paddingBottom:36,gap:16,width:'100%',maxWidth:720,alignSelf:'center'},
  title:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:26,color:'#1e293b',textAlign:'center'},
  text:{fontFamily:'IBMPlexSansArabic_400Regular',fontSize:17,color:'#475569',textAlign:'center'},
  card:{backgroundColor:'#fffbeb',padding:22,borderRadius:28,gap:16,alignItems:'center'},
  emoji:{fontSize:76,textAlign:'center'},
  row:{flexDirection:'row',flexWrap:'wrap',gap:12,justifyContent:'center',width:'100%'},
  tile:{minWidth:68,minHeight:72,padding:12,borderRadius:20,backgroundColor:'#ffffff',borderWidth:2,borderColor:'#cbd5e1',justifyContent:'center',alignItems:'center'},
  glyph:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:38,color:'#1e293b',textAlign:'center'},
  button:{minHeight:64,padding:16,borderRadius:20,backgroundColor:'#047857',alignItems:'center',justifyContent:'center',width:'100%',maxWidth:480,alignSelf:'center'},
  buttonText:{fontFamily:'IBMPlexSansArabic_700Bold',fontSize:20,color:'#ffffff',textAlign:'center'},
  secondary:{minHeight:64,padding:14,borderRadius:20,backgroundColor:'#dbeafe',alignItems:'center',justifyContent:'center',maxWidth:480,alignSelf:'center'},
  correct:{backgroundColor:'#dcfce7',borderColor:'#16a34a'},
  retry:{backgroundColor:'#fef3c7',borderColor:'#d97706'},
  disabled:{opacity:0.4},
});
