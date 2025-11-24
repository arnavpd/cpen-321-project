package com.cpen321.usermanagement.data.remote.dto

import java.util.Date

data class ProjectMember(
    val userId: String,
    val role: String, // "owner" or "user"
    val admin: Boolean,
    val joinedAt: String
)

data class Resource(
    val resourceName: String,
    val link: String
)

data class Project(
    val id: String,
    val name: String,
    val description: String,
    val invitationCode: String,
    val ownerId: String,
    val members: List<ProjectMember>,
    val resources: List<Resource> = emptyList(),
    val createdAt: String,
    val updatedAt: String,
    val isOwner: Boolean? = null,
    val isAdmin: Boolean? = null
)

data class CreateProjectRequest(
    val name: String,
    val description: String? = null,
    val memberEmails: List<String>? = null
)

data class UpdateProjectRequest(
    val name: String? = null,
    val description: String? = null
)

data class JoinProjectRequest(
    val invitationCode: String
)

data class AddResourceRequest(
    val resourceName: String,
    val link: String
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

data class SendMessageRequest(
    val content: String
)

data class AddMembersByEmailRequest(
    val memberEmails: List<String>
)

data class AddMembersResponse(
    val successfullyAdded: List<String>,
    val notFound: List<String>,
    val alreadyMembers: List<String>
)
