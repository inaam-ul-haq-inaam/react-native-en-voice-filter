import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import NativeVoiceFilter from './NativeVoiceFilter';

interface AudioFilterDrawerProps {
    visible: boolean;
    audioPath: string | null;
    onClose: () => void;
    onConfirm?: (path: string, filter: string) => void;
    initialFilter?: string;
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
}

const DEFAULT_FILTER_OPTIONS = ['Original', 'Robot', 'Deep', 'Echo', 'Chipmunk', 'Helium', 'Giant', 'Slow', 'Fast', 'Alien'];

const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

export const AudioFilterDrawer = ({
    visible,
    audioPath,
    onClose,
    onConfirm,
    initialFilter = 'Original',
    playIconName = 'play',
    pauseIconName = 'pause',
    closeIconName = 'close',
    confirmIconName = 'checkmark',
    iconColor = '#FFFFFF',
    accentColor = '#8A58FF',
    titleText = 'Voice Filters',
    playerTitleText = 'Recorded Audio',
    processingText = 'Applying filter...',
    filterOptions = DEFAULT_FILTER_OPTIONS
}: AudioFilterDrawerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [selectedFilter, setSelectedFilter] = useState('Original');
    const [, setFilteredPath] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const isPlayingRef = useRef(false);
    const durationRef = useRef(0);
    const pathRef = useRef<string | null>(null);

    useEffect(() => {
        if (!visible) return;

        const interval = setInterval(() => {
            try {
                const nativePlaying = NativeVoiceFilter.isPlaying();
                if (nativePlaying !== isPlayingRef.current) {
                    isPlayingRef.current = nativePlaying;
                    setIsPlaying(nativePlaying);
                }

                if (nativePlaying) {
                    const pos = NativeVoiceFilter.getCurrentPosition();
                    setCurrentPosition(pos);

                    const dur = NativeVoiceFilter.getDuration();
                    if (dur > 0 && dur !== durationRef.current) {
                        durationRef.current = dur;
                        setDuration(dur);
                    }
                }
            } catch (e) {

            }
        }, 200);
        return () => clearInterval(interval);
    }, [visible]);

    // Reset state when drawer opens
    useEffect(() => {
        if (visible) {
            setIsPlaying(false);
            isPlayingRef.current = false;
            setCurrentPosition(0);
            setDuration(0);
            durationRef.current = 0;
            setSelectedFilter(initialFilter || 'Original');
            setFilteredPath(null);
            pathRef.current = null;
            setIsProcessing(false);

            
        }
    }, [visible]);

    const togglePlayback = () => {
        const path = pathRef.current || audioPath;
        if (!path) return;

        try {
            if (isPlayingRef.current) {
                NativeVoiceFilter.pauseRecording();
                isPlayingRef.current = false;
                setIsPlaying(false);
            } else {
                NativeVoiceFilter.stopPlayback();
                NativeVoiceFilter.playRecording(path);
                isPlayingRef.current = true;
                setIsPlaying(true);
                setCurrentPosition(0);

                // Get duration right after starting playback
                const dur = NativeVoiceFilter.getDuration();
                if (dur > 0) {
                    durationRef.current = dur;
                    setDuration(dur);
                }
            }
        } catch (e) {
            console.error("Playback error", e);
        }
    };

    const selectFilter = async (filter: string) => {
        if (!audioPath) return;
        setSelectedFilter(filter);
        setIsProcessing(true);

        try {
            // Stop any current playback before processing
            NativeVoiceFilter.stopPlayback();
            isPlayingRef.current = false;
            setIsPlaying(false);

            const type = filter === 'Original' ? 'ORIGINAL' : filter.toUpperCase();
            const result = await NativeVoiceFilter.applyFilter(audioPath, type);
            setFilteredPath(result);
            pathRef.current = result;
        } catch (e) {
            console.error("Filter error", e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = () => {
        try {
            NativeVoiceFilter.stopPlayback();
        } catch (e) {
        }
        isPlayingRef.current = false;
        setIsPlaying(false);

        const path = pathRef.current || audioPath;
        if (path && onConfirm) {
            onConfirm(path, selectedFilter);
        }
        onClose();
    };

    const displayTime = duration > 0 && currentPosition > 0
        ? `${formatTime(currentPosition)} / ${formatTime(duration)}`
        : formatTime(duration);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backgroundTouch} onPress={onClose} />

                <View style={styles.drawerContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{titleText}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name={closeIconName} size={20} color="#A0A0B0" />
                        </TouchableOpacity>
                    </View>

                    {/* Audio Player */}
                    <View style={styles.playerCard}>
                        <TouchableOpacity style={[styles.playButton, { backgroundColor: accentColor }]} onPress={togglePlayback}>
                            <Icon name={isPlaying ? pauseIconName : playIconName} size={18} color={iconColor} />
                        </TouchableOpacity>

                        <View style={styles.playerInfo}>
                            <Text style={styles.playerTitle}>{playerTitleText}</Text>
                            {/* Static Waveform */}
                            <View style={styles.fakeWaveform}>
                                {[4, 8, 12, 16, 12, 8, 4, 8, 14, 18, 14, 8].map((h, i) => (
                                    <View key={i} style={[styles.waveBar, { height: h }]} />
                                ))}
                                <Text style={styles.timerText}>{displayTime}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.checkButton} onPress={handleConfirm}>
                            <Icon name={confirmIconName} size={18} color={iconColor} />
                        </TouchableOpacity>
                    </View>

                    {/* Filter Chips */}
                    <Text style={styles.sectionTitle}>Select Filter</Text>
                    {isProcessing && (
                        <View style={styles.processingRow}>
                            <ActivityIndicator size="small" color={accentColor} />
                            <Text style={[styles.processingText, { color: accentColor }]}>{processingText}</Text>
                        </View>
                    )}
                    <View style={styles.filtersContainer}>
                        {filterOptions.map((filter, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.filterChip, selectedFilter === filter && { backgroundColor: accentColor }]}
                                onPress={() => selectFilter(filter)}
                                disabled={isProcessing}
                            >
                                <Text style={[styles.chipText, selectedFilter === filter && styles.activeChipText]}>
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backgroundTouch: {
        flex: 1,
    },
    drawerContainer: {
        backgroundColor: '#1E1E2D',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: 300,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    playerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A3A',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#8A58FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    playerInfo: {
        flex: 1,
    },
    playerTitle: {
        color: '#FFF',
        fontSize: 14,
        marginBottom: 5,
    },
    fakeWaveform: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    waveBar: {
        width: 2,
        backgroundColor: '#8A58FF',
        marginHorizontal: 1.5,
        borderRadius: 1,
    },
    timerText: {
        color: '#A0A0B0',
        fontSize: 12,
        marginLeft: 10,
    },
    checkButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3A3A4A',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    sectionTitle: {
        color: '#A0A0B0',
        fontSize: 14,
        marginBottom: 10,
    },
    filtersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterChip: {
        backgroundColor: '#2A2A3A',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    chipText: {
        color: '#FFF',
        fontSize: 14,
    },
    activeChipText: {
        fontWeight: 'bold',
    },
    processingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    processingText: {
        color: '#8A58FF',
        marginLeft: 8,
        fontSize: 13,
    },
});
