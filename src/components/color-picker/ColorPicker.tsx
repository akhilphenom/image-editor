import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface ColorPickerProps extends LinearGradientProps {
  maxWidth: number;
  onColorChanged?: Function;
}

const CIRCLE_PICKER_SIZE = 24;
const INTERNAL_PICKER_SIZE = 0.9*CIRCLE_PICKER_SIZE;

const ColorPicker: FunctionComponent<ColorPickerProps> = ({
  colors,
  start,
  end,
  style,
  maxWidth,
  onColorChanged,
}) => {
    const COLORS = [
        'red',
        'purple',
        'blue',
        'cyan',
        'green',
        'yellow',
        'orange',
        'black',
        'white',
    ];
    const previousTranslateX = useSharedValue(0);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const adjustedTranslateX = useDerivedValue(() => {
        return Math.min(Math.max(translateX.value, 0),maxWidth - CIRCLE_PICKER_SIZE);
    });

    const rStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: adjustedTranslateX.value },
            { translateY: translateY.value },
        ]})
    );

    const rInternalPickerStyle = useAnimatedStyle(() => {
        const inputRange = colors.map((_, index) => (index/colors.length) * maxWidth);
        const backgroundColor = interpolateColor(
            translateX.value,
            inputRange,
            colors
        );
        const internalBackgroundColor = interpolateColor(
            translateX.value,
            inputRange,
            COLORS
        );
        onColorChanged?.({bgColor: backgroundColor, rBgColor: internalBackgroundColor});
        return { backgroundColor: internalBackgroundColor };
    });

    const gestures = useMemo(()=>{
        const panGesture = Gesture.Pan().onStart((e)=>{
            previousTranslateX.value = e.x - CIRCLE_PICKER_SIZE;
            translateX.value = e.x - CIRCLE_PICKER_SIZE;
            translateY.value = withSpring(-2*CIRCLE_PICKER_SIZE, {damping: 20})
        }).onUpdate((e)=>{
            translateX.value = e.translationX + previousTranslateX.value;
        }).onEnd((e)=> {
            translateY.value = withTiming(0)
        })
        const tapGesture = Gesture.Tap().onStart((e)=>{
            previousTranslateX.value = e.x
            translateY.value = withSpring(-CIRCLE_PICKER_SIZE);
            translateX.value = withTiming(e.x - CIRCLE_PICKER_SIZE);
        }).onEnd(()=>{
            translateY.value = withSpring(0);
        });
        return Gesture.Simultaneous(panGesture,tapGesture);
    },[translateX, translateY, previousTranslateX])

    return (
        <GestureHandlerRootView style={{flex:1}}>
            <GestureDetector gesture={gestures}>
                <Animated.View style={{ justifyContent: 'center' }}>
                    <LinearGradient
                    colors={COLORS}
                    start={start}
                    end={end}
                    style={style}
                    />
                    <Animated.View style={[styles.picker, rStyle]}>
                        <Animated.View style={[styles.internalPicker, rInternalPickerStyle]}/>
                    </Animated.View>
                </Animated.View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
  picker: {
    position: 'absolute',
    backgroundColor: '#fff',
    width: CIRCLE_PICKER_SIZE,
    height: CIRCLE_PICKER_SIZE,
    borderRadius: CIRCLE_PICKER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  internalPicker: {
    width: INTERNAL_PICKER_SIZE,
    height: INTERNAL_PICKER_SIZE,
    borderRadius: INTERNAL_PICKER_SIZE / 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
});

export { ColorPicker };