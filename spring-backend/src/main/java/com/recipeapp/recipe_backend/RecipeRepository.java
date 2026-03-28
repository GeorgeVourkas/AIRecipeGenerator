package com.recipeapp.recipe_backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long>{
    List<Recipe> findAllByOrderByCreatedAtDesc();
}