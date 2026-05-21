import React from "react";
import IngredientsList from "../components/IngredientsList";
import ClaudeRecipe from "../components/ClaudeRecipe";
import { getRecipeFromChefClaude } from "../ai";
import Loading from "./Loading";
import ReactMarkdown from "react-markdown";
import ConfirmDeletion from "./ConfirmDeletion";
import Fuse from "fuse.js";

const fuseOptions = {
  keys: ["content"],
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export default function Main() {
  const [ingredients, setIngredients] = React.useState([]);
  const [recipe, setRecipe] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [history, setHistory] = React.useState([]);
  const [showHistory, setShowHistory] = React.useState(false);
  const [deletionProccess, setDeletionProccess] = React.useState(false);
  const recipeSection = React.useRef(null);
  const [toast, setToast] = React.useState("");
  const [selectedRecipeId, setSelectedRecipeId] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  //Messages
  const recipeLoadingMessage = "Please wait. Chef is writing you a recipe!";
  const deletionTitleMessage = "Recipe Deletion";
  const deletionDetailsMessage = "Are you sure you want to delete this recipe?";

  React.useEffect(() => {
    fetch("http://localhost:8080/api/recipes/history")
      .then((res) => res.json())
      .then((data) => setHistory(data));
  }, []);

  async function deleteRecipe(id) {
    await fetch(`http://localhost:8080/api/recipes/${id}`, {
      method: "DELETE",
    });
    setHistory((prev) => prev.filter((r) => r.id !== id));
    setToast("Recipe deleted!");
    setTimeout(() => setToast(""), 3000);
  }

  async function getRecipe() {
    setLoading(true);
    const recipeMarkdown = await getRecipeFromChefClaude(ingredients);
    setRecipe(recipeMarkdown);
    fetch("http://localhost:8080/api/recipes/history")
      .then((res) => res.json())
      .then((data) => setHistory(data));
    setLoading(false);
  }

  function addIngredient(formData) {
    const newIngredient = formData.get("ingredient");
    if (newIngredient != "") {
      setIngredients((prevIngredients) => [...prevIngredients, newIngredient]);
    }
  }

  function resetForm() {
    setRecipe(false);
    setIngredients([]);
  }

  if (showHistory) {
    const fuse = new Fuse(history, fuseOptions);
    const displayedRecipes = searchQuery
      ? fuse.search(searchQuery).map((result) => result.item)
      : history;

    return (
      <main className="recipes-history-main">
        {toast && <div className="notification">{toast}</div>}
        <nav className="navigation">
          <button
            onClick={() => setShowHistory(false)}
            className="navigation-btn"
          >
            &#8592;
          </button>
        </nav>
        <div className="historySearchHeader">
          <h2>Recipe History</h2>{" "}
          <div className="custom-search-bar">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery!='' && <button onClick={()=>{setSearchQuery('')}} className="search-clear-button">&#x2715;</button>}
          </div>
        </div>

        {history.length === 0 && <p>No recipes saved yet!</p>}

        {deletionProccess && (
          <ConfirmDeletion
            title={deletionTitleMessage}
            message={deletionDetailsMessage}
            recipeId={selectedRecipeId}
            onDelete={deleteRecipe}
            onCancel={() => setDeletionProccess(false)}
          />
        )}

        <div className="recipes-container">
          {displayedRecipes.map((r) => (
            <div key={r.id} className="recipe-wrapper">
              <p style={{ fontSize: "12px", color: "gray" }}>
                {new Date(r.createdAt).toLocaleString()}
              </p>
              <ReactMarkdown>{r.content}</ReactMarkdown>
              <div className="wrapper-footer">
                <button
                  className="recipe-history-delete-btn"
                  onClick={() => {
                    setSelectedRecipeId(r.id);
                    setDeletionProccess(true);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main>
      <nav className="navigation">
        <button onClick={() => setShowHistory(true)} className="navigation-btn">
          📚 Recipe Library
        </button>
      </nav>
      <form action={addIngredient} className="add-ingredient-form">
        <input
          type="text"
          placeholder="e.g. oregano"
          aria-label="Add ingredient"
          name="ingredient"
        />

        <button>Add ingredient</button>
      </form>

      {ingredients.length > 0 && (
        <IngredientsList
          ingredients={ingredients}
          getRecipe={getRecipe}
          ref={recipeSection}
        />
      )}
      <nav className="navigation">
        {recipe && (
          <button className="reset-btn" onClick={resetForm}>
            ↺ Reset Recipe
          </button>
        )}
      </nav>
      {loading && <Loading message={recipeLoadingMessage} />}
      {recipe && <ClaudeRecipe recipe={recipe} />}
    </main>
  );
}
