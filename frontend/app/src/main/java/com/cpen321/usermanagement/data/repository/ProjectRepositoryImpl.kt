package com.cpen321.usermanagement.data.repository

import android.util.Log
import com.cpen321.usermanagement.data.remote.api.ProjectInterface
import com.cpen321.usermanagement.data.remote.dto.AddMembersByEmailRequest
import com.cpen321.usermanagement.data.remote.dto.AddMembersResponse
import com.cpen321.usermanagement.data.remote.dto.AddResourceRequest
import com.cpen321.usermanagement.data.remote.dto.ChatMessage
import com.cpen321.usermanagement.data.remote.dto.CreateProjectRequest
import com.cpen321.usermanagement.data.remote.dto.JoinProjectRequest
import com.cpen321.usermanagement.data.remote.dto.Project
import com.cpen321.usermanagement.data.remote.dto.SendMessageRequest
import com.cpen321.usermanagement.data.remote.dto.UpdateProjectRequest
import com.cpen321.usermanagement.utils.JsonUtils
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProjectRepositoryImpl @Inject constructor(
    private val projectInterface: ProjectInterface
) : ProjectRepository {

    companion object {
        private const val TAG = "ProjectRepository"
    }

    override suspend fun createProject(name: String, description: String?, memberEmails: List<String>): Result<Project> {
        val createProjectReq = CreateProjectRequest(
            name, 
            description, 
            if (memberEmails.isEmpty()) null else memberEmails
        )
        return try {
            val response = projectInterface.createProject(createProjectReq)
            if (response.isSuccessful && response.body()?.data != null) {
                val project = response.body()!!.data!!
                Log.d(TAG, "Project created successfully: ${project.id}")
                Result.success(project)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to create project."
                )
                Log.e(TAG, "Project creation failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during project creation", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during project creation", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during project creation", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during project creation: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun joinProject(invitationCode: String): Result<Project> {
        val joinProjectReq = JoinProjectRequest(invitationCode)
        return try {
            val response = projectInterface.joinProject(joinProjectReq)
            if (response.isSuccessful && response.body()?.data != null) {
                val project = response.body()!!.data!!
                Log.d(TAG, "Successfully joined project: ${project.id}")
                Result.success(project)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to join project."
                )
                Log.e(TAG, "Project join failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during project join", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during project join", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during project join", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during project join: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun getUserProjects(): Result<List<Project>> {
        return try {
            val response = projectInterface.getUserProjects()
            if (response.isSuccessful && response.body()?.data != null) {
                val projects = response.body()!!.data!!
                Log.d(TAG, "Retrieved ${projects.size} projects")
                Result.success(projects)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to retrieve projects."
                )
                Log.e(TAG, "Failed to retrieve projects: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during project retrieval", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during project retrieval", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during project retrieval", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during project retrieval: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun getProjectById(projectId: String): Result<Project> {
        return try {
            val response = projectInterface.getProjectById(projectId)
            if (response.isSuccessful && response.body()?.data != null) {
                val project = response.body()!!.data!!
                Log.d(TAG, "Retrieved project: ${project.id}")
                Result.success(project)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to retrieve project."
                )
                Log.e(TAG, "Failed to retrieve project: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during project retrieval", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during project retrieval", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during project retrieval", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during project retrieval: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun updateProject(projectId: String, name: String?, description: String?): Result<Project> {
        val updateProjectReq = UpdateProjectRequest(name, description)
        return try {
            val response = projectInterface.updateProject(projectId, updateProjectReq)
            if (response.isSuccessful && response.body()?.data != null) {
                val project = response.body()!!.data!!
                Log.d(TAG, "Project updated successfully: ${project.id}")
                Result.success(project)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to update project."
                )
                Log.e(TAG, "Project update failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during project update", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during project update", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during project update", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during project update: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun deleteProject(projectId: String): Result<Unit> {
        Log.d(TAG, "deleteProject called in repository with projectId: $projectId")
        return try {
            val response = projectInterface.deleteProject(projectId)
            Log.d(TAG, "Delete project response: ${response.code()}, isSuccessful: ${response.isSuccessful}")
            if (response.isSuccessful) {
                Log.d(TAG, "Project deleted successfully: $projectId")
                Result.success(Unit)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to delete project."
                )
                Log.e(TAG, "Project deletion failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during project deletion", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during project deletion", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during project deletion", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during project deletion: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun removeMember(projectId: String, userId: String): Result<Project> {
        return try {
            val response = projectInterface.removeMember(projectId, userId)
            if (response.isSuccessful && response.body()?.data != null) {
                val project = response.body()!!.data!!
                Log.d(TAG, "Member removed successfully from project: ${project.id}")
                Result.success(project)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to remove member."
                )
                Log.e(TAG, "Remove member failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during remove member", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during remove member", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during remove member", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during remove member: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun addResource(projectId: String, resourceName: String, link: String): Result<Project> {
        val addResourceReq = AddResourceRequest(resourceName, link)
        return try {
            val response = projectInterface.addResource(projectId, addResourceReq)
            if (response.isSuccessful && response.body()?.data != null) {
                val project = response.body()!!.data!!
                Log.d(TAG, "Successfully added resource to project: ${project.id}")
                Result.success(project)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to add resource."
                )
                Log.e(TAG, "Add resource failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during add resource", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during add resource", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during add resource", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during add resource: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun sendMessage(projectId: String, content: String): Result<ChatMessage> {
        val sendMessageReq = SendMessageRequest(content)
        return try {
            val response = projectInterface.sendMessage(projectId, sendMessageReq)
            if (response.isSuccessful && response.body()?.data != null) {
                val message = response.body()!!.data!!
                Log.d(TAG, "Message sent successfully: ${message.id}")
                Result.success(message)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to send message."
                )
                Log.e(TAG, "Send message failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during send message", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during send message", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during send message", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during send message: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun getMessages(projectId: String): Result<List<ChatMessage>> {
        return try {
            val response = projectInterface.getMessages(projectId)
            if (response.isSuccessful && response.body()?.data != null) {
                val messages = response.body()!!.data!!
                Log.d(TAG, "Retrieved ${messages.size} messages for project: $projectId")
                Result.success(messages)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to retrieve messages."
                )
                Log.e(TAG, "Failed to retrieve messages: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during get messages", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during get messages", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during get messages", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during get messages: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun deleteMessage(projectId: String, messageId: String): Result<Unit> {
        return try {
            val response = projectInterface.deleteMessage(projectId, messageId)
            if (response.isSuccessful) {
                Log.d(TAG, "Message deleted successfully: $messageId")
                Result.success(Unit)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to delete message."
                )
                Log.e(TAG, "Message deletion failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during delete message", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during delete message", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during delete message", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during delete message: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun addMembersByEmail(projectId: String, emails: List<String>): Result<AddMembersResponse> {
        val addMembersReq = AddMembersByEmailRequest(emails)
        return try {
            val response = projectInterface.addMembersByEmail(projectId, addMembersReq)
            if (response.isSuccessful && response.body()?.data != null) {
                val result = response.body()!!.data!!
                Log.d(TAG, "Members added successfully to project: $projectId")
                Log.d(TAG, "Successfully added: ${result.successfullyAdded.size}, Not found: ${result.notFound.size}, Already members: ${result.alreadyMembers.size}")
                Result.success(result)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to add members."
                )
                Log.e(TAG, "Add members failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during add members", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during add members", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during add members", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during add members: ${e.code()}", e)
            Result.failure(e)
        }
    }
}
