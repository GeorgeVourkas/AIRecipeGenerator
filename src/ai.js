export async function getRecipeFromChefClaude(ingredientsArr) {
    const ingredientsString = ingredientsArr.join(", ")

    const response = await fetch("http://localhost:8080/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientsString })
    })

    const data = await response.json()
    return data.content
}