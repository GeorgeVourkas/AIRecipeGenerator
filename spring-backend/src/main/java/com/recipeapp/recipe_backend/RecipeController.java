package com.recipeapp.recipe_backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "http://localhost:5173")
public class RecipeController {

    @Autowired
    private RecipeRepository recipeRepository;

    @Value("${ANTHROPIC_API_KEY}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // generate recipe via AI + auto save to DB
    @PostMapping("/generate")
    public Recipe generate(@RequestBody Map<String, String> body) {
        String ingredients = body.get("ingredients");

        // call Claude AI
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> aiRequest = Map.of(
            "model", "claude-3-haiku-20240307",
            "max_tokens", 1024,
            "system", "You are an assistant that receives a list of ingredients and suggests a recipe. Format your response in markdown.",
            "messages", List.of(Map.of(
                "role", "user",
                "content", "I have " + ingredients + ". Please give me a recipe!"
            ))
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(aiRequest, headers);

        ResponseEntity<Map> aiResponse = restTemplate.postForEntity(
            "https://api.anthropic.com/v1/messages",
            request,
            Map.class
        );

        // extract text from response
        List<Map<String, Object>> content = (List<Map<String, Object>>) aiResponse.getBody().get("content");
        String recipeText = (String) content.get(0).get("text");

        // save to PostgreSQL
        Recipe recipe = new Recipe();
        recipe.setContent(recipeText);
        return recipeRepository.save(recipe);
    }

    // get all recipes (history)
    @GetMapping("/history")
    public List<Recipe> history() {
        return recipeRepository.findAllByOrderByCreatedAtDesc();
    }

    // delete a recipe
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        recipeRepository.deleteById(id);
    }
}