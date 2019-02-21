const initialState = {};

const setSuggestQuery = (state, action) => {
  return {
    ...state,
    ...action.suggestQuery
  };
};

const setSuggestQueryField = (state, action) => {
  // Clear the suggestQueryField data only if the search field has been cleared.
  if (action.newFields.filter(field => field.field === "tm_rendered_item" && field.value ==="").length) {
    return Object.assign({},
      ...state,
      {
        suggestQuery: {
          value: ""
        }
      },
    );
  }
  return {
    ...state
  };
};

export default function (state = initialState, action) {
  switch (action.type) {
    case "SET_SUGGEST_QUERY":
      return setSuggestQuery(state, action);
    case "SET_SEARCH_FIELDS":
      return setSuggestQueryField(state, action);
  }

  return state;
}
