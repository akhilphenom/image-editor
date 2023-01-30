import { Dimensions, StyleSheet, View, Image as ImageRN, StatusBar, Text, Modal, KeyboardAvoidingView, TouchableOpacity, Platform } from 'react-native'
import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import PanZoom from '../pan-zoom/PanZoom';
import { Canvas, useCanvasRef, Image, Skia, Path, useTouchHandler, Text as SkiaText, useFont } from '@shopify/react-native-skia';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Gesture, GestureDetector, TextInput } from 'react-native-gesture-handler';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';

type IProps = {
    imageUrl: string,
    enablePanZoom: boolean,
    undo?: boolean,
    redo?: boolean,
    clear?: boolean,
    save?: boolean,
    text?: boolean,
    getFinalImage: Function,
    resetToolBar?: Function,
}

const ImageEditor: FunctionComponent<IProps> = (props: IProps) => {
    const assetMedium = require('../../../assets/fonts/OpenSans-Medium.ttf')
    const fonts: any= {
        4: useFont(assetMedium,4),
        8: useFont(assetMedium,8),
        12: useFont(assetMedium,12),
        16: useFont(assetMedium,16),
        20: useFont(assetMedium,20),
        24: useFont(assetMedium,24),
        28: useFont(assetMedium,28),
        32: useFont(assetMedium,32),
        36: useFont(assetMedium,36),
        40: useFont(assetMedium,40),
        44: useFont(assetMedium,44),
        48: useFont(assetMedium,48),
        52: useFont(assetMedium,52),
    }
    const { imageUrl } = props;
    const DEFAULT_FONT_SIZE = 32;
    const lastScale = useSharedValue(1);
    const pinchScale = useSharedValue(1);
    const baseScale = useSharedValue(1);
    const previousTranslateX = useSharedValue(0);
    const previousTranslateY = useSharedValue(0);
    const currentTranslateX = useSharedValue(0);
    const currentTranslateY = useSharedValue(0);
    const { width: screenWidth, height: screenHeight } = Dimensions.get('screen')
    const ref = useCanvasRef();
    const [imageCanvas,setImageCanvas] = useState();
    const [dimensions, setDimensions] = useState({
        imageHeight: 1,
        imageWidth: 1,
        statusbarHeight: 0,
        scaleFactor: {scaleHeight: 1, scaleWidth: 1},
    });
    const textComponentsRef = useRef<{
        text: string,
        position: {
            x: number,
            y: number
        },
        fontSize: number,
    }[]>([]);
    const [completedPaths, setCompletedPaths] = useState<string[]>([]);
    const [enable, setEnable] = useState(props.enablePanZoom);
    const [pathString, setPathString] = useState<string>('');
    const currentPath: any = useRef('');
    const currentPaths: any = useRef([]);
    const undoStack: any = useRef([]);
    const variableText = useRef('');
    const variableCoords = useSharedValue<{x:number,y:number}>({
        x:0,
        y:0
    });
    const [variableFontSize, setVariableFontSize] = useState<number>(DEFAULT_FONT_SIZE);
    const [modal,setModal] = useState<any>({
        currentText:{
            text:'',
            position: {
                x: 0,
                y: 0,
            },
        },
        showModal: false,
        addingStage: true,
    })
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
        setCompletedPaths(state => []);
        currentPaths.current = [];
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
                showModal: true,
                addingStage: false,
            }))
        } else {
            setModal((state: any) => ({
                ...state,
                showModal: false,
                addingStage: false,
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
    
    useEffect(()=>{
        getImageSize(imageUrl);
    },[imageCanvas])
    
    useEffect(()=>{
        setEnable(state => props.enablePanZoom)
        variableText.current='';
    },[props.enablePanZoom])

    useEffect(()=>{
        Skia.Data.fromURI(imageUrl).then((data) => {
            const canvasImage: any = Skia.Image.MakeImageFromEncoded(data)
            setImageCanvas(canvasImage);
            getImageSize(imageUrl);
        });
    },[]);

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

    const updateCoords = (x:number,y:number) => {
        'worklet';
        variableCoords.value = {x,y}
    }

    const panGesture = Gesture.Pan().onStart(()=>{
        updateCoords(0,0)
    }).onUpdate(({translationX, translationY, x, y})=>{
        currentTranslateX.value = previousTranslateX.value + translationX/lastScale.value;
        currentTranslateY.value = previousTranslateY.value + translationY/lastScale.value;
    }).onEnd(({translationX, translationY, x, y})=>{
        previousTranslateX.value = previousTranslateX.value + translationX/lastScale.value;
        previousTranslateY.value = previousTranslateY.value + translationY/lastScale.value;
        updateCoords(currentTranslateX.value,currentTranslateY.value)
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
            addingStage: false,
            currentText: null,
        }))
        variableText.current='';
        variableCoords.value={x:0,y:0};
    }

    const onSubmitText = () => {
        setModal((state: any) => ({
            ...state,
            showModal: false,
            addingStage: true,
        }))
    }

    const onChangeText = (e: string) => {
        if(!variableText.current.length) {
            variableText.current = modal.currentText?.text ?? '';
        }
        variableText.current=e;
    }

    const removeTextElement = () => {
        setModal((state: any) => ({
            ...state,
            showModal: false,
            addingStage: false,
        }))
        props.resetToolBar?.();
    }

    const addTextElement = () => {
        setModal((state: any) => ({
            ...state,
            showModal: false,
            addingStage: false,
        }))
        textComponentsRef.current.push({
            text: variableText.current,
            position: {
                x: variableCoords.value.x,
                y: variableCoords.value.y
            },
            fontSize: variableFontSize
        })
        variableText.current = '';
    }

    const increaseFontSize = () => {
        if(variableFontSize+4 > 52) {
            return;
        }
        setVariableFontSize(size => size+4);
    }

    const decreaseFontSize = () => {
        if(variableFontSize-4 < 4) {
            return;
        }
        setVariableFontSize(size => size-4);
    }
    
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
                        fonts && textComponentsRef.current.length>0 && textComponentsRef.current.map((item: any,i: any)=> (
                            <SkiaText 
                            key={i}
                            text={item.text} 
                            font={fonts[item.fontSize]} 
                            x={item.position.x} 
                            y={item.position.y + (item.fontSize)} 
                            color={'white'}>
                            </SkiaText>
                        ))
                    }
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
                    width: dimensions.imageWidth*dimensions.scaleFactor.scaleWidth,
                    height: dimensions.imageHeight*dimensions.scaleFactor.scaleHeight,
                    position: 'absolute',
                    backfaceVisibility: 'visible'
                }}>
                    { variableText.current.length>0 && 
                        <GestureDetector gesture={panGesture}>
                            <Animated.Text style={[translateStyle,{fontSize: variableFontSize}]}>{variableText.current}</Animated.Text>
                        </GestureDetector>
                    }
                </View> }
                <Modal visible={modal.showModal} transparent={true}>
                    <KeyboardAvoidingView behavior={Platform.OS == 'ios'? 'padding': 'height'} style={{flex: 1,}}>
                        <View style={styles.modalContentContainer}>
                            <View style={{flex:1}}></View>
                            <TextInput
                                onChangeText={onChangeText}
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
            { modal.addingStage && <View style={styles.textSelection}>
                <View style={styles.textStyling}>
                    <View style={{marginHorizontal: 5}}>
                        <Text style={{fontSize: 19, color: 'white'}}>Size</Text>
                    </View>
                    <TouchableOpacity style={{marginHorizontal: 3}} onPress={() => increaseFontSize()}>
                        <Ionicons name="add-circle-outline" size={32} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{marginHorizontal: 3}} onPress={() => decreaseFontSize()}>
                        <Feather name="minus-circle" size={28} color="white" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={{marginHorizontal: 10}} onPress={() => removeTextElement()}>
                    <MaterialIcons name="close" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={{marginHorizontal: 10}} onPress={() => addTextElement()}>
                    <MaterialIcons name="done" size={28} color="white" />
                </TouchableOpacity>
            </View> }
            { modal.addingStage 
             }
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
    textSelection: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        justifyContent:'center',
        position: 'absolute',
        bottom: 0
    },
    textStyling: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 10,
        paddingHorizontal: 5
    }
})