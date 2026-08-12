package com.envoicefilter

import com.facebook.react.bridge.ReactApplicationContext

class EnVoiceFilterModule(reactContext: ReactApplicationContext) :
  NativeEnVoiceFilterSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeEnVoiceFilterSpec.NAME
  }
}
