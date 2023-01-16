import { Dimensions, Image, StyleSheet, View } from 'react-native'
import React, { FunctionComponent } from 'react'
import Animated from 'react-native-reanimated'

type IProps = {
    imageUrl: string,
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

const ImageEditor: FunctionComponent<IProps> = (props: IProps) => {
    const { imageUrl } = props
    return (
        <View style={styles.wrapper}>
            <AnimatedImage 
            source={{uri: imageUrl}} 
            style={[{width: Dimensions.get('window').width, flex:1, resizeMode: 'contain'}]}
            >
            </AnimatedImage>
        </View>
    )
}

export default ImageEditor

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: 'rgb(15,15,15)'
    }
})