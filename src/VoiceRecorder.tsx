import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import NativeVoiceFilter from './NativeVoiceFilter';
import { AudioFilterDrawer } from './AudioFilterDrawer';

interface VoiceRecorderProps {
    onRecordComplete?: (audioPath: string) => void;
    onConfirm?: (audioPath: string) => void;
    micIconColor?: string;
    micIconName?: string;
}

export const VoiceRecorder = ({
    onRecordComplete,
    onConfirm,
    micIconColor = '#8A58FF',
    micIconName = 'mic'
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
    };

    const handleEdit = () => {
        setShowActions(false);
        setIsDrawerVisible(true);
    };

    const handleCancel = () => {
        setShowActions(false);
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
            {/* Default Mic - only shown when no audio attached */}
            {recordedPath === null && (
                <TouchableOpacity
                    style={[styles.micButton, isRecording && styles.micButtonActive]}
                    onPress={isRecording ? undefined : startRecording}
                >
                    <Icon name={micIconName} size={24} color={micIconColor} />
                </TouchableOpacity>
            )}

            {/* Priority 1: Audio Attached - show music button instead of mic */}
            {recordedPath !== null && !showActions && (
                <TouchableOpacity
                    style={[styles.micButton, styles.musicButton]}
                    onPress={() => setShowActions(true)}
                >
                    <Text style={styles.musicIcon}>🎵</Text>
                </TouchableOpacity>
            )}

            {/* Priority 2: Inline action menu */}
            {recordedPath !== null && showActions && (
                <View style={styles.tooltipContainer}>
                    <View style={styles.triangle} />
                    <View style={styles.activeLayout}>

                        {/* Delete */}
                        <TouchableOpacity style={styles.circleBtn} onPress={handleDelete}>
                            <Text style={styles.actionIcon}>🗑️</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Edit */}
                        <TouchableOpacity style={styles.circleBtn} onPress={handleEdit}>
                            <Text style={styles.actionIcon}>✏️</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Cancel */}
                        <TouchableOpacity style={styles.circleBtn} onPress={handleCancel}>
                            <Text style={styles.actionIcon}>❌</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {isRecording && (
                <View style={styles.tooltipContainer}>
                    <View style={styles.triangle} />
                    <View style={styles.activeLayout}>

                        {/* Real-time Waveform */}
                        <View style={styles.waveform}>
                            {waveData.map((h, i) => (
                                <View key={i} style={[styles.waveBar, { height: h }]} />
                            ))}
                        </View>

                        <Text style={styles.timerText}>{recordingTimeStr}</Text>

                        {/* Cancel Button */}
                        <TouchableOpacity style={styles.circleBtn} onPress={cancelRecording}>
                            <Text style={styles.cancelIcon}>✕</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Stop Button */}
                        <TouchableOpacity style={styles.circleBtn} onPress={stopRecording}>
                            <View style={styles.stopSquare} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <AudioFilterDrawer 
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
    },
    micButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1A1A24',
        justifyContent: 'center',
        alignItems: 'center',
    },
    musicButton: {
        backgroundColor: '#34C759',
    },
    musicIcon: {
        fontSize: 20,
    },
    actionIcon: {
        fontSize: 16,
    },
    micButtonActive: {
        backgroundColor: '#2A2A3A',
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