package com.appfactory.serienlog.nativecore

import android.app.LocaleManager
import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import android.os.Build
import android.os.LocaleList
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import java.util.Locale

internal object NativeLanguage {
    private val supported = setOf("de", "en", "es", "fr", "it", "pt")
    private fun preferences(context: Context) = context.getSharedPreferences("series_language", Context.MODE_PRIVATE)

    fun preference(context: Context): String? {
        val tag = if (Build.VERSION.SDK_INT >= 33) {
            context.getSystemService(LocaleManager::class.java).applicationLocales.let {
                if (it.isEmpty) null else it[0].language
            }
        } else preferences(context).getString("language", null)
        return tag?.takeIf { supported.contains(it) }
    }

    fun systemLocales(context: Context): List<Locale> {
        val locales = if (Build.VERSION.SDK_INT >= 33) {
            context.getSystemService(LocaleManager::class.java).systemLocales
        } else Resources.getSystem().configuration.locales
        return (0 until locales.size()).map { locales[it] }.ifEmpty { listOf(Locale.US) }
    }

    fun language(context: Context): String = preference(context)
        ?: systemLocales(context).firstOrNull { supported.contains(it.language) }?.language ?: "en"

    fun state(context: Context): Map<String, Any?> = mapOf(
        "preference" to preference(context),
        "language" to language(context),
        "formatLocale" to systemLocales(context).first().toLanguageTag(),
    )

    fun select(context: Context, language: String?) {
        require(language == null || supported.contains(language))
        // Background receivers can read this preference on Android 12 and below.
        check(preferences(context).edit().putString("language", language).commit())
        val tags = if (language == "pt") "pt-BR" else language.orEmpty()
        if (Build.VERSION.SDK_INT >= 33) {
            context.getSystemService(LocaleManager::class.java).applicationLocales = LocaleList.forLanguageTags(tags)
        } else AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tags))
        refreshNotifications(context)
    }

    fun restore(context: Context) {
        if (Build.VERSION.SDK_INT < 33) {
            val language = preference(context)
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(
                if (language == "pt") "pt-BR" else language.orEmpty(),
            ))
        }
    }

    fun resources(context: Context): Resources {
        val locale = Locale.forLanguageTag(if (language(context) == "pt") "pt-BR" else language(context))
        val configuration = Configuration(context.resources.configuration)
        configuration.setLocale(locale)
        return context.createConfigurationContext(configuration).resources
    }

    fun text(context: Context, resource: Int, vararg parameters: Any): String =
        resources(context).getString(resource, *parameters)

    fun refreshNotifications(context: Context) {
        ReminderNotifier.ensureChannels(context)
        ReminderStore.all(context).forEach { ReminderNotifier.refreshTranslation(context, it) }
    }
}
