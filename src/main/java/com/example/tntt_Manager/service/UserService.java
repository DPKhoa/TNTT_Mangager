package com.example.tntt_Manager.service;

import com.example.tntt_Manager.dto.request.CreateUserRequestDTO;
import com.example.tntt_Manager.dto.response.UserResponseDTO;

public interface UserService {

    UserResponseDTO createUser(CreateUserRequestDTO dto);
}
