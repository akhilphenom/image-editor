import { useFont } from "@shopify/react-native-skia";
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const LoadFonts = () => {
    const fonts: any= [
        useFont(require('../../assets/fonts/OpenSans-Medium.ttf'),32),
    ];
    return (<>
        
    </>)
}

export default LoadFonts