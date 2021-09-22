// const { parse } = require("./simple-search-parser");

const peg = require('pegjs');
const fs = require('fs');

const { parse } = peg.generate(fs.readFileSync('./grammar/simple-search.grammar').toString());

const SKIP = 'skip';

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
    ],
    [
      "3 ANDed terms should maintain all of them",
      "alpha AND beta AND gamma",
      {
        expr: {
          op: "AND",
          left: { type: "term", value: "alpha" },
          right: {
            expr: {
              op: "AND",
              left: { type: "term", value: "beta" },
              right: { type: "term", value: "gamma" }
            }
          }
        }
      },
    ],
    [
      "comma-delimited list of terms should be parsed as 3 ANDed terms",
      "alpha,beta,gamma",
      {
        expr: {
          op: "AND",
          left: { type: "term", value: "alpha" },
          right: {
            expr: {
              op: "AND",
              left: { type: "term", value: "beta" },
              right: { type: "term", value: "gamma" }
            }
          }
        }
      },
      SKIP
    ],
    [
      "comma-delimited list of terms with separating spaces should be parsed as 3 ANDed terms",
      "alpha, beta, gamma",
      {
        expr: {
          op: "AND",
          left: { type: "term", value: "alpha" },
          right: {
            expr: {
              op: "AND",
              left: { type: "term", value: "beta" },
              right: { type: "term", value: "gamma" }
            }
          }
        }
      },
      SKIP
    ],
    [
      "should treat AND as higher precedence than OR",
      "alpha OR beta AND gamma",
      { // update this with proper expected
        expr: {
          op: "AND",
          left: { type: "term", value: "alpha" },
          right: {type: "term", value: "beta" },
        }
      },
      SKIP
    ],
    [
      "should treat 3 ORed terms as equal precedence ",
      "alpha OR beta OR gamma",
      {
        expr: {
          op: "OR",
          left: { type: "term", value: "alpha" },
          right: {
            expr: {
              op: "OR",
              left: { type: "term", value: "beta" },
              right: { type: "term", value: "gamma" }
            }
          }
        }
      },
    ],
    [
      "should treat a parentheses group containing an OR as higher precedence than AND",
      "(alpha OR beta) AND gamma",
      {
        expr: {
          op: "OR",
          left: { type: "term", value: "alpha" },
          right: {
            expr: {
              op: "OR",
              left: { type: "term", value: "beta" },
              right: { type: "term", value: "gamma" }
            }
          }
        }
      },
      SKIP
    ],
    [
      "should treat OR in a double-quoted string as a literal",
      "alpha AND \"beta OR gamma\"",
      {
        expr: {
          op: "AND",
          left: { type: "term", value: "alpha" },
          right: { type: "phrase", value: "beta OR gamma" }
        }
      }
    ],
    [
      "should treat all operators within a double-quoted string as literals",
      "\"alpha AND beta OR gamma NOT delta\"",
      {
        type: "phrase",
        value: "\"alpha AND beta OR gamma NOT delta\""        
      },
      SKIP
    ],
    [
      "should treat commas within double-quoted strings as literals",
      "\"alpha,beta,gamma\"",
      {
        type: "phrase",
        value: "\"alpha,beta,gamma\""        
      },
      SKIP
    ],
    [
      "should treat parentheses within double-quoted strings as literals",
      "\"alpha(beta(gamma))\"",
      {
        type: "phrase",
        value: "\"alpha(beta(gamma))\""        
      },
      SKIP
    ],
    [
      "should treat parentheses and comma combinations within double-quoted strings as literals",
      "\"alpha,(beta,gamma),(delta,(epsilon))\"",
      {
        type: "phrase",
        value: "\"alpha,(beta,gamma),(delta,(epsilon))\""        
      },
      SKIP
    ],
    [
      "should handle deeply-nested groups",
      "(a OR b) AND (c OR (d AND e))",
      {
        // fill this in when we have a better idea of how groups will look
      },
      SKIP
    ],
    [
      "should handle implied operators when combined with double-quoted strings",
      "\"a,(b,c),d\" AND e,f g",
      {
        // fill this in when we have a better idea of how groups will look
      },
      SKIP
    ],
    [
      "should handle names that contain embedded commas",
      "\"Smith, John L\",\"Jones, Jane D\"",
      {
        expr: {
          op: "AND",
          left: { type: "phrase", value: "Smith, John L" },
          right: { type: "phrase", value: "Jones, Jane D" }
        }
      },
      SKIP
    ],
    [
      "should handle names that contain pre-married names",
      "\"Jones (Smith), Jane D\"",
      {
        type: "phrase",
        value: "\"Jones (Smith), Jane D\""
      },
      SKIP
    ],
    [
      "should parse comma-separated double-quoted strings as ANDed phrases",
      "\"alpha\",\"beta\",\"gamma\"",
      {
        expr: {
          op: "AND",
          left: { type: "term", value: "alpha" },
          right: {
            expr: {
              op: "AND",
              left: { type: "term", value: "beta" },
              right: { type: "term", value: "gamma" }
            }
          }
        }
      },
      SKIP
    ],
    [
      "should support double-quoted phrases combined with comma-separated terms",
      "\"a OR b\",c,d OR e",
      {
        // fill this in when group format is supported
      },
      SKIP
    ],
    [
      "super complex",
      "a AND (b OR \"c,d\" AND (\"e OR f\"))",
      {
        // fill this in when group format is supported
      },
      SKIP
    ]
  ];

  queries.forEach(([description, input, expected, run = 'only']) => {
    it[run](description, () => {
      expect(parse(input)).toEqual(expected);
    });
  });
});
