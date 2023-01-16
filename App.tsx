import { SafeAreaView, StyleSheet, View } from 'react-native';
import ImageEditor from './src/components/image-editor/ImageEditor';

export default function App() {
  return (
    <SafeAreaView style={{flex:1}}>
      <View style={styles.container}>
        <ImageEditor imageUrl={'https://media.istockphoto.com/id/532966784/photo/bright-orange-flowers-of-geum-coccineum.jpg?s=612x612&w=0&k=20&c=DLG4hlbZ-XyW8VtktZaB-sWCElO3TPPyDVfC5B557mk='}></ImageEditor>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
