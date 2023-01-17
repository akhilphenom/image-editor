import { StatusBar, StyleProp, StyleSheet, View } from 'react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { NativeEvent } from 'react-native-reanimated/lib/types/lib/reanimated2/commonTypes';
import { Skia, Path, SkPath } from '@shopify/react-native-skia';

type IProps = {
    enable: boolean,
    style?: StyleProp<any>,
    contentContainerStyle?: StyleProp<any>,
    children?:any,
    getPaths: Function
}

const PanZoom = (props: IProps) => {
    const [paths, setPaths] = useState<string[]>([]);
    const lastScale = useSharedValue(1);
    const pinchScale = useSharedValue(1);
    const baseScale = useSharedValue(1);
    const previousTranslateX = useSharedValue(0);
    const previousTranslateY = useSharedValue(0);
    const currentTranslateX = useSharedValue(0);
    const currentTranslateY = useSharedValue(0);
    const containerDimensions = useSharedValue({ width: 0, height: 0 })
    const contentDimensions = useSharedValue({ width: 1, height: 1 })
    const isZoomedIn = useSharedValue(false)
    const isPanGestureEnabled = useSharedValue(false);
    const [enable, setEnable] = useState(true);
    const [pathString, setPathString] = useState<string>('');

    const createPath = (x: number, y:number, isFirst: boolean) => {
        if(isFirst) {
            setPath(`M ${Math.round(x)} ${Math.round(y)}`);
        } else {
            setPath(pathString+` L ${Math.round(x)} ${Math.round(y)}`)
        }
    }

    const setPath = (path: string) => {
        if(path.startsWith(' ')) {
            const [x, y] = (path as any).match(/\d+/g).slice(0, 2);
            path = `M ${x} ${y}${path}`
        }
        setPathString(path);
    }

    const getContentContainerSize = useCallback(() => {
        return ({
          width: containerDimensions.value.width,
          height: (contentDimensions.value.height) * containerDimensions.value.width / contentDimensions.value.width,
        })
    }, [])

    const zoomIn = useCallback(() => {
        const { width, height } = getContentContainerSize()
        let newScale = width > height ? width / height * 0.8 : height / width * 0.8
        if (newScale < 1.4) {
            newScale = 1.4
        } else if (newScale > 1.5) {
            newScale = 2
        }
        lastScale.value = newScale
        baseScale.value = withSpring(newScale)
        pinchScale.value = withSpring(1)
        previousTranslateX.value = 0
        previousTranslateY.value = 0
        currentTranslateX.value = withTiming(0);
        currentTranslateY.value = withTiming(0);
        isZoomedIn.value = true
        isPanGestureEnabled.value = true
    }, [baseScale, pinchScale, previousTranslateX, previousTranslateY, currentTranslateX, currentTranslateY, isZoomedIn, lastScale, isPanGestureEnabled])

    const zoomOut = useCallback(() => {
        lastScale.value = 1
        baseScale.value = withTiming(1)
        pinchScale.value = withTiming(1)
        previousTranslateX.value = 0;
        previousTranslateY.value = 0;
        currentTranslateX.value = withTiming(0);
        currentTranslateY.value = withTiming(0);
        isZoomedIn.value = false;
        isPanGestureEnabled.value = false;
    },[baseScale, pinchScale, previousTranslateX, previousTranslateY, currentTranslateX, currentTranslateY, isZoomedIn, lastScale, isPanGestureEnabled])

    const onPanEnd = useCallback(() => {
        const { width, height } = getContentContainerSize();
        const maxOffset = {
            x: width * lastScale.value < containerDimensions.value.width ? 0 : ((width * lastScale.value - containerDimensions.value.width) / 2) / lastScale.value,
            y: height * lastScale.value < containerDimensions.value.height ? 0 : ((height * lastScale.value - containerDimensions.value.height) / 2) / lastScale.value,
        }
        const isPanedXOutside = previousTranslateX.value > maxOffset.x || previousTranslateX.value < -maxOffset.x
        if (isPanedXOutside) {
            const newOffsetX = previousTranslateX.value >= 0 ? maxOffset.x : -maxOffset.x
            previousTranslateX.value = newOffsetX;
            currentTranslateX.value = withSpring(newOffsetX, {damping: 40, stiffness: 400})
        } else {
            currentTranslateX.value = previousTranslateX.value
        }
        const isPanedYOutside = previousTranslateY.value > maxOffset.y || previousTranslateY.value < -maxOffset.y
        if (isPanedYOutside) {
            const newOffsetY = previousTranslateY.value >= 0 ? maxOffset.y : -maxOffset.y
            previousTranslateY.value = newOffsetY
            currentTranslateY.value = withSpring(newOffsetY, {damping: 40, stiffness: 400})
        } else {
            currentTranslateY.value = previousTranslateY.value
        }
    },[previousTranslateX, previousTranslateY, lastScale, currentTranslateX, currentTranslateY])

    const onDoubleTap = useCallback(() => {
        if (isZoomedIn.value) {
            zoomOut()
        } else {
            zoomIn()
        }
    }, [zoomIn, zoomOut, isZoomedIn])

    const onPinchEnd = useCallback((scale: any) => {
        const newScale = lastScale.value * scale
        lastScale.value = newScale
        if (newScale > 1) {
            isZoomedIn.value = true
            baseScale.value = newScale
            pinchScale.value = 1
            runOnJS(onPanEnd)()
            isPanGestureEnabled.value = true
        } else {
            zoomOut()
        }
    },[baseScale, pinchScale, lastScale, onPanEnd])

    const panZoomGestures = useMemo(() => {
        const pinchGesture = Gesture.Pinch().onUpdate(({ scale }) => {
            pinchScale.value = scale
            isPanGestureEnabled.value = true
        }).onEnd(({ scale }) => {
            pinchScale.value = scale;
            runOnJS(onPinchEnd)(scale)
        });
        const panGesture = Gesture.Pan().onStart(({x,y})=>{
            if(!enable) {
                runOnJS(createPath)(x,y,true);
            }
        }).onUpdate(({translationX, translationY, x, y})=>{
            if(enable) {
                currentTranslateX.value = previousTranslateX.value + translationX/lastScale.value;
                currentTranslateY.value = previousTranslateY.value + translationY/lastScale.value;
            } else {
                runOnJS(createPath)(x,y,false);
            }
        }).onEnd(({translationX, translationY, x, y})=>{
            if(enable) {
                previousTranslateX.value = previousTranslateX.value + translationX/lastScale.value;
                previousTranslateY.value = previousTranslateY.value + translationY/lastScale.value;
                runOnJS(onPanEnd)()
            } else {
                runOnJS(createPath)(x,y, false);
                const oldPaths = [...paths];
                oldPaths.push(pathString)
                runOnJS(setPaths)(oldPaths);
                console.log(paths)
                runOnJS(setPathString)('');
            }
        }).onTouchesMove((_, state) => {
            if (isPanGestureEnabled.value) {
                state.activate()
            } else {
                state.fail()
            }
        }).minDistance(0).minPointers(1).maxPointers(2);
        const tapGesture = Gesture.Tap().numberOfTaps(2).onEnd(() => {
            runOnJS(onDoubleTap)()
        })
        return Gesture.Simultaneous(tapGesture,pinchGesture, panGesture)
    },[currentTranslateX, previousTranslateX, currentTranslateY, previousTranslateY, pinchScale, baseScale, lastScale, enable, paths, pathString]);

    const translateStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: baseScale.value * pinchScale.value },
            { translateX: currentTranslateX.value },
            { translateY: currentTranslateY.value },
        ],
    }));

    const onLayout = useCallback((e: NativeEvent<any>) => {
        containerDimensions.value = {
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
        }
    }, [])

    const onLayoutContent = useCallback((e: NativeEvent<any>) => {
        contentDimensions.value = {
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
        }
    }, [])

    useEffect(()=>{
        setEnable(props.enable)
    },[props.enable])

    return (
        <GestureHandlerRootView style={{flex:1}}>
            <GestureDetector gesture={
                // Gesture.Simultaneous(tapGesture,pinchGesture, panGesture)
                panZoomGestures
            }>
                <View
                style={[styles.container, props.style]}
                onLayout={onLayout}
                collapsable={false}
                >
                    <Animated.View
                    style={[translateStyle, props.contentContainerStyle]}
                    onLayout={onLayoutContent}
                    >
                        {props.children}
                    </Animated.View>
                </View>
            </GestureDetector>
        </GestureHandlerRootView>
    )
}

export default PanZoom

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
})