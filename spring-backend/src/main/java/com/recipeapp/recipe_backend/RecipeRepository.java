package com.recipeapp.recipe_backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    // Fetches globally ordered recipes (replaces old behavior)
    List<Recipe> findAllByOrderByCreatedAtDesc();

    // NEW: Fetches only the history belonging to a specific user id
    List<Recipe> findByUserIdOrderByCreatedAtDesc(Long userId);
}