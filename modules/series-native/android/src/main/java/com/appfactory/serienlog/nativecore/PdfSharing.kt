package com.appfactory.serienlog.nativecore

import android.content.ClipData
import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider

internal fun pdfShareIntent(context: Context, uris: List<String>): Intent {
    require(uris.size in 1..20) { NativeLanguage.text(context, R.string.sl_7f046abf8dc9) }
    val shared = ArrayList(uris.map { uri ->
        val file = privateDocument(context, uri)
        require(file.extension.equals("pdf", ignoreCase = true)) { NativeLanguage.text(context, R.string.sl_733738002aef) }
        FileProvider.getUriForFile(context, context.packageName + ".series.files", file)
    })
    val clips = ClipData.newUri(context.contentResolver, "Serienprotokoll", shared.first())
    shared.drop(1).forEach { clips.addItem(ClipData.Item(it)) }
    val intent = Intent(Intent.ACTION_SEND_MULTIPLE).setType("application/pdf")
        .putParcelableArrayListExtra(Intent.EXTRA_STREAM, shared)
        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    intent.clipData = clips
    return Intent.createChooser(intent, NativeLanguage.text(context, R.string.sl_76dc2fb8fb39))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
}
