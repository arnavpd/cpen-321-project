package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.cpen321.usermanagement.data.remote.dto.Project
import com.cpen321.usermanagement.ui.navigation.NavigationStateManager
import com.cpen321.usermanagement.ui.theme.LocalSpacing
import com.cpen321.usermanagement.ui.viewmodels.ProjectViewModel
import android.util.Log

@Composable
fun HomePage(
    navigationStateManager: NavigationStateManager,
    projectViewModel: ProjectViewModel,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current
    val uiState by projectViewModel.uiState.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }
    var showJoinDialog by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    // Debug logging for state changes
    LaunchedEffect(uiState.projects.size, uiState.projects) {
        Log.d("HomePage", "Projects list updated: ${uiState.projects.size} projects")
        uiState.projects.forEachIndexed { index, project ->
            Log.d("HomePage", "Project $index: ${project.name}")
        }
    }

    // Clear messages and refresh projects when component is first composed
    LaunchedEffect(Unit) {
        projectViewModel.clearMessages()
        projectViewModel.loadUserProjects()
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(spacing.medium),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Top
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(spacing.medium)
        ) {
            Button(
                onClick = { 
                    Log.d("HomePage", "Clicked Create New Project")
                    if (!uiState.isCreating) {
                        showCreateDialog = true
                    }
                },
                modifier = Modifier
                    .weight(1f)
                    .padding(vertical = spacing.small),
                enabled = !uiState.isCreating
            ) {
                if (uiState.isCreating) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Create New Project")
                }
            }
            
            Button(
                onClick = { 
                    Log.d("HomePage", "Join Existing Project")
                    showJoinDialog = true
                },
                modifier = Modifier
                    .weight(1f)
                    .padding(vertical = spacing.small)
            ) {
                Text("Join Existing Project")
            }
        }
        
        // Project list below the buttons
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = spacing.large)
        ) {
            Text(
                text = "Projects (${uiState.projects.size}):",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(bottom = spacing.small)
            )
            
            if (uiState.isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(spacing.medium),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (uiState.projects.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(spacing.medium),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No projects yet. Create your first project!",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(spacing.small)
                ) {
                    items(uiState.projects.size, key = { index -> "${uiState.projects[index].id}-$refreshTrigger" }) { index ->
                        val project = uiState.projects[index]
                        Log.d("HomePage", "Rendering project $index: ${project.name}")
                        ProjectItem(
                            project = project,
                            onProjectClick = {
                                Log.d("HomePage", "Project clicked: ${project.id}")
                                projectViewModel.selectProject(project)
                                navigationStateManager.navigateToProjectView()
                            }
                        )
                    }
                }
            }
        }
    }

    // Create Project Dialog
    if (showCreateDialog) {
        CreateProjectDialog(
            onDismiss = { showCreateDialog = false },
            onCreateProject = { name, description, memberEmails ->
                projectViewModel.createProject(name, description, memberEmails)
            },
            isCreating = uiState.isCreating,
            onProjectCreated = { 
                showCreateDialog = false
                // Force refresh projects after dialog closes
                projectViewModel.loadUserProjects()
                refreshTrigger++ // Trigger recomposition
            }
        )
    }

    // Join Project Dialog
    if (showJoinDialog) {
        JoinProjectDialog(
            onDismiss = { 
                showJoinDialog = false
                projectViewModel.clearMessages() // Clear any error messages when dismissing
            },
            onJoinProject = { code ->
                Log.d("HomePage", "Joining project with code: $code")
                projectViewModel.joinProject(code)
                // Don't close dialog immediately - let user see success/error message
            },
            errorMessage = uiState.errorMessage,
            isJoining = uiState.isCreating
        )
    }

    // Close join dialog on successful join
    LaunchedEffect(uiState.message) {
        if (uiState.message == "Successfully joined project") {
            showJoinDialog = false
            projectViewModel.clearMessages()
            // Force refresh projects after successful join
            projectViewModel.loadUserProjects()
            refreshTrigger++ // Trigger recomposition
        }
    }
}

@Composable
private fun ProjectItem(
    project: Project,
    onProjectClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = spacing.small, vertical = spacing.extraSmall)
            .background(
                color = MaterialTheme.colorScheme.primaryContainer,
                shape = RoundedCornerShape(8.dp)
            )
            .clickable { onProjectClick() }
            .padding(spacing.medium)
    ) {
        Column {
            Text(
                text = project.name,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                fontWeight = FontWeight.Medium
            )
            if (project.description.isNotEmpty()) {
                Spacer(modifier = Modifier.height(spacing.extraSmall))
                Text(
                    text = project.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                )
            }
            Spacer(modifier = Modifier.height(spacing.extraSmall))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = if (project.isOwner == true) "Owner" else "Member",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                )
                Text(
                    text = "Code: ${project.invitationCode}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                )
            }
        }
    }
}

