// const { parse } = require("./simple-search-parser");

const peg = require("pegjs");
const fs = require("fs");

const { parse } = peg.generate(
  fs.readFileSync("./grammar/simple-search.grammar").toString()
);

const SKIP = "skip";

describe("simple-search-parser", () => {
  const queries = [
    [
      "single keyword",
      "alpha",
      {
        type: "term",
        value: "alpha",
      },
    ],
    [
      "single keyword phrase",
      '"alpha"',
      {
        type: "phrase",
        value: "alpha",
      },
    ],
    [
      "single keyword phrase with special characters",
      '"alpha AND beta"',
      {
        type: "phrase",
        value: "alpha AND beta",
      },
    ],
    [
      "simple conjunction",
      "alpha AND beta",
      {
        operator: "AND",
        left: { type: "term", value: "alpha" },
        right: { type: "term", value: "beta" },
      },
    ],
    [
      "simple conjunction with phrases",
      '"alpha" AND "beta"',
      {
        operator: "AND",
        left: { type: "phrase", value: "alpha" },
        right: { type: "phrase", value: "beta" },
      },
    ],
    [
      "3 ANDed terms should maintain all of them",
      "alpha AND beta AND gamma",
      {
        operator: "AND",
        left: { type: "term", value: "alpha" },
        right: {
          operator: "AND",
          left: { type: "term", value: "beta" },
          right: { type: "term", value: "gamma" },
        },
      },
    ],
    [
      "comma-delimited list of terms should be parsed as 3 ANDed terms",
      "alpha,beta,gamma",
      {
        operator: "AND",
        left: { type: "term", value: "alpha" },
        right: {
          operator: "AND",
          left: { type: "term", value: "beta" },
          right: { type: "term", value: "gamma" },
        },
      },
    ],
    [
      "comma-delimited list of terms with separating spaces should be parsed as 3 ANDed terms",
      "alpha, beta, gamma",
      {
        operator: "AND",
        left: { type: "term", value: "alpha" },
        right: {
          operator: "AND",
          left: { type: "term", value: "beta" },
          right: { type: "term", value: "gamma" },
        },
      },
    ],
    [
      "should treat AND as higher precedence than OR",
      "alpha OR beta AND gamma",
      {
        operator: "OR",
        left: { type: "term", value: "alpha" },
        right: {
          operator: "AND",
          left: { type: "term", value: "beta" },
          right: { type: "term", value: "gamma" },
        },
      },
    ],
    [
      "should treat AND as higher precedence than OR",
      "alpha OR beta AND gamma OR delta",
      {
        operator: "OR",
        left: {
          type: "term",
          value: "alpha",
        },
        right: {
          operator: "OR",
          left: {
            operator: "AND",
            left: {
              type: "term",
              value: "beta",
            },
            right: {
              type: "term",
              value: "gamma",
            },
          },
          right: {
            type: "term",
            value: "delta",
          },
        },
      },
    ],
    [
      "should treat 3 ORed terms as equal precedence ",
      "alpha OR beta OR gamma",
      {
        operator: "OR",
        left: { type: "term", value: "alpha" },
        right: {
          operator: "OR",
          left: { type: "term", value: "beta" },
          right: { type: "term", value: "gamma" },
        },
      },
    ],
    [
      "should treat a parentheses group containing an OR as higher precedence than AND",
      "(alpha OR beta) AND gamma",
      {
        operator: "AND",
        left: {
          operator: "OR",
          left: {
            type: "term",
            value: "alpha",
          },
          right: {
            type: "term",
            value: "beta",
          },
        },
        right: {
          type: "term",
          value: "gamma",
        },
      },
    ],
    [
      "should treat OR in a double-quoted string as a literal",
      'alpha AND "beta OR gamma"',
      {
        operator: "AND",
        left: { type: "term", value: "alpha" },
        right: { type: "phrase", value: "beta OR gamma" },
      },
    ],
    [
      "should treat all operators within a double-quoted string as literals",
      '"alpha AND beta OR gamma NOT delta"',
      {
        type: "phrase",
        value: "alpha AND beta OR gamma NOT delta",
      },
    ],
    [
      "should treat commas within double-quoted strings as literals",
      '"alpha,beta,gamma"',
      {
        type: "phrase",
        value: "alpha,beta,gamma",
      },
    ],
    [
      "should treat parentheses within double-quoted strings as literals",
      '"alpha(beta(gamma))"',
      {
        type: "phrase",
        value: "alpha(beta(gamma))",
      },
    ],
    [
      "should treat parentheses and comma combinations within double-quoted strings as literals",
      '"alpha,(beta,gamma),(delta,(epsilon))"',
      {
        type: "phrase",
        value: "alpha,(beta,gamma),(delta,(epsilon))",
      },
    ],
    [
      "should handle deeply-nested groups",
      "(a OR b) AND (c OR (d AND e))",
      {
        operator: "AND",
        left: {
          operator: "OR",
          left: {
            type: "term",
            value: "a",
          },
          right: {
            type: "term",
            value: "b",
          },
        },
        right: {
          operator: "OR",
          left: {
            type: "term",
            value: "c",
          },
          right: {
            operator: "AND",
            left: {
              type: "term",
              value: "d",
            },
            right: {
              type: "term",
              value: "e",
            },
          },
        },
      },
    ],
    [
      "should handle implied operators when combined with double-quoted strings",
      '"a,(b,c),d" AND e,f g',
      {
        // fill this in when we have a better idea of how groups will look
      },
      SKIP,
    ],
    [
      "should handle names that contain embedded commas",
      '"Smith, John L","Jones, Jane D"',
      {
        operator: "AND",
        left: { type: "phrase", value: "Smith, John L" },
        right: { type: "phrase", value: "Jones, Jane D" },
      },
    ],
    [
      "should handle names that contain pre-married names",
      '"Jones (Smith), Jane D"',
      {
        type: "phrase",
        value: "Jones (Smith), Jane D",
      },
    ],
    [
      "should parse comma-separated double-quoted strings as ANDed phrases",
      '"alpha","beta","gamma"',
      {
        operator: "AND",
        left: {
          type: "phrase",
          value: "alpha",
        },
        right: {
          operator: "AND",
          left: {
            type: "phrase",
            value: "beta",
          },
          right: {
            type: "phrase",
            value: "gamma",
          },
        },
      },
    ],
    [
      "should support double-quoted phrases combined with comma-separated terms",
      '"a OR b",c,d OR e',
      {
        operator: "OR",
        left: {
          operator: "AND",
          left: {
            type: "phrase",
            value: "a OR b",
          },
          right: {
            operator: "AND",
            left: {
              type: "term",
              value: "c",
            },
            right: {
              type: "term",
              value: "d",
            },
          },
        },
        right: {
          type: "term",
          value: "e",
        },
      },
    ],
    [
      "super complex",
      'a AND (b OR "c,d" AND ("e OR f"))',
      {
        operator: "AND",
        left: {
          type: "term",
          value: "a",
        },
        right: {
          operator: "OR",
          left: {
            type: "term",
            value: "b",
          },
          right: {
            operator: "AND",
            left: {
              type: "phrase",
              value: "c,d",
            },
            right: {
              type: "phrase",
              value: "e OR f",
            },
          },
        },
      },
    ],
  ];

  for (const [description, input, expected, run = "only"] of queries) {
    it[run](description, () => {
      expect(parse(input)).toEqual(expected);
    });
  }
});
