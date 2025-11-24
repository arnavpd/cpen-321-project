# Testing and Code Review

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
| November 24th, 2025 | 4 Front-end Test Specification | Added steps for how to run tests |
| November 24th, 2025 | 4.2 Tests | Updated test behavior based on new UI |

---

## 2. Back-end Test Specification: APIs

### 2.1. Locations of Back-end Tests and Instructions to Run Them
Create a `.env.test` file under `/backend` and populate it with `JWT_SECRET={secret}`. The secret can be taken from the `/backend/.env` file

**Test Organization:**
- API endpoint tests are located in `backend/tests/api/mocked` and `backend/tests/api/unmocked` for mocked and unmocked tests respectively
- Unit tests and service tests are located in `backend/tests/non-api/mocked` and `backend/tests/non-api/unmocked`
- Non-functional requirement tests are located in `backend/tests/nonfunctional`

**Note:** All test import paths have been updated to work with the new directory structure and all test scripts are fully functional.

Tests can be run with `npm test` within the `/backend` directory
- `git clone`
- `cd ./backend`
- `npm test`
Additional test commands can be found in section `2.1.3`

#### 2.1.1. Tests
| **Interface** | **Describe Group Location, No Mocks** | **Describe Group Location, With Mocks** | **Mocked Components** |
| ----------------------------- | ---------------------------------------------------- | -------------------------------------------------- | ---------------------------------- |
| **GET /api/user/profile** | [`tests/api/unmocked/userProfile.test.ts#L13`](../backend/tests/api/unmocked/userProfile.test.ts#L13) | [`tests/api/mocked/userProfile.test.ts#L18`](../backend/tests/api/mocked/userProfile.test.ts#L18) | User Database Model, JWT Verification |
| **POST /api/user/profile** | [`tests/api/unmocked/updateUserProfile.test.ts#L13`](../backend/tests/api/unmocked/updateUserProfile.test.ts#L13) | [`tests/api/mocked/updateUserProfile.test.ts#L13`](../backend/tests/api/mocked/updateUserProfile.test.ts#L13) | User Database Model, Profile Validation, Authentication Middleware |
| **DELETE /api/user/profile** | [`tests/api/unmocked/deleteUserProfile.test.ts#L13`](../backend/tests/api/unmocked/deleteUserProfile.test.ts#L13) | [`tests/api/mocked/deleteUserProfile.test.ts#L13`](../backend/tests/api/mocked/deleteUserProfile.test.ts#L13) | User Database Model, Media Service, Authentication Middleware |
| **GET /api/user/:userId** | [`tests/api/unmocked/getUserById.test.ts#L13`](../backend/tests/api/unmocked/getUserById.test.ts#L13) | [`tests/api/mocked/getUserById.test.ts#L13`](../backend/tests/api/mocked/getUserById.test.ts#L13) | User Database Model, JWT Authentication, ObjectId Validation |
| **POST /api/auth/signin** | [`tests/api/unmocked/authSignin.test.ts#L11`](../backend/tests/api/unmocked/authSignin.test.ts#L11) | [`tests/api/mocked/authSignin.test.ts#L13`](../backend/tests/api/mocked/authSignin.test.ts#L13) | Google OAuth2 Client, Auth Service, User Database |
| **POST /api/auth/signup** | [`tests/api/unmocked/authSignup.test.ts#L13`](../backend/tests/api/unmocked/authSignup.test.ts#L13) | [`tests/api/mocked/authSignup.test.ts#L13`](../backend/tests/api/mocked/authSignup.test.ts#L13) | Google OAuth2 Client, Auth Service, User Database Model |
| **POST /api/projects** | [`tests/api/unmocked/createProject.test.ts#L13`](../backend/tests/api/unmocked/createProject.test.ts#L13) | [`tests/api/mocked/createProject.test.ts#L14`](../backend/tests/api/mocked/createProject.test.ts#L14) | Project Database Model, User Database Model, Invitation Code Generator |
| **POST /api/projects, GET /api/projects, PUT /api/projects/:projectId** | [`tests/api/unmocked/projectManagement.test.ts#L17`](../backend/tests/api/unmocked/projectManagement.test.ts#L17) | [`tests/api/mocked/projectManagement.test.ts#L147`](../backend/tests/api/mocked/projectManagement.test.ts#L147) | ProjectController Class, Project Database Model, User Authorization, Authentication Middleware |
| **PUT /api/projects/:projectId** | [`tests/api/unmocked/updateProject.test.ts#L13`](../backend/tests/api/unmocked/updateProject.test.ts#L13) | [`tests/api/mocked/updateProject.test.ts#L13`](../backend/tests/api/mocked/updateProject.test.ts#L13) | Project Database Model, Authentication Middleware, Validation Middleware |
| **DELETE /api/projects/:projectId** | [`tests/api/unmocked/deleteProject.test.ts#L16`](../backend/tests/api/unmocked/deleteProject.test.ts#L16) | [`tests/api/mocked/deleteProject.test.ts#L16`](../backend/tests/api/mocked/deleteProject.test.ts#L16) | Project Database Model, User Database Model, Authentication Middleware |
| **POST /api/projects/join** | [`tests/api/unmocked/joinProject.test.ts#L13`](../backend/tests/api/unmocked/joinProject.test.ts#L13) | [`tests/api/mocked/joinProject.test.ts#L13`](../backend/tests/api/mocked/joinProject.test.ts#L13) | Project Database Model, Authentication Middleware, Validation Middleware |
| **DELETE /api/projects/:projectId/members/:userId** | [`tests/api/unmocked/removeMember.test.ts#L16`](../backend/tests/api/unmocked/removeMember.test.ts#L16) | [`tests/api/mocked/removeMember.test.ts#L16`](../backend/tests/api/mocked/removeMember.test.ts#L16) | Project Database Model, User Database Model, Authentication Middleware |
| **POST /api/projects/:projectId/resources** | [`tests/api/unmocked/addResource.test.ts#L13`](../backend/tests/api/unmocked/addResource.test.ts#L13) | [`tests/api/mocked/addResource.test.ts#L13`](../backend/tests/api/mocked/addResource.test.ts#L13) | Project Database Model, Authentication Middleware, Validation Middleware |
| **POST /api/projects/:projectId/tasks** | [`tests/api/unmocked/createTask.test.ts#L14`](../backend/tests/api/unmocked/createTask.test.ts#L14) | [`tests/api/mocked/createTask.test.ts#L16`](../backend/tests/api/mocked/createTask.test.ts#L16) | Task Database Model, User Database Model |
| **GET /api/projects/:projectId/tasks** | [`tests/api/unmocked/taskManagement.test.ts#L13`](../backend/tests/api/unmocked/taskManagement.test.ts#L13) | [`tests/api/mocked/taskManagement.test.ts#L14`](../backend/tests/api/mocked/taskManagement.test.ts#L14) | Task Controller, Auth Middleware, Task Database Model, User Authorization |
| **GET /api/tasks/:taskId** | [`tests/api/unmocked/taskManagement.test.ts#L13`](../backend/tests/api/unmocked/taskManagement.test.ts#L13) | [`tests/api/mocked/taskManagement.test.ts#L14`](../backend/tests/api/mocked/taskManagement.test.ts#L14) | Task Controller, Auth Middleware, Task Database Model, User Authorization |
| **PUT /api/tasks/:taskId** | [`tests/api/unmocked/taskManagement.test.ts#L13`](../backend/tests/api/unmocked/taskManagement.test.ts#L13) | [`tests/api/mocked/taskManagement.test.ts#L14`](../backend/tests/api/mocked/taskManagement.test.ts#L14) | Task Controller, Auth Middleware, Task Database Model, User Authorization |
| **DELETE /api/tasks/:taskId** | [`tests/api/unmocked/taskManagement.test.ts#L13`](../backend/tests/api/unmocked/taskManagement.test.ts#L13) | [`tests/api/mocked/taskManagement.test.ts#L14`](../backend/tests/api/mocked/taskManagement.test.ts#L14) | Task Controller, Auth Middleware, Task Database Model, User Authorization |
| **POST /api/expenses** | [`tests/api/unmocked/createExpense.test.ts#L13`](../backend/tests/api/unmocked/createExpense.test.ts#L13) | [`tests/api/mocked/createExpense.test.ts#L14`](../backend/tests/api/mocked/createExpense.test.ts#L14) | Expense Database Model, Bill Split Calculation |
| **GET /api/expenses/project/:projectId** | [`tests/api/unmocked/expenseOperations.test.ts#L17`](../backend/tests/api/unmocked/expenseOperations.test.ts#L17) | [`tests/api/mocked/expenseOperations.test.ts#L77`](../backend/tests/api/mocked/expenseOperations.test.ts#L77) | Expense Database Model, User Authorization, Project Access Control |
| **DELETE /api/expenses/:expenseId** | [`tests/api/unmocked/expenseOperations.test.ts#L17`](../backend/tests/api/unmocked/expenseOperations.test.ts#L17) | [`tests/api/mocked/expenseOperations.test.ts#L77`](../backend/tests/api/mocked/expenseOperations.test.ts#L77) | Expense Database Model, User Authorization, Project Access Control |
| **POST /api/chat/:projectId/messages** | [`tests/api/unmocked/sendChatMessage.test.ts#L11`](../backend/tests/api/unmocked/sendChatMessage.test.ts#L11) | [`tests/api/mocked/sendChatMessage.test.ts#L11`](../backend/tests/api/mocked/sendChatMessage.test.ts#L11) | Chat Message Database Model, Project Access Control, WebSocket Service |
| **GET /api/chat/:projectId/messages** | [`tests/api/unmocked/getChatMessages.test.ts#L13`](../backend/tests/api/unmocked/getChatMessages.test.ts#L13) | [`tests/api/mocked/getChatMessages.test.ts#L13`](../backend/tests/api/mocked/getChatMessages.test.ts#L13) | Chat Message Database Model, Project Access Control, Message Pagination |
| **DELETE /api/chat/:projectId/messages/:messageId** | [`tests/api/unmocked/deleteChatMessage.test.ts#L13`](../backend/tests/api/unmocked/deleteChatMessage.test.ts#L13) | [`tests/api/mocked/deleteChatMessage.test.ts#L13`](../backend/tests/api/mocked/deleteChatMessage.test.ts#L13) | Chat Message Database Model, User Authorization, Message Ownership Validation |
| **WebSocket /chat** | [`tests/api/unmocked/chatWebSocketService.test.ts#L12`](../backend/tests/api/unmocked/chatWebSocketService.test.ts#L12) | [`tests/non-api/mocked/chatWebSocketService.test.ts#L14`](../backend/tests/non-api/mocked/chatWebSocketService.test.ts#L14) | Socket.IO Server, JWT Authentication Middleware, WebSocket Broadcasting, Project Room Management |
| **POST /api/media/upload** | [`tests/api/unmocked/uploadImage.test.ts#L11`](../backend/tests/api/unmocked/uploadImage.test.ts#L11) | [`tests/api/mocked/uploadImage.test.ts#L16`](../backend/tests/api/mocked/uploadImage.test.ts#L16) | Media Service, File System Operations, Multer File Handling |
| **GET /api/calendar/status** | [`tests/api/unmocked/calendar.test.ts#L16`](../backend/tests/api/unmocked/calendar.test.ts#L16) | [`tests/api/mocked/calendar.test.ts#L77`](../backend/tests/api/mocked/calendar.test.ts#L77) | Calendar Controller, User Database Model, Google OAuth Service |
| **GET /api/calendar/oauth/authorize** | [`tests/api/unmocked/calendarAuthorize.test.ts#L16`](../backend/tests/api/unmocked/calendarAuthorize.test.ts#L16) | [`tests/api/mocked/calendarAuthorize.test.ts#L16`](../backend/tests/api/mocked/calendarAuthorize.test.ts#L16) | Calendar Service, Authentication Middleware, OAuth URL Generation |
| **POST /api/calendar/enable** | [`tests/api/unmocked/calendarEnable.test.ts#L13`](../backend/tests/api/unmocked/calendarEnable.test.ts#L13) | [`tests/api/mocked/calendarEnable.test.ts#L13`](../backend/tests/api/mocked/calendarEnable.test.ts#L13) | User Database Model, Authentication Middleware, Calendar Service |
| **POST /api/calendar/disable** | [`tests/api/unmocked/calendarDisable.test.ts#L13`](../backend/tests/api/unmocked/calendarDisable.test.ts#L13) | [`tests/api/mocked/calendarDisable.test.ts#L13`](../backend/tests/api/mocked/calendarDisable.test.ts#L13) | User Database Model, Authentication Middleware |
| **POST /api/calendar/disconnect** | [`tests/api/unmocked/calendarDisconnect.test.ts#L13`](../backend/tests/api/unmocked/calendarDisconnect.test.ts#L13) | [`tests/api/mocked/calendarDisconnect.test.ts#L13`](../backend/tests/api/mocked/calendarDisconnect.test.ts#L13) | User Database Model, Calendar Service, Authentication Middleware |



#### 2.1.2. Commit Hash Where Tests Run

`30fc6c4738ccfd3c793189c42fdadc8c9d951840`

#### 2.1.3. How to Run the Tests

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/justinishiguro/cpen-321-project.git
   cd cpen-321-project/backend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   - Create a `.env` file in the backend directory
   - Add required environment variables (JWT_SECRET, MongoDB connection string, etc.)

4. **Run All Tests**:
   ```bash
   npm run test
   ```

5. **Run Tests Without Mocks Only (API Tests)**:
   ```bash
   npm run test:api:unmocked
   ```

6. **Run Tests With Mocks Only (API Tests)**:
   ```bash
   npm run test:api:mocked
   ```

7. **Run All API Tests**:
   ```bash
   npm run test:api
   ```

8. **Run Unit/Service Tests (Non-API)**:
   ```bash
   npm run test:non-api
   ```

9. **Run Non-Functional Requirement Tests Only**:
   ```bash
   npm run test:nonfunctional
   ```

10. **Run Tests with Coverage Report**:
   ```bash
   npm run test:coverage
   ```

### 2.2. GitHub Actions Configuration Location

`~/.github/workflows/main.yml`

### 2.3. Jest Coverage Report Screenshots for Tests Without Mocking

  ![unmocked](./images/jest_unmocked.png)


### 2.4. Jest Coverage Report Screenshots for Tests With Mocking

  ![mocked](./images/jest_mocked.png)

### 2.5. Jest Coverage Report Screenshots for Both Tests With and Without Mocking

  ![both](./images/jest_both.png)

---

## 3. Back-end Test Specification: Tests of Non-Functional Requirements

### 3.1. Test Locations in Git

| **Non-Functional Requirement**  | **Location in Git**                              |
| ------------------------------- | ------------------------------------------------ |
| **Performance (Response Time)** | [`tests/nonfunctional/response_time.test.ts`](../backend/tests/nonfunctional/response_time.test.ts) |
| **Data Security & Authorization** | [`tests/nonfunctional/data_security.test.ts`](../backend/tests/nonfunctional/data_security.test.ts) |
| **Real-time Communication (WebSocket)** | [`tests/non-api/mocked/chatWebSocketService.test.ts`](../backend/tests/non-api/mocked/chatWebSocketService.test.ts) & [`tests/api/unmocked/chatWebSocketService.test.ts`](../backend/tests/api/unmocked/chatWebSocketService.test.ts) |

### 3.2. Test Verification and Logs

- **Performance (Response Time)**

  - **Verification:** This test suite measures API response times to ensure acceptable performance under normal operating conditions. It includes three main test scenarios: (1) Health check endpoint should respond within 200ms, (2) Multiple concurrent requests should complete within 1000ms total, and (3) Sequential requests should maintain consistent performance with each request under 500ms. The tests use Jest with supertest to measure actual response times and validate that the system meets performance requirements for good user experience.
  - **Test Cases:**
    - `should respond to health check within 200ms`: Tests basic endpoint responsiveness
    - `should handle multiple concurrent requests within acceptable time`: Tests system performance under concurrent load (5 simultaneous requests)
    - `should maintain performance under sequential load`: Tests consistent performance over 10 sequential requests
  - **Performance Thresholds:**
    - Individual request: < 500ms
    - Concurrent batch (5 requests): < 1000ms total
    - Health check: < 200ms
    - Average sequential performance: < 200ms
  - **Log Output Example**
    ```
    ⏱️  Testing health check endpoint response time...
    📊 Response time: 45ms
    ⏱️  Testing concurrent request performance...
    📊 Total time for 5 requests: 234ms
    📊 Average time per request: 46.8ms
    ⏱️  Testing sequential request performance...
    📊 Average response time across 10 requests: 52ms
    📊 Maximum response time: 78ms
    ```

- **Data Security & Authorization**

  - **Verification:** This test suite validates that users can only access data they are authorized to view, ensuring proper data isolation and privacy protection. It tests three main security areas: (1) Chat message access control - users cannot read messages from projects they're not members of, (2) Project access security - users cannot see projects they don't have access to, and (3) Token security validation - invalid tokens are properly rejected and token validation performs efficiently under load.
  - **Test Cases:**
    - `should deny access to chat messages from unauthorized project`: Tests data isolation between user groups
    - `should allow access to chat messages for authorized project member`: Validates legitimate access works correctly
    - `should prevent unauthorized users from sending messages to private projects`: Tests write access control
    - `should deny unauthorized access to project information`: Tests project-level data privacy
    - `should allow authorized access to own project information`: Validates authorized project access
    - `should reject requests with invalid JWT tokens`: Tests token validation security
    - `should reject requests without authentication tokens`: Tests missing token handling
    - `should validate token performance under load`: Tests authentication performance under repeated requests
  - **Security Thresholds:**
    - Access denial response time: < 500ms
    - Token validation time: < 100ms per request
    - Average token validation performance: < 50ms
    - All unauthorized access attempts: Must return 401/403 status codes

---

## 4. Front-end Test Specification
**Front-end Test Prerequisites:**
1. Create a new device (Pixel 7 - Android 13.0 "Tiramisu")
2. Ensure that a user was previously signed into the app with Google (the tests click the first email after clicking "Sign In With Google"
3. Ensure that a project named "Test1" was previously created (this project name is utilized in tests)
4. Ensure that your "Name" under "Manage Profile" is "Test User" (this name is utilized in tests)

**How To Run Front-end Tests:**
1. Open the repository in Android Studio
2. Run the (Pixel 7 - Android 13.0 "Tiramisu") device you created
3. Open the [MyComposeTest.kt](https://github.com/arnavpd/cpen-321-project/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/MyComposeTest.kt) file in Android Studio and click "Run" on each test individually
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
    | 5a. The user enters an invalid email address | Check "Invite User" input is present on screen.<br>Input "invalid" under "Invite User".<br>Check button labelled "Add" is present on screen.<br>Click button labelled "Add". |
    | 6a1. The app displays an error message prompting the user to input a valid email address | Check dialog is opened with text: "Invalid email format". |
    | 6. The user enters the email addresses of other users they want to invite to the project | Check "Invite User" input is present on screen.<br>Input "test@gmail.com" under "Invite User". |
    | 7. The user clicks the "Add" button | Check button labelled "Add" is present on screen.<br>Click button labelled "Add". |
    | 8. The user sees the new project created on the home page | Check project "ProjectRandomNumber" is visible on the screen |
    | 9. The user clicks on the created project | Click button labelled "ProjectRandomNumber". |
    | 10. The user clicks on the Settings button | Check the button labelled "Settings" is visible<br>Click button labelled "Settings". |
    | 11. The user clicks on the Delete button | Check the button labelled "Delete" is visible<br>Click button labelled "Delete". |
    | 12. The user does not see the project on the home page | Check project "ProjectRandomNumber" is not visible on the screen |

  - **Test Logs:**
    ```
    Task :app:connectedDebugAndroidTest
    Starting 1 tests on Pixel_7(AVD) - 13
   
    Pixel_7(AVD) - 13 Tests 0/1 completed. (0 skipped) (0 failed)
    Pixel_7(AVD) - 13 Tests 1/1 completed. (0 skipped) (0 failed)
    Finished 1 tests on Pixel_7(AVD) - 13
   
    BUILD SUCCESSFUL in 2m 13s
    72 actionable tasks: 1 executed, 71 up-to-date
    ```
    ![create_project](./images/create_project_new.png)
    ![invitation failed](./images/invite_failed_new.png)


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
    ![add_expense test execution logs)](./images/add_expense_1.png)
    ![add_expense test execution logs)](./images/add_expense.png)

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
    ![create_task test execution logs2](./images/create_task_1.png)
    ![create_task test execution logs](./images/create_task.png)

---

## 5. Automated Code Review Results

### 5.1. Commit Hash Where Codacy Ran

`18d5b90ab464e7737273a77360d61c5ebfe8f45c`

### 5.2. Unfixed Issues per Codacy Category

   ![codacy no issues](./images/codacy_no_issues.png)

### 5.3. Unfixed Issues per Codacy Code Pattern


 Not applicable as there are no Codacy issues (see above image).

### 5.4. Justifications for Unfixed Issues
 Not applicable as there are no Codacy issues (see above image).
