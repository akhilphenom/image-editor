import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useRef, useState } from 'react'
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
    TEXT = 'TEXT',
}
const MainScreen = () => {
    const [activeAction, setActiveAction] = useState<any>({
        palm: true,
        draw: false,
        undo: null,
        redo: null,
        clear: null,
        save: null,
        text: null,
    });
    const [textComponents,setTextComponents] = useState<string[]>([]);
    const textComponentsRef = useRef<string[]>([]);
    const getFinalImage = async (exportableImage: any) => {
        console.log(exportableImage)
    }
    const receiveModalData = (e:any) => {
        const value = e.current as string;
        console.log(value);
        if(value.length) {
            textComponentsRef.current.push(value);
            setTextComponents(state => [...state, value])
        }
    }
    const handleAction = (context?: ActionType)=>{
        switch(context) {
            case ActionType.DRAW :
                setActiveAction((actions: any) => ({
                    ...actions,
                    palm: false,
                    save: false,
                    text: false,
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
            case ActionType.TEXT :
                setActiveAction((actions: any) => ({
                    ...actions,
                    palm: false,
                    draw: false,
                    save: false,
                    text: !activeAction.text
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
                    redo: !activeAction.redo
                }))
                break;
            case ActionType.CLEAR :
                setActiveAction((actions: any) => ({
                    ...actions,
                    save: false,
                    clear: !activeAction.clear
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
                <TouchableOpacity style={[styles.btnStyles]} onPress={() => handleAction(ActionType.UNDO)}>
                    <MaterialCommunityIcons name="undo" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnStyles]} onPress={() => handleAction(ActionType.REDO)}>
                    <MaterialCommunityIcons name="redo" size={26} color="white" />
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
            undo={activeAction.undo}
            redo={activeAction.redo}
            text={activeAction.text}
            getFinalImage={getFinalImage}
            sendModalData={receiveModalData}
            ></ImageEditor>
            <View style={styles.bar}>
                <TouchableOpacity onPress={() => handleAction(ActionType.TEXT)}
                style={[styles.btnStyles,{backgroundColor: activeAction.text ? 'dodgerblue': 'rgba(255,255,255,0.4)'}]}>
                    <MaterialCommunityIcons name="text" size={24} color={activeAction.text? 'white' : "black"} />
                </TouchableOpacity>
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