import expect from "expect";

import suggestionsReducer from "../../src/reducers/suggestions";

describe("suggestionsReducer", () => { //eslint-disable-line no-undef

  it("should SET_SUGGESTIONS", () => { //eslint-disable-line no-undef
    expect(suggestionsReducer({
      init: "bar",
      suggestionsPending: true
    }, {
      type: "SET_SUGGESTIONS",
      data: {
        response: {
          docs: ["123"]
        }
      }
    })).toEqual({
      init: "bar",
      docs: ["123"],
      suggestionsPending: false
    });
  });

  it("should SET_SUGGESTIONS_PENDING", () => { //eslint-disable-line no-undef
    expect(suggestionsReducer({
      init: "bar",
      suggestionsPending: false
    }, {
      type: "SET_SUGGESTIONS_PENDING"
    })).toEqual({
      init: "bar",
      suggestionsPending: true
    });
  });
});