@Composable
private fun CreateProjectDialog(
    onDismiss: () -> Unit,
    onCreateProject: (String, String?, List<String>) -> Unit,
    isCreating: Boolean,
    onProjectCreated: () -> Unit,
    modifier: Modifier = Modifier
) {
    var projectName by remember { mutableStateOf("") }
    var projectDescription by remember { mutableStateOf("") }
    var memberEmails by remember { mutableStateOf(listOf<String>()) }
    var currentEmailInput by remember { mutableStateOf("") }
    var emailError by remember { mutableStateOf<String?>(null) }
    var hasCreatedProject by remember { mutableStateOf(false) }

    // Email validation pattern
    val emailPattern = remember {
        android.util.Patterns.EMAIL_ADDRESS
    }

    fun isValidEmail(email: String): Boolean {
        return emailPattern.matcher(email.trim()).matches()
    }

    fun addEmail() {
        val trimmedEmail = currentEmailInput.trim()
        if (trimmedEmail.isEmpty()) {
            emailError = "Email cannot be empty"
            return
        }
        if (!isValidEmail(trimmedEmail)) {
            emailError = "Invalid email format"
            return
        }
        if (memberEmails.contains(trimmedEmail.lowercase())) {
            emailError = "Email already added"
            return
        }
        memberEmails = memberEmails + trimmedEmail.lowercase()
        currentEmailInput = ""
        emailError = null
    }

    fun removeEmail(email: String) {
        memberEmails = memberEmails.filter { it != email }
    }

    // Close dialog when project creation is successful
    LaunchedEffect(isCreating) {
        if (!isCreating && hasCreatedProject) {
            onProjectCreated()
        }
    }

    AlertDialog(
        onDismissRequest = { if (!isCreating) onDismiss() },
        title = {
            Text("Create New Project")
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = projectName,
                    onValueChange = { projectName = it },
                    label = { Text("Project Name") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isCreating
                )
                OutlinedTextField(
                    value = projectDescription,
                    onValueChange = { projectDescription = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isCreating,
                    maxLines = 3
                )
                
                // Add Members section
                Text(
                    text = "Add Members (Optional)",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(top = 8.dp)
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = currentEmailInput,
                        onValueChange = { 
                            currentEmailInput = it
                            emailError = null
                        },
                        label = { Text("Enter email address") },
                        placeholder = { Text("user@example.com") },
                        modifier = Modifier.weight(1f),
                        enabled = !isCreating,
                        isError = emailError != null,
                        singleLine = true
                    )
                    Button(
                        onClick = { addEmail() },
                        enabled = !isCreating && currentEmailInput.isNotBlank()
                    ) {
                        Text("Add")
                    }
                }
                
                if (emailError != null) {
                    Text(
                        text = emailError!!,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                
                // Display added emails
                if (memberEmails.isNotEmpty()) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "Added members (${memberEmails.size}):",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        memberEmails.forEach { email ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = email,
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.weight(1f)
                                )
                                TextButton(
                                    onClick = { removeEmail(email) },
                                    enabled = !isCreating
                                ) {
                                    Text("Remove")
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (projectName.isNotBlank() && !isCreating && !hasCreatedProject) {
                        Log.d("HomePage", "Dialog: Creating project: $projectName with ${memberEmails.size} members")
                        hasCreatedProject = true
                        onCreateProject(projectName, projectDescription.ifBlank { null }, memberEmails)
                    }
                },
                enabled = projectName.isNotBlank() && !isCreating
            ) {
                if (isCreating) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Create")
                }
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isCreating
            ) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun JoinProjectDialog(
    onDismiss: () -> Unit,
    onJoinProject: (String) -> Unit,
    errorMessage: String?,
    isJoining: Boolean,
    modifier: Modifier = Modifier
) {
    var projectCode by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = { if (!isJoining) onDismiss() },
        title = {
            Text("Join Existing Project")
        },
        text = {
            Column {
                OutlinedTextField(
                    value = projectCode,
                    onValueChange = { 
                        if (it.length <= 8) {
                            projectCode = it
                        }
                    },
                    label = { Text("Project Code") },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Enter project invitation code") },
                    maxLines = 1,
                    singleLine = true,
                    enabled = !isJoining
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
                    if (projectCode.isNotBlank() && !isJoining) {
                        Log.d("HomePage", "Dialog: Joining project with code: $projectCode")
                        onJoinProject(projectCode)
                    }
                },
                enabled = projectCode.isNotBlank() && !isJoining
            ) {
                if (isJoining) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Join")
                }
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isJoining
            ) {
                Text("Cancel")
            }
        }
    )
}
