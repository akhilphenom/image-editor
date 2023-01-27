import { Dimensions, StyleSheet, View, Image as ImageRN, StatusBar } from 'react-native'
import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { runOnJS } from 'react-native-reanimated'
import PanZoom from '../pan-zoom/PanZoom';
import { Canvas, useCanvasRef, Image, Skia, Path, useTouchHandler, Text, useFont } from '@shopify/react-native-skia';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

type IProps = {
    imageUrl: string,
    enablePanZoom: boolean,
    undo?: boolean,
    redo?: boolean,
    clear?: boolean,
    save?: boolean,
    getFinalImage: Function
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
    const [completedPaths, setCompletedPaths] = useState<string[]>([]);
    const [enable, setEnable] = useState(props.enablePanZoom);
    const [pathString, setPathString] = useState<string>('');
    const currentPath: any = useRef('');
    const currentPaths: any = useRef([]);
    const undoStack: any = useRef([]);
    const font: any= useFont(require('../../../assets/fonts/OpenSans-Medium.ttf'),32);

    const createPath = (x: number, y:number, isFirst: boolean, isLast: boolean) => {
        if(isFirst) {
            setPath(`M ${Math.round(x)} ${Math.round(y)}`);
        } else if (isLast) {
            if(currentPath.current.length) {
                setCompletedPaths(state => [...state, currentPath.current]);
                currentPaths.current = [...currentPaths.current, currentPath.current];
                setPathString('');
                currentPath.current = '';
            }
        } else {
            setPath(pathString+` L ${Math.round(x)} ${Math.round(y)}`)
        }
    }

    const setPath = useCallback((path: string) => {
        setPathString(state => state+path);
        currentPath.current = currentPath.current+path;
    },[pathString])

    const CompletedPathsMemo = useMemo(()=>{
        const CompletedList = () => (
            currentPaths.current.map((path: any,i: number) => (<>
                <Path
                    key={i}
                    path={path}
                    color="white"
                    style={'stroke'}
                    strokeWidth={5}
                    strokeJoin={'round'}
                    antiAlias={true}
                />        
            </>))
        );
        return CompletedList;
    },[currentPaths.current])

    useEffect(()=>{
        setEnable(props.enablePanZoom)
    },[props.enablePanZoom])
    
    useEffect(()=>{
        setCompletedPaths(state => [])
    },[props.clear])

    useEffect(()=>{
        const oldPaths = [...currentPaths.current];
        if(oldPaths.length) {
            const latestPath = oldPaths.pop();
            currentPaths.current.pop();
            undoStack.current.push(latestPath);
            setCompletedPaths(state => [...oldPaths])
        }
    },[props.undo])

    useEffect(()=>{
        if(font==null) {
            console.log('null')
        } else {
            console.log('ggg');
        }
    },[font])

    useEffect(()=>{
        if(undoStack.current.length) {
            const latestPath = undoStack.current.pop();
            currentPaths.current.push(latestPath);
            setCompletedPaths(state => [...state, latestPath])
        }
    },[props.redo])

    useEffect(()=>{
        if(props.save) {
            const saveImage = async () => {
                const image = ref.current?.makeImageSnapshot();
                if (image) {
                    const base64 = image.encodeToBase64();
                    let uri = `data:image/png;base64,${base64}`
                    const manipResult = await manipulateAsync(
                        uri, [
                            {
                                resize: {
                                    height: dimensions.imageHeight,
                                    width: dimensions.imageWidth
                                } 
                            }
                        ], { compress: 1, format: SaveFormat.PNG }
                    );
                    props.getFinalImage(manipResult)
                }
            }
            saveImage();
        }
    },[props.save])

    const getImageSize = useCallback((imageUrl: string) => {
        ImageRN.getSize(imageUrl, (width, height) => {
            let scaleFactor = {scaleHeight: 1, scaleWidth: 1};
            scaleFactor = {
                scaleHeight: screenWidth/width,
                scaleWidth: screenWidth/width
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
        onActive: ({x,y,velocityX,velocityY}) => {
            if(velocityX || velocityY) {
                runOnJS(createPath)(x,y,false,false);
            }
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
    useEffect(()=>{
        setEnable(state => props.enablePanZoom)
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
                }} 
                ref={ref}
                >
                    { imageCanvas && 
                        <Image
                        key={'image'}
                        image={imageCanvas}
                        fit='contain'
                        x={0}
                        y={0}
                        width={dimensions.imageWidth*dimensions.scaleFactor.scaleWidth}
                        height={dimensions.imageHeight*dimensions.scaleFactor.scaleHeight}
                        />
                    }
                    { currentPaths.current.length>0 && <CompletedPathsMemo></CompletedPathsMemo> }
                    {
                        pathString ?
                        <Path
                            key={'currentPath'}
                            path={pathString}
                            color="red"
                            style={'stroke'}
                            strokeWidth={5}
                            strokeJoin={'round'}
                            antiAlias={true}
                        />      
                        : null  
                    }
                    {
                        font && currentPaths.current.length>0 && currentPaths.current.map((_: any,i: any)=> (
                            <Text key={i} text={'Hii'} font={font} x={100+i*10} y={100+i*10} color={'white'}></Text>
                        ))
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