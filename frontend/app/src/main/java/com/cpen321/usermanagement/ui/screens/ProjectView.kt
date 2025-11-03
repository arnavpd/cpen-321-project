package com.cpen321.usermanagement.ui.screens
import retrofit2.http.GET
import Icon
import androidx.compose.runtime.collectAsState
import com.cpen321.usermanagement.data.remote.dto.Task
import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import androidx.compose.runtime.setValue
import android.util.Log
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.dto.ChatMessage as BackendChatMessage
import com.cpen321.usermanagement.data.remote.dto.Resource
import com.cpen321.usermanagement.ui.navigation.NavigationStateManager
import com.cpen321.usermanagement.data.remote.dto.ProjectMember

import com.cpen321.usermanagement.ui.theme.LocalSpacing
import com.cpen321.usermanagement.ui.viewmodels.ProjectViewModel
import com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel
import android.widget.Toast
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext

import com.cpen321.usermanagement.ui.theme.LocalSpacing

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.launch
import kotlinx.coroutines.coroutineScope
import android.os.Handler
import android.os.Looper

data class Expense(
    val id: String,
    val description: String,
    val amount: Double,
    val paidBy: String,
    val splitBetween: List<String>,
    val date: String,
    val amountPerPerson: Double
)

data class ChatMessage(
    val id: String,
    val content: String,
    val senderName: String,
    val senderId: String,
    val timestamp: Long,
    val projectId: String,
    val isFromCurrentUser: Boolean = false
)


@Composable
fun ProjectView(
    navigationStateManager: NavigationStateManager,
    projectViewModel: ProjectViewModel,
    profileViewModel: com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel,
    expenseRepository: com.cpen321.usermanagement.data.repository.ExpenseRepository,
    modifier: Modifier = Modifier
) {
    ProjectContent(
        navigationStateManager = navigationStateManager,
        expenseRepository = expenseRepository,
        projectViewModel = projectViewModel,
        profileViewModel = profileViewModel, // <-- Pass it here
        modifier = modifier
    )
}

@Composable
private fun ProjectContent(
    navigationStateManager: NavigationStateManager,
    projectViewModel: ProjectViewModel,
    profileViewModel: com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel,
    expenseRepository: com.cpen321.usermanagement.data.repository.ExpenseRepository,
    modifier: Modifier = Modifier
) {
    val uiState by projectViewModel.uiState.collectAsState()

    // Auto-select first project if none is selected
    LaunchedEffect(uiState.projects, uiState.selectedProject) {
        if (uiState.projects.isNotEmpty() && uiState.selectedProject == null) {
            Log.d("ProjectView", "Auto-selecting first project: ${uiState.projects.first().name}")
            projectViewModel.selectProject(uiState.projects.first())
        }
    }

    Scaffold(
        modifier = modifier,
        topBar = {
            ProjectTopBar(
                onBackClick = { navigationStateManager.navigateBack() },
                onProfileClick = { navigationStateManager.navigateToProfile() }
            )
        }
    ) { paddingValues ->
        ProjectBody(
            paddingValues = paddingValues,
            projectViewModel = projectViewModel,
            profileViewModel = profileViewModel,
            expenseRepository = expenseRepository,
            navigationStateManager = navigationStateManager
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProjectTopBar(
    onBackClick: () -> Unit,
    onProfileClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        modifier = modifier,
        title = {
            AppTitle()
        },
        navigationIcon = {
            BackButton(onClick = onBackClick)
        },
        actions = {
            ProfileActionButton(onClick = onProfileClick)
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        )
    )
}

@Composable
private fun AppTitle(
    modifier: Modifier = Modifier
) {
    Text(
        text = stringResource(R.string.app_name),
        style = MaterialTheme.typography.titleLarge,
        fontWeight = FontWeight.Medium,
        modifier = modifier
    )
}

@Composable
private fun ProfileActionButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    IconButton(
        onClick = onClick,
        modifier = modifier.size(spacing.extraLarge2)
    ) {
        ProfileIcon()
    }
}

@Composable
private fun ProfileIcon() {
    Icon(
        name = R.drawable.ic_account_circle,
    )
}

@Composable
private fun BackButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    IconButton(
        onClick = onClick,
        modifier = modifier.size(spacing.extraLarge2)
    ) {
        BackIcon()
    }
}

