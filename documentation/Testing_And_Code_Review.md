# Testing and Code Review

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
| _Nothing to show_ |

---

## 2. Back-end Test Specification: APIs

### 2.1. Locations of Back-end Tests and Instructions to Run Them
Create a `.env.test` file under `/backend` and populate it with `JWT_SECRET={secret}`. The secret can be taken from the `/backend/.env` file
Tests are Located in the `backend/tests/mocked` and `backend/tests/unmocked` for the mocked and unmocked tests respectively
tests can be ran with `npm test` within the `/backend` directory
#### 2.1.1. Tests

| **Interface**                 | **Describe Group Location, No Mocks**                | **Describe Group Location, With Mocks**            | **Mocked Components**              |
| ----------------------------- | ---------------------------------------------------- | -------------------------------------------------- | ---------------------------------- |
| **GET /api/user/profile**     | [`tests/unmocked/userProfile.test.ts#L11`](../backend/tests/unmocked/userProfile.test.ts#L11) | [`tests/mocked/userProfile.test.ts#L18`](../backend/tests/mocked/userProfile.test.ts#L18) | User Database Model, JWT Verification |
| **POST /api/user/profile**    | [`tests/unmocked/updateUserProfile.test.ts#L11`](../backend/tests/unmocked/updateUserProfile.test.ts#L11) | [`tests/mocked/updateUserProfile.test.ts#L11`](../backend/tests/mocked/updateUserProfile.test.ts#L11) | User Database Model, Profile Validation, Authentication Middleware |
| DELETE | /api/user/profile | [Link](tests/mocked/deleteUserProfile.test.ts) | [Link](tests/unmocked/deleteUserProfile.test.ts) | User Database Model, Media Service, Authentication Middleware |
| DELETE | /api/projects/:projectId | [Link](tests/mocked/deleteProject.test.ts) | [Link](tests/unmocked/deleteProject.test.ts) | Project Database Model, User Database Model, Authentication Middleware |
| POST | /api/projects/join | [Link](tests/mocked/joinProject.test.ts) | [Link](tests/unmocked/joinProject.test.ts) | Project Database Model, Authentication Middleware, Validation Middleware |
| DELETE | /api/projects/:projectId/members/:userId | [Link](tests/mocked/removeMember.test.ts) | [Link](tests/unmocked/removeMember.test.ts) | Project Database Model, User Database Model, Authentication Middleware |
| PUT | /api/projects/:projectId | [Link](tests/mocked/updateProject.test.ts) | [Link](tests/unmocked/updateProject.test.ts) | Project Database Model, Authentication Middleware, Validation Middleware |
| POST | /api/projects/:projectId/resources | [Link](tests/mocked/addResource.test.ts) | [Link](tests/unmocked/addResource.test.ts) | Project Database Model, Authentication Middleware, Validation Middleware |
| **GET /api/user/:userId**     | [`tests/unmocked/getUserById.test.ts#L11`](../backend/tests/unmocked/getUserById.test.ts#L11) | [`tests/mocked/getUserById.test.ts#L11`](../backend/tests/mocked/getUserById.test.ts#L11) | User Database Model, JWT Authentication, ObjectId Validation |
| **POST /api/auth/signin**     | [`tests/unmocked/authSignin.test.ts#L9`](../backend/tests/unmocked/authSignin.test.ts#L9) | [`tests/mocked/authSignin.test.ts#L11`](../backend/tests/mocked/authSignin.test.ts#L11) | Google OAuth2 Client, Auth Service, User Database |
| **POST /api/auth/signup**     | [`tests/unmocked/authSignup.test.ts#L11`](../backend/tests/unmocked/authSignup.test.ts#L11) | [`tests/mocked/authSignup.test.ts#L11`](../backend/tests/mocked/authSignup.test.ts#L11) | Google OAuth2 Client, Auth Service, User Database Model |
| **POST /api/projects**        | [`tests/unmocked/createProject.test.ts#L11`](../backend/tests/unmocked/createProject.test.ts#L11) | [`tests/mocked/createProject.test.ts#L12`](../backend/tests/mocked/createProject.test.ts#L12) | Project Database Model, User Database Model, Invitation Code Generator |
| **POST /api/projects/:projectId/tasks** | [`tests/unmocked/createTask.test.ts#L12`](../backend/tests/unmocked/createTask.test.ts#L12) | [`tests/mocked/createTask.test.ts#L14`](../backend/tests/mocked/createTask.test.ts#L14) | Task Database Model, User Database Model |
| **POST /api/expenses**        | [`tests/unmocked/createExpense.test.ts#L11`](../backend/tests/unmocked/createExpense.test.ts#L11) | [`tests/mocked/createExpense.test.ts#L12`](../backend/tests/mocked/createExpense.test.ts#L12) | Expense Database Model, Bill Split Calculation |
| **GET /api/expenses/project/:projectId & DELETE /api/expenses/:expenseId** | [`tests/unmocked/expenseOperations.test.ts#L15`](../backend/tests/unmocked/expenseOperations.test.ts#L15) | [`tests/mocked/expenseOperations.test.ts#L75`](../backend/tests/mocked/expenseOperations.test.ts#L75) | Expense Database Model, User Authorization, Project Access Control |
| **GET /api/projects/:projectId/tasks, GET /api/tasks/:taskId, PUT /api/tasks/:taskId, DELETE /api/tasks/:taskId, GET /api/tasks/debug/*** | [`tests/unmocked/taskManagement.test.ts#L11`](../backend/tests/unmocked/taskManagement.test.ts#L11) | [`tests/mocked/taskManagement.test.ts#L12`](../backend/tests/mocked/taskManagement.test.ts#L12) | Task Controller, Auth Middleware, Task Database Model, User Authorization |
| **POST /api/chat/:projectId/messages** | [`tests/unmocked/sendChatMessage.test.ts#L9`](../backend/tests/unmocked/sendChatMessage.test.ts#L9) | [`tests/mocked/sendChatMessage.test.ts#L9`](../backend/tests/mocked/sendChatMessage.test.ts#L9) | Chat Message Database Model, Project Access Control, WebSocket Service |
| **GET /api/chat/:projectId/messages** | [`tests/unmocked/getChatMessages.test.ts#L11`](../backend/tests/unmocked/getChatMessages.test.ts#L11) | [`tests/mocked/getChatMessages.test.ts#L11`](../backend/tests/mocked/getChatMessages.test.ts#L11) | Chat Message Database Model, Project Access Control, Message Pagination |
| **DELETE /api/chat/:projectId/messages/:messageId** | [`tests/unmocked/deleteChatMessage.test.ts#L11`](../backend/tests/unmocked/deleteChatMessage.test.ts#L11) | [`tests/mocked/deleteChatMessage.test.ts#L11`](../backend/tests/mocked/deleteChatMessage.test.ts#L11) | Chat Message Database Model, User Authorization, Message Ownership Validation |
| **Chat WebSocket Service** | [`tests/unmocked/chatWebSocketService.test.ts#L10`](../backend/tests/unmocked/chatWebSocketService.test.ts#L10) | [`tests/mocked/chatWebSocketService.test.ts#L12`](../backend/tests/mocked/chatWebSocketService.test.ts#L12) | Socket.IO Server, JWT Authentication Middleware, WebSocket Broadcasting, Project Room Management |
| **POST /api/media/upload**     | [`tests/unmocked/uploadImage.test.ts#L9`](../backend/tests/unmocked/uploadImage.test.ts#L9) | [`tests/mocked/uploadImage.test.ts#L14`](../backend/tests/mocked/uploadImage.test.ts#L14) | Media Service, File System Operations, Multer File Handling |
| **GET /api/calendar/status & POST /api/calendar/***     | [`tests/unmocked/calendar.test.ts#L14`](../backend/tests/unmocked/calendar.test.ts#L14) | [`tests/mocked/calendar.test.ts#L75`](../backend/tests/mocked/calendar.test.ts#L75) | Calendar Controller, User Database Model, Google OAuth Service |
| GET | /api/calendar/oauth/authorize | [Link](tests/mocked/calendarAuthorize.test.ts) | [Link](tests/unmocked/calendarAuthorize.test.ts) | Calendar Service, Authentication Middleware, OAuth URL Generation |
| POST | /api/calendar/enable | [Link](tests/mocked/calendarEnable.test.ts) | [Link](tests/unmocked/calendarEnable.test.ts) | User Database Model, Authentication Middleware, Calendar Service |
| POST | /api/calendar/disable | [Link](tests/mocked/calendarDisable.test.ts) | [Link](tests/unmocked/calendarDisable.test.ts) | User Database Model, Authentication Middleware |
| POST | /api/calendar/disconnect | [Link](tests/mocked/calendarDisconnect.test.ts) | [Link](tests/unmocked/calendarDisconnect.test.ts) | User Database Model, Calendar Service, Authentication Middleware |
| **Project Management Operations (POST /api/projects, GET /api/projects, PUT /api/projects/:projectId)** | [`tests/unmocked/projectManagement.test.ts#L15`](../backend/tests/unmocked/projectManagement.test.ts#L15) | [`tests/mocked/projectManagement.test.ts#L145`](../backend/tests/mocked/projectManagement.test.ts#L145) | ProjectController Class, Project Database Model, User Authorization, Authentication Middleware |
| **POST /user/login**          | [`tests/unmocked/authenticationLogin.test.js#L1`](#) | [`tests/mocked/authenticationLogin.test.js#L1`](#) | Google Authentication API, User DB |
| **POST /study-groups/create** | ...                                                  | ...                                                | Study Group DB                     |
| ...                           | ...                                                  | ...                                                | ...                                |

#### 2.1.2. Commit Hash Where Tests Run

`[Insert Commit SHA here]`

#### 2.1.3. Explanation on How to Run the Tests

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

5. **Run Tests Without Mocks Only**:
   ```bash
   npm run test:unmocked
   ```

6. **Run Tests With Mocks Only**:
   ```bash
   npm run test:mocked
   ```

7. **Run Non-Functional Requirement Tests Only**:
   ```bash
   npm run test:nonfunctional
   ```

8. **Run Tests with Coverage Report**:
   ```bash
   npm run test:coverage
   ```

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
| **Performance (Response Time)** | [`tests/nonfunctional/response_time.test.ts`](../backend/tests/nonfunctional/response_time.test.ts) |
| **Data Security & Authorization** | [`tests/nonfunctional/data_security.test.ts`](../backend/tests/nonfunctional/data_security.test.ts) |
| **Real-time Communication (WebSocket)** | [`tests/mocked/chatWebSocketService.test.ts`](../backend/tests/mocked/chatWebSocketService.test.ts) & [`tests/unmocked/chatWebSocketService.test.ts`](../backend/tests/unmocked/chatWebSocketService.test.ts) |

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

### 4.1. Location in Git of Front-end Test Suite:

`frontend/src/androidTest/java/com/studygroupfinder/`

### 4.2. Tests

- **Use Case: Login**

  - **Expected Behaviors:**
    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | 1. The user opens "Add Todo Items" screen. | Open "Add Todo Items" screen. |
    | 2. The app shows an input text field and an "Add" button. The add button is disabled. | Check that the text field is present on screen.<br>Check that the button labelled "Add" is present on screen.<br>Check that the "Add" button is disabled. |
    | 3a. The user inputs an ill-formatted string. | Input "_^_^^OQ#$" in the text field. |
    | 3a1. The app displays an error message prompting the user for the expected format. | Check that a dialog is opened with the text: "Please use only alphanumeric characters ". |
    | 3. The user inputs a new item for the list and the add button becomes enabled. | Input "buy milk" in the text field.<br>Check that the button labelled "add" is enabled. |
    | 4. The user presses the "Add" button. | Click the button labelled "add ". |
    | 5. The screen refreshes and the new item is at the bottom of the todo list. | Check that a text box with the text "buy milk" is present on screen.<br>Input "buy chocolate" in the text field.<br>Click the button labelled "add".<br>Check that two text boxes are present on the screen with "buy milk" on top and "buy chocolate" at the bottom. |
    | 5a. The list exceeds the maximum todo-list size. | Repeat steps 3 to 5 ten times.<br>Check that a dialog is opened with the text: "You have too many items, try completing one first". |

  - **Test Logs:**
    ```
    [Placeholder for Espresso test execution logs]
    ```

- **Use Case: ...**

  - **Expected Behaviors:**

    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | ...                | ...                 |

  - **Test Logs:**
    ```
    [Placeholder for Espresso test execution logs]
    ```

- **...**

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
