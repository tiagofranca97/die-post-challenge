interface Cocktails {
  drinks: Drink[];
}

interface Drink {
  'strInstructionsZH-HANS'?: null;
  'strInstructionsZH-HANT'?: null;
  dateModified?: string | null;
  idDrink: string;
  strAlcoholic: string;
  strCategory: string;
  strCreativeCommonsConfirmed: string;
  strDrink: string;
  strDrinkAlternate?: null;
  strDrinkThumb: string;
  strGlass: string;
  strIBA?: string | null;
  strImageAttribution?: string | null;
  strImageSource?: string | null;
  strIngredient1: string;
  strIngredient10?: null;
  strIngredient11?: null;
  strIngredient12?: null;
  strIngredient13?: null;
  strIngredient14?: null;
  strIngredient15?: null;
  strIngredient2: string;
  strIngredient3: string;
  strIngredient4?: string | null;
  strIngredient5?: string | null;
  strIngredient6?: null;
  strIngredient7?: null;
  strIngredient8?: null;
  strIngredient9?: null;
  strInstructions: string;
  strInstructionsDE?: string | null;
  strInstructionsES?: null;
  strInstructionsFR?: null;
  strInstructionsIT: string;
  strMeasure1: string;
  strMeasure10?: null;
  strMeasure11?: null;
  strMeasure12?: null;
  strMeasure13?: null;
  strMeasure14?: null;
  strMeasure15?: null;
  strMeasure2: string;
  strMeasure3: string;
  strMeasure4?: string | null;
  strMeasure5?: string | null;
  strMeasure6?: null;
  strMeasure7?: null;
  strMeasure8?: null;
  strMeasure9?: null;
  strTags: string;
  strVideo?: null;
}

// Fetch the cocktails by user's input
async function getCocktails(query: string, random?: boolean): Promise<Drink[]> {
  try {
    const response = await fetch(
      `https://www.thecocktaildb.com/api/json/v1/1/${!random ? 'search.php?s=' + query : 'random.php'}`,
    );
    const data: Cocktails = await response.json();
    return data?.drinks ?? [];
  } catch (error) {
    throw Error(`Ups! Couldn't fetch the ${!random ? 'cocktails' : 'random cocktail'} ...`);
  }
}

// Global vars so it can be possible to access these elements anywhere
let allDrinks: Drink[];
let input: HTMLInputElement;
let instructions: HTMLParagraphElement;
let keyboardIndex = -1;
let suggestions: HTMLUListElement;

document.addEventListener('DOMContentLoaded', () => {
  input = document.getElementById('cocktail-input') as HTMLInputElement;
  suggestions = document.getElementById('suggestions') as HTMLUListElement;
  instructions = document.getElementById('instructions') as HTMLParagraphElement;

  input.addEventListener('input', async () => {
    const query = input.value;
    // If the input's text is lower than 2 chars, it won't fetch data.
    // And it'll also clear the suggestion list & close it.
    if (query.length < 2) {
      toggleSuggestions('close');
      resetSuggestions();
      return;
    }

    allDrinks = [...(await getCocktails(query))];
    buildSuggestions(allDrinks, query);
  });

  // Purely for the random cocktail to show as suggestion when the input is clicked
  input.addEventListener('click', async () => {
    const query = input.value;
    if (!query.length) {
      allDrinks = [...(await getCocktails('', true))];
      buildSuggestions(allDrinks);
    } else {
      toggleSuggestions('open');
    }
  });

  // Whenever the input's "close" button is pressed
  input.addEventListener('search', async (event) => {
    resetInstructions();
  });

  // To track specifically a set of keys
  input.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.key === 'ArrowDown') {
      if (keyboardIndex < suggestions?.childElementCount - 1) {
        triggerKeyboardAction(true);
      }
    }
    if (event.key === 'ArrowUp') {
      if (keyboardIndex >= 1) {
        triggerKeyboardAction(false);
      }
    }
    if (event.key === 'Enter') {
      if (!suggestions?.childElementCount) return;

      const elementId = suggestions.children[keyboardIndex]?.id;
      const drink = allDrinks.filter((item) => item.idDrink === elementId)?.[0] ?? {};
      triggerSelection(document.getElementById(elementId) as HTMLLIElement, drink);
    }
  });
});

function triggerKeyboardAction(isArrowDown: boolean): void {
  if (isArrowDown) keyboardIndex++;
  else keyboardIndex--;

  resetKeyboardSelection();
  suggestions?.children[keyboardIndex]?.classList.add('keyboard-action');
  suggestions?.children[keyboardIndex]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function buildSuggestions(drinks: Drink[], query?: string): void {
  // Check if the array comes empty/null OR there are already suggestions and needs to be refreshed
  if (!drinks?.length || suggestions?.childElementCount) {
    resetSuggestions();
  }

  for (const drink of drinks) {
    suggestions.appendChild(createOption(drink, query));
  }

  // After any suggestion list's update, it also updates its visibility
  toggleSuggestions(suggestions?.childElementCount ? 'open' : 'close');
}

function createOption(drink: Drink, query?: string): HTMLLIElement {
  const li = document.createElement('li');
  li.id = drink?.idDrink;
  li.innerHTML = query?.length ? addHighlight(drink?.strDrink, query) : drink?.strDrink;
  // Enables the tab key event
  li.tabIndex = 0;
  li.addEventListener('click', () => {
    triggerSelection(li, drink);
  });
  li.addEventListener('keypress', (event) => {
    // When the TAB + ENTER keys are used to select an cocktail in the suggestion list
    event.stopPropagation();
    if (event.key === 'Enter') {
      triggerSelection(li, drink);
    }
  });
  return li;
}

function addHighlight(strDrink: string, query: string): string {
  if (!strDrink || !query) {
    return '';
  }

  // Purely to add an highlight to each option if matched with the input's text
  return strDrink.replace(new RegExp(query, 'gi'), (str) => `<strong>${str}</strong>`);
}

function triggerSelection(el: HTMLLIElement, drink: Drink): void {
  resetSelection();
  // Need to override the index after selecting a suggestion because the first item is the chosen/default one
  keyboardIndex = 0;
  // This makes the selected suggestion to be the first in the list and focus it
  el.parentNode?.insertBefore(el, suggestions?.firstChild);
  el.focus();
  el.ariaSelected = 'true';
  input.value = drink?.strDrink;
  toggleSuggestions('close');
  buildInstructions(drink);
}

function buildInstructions(drink: Drink): void {
  const description = document.createElement('p');
  description.textContent = drink?.strInstructions;
  instructions.innerHTML = '';
  instructions?.appendChild(description);
  instructions?.appendChild(createThumb(drink));
}

function createThumb(drink: Drink): HTMLImageElement {
  const img = document.createElement('img');
  img.src = drink?.strDrinkThumb;
  img.alt = drink?.strDrink;
  return img;
}

function toggleSuggestions(className: string): void {
  suggestions?.classList.remove(...suggestions.classList);
  suggestions?.classList.add(className);

  // For the case when the user uses the arrow keys but selects a suggestion with the mouse click
  if (className === 'close') resetKeyboardSelection();
}

function resetSelection(): void {
  for (const item of suggestions.children) {
    item.ariaSelected = 'false';
  }
}

function resetSuggestions(): void {
  suggestions.innerHTML = '';
  keyboardIndex = -1;
}

function resetKeyboardSelection(): void {
  for (const item of suggestions.children) {
    item.classList.remove('keyboard-action');
  }
}

function resetInstructions(): void {
  instructions.innerHTML = '';
}
