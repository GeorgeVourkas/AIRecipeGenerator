package com.recipeapp.recipe_backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
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

    // ── Generate ──────────────────────────────────────────────────────────────

    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody Map<String, String> body) {

        String ingredients = body.get("ingredients");

        if (ingredients == null || ingredients.isBlank()) {
            return ResponseEntity
                .badRequest()
                .body(Map.of("error", "ingredients field is required"));
        }

        // Build headers
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build request body
        Map<String, Object> aiRequest = Map.of(
            "model", MODEL,
            "max_tokens", 1024,
            "system", "You are an assistant that receives a list of ingredients and suggests a recipe. Format your response in markdown.",
            "messages", List.of(Map.of(
                "role", "user",
                "content", "I have " + ingredients + ". Please give me a recipe!"
            ))
        );

        // Call Claude
        ResponseEntity<Map> aiResponse;
        try {
            aiResponse = restTemplate.postForEntity(
                ANTHROPIC_URL,
                new HttpEntity<>(aiRequest, headers),
                Map.class
            );
        } catch (HttpClientErrorException e) {
            System.err.println("Anthropic API error: " + e.getResponseBodyAsString());
            return ResponseEntity
                .status(e.getStatusCode())
                .body(Map.of("error", "AI service error: " + e.getResponseBodyAsString()));
        } catch (Exception e) {
            System.err.println("Unexpected error calling Anthropic: " + e.getMessage());
            return ResponseEntity
                .internalServerError()
                .body(Map.of("error", "Unexpected error: " + e.getMessage()));
        }

        // Extract text
        try {
            List<Map<String, Object>> content =
                (List<Map<String, Object>>) aiResponse.getBody().get("content");
            String recipeText = (String) content.get(0).get("text");

            Recipe recipe = new Recipe();
            recipe.setContent(recipeText);
            Recipe saved = recipeRepository.save(recipe);

            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            System.err.println("Failed to parse AI response: " + e.getMessage());
            return ResponseEntity
                .internalServerError()
                .body(Map.of("error", "Failed to parse AI response"));
        }
    }

    // ── History ───────────────────────────────────────────────────────────────

    @GetMapping("/history")
    public ResponseEntity<List<Recipe>> history() {
        return ResponseEntity.ok(recipeRepository.findAllByOrderByCreatedAtDesc());
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!recipeRepository.existsById(id)) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Recipe not found with id: " + id));
        }
        recipeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}