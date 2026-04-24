package com.example.shop.service;

import com.example.shop.entity.User;
import com.example.shop.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User create(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already in use: " + user.getEmail());
        }
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now().toString());
        return userRepository.save(user);
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public User getById(String id) {
        return userRepository.findById(id).orElse(null);
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public User update(String id, User updated) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return null;

        user.setUserName(updated.getUserName());
        user.setEmail(updated.getEmail());
        user.setPhone(updated.getPhone());
        user.setRole(updated.getRole());

        return userRepository.save(user);
    }

    public void delete(String id) {
        User user = userRepository.findById(id).orElse(null);
        if (user != null) {
            user.setActive(false);
            user.setDeletedAt(LocalDateTime.now().toString());
            userRepository.save(user);
        }
    }
}
