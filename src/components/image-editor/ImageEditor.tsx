import { Dimensions, StyleSheet, View, Image as ImageRN, StatusBar } from 'react-native'
import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Animated from 'react-native-reanimated'
import PanZoom from '../pan-zoom/PanZoom';
import { Canvas, Circle, useCanvasRef, useImage, Image, Skia, SkPath, Path } from '@shopify/react-native-skia';

type IProps = {
    imageUrl: string,
    enablePanZoom: boolean
}

const ImageEditor: FunctionComponent<IProps> = (props: IProps) => {
    const { imageUrl } = props;
    const { width: screenWidth, height: screenHeight } = Dimensions.get('screen')
    const ref = useCanvasRef();
    const [imageCanvas,setImageCanvas] = useState();
    const [dimensions, setDimensions] = useState({
        imageHeight: 1,
        imageWidth: 1,
        statusbarHeight: 0,
        scaleFactor: {scaleHeight: 1, scaleWidth: 1},
    });
    const paths: any = useRef();
    const getPaths = (allPaths: string[])=>{
        paths.current = allPaths;
        console.log(paths.current);
    };
    const getImageSize = useCallback((imageUrl: string) => {
        ImageRN.getSize(imageUrl, (width, height) => {
            console.log(`The image dimensions are ${width}x${height}`);
            let scaleFactor = {scaleHeight: 1, scaleWidth: 1};
            if(height> width) {
                scaleFactor = {
                    ...scaleFactor,
                    scaleHeight:screenHeight/height
                }
            } else {
                scaleFactor = {
                    ...scaleFactor,
                    scaleWidth:screenWidth/width
                }
            }
            console.log(scaleFactor)
            setDimensions(state => ({
                imageHeight: height,
                imageWidth: width,
                statusbarHeight: StatusBar.currentHeight as number,
                scaleFactor: scaleFactor
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
            <PanZoom 
            enable={props.enablePanZoom} 
            getPaths={(e: string[]) => getPaths(e)}
            >
                <Canvas style={{ 
                    width: dimensions.imageWidth*dimensions.scaleFactor.scaleWidth, 
                    height: dimensions.imageHeight*dimensions.scaleFactor.scaleHeight, 
                }} ref={ref}>
                    { imageCanvas && 
                        <Image
                        image={imageCanvas}
                        fit="contain"
                        x={0}
                        y={0}
                        width={dimensions.imageWidth*dimensions.scaleFactor.scaleWidth}
                        height={dimensions.imageHeight*dimensions.scaleFactor.scaleHeight}
                        />
                    }
                    { paths?.current?.length &&
                        paths.current.map((path: string,i: number) => (<>
                            <Path
                                key={i}
                                path={'M 139 139 L 139 139 L 148 148 L 156 156 L 164 164 L 175 175 L 186 186 L 194 194 L 202 202 L 207 207 L 209 209 L 213 213 L 214 214 L 215 215 L 216 216 L 216 216 L 216 216 L 216 216 L 216 216 L 216 216 L 216 216'}
                                color="white"
                                style={'stroke'}
                                strokeWidth={5}
                                strokeJoin={'round'}
                                antiAlias={true}
                            />        
                        </>))
                    }
                    {/* <Path
                        path="M 128 0 L 168 80 L 256 93 L 192 155 L 207 244 L 128 202 L 49 244 L 64 155 L 0 93"
                        color="lightblue"
                        style={'stroke'}
                        strokeWidth={10}
                        strokeJoin={'round'}
                        antiAlias={true}
                    /> */}
                </Canvas>
            </PanZoom>
        </View>
    )
}

export default ImageEditor

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        borderWidth:2,
        borderColor: 'red'
    }
})