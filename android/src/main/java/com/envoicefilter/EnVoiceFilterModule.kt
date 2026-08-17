package com.envoicefilter

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
import android.media.MediaRecorder
import android.media.MediaPlayer
import android.os.Build
import java.io.File
import java.io.IOException

class EnVoiceFilterModule(private val reactContext: ReactApplicationContext) :
  NativeVoiceFilterSpec(reactContext) {

  private var mediaRecorder: MediaRecorder? = null
  private var outputFilePath: String = ""
  private var mediaPlayer: MediaPlayer? = null

  override fun startRecording() {
    try {
      // Create a temporary file in the app's cache directory
      val cacheDir = reactContext.cacheDir
      outputFilePath = "${cacheDir.absolutePath}/voice_record_${System.currentTimeMillis()}.mp4"

      // Initialize MediaRecorder (Handle API level differences if needed, but this works for most)
      mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          MediaRecorder(reactContext)
      } else {
          @Suppress("DEPRECATION")
          MediaRecorder()
      }.apply {
        setAudioSource(MediaRecorder.AudioSource.MIC)
        setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
        setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
        setOutputFile(outputFilePath)
        prepare()
        start()
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  override fun stopRecording(promise: Promise) {
    try {
      mediaRecorder?.apply {
        stop()
        release()
      }
      mediaRecorder = null
      
      // TODO: Here we will later apply the "Sonic" filter to the raw file 
      // before returning it to the user. For now, we return the raw recording.
      promise.resolve(outputFilePath)
      
    } catch (e: Exception) {
      mediaRecorder?.release()
      mediaRecorder = null
      promise.reject("RECORDING_ERROR", "Failed to stop recording", e)
    }
  }

  override fun cancelRecording() {
    try {
      mediaRecorder?.apply {
        stop()
        release()
      }
      mediaRecorder = null
      
      // Delete the cancelled recording file
      if (outputFilePath.isNotEmpty()) {
        val file = File(outputFilePath)
        if (file.exists()) {
          file.delete()
        }
      }
    } catch (e: Exception) {
      mediaRecorder?.release()
      mediaRecorder = null
    }
  }

  override fun getAmplitude(): Double {
    return try {
        mediaRecorder?.maxAmplitude?.toDouble() ?: 0.0
    } catch (e: Exception) {
        0.0
    }
  }

  override fun playRecording(path: String) {
    try {
      stopPlayback()
      mediaPlayer = MediaPlayer().apply {
        setDataSource(path)
        setOnCompletionListener {
          // Reset to idle state when playback completes
          it.release()
          mediaPlayer = null
        }
        prepare()
        start()
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  override fun pauseRecording() {
    try {
      mediaPlayer?.let {
        if (it.isPlaying) {
          it.pause()
        }
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  override fun stopPlayback() {
    try {
      mediaPlayer?.let {
        if (it.isPlaying) {
          it.stop()
        }
        it.release()
      }
      mediaPlayer = null
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  override fun isPlaying(): Boolean {
    return try {
      mediaPlayer?.isPlaying ?: false
    } catch (e: Exception) {
      false
    }
  }

  override fun getCurrentPosition(): Double {
    return try {
      mediaPlayer?.currentPosition?.toDouble() ?: 0.0
    } catch (e: Exception) {
      0.0
    }
  }

  override fun getDuration(): Double {
    return try {
      mediaPlayer?.duration?.toDouble() ?: 0.0
    } catch (e: Exception) {
      0.0
    }
  }

  override fun getDurationFromPath(path: String): Double {
    return try {
      val player = MediaPlayer()
      player.setDataSource(path)
      player.prepare()
      val duration = player.duration.toDouble()
      player.release()
      duration
    } catch (e: Exception) {
      0.0
    }
  }

  override fun applyFilter(inputPath: String, filterType: String, promise: Promise) {
    try {
      // Run audio processing off the main thread
      Thread {
        try {
          val type = when (filterType.uppercase()) {
            "SLOW" -> FilterType.SLOW
            "FAST" -> FilterType.FAST
            "CHIPMUNK" -> FilterType.CHIPMUNK
            "BABY" -> FilterType.BABY
            "ROBOT" -> FilterType.ROBOT
            "ECHO" -> FilterType.ECHO
            "HACKER" -> FilterType.HACKER
            else -> FilterType.ORIGINAL
          }

          val outputPath = AudioProcessor().applyFilter(inputPath, type)
          promise.resolve(outputPath)
        } catch (e: Exception) {
          promise.reject("FILTER_ERROR", "Failed to apply filter", e)
        }
      }.start()
    } catch (e: Exception) {
      promise.reject("FILTER_ERROR", "Failed to start filter", e)
    }
  }

  companion object {
    const val NAME = NativeVoiceFilterSpec.NAME
  }
}