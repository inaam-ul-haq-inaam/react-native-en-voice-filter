package com.envoicefilter

import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Supported voice filter types with their Sonic parameters.
 */
enum class FilterType(val pitch: Float, val speed: Float, val rate: Float) {
    ORIGINAL(1.0f, 1.0f, 1.0f),
    ROBOT(1.9f, 1.0f, 1.0f),
    DEEP(0.6f, 0.9f, 0.9f),
    ECHO(1.0f, 1.0f, 1.0f)
}

/**
 * Holds decoded raw 16-bit PCM audio.
 */
data class PcmAudio(
    val sampleRate: Int,
    val channelCount: Int,
    val pcmBytes: ByteArray
)

/**
 * Standalone audio processor: decodes AAC/MP4 -> PCM, applies Sonic
 * pitch/speed effect, and writes a filtered WAV file.
 */
class AudioProcessor {

    /**
     * Applies [filterType] to [inputPath] and returns the new WAV file path.
     */
    fun applyFilter(inputPath: String, filterType: FilterType): String {
        val pcm = decodeToPcm(inputPath)

        val processed = when (filterType) {
            FilterType.ORIGINAL -> pcm
            FilterType.ROBOT, FilterType.DEEP -> applyPitchShift(pcm, filterType)
            FilterType.ECHO -> applyEcho(pcm)
        }

        val outputPath = File(inputPath).parent +
            "/voice_filtered_${System.currentTimeMillis()}.wav"
        writeWav(processed, outputPath)
        return outputPath
    }

    // ------------------------------------------------------------------
    // Pitch shifting via the official Sonic DSP library (local Java port)
    // ------------------------------------------------------------------

    private fun applyPitchShift(input: PcmAudio, type: FilterType): PcmAudio {
        val inputShort = ByteBuffer.wrap(input.pcmBytes)
            .order(ByteOrder.LITTLE_ENDIAN)
            .asShortBuffer()
        val inputArr = ShortArray(inputShort.remaining())
        inputShort.get(inputArr)

        val sonic = Sonic(input.sampleRate, input.channelCount)
        sonic.setSpeed(type.speed)
        sonic.setPitch(type.pitch)
        sonic.setRate(type.rate)
        sonic.writeShortToStream(inputArr, inputArr.size)
        sonic.flushStream()

        val outSamples = sonic.samplesAvailable()
        val outBuf = ShortArray(outSamples)
        if (outSamples > 0) {
            sonic.readShortFromStream(outBuf, outSamples)
        }

        val outBytes = ByteArray(outBuf.size * 2)
        ByteBuffer.wrap(outBytes).order(ByteOrder.LITTLE_ENDIAN)
            .asShortBuffer().put(outBuf)

        return PcmAudio(
            sampleRate = input.sampleRate,
            channelCount = input.channelCount,
            pcmBytes = outBytes
        )
    }

    // ------------------------------------------------------------------
    // Echo effect (simple delay with feedback)
    // ------------------------------------------------------------------

    private fun applyEcho(input: PcmAudio): PcmAudio {
        val inputShort = ByteBuffer.wrap(input.pcmBytes)
            .order(ByteOrder.LITTLE_ENDIAN)
            .asShortBuffer()
        val inputArr = ShortArray(inputShort.remaining())
        inputShort.get(inputArr)

        val outputArr = ShortArray(inputArr.size)
        val delaySamples = input.sampleRate / 2 // 500ms delay
        val feedback = 0.45f

        for (i in inputArr.indices) {
            var value = inputArr[i].toFloat()
            val delayIndex = i - delaySamples
            if (delayIndex >= 0) {
                value += outputArr[delayIndex] * feedback
            }
            outputArr[i] = value.toInt()
                .coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt())
                .toShort()
        }

        val outBytes = ByteArray(outputArr.size * 2)
        ByteBuffer.wrap(outBytes).order(ByteOrder.LITTLE_ENDIAN)
            .asShortBuffer().put(outputArr)