@Composable
private fun BackIcon() {
    Icon(
        name = R.drawable.ic_arrow_back,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProjectBody(
    paddingValues: PaddingValues,
    projectViewModel: ProjectViewModel,
    profileViewModel: com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel,
    expenseRepository: com.cpen321.usermanagement.data.repository.ExpenseRepository,
    navigationStateManager: NavigationStateManager,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current
    val context = LocalContext.current
    val uiState by projectViewModel.uiState.collectAsState()
    val profileUiState by profileViewModel.uiState.collectAsState()
    val currentProject = uiState.selectedProject
    val currentUser = profileUiState.user
    val coroutineScope = rememberCoroutineScope()
    
        // Project Settings state
        var projectName by remember { mutableStateOf(currentProject?.name ?: "") }
        var selectedUserToRemove by remember { mutableStateOf("") }
        var removeUserExpanded by remember { mutableStateOf(false) }
        var showDeleteConfirmationDialog by remember { mutableStateOf(false) }
        var refreshMembersTrigger by remember { mutableStateOf(0) }
        var userNames by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
        var isLoadingUserNames by remember { mutableStateOf(false) }
    
        // Debug project changes and update project name field
        LaunchedEffect(currentProject) {
            Log.d("ProjectView", "Current project changed to: ${currentProject?.id} (${currentProject?.name})")
            projectName = currentProject?.name ?: ""
            // Force member list recalculation when project changes
            refreshMembersTrigger++
            
            // Load user names for all members
            currentProject?.members?.let { members ->
                val userIds = members.map { it.userId }
                // Use coroutine scope to fetch user names
                coroutineScope.launch {
                    isLoadingUserNames = true
                    val names = mutableMapOf<String, String>()
                    userIds.forEach { userId ->
                        try {
                            val result = profileViewModel.getUserById(userId)
                            if (result.isSuccess) {
                                val user = result.getOrNull()
                                names[userId] = user?.name ?: "Unknown User"
                            } else {
                                names[userId] = "Unknown User"
                            }
                        } catch (e: Exception) {
                            names[userId] = "Unknown User"
                        }
                    }
                    userNames = names
                    isLoadingUserNames = false
                }
            }
        }

    // Handle project update success/error messages
    LaunchedEffect(uiState.message, uiState.errorMessage) {
        uiState.message?.let { message ->
            if (message.contains("updated successfully")) {
                Toast.makeText(context, "Project renamed successfully", Toast.LENGTH_SHORT).show()
            } else if (message.contains("removed successfully")) {
                Toast.makeText(context, "Member removed successfully", Toast.LENGTH_SHORT).show()
                // Clear the selection and close dropdown when member is removed
                selectedUserToRemove = ""
                removeUserExpanded = false
            }
        }
        uiState.errorMessage?.let { errorMessage ->
            if (errorMessage.contains("update")) {
                Toast.makeText(context, "Failed to rename project: $errorMessage", Toast.LENGTH_SHORT).show()
            } else if (errorMessage.contains("remove")) {
                Toast.makeText(context, "Failed to remove member: $errorMessage", Toast.LENGTH_SHORT).show()
            }
        }
    }


    var progressExpanded by remember { mutableStateOf(false) }
    var selectedProgress by remember { mutableStateOf("In Progress") }
    var selectedTab by remember { mutableStateOf("Task") }
    var showCreateTaskDialog by remember { mutableStateOf(false) }
    var taskName by remember { mutableStateOf("") }
    var assignee by remember { mutableStateOf("") }
    var taskProgress by remember { mutableStateOf("In Progress") }
    var deadline by remember { mutableStateOf("") }
    var taskProgressExpanded by remember { mutableStateOf(false) }
    var assigneeExpanded by remember { mutableStateOf(false) }
    var selectedDate by remember { mutableStateOf<Long?>(null) }

    // Resource state
    var showAddResourceDialog by remember { mutableStateOf(false) }
    var resourceName by remember { mutableStateOf("") }
    var resourceLink by remember { mutableStateOf("") }

    // Project Settings state (variables moved to top)

    // Expense state
    var expenses by remember { mutableStateOf(listOf<Expense>()) }
    var showCreateExpenseDialog by remember { mutableStateOf(false) }
    var expenseDescription by remember { mutableStateOf("") }
    var expenseAmount by remember { mutableStateOf("") }
    var expensePaidBy by remember { mutableStateOf("") }
    var paidByExpanded by remember { mutableStateOf(false) }
    var selectedUsersForSplit by remember { mutableStateOf(setOf<String>()) }
    var expenseErrorMessage by remember { mutableStateOf<String?>(null) }

    // Get actual project members - recalculate when currentProject changes or refresh is triggered
    val allMembers = remember(currentProject, refreshMembersTrigger) {
        val projectMembers = currentProject?.members ?: emptyList()
        val ownerMember = currentProject?.let {
            ProjectMember(userId = it.ownerId, role = "owner", admin = true, joinedAt = it.createdAt)
        }
        // Only add owner if they're not already in projectMembers (avoid duplicates)
        if (ownerMember != null && !projectMembers.any { it.userId == ownerMember.userId }) {
            listOf(ownerMember) + projectMembers
        } else {
            projectMembers
        }
    }

    // Chat state - now using backend messages from ViewModel
    val backendMessages = uiState.messages

    // Load current user profile
    LaunchedEffect(Unit) {
        Log.d("ProjectView", "Loading user profile... Current user in state: ${profileUiState.user?._id}")
        if (profileUiState.user == null) {
            profileViewModel.loadProfile()
        }
    }


    // Re-map messages when user profile is loaded to ensure proper alignment
    val mappedMessages = remember(backendMessages, currentUser) {
        Log.d("ProjectView", "Re-mapping messages. Current user: ${currentUser?._id}, Messages count: ${backendMessages?.size ?: 0}")
        backendMessages?.map { backendMessage ->
            val isFromCurrentUser = currentUser?._id == backendMessage.senderId
            Log.d("ProjectView", "Message from ${backendMessage.senderName} (${backendMessage.senderId}) - isFromCurrentUser: $isFromCurrentUser")
            Log.d("ProjectView", "Comparing: '${currentUser?._id}' == '${backendMessage.senderId}' = ${currentUser?._id == backendMessage.senderId}")
            Log.d("ProjectView", "Current user ID: '${currentUser?._id}', Sender ID: '${backendMessage.senderId}'")

            // Use the actual comparison result
            val finalIsFromCurrentUser = isFromCurrentUser

            ChatMessage(
                id = backendMessage.id,
                content = backendMessage.content,
                senderName = backendMessage.senderName,
                senderId = backendMessage.senderId,
                timestamp = backendMessage.timestamp,
                projectId = backendMessage.projectId,
                isFromCurrentUser = finalIsFromCurrentUser
            )
        } ?: emptyList()
    }

    // Fetch user names for project members
    var userIdToNameMap by remember { mutableStateOf<Map<String, String>>(emptyMap()) }

    // Fetch user names when project changes
    androidx.compose.runtime.LaunchedEffect(currentProject?.id) {
        currentProject?.members?.let { members ->
            val userMap = mutableMapOf<String, String>()
            // Fetch all users concurrently
            coroutineScope {
                members.forEach { member ->
                    launch {
                        profileViewModel.getUserById(member.userId)
                            .onSuccess { user ->
                                Log.d("ProjectView", "Fetched user: id=${member.userId}, name=${user.name}")
                                userMap[member.userId] = user.name
                                userIdToNameMap = userMap.toMap()
                            }
                            .onFailure {
                                // Fallback to user ID if name fetch fails
                                Log.e("ProjectView", "Failed to fetch user: id=${member.userId}")
                                userMap[member.userId] = member.userId
                                userIdToNameMap = userMap.toMap()
                            }
                    }
                }
            }
        }
    }

    // Load messages when Chat tab is selected and connect to WebSocket
    androidx.compose.runtime.LaunchedEffect(selectedTab, currentProject?.id) {
        if (selectedTab == "Chat" && currentProject != null) {
            try {
                projectViewModel.loadMessages(currentProject.id)
                // Connect to WebSocket for real-time updates
                projectViewModel.connectToChat(currentProject.id)
                Log.d("ProjectView", "Connected to WebSocket for project ${currentProject.id}")
            } catch (e: Exception) {
                Log.e("ProjectView", "Error loading messages for project ${currentProject.id}", e)
            }
        } else if (selectedTab != "Chat" && currentProject != null) {
            // Disconnect from WebSocket when leaving Chat tab
            projectViewModel.disconnectFromChat(currentProject.id)
            Log.d("ProjectView", "Disconnected from WebSocket for project ${currentProject.id}")
        }
    }

    // Load expenses when project changes
    androidx.compose.runtime.LaunchedEffect(currentProject?.id) {
        currentProject?.let { project ->
            expenseRepository.getProjectExpenses(project.id)
                .onSuccess { fetchedExpenses ->
                    expenses = fetchedExpenses.map { dto ->
                        Log.d("ProjectView", "Mapping expense DTO: id=${dto.id}, desc=${dto.description}, amount=${dto.amount}, paidBy=${dto.paidBy}, splitBetween=${dto.splitBetween}, perPerson=${dto.amountPerPerson}")
                        Expense(
                            id = dto.id,
                            description = dto.description,
                            amount = dto.amount,
                            paidBy = dto.paidBy,
                            splitBetween = dto.splitBetween,
                            date = dto.date,
                            amountPerPerson = dto.amountPerPerson
                        )
                    }
                    Log.d("ProjectView", "Loaded ${expenses.size} expenses for project ${project.id}")
                    expenses.forEach { exp ->
                        Log.d("ProjectView", "Expense: desc='${exp.description}', amount=${exp.amount}, paidBy='${exp.paidBy}', splitBetween=${exp.splitBetween}")
                    }
                }
                .onFailure { error ->
                    Log.e("ProjectView", "Failed to load expenses", error)
                    Toast.makeText(context, "Failed to load expenses: ${error.message}", Toast.LENGTH_SHORT).show()
                }
        }
    }

    // Get available users with names (fallback to userId if name not loaded yet)
    val availableUsers = currentProject?.members?.map { member ->
        userIdToNameMap[member.userId] ?: member.userId
    } ?: emptyList()

    // Note: Tasks are now project-specific, so no need to clear when switching projects

    // Load tasks when switching to Task Board tab or when project changes
    LaunchedEffect(selectedTab, currentProject?.id) {
        Log.d("ProjectView", "LaunchedEffect triggered - selectedTab: $selectedTab, currentProject: ${currentProject?.id} (${currentProject?.name})")
        if (selectedTab == "Task" && currentProject != null) {
            Log.d("ProjectView", "Loading tasks for project: ${currentProject.id} (${currentProject.name})")
            projectViewModel.loadProjectTasks(currentProject.id)
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = spacing.small, vertical = spacing.medium),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Top
    ) {
        // Navigation buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(spacing.small)
        ) {
            // Only show Project Settings button if user is admin
            if (currentProject?.isAdmin == true) {
                Button(
                    onClick = {
                        Log.d("ProjectView", "Clicked Project Settings")
                        selectedTab = "Project Settings"
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Project Settings")
                }
            }

            Button(
                onClick = {
                    Log.d("ProjectView", "Clicked Create Task")
                    showCreateTaskDialog = true
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Create Task")
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(spacing.small)
        ) {
            Button(
                onClick = {
                    Log.d("ProjectView", "Clicked Resource")
                    selectedTab = "Resource"
                    // Refresh project data to get latest resources
                    projectViewModel.refreshSelectedProject()
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Resource")
            }

            Button(
                onClick = {
                    Log.d("ProjectView", "Clicked Chat")
                    selectedTab = "Chat"
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Chat")
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(spacing.small)
        ) {
            Button(
                onClick = {
                    Log.d("ProjectView", "Clicked Expense")
                    selectedTab = "Expense"
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Expense")
            }

            Button(
                onClick = {
                    Log.d("ProjectView", "Clicked Task Board")
                    selectedTab = "Task"
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Task Board")
            }
        }

        // Add Expense Button (only show when on Expense tab)
        if (selectedTab == "Expense") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                Button(
                    onClick = {
                        Log.d("ProjectView", "Clicked Add Expense")
                        showCreateExpenseDialog = true
                    }
                ) {
                    Text("Add Expense")
                }
            }
        }

        // Add Resource Button (only show when on Resource tab)
        if (selectedTab == "Resource") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                Button(
                    onClick = {
                        Log.d("ProjectView", "Clicked Add Resource")
                        showAddResourceDialog = true
                    }
                ) {
                    Text("Add Resource")
                }
            }
        }

        // Get tasks for current project
        val tasks = currentProject?.let { 
            Log.d("ProjectView", "Getting tasks for current project: ${it.id} (${it.name})")
            val projectTasks = projectViewModel.getTasksForProject(it.id)
            Log.d("ProjectView", "Retrieved ${projectTasks.size} tasks for project ${it.id}")
            projectTasks.forEach { task ->
                Log.d("ProjectView", "Task: ${task.id} - ${task.title} (projectId: ${task.projectId})")
            }
            projectTasks
        } ?: emptyList()

        if (selectedTab == "Task") {
            Text("Task Board", style = MaterialTheme.typography.titleLarge)

            // Show error message if present
            if (uiState.errorMessage != null) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Text(
                        text = uiState.errorMessage!!,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }

            // Show success message if present
            if (uiState.message != null && uiState.message!!.contains("Task")) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Text(
                        text = uiState.message!!,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }

            if (tasks.isEmpty()) {
                Text("No tasks yet.")
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f, fill = true), // Ensures it takes available space
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    items(tasks) { task ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Column(modifier = Modifier.padding(8.dp)) {
                                Row {
                                    Text(
                                        text = "Name: ",
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(text = task.title)
                                }
                                Row {
                                    Text(
                                        text = "Status: ",
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = task.status,
                                        color = when (task.status.lowercase()) {
                                            "in_progress" -> Color(0xFFB8860B) // Dark Goldenrod (darker yellow/orange)
                                            "completed", "done" -> Color(0xFF4CAF50) // Green
                                            "backlog" -> Color(0xFF9C27B0) // Purple
                                            "blocked" -> Color(0xFFF44336) // Red
                                            "not_started" -> Color(0xFF2196F3) // Blue
                                            else -> Color.Unspecified // Default color
                                        }
                                    )
                                }
                                Row {
                                    Text(
                                        text = "Assignees: ",
                                        fontWeight = FontWeight.Bold
                                    )
                                    if (isLoadingUserNames) {
                                        Row {
                                            CircularProgressIndicator(
                                                modifier = Modifier.size(12.dp),
                                                strokeWidth = 2.dp
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "Loading...",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                            )
                                        }
                                    } else {
                                        Text(text = task.assignees.joinToString { assigneeId ->
                                            val userName = userNames[assigneeId] ?: assigneeId
                                            if (assigneeId == currentUser?._id) {
                                                "$userName (Me)"
                                            } else {
                                                userName
                                            }
                                        })
                                    }
                                }
                                Row {
                                    Text(
                                        text = "Deadline: ",
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(text = task.deadline?.let { deadline ->
                                        try {
                                            // Parse the ISO date string and format it to show only the date
                                            val inputFormat = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.getDefault())
                                            val outputFormat = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
                                            val date = inputFormat.parse(deadline)
                                            outputFormat.format(date)
                                        } catch (e: Exception) {
                                            // If parsing fails, try to extract just the date part
                                            deadline.substringBefore("T")
                                        }
                                    } ?: "None")
                                }
                            }
                        }
                    }
                }
            }
        }

        // Content area below the buttons
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = spacing.large)
        ) {
            when (selectedTab) {
                "Project Settings" -> {
                    // Refresh project data when Project Settings tab is opened
                    LaunchedEffect(selectedTab) {
                        if (selectedTab == "Project Settings") {
                            // Force refresh profile to ensure correct user context
                            profileViewModel.loadProfile()
                            projectViewModel.refreshSelectedProject()
                            // Force member list recalculation
                            refreshMembersTrigger++
                        }
                    }
                    
                    Text(
                        text = "Project Settings:",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(bottom = spacing.medium)
                    )

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = spacing.small),
                        verticalArrangement = Arrangement.spacedBy(spacing.medium)
                    ) {
                        // Add Users card
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                    shape = RoundedCornerShape(8.dp)
                                )
                                .padding(spacing.medium)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Add Users",
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = currentProject?.invitationCode ?: "",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                )
                            }
                        }

                        // Delete Project card
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    color = MaterialTheme.colorScheme.errorContainer,
                                    shape = RoundedCornerShape(8.dp)
                                )
                                .padding(spacing.medium)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Delete Project",
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                                Button(
                                    onClick = { 
                                        Log.d("ProjectView", "Delete Project clicked")
                                        showDeleteConfirmationDialog = true
                                    },
                                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                                        containerColor = MaterialTheme.colorScheme.error
                                    )
                                ) {
                                    Text("Delete")
                                }
                            }
                        }

                        // Rename Project card
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    color = MaterialTheme.colorScheme.primaryContainer,
                                    shape = RoundedCornerShape(8.dp)
                                )
                                .padding(spacing.medium)
                        ) {
                            Column(
                                verticalArrangement = Arrangement.spacedBy(spacing.medium)
                            ) {
                                Text(
                                    text = "Rename Project",
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(spacing.small)
                                ) {
                                    OutlinedTextField(
                                        value = projectName,
                                        onValueChange = { projectName = it },
                                        placeholder = { Text("New name") },
                                        modifier = Modifier.weight(1f),
                                        colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
                                            unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                                            focusedContainerColor = MaterialTheme.colorScheme.surface
                                        )
                                    )
                                    Button(
                                        onClick = {
                                            if (projectName.isNotBlank() && currentProject != null) {
                                                Log.d("ProjectView", "Renaming project to: $projectName")
                                                projectViewModel.updateProject(currentProject.id, projectName.trim())
                                                // Success/error messages will be handled by the ViewModel state
                                            } else {
                                                Toast.makeText(context, "Please enter a valid project name", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    ) {
                                        Text("Save")
                                    }
                                }
                            }
                        }

                        // Remove Users card - only show to admins
                        if (currentProject?.isAdmin == true) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(
                                        color = MaterialTheme.colorScheme.secondaryContainer,
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    .padding(spacing.medium)
                            ) {
                                Column(
                                    verticalArrangement = Arrangement.spacedBy(spacing.medium)
                                ) {
                                    Text(
                                        text = "Remove Users",
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.Medium,
                                        color = MaterialTheme.colorScheme.onSecondaryContainer
                                    )
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(spacing.small)
                                ) {
                                    Box(modifier = Modifier.weight(1f)) {
                                        OutlinedButton(
                                            onClick = { 
                                                // Refresh project data before opening dropdown
                                                projectViewModel.refreshSelectedProject()
                                                // Force member list recalculation
                                                refreshMembersTrigger++
                                                removeUserExpanded = !removeUserExpanded 
                                            },
                                            modifier = Modifier.fillMaxWidth(),
                                            colors = ButtonDefaults.outlinedButtonColors(
                                                contentColor = MaterialTheme.colorScheme.onSurface
                                            ),
                                            border = BorderStroke(
                                                1.dp, 
                                                MaterialTheme.colorScheme.outline
                                            )
                                        ) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = if (selectedUserToRemove.isNotEmpty()) {
                                                        userNames[selectedUserToRemove] ?: selectedUserToRemove
                                                    } else {
                                                        "Select user"
                                                    },
                                                    textAlign = TextAlign.Start,
                                                    style = MaterialTheme.typography.bodyMedium
                                                )
                                                Icon(
                                                    imageVector = if (removeUserExpanded) 
                                                        Icons.Filled.KeyboardArrowUp 
                                                    else 
                                                        Icons.Filled.KeyboardArrowDown,
                                                    contentDescription = if (removeUserExpanded) "Close dropdown" else "Open dropdown",
                                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                        DropdownMenu(
                                            expanded = removeUserExpanded,
                                            onDismissRequest = { removeUserExpanded = false }
                                        ) {
                                            // Filter out the current user and owner from the list
                                            val removableMembers = allMembers.filter { member ->
                                                member.userId != currentUser?._id && 
                                                member.userId != currentProject?.ownerId
                                            }
                                            
                                            if (removableMembers.isEmpty()) {
                                                DropdownMenuItem(
                                                    text = { Text("No members to remove") },
                                                    onClick = { removeUserExpanded = false }
                                                )
                                            } else {
                                                removableMembers.forEach { member ->
                                                    DropdownMenuItem(
                                                        text = { 
                                                            Text(userNames[member.userId] ?: member.userId)
                                                        },
                                                        onClick = {
                                                            selectedUserToRemove = member.userId
                                                            removeUserExpanded = false
                                                        }
                                                    )
                                                }
                                            }
                                        }
                                    }
                                    Button(
                                        onClick = {
                                            if (selectedUserToRemove.isNotBlank() && currentProject != null) {
                                                projectViewModel.removeMember(currentProject.id, selectedUserToRemove)
                                                selectedUserToRemove = ""
                                            } else {
                                                Toast.makeText(context, "Please select a user to remove", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    ) {
                                        Text("Remove")
                                    }
                                }
                            }
                        }
                        }
                    }
                }
                "Resource" -> {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Resources:",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(bottom = spacing.medium)
                        )

                        // Show refresh button
                        if (uiState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            TextButton(
                                onClick = {
                                    Log.d("ProjectView", "Manual refresh clicked")
                                    projectViewModel.refreshSelectedProject()
                                }
                            ) {
                                Text("Refresh")
                            }
                        }
                    }

                    // Show success message if available
                    if (uiState.message?.contains("Resource added") == true) {
                        Text(
                            text = uiState.message!!,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = spacing.small)
                        )
                    }

                    if (currentProject?.resources?.isNotEmpty() == true) {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(spacing.small)
                        ) {
                            currentProject.resources.forEach { resource ->
                                ResourceItem(
                                    resource = resource,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    } else {
                        Text(
                            text = "No resources yet. Add your first resource!",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
                "Chat" -> {
                    ChatScreen(
                        messages = mappedMessages,
                        onSendMessage = { message ->
                            currentProject?.let { project ->
                                try {
                                    projectViewModel.sendMessage(project.id, message)
                                } catch (e: Exception) {
                                    Log.e("ProjectView", "Error sending message", e)
                                }
                            }
                        },
                        isLoading = uiState.isLoadingMessages,
                        isSending = uiState.isSending
                    )
                }
                "Expense" -> {
                    Text(
                        text = "Expenses:",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(bottom = spacing.medium)
                    )

                    if (expenses.isEmpty()) {
                        Text(
                            text = "No expenses added yet",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().padding(spacing.large)
                        )
                    } else {
                        // Expense Table Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = spacing.small, vertical = spacing.medium)
                                .background(
                                    color = MaterialTheme.colorScheme.primaryContainer,
                                    shape = RoundedCornerShape(4.dp)
                                )
                                .padding(spacing.medium),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Description",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier
                                    .weight(1.5f)
                                    .padding(horizontal = spacing.small),
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = "Amount",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(horizontal = spacing.small),
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = "Paid By",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(horizontal = spacing.small),
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = "Split Between",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier
                                    .weight(1.5f)
                                    .padding(horizontal = spacing.small),
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = "Per Person",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(horizontal = spacing.small),
                                textAlign = TextAlign.Center
                            )
                        }

                        // Scrollable Expense Table Rows
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .weight(1f)
                                .verticalScroll(rememberScrollState())
                        ) {
                            expenses.forEach { expense ->
                                Log.d("ProjectView", "Rendering expense: paidBy='${expense.paidBy}', splitBetween=${expense.splitBetween}, userIdToNameMap=$userIdToNameMap")
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = spacing.small, vertical = spacing.small)
                                        .background(
                                            color = MaterialTheme.colorScheme.surfaceVariant,
                                            shape = RoundedCornerShape(4.dp)
                                        )
                                        .padding(spacing.medium),
                                    horizontalArrangement = Arrangement.SpaceEvenly,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = expense.description,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier
                                            .weight(1.5f)
                                            .padding(horizontal = 4.dp),
                                        textAlign = TextAlign.Center,
                                        maxLines = 2
                                    )
                                    Text(
                                        text = "$%.2f".format(expense.amount),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier
                                            .weight(1f)
                                            .padding(horizontal = 4.dp),
                                        textAlign = TextAlign.Center
                                    )
                                    Text(
                                        text = userIdToNameMap[expense.paidBy] ?: expense.paidBy,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier
                                            .weight(1f)
                                            .padding(horizontal = 4.dp),
                                        textAlign = TextAlign.Center,
                                        maxLines = 2,
                                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = expense.splitBetween.joinToString(", ") { userId ->
                                            userIdToNameMap[userId] ?: userId
                                        },
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier
                                            .weight(1.5f)
                                            .padding(horizontal = 4.dp),
                                        textAlign = TextAlign.Center,
                                        maxLines = 2,
                                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = "$%.2f".format(expense.amountPerPerson),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier
                                            .weight(1f)
                                            .padding(horizontal = 4.dp),
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Create Task Dialog
        if (showCreateTaskDialog) {
            AlertDialog(
                onDismissRequest = { showCreateTaskDialog = false },
                title = {
                    Text("Create New Task")
                },
                text = {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(spacing.medium)
                    ) {
                        // Task Name Field
                        OutlinedTextField(
                            value = taskName,
                            onValueChange = { taskName = it },
                            label = { Text("Task Name") },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text("Enter task name") }
                        )

                        // Assignee Dropdown - Same pattern as Expense form
                        Text(
                            text = "Assignee:",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                        Box {
                            TextButton(
                                onClick = { 
                                    assigneeExpanded = !assigneeExpanded
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = if (isLoadingUserNames && assignee.isNotEmpty()) {
                                        "Loading..."
                                    } else if (assignee.isNotEmpty()) {
                                        val userName = userNames[assignee] ?: assignee
                                        if (assignee == currentUser?._id) {
                                            "$userName (Me)"
                                        } else {
                                            userName
                                        }
                                    } else {
                                        "Select assignee"
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    textAlign = TextAlign.Start
                                )
                            }
                            DropdownMenu(
                                expanded = assigneeExpanded,
                                onDismissRequest = { assigneeExpanded = false }
                            ) {
                                allMembers.forEach { member ->
                                    val userName = userNames[member.userId] ?: member.userId
                                    val displayName = if (member.userId == currentUser?._id) {
                                        "$userName (Me)"
                                    } else {
                                        userName
                                    }
                                    DropdownMenuItem(
                                        text = { Text(displayName) },
                                        onClick = {
                                            assignee = member.userId
                                            assigneeExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        // Status Dropdown - Clear UI
                        Text(
                            text = "Status",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                        Box {
                            OutlinedTextField(
                                value = taskProgress,
                                onValueChange = { },
                                readOnly = true,
                                label = { Text("Select Status") },
                                trailingIcon = {
                                    IconButton(
                                        onClick = { taskProgressExpanded = !taskProgressExpanded }
                                    ) {
                                        Icon(
                                            imageVector = if (taskProgressExpanded) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown,
                                            contentDescription = "Dropdown"
                                        )
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { taskProgressExpanded = !taskProgressExpanded }
                            )
                            DropdownMenu(
                                expanded = taskProgressExpanded,
                                onDismissRequest = { taskProgressExpanded = false }
                            ) {
                                listOf("In Progress", "Done", "Backlog", "Blocked", "Not Started").forEach { option ->
                                    DropdownMenuItem(
                                        text = { Text(option) },
                                        onClick = {
                                            taskProgress = option
                                            taskProgressExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        // Date Picker for Deadline - Simplified to match expense form pattern
                        Text(
                            text = "Deadline:",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                        TextButton(
                            onClick = {
                                // Show date picker - defaults to today
                                val datePickerDialog = android.app.DatePickerDialog(
                                    context,
                                    { _, year, month, dayOfMonth ->
                                        val calendar = java.util.Calendar.getInstance()
                                        calendar.set(year, month, dayOfMonth)
                                        selectedDate = calendar.timeInMillis
                                        deadline = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(calendar.time)
                                    },
                                    java.util.Calendar.getInstance().get(java.util.Calendar.YEAR),
                                    java.util.Calendar.getInstance().get(java.util.Calendar.MONTH),
                                    java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_MONTH)
                                )
                                datePickerDialog.show()
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = if (selectedDate != null) {
                                    val date = java.util.Date(selectedDate!!)
                                    val formatter = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
                                    formatter.format(date)
                                } else {
                                    "Select deadline date"
                                },
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.Start
                            )
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            Log.d("ProjectView", "Creating task: $taskName, $assignee, $taskProgress, $deadline")
                            currentProject?.let { project ->
                                projectViewModel.createTask(
                                    projectId = project.id,
                                    name = taskName,
                                    assignee = assignee,
                                    status = taskProgress,
                                    deadline = deadline.takeIf { it.isNotBlank() }
                                )
                            }
                            showCreateTaskDialog = false
                            taskName = ""
                            assignee = ""
                            taskProgress = "In Progress"
                            deadline = ""
                            selectedDate = null
                            assigneeExpanded = false
                            taskProgressExpanded = false
                        }
                    ) {
                        Text("Create")
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = {
                            showCreateTaskDialog = false
                            taskName = ""
                            assignee = ""
                            taskProgress = "In Progress"
                            deadline = ""
                            selectedDate = null
                            assigneeExpanded = false
                            taskProgressExpanded = false
                        }
                    ) {
                        Text("Cancel")
                    }
                }
            )
        }

        // Create Expense Dialog
        if (showCreateExpenseDialog) {
            AlertDialog(
                onDismissRequest = { 
                    showCreateExpenseDialog = false
                    expenseErrorMessage = null // Clear error when dialog is dismissed
                },
                title = {
                    Text("Add New Expense")
                },
                text = {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(spacing.medium)
                    ) {
                        OutlinedTextField(
                            value = expenseDescription,
                            onValueChange = { 
                                expenseDescription = it
                                expenseErrorMessage = null // Clear error when user types
                            },
                            label = { Text("Description") },
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = expenseAmount,
                            onValueChange = { 
                                expenseAmount = it
                                expenseErrorMessage = null // Clear error when user types
                            },
                            label = { Text("Amount ($)") },
                            modifier = Modifier.fillMaxWidth()
                        )

                        // Paid By Dropdown
                        Text(
                            text = "Paid By:",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                        Box {
                            TextButton(
                                onClick = { 
                                    paidByExpanded = !paidByExpanded
                                    expenseErrorMessage = null // Clear error when user interacts
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = expensePaidBy.ifEmpty { "Select who paid" },
                                    modifier = Modifier.fillMaxWidth(),
                                    textAlign = TextAlign.Start
                                )
                            }
                            DropdownMenu(
                                expanded = paidByExpanded,
                                onDismissRequest = { paidByExpanded = false }
                            ) {
                                availableUsers.forEach { user ->
                                    DropdownMenuItem(
                                        text = { Text(user) },
                                        onClick = {
                                            expensePaidBy = user
                                            paidByExpanded = false
                                            expenseErrorMessage = null // Clear error when user selects
                                        }
                                    )
                                }
                            }
                        }

                        // Split Between Multi-select
                        Text(
                            text = "Split between:",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                        Column {
                            availableUsers.forEach { user ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Checkbox(
                                        checked = selectedUsersForSplit.contains(user),
                                        onCheckedChange = { isChecked ->
                                            selectedUsersForSplit = if (isChecked) {
                                                selectedUsersForSplit + user
                                            } else {
                                                selectedUsersForSplit - user
                                            }
                                            expenseErrorMessage = null // Clear error when user changes selection
                                        }
                                    )
                                    Text(
                                        text = user,
                                        modifier = Modifier.padding(start = spacing.small)
                                    )
                                }
                            }
                        }

                        if (selectedUsersForSplit.isNotEmpty()) {
                            Text(
                                text = "Selected: ${selectedUsersForSplit.joinToString(", ")}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        
                        // Display error message if present
                        if (expenseErrorMessage != null) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = expenseErrorMessage!!,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            val amount = expenseAmount.toDoubleOrNull()
                            if (expenseDescription.isNotBlank() &&
                                amount != null && amount > 0 &&
                                expensePaidBy.isNotBlank() &&
                                selectedUsersForSplit.isNotEmpty() &&
                                currentProject != null) {

                                // Map names back to user IDs
                                val nameToIdMap = userIdToNameMap.entries.associate { it.value to it.key }
                                val paidByUserId = nameToIdMap[expensePaidBy] ?: expensePaidBy
                                val splitBetweenUserIds = selectedUsersForSplit.map { name ->
                                    nameToIdMap[name] ?: name
                                }

                                // Save expense to database
                                coroutineScope.launch {
                                    expenseRepository.createExpense(
                                        projectId = currentProject.id,
                                        description = expenseDescription,
                                        amount = amount,
                                        paidBy = paidByUserId,
                                        splitBetween = splitBetweenUserIds
                                    ).onSuccess { createdExpense ->
                                        // Add to local state
                                        val newExpense = Expense(
                                            id = createdExpense.id,
                                            description = createdExpense.description,
                                            amount = createdExpense.amount,
                                            paidBy = createdExpense.paidBy,
                                            splitBetween = createdExpense.splitBetween,
                                            date = createdExpense.date,
                                            amountPerPerson = createdExpense.amountPerPerson
                                        )
                                        expenses = expenses + newExpense

                                        Log.d("ProjectView", "Expense created and saved: $newExpense")
                                        
                                        // Show toast on main thread
                                        Handler(Looper.getMainLooper()).post {
                                            Toast.makeText(context, "Expense added: $expenseDescription", Toast.LENGTH_SHORT).show()
                                        }

                                        // Reset form
                                        showCreateExpenseDialog = false
                                        expenseDescription = ""
                                        expenseAmount = ""
                                        expensePaidBy = ""
                                        selectedUsersForSplit = setOf()
                                        expenseErrorMessage = null
                                    }.onFailure { error ->
                                        Log.e("ProjectView", "Failed to create expense", error)
                                        // Show toast on main thread
                                        Handler(Looper.getMainLooper()).post {
                                            Toast.makeText(context, "Failed to create expense: ${error.message}", Toast.LENGTH_LONG).show()
                                        }
                                    }
                                }
                            } else {
                                expenseErrorMessage = "Please fill all fields correctly"
                            }
                        }
                    ) {
                        Text("Add Expense")
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = {
                            showCreateExpenseDialog = false
                            expenseDescription = ""
                            expenseAmount = ""
                            expensePaidBy = ""
                            selectedUsersForSplit = setOf()
                        }
                    ) {
                        Text("Cancel")
                    }
                }
            )
        }

        // Add Resource Dialog
        if (showAddResourceDialog) {
            AddResourceDialog(
                onDismiss = {
                    showAddResourceDialog = false
                    resourceName = ""
                    resourceLink = ""
                },
                onAddResource = { name, link ->
                    Log.d("ProjectView", "onAddResource callback called with: '$name', '$link'")
                    Log.d("ProjectView", "currentProject: $currentProject")
                    Log.d("ProjectView", "uiState.selectedProject: ${uiState.selectedProject}")
                    currentProject?.let { project ->
                        Log.d("ProjectView", "Calling projectViewModel.addResource with projectId: ${project.id}")
                        projectViewModel.addResource(project.id, name, link)
                        Toast.makeText(context, "Resource added successfully!", Toast.LENGTH_SHORT).show()
                        showAddResourceDialog = false
                        resourceName = ""
                        resourceLink = ""
                    } ?: run {
                        Log.e("ProjectView", "currentProject is null! Cannot add resource.")
                        Toast.makeText(context, "Error: No project selected", Toast.LENGTH_SHORT).show()
                    }
                },
                resourceName = resourceName,
                onResourceNameChange = { resourceName = it },
                resourceLink = resourceLink,
                onResourceLinkChange = { resourceLink = it },
                isAdding = uiState.isCreating,
                errorMessage = uiState.errorMessage
            )
        }

        // Delete Project Confirmation Dialog
        if (showDeleteConfirmationDialog) {
            AlertDialog(
                onDismissRequest = { showDeleteConfirmationDialog = false },
                title = {
                    Text("Delete Project")
                },
                text = {
                    Text("Are you sure you want to delete this project? This action cannot be undone.")
                },
                confirmButton = {
                    Button(
                        onClick = {
                            currentProject?.let { project ->
                                Log.d("ProjectView", "Attempting to delete project: ${project.id}")
                                projectViewModel.deleteProject(project.id)
                                showDeleteConfirmationDialog = false
                                // Navigate back to the home screen
                                navigationStateManager.navigateBack()
                                Toast.makeText(context, "Project deleted successfully", Toast.LENGTH_SHORT).show()
                            }
                        },
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("Delete")
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = { showDeleteConfirmationDialog = false }
                    ) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}



@Composable
private fun AddResourceDialog(
    onDismiss: () -> Unit,
    onAddResource: (String, String) -> Unit,
    resourceName: String,
    onResourceNameChange: (String) -> Unit,
    resourceLink: String,
    onResourceLinkChange: (String) -> Unit,
    isAdding: Boolean,
    errorMessage: String?,
    modifier: Modifier = Modifier
) {
    AlertDialog(
        onDismissRequest = { if (!isAdding) onDismiss() },
        title = {
            Text("Add Resource")
        },
        text = {
            Column {
                OutlinedTextField(
                    value = resourceName,
                    onValueChange = onResourceNameChange,
                    label = { Text("Resource Name") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isAdding,
                    isError = resourceName.isBlank() && resourceName.isNotEmpty(),
                    supportingText = if (resourceName.isBlank() && resourceName.isNotEmpty()) {
                        { Text("Resource name is required") }
                    } else null
                )
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = resourceLink,
                    onValueChange = onResourceLinkChange,
                    label = { Text("Resource Link") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isAdding,
                    placeholder = { Text("https://example.com") },
                    isError = resourceLink.isBlank() && resourceLink.isNotEmpty(),
                    supportingText = if (resourceLink.isBlank() && resourceLink.isNotEmpty()) {
                        { Text("Resource link is required") }
                    } else null
                )

                // Display error message if present
                if (errorMessage != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = errorMessage,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    Log.d("ProjectView", "Add button clicked!")
                    if (resourceName.isNotBlank() && resourceLink.isNotBlank()) {
                        onAddResource(resourceName, resourceLink)
                    }
                },
                enabled = resourceName.isNotBlank() && resourceLink.isNotBlank() && !isAdding
            ) {
                if (isAdding) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Add")
                }
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isAdding
            ) {
                Text("Cancel")
            }
        }
    )
}
@Composable
fun ChatScreen(
    messages: List<ChatMessage> = emptyList(),
    onSendMessage: (String) -> Unit = {},
    isLoading: Boolean = false,
    isSending: Boolean = false,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current
    var messageText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()


    // Auto-scroll to bottom when new messages arrive
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty() && messages.size > 0) {
            try {
                coroutineScope.launch {
                    listState.animateScrollToItem(messages.size - 1)
                }
            } catch (e: Exception) {
                Log.e("ChatScreen", "Error scrolling to bottom", e)
            }
        }
    }

    Column(
        modifier = modifier.fillMaxSize()
    ) {
        // Messages List
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = spacing.medium),
                verticalArrangement = Arrangement.spacedBy(spacing.small),
                contentPadding = PaddingValues(vertical = spacing.medium)
            ) {
                if (isLoading) {
                    item {
                        Box(
                            modifier = Modifier.fillMaxWidth(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }
                } else if (messages.isEmpty()) {
                    item {
                        EmptyChatMessage()
                    }
                } else {
                    items(messages) { message ->
                        ChatMessageItem(message = message)
                    }
                }
            }
        }

        // Message Input
        MessageInput(
            messageText = messageText,
            onMessageTextChange = { messageText = it },
            onSendClick = {
                if (messageText.isNotBlank() && !isSending) {
                    onSendMessage(messageText.trim())
                    messageText = ""
                }
            },
            isSending = isSending,
            modifier = Modifier.padding(spacing.medium)
        )
    }
}

@Composable
private fun EmptyChatMessage(
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "No messages yet.\nStart the conversation!",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun ChatMessageItem(
    message: ChatMessage,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = if (message.isFromCurrentUser) {
            Arrangement.End
        } else {
            Arrangement.Start
        }
    ) {
        Card(
            modifier = Modifier.widthIn(max = 280.dp),
            shape = RoundedCornerShape(
                topStart = 16.dp,
                topEnd = 16.dp,
                bottomStart = if (message.isFromCurrentUser) 4.dp else 16.dp,
                bottomEnd = if (message.isFromCurrentUser) 16.dp else 4.dp
            ),
            colors = CardDefaults.cardColors(
                containerColor = if (message.isFromCurrentUser) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.surfaceVariant
                }
            )
        ) {
            Column(
                modifier = Modifier.padding(spacing.medium)
            ) {
                if (!message.isFromCurrentUser) {
                    Text(
                        text = message.senderName,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(spacing.extraSmall))
                }

                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (message.isFromCurrentUser) {
                        MaterialTheme.colorScheme.onPrimary
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    }
                )

                Spacer(modifier = Modifier.height(spacing.extraSmall))

                Text(
                    text = formatTimestamp(message.timestamp),
                    style = MaterialTheme.typography.labelSmall,
                    color = if (message.isFromCurrentUser) {
                        MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f)
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    }
                )
            }
        }
    }
}

@Composable
private fun MessageInput(
    messageText: String,
    onMessageTextChange: (String) -> Unit,
    onSendClick: () -> Unit,
    isSending: Boolean = false,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(spacing.small)
    ) {
        OutlinedTextField(
            value = messageText,
            onValueChange = onMessageTextChange,
            modifier = Modifier.weight(1f),
            placeholder = {
                Text(
                    text = "Type a message...",
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            },
            maxLines = 4,
            shape = RoundedCornerShape(24.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
            )
        )

        FloatingActionButton(
            onClick = if (isSending) { {} } else { onSendClick },
            modifier = Modifier.size(48.dp),
            containerColor = if (isSending) MaterialTheme.colorScheme.primary.copy(alpha = 0.6f) else MaterialTheme.colorScheme.primary,
            contentColor = MaterialTheme.colorScheme.onPrimary
        ) {
            if (isSending) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    strokeWidth = 2.dp,
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Send,
                    contentDescription = "Send message",
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
private fun ResourceItem(
    resource: Resource,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current
    val context = LocalContext.current

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = spacing.small, vertical = spacing.extraSmall)
            .background(
                color = MaterialTheme.colorScheme.primaryContainer,
                shape = RoundedCornerShape(8.dp)
            )
            .padding(spacing.medium)
    ) {
        Column {
            Text(
                text = resource.resourceName,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                fontWeight = FontWeight.Medium
            )
            Spacer(modifier = Modifier.height(spacing.extraSmall))
            Text(
                text = resource.link,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.clickable {
                    try {
                        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(resource.link))
                        context.startActivity(intent)
                    } catch (e: Exception) {
                        Toast.makeText(context, "Could not open link", Toast.LENGTH_SHORT).show()
                    }
                }
            )
        }
    }
}

private fun formatTimestamp(timestamp: Long): String {
    val now = System.currentTimeMillis()
    val diff = now - timestamp

    return when {
        diff < 60000 -> "Just now" // Less than 1 minute
        diff < 3600000 -> "${diff / 60000}m ago" // Less than 1 hour
        diff < 86400000 -> "${diff / 3600000}h ago" // Less than 1 day
        else -> "${diff / 86400000}d ago" // More than 1 day
    }
}
