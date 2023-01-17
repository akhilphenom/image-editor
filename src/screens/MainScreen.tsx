import { Dimensions, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { imageUrl } from '../data'
import ImageEditor from '../components/image-editor/ImageEditor'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar'

const MainScreen = () => {
    return (<>
        <StatusBar style='light' hidden={true}></StatusBar>
        <View style={styles.mainContainer}>
            <View style={styles.bar}>
                <TouchableOpacity style={[styles.btnStyles]}>
                    <MaterialIcons name="replay" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnStyles,{backgroundColor: 'dodgerblue'}]}>
                    <Ionicons name="save-sharp" size={24} color="white" />
                </TouchableOpacity>
            </View>
            <ImageEditor imageUrl={imageUrl}></ImageEditor>
            <View style={styles.bar}>
                <TouchableOpacity>

                </TouchableOpacity>
            </View>
        </View>
    </>)
}

export default MainScreen

const styles = StyleSheet.create({
    mainContainer: {
        flex:1,
        backgroundColor: 'rgb(15,15,15)',
    },
    bar: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 10,
        paddingHorizontal: 10
    },
    textStyle: {
        color: 'white',
        fontSize: 15
    },
    btnStyles: {
        flexDirection:'row',
        marginHorizontal: 5,
        backgroundColor: 'rgba(255,255,255,0.4)',
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center'
    }
})