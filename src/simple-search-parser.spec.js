const { parse } = require("./simple-search-parser");

describe("simple-search-parser", () => {
  const queries = [
    [
      "single keyword",
      "alpha",
      {
        type: "term",
        value: "alpha"        
      }
    ],
    [
      "single keyword phrase",
      "\"alpha\"",
      {
        type: "phrase",
        value: "alpha"        
      }
    ],
    [
      "single keyword phrase with special characters",
      "\"alpha AND beta\"",
      {
        type: "phrase",
        value: "alpha AND beta"        
      }
    ],    
    [
      "simple conjunction",
      "alpha AND beta",
      {
        expr: {
          op: "AND",
          left: { type: "term", value: "alpha" },
          right: { type: "term", value: "beta" }
        }
      }
    ],
    [
      "simple conjunction with phrases",
      "\"alpha\" AND \"beta\"",
      {
        expr: {
          op: "AND",
          left: { type: "phrase", value: "alpha" },
          right: { type: "phrase", value: "beta" }
        }
      }
    ]
  ];
  for (const query of queries) {
    it(query[0], () => {
      expect(parse(query[1])).toEqual(query[2]);
    });
  };
});