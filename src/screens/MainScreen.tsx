import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { imageUrl } from '../data'
import ImageEditor from '../components/image-editor/ImageEditor'
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar'

enum ActionType {
    PALM = 'PALM',
    DRAW = 'DRAW',
    UNDO = 'UNDO',
    REDO = 'REDO',
    CLEAR = 'CLEAR',
    SAVE = 'SAVE',
}
const MainScreen = () => {
    const [activeAction, setActiveAction] = useState<any>({
        palm: true,
        draw: false,
        undo: null,
        redo: null,
        clear: null,
        save: null,
    });
    const getFinalImage = async (exportableImage: any) => {
        console.log(exportableImage)
    }
    const handleAction = (context?: ActionType)=>{
        switch(context) {
            case ActionType.DRAW :
                setActiveAction((actions: any) => ({
                    ...actions,
                    palm: false,
                    save: false,
                    draw: true
                }))
                break;
            case ActionType.PALM :
                setActiveAction((actions: any) => ({
                    ...actions,
                    palm: true,
                    save: false,
                    draw: false
                }))
                break;
            case ActionType.UNDO :
                setActiveAction((actions: any) => ({
                    ...actions,
                    save: false,
                    undo: !activeAction.undo,
                }))
                break;
            case ActionType.REDO :
                setActiveAction((actions: any) => ({
                    ...actions,
                    save: false,
                    redo: true
                }))
                break;
            case ActionType.CLEAR :
                setActiveAction((actions: any) => ({
                    ...actions,
                    save: false,
                    clear: true
                }))
                break;
            case ActionType.SAVE :
                setActiveAction((actions: any) => ({
                    ...actions,
                    save: true
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
                <TouchableOpacity style={[styles.btnStyles]} onPress={() => handleAction(ActionType.CLEAR)}>
                    <FontAwesome5 name="eraser" size={26} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnStyles,{backgroundColor: 'dodgerblue'}]} onPress={() => handleAction(ActionType.SAVE)}>
                    <Ionicons name="save-sharp" size={24} color="white" />
                </TouchableOpacity>
            </View>
            <ImageEditor 
            imageUrl={imageUrl} 
            enablePanZoom={activeAction.palm} 
            save={activeAction.save}
            clear={activeAction.clear}
            getFinalImage={getFinalImage}
            ></ImageEditor>
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
        backgroundColor: 'rgb(15,15,15)',
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