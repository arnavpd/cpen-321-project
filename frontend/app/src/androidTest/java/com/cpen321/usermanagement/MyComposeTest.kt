package com.cpen321.usermanagement

import androidx.compose.ui.semantics.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.*
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.*
import org.junit.Rule
import org.junit.Test
import java.io.File
import kotlin.random.Random
import java.util.Calendar
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.contrib.PickerActions
import androidx.test.espresso.matcher.ViewMatchers.*
import org.hamcrest.Matchers.equalTo

class MyComposeTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()


    private fun signInWithGoogle() {
        // Wait for the sign-in button to appear (this also ensures Compose is ready)
        composeTestRule.waitUntil(timeoutMillis = 10_000) {
            try {
                composeTestRule.onNodeWithText("Sign in with Google", ignoreCase = true)
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        // Click the Google sign-in button by visible text
        composeTestRule
            .onNodeWithText("Sign in with Google", ignoreCase = true)
            .performClick()

        // Use UI Automator to interact with the Google account chooser (system UI)
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

        // Wait for the account chooser to appear
        device.wait(Until.hasObject(By.textContains("Choose an account")), 5_000)

        // Find and click the first actual account (not "Create new account" or "Add another account")
        // Look for objects containing "@" and exclude buttons
        val allObjects = device.findObjects(By.textContains("@"))
        val account = allObjects.firstOrNull { obj ->
            val text = obj.text?.lowercase() ?: ""
            // Exclude buttons that might contain "@" or are account-related buttons
            !text.contains("create") && 
            !text.contains("new account") && 
            !text.contains("add another account") &&
            !text.contains("add account") &&
            text.contains("@") && // Must be an actual email
            text.length > 5 // Email addresses are longer than button text
        }
        
        // If we found a filtered account, use it; otherwise fall back to first object with "@"
        account?.click() ?: run {
            // Fallback: click first object that looks like an email (contains @ and is reasonable length)
            val fallbackAccount = allObjects.firstOrNull { obj ->
                val text = obj.text ?: ""
                text.contains("@") && text.length > 5 && text.length < 100
            }
            fallbackAccount?.click()
        }

        // After sign-in, a Skip button appears in-app; click it
        // Wait a bit for the app to return from system UI
        Thread.sleep(2_000)
        
        composeTestRule.waitUntil(timeoutMillis = 10_000) {
            try {
                composeTestRule.onNodeWithText("Skip", ignoreCase = true)
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }
        composeTestRule.onNodeWithText("Skip", ignoreCase = true).performClick()
        
        // Wait for UI to settle after clicking Skip
        composeTestRule.waitForIdle()
    }

    @Test
    fun add_expense() {
        // First, sign in and navigate past onboarding
        signInWithGoogle()

        Thread.sleep(1000)

        composeTestRule.onNodeWithText("Test1", ignoreCase = true)
            .assertIsDisplayed()

        composeTestRule
            .onNodeWithText("Test1", ignoreCase = true)
            .performClick()

        composeTestRule.onNodeWithText("Expense", ignoreCase = true)
            .assertIsDisplayed()

        composeTestRule.onNodeWithText("Expense", ignoreCase = true)
            .performClick()

        composeTestRule.onNodeWithText("Add Expense", ignoreCase = true)
            .assertIsDisplayed()

        // Click "Add Expense" to open the dialog
        composeTestRule.onNodeWithText("Add Expense", ignoreCase = true)
            .performClick()

        // Wait for dialog to appear (check for title "Add New Expense")
        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            try {
                composeTestRule.onNodeWithText("Add New Expense", ignoreCase = true)
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        // Generate a single random number to use for both description and amount
        val randomNumber = Random.nextInt(1, 99)
        val randomDescription = "Test $randomNumber"
        val randomAmount = randomNumber.toString()

        composeTestRule.onNode(
            hasText("Add Expense", ignoreCase = true) and
                    hasClickAction() and
                    hasAnyAncestor(isDialog())         // scope to the dialog
        ).assertIsDisplayed()
            .performClick()

        // Check for error message in dialog (now displayed inline instead of toast)
        composeTestRule.waitUntil(timeoutMillis = 3_000) {
            try {
                composeTestRule.onAllNodes(
                    hasText("Please fill all fields correctly", ignoreCase = true) and
                            hasAnyAncestor(isDialog())
                ).fetchSemanticsNodes().isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        composeTestRule.onNode(
            hasText("Please fill all fields correctly", ignoreCase = true) and
                    hasAnyAncestor(isDialog())
        ).assertIsDisplayed()

        composeTestRule.waitUntil(timeoutMillis = 3_000) {
            try {
                composeTestRule.onAllNodes(hasSetTextAction())[0]
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        composeTestRule.onAllNodes(hasSetTextAction())[1]
            .performTextInput("NON_INTEGER")

        // Open the Paid By dropdown by its current label text
        // (It shows "Select who paid" before a choice is made)
        composeTestRule.onNodeWithText("Select who paid", ignoreCase = true)
            .assertIsDisplayed()
            .performClick()

        // Wait for the popup to appear and click the item inside the popup
        composeTestRule.onNode(isPopup()).assertExists()

        composeTestRule
            .onNode(hasText("Arnav Prasad") and hasAnyAncestor(isPopup()))
            .assertIsDisplayed()
            .performClick()

        // Popup gone
        composeTestRule.onNode(isPopup()).assertDoesNotExist()

        // Assert the button shows the selection (merged semantics)
        composeTestRule
            .onNode(
                hasText("Arnav Prasad") and
                        hasClickAction() and
                        !hasAnyAncestor(isPopup())
            )
            .assertIsDisplayed()

        // Tick the split checkbox (same as you had)
        composeTestRule.onNode(
            isToggleable() and
                    hasParent(hasAnyDescendant(hasText("Arnav Prasad"))) and
                    !hasAnyAncestor(isPopup())
        ).assertExists().performClick()

        composeTestRule.onNode(
            isToggleable() and
                    hasParent(hasAnyDescendant(hasText("Arnav Prasad"))) and
                    !hasAnyAncestor(isPopup())
        ).assertIsOn()

        composeTestRule.onNode(
            hasText("Add Expense", ignoreCase = true) and
                    hasClickAction() and
                    hasAnyAncestor(isDialog())         // scope to the dialog
        ).assertIsDisplayed()
            .performClick()

        // Check for error message in dialog (now displayed inline instead of toast)
        composeTestRule.waitUntil(timeoutMillis = 3_000) {
            try {
                composeTestRule.onAllNodes(
                    hasText("Please fill all fields correctly", ignoreCase = true) and
                            hasAnyAncestor(isDialog())
                ).fetchSemanticsNodes().isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        composeTestRule.onNode(
            hasText("Please fill all fields correctly", ignoreCase = true) and
                    hasAnyAncestor(isDialog())
        ).assertIsDisplayed()

        // Try valid now
        composeTestRule.onAllNodes(hasSetTextAction())[0]
            .performTextInput(randomDescription)

        composeTestRule.onAllNodes(hasSetTextAction())
            .get(1) // 2nd text field (amount)
            .performTextReplacement(randomAmount)

        composeTestRule.onNode(
            hasText("Add Expense", ignoreCase = true) and
                    hasClickAction() and
                    hasAnyAncestor(isDialog())         // scope to the dialog
        ).assertIsDisplayed()
            .performClick()

        val coreAmount = randomNumber.toString()

        // 1) Wait for the new expense row to EXIST (don't require displayed yet)
        composeTestRule.waitUntil(timeoutMillis = 15_000) {
            runCatching {
                composeTestRule.onNodeWithText(
                    randomDescription,
                    substring = false,
                    useUnmergedTree = true
                ).assertExists()
            }.isSuccess
        }

        // 2) Now scroll it into view, then assert displayed
        runCatching {
            composeTestRule.onNodeWithText(
                randomDescription,
                substring = false,
                useUnmergedTree = true
            ).performScrollTo()
        }
        composeTestRule.onNodeWithText(
            randomDescription,
            substring = false,
            useUnmergedTree = true
        ).assertIsDisplayed()

        // 3) Amount: match the core number as a substring (handles "$7.00", "$7.0", "$7", "$7\n.00", etc.)
        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            runCatching {
                composeTestRule.onAllNodes(
                    hasText(coreAmount, substring = true, ignoreCase = false) and
                            // keep it out of dialogs/popups just in case
                            !hasAnyAncestor(isDialog()),
                    useUnmergedTree = true
                ).fetchSemanticsNodes().isNotEmpty()
            }.getOrDefault(false)
        }

        // Scroll first matching amount into view (no-op if already visible), then assert displayed
        runCatching {
            composeTestRule.onAllNodes(
                hasText(coreAmount, substring = true, ignoreCase = false) and !hasAnyAncestor(isDialog()),
                useUnmergedTree = true
            ).onFirst().performScrollTo()
        }
        composeTestRule.onAllNodes(
            hasText(coreAmount, substring = true, ignoreCase = false) and !hasAnyAncestor(isDialog()),
            useUnmergedTree = true
        ).onFirst().assertIsDisplayed()

        val rowScope =
            hasAnyAncestor(
                hasAnyDescendant(hasText(randomDescription, substring = true, ignoreCase = false)) or
                        hasAnyDescendant(hasText(coreAmount, substring = true, ignoreCase = false))
            ) and !hasAnyAncestor(isDialog())

        // Wait until the two "Arnav Prasad" occurrences that belong to THIS row appear
        composeTestRule.waitUntil(timeoutMillis = 10_000) {
            val countInRow = composeTestRule.onAllNodes(
                hasText("Arnav Prasad") and rowScope,
                useUnmergedTree = true
            ).fetchSemanticsNodes().size
            countInRow >= 2
        }
    }

    @Test
    fun create_task() {
        // First, sign in and navigate past onboarding
        signInWithGoogle()

        Thread.sleep(1000)

        composeTestRule.onNodeWithText("Test1", ignoreCase = true)
            .assertIsDisplayed()

        composeTestRule
            .onNodeWithText("Test1", ignoreCase = true)
            .performClick()

        composeTestRule.onNode(
            hasText("Task Board", ignoreCase = true) and hasClickAction()
        )
            .assertIsDisplayed()

        composeTestRule.onNode(
            hasText("Task Board", ignoreCase = true) and hasClickAction()
        )
            .performClick()

        composeTestRule.onNodeWithText("Create Task", ignoreCase = true)
            .assertIsDisplayed()

        // ===============================

        // Click "Add Expense" to open the dialog
        composeTestRule.onNodeWithText("Create Task", ignoreCase = true)
            .performClick()

        // Wait for dialog to appear (check for title "Add New Expense")
        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            try {
                composeTestRule.onNodeWithText("Create New Task", ignoreCase = true)
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        composeTestRule.waitUntil(timeoutMillis = 3_000) {
            try {
                composeTestRule.onAllNodes(hasSetTextAction())[0]
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        // Open the Assignee dropdown by clicking "Select assignee" text (same as expense form)
        composeTestRule.onNodeWithText("Select assignee", ignoreCase = true)
            .assertIsDisplayed()
            .performClick()

        // Wait for the popup to appear
        composeTestRule.onNode(isPopup()).assertExists()

        // Click "Arnav Prasad (Me)" inside the popup
        composeTestRule
            .onNode(hasText("Arnav Prasad (Me)") and hasAnyAncestor(isPopup()))
            .assertIsDisplayed()
            .performClick()

        // Popup should be gone
        composeTestRule.onNode(isPopup()).assertDoesNotExist()

        // Assert the button shows the selection
        composeTestRule
            .onNode(
                hasText("Arnav Prasad (Me)") and
                        hasClickAction() and
                        !hasAnyAncestor(isPopup())
            )
            .assertIsDisplayed()

        // Click the deadline button to open date picker (simplified - same pattern as assignee)
        composeTestRule.onNodeWithText("Select deadline date", ignoreCase = true)
            .assertIsDisplayed()
            .performClick()

        // Get today’s date
        val calendar2 = Calendar.getInstance()
        val year2 = calendar2.get(Calendar.YEAR)
        val month2 = calendar2.get(Calendar.MONTH) + 1 // Espresso uses 1-based month
        val day2 = calendar2.get(Calendar.DAY_OF_MONTH)

        // Interact with the Android DatePicker widget
        onView(withClassName(equalTo(android.widget.DatePicker::class.java.name)))
            .perform(PickerActions.setDate(year2, month2, day2))

        // Confirm selection (the positive button has a stable ID)
        onView(withId(android.R.id.button1)).perform(click())

        // Verify your TextButton now shows the chosen date
        val expectedDate2 = java.text.SimpleDateFormat("yyyy-MM-dd").format(calendar2.time)
        composeTestRule.onNode(
            hasText(expectedDate2) and hasClickAction()
        ).assertExists()

        // Wait a moment for the date to be set
        Thread.sleep(500)

        // Click the Create button
        composeTestRule.onNode(
            hasText("Create", ignoreCase = true) and
                    hasClickAction() and
                    hasAnyAncestor(isDialog())
        ).assertIsDisplayed()
            .performClick()

        // Wait to verify task was created
        Thread.sleep(500)

        composeTestRule.onNodeWithText("Task name cannot be empty", ignoreCase = true)
            .assertIsDisplayed()

        // =====================
        // Click "Add Expense" to open the dialog
        composeTestRule.onNodeWithText("Create Task", ignoreCase = true)
            .performClick()

        // Wait for dialog to appear (check for title "Add New Expense")
        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            try {
                composeTestRule.onNodeWithText("Create New Task", ignoreCase = true)
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        composeTestRule.waitUntil(timeoutMillis = 3_000) {
            try {
                composeTestRule.onAllNodes(hasSetTextAction())[0]
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        // Input task name (only editable text field)
        composeTestRule.onAllNodes(hasSetTextAction())[0]
            .performTextInput("Task1")

        // Click the deadline button to open date picker (simplified - same pattern as assignee)
        composeTestRule.onNodeWithText("Select deadline date", ignoreCase = true)
            .assertIsDisplayed()
            .performClick()

        // Get today’s date
        val calendar3 = Calendar.getInstance()
        val year3 = calendar3.get(Calendar.YEAR)
        val month3 = calendar3.get(Calendar.MONTH) + 1 // Espresso uses 1-based month
        val day3 = calendar3.get(Calendar.DAY_OF_MONTH)

        // Interact with the Android DatePicker widget
        onView(withClassName(equalTo(android.widget.DatePicker::class.java.name)))
            .perform(PickerActions.setDate(year3, month3, day3))

        // Confirm selection (the positive button has a stable ID)
        onView(withId(android.R.id.button1)).perform(click())

        // Verify your TextButton now shows the chosen date
        val expectedDate3 = java.text.SimpleDateFormat("yyyy-MM-dd").format(calendar2.time)
        composeTestRule.onNode(
            hasText(expectedDate3) and hasClickAction()
        ).assertExists()

        // Wait a moment for the date to be set
        Thread.sleep(500)

        // Click the Create button
        composeTestRule.onNode(
            hasText("Create", ignoreCase = true) and
                    hasClickAction() and
                    hasAnyAncestor(isDialog())
        ).assertIsDisplayed()
            .performClick()

        // Wait to verify task was created
        Thread.sleep(500)

        composeTestRule.onNodeWithText("Assignee cannot be empty", ignoreCase = true)
            .assertIsDisplayed()

        // =============================
        composeTestRule.onNodeWithText("Create Task", ignoreCase = true)
            .performClick()

        // Wait for dialog to appear (check for title "Add New Expense")
        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            try {
                composeTestRule.onNodeWithText("Create New Task", ignoreCase = true)
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        composeTestRule.waitUntil(timeoutMillis = 3_000) {
            try {
                composeTestRule.onAllNodes(hasSetTextAction())[0]
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        // Input task name (only editable text field)
        composeTestRule.onAllNodes(hasSetTextAction())[0]
            .performTextInput("Task1")

        // Open the Assignee dropdown by clicking "Select assignee" text (same as expense form)
        composeTestRule.onNodeWithText("Select assignee", ignoreCase = true)
            .assertIsDisplayed()
            .performClick()

        // Wait for the popup to appear
        composeTestRule.onNode(isPopup()).assertExists()

        // Click "Arnav Prasad (Me)" inside the popup
        composeTestRule
            .onNode(hasText("Arnav Prasad (Me)") and hasAnyAncestor(isPopup()))
            .assertIsDisplayed()
            .performClick()

        // Popup should be gone
        composeTestRule.onNode(isPopup()).assertDoesNotExist()

        // Assert the button shows the selection
        composeTestRule
            .onNode(
                hasText("Arnav Prasad (Me)") and
                        hasClickAction() and
                        !hasAnyAncestor(isPopup())
            )
            .assertIsDisplayed()

        // Click the deadline button to open date picker (simplified - same pattern as assignee)
        composeTestRule.onNodeWithText("Select deadline date", ignoreCase = true)
            .assertIsDisplayed()
            .performClick()

        val calendar4 = Calendar.getInstance()
        calendar4.add(Calendar.DAY_OF_YEAR, -1) // move back one day

        val year4 = calendar4.get(Calendar.YEAR)
        val month4 = calendar4.get(Calendar.MONTH) + 1 // Espresso uses 1-based month
        val day4 = calendar4.get(Calendar.DAY_OF_MONTH)

        // Interact with the Android DatePicker widget
        onView(withClassName(equalTo(android.widget.DatePicker::class.java.name)))
            .perform(PickerActions.setDate(year4, month4, day4))

        // Confirm selection (the positive button has a stable ID)
        onView(withId(android.R.id.button1)).perform(click())

        // Verify your TextButton now shows the chosen date
        val expectedDate4 = java.text.SimpleDateFormat("yyyy-MM-dd").format(calendar4.time)
        composeTestRule.onNode(
            hasText(expectedDate4) and hasClickAction()
        ).assertExists()

        // Wait a moment for the date to be set
        Thread.sleep(500)

        // Click the Create button
        composeTestRule.onNode(
            hasText("Create", ignoreCase = true) and
                    hasClickAction() and
                    hasAnyAncestor(isDialog())
        ).assertIsDisplayed()
            .performClick()

        // Wait to verify task was created
        Thread.sleep(500)

        composeTestRule.onNodeWithText("Please enter a future date", ignoreCase = true)
            .assertIsDisplayed()

        // ========================
        // Click "Add Expense" to open the dialog
        composeTestRule.onNodeWithText("Create Task", ignoreCase = true)
            .performClick()

        // Wait for dialog to appear (check for title "Add New Expense")
        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            try {
                composeTestRule.onNodeWithText("Create New Task", ignoreCase = true)
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        composeTestRule.waitUntil(timeoutMillis = 3_000) {
            try {
                composeTestRule.onAllNodes(hasSetTextAction())[0]
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        // Generate unique task name for this test run (same pattern as expense test)
        val randomNumber = Random.nextInt(1, 9999)
        val randomTaskName = "Task$randomNumber"

        // Input task name (only editable text field)
        composeTestRule.onAllNodes(hasSetTextAction())[0]
            .performTextInput(randomTaskName)

        // Open the Assignee dropdown by clicking "Select assignee" text (same as expense form)
        composeTestRule.onNodeWithText("Select assignee", ignoreCase = true)
            .assertIsDisplayed()
            .performClick()

        // Wait for the popup to appear
        composeTestRule.onNode(isPopup()).assertExists()

        // Click "Arnav Prasad (Me)" inside the popup
        composeTestRule
            .onNode(hasText("Arnav Prasad (Me)") and hasAnyAncestor(isPopup()))
            .assertIsDisplayed()
            .performClick()

        // Popup should be gone
        composeTestRule.onNode(isPopup()).assertDoesNotExist()

        // Assert the button shows the selection
        composeTestRule
            .onNode(
                hasText("Arnav Prasad (Me)") and
                        hasClickAction() and
                        !hasAnyAncestor(isPopup())
            )
            .assertIsDisplayed()

        // Click the deadline button to open date picker (simplified - same pattern as assignee)
        composeTestRule.onNodeWithText("Select deadline date", ignoreCase = true)
            .assertIsDisplayed()
            .performClick()

        // Get today’s date
        val calendar = Calendar.getInstance()
        val year = calendar.get(Calendar.YEAR)
        val month = calendar.get(Calendar.MONTH) + 1 // Espresso uses 1-based month
        val day = calendar.get(Calendar.DAY_OF_MONTH)

        // Interact with the Android DatePicker widget
        onView(withClassName(equalTo(android.widget.DatePicker::class.java.name)))
            .perform(PickerActions.setDate(year, month, day))

        // Confirm selection (the positive button has a stable ID)
        onView(withId(android.R.id.button1)).perform(click())

        // Verify your TextButton now shows the chosen date
        val expectedDate = java.text.SimpleDateFormat("yyyy-MM-dd").format(calendar.time)
        composeTestRule.onNode(
            hasText(expectedDate) and hasClickAction()
        ).assertExists()

        // Wait a moment for the date to be set
        Thread.sleep(500)

        // Click the Create button
        composeTestRule.onNode(
            hasText("Create", ignoreCase = true) and
                    hasClickAction() and
                    hasAnyAncestor(isDialog())
        ).assertIsDisplayed()
            .performClick()

        // Wait to verify task was created (following expense test pattern)
        Thread.sleep(500)

        composeTestRule.onNodeWithText("Task created successfully", ignoreCase = true)
            .assertIsDisplayed()

        // 1) Wait for the unique task name to exist (same pattern as expense test)
        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            runCatching {
                composeTestRule.onNodeWithText(
                    randomTaskName,
                    substring = false,
                    useUnmergedTree = true
                ).assertExists()
            }.isSuccess
        }

        // 2) Scroll it into view, then assert displayed
        runCatching {
            composeTestRule.onNodeWithText(
                randomTaskName,
                substring = false,
                useUnmergedTree = true
            ).performScrollTo()
        }
        composeTestRule.onNodeWithText(
            randomTaskName,
            substring = false,
            useUnmergedTree = true
        ).assertIsDisplayed()

        // 3) Verify other task details exist (using onAllNodes to handle multiple matches)
        composeTestRule.waitUntil(timeoutMillis = 3_000) {
            runCatching {
                composeTestRule.onAllNodes(
                    hasText("Arnav Prasad (Me)", substring = true, ignoreCase = false) and
                            !hasAnyAncestor(isDialog()),
                    useUnmergedTree = true
                ).fetchSemanticsNodes().isNotEmpty()
            }.getOrDefault(false)
        }

        // Verify the expected date exists (using onAllNodes to handle multiple matches)
        composeTestRule.waitUntil(timeoutMillis = 3_000) {
            runCatching {
                composeTestRule.onAllNodes(
                    hasText(expectedDate, substring = true, ignoreCase = false) and
                            !hasAnyAncestor(isDialog()),
                    useUnmergedTree = true
                ).fetchSemanticsNodes().isNotEmpty()
            }.getOrDefault(false)
        }

    }

    @Test
    fun create_project() {
        // First, sign in and navigate past onboarding
        signInWithGoogle()

        Thread.sleep(1000)

        composeTestRule.onNodeWithText("Create New Project", ignoreCase = true)
            .assertIsDisplayed()

        composeTestRule.onNodeWithText("Create New Project", ignoreCase = true)
            .performClick()

        // Wait for dialog to appear
        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            try {
                composeTestRule.onNode(
                    hasText("Create New Project", ignoreCase = true) and
                            hasAnyAncestor(isDialog())
                ).assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        // Check that the Create button is not enabled (clickable) when form is empty
        composeTestRule.onNode(
            hasText("Create", ignoreCase = true) and
                    hasClickAction() and
                    hasAnyAncestor(isDialog())
        ).assertIsNotEnabled()

        // Wait for text fields to be available
        composeTestRule.waitUntil(timeoutMillis = 3_000) {
            try {
                composeTestRule.onAllNodes(hasSetTextAction())[0]
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }

        // Generate unique project name for this test run (same pattern as other tests)
        val randomNumber = Random.nextInt(1, 9999)
        val randomProjectName = "Project$randomNumber"

        // Input project name into the first text field (Project Name)
        composeTestRule.onAllNodes(hasSetTextAction())[0]
            .performTextInput(randomProjectName)

        composeTestRule.onNode(
            hasText("Create", ignoreCase = true) and
                    hasClickAction() and
                    hasAnyAncestor(isDialog())
        ).assertIsEnabled()

        composeTestRule.onNodeWithText("Create", ignoreCase = true)
            .performClick()

        // TODO: Not implemented currently

        composeTestRule.onNodeWithText("Invite Page", ignoreCase = true)
            .assertIsDisplayed()

        composeTestRule.onNodeWithText("Invite User", ignoreCase = true)
            .assertIsDisplayed()

        composeTestRule.onAllNodes(hasSetTextAction())[0]
            .performTextInput("test")

        composeTestRule.onNodeWithText("Send Invites", ignoreCase = true)
            .assertIsDisplayed()

        composeTestRule.onNodeWithText("Send Invites", ignoreCase = true)
            .performClick()

        composeTestRule.onNodeWithText("Please enter a valid email address", ignoreCase = true)
            .assertIsDisplayed()

        composeTestRule.onAllNodes(hasSetTextAction())
            .get(0) // 2nd text field (amount)
            .performTextReplacement("c62826472@gmail.com")

        composeTestRule.onNodeWithText("Send Invites", ignoreCase = true)
            .assertIsDisplayed()

        composeTestRule.onNodeWithText("Send Invites", ignoreCase = true)
            .performClick()

        composeTestRule.onNodeWithText("Users were invited successfully!", ignoreCase = true)
            .assertIsDisplayed()

        // =========================================================

        composeTestRule.onNodeWithText(randomProjectName, ignoreCase = true)
            .assertIsDisplayed()

        Thread.sleep(10_000)
    }
}


