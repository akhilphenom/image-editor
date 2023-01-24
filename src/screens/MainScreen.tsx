import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useState } from 'react'
import { imageUrl } from '../data'
import ImageEditor from '../components/image-editor/ImageEditor'
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar'

enum ActionType {
    PALM = 'PALM',
    DRAW = 'DRAW',
}
const MainScreen = () => {
    const [activeAction, setActiveAction] = useState({
        palm: true,
        draw: false,
    })
    const handleAction = (context?: ActionType)=>{
        switch(context) {
            case ActionType.DRAW :
                setActiveAction(actions => ({
                    ...actions,
                    palm: false,
                    draw: true
                }))
                break;
            case ActionType.PALM :
                setActiveAction(actions => ({
                    ...actions,
                    palm: true,
                    draw: false
                }))
                break;
            default:
                break;
        }
    };
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
            <ImageEditor imageUrl={imageUrl} enablePanZoom={activeAction.palm}></ImageEditor>
            <View style={styles.bar}>
                <TouchableOpacity onPress={() => handleAction(ActionType.DRAW)}
                style={[styles.btnStyles,{backgroundColor: activeAction.draw ? 'dodgerblue': 'rgba(255,255,255,0.4)'}]}>
                    <MaterialCommunityIcons name="draw" size={24} color={activeAction.draw? 'white' : "black"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleAction(ActionType.PALM)}
                style={[styles.btnStyles,{backgroundColor: activeAction.palm ? 'dodgerblue': 'rgba(255,255,255,0.4)'}]}>
                    <Ionicons name="md-hand-right-outline" size={24} color={activeAction.palm? 'white' : "black"} />
                </TouchableOpacity>
            </View>
        </View>
    </>)
}

export default MainScreen

const styles = StyleSheet.create({
    mainContainer: {
        flex:1,
        backgroundColor: 'white',
    },
    bar: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 20,
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