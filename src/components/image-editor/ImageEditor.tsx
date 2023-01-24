import { Dimensions, StyleSheet, View, Image as ImageRN, StatusBar } from 'react-native'
import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import { runOnJS, runOnUI, useSharedValue } from 'react-native-reanimated'
import PanZoom from '../pan-zoom/PanZoom';
import { Canvas, Circle, useCanvasRef, useImage, Image, Skia, SkPath, Path, useTouchHandler } from '@shopify/react-native-skia';
import { SketchCanvas, SketchCanvasRef } from 'rn-perfect-sketch-canvas';
import uuid from 'react-native-uuid';

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
    const [paths, setPaths] = useState<string[]>([]);
    const [completedPaths, setCompletedPaths] = useState<string[]>([]);
    const [enable, setEnable] = useState(props.enablePanZoom);
    const [pathString, setPathString] = useState<string>('');

    const createPath = (x: number, y:number, isFirst: boolean, isLast: boolean) => {
        if(isFirst) {
            setPath(`M ${Math.round(x)} ${Math.round(y)}`);
        } else if (isLast) {
            setCompletedPaths([...completedPaths, pathString])
        } else {
            setPath(pathString+` L ${Math.round(x)} ${Math.round(y)}`)
        }
    }

    const setPath = useCallback((path: string) => {
        setPathString(state => state+path);
    },[pathString])

    useEffect(()=>{
        setEnable(props.enablePanZoom)
    },[props.enablePanZoom])
    const getImageSize = useCallback((imageUrl: string) => {
        ImageRN.getSize(imageUrl, (width, height) => {
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
    
    const touchHandler = useCallback(useTouchHandler({
        onStart: ({x,y}) => {
            runOnJS(createPath)(x,y,true,false);
        },
        onActive: ({x,y}) => {
            runOnJS(createPath)(x,y,false,false);
        },
        onEnd: ({x,y}) => {
            runOnJS(createPath)(x,y,false,true);
        }
    }),[props.enablePanZoom])
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
    const changeEnableState = (value: boolean) => {
        setEnable(state => value)
    }
    useEffect(()=>{
        changeEnableState(props.enablePanZoom)
    },[props.enablePanZoom])
    return (
        <View style={styles.wrapper}>
            <PanZoom 
            enable={enable}
            >
                <Canvas
                onTouch={
                    props.enablePanZoom ? undefined : touchHandler
                }
                style={{ 
                    width: dimensions.imageWidth*dimensions.scaleFactor.scaleWidth, 
                    height: dimensions.imageHeight*dimensions.scaleFactor.scaleHeight, 
                }} ref={ref}>
                    { imageCanvas && 
                        <Image
                        key={'image'}
                        image={imageCanvas}
                        fit="contain"
                        x={0}
                        y={0}
                        width={dimensions.imageWidth*dimensions.scaleFactor.scaleWidth}
                        height={dimensions.imageHeight*dimensions.scaleFactor.scaleHeight}
                        />
                    }
                    { completedPaths.length>0 &&
                        completedPaths.map((path: any,i: number) => (<>
                            <Path
                                key={uuid.v4() as string}
                                path={path}
                                color="white"
                                style={'stroke'}
                                strokeWidth={5}
                                strokeJoin={'round'}
                                antiAlias={true}
                            />        
                        </>))
                    }
                    {
                        pathString ?
                        <Path
                            key={uuid.v4() as string}
                            path={pathString}
                            color="white"
                            style={'stroke'}
                            strokeWidth={5}
                            strokeJoin={'round'}
                            antiAlias={true}
                        />      
                        : null  
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
    }
})