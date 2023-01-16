import { Dimensions, StyleSheet, View, Image as ImageRN, StatusBar } from 'react-native'
import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Animated from 'react-native-reanimated'
import PanZoom from '../pan-zoom/PanZoom';
import { Canvas, Circle, useCanvasRef, useImage, Image, Skia } from '@shopify/react-native-skia';

type IProps = {
    imageUrl: string,
}

const ImageEditor: FunctionComponent<IProps> = (props: IProps) => {
    const { imageUrl } = props;
    const { width, height } = Dimensions.get('screen')
    const ref = useCanvasRef();
    const [imageCanvas,setImageCanvas] = useState();
    const [dimensions, setDimensions] = useState({
        imageHeight: 1,
        imageWidth: 1,
        statusbarHeight: 42,
    })
    const getImageSize = useCallback((imageUrl: string) => {
        ImageRN.getSize(imageUrl, (width, height) => {
            console.log(`The image dimensions are ${width}x${height}`);
            setDimensions(state =>({
                imageHeight: height,
                imageWidth: width,
                statusbarHeight: StatusBar.currentHeight as number
            }))
        }, (error) => {
            console.error(`Couldn't get the image size: ${error.message}`);
        });
    },[imageCanvas])
    useEffect(()=>{
        Skia.Data.fromURI(imageUrl).then((data) => {
            const canvasImage: any = Skia.Image.MakeImageFromEncoded(data)
            setImageCanvas(canvasImage);
            getImageSize(imageUrl);
        });
    },[]);
    useEffect(()=>{
        getImageSize(imageUrl);
    },[imageCanvas])
    return (
        <View style={styles.wrapper}>
            <PanZoom>
                <Canvas style={{ 
                    width: width, 
                    height: height, 
                }} ref={ref}>
                    { imageCanvas && 
                        <Image
                        image={imageCanvas}
                        fit="scaleDown"
                        x={0}
                        y={dimensions.statusbarHeight}
                        width={width}
                        height={dimensions.imageHeight*width/dimensions.imageWidth}
                        />
                    }
                </Canvas>
            </PanZoom>
        </View>
    )
}

export default ImageEditor

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: 'rgb(15,15,15)',
    }
})