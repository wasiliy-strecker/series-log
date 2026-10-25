package com.appfactory.serienlog.nativecore
import android.app.Application
import android.app.NotificationManager
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [24, 35], application = Application::class, qualifiers = "fr-rFR")
class NativeLanguageTest {
  private val context get() = RuntimeEnvironment.getApplication()
  @Test fun preferencePersistsAndRegionRemainsIndependent() {
    NativeLanguage.select(context, "en")
    NativeLanguage.restore(context)
    assertEquals("en", NativeLanguage.preference(context))
    assertEquals("fr-FR", NativeLanguage.state(context)["formatLocale"])
    assertEquals("Series", NativeLanguage.text(context, R.string.sl_9868120d1ed7))
    NativeLanguage.select(context, null)
    assertNull(NativeLanguage.preference(context))
    assertEquals("fr", NativeLanguage.language(context))
  }
  @Test fun fallbackAndAllNativeTranslationsAreAvailable() {
    RuntimeEnvironment.setQualifiers("sv-rSE")
    NativeLanguage.select(context, null)
    assertEquals("en", NativeLanguage.language(context))
    val expected = mapOf("de" to "Serie", "en" to "Series", "es" to "Serie", "fr" to "Série", "it" to "Serie", "pt" to "Série")
    expected.forEach { (language, label) ->
      NativeLanguage.select(context, language)
      assertEquals(label, NativeLanguage.text(context, R.string.sl_9868120d1ed7))
    }
  }
  @Test fun notificationLanguageChangesWithoutMovingAnAlarmOrRewritingUserText() {
    shadowOf(context).grantPermissions("android.permission.POST_NOTIFICATIONS")
    NativeLanguage.select(context, "de")
    val reminder = StoredReminder("series-a", "My own title", "series", "My genre", "Staffel 2 · Folge 7", null, "daily", 1, null, 9, 0, "normal", latestSeason = 2, latestEpisode = 7)
    val due = System.currentTimeMillis() + 123456L
    ReminderStore.save(context, reminder, due, false)
    ReminderNotifier.showRecord(context, reminder, 42L)
    NativeLanguage.select(context, "en")
    val notification = shadowOf(context.getSystemService(NotificationManager::class.java)).allNotifications.single()
    assertTrue(notification.extras.getCharSequence("android.text").toString().contains("Season 2 · Episode 7"))
    assertTrue(notification.extras.getCharSequence("android.title").toString().contains("My own title"))
    assertEquals(due, ReminderStore.nextTrigger(context, reminder.recordId))
    assertEquals(42L, notification.`when`)
    assertEquals(reminder, StoredReminder.fromJson(reminder.toJson()))
  }
}
