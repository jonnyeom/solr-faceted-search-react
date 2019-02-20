const initialState = {};

const setSuggestQuery = (state, action) => {
  return {
    ...state,
    ...action.suggestQuery
  };
};

export default function (state = initialState, action) {
  switch (action.type) {
    case "SET_SUGGEST_QUERY":
      return setSuggestQuery(state, action);
  }

  return state;
}
