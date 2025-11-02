# Testing and Code Review

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
| _Nothing to show_ |

---

## 2. Back-end Test Specification: APIs

### 2.1. Locations of Back-end Tests and Instructions to Run Them

#### 2.1.1. Tests

| **Interface**                 | **Describe Group Location, No Mocks**                | **Describe Group Location, With Mocks**            | **Mocked Components**              |
| ----------------------------- | ---------------------------------------------------- | -------------------------------------------------- | ---------------------------------- |
| **POST /user/login**          | [`tests/unmocked/authenticationLogin.test.js#L1`](#) | [`tests/mocked/authenticationLogin.test.js#L1`](#) | Google Authentication API, User DB |
| **POST /study-groups/create** | ...                                                  | ...                                                | Study Group DB                     |
| ...                           | ...                                                  | ...                                                | ...                                |
| ...                           | ...                                                  | ...                                                | ...                                |

#### 2.1.2. Commit Hash Where Tests Run

`[Insert Commit SHA here]`

#### 2.1.3. Explanation on How to Run the Tests

1. **Clone the Repository**:

   - Open your terminal and run:
     ```
     git clone https://github.com/example/your-project.git
     ```

2. **...**

### 2.2. GitHub Actions Configuration Location

`~/.github/workflows/backend-tests.yml`

### 2.3. Jest Coverage Report Screenshots for Tests Without Mocking

_(Placeholder for Jest coverage screenshot without mocking)_

### 2.4. Jest Coverage Report Screenshots for Tests With Mocking

_(Placeholder for Jest coverage screenshot with mocking)_

### 2.5. Jest Coverage Report Screenshots for Both Tests With and Without Mocking

_(Placeholder for Jest coverage screenshot both with and without mocking)_

---

## 3. Back-end Test Specification: Tests of Non-Functional Requirements

### 3.1. Test Locations in Git

| **Non-Functional Requirement**  | **Location in Git**                              |
| ------------------------------- | ------------------------------------------------ |
| **Performance (Response Time)** | [`tests/nonfunctional/response_time.test.js`](#) |
| **Chat Data Security**          | [`tests/nonfunctional/chat_security.test.js`](#) |

### 3.2. Test Verification and Logs

- **Performance (Response Time)**

  - **Verification:** This test suite simulates multiple concurrent API calls using Jest along with a load-testing utility to mimic real-world user behavior. The focus is on key endpoints such as user login and study group search to ensure that each call completes within the target response time of 2 seconds under normal load. The test logs capture metrics such as average response time, maximum response time, and error rates. These logs are then analyzed to identify any performance bottlenecks, ensuring the system can handle expected traffic without degradation in user experience.
  - **Log Output**
    ```
    [Placeholder for response time test logs]
    ```

- **Chat Data Security**
  - **Verification:** ...
  - **Log Output**
    ```
    [Placeholder for chat security test logs]
    ```

---

## 4. Front-end Test Specification

### 4.1. Location in Git of Front-end Test Suite:

`cpen-321-project\frontend\app\src\androidTest\java\com\cpen321\usermanagement\MyComposeTest.kt`

### 4.2. Tests

- **Use Case: Creating a New Project (Use Case 2)**

  - **Expected Behaviors:**
    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | 1. The app displays a "Create New Project" button which the user clicks | Check button labelled "Create New Project" is present on screen.<br>Click button labelled "Create New Project". |
    | 2. The app displays a "Create New Project" form | Check "Create New Project" form is present on screen. |
    | 3a. The user inputs an empty project name | Check button labelled "Create" is disabled. |
    | 3. The user inputs a non-empty project name and optional description | Input "ProjectRandomNumber" under "Project Name". |
    | 4. The user clicks the "Create" button | Check button labelled "Create" is enabled.<br>Click "Create" button. |
    | 5. The user is taken to an invite page | Check text "Invite Page" is present on screen. |
    | 6a. The user enters an invalid email address | Check "Invite User" input is present on screen.<br>Input "test" under "Invite User".<br>Check button labelled "Send Invites" is present on screen.<br>Click button labelled "Send Invites". |
    | 6a1. The app displays an error message prompting the user to input a valid email address | Check dialog is opened with text: "Please enter a valid email address". |
    | 6. The user enters the email addresses of other users they want to invite to the project | Check "Invite User" input is present on screen.<br>Input "c62826472@gmail.com" under "Invite User". |
    | 7. The user clicks the "Send Invites" button | Check button labelled "Send Invites" is present on screen.<br>Click button labelled "Send Invites". |
    | 8. The user sees a success message | Check dialog is opened with text: "Users were invited successfully!" |
    | 9. The user is redirected to the home screen | Check project is visible on screen: "ProjectRandomNumber". |

  - **Test Logs:**
    ```
    Note: This test currently fails because the invite users page has not been implemented yet.
    Test execution requires completion of the user invitation feature.
    ```
    ![create_project](\images\create_project.png)
    ![invitation failed](\images\invite_failed.png)


- **Use Case: Adding Project Expenses (Use Case 4)**

  - **Expected Behaviors:**
    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | 1. The user opens an existing project | Click on "Test1" project to open project screen. |
    | 2. The app displays an "Expense" button which the user clicks | Check button labelled "Expense" is present on screen.<br>Click button labelled "Expense". |
    | 3. The app displays an "Add Expense" button which the user clicks | Check button labelled "Add Expense" is present on screen.<br>Click button labelled "Add Expense". |
    | 4. The app displays an "Add New Expense" form | Check "Add New Expense" form is present on screen. |
    | 5a. The user inputs an empty description | Click "Add Expense" button on form. |
    | 5a1. The app displays an error message prompting the user to input valid values | Check dialog is opened with text: "Please fill all fields correctly". |
    | 5b. The user inputs a non-numeric amount | Input "Test randomAmount" in "Description" text field.<br>Input "NON_INTEGER" in "Amount" text field.<br>Select "Arnav Prasad" in "Paid By" dropdown.<br>Select "Arnav Prasad" in "Split Between" section.<br>Click "Add Expense" button on form. |
    | 5b1. The app displays an error message prompting the user to input valid values | Check dialog is opened with text: "Please fill all fields correctly". |
    | 5c. The user does not select who paid | Input "Test randomAmount" in "Description" text field.<br>Input "randomAmount" in "Amount" text field.<br>Select "Arnav Prasad" in "Split Between" section.<br>Click "Add Expense" button on form. |
    | 5c1. The app displays an error message prompting the user to input valid values | Check dialog is opened with text: "Please fill all fields correctly". |
    | 5d. The user does not select who to split expense between | Input "Test randomAmount" in "Description" text field.<br>Input "randomAmount" in "Amount" text field.<br>Select "Arnav Prasad" in "Paid By" dropdown.<br>Click "Add Expense" button on form. |
    | 5d1. The app displays an error message prompting the user to input valid values | Check dialog is opened with text: "Please fill all fields correctly". |
    | 5. The user inputs valid inputs | Input "Test randomAmount" in "Description" text field.<br>Input "randomAmount" in "Amount" text field.<br>Select "Arnav Prasad" in "Paid By" dropdown.<br>Select "Arnav Prasad" in "Split Between" section. |
    | 6. The user clicks the "Add Expense" button | Click "Add Expense" button on form. |
    | 7. The user can view the new expense | Check the description "Test (randomAmount)" is present on screen.<br>Check the amount "(randomAmount)" is present on screen.<br>Check the paid by user "Arnav Prasad" is present on screen.<br>Check the split between user(s) "Arnav Prasad" is present on the screen. |

  - **Test Logs:**
    ```
    Task :app:connectedDebugAndroidTest
    Starting 1 tests on Pixel_7(AVD) - 13
    Connected to process 21754 on device 'Pixel_7 [emulator-5554]'.

    Pixel_7(AVD) - 13 Tests 0/1 completed. (0 skipped) (0 failed)
    Finished 1 tests on Pixel_7(AVD) - 13

    BUILD SUCCESSFUL in 56s
    72 actionable tasks: 1 executed, 71 up-to-date
    ```
    ![add_expense test execution logs)](\images\add_expense_1.png)
    ![add_expense test execution logs)](\images\add_expense.png)

- **Use Case: Creating/Assigning Project Tasks and Deadlines to Group Members (Use Case 5)**

  - **Expected Behaviors:**
    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | 1. The user opens an existing project | Click on "Test1" project to open project screen. |
    | 2. The app displays a "Task Board" button which the user clicks | Check button labelled "Task Board" is present on screen.<br>Click button labelled "Task Board". |
    | 3. The app displays a "Create Task" button which the user clicks | Check button labelled "Create Task" is present on screen.<br>Click button labelled "Create Task". |
    | 4. The app displays an "Create New Task" form | Check "Create New Task" form is present on screen. |
    | 5a. The user inputs an empty task name | Select "Arnav Prasad" under "Assignee" dropdown.<br>Select "TODAY_DATE" under "Deadline".<br>Select "In progress" under "Status" dropdown.<br>Click "Create" button. |
    | 5a1. The app displays an error message prompting the user to input a non empty task | Check dialog is opened with text: "Task name cannot be empty". |
    | 5b. The user does not select an "Assignee" | Input "Task1" under "Task Name".<br>Select "TODAY_DATE" under "Deadline".<br>Select "In progress" under "Status" dropdown.<br>Click "Create" button. |
    | 5b1. The app displays an error message prompting the user to input a non empty Assignee | Check dialog is opened with text: "Assignee cannot be empty". |
    | 5c. The user selects a date that has already passed | Input "Task1" under "Task Name".<br>Select "Arnav Prasad" under "Assignee" dropdown.<br>Select "In progress" under "Status" dropdown.<br>Select "TODAY_DATE - 1" under "Deadline".<br>Click "Create" button. |
    | 5c1. The app displays an error message prompting the user to input a future date | Check dialog is opened with text: "Please enter a future date". |
    | 5. The user inputs valid inputs | Input "TaskRandomNumber" under "Task Name".<br>Select "Arnav Prasad" under "Assignee" dropdown.<br>Select "In progress" under "Status" dropdown.<br>Select "TODAY_DATE" under "Deadline". |
    | 6. The user clicks the "Create" button | Click "Create" button. |
    | 7. The user can view the new task | Check the Task Name "TaskRandomNumber" is present on screen.<br>Check the Assignee "Arnav Prasad" is present on screen.<br>Check the date "TODAY_DATE" is present on screen.<br>Check the status "In progress" is present on screen. |

  - **Test Logs:**
    ```
    Task :app:connectedDebugAndroidTest
    Starting 1 tests on Pixel_7(AVD) - 13

    Pixel_7(AVD) - 13 Tests 0/1 completed. (0 skipped) (0 failed)
    Pixel_7(AVD) - 13 Tests 1/1 completed. (0 skipped) (0 failed)
    Finished 1 tests on Pixel_7(AVD) - 13

    BUILD SUCCESSFUL in 57s
    72 actionable tasks: 1 executed, 71 up-to-date
    ```
    ![create_task test execution logs2](\images\create_task_1.png)
    ![create_task test execution logs](\images\create_task.png)

---

## 5. Automated Code Review Results

### 5.1. Commit Hash Where Codacy Ran

`[Insert Commit SHA here]`

### 5.2. Unfixed Issues per Codacy Category

_(Placeholder for screenshots of Codacy's Category Breakdown table in Overview)_

### 5.3. Unfixed Issues per Codacy Code Pattern

_(Placeholder for screenshots of Codacy's Issues page)_

### 5.4. Justifications for Unfixed Issues

- **Code Pattern: [Usage of Deprecated Modules](#)**

  1. **Issue**

     - **Location in Git:** [`src/services/chatService.js#L31`](#)
     - **Justification:** ...

  2. ...

- ...
