import { Dimensions, StyleSheet, View, Image as ImageRN, StatusBar, Text, Modal, KeyboardAvoidingView, TouchableOpacity, Platform } from 'react-native'
import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import PanZoom from '../pan-zoom/PanZoom';
import { Canvas, useCanvasRef, Image, Skia, Path, useTouchHandler, Text as SkiaText, useFont } from '@shopify/react-native-skia';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Gesture, GestureDetector, PanGestureHandler, TextInput } from 'react-native-gesture-handler';

type IProps = {
    imageUrl: string,
    enablePanZoom: boolean,
    undo?: boolean,
    redo?: boolean,
    clear?: boolean,
    save?: boolean,
    text?: boolean,
    sendModalData?:Function,
    getFinalImage: Function
}

const ImageEditor: FunctionComponent<IProps> = (props: IProps) => {
    const { imageUrl } = props;
    const lastScale = useSharedValue(1);
    const pinchScale = useSharedValue(1);
    const baseScale = useSharedValue(1);
    const previousTranslateX = useSharedValue(0);
    const previousTranslateY = useSharedValue(0);
    const currentTranslateX = useSharedValue(0);
    const currentTranslateY = useSharedValue(0);
    const isPanGestureEnabled = useSharedValue(false);
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
    const [modal,setModal] = useState<any>({
        currentText:{
            text:''
        },
        showModal: false,
    })
    const variableText = useRef('');

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
        if(props.text) {
            setModal((state: any) => ({
                ...state,
                showModal: true
            }))
        } else {
            setModal((state: any) => ({
                ...state,
                showModal: false
            }))
        }
    },[props.text])

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
    }),[props.enablePanZoom,props.text])
    
    const onPinchEnd = useCallback((scale: any) => {
        const newScale = lastScale.value * scale
        lastScale.value = newScale
        // if (newScale > 1) {
        //     isZoomedIn.value = true
        //     baseScale.value = newScale
        //     pinchScale.value = 1
        //     runOnJS(onPanEnd)()
        //     isPanGestureEnabled.value = true
        // }
    },[baseScale, pinchScale, lastScale])

    const pinchGesture = Gesture.Pinch().onUpdate(({ scale }) => {
        pinchScale.value = scale
        isPanGestureEnabled.value = true
    }).onEnd(({ scale }) => {
        pinchScale.value = scale;
        runOnJS(onPinchEnd)(scale)
    });

    const panGesture = Gesture.Pan().onUpdate(({translationX, translationY, x, y})=>{
        console.log(x,y)
        currentTranslateX.value = previousTranslateX.value + translationX/lastScale.value;
        currentTranslateY.value = previousTranslateY.value + translationY/lastScale.value;
    }).onEnd(({translationX, translationY, x, y})=>{
        previousTranslateX.value = previousTranslateX.value + translationX/lastScale.value;
        previousTranslateY.value = previousTranslateY.value + translationY/lastScale.value;
        // runOnJS(onPanEnd)()
    }).onTouchesMove((_, state) => {
        if (!enable || isPanGestureEnabled.value) {
            state.activate()
        } else {
            state.fail()
        }
    }).minDistance(0).minPointers(1).maxPointers(2);
    
    const translateStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: baseScale.value * pinchScale.value },
            { translateX: currentTranslateX.value },
            { translateY: currentTranslateY.value },
        ],
    }));

    const closeModal = () => {
        setModal((state: any) => ({
            ...state,
            showModal: false,
            currentText: '',
        }))
        variableText.current=''
    }

    const onSubmitText = () => {
        setModal((state: any) => ({
            ...state,
            showModal: false
        }))
        props.sendModalData?.(variableText)
    }

    const onChangeText = (e: string) => {
        if(!variableText.current.length) {
            variableText.current = modal.currentText?.text ?? '';
        }
        variableText.current=e;
    }

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
                    (props.enablePanZoom || props.text) ? undefined : touchHandler
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
                </Canvas>
                { props.text && <View style={{
                    borderWidth:2, borderColor:'red',
                    width: dimensions.imageWidth*dimensions.scaleFactor.scaleWidth,
                    height: dimensions.imageHeight*dimensions.scaleFactor.scaleHeight,
                    position: 'absolute',
                    backfaceVisibility: 'visible'
                }}>
                    { font && 
                        <GestureDetector gesture={Gesture.Simultaneous(panGesture,pinchGesture)}>
                            <Animated.Text style={[translateStyle]}>'Hello'</Animated.Text>
                        </GestureDetector>
                    }
                </View> }
                <Modal visible={modal.showModal} transparent={true}>
                    <KeyboardAvoidingView behavior={Platform.OS == 'ios'? 'padding': 'height'} style={{flex: 1,}}>
                        <View style={styles.modalContentContainer}>
                            <View style={{flex:1}}></View>
                            <TextInput
                                onChangeText={onChangeText}
                                multiline
                                underlineColorAndroid="transparent"
                                defaultValue={modal.currentText?.text}
                                returnKeyType="done"
                                scrollEnabled={false}
                                spellCheck={false}
                                autoCorrect={false}
                                style={[styles.textStyles]}
                                placeholder={'Type something...'}
                                placeholderTextColor={'white'}
                            />
                            <View style={{flex:1}}></View>
                            <View style={styles.container}>
                                <TouchableOpacity onPress={() => closeModal()}>
                                    <Text style={[styles.confirmation, {color: 'red'}]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => onSubmitText()}>
                                    <Text style={styles.confirmation}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </PanZoom>
        </View>
    )
}

export default ImageEditor

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    modalContentContainer: {
        backgroundColor:"rgba(10,10,10,0.7)",
        flex: 1,
        display: 'flex',
        paddingHorizontal: 10,
        paddingVertical: 20
    },
    textStyles: {
        color: '#fff',
        fontSize: 24,
        alignSelf:'center'
    },
    confirmation: {
        color: 'white',
        marginHorizontal: 10,
        marginTop: 10,
        fontSize: 19,
    },
    container: {
        alignSelf:'flex-end',
        display: 'flex',
        flexDirection:'row',
        justifyContent:'space-between',
        width: '100%'
    },
})