import expect from "expect";

import suggestQueryReducer from "../../src/reducers/suggestQuery";

describe("suggestQueryReducer", () => { //eslint-disable-line no-undef

  it("should SET_SUGGEST_QUERY", () => {  //eslint-disable-line no-undef
    expect(suggestQueryReducer({
      init: "bar"
    }, {
      type: "SET_SUGGEST_QUERY",
      suggestQuery: {
        searchFields: ["x"],
        sortFields: ["y"],
        filters: ["z"],
        userpass: "userpass",
        mainQueryField: "field",
        start: 0,
        mode: "mode",
        url: "url",
        rows: 5,
        value: "value"
      }
    })).toEqual({
      searchFields: ["x"],
      sortFields: ["y"],
      filters: ["z"],
      userpass: "userpass",
      mainQueryField: "field",
      start: 0,
      mode: "mode",
      url: "url",
      rows: 5,
      value: "value"
    });
  });

  it("should clear the text search field on SET_SEARCH_FIELDS with mainQueryField empty", () => {  //eslint-disable-line no-undef
    expect(suggestQueryReducer({},
      {
        type: "SET_SEARCH_FIELDS",
        newFields: [{field: "tm_rendered_item", value: ""}]
      })).toEqual({
      suggestQuery: {
        value: ""
      }
    });
  });
});
