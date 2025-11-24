package com.cpen321.usermanagement.data.repository

import com.cpen321.usermanagement.data.remote.dto.AddMembersResponse
import com.cpen321.usermanagement.data.remote.dto.AddResourceRequest
import com.cpen321.usermanagement.data.remote.dto.ChatMessage
import com.cpen321.usermanagement.data.remote.dto.CreateProjectRequest
import com.cpen321.usermanagement.data.remote.dto.Project
import com.cpen321.usermanagement.data.remote.dto.UpdateProjectRequest

interface ProjectRepository {
    suspend fun createProject(name: String, description: String? = null, memberEmails: List<String> = emptyList()): Result<Project>
    suspend fun joinProject(invitationCode: String): Result<Project>
    suspend fun getUserProjects(): Result<List<Project>>
    suspend fun getProjectById(projectId: String): Result<Project>
    suspend fun updateProject(projectId: String, name: String? = null, description: String? = null): Result<Project>
    suspend fun deleteProject(projectId: String): Result<Unit>
    suspend fun removeMember(projectId: String, userId: String): Result<Project>
    suspend fun addResource(projectId: String, resourceName: String, link: String): Result<Project>
    suspend fun sendMessage(projectId: String, content: String): Result<ChatMessage>
    suspend fun getMessages(projectId: String): Result<List<ChatMessage>>
    suspend fun deleteMessage(projectId: String, messageId: String): Result<Unit>
    suspend fun addMembersByEmail(projectId: String, emails: List<String>): Result<AddMembersResponse>
}
