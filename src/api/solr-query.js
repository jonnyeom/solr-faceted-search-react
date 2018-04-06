const rangeFacetToQueryFilter = (field) => {
	const filters = field.value || [];
	if (filters.length < 2) {
		return null;
	}

	return encodeURIComponent(`${field.field}:[${filters[0]} TO ${filters[1]}]`);
};

const periodRangeFacetToQueryFilter = (field) => {
	const filters = field.value || [];
	if (filters.length < 2) {
		return null;
	}

	return encodeURIComponent(
		`${field.lowerBound}:[${filters[0]} TO ${filters[1]}] OR ` +
		`${field.upperBound}:[${filters[0]} TO ${filters[1]}] OR ` +
		`(${field.lowerBound}:[* TO ${filters[0]}] AND ${field.upperBound}:[${filters[1]} TO *])`
	);
};

const listFacetFieldToQueryFilter = (field) => {
	const filters = field.value || [];
	if (filters.length === 0) {
		return null;
	}

	const filterQ = filters.map((f) => `"${f}"`).join(" OR ");
	return encodeURIComponent(`${field.field}:(${filterQ})`);
};

const textFieldToQueryFilter = (field) => {
	if(!field.value || field.value.length === 0) {
		return null;
	}

	return encodeURIComponent(field.field === "*" ? field.value : `${field.field}:${field.value}`);
};

const fieldToQueryFilter = (field) => {
	if (field.type === "text") {
		return textFieldToQueryFilter(field);
	} else if (field.type === "list-facet") {
		return listFacetFieldToQueryFilter(field);
	} else if (field.type === "range-facet" || field.type === "range") {
		return rangeFacetToQueryFilter(field);
	} else if (field.type === "period-range-facet" || field.type === "period-range") {
		return periodRangeFacetToQueryFilter(field);
	}
	return null;
};

const buildQuery = (fields, mainQueryField) => fields
	// Do not include main query field in filter field query param.
  .filter((searchField) => (!Object.hasOwnProperty.call(searchField, "field") || (Object.hasOwnProperty.call(searchField, "field") && searchField.field !== mainQueryField)))
	.map(fieldToQueryFilter)
	.filter((queryFilter) => queryFilter !== null)
	.map((queryFilter) => `fq=${queryFilter}`)
	.join("&");

const facetFields = (fields) => fields
	.filter((field) => field.type === "list-facet" || field.type === "range-facet")
	.map((field) => `facet.field=${encodeURIComponent(field.field)}`)
	.concat(
		fields
			.filter((field) => field.type === "period-range-facet")
			.map((field) => `facet.field=${encodeURIComponent(field.lowerBound)}&facet.field=${encodeURIComponent(field.upperBound)}`)
	)
	.join("&");

const facetSorts = (fields) => fields
	.filter((field) => field.facetSort)
	.map((field) => `f.${encodeURIComponent(field.field)}.facet.sort=${field.facetSort}`)
	.join("&");

const buildSort = (sortFields) => sortFields
	.filter((sortField) => sortField.value)
	.map((sortField) => encodeURIComponent(`${sortField.field} ${sortField.value}`))
	.join(",");

const buildFormat = (format) => Object.keys(format)
	.map((key) => `${key}=${encodeURIComponent(format[key])}`)
	.join("&");

const buildMainQuery = (fields, mainQueryField) => {
  let qs = "q=";
  let params = fields.filter(function (searchField) {
    return searchField.field === mainQueryField;
  }).map(function (searchField) {
    return fieldToQueryFilter(searchField);
  });
  // If there are multiple main query fields, join them.
  if (params.length > 1) {
    qs += params.join("&");
  }
  // If there is only one main query field, add only it.
  else if (params.length === 1) {
    qs += params[0];
  }
  // If there are no main query fields, send the wildcard query.
  else {
    qs += "*:*";
  }
  return qs;
};

const buildHighlight = (highlight) => {
	let hlQs = "";
  // If highlight is set, then populate params from keys/values.
  if (highlight !== null && typeof highlight === "object") {
    let hlParams = "hl=on";

    for (const key of Object.keys(highlight)) {
			// Support nested objects like hl.simple.tags
      if (typeof highlight[key] === "object") {
        for (const nestedKey of Object.keys(highlight[key])) {
          hlParams += `&hl.${key}.${nestedKey}=${highlight[key][nestedKey]}`;
        }
      }
      // Support flat key/values like hl.fl=my_field_name
      else {
        hlParams += `&hl.${key}=${highlight[key]}`;
      }
    }

    hlQs = hlParams;
  }
  return hlQs;
};

const solrQuery = (query, format = {wt: "json"}) => {
	const {
			searchFields,
			sortFields,
			rows,
			start,
			facetLimit,
			facetSort,
			pageStrategy,
			cursorMark,
			idField,
			group,
			hl
		} = query;

	const mainQueryField = Object.hasOwnProperty.call(query, "mainQueryField") ? query.mainQueryField : null;

	const filters = (query.filters || []).map((filter) => ({...filter, type: filter.type || "text"}));
	const mainQuery = buildMainQuery(searchFields.concat(filters), mainQueryField);
  const queryParams = buildQuery(searchFields.concat(filters), mainQueryField);

	const facetFieldParam = facetFields(searchFields);
	const facetSortParams = facetSorts(searchFields);
	const facetLimitParam = `facet.limit=${facetLimit || -1}`;
	const facetSortParam = `facet.sort=${facetSort || "index"}`;

	const cursorMarkParam = pageStrategy === "cursor" ? `cursorMark=${encodeURIComponent(cursorMark || "*")}` : "";
	const idSort = pageStrategy === "cursor" ? [{field: idField, value: "asc"}] : [];

	const sortParam = buildSort(sortFields.concat(idSort));
	const groupParam = group && group.field ? `group=on&group.field=${encodeURIComponent(group.field)}` : "";
  const highlightParam = buildHighlight(hl);

	return mainQuery +
		`&${queryParams.length > 0 ? queryParams : ""}` +
		`${sortParam.length > 0 ? `&sort=${sortParam}` : ""}` +
		`${facetFieldParam.length > 0 ? `&${facetFieldParam}` : ""}` +
		`${facetSortParams.length > 0 ? `&${facetSortParams}` : ""}` +
		`${groupParam.length > 0 ? `&${groupParam}` : ""}` +
		`&rows=${rows}` +
		`&${facetLimitParam}` +
		`&${facetSortParam}` +
		`&${cursorMarkParam}` +
		(start === null ? "" : `&start=${start}`) +
		"&facet=on" +
		(highlightParam === "" ? "" : `&${highlightParam}`) +
		`&${buildFormat(format)}`;
};

export default solrQuery;


export {
	rangeFacetToQueryFilter,
	periodRangeFacetToQueryFilter,
	listFacetFieldToQueryFilter,
	textFieldToQueryFilter,
	fieldToQueryFilter,
	buildQuery,
	facetFields,
	facetSorts,
	buildSort,
	solrQuery
};
