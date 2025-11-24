package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.AddMembersByEmailRequest
import com.cpen321.usermanagement.data.remote.dto.AddMembersResponse
import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.AddResourceRequest
import com.cpen321.usermanagement.data.remote.dto.ChatMessage
import com.cpen321.usermanagement.data.remote.dto.CreateProjectRequest
import com.cpen321.usermanagement.data.remote.dto.JoinProjectRequest
import com.cpen321.usermanagement.data.remote.dto.Project
import com.cpen321.usermanagement.data.remote.dto.SendMessageRequest
import com.cpen321.usermanagement.data.remote.dto.UpdateProjectRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface ProjectInterface {
    @POST("projects")
    suspend fun createProject(@Body request: CreateProjectRequest): Response<ApiResponse<Project>>

    @POST("projects/join")
    suspend fun joinProject(@Body request: JoinProjectRequest): Response<ApiResponse<Project>>

    @GET("projects")
    suspend fun getUserProjects(): Response<ApiResponse<List<Project>>>

    @GET("projects/{projectId}")
    suspend fun getProjectById(@Path("projectId") projectId: String): Response<ApiResponse<Project>>

    @PUT("projects/{projectId}")
    suspend fun updateProject(
        @Path("projectId") projectId: String,
        @Body request: UpdateProjectRequest
    ): Response<ApiResponse<Project>>

    @DELETE("projects/{projectId}")
    suspend fun deleteProject(@Path("projectId") projectId: String): Response<ApiResponse<Unit>>

    @DELETE("projects/{projectId}/members/{userId}")
    suspend fun removeMember(
        @Path("projectId") projectId: String,
        @Path("userId") userId: String
    ): Response<ApiResponse<Project>>

    @POST("projects/{projectId}/resources")
    suspend fun addResource(
        @Path("projectId") projectId: String,
        @Body request: AddResourceRequest
    ): Response<ApiResponse<Project>>

    @POST("chat/{projectId}/messages")
    suspend fun sendMessage(
        @Path("projectId") projectId: String,
        @Body request: SendMessageRequest
    ): Response<ApiResponse<ChatMessage>>

    @GET("chat/{projectId}/messages")
    suspend fun getMessages(@Path("projectId") projectId: String): Response<ApiResponse<List<ChatMessage>>>

    @DELETE("chat/{projectId}/messages/{messageId}")
    suspend fun deleteMessage(
        @Path("projectId") projectId: String,
        @Path("messageId") messageId: String
    ): Response<ApiResponse<Unit>>

    @POST("projects/{projectId}/members/add-by-email")
    suspend fun addMembersByEmail(
        @Path("projectId") projectId: String,
        @Body request: AddMembersByEmailRequest
    ): Response<ApiResponse<AddMembersResponse>>
}