        return PcmAudio(
            sampleRate = input.sampleRate,
            channelCount = input.channelCount,
            pcmBytes = outBytes
        )
    }

    // ------------------------------------------------------------------
    // WAV writer (16-bit PCM)
    // ------------------------------------------------------------------

    private fun writeWav(audio: PcmAudio, outputPath: String) {
        val byteRate = audio.sampleRate * audio.channelCount * 2
        val dataSize = audio.pcmBytes.size

        FileOutputStream(outputPath).use { fos ->
            fos.write("RIFF".toByteArray(Charsets.US_ASCII))
            fos.write(intLe(36 + dataSize))
            fos.write("WAVE".toByteArray(Charsets.US_ASCII))
            fos.write("fmt ".toByteArray(Charsets.US_ASCII))
            fos.write(intLe(16))
            fos.write(shortLe(1))
            fos.write(shortLe(audio.channelCount))
            fos.write(intLe(audio.sampleRate))
            fos.write(intLe(byteRate))
            fos.write(shortLe(audio.channelCount * 2))
            fos.write(shortLe(16))
            fos.write("data".toByteArray(Charsets.US_ASCII))
            fos.write(intLe(dataSize))
            fos.write(audio.pcmBytes)
        }
    }

    private fun intLe(value: Int): ByteArray = ByteBuffer.allocate(4)
        .order(ByteOrder.LITTLE_ENDIAN).putInt(value).array()

    private fun shortLe(value: Int): ByteArray = ByteBuffer.allocate(2)
        .order(ByteOrder.LITTLE_ENDIAN).putShort(value.toShort()).array()

    // ------------------------------------------------------------------
    // PCM decoding (AAC/MP4 -> raw 16-bit PCM via MediaCodec)
    // ------------------------------------------------------------------

    private fun decodeToPcm(inputPath: String): PcmAudio {
        val extractor = MediaExtractor()
        extractor.setDataSource(inputPath)

        val trackIndex = findAudioTrack(extractor)
        check(trackIndex >= 0) { "No audio track found in $inputPath" }
        extractor.selectTrack(trackIndex)

        val format = extractor.getTrackFormat(trackIndex)
        val sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
        val channelCount = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
        val mime = format.getString(MediaFormat.KEY_MIME) ?: "audio/mp4a-latm"

        val decoder = MediaCodec.createDecoderByType(mime)
        decoder.configure(format, null, null, 0)
        decoder.start()

        val pcmOut = java.io.ByteArrayOutputStream()
        val bufferInfo = MediaCodec.BufferInfo()
        var outputDone = false
        var inputDone = false

        while (!outputDone) {
            if (!inputDone) {
                val inIndex = decoder.dequeueInputBuffer(10000)
                if (inIndex >= 0) {
                    val inBuf = decoder.getInputBuffer(inIndex)!!
                    val sampleSize = extractor.readSampleData(inBuf, 0)
                    if (sampleSize < 0) {
                        decoder.queueInputBuffer(
                            inIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM
                        )
                        inputDone = true
                    } else {
                        decoder.queueInputBuffer(inIndex, 0, sampleSize, extractor.sampleTime, 0)
                        extractor.advance()
                    }
                }
            }

            val outIndex = decoder.dequeueOutputBuffer(bufferInfo, 10000)
            if (outIndex >= 0) {
                if (bufferInfo.size > 0) {
                    val outBuf = decoder.getOutputBuffer(outIndex)!!
                    val chunk = ByteArray(bufferInfo.size)
                    outBuf.position(bufferInfo.offset)
                    outBuf.get(chunk)
                    pcmOut.write(chunk)
                }
                decoder.releaseOutputBuffer(outIndex, false)
                if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
                    outputDone = true
                }
            }
        }

        extractor.release()
        decoder.stop()
        decoder.release()

        return PcmAudio(
            sampleRate = sampleRate,
            channelCount = channelCount,
            pcmBytes = pcmOut.toByteArray()
        )
    }

    private fun findAudioTrack(extractor: MediaExtractor): Int {
        for (i in 0 until extractor.trackCount) {
            val format = extractor.getTrackFormat(i)
            val mime = format.getString(MediaFormat.KEY_MIME) ?: continue
            if (mime.startsWith("audio/")) return i
        }
        return -1
    }
}
