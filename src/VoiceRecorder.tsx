import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PermissionsAndroid, Platform, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import NativeVoiceFilter from './NativeVoiceFilter';
import { AudioFilterDrawer } from './AudioFilterDrawer';

const MarqueeText = ({ text, width = 50 }: { text: string; width?: number }) => {
    const animatedValue = useRef(new Animated.Value(width)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(animatedValue, {
                toValue: -width,
                duration: 4000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [text, width]);

    return (
        <View style={{ width, overflow: 'hidden', marginTop: 4 }}>
            <Animated.Text style={{ fontSize: 10, color: '#0c0707ff', width: width * 2, transform: [{ translateX: animatedValue }] }} numberOfLines={1}>
                {text}
            </Animated.Text>
        </View>
    );
};

interface VoiceRecorderProps {
    onRecordComplete?: (audioPath: string) => void;
    onConfirm?: (audioPath: string) => void;
    onDelete?: () => void;
    micIconColor?: string;
    micIconName?: string;
    attachedIconName?: string;
    attachedIconColor?: string;
    attachedButtonColor?: string;
    deleteIconName?: string;
    editIconName?: string;
    cancelIconName?: string;
    actionIconColor?: string;
    actionIconSize?: number;
    playIconName?: string;
    pauseIconName?: string;
    closeIconName?: string;
    confirmIconName?: string;
    iconColor?: string;
    accentColor?: string;
    titleText?: string;
    playerTitleText?: string;
    processingText?: string;
    filterOptions?: string[];
    drawerBackgroundColor?: string;
    playerCardColor?: string;
    filterChipColor?: string;
    checkButtonColor?: string;
    waveformColor?: string;
    titleColor?: string;
    playerTitleColor?: string;
    sectionTitleColor?: string;
    timerTextColor?: string;
    closeIconColor?: string;
    overlayColor?: string;
    micButtonColor?: string;
    micButtonActiveColor?: string;
    tooltipBackgroundColor?: string;
    recordingWaveColor?: string;
    recordingTimerColor?: string;
    actionButtonColor?: string;
    cancelIconColor?: string;
    dividerColor?: string;
    stopButtonColor?: string;
}

export const VoiceRecorder = ({
    onRecordComplete,
    onConfirm,
    onDelete,
    micIconColor = '#030109',
    micIconName = 'mic',
    attachedIconName = 'musical-notes',
    attachedIconColor = '#FFFFFF',
    attachedButtonColor = '#34C759',
    deleteIconName = 'trash',
    editIconName = 'create',
    cancelIconName = 'close',
    actionIconColor = '#FFFFFF',
    actionIconSize = 18,
    micButtonColor = '#cfcbc7',
    micButtonActiveColor = '#dbdbe8',
    tooltipBackgroundColor = '#1A1A24',
    recordingWaveColor = '#FF3B30',
    recordingTimerColor = '#FF3B30',
    actionButtonColor = '#282834',
    cancelIconColor = '#A0A0B0',
    dividerColor = '#3A3A4A',
    stopButtonColor = '#FF3B30',
    ...drawerProps
}: VoiceRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTimeStr, setRecordingTimeStr] = useState('00:00');
    const [waveData, setWaveData] = useState<number[]>(new Array(15).fill(4));
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [recordedPath, setRecordedPath] = useState<string | null>(null);
    const [showActions, setShowActions] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('Original');

    const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const waveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTime = useRef<number>(0);

    useEffect(() => {
        return () => {
            if (timerInterval.current) clearInterval(timerInterval.current);
            if (waveInterval.current) clearInterval(waveInterval.current);
        };
    }, []);

    const startRecording = async () => {
        if (Platform.OS === 'android') {
            try {
                const grants = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: "Microphone Permission",
                        message: "App needs access to your microphone to record voice.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (grants !== PermissionsAndroid.RESULTS.GRANTED) {
                    console.log("Microphone permission denied");
                    return;
                }
            } catch (err) {
                console.warn(err);
                return;
            }
        }

        setSelectedFilter('Original');
        setIsRecording(true);
        NativeVoiceFilter.startRecording();

        startTime.current = Date.now();
        setRecordingTimeStr('00:00');

        timerInterval.current = setInterval(() => {
            const diff = Math.floor((Date.now() - startTime.current) / 1000);
            const m = Math.floor(diff / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            setRecordingTimeStr(`${m}:${s}`);
        }, 1000);

        waveInterval.current = setInterval(() => {
            const amp = NativeVoiceFilter.getAmplitude();
            const normalized = Math.min(20, Math.max(4, (amp / 32767) * 40));
            setWaveData(prev => {
                const arr = [...prev];
                arr.shift();
                arr.push(normalized);
                return arr;
            });
        }, 100);
    };

    const stopRecording = async () => {
        if (timerInterval.current) clearInterval(timerInterval.current);
        if (waveInterval.current) clearInterval(waveInterval.current);
        setIsRecording(false);
        try {
            const audioPath = await NativeVoiceFilter.stopRecording();
            setRecordedPath(audioPath);
            setIsDrawerVisible(true);
            if (onRecordComplete) {
                onRecordComplete(audioPath);
            }
        } catch (e) {
            console.error("Recording failed", e);
        }
    };

    const cancelRecording = () => {
        if (timerInterval.current) clearInterval(timerInterval.current);
        if (waveInterval.current) clearInterval(waveInterval.current);
        setIsRecording(false);
        NativeVoiceFilter.cancelRecording();
    };

    const handleDelete = () => {
        setRecordedPath(null);
        setShowActions(false);
        if (onDelete) {
            onDelete();
        }
    };

    const handleEdit = () => {
        setShowActions(false);
        setIsDrawerVisible(true);
    };

    const handleConfirm = (path: string, filter: string) => {
        console.log("Voice filter confirmed, audio path:", path, "filter:", filter);
        setRecordedPath(path);
        setSelectedFilter(filter);
        setIsDrawerVisible(false);
        setShowActions(false);
        if (onConfirm) {
            onConfirm(path);
        }
        if (onRecordComplete) {
            onRecordComplete(path);
        }
    };

    return (
        <View style={styles.container}>
            {/* Default Mic*/}
            {recordedPath === null && (
                <TouchableOpacity
                    style={[styles.micButton, { backgroundColor: micButtonColor }, isRecording && { backgroundColor: micButtonActiveColor }]}
                    onPress={isRecording ? undefined : startRecording}
                >
                    <Icon name={micIconName} size={24} color={micIconColor} />
                </TouchableOpacity>
            )}

            {/*Audio Attached*/}
            {recordedPath !== null && !showActions && (
                <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity
                        style={[styles.micButton, { backgroundColor: attachedButtonColor }]}
                        onPress={() => setShowActions(true)}
                    >
                        <Icon name={attachedIconName} size={22} color={attachedIconColor} />
                    </TouchableOpacity>
                    <MarqueeText text={selectedFilter} width={44} />
                </View>
            )}

            {/* Inline action menu */}
            {recordedPath !== null && showActions && (
                <>

                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => setShowActions(false)}
                    />
                    <View style={{ position: 'absolute', alignItems: 'center', top: 0, zIndex: 20 }}>
                        <TouchableOpacity
                            style={[styles.micButton, { backgroundColor: attachedButtonColor }]}
                            onPress={() => setShowActions(true)}
                        >
                            <Icon name={attachedIconName} size={22} color={attachedIconColor} />
                        </TouchableOpacity>
                        <MarqueeText text={selectedFilter} width={44} />

                        <View style={styles.tooltipContainer}>

                            <View style={[styles.triangle, { borderBottomColor: tooltipBackgroundColor }]} />
                            <View style={[styles.activeLayout, { backgroundColor: tooltipBackgroundColor }]}>

                                {/* Delete */}
                                <TouchableOpacity style={[styles.circleBtn, { backgroundColor: actionButtonColor }]} onPress={handleDelete}>
                                    <Icon name={deleteIconName} size={actionIconSize} color={actionIconColor} />
                                </TouchableOpacity>

                                <View style={[styles.divider, { backgroundColor: dividerColor }]} />

                                {/* Edit */}
                                <TouchableOpacity style={[styles.circleBtn, { backgroundColor: actionButtonColor }]} onPress={handleEdit}>
                                    <Icon name={editIconName} size={actionIconSize} color={actionIconColor} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </>
            )}

            {isRecording && (
                <View style={styles.tooltipContainer}>
                    <View style={[styles.triangle, { borderBottomColor: tooltipBackgroundColor }]} />
                    <View style={[styles.activeLayout, { backgroundColor: tooltipBackgroundColor }]}>

                        {/* Real-time Waveform */}
                        <View style={styles.waveform}>
                            {waveData.map((h, i) => (
                                <View key={i} style={[styles.waveBar, { height: h, backgroundColor: recordingWaveColor }]} />
                            ))}
                        </View>

                        <Text style={[styles.timerText, { color: recordingTimerColor }]}>{recordingTimeStr}</Text>

                        {/* Cancel Button */}
                        <TouchableOpacity style={[styles.circleBtn, { backgroundColor: actionButtonColor }]} onPress={cancelRecording}>
                            <Text style={[styles.cancelIcon, { color: cancelIconColor }]}>✕</Text>
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

                        {/* Stop Button */}
                        <TouchableOpacity style={[styles.circleBtn, { backgroundColor: actionButtonColor }]} onPress={stopRecording}>
                            <View style={[styles.stopSquare, { backgroundColor: stopButtonColor }]} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <AudioFilterDrawer
                {...drawerProps}
                visible={isDrawerVisible}
                audioPath={recordedPath}
                initialFilter={selectedFilter}
                onClose={() => setIsDrawerVisible(false)}
                onConfirm={handleConfirm}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
        overflow: 'visible',
    },
    overlay: {
        position: 'absolute',
        top: -10000,
        bottom: -10000,
        left: -10000,
        right: -10000,
        zIndex: 15,
    },
    micButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#cfcbc7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionIcon: {
        fontSize: 16,
    },
    micButtonActive: {
        backgroundColor: '#dbdbe8',
    },
    tooltipContainer: {
        alignItems: 'center',
        position: 'absolute',
        top: 48,
        zIndex: 20,
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#1A1A24',
    },
    activeLayout: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A24',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    waveform: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
        height: 20,
    },
    waveBar: {
        width: 2,
        backgroundColor: '#FF3B30',
        marginHorizontal: 1.5,
        borderRadius: 1,
    },
    timerText: {
        color: '#FF3B30',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 15,
    },
    circleBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#282834',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelIcon: {
        color: '#A0A0B0',
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: '#3A3A4A',
        marginHorizontal: 10,
    },
    stopSquare: {
        width: 12,
        height: 12,
        backgroundColor: '#FF3B30',
        borderRadius: 3,
    }
});