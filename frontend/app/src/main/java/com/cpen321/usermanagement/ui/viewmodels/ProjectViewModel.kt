package com.cpen321.usermanagement.ui.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.dto.ChatMessage
import com.cpen321.usermanagement.data.remote.dto.Project
import com.cpen321.usermanagement.data.repository.ExpenseRepository
import com.cpen321.usermanagement.data.repository.ProjectRepository
import com.cpen321.usermanagement.data.remote.websocket.ChatWebSocketService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import com.cpen321.usermanagement.data.remote.dto.Task
import com.cpen321.usermanagement.data.repository.TaskRepository
import com.cpen321.usermanagement.data.repository.AuthRepository


data class ProjectUiState(
    // Loading states
    val isLoading: Boolean = false,
    val isCreating: Boolean = false,
    val isUpdating: Boolean = false,
    val isDeleting: Boolean = false,
    val isSending: Boolean = false,
    val isLoadingMessages: Boolean = false,

    // Data states
    val projects: List<Project> = emptyList(),
    val selectedProject: Project? = null,
    val messages: List<ChatMessage> = emptyList(),

    // Message states
    val message: String? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class ProjectViewModel @Inject constructor(
    private val projectRepository: ProjectRepository,
    private val expenseRepository: ExpenseRepository,
    private val taskRepository: TaskRepository,
    private val chatWebSocketService: ChatWebSocketService,
    private val authRepository: AuthRepository
) : ViewModel() {

    companion object {
        private const val TAG = "ProjectViewModel"
    }

    private val _uiState = MutableStateFlow(ProjectUiState())
    val uiState: StateFlow<ProjectUiState> = _uiState.asStateFlow()

    private var isCreatingProject = false
    private var isJoiningProject = false
    private var isLoadingTasks = false
    private var isCreatingTask = false

    init {
        loadUserProjects()
    }

    // Store tasks per project ID
    private val _tasksByProject = MutableStateFlow<Map<String, List<Task>>>(emptyMap())
    val tasksByProject: StateFlow<Map<String, List<Task>>> = _tasksByProject

    // Get tasks for current project
    fun getTasksForProject(projectId: String): List<Task> {
        Log.d(TAG, "=== getTasksForProject called ===")
        Log.d(TAG, "Requested projectId: $projectId")
        Log.d(TAG, "Current _tasksByProject state: ${_tasksByProject.value}")
        Log.d(TAG, "Keys in _tasksByProject: ${_tasksByProject.value.keys}")
        
        val tasks = _tasksByProject.value[projectId] ?: emptyList()
        Log.d(TAG, "getTasksForProject($projectId): returning ${tasks.size} tasks")
        
        if (tasks.isEmpty()) {
            Log.d(TAG, "No tasks found for project $projectId")
            Log.d(TAG, "Available projects with tasks:")
            _tasksByProject.value.forEach { (storedProjectId, storedTasks) ->
                Log.d(TAG, "  Project $storedProjectId: ${storedTasks.size} tasks")
                storedTasks.forEach { task ->
                    Log.d(TAG, "    Task: ${task.id} - ${task.title} (projectId: ${task.projectId})")
                }
            }
        } else {
            tasks.forEach { task ->
                Log.d(TAG, "Task: ${task.id} - ${task.title} (projectId: ${task.projectId})")
                Log.d(TAG, "Task projectId matches requested projectId: ${task.projectId == projectId}")
            }
        }
        Log.d(TAG, "=== getTasksForProject completed ===")
        return tasks
    }

    fun clearTasks() {
        Log.d(TAG, "Clearing all tasks")
        _tasksByProject.value = emptyMap()
    }

    fun clearTasksForProject(projectId: String) {
        Log.d(TAG, "Clearing tasks for project: $projectId")
        val currentTasks = _tasksByProject.value.toMutableMap()
        currentTasks.remove(projectId)
        _tasksByProject.value = currentTasks
    }

    fun loadProjectTasks(projectId: String) {
        // Prevent multiple simultaneous calls
        if (isLoadingTasks) {
            Log.d(TAG, "loadProjectTasks already in progress, ignoring duplicate call for project: $projectId")
            return
        }
        
        Log.d(TAG, "=== STARTING LOAD PROJECT TASKS ===")
        Log.d(TAG, "Loading tasks for project: $projectId")
        Log.d(TAG, "Project ID type: ${projectId::class.java.simpleName}")
        Log.d(TAG, "Project ID length: ${projectId.length}")
        Log.d(TAG, "isLoadingTasks flag: $isLoadingTasks")
        viewModelScope.launch {
            isLoadingTasks = true
            Log.d(TAG, "Set isLoadingTasks to true")
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                Log.d(TAG, "About to call taskRepository.getProjectTasks($projectId)")
                val tasks = taskRepository.getProjectTasks(projectId)
                val currentTasks = _tasksByProject.value.toMutableMap()
                
                Log.d(TAG, "loadProjectTasks($projectId): received ${tasks.size} tasks from server")
                Log.d(TAG, "Current local tasks for project $projectId: ${currentTasks[projectId]?.size ?: 0}")
                
                tasks.forEach { task ->
                    Log.d(TAG, "Server task: ${task.id} - ${task.title} (projectId: ${task.projectId})")
                    Log.d(TAG, "Task belongs to project: ${task.projectId}, Loading for project: $projectId")
                }
                
                // Clear existing tasks for this project first to prevent duplicates
                currentTasks.remove(projectId)
                Log.d(TAG, "Cleared existing tasks for project: $projectId")
                
                // Then add the fresh tasks from server
                currentTasks[projectId] = tasks
                _tasksByProject.value = currentTasks

                Log.d(TAG, "Replaced local tasks with ${tasks.size} server tasks for project: $projectId")
                Log.d(TAG, "Updated _tasksByProject state: ${_tasksByProject.value}")
                Log.d(TAG, "Current tasksByProject keys: ${_tasksByProject.value.keys}")
                Log.d(TAG, "Tasks stored for each project:")
                _tasksByProject.value.forEach { (storedProjectId, storedTasks) ->
                    Log.d(TAG, "  Project $storedProjectId: ${storedTasks.size} tasks")
                    storedTasks.forEach { task ->
                        Log.d(TAG, "    Task: ${task.id} - ${task.title} (projectId: ${task.projectId})")
                    }
                }
                
                // Verify the tasks are stored correctly
                val storedTasks = _tasksByProject.value[projectId]
                Log.d(TAG, "Verification: Stored tasks for project $projectId: ${storedTasks?.size ?: 0}")
                storedTasks?.forEach { task ->
                    Log.d(TAG, "  Stored task: ${task.id} - ${task.title} (projectId: ${task.projectId})")
                }
                _uiState.value = _uiState.value.copy(isLoading = false)
                Log.d(TAG, "=== LOAD PROJECT TASKS COMPLETED ===")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load tasks", e)
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = "Failed to load tasks: ${e.message}")
                Log.d(TAG, "=== LOAD PROJECT TASKS FAILED ===")
            } finally {
                isLoadingTasks = false
                Log.d(TAG, "Reset isLoadingTasks to false")
                Log.d(TAG, "=== LOAD PROJECT TASKS FINALLY BLOCK ===")
            }
        }
    }

    fun createTask(
        projectId: String,
        name: String,
        assignee: String,
        status: String,
        deadline: String?
    ) {
        if (name.isBlank()) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Task name cannot be empty"
            )
            return
        }

        if (assignee.isBlank()) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Assignee cannot be empty"
            )
            return
        }

        // Validate deadline if provided
        deadline?.let {
            if (it.isNotBlank()) {
                try {
                    val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
                    val deadlineDate = dateFormat.parse(it)
                    val today = java.util.Calendar.getInstance()
                    today.set(java.util.Calendar.HOUR_OF_DAY, 0)
                    today.set(java.util.Calendar.MINUTE, 0)
                    today.set(java.util.Calendar.SECOND, 0)
                    today.set(java.util.Calendar.MILLISECOND, 0)
                    
                    val deadlineCalendar = java.util.Calendar.getInstance()
                    deadlineDate?.let { date ->
                        deadlineCalendar.time = date
                        deadlineCalendar.set(java.util.Calendar.HOUR_OF_DAY, 0)
                        deadlineCalendar.set(java.util.Calendar.MINUTE, 0)
                        deadlineCalendar.set(java.util.Calendar.SECOND, 0)
                        deadlineCalendar.set(java.util.Calendar.MILLISECOND, 0)
                        
                        if (deadlineCalendar.timeInMillis < today.timeInMillis) {
                            _uiState.value = _uiState.value.copy(
                                errorMessage = "Please enter a future date"
                            )
                            return
                        }
                    }
                } catch (e: Exception) {
                    // If date parsing fails, allow it to pass (backend will handle it)
                    Log.e(TAG, "Error parsing deadline date: $it", e)
                }
            }
        }

        // Prevent multiple simultaneous task creation calls
        if (isCreatingTask) {
            Log.d(TAG, "Task creation already in progress, ignoring duplicate call")
            return
        }

        Log.d(TAG, "=== STARTING TASK CREATION ===")
        Log.d(TAG, "Creating task: $name for project: $projectId")
        Log.d(TAG, "Project ID type: ${projectId::class.java.simpleName}")
        Log.d(TAG, "Project ID length: ${projectId.length}")
        Log.d(TAG, "isCreatingTask flag: $isCreatingTask")
        
        // Set the flag immediately to prevent race conditions
        isCreatingTask = true
        Log.d(TAG, "Set isCreatingTask to true")
        
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCreating = true, errorMessage = null)

            try {
                val task = taskRepository.createTask(projectId, name.trim(), assignee.trim(), status, deadline)
                Log.d(TAG, "Task created successfully: ${task.id}")

                // Validate that the created task belongs to the correct project
                if (task.projectId != projectId) {
                    Log.e(TAG, "ERROR: Created task belongs to project ${task.projectId} but was created for project $projectId")
                    _uiState.value = _uiState.value.copy(
                        isCreating = false,
                        errorMessage = "Task creation failed: Project ID mismatch"
                    )
                    return@launch
                }

                // Reload tasks from server to ensure consistency and prevent duplicates
                // This ensures we have the latest state from the server
                Log.d(TAG, "createTask: Task ${task.id} (${task.title}) created successfully for project $projectId")
                Log.d(TAG, "Task projectId from server: ${task.projectId}")
                
                // Reload tasks from server to get the complete, up-to-date list
                loadProjectTasks(projectId)

                _uiState.value = _uiState.value.copy(
                    isCreating = false,
                    message = "Task created successfully"
                )

                Log.d(TAG, "Task created successfully, reloading from server")
                Log.d(TAG, "=== TASK CREATION COMPLETED ===")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to create task", e)
                _uiState.value = _uiState.value.copy(
                    isCreating = false,
                    errorMessage = "Failed to create task: ${e.message}"
                )
                Log.d(TAG, "=== TASK CREATION FAILED ===")
            } finally {
                isCreatingTask = false
                Log.d(TAG, "Reset isCreatingTask to false")
                Log.d(TAG, "=== TASK CREATION FINALLY BLOCK ===")
            }
        }
    }
    fun loadUserProjects() {
        Log.d(TAG, "Loading user projects...")
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            projectRepository.getUserProjects()
                .onSuccess { projects ->
                    Log.d(TAG, "Successfully loaded ${projects.size} projects: ${projects.map { it.name }}")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        projects = projects,
                        message = "Projects loaded successfully"
                    )
                }
                .onFailure { error ->
                    Log.e(TAG, "Failed to load projects", error)
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Failed to load projects"
                    )
                }
        }
    }

    fun createProject(name: String, description: String? = null) {
        if (name.isBlank()) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Project name cannot be empty"
            )
            return
        }

        // Prevent duplicate calls with both state and flag
        if (_uiState.value.isCreating || isCreatingProject) {
            Log.w(TAG, "Project creation already in progress, ignoring duplicate call")
            return
        }

        Log.d(TAG, "Creating project: $name")
        isCreatingProject = true
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCreating = true, errorMessage = null)

            projectRepository.createProject(name.trim(), description?.trim())
                .onSuccess { project ->
                    Log.d(TAG, "Project created successfully: ${project.id}")
                    // Add project to local state immediately for instant UI update
                    val currentProjects = _uiState.value.projects
                    val updatedProjects = listOf(project) + currentProjects
                    Log.d(TAG, "Updated projects list: ${updatedProjects.map { it.name }}")

                    // Force state update with explicit copy
                    val newState = _uiState.value.copy(
                        isCreating = false,
                        projects = updatedProjects,
                        message = "Project created successfully"
                    )
                    _uiState.value = newState
                    isCreatingProject = false

                    Log.d(TAG, "State updated - projects count: ${_uiState.value.projects.size}")
                }
                .onFailure { error ->
                    Log.e(TAG, "Failed to create project", error)
                    _uiState.value = _uiState.value.copy(
                        isCreating = false,
                        errorMessage = error.message ?: "Failed to create project"
                    )
                    isCreatingProject = false
                }
        }
    }

    fun joinProject(invitationCode: String) {
        if (invitationCode.isBlank()) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Invitation code cannot be empty"
            )
            return
        }

        // Prevent duplicate calls
        if (_uiState.value.isCreating || isJoiningProject) {
            Log.w(TAG, "Project join already in progress, ignoring duplicate call")
            return
        }

        Log.d(TAG, "Joining project with code: $invitationCode")
        isJoiningProject = true
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCreating = true, errorMessage = null)

            projectRepository.joinProject(invitationCode.trim())
                .onSuccess { project ->
                    Log.d(TAG, "Successfully joined project: ${project.id}")
                    // Add project to local state immediately for instant UI update
                    val currentProjects = _uiState.value.projects
                    val updatedProjects = listOf(project) + currentProjects
                    Log.d(TAG, "Updated projects list: ${updatedProjects.map { it.name }}")

                    // Force state update with explicit copy
                    val newState = _uiState.value.copy(
                        isCreating = false,
                        projects = updatedProjects,
                        message = "Successfully joined project"
                    )
                    _uiState.value = newState
                    isJoiningProject = false

                    Log.d(TAG, "State updated - projects count: ${_uiState.value.projects.size}")
                }
                .onFailure { error ->
                    Log.e(TAG, "Failed to join project", error)
                    _uiState.value = _uiState.value.copy(
                        isCreating = false,
                        errorMessage = error.message ?: "Failed to join project"
                    )
                    isJoiningProject = false
                }
        }
    }

    fun updateProject(projectId: String, name: String? = null, description: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isUpdating = true, errorMessage = null)

            projectRepository.updateProject(projectId, name, description)
                .onSuccess { updatedProject ->
                    Log.d(TAG, "Project updated: ${updatedProject.id}")
                    val updatedProjects = _uiState.value.projects.map { project ->
                        if (project.id == projectId) updatedProject else project
                    }
                    _uiState.value = _uiState.value.copy(
                        isUpdating = false,
                        projects = updatedProjects,
                        selectedProject = if (_uiState.value.selectedProject?.id == projectId) updatedProject else _uiState.value.selectedProject,
                        message = "Project updated successfully"
                    )
                }
                .onFailure { error ->
                    Log.e(TAG, "Failed to update project", error)
                    _uiState.value = _uiState.value.copy(
                        isUpdating = false,
                        errorMessage = error.message ?: "Failed to update project"
                    )
                }
        }
    }

    fun deleteProject(projectId: String) {
        Log.d(TAG, "deleteProject called with projectId: $projectId")
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isDeleting = true, errorMessage = null)

            projectRepository.deleteProject(projectId)
                .onSuccess {
                    Log.d(TAG, "Project deleted: $projectId")
                    val updatedProjects = _uiState.value.projects.filter { it.id != projectId }
                    _uiState.value = _uiState.value.copy(
                        isDeleting = false,
                        projects = updatedProjects,
                        selectedProject = if (_uiState.value.selectedProject?.id == projectId) null else _uiState.value.selectedProject,
                        message = "Project deleted successfully"
                    )
                }
                .onFailure { error ->
                    Log.e(TAG, "Failed to delete project", error)
                    _uiState.value = _uiState.value.copy(
                        isDeleting = false,
                        errorMessage = error.message ?: "Failed to delete project"
                    )
                }
        }
    }

    fun removeMember(projectId: String, userId: String) {
        Log.d(TAG, "removeMember called with projectId: $projectId, userId: $userId")
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isDeleting = true, errorMessage = null)

            projectRepository.removeMember(projectId, userId)
                .onSuccess { updatedProject ->
                    Log.d(TAG, "Member removed from project: $projectId")
                    val updatedProjects = _uiState.value.projects.map { project ->
                        if (project.id == projectId) updatedProject else project
                    }
                    _uiState.value = _uiState.value.copy(
                        isDeleting = false,
                        projects = updatedProjects,
                        selectedProject = if (_uiState.value.selectedProject?.id == projectId) updatedProject else _uiState.value.selectedProject,
                        message = "Member removed successfully"
                    )
                }
                .onFailure { error ->
                    Log.e(TAG, "Failed to remove member", error)
                    _uiState.value = _uiState.value.copy(
                        isDeleting = false,
                        errorMessage = error.message ?: "Failed to remove member"
                    )
                }
        }
    }

    fun selectProject(project: Project) {
        Log.d(TAG, "🚩 selectProject called with project: ${project.name} (${project.id})")
        _uiState.value = _uiState.value.copy(selectedProject = project)
        Log.d(TAG, "selectedProject updated: ${_uiState.value.selectedProject?.name}")
    }

    fun addResource(projectId: String, resourceName: String, link: String) {
        Log.d(TAG, "addResource called with projectId: $projectId, resourceName: '$resourceName', link: '$link'")

        if (resourceName.isBlank()) {
            Log.d(TAG, "Resource name is blank, showing error")
            _uiState.value = _uiState.value.copy(
                errorMessage = "Resource name cannot be empty"
            )
            return
        }

        if (link.isBlank()) {
            Log.d(TAG, "Resource link is blank, showing error")
            _uiState.value = _uiState.value.copy(
                errorMessage = "Resource link cannot be empty"
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCreating = true, errorMessage = null)

            projectRepository.addResource(projectId, resourceName.trim(), link.trim())
                .onSuccess { project ->
                    Log.d(TAG, "Resource added successfully to project: ${project.id}")
                    // Update the project in the local state
                    val updatedProjects = _uiState.value.projects.map { p ->
                        if (p.id == projectId) project else p
                    }
                    _uiState.value = _uiState.value.copy(
                        isCreating = false,
                        projects = updatedProjects,
                        selectedProject = if (_uiState.value.selectedProject?.id == projectId) project else _uiState.value.selectedProject,
                        message = "Resource added successfully"
                    )
                }
                .onFailure { error ->
                    Log.e(TAG, "Failed to add resource", error)
                    _uiState.value = _uiState.value.copy(
                        isCreating = false,
                        errorMessage = error.message ?: "Failed to add resource"
                    )
                }
        }
    }

    fun refreshSelectedProject() {
        val selectedProject = _uiState.value.selectedProject
        if (selectedProject != null) {
            Log.d(TAG, "Refreshing selected project: ${selectedProject.name}")
            viewModelScope.launch {
                projectRepository.getProjectById(selectedProject.id)
                    .onSuccess { updatedProject ->
                        Log.d(TAG, "Project refreshed successfully: ${updatedProject.name}")
                        // Update the project in the local state
                        val updatedProjects = _uiState.value.projects.map { p ->
                            if (p.id == updatedProject.id) updatedProject else p
                        }
                        _uiState.value = _uiState.value.copy(
                            projects = updatedProjects,
                            selectedProject = updatedProject
                        )
                    }
                    .onFailure { error ->
                        Log.e(TAG, "Failed to refresh project", error)
                        _uiState.value = _uiState.value.copy(
                            errorMessage = "Failed to refresh project data"
                        )
                    }
            }
        }
    }

    fun refreshAllProjects() {
        Log.d(TAG, "Refreshing all projects for user")
        loadUserProjects()
    }

    fun sendMessage(projectId: String, content: String) {
        Log.d(TAG, "sendMessage called with projectId: $projectId, content: '$content'")

        if (content.isBlank()) {
            Log.d(TAG, "Message content is blank, showing error")
            _uiState.value = _uiState.value.copy(
                errorMessage = "Message content cannot be empty"
            )
            return
        }

        if (content.length > 2000) {
            Log.d(TAG, "Message content too long, showing error")
            _uiState.value = _uiState.value.copy(
                errorMessage = "Message content must be less than 2000 characters"
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSending = true, errorMessage = null)

            projectRepository.sendMessage(projectId, content.trim())
                .onSuccess { message ->
                    Log.d(TAG, "Message sent successfully: ${message.id}")
                    // Add message to local state immediately for instant UI update
                    val currentMessages = _uiState.value.messages
                    val updatedMessages = currentMessages + message
                    _uiState.value = _uiState.value.copy(
                        isSending = false,
                        messages = updatedMessages,
                        message = "Message sent successfully"
                    )
                }
                .onFailure { error ->
                    Log.e(TAG, "Failed to send message", error)
                    _uiState.value = _uiState.value.copy(
                        isSending = false,
                        errorMessage = error.message ?: "Failed to send message"
                    )
                }
        }
    }

    fun loadMessages(projectId: String) {
        Log.d(TAG, "loadMessages called with projectId: $projectId")
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingMessages = true, errorMessage = null)

            projectRepository.getMessages(projectId)
                .onSuccess { messages ->
                    Log.d(TAG, "Messages loaded successfully: ${messages.size} messages")
                    _uiState.value = _uiState.value.copy(
                        isLoadingMessages = false,
                        messages = messages,
                        message = "Messages loaded successfully"
                    )
                }
                .onFailure { error ->
                    Log.e(TAG, "Failed to load messages", error)
                    _uiState.value = _uiState.value.copy(
                        isLoadingMessages = false,
                        errorMessage = error.message ?: "Failed to load messages"
                    )
                }
        }
    }

    fun deleteMessage(projectId: String, messageId: String) {
        Log.d(TAG, "deleteMessage called with projectId: $projectId, messageId: $messageId")
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isDeleting = true, errorMessage = null)

            projectRepository.deleteMessage(projectId, messageId)
                .onSuccess {
                    Log.d(TAG, "Message deleted successfully: $messageId")
                    // Remove message from local state
                    val updatedMessages = _uiState.value.messages.filter { it.id != messageId }
                    _uiState.value = _uiState.value.copy(
                        isDeleting = false,
                        messages = updatedMessages,
                        message = "Message deleted successfully"
                    )
                }
                .onFailure { error ->
                    Log.e(TAG, "Failed to delete message", error)
                    _uiState.value = _uiState.value.copy(
                        isDeleting = false,
                        errorMessage = error.message ?: "Failed to delete message"
                    )
                }
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(
            message = null,
            errorMessage = null
        )
    }

    // WebSocket methods
    fun connectToChat(projectId: String) {
        Log.d(TAG, "Connecting to chat WebSocket for project: $projectId")
        viewModelScope.launch {
            try {
                // Get auth token
                val token = authRepository.getStoredToken()
                if (token != null) {
                    chatWebSocketService.setAuthToken(token)
                    
                    // Connect and setup message callback
                    chatWebSocketService.connect { newMessage ->
                        handleIncomingMessage(newMessage, projectId)
                    }
                    
                    // Join the project room
                    chatWebSocketService.joinProject(projectId)
                } else {
                    Log.e(TAG, "No auth token available for WebSocket connection")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error connecting to chat WebSocket", e)
            }
        }
    }

    fun disconnectFromChat(projectId: String) {
        Log.d(TAG, "Disconnecting from chat WebSocket for project: $projectId")
        viewModelScope.launch {
            chatWebSocketService.leaveProject(projectId)
        }
    }

    private fun handleIncomingMessage(message: ChatMessage, projectId: String) {
        Log.d(TAG, "Received incoming message for project $projectId: ${message.id}")
        
        // Only add message if it belongs to the current project and not already present
        val currentMessages = _uiState.value.messages
        if (message.projectId == projectId && !currentMessages.any { it.id == message.id }) {
            // Determine if message is from current user
            viewModelScope.launch {
                val currentUser = authRepository.getCurrentUser()
                val isFromCurrentUser = message.senderId == currentUser?._id
                
                // Create updated message with correct isFromCurrentUser flag
                val updatedMessage = ChatMessage(
                    id = message.id,
                    content = message.content,
                    senderName = message.senderName,
                    senderId = message.senderId,
                    timestamp = message.timestamp,
                    projectId = message.projectId,
                    isFromCurrentUser = isFromCurrentUser
                )
                
                val updatedMessages = currentMessages + updatedMessage
                
                _uiState.value = _uiState.value.copy(messages = updatedMessages)
                Log.d(TAG, "Added new message to state. Total messages: ${updatedMessages.size}")
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        chatWebSocketService.disconnect()
    }
}
