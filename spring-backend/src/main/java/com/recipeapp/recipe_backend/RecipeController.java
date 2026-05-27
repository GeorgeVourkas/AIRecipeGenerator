package com.recipeapp.recipe_backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "http://localhost:5173")
public class RecipeController {

    @Autowired
    private RecipeRepository recipeRepository;

    @Value("${anthropic.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-haiku-4-5-20251001";

    @PostMapping("/generate")
    public ResponseEntity<?> generate(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails) { 

        String ingredients = body.get("ingredients");
        if (ingredients == null || ingredients.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "ingredients field is required"));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> aiRequest = Map.of(
            "model", MODEL,
            "max_tokens", 1024,
            "system", "You are an assistant that receives a list of ingredients and suggests a recipe. Format your response in markdown.",
            "messages", List.of(Map.of("role", "user", "content", "I have " + ingredients + ". Please give me a recipe!"))
        );

        ResponseEntity<Map> aiResponse;
        try {
            aiResponse = restTemplate.postForEntity(ANTHROPIC_URL, new HttpEntity<>(aiRequest, headers), Map.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", "AI service error"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Unexpected error"));
        }

        try {
            List<Map<String, Object>> content = (List<Map<String, Object>>) aiResponse.getBody().get("content");
            String recipeText = (String) content.get(0).get("text");

            Recipe recipe = new Recipe();
            recipe.setContent(recipeText);
            if (userDetails != null) {
                recipe.setUser(userDetails.getUser());
            }

            Recipe saved = recipeRepository.save(recipe);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to parse AI response"));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<Recipe>> history(@AuthenticationPrincipal CustomUserDetails userDetails) {
        // If logged in, return personal history. Otherwise, keep it safe by returning nothing or global non-user items
        if (userDetails != null) {
            return ResponseEntity.ok(recipeRepository.findByUserIdOrderByCreatedAtDesc(userDetails.getUser().getId()));
        }
        return ResponseEntity.ok(List.of()); 
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Log in to delete recipes"));
        }

        return recipeRepository.findById(id)
            .map(recipe -> {
                // Ensure users can only delete their own recipes!
                if (recipe.getUser() == null || !recipe.getUser().getId().equals(userDetails.getUser().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized action"));
                }
                recipeRepository.delete(recipe);
                return ResponseEntity.noContent().build();
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Recipe not found")));
    }
}