package com.appfactory.serienlog.nativecore

import android.app.Application
import com.google.gson.Gson
import com.google.gson.JsonParser
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import org.apache.commons.io.FileUtils
import org.apache.commons.io.FilenameUtils
import org.apache.commons.io.IOUtils
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [24, 25, 35], application = Application::class)
class DependencyCompatibilityTest {
    @Test fun jsonPreservesUnicodeAndNestedValues() {
        val encoded = Gson().toJson(mapOf("title" to "Komödie 🎬", "position" to mapOf("season" to 2, "episode" to 3)))
        val parsed = JsonParser.parseString(encoded).asJsonObject
        assertEquals("Komödie 🎬", parsed.get("title").asString)
        assertEquals(3, parsed.getAsJsonObject("position").get("episode").asInt)
    }

    @Test fun fileCopiesAndDeletionPreserveOriginalBytes() {
        val root = File(RuntimeEnvironment.getApplication().cacheDir, "compatibility")
        val source = File(root, "source/älteres-foto.jpg")
        source.parentFile!!.mkdirs()
        val bytes = ByteArray(128 * 1024 + 7) { (it % 251).toByte() }
        source.writeBytes(bytes)
        try {
            val copy = File(root, "copy.jpg")
            FileUtils.copyFile(source, copy)
            assertArrayEquals(bytes, copy.readBytes())
            val directory = File(root, "directory")
            FileUtils.copyDirectory(source.parentFile, directory)
            assertArrayEquals(bytes, File(directory, source.name).readBytes())
            FileUtils.forceDelete(directory)
            assertFalse(directory.exists())
            assertArrayEquals(bytes, source.readBytes())
            val output = ByteArrayOutputStream()
            IOUtils.copy(ByteArrayInputStream(bytes), output)
            assertArrayEquals(bytes, output.toByteArray())
        } finally {
            root.deleteRecursively()
        }
    }

    @Test fun documentExtensionsHandleSpacesUnicodeAndMissingSuffixes() {
        assertEquals("slbackup", FilenameUtils.getExtension("Serien März.2026.slbackup"))
        assertEquals("pdf", FilenameUtils.getExtension("Serienprotokoll.pdf"))
        assertEquals("", FilenameUtils.getExtension("Backup ohne Endung"))
    }
}
