// const { parse } = require("./simple-search-parser");

const peg = require("pegjs");
const fs = require("fs");
const { fail } = require("assert");

const { parse, SyntaxError } = peg.generate(
  fs.readFileSync("./grammar/simple-search.grammar").toString()
);

const SKIP = "skip";

const COMPUTER_JPN = "コンピュータ";
const COMPUTER_CMN = "计算机";
const COMPUTER_THAI = "คอมพิวเตอร์";

function testSyntacticallyCorrectQueries(queries) {
  for (const [description, input, expected, run = "only"] of queries) {
    it[run](description, () => {
      expect(parse(input)).toEqual(expected);
    });
  }
}

function testQueriesWithSyntaxErrors(queries) {
  for (const [description, input, run = "only"] of queries) {
    it[run](description, () => {
      try {
        parse(input);
        fail("an error should have been thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(SyntaxError);
      }
    });
  }
}

describe("simple-search-parser", () => {
  describe("negative tests", () => {
    const queries = [
      [
        "unbalanced left parentheses should throw an error",
        "(alpha"
      ],
      [
        "unbalanced right parentheses should throw an error",
        "alpha)"
      ],
      [
        "unbalanced left double quotes should throw an error",
        '"alpha'
      ],
      [
        "unbalanced right double quotes should throw an error",
        'alpha"'
      ]      
    ];

    testQueriesWithSyntaxErrors(queries);
  });

  describe("non-latin inputs", () => {
    describe("chinese inputs", () => {
      const queries = [
        [
          "should parse chinese characters when not double-quoted",
          COMPUTER_CMN,
          {
            type: "term",
            value: COMPUTER_CMN
          }
        ],
        [
          "should parse chinese characters as phrase when double-quoted",
          `"${COMPUTER_CMN}"`,
          {
            type: "phrase",
            value: COMPUTER_CMN
          }
        ]
      ];
  
      testSyntacticallyCorrectQueries(queries);
    });
  
    describe("japanese inputs", () => {
      const queries = [
        [
          "should parse japanese characters when not double-quoted",
          COMPUTER_JPN,
          {
            type: "term",
            value: COMPUTER_JPN
          }
        ],
        [
          "should parse japanese characters as phrase when double-quoted",
          `"${COMPUTER_JPN}"`,
          {
            type: "phrase",
            value: COMPUTER_JPN
          }
        ]
      ];
  
      testSyntacticallyCorrectQueries(queries);
    });
  
    describe("thai inputs", () => {
      const queries = [
        [
          "should parse thai characters when not double-quoted",
          COMPUTER_THAI,
          {
            type: "term",
            value: COMPUTER_THAI
          }
        ],
        [
          "should parse thai characters as phrase when double-quoted",
          `"${COMPUTER_THAI}"`,
          {
            type: "phrase",
            value: COMPUTER_THAI
          }
        ]
      ];
  
      testSyntacticallyCorrectQueries(queries);
    });  
  });

  describe("phrase inputs", () => {
    const queries = [
      [
        "should allow single word phrase",
        "\"alpha\"",
        {
          type: "phrase",
          value: "alpha"
        }
      ],
      [
        "should retain spacing within double-quoted string",
        "\"alpha beta\"",
        {
          type: "phrase",
          value: "alpha beta"
        }
      ],
      [
        "should allow hyphens within phrases",
        "\"alpha-beta\"",
        {
          type: "phrase",
          value: "alpha-beta"
        }
      ],
      [
        "should retain leading and trailing spacing within double-quoted string",
        "\" \t alpha \t beta \t \"",
        {
          type: "phrase",
          value: " \t alpha \t beta \t "
        }
      ],
      [
        "should parse various languages from input",
        `"alpha ${COMPUTER_CMN} ${COMPUTER_JPN}"`,
        {
          type: "phrase",
          value: `alpha ${COMPUTER_CMN} ${COMPUTER_JPN}`
        }
      ],
      [
        "left-and-right unicode double quotation marks",
        '“alpha”',
        {
          type: "phrase",
          value: "alpha"
        }
      ],
      [
        "inverted left-and-right unicode double quotation marks",
        '“alpha”',
        {
          type: "phrase",
          value: "alpha"
        }
      ],
      [
        "only left unicode double quotation marks",
        '“alpha”',
        {
          type: "phrase",
          value: "alpha"
        }
      ],
      [
        "only right unicode double quotation marks",
        '”alpha“',
        {
          type: "phrase",
          value: "alpha"
        }
      ],
      [
        "prefix ascii double quote quotes + suffix left unicode double quotation marks",
        '"alpha“',
        {
          type: "phrase",
          value: "alpha"
        }
      ],
      [
        "prefix ascii double quote quotes + suffix right unicode double quotation marks",
        '"alpha”',
        {
          type: "phrase",
          value: "alpha"
        }
      ],
      [
        "prefix left unicode double quotes + suffix ascii double quote quotation marks",
        '“alpha"',
        {
          type: "phrase",
          value: "alpha"
        }
      ],
      [
        "prefix right unicode double quotes + suffix ascii double quote quotation marks",
        '”alpha"',
        {
          type: "phrase",
          value: "alpha"
        }
      ]
    ];

    testSyntacticallyCorrectQueries(queries);
  });

  describe("term inputs", () => {
    const queries = [
      [
        "should allow single word terms",
        "alpha",
        {
          type: "term",
          value: "alpha"
        }
      ],
      [
        "should allow hyphens within term",
        "alpha-beta",
        {
          type: "term",
          value: "alpha-beta"
        }
      ]
    ];

    testSyntacticallyCorrectQueries(queries);
  });

  describe("spacing", () => {
    const queries = [
      [
        "leading whitespace should be trimmed",
        " \t alpha",
        {
          type: "term",
          value: "alpha"
        }
      ],
      [
        "trailing whitespace should be trimmed",
        "alpha \t ",
        {
          type: "term",
          value: "alpha"
        }
      ],
      [
        "leading and trailing whitespace be trimmed",
        " \t alpha \t ",
        {
          type: "term",
          value: "alpha"
        }
      ]
    ];

    testSyntacticallyCorrectQueries(queries);
  });

  describe("simple logical connectives", () => {
    describe("terms", () => {
      const queries = [
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
          "simple disjunction",
          "alpha OR beta",
          {
            operator: "OR",
            left: { type: "term", value: "alpha" },
            right: { type: "term", value: "beta" },
          },
        ],
        [
          "simple conjunction with excess spacing",
          "alpha \t AND \t beta",
          {
            operator: "AND",
            left: { type: "term", value: "alpha" },
            right: { type: "term", value: "beta" },
          },
        ],
        [
          "simple disjunction with excess spacing",
          "alpha \t OR \t beta",
          {
            operator: "OR",
            left: { type: "term", value: "alpha" },
            right: { type: "term", value: "beta" },
          },
        ]
      ];
  
      testSyntacticallyCorrectQueries(queries);  
    });

    describe("phrases", () => {
      const queries = [
        [
          "simple conjunction",
          "\"alpha\" AND \"beta\"",
          {
            operator: "AND",
            left: { type: "phrase", value: "alpha" },
            right: { type: "phrase", value: "beta" },
          },
        ],
        [
          "simple disjunction",
          "\"alpha\" OR \"beta\"",
          {
            operator: "OR",
            left: { type: "phrase", value: "alpha" },
            right: { type: "phrase", value: "beta" },
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
        ]  
      ];
  
      testSyntacticallyCorrectQueries(queries);  
    });

    describe("terms and phrases", () => {
      const queries = [
        [
          "simple conjunction",
          "alpha AND \"beta\"",
          {
            operator: "AND",
            left: { type: "term", value: "alpha" },
            right: { type: "phrase", value: "beta" },
          },
        ],
        [
          "simple disjunction",
          "\"alpha\" OR beta",
          {
            operator: "OR",
            left: { type: "phrase", value: "alpha" },
            right: { type: "term", value: "beta" },
          },
        ]
      ];
  
      testSyntacticallyCorrectQueries(queries);  
    });

    describe("phrases containing reserved words", () => {
      const queries = [
        [
          "embedded conjunction",
          "alpha AND \"beta AND gamma\"",
          {
            operator: "AND",
            left: { type: "term", value: "alpha" },
            right: { type: "phrase", value: "beta AND gamma" },
          },
        ],
        [
          "embedded disjunction",
          "alpha AND \"beta OR gamma\"",
          {
            operator: "AND",
            left: { type: "term", value: "alpha" },
            right: { type: "phrase", value: "beta OR gamma" },
          },
        ],
        [
          "embedded disjunction",
          "\"alpha AND beta\" AND \"gamma OR delta\"",
          {
            operator: "AND",
            left: { type: "phrase", value: "alpha AND beta" },
            right: { type: "phrase", value: "gamma OR delta" },
          },
        ]
      ];
  
      testSyntacticallyCorrectQueries(queries);  
    });

    describe("multiple terms", () => {
      const queries = [
        [
          "AND/AND",
          "alpha AND beta AND gamma",
          {
            operator: "AND",
            left: { type: "term", value: "alpha" },
            right: {
              operator: "AND",
              left: { type: "term", value: "beta" },
              right: { type: "term", value: "gamma" }
            },
          }
        ],
        [
          "AND/OR",
          "alpha AND beta OR gamma",
          {
            operator: "OR",
            left: {
              operator: "AND",
              left: { type: "term", value: "alpha" },
              right: { type: "term", value: "beta" }
            },
            right: { type: "term", value: "gamma" }            
          }
        ],
        [
          "OR/AND",
          "alpha OR beta AND gamma",
          {
            operator: "OR",
            left: { type: "term", value: "alpha" },
            right: {
              operator: "AND",
              left: { type: "term", value: "beta" },
              right: { type: "term", value: "gamma" }
            },
          }
        ],
        [
          "OR/OR",
          "alpha OR beta OR gamma",
          {
            operator: "OR",
            left: { type: "term", value: "alpha" },
            right: {
              operator: "OR",
              left: { type: "term", value: "beta" },
              right: { type: "term", value: "gamma" }
            },
          }
        ],
      ];
  
      testSyntacticallyCorrectQueries(queries);  

    });

    describe("multiple phrases", () => {
      const queries = [
        [
          "AND/AND",
          "\"alpha\" AND \"beta\" AND \"gamma\"",
          {
            operator: "AND",
            left: { type: "phrase", value: "alpha" },
            right: {
              operator: "AND",
              left: { type: "phrase", value: "beta" },
              right: { type: "phrase", value: "gamma" }
            },
          }
        ],
        [
          "AND/OR",
          "\"alpha\" AND \"beta\" OR \"gamma\"",
          {
            operator: "OR",
            left: {
              operator: "AND",
              left: { type: "phrase", value: "alpha" },
              right: { type: "phrase", value: "beta" }
            },
            right: { type: "phrase", value: "gamma" }            
          }
        ],
        [
          "OR/AND",
          "\"alpha\" OR \"beta\" AND \"gamma\"",
          {
            operator: "OR",
            left: { type: "phrase", value: "alpha" },
            right: {
              operator: "AND",
              left: { type: "phrase", value: "beta" },
              right: { type: "phrase", value: "gamma" }
            },
          }
        ],
        [
          "OR/OR",
          "\"alpha\" OR \"beta\" OR \"gamma\"",
          {
            operator: "OR",
            left: { type: "phrase", value: "alpha" },
            right: {
              operator: "OR",
              left: { type: "phrase", value: "beta" },
              right: { type: "phrase", value: "gamma" }
            },
          }
        ],
      ];
  
      testSyntacticallyCorrectQueries(queries);  

    });

    describe("multiple terms and phrases intermingled", () => {
      const queries = [
        [
          "AND/AND",
          "\"alpha\" AND beta AND gamma",
          {
            operator: "AND",
            left: { type: "phrase", value: "alpha" },
            right: {
              operator: "AND",
              left: { type: "term", value: "beta" },
              right: { type: "term", value: "gamma" }
            },
          }
        ],
        [
          "AND/AND",
          "alpha AND \"beta\" AND gamma",
          {
            operator: "AND",
            left: { type: "term", value: "alpha" },
            right: {
              operator: "AND",
              left: { type: "phrase", value: "beta" },
              right: { type: "term", value: "gamma" }
            },
          }
        ],
        [
          "AND/AND",
          "alpha AND beta AND \"gamma\"",
          {
            operator: "AND",
            left: { type: "term", value: "alpha" },
            right: {
              operator: "AND",
              left: { type: "term", value: "beta" },
              right: { type: "phrase", value: "gamma" }
            },
          }
        ]
      ];
  
      testSyntacticallyCorrectQueries(queries);  
    });
  });

  describe("incomplete connectives", () => {
    const queries = [
      [
        "AND without right operand should treat AND as part of query",
        "alpha AND ",
        {
          operator: "OR",
          left: {
            type: "term",
            value: "alpha"
          },
          right: {
            type: "term",
            value: "AND"
          }
        }
      ],
      [
        "AND without left operand should treat AND as part of query",
        " AND beta",
        {
          operator: "OR",
          left: {
            type: "term",
            value: "AND"
          },
          right: {
            type: "term",
            value: "beta"
          }
        }
      ],
      [
        "OR without right operand should treat OR as part of query",
        "alpha OR ",
        {
          operator: "OR",
          left: {
            type: "term",
            value: "alpha"
          },
          right: {
            type: "term",
            value: "OR"
          }
        },
        SKIP
      ],
      [
        "OR without left operand should treat OR as part of query",
        " OR beta",
        {
          operator: "OR",
          left: {
            type: "term",
            value: "OR"
          },
          right: {
            type: "term",
            value: "beta"
          }
        }
      ],
    ];

    testSyntacticallyCorrectQueries(queries);  
  });

  describe("NOT operator", () => {
    describe("unary operand", () => {
      const queries = [
        [
          "unary NOT, unquoted term",
          'NOT alpha',
          {
            operator: "NOT",
            right: { type: "term", value: "alpha" }
          }
        ],
        [
          "unary NOT, quoted term",
          'NOT "alpha"',
          {
            operator: "NOT",
            right: { type: "phrase", value: "alpha" }
          }
        ],
        [
          "unary NOT, quoted term",
          'NOT "alpha beta"',
          {
            operator: "NOT",
            right: { type: "phrase", value: "alpha beta" }
          }
        ],
        [
          "unary NOT, quoted term containing AND reserved word",
          'NOT "alpha AND beta"',
          {
            operator: "NOT",
            right: { type: "phrase", value: "alpha AND beta" }
          }
        ],
        [
          "unary NOT, quoted term containing OR reserved word",
          'NOT "alpha OR beta"',
          {
            operator: "NOT",
            right: { type: "phrase", value: "alpha OR beta" }
          }
        ],
        [
          "unary NOT, unquoted term",
          'NOT "NOT alpha"',
          {
            operator: "NOT",
            right: { type: "phrase", value: "NOT alpha" }
          }
        ],
        [
          "unary NOT, quoted term",
          'NOT "alpha NOT beta"',
          {
            operator: "NOT",
            right: { type: "phrase", value: "alpha NOT beta" }
          }
        ]
      ];

      testSyntacticallyCorrectQueries(queries);  
    });

    describe("grouped operands containing conjunctions/disjunctions", () => {
      const queries = [
        [
          "unary NOT of terms conjunction",
          'NOT (alpha AND beta)',
          {
            operator: "NOT",
            right: {
              operator: "AND",
              left: { type: "term", value: "alpha" },
              right: { type: "term", value: "beta" },
            }
          }
        ],
        [
          "unary NOT of terms disjunction",
          'NOT (alpha OR beta)',
          {
            operator: "NOT",
            right: {
              operator: "OR",
              left: { type: "term", value: "alpha" },
              right: { type: "term", value: "beta" },
            }
          }
        ],
        [
          "unary NOT of phrases conjunction",
          'NOT ("alpha" AND "beta")',
          {
            operator: "NOT",
            right: {
              operator: "AND",
              left: { type: "phrase", value: "alpha" },
              right: { type: "phrase", value: "beta" },
            }
          }
        ],
        [
          "unary NOT of terms disjunction",
          'NOT ("alpha" OR "beta")',
          {
            operator: "NOT",
            right: {
              operator: "OR",
              left: { type: "phrase", value: "alpha" },
              right: { type: "phrase", value: "beta" },
            }
          }
        ],
        [
          "OR NOT grouped AND",
          "a OR NOT (b AND c)",
          {
            operator: "OR",
            left: {
              type: "term",
              value: "a"
            },
            right: {
              operator: "NOT",
              right: {
                operator: "AND",
                left: {
                  type: "term",
                  value: "b"
                },
                right: {
                  type: "term",
                  value: "c"
                }
              }
            }
          }
        ],
        [
          "AND NOT grouped OR",
          "a AND NOT (b OR c)",
          {
            operator: "AND",
            left: {
              type: "term",
              value: "a"
            },
            right: {
              operator: "NOT",
              right: {
                operator: "OR",
                left: {
                  type: "term",
                  value: "b"
                },
                right: {
                  type: "term",
                  value: "c"
                }
              }
            }
          }
        ],
        ];

      testSyntacticallyCorrectQueries(queries);  
    });

    describe("multiple NOT operators", () => {
      const queries = [
        [
          "conjunction of unary NOT terms",
          'NOT alpha AND NOT beta',
          {
            operator: "AND",
            left: {
              operator: "NOT",
              right: { type: "term", value: "alpha" },
            },
            right: {
              operator: "NOT",
              right: { type: "term", value: "beta" },
            }
          }
        ],
        [
          "disjunction of unary NOT terms",
          'NOT alpha OR NOT beta',
          {
            operator: "OR",
            left: {
              operator: "NOT",
              right: { type: "term", value: "alpha" },
            },
            right: {
              operator: "NOT",
              right: { type: "term", value: "beta" },
            }
          }
        ],
        [
          "conjunction of unary NOT phrases",
          'NOT "alpha" AND NOT "beta"',
          {
            operator: "AND",
            left: {
              operator: "NOT",
              right: { type: "phrase", value: "alpha" },
            },
            right: {
              operator: "NOT",
              right: { type: "phrase", value: "beta" },
            }
          }
        ],
        [
          "disjunction of unary NOT phrases",
          'NOT "alpha" OR NOT "beta"',
          {
            operator: "OR",
            left: {
              operator: "NOT",
              right: { type: "phrase", value: "alpha" },
            },
            right: {
              operator: "NOT",
              right: { type: "phrase", value: "beta" },
            }
          }
        ],
      ];

      testSyntacticallyCorrectQueries(queries);  
    });
  });

  describe("commas", () => {
    describe("only commas", () => {
      const queries = [
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
      ];

      testSyntacticallyCorrectQueries(queries);
    });

    describe("with other connectives", () => {
      const queries = [
        [
          "mixed usage of comma and AND should treat as all ANDs",
          "alpha, beta AND gamma",
          {
            operator: "OR",
            left: { type: "term", value: "alpha" },
            right: {
              operator: "AND",
              left: { type: "term", value: "beta" },
              right: { type: "term", value: "gamma" },
            },
          },
          SKIP
        ],
        [
          "commas should be treated as ANDs in precedence order",
          "alpha, beta OR gamma",
          {
            operator: "OR",
            left: { 
              operator: "AND",
              left: { type: "term", value: "alpha" },
              right: { type: "term", value: "beta" }
            },
            right: { type: "term", value: "gamma" }
          }
        ],
      ];

      testSyntacticallyCorrectQueries(queries);
    });
  });

  describe("parentheses", () => {
    const queries = [
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
        "superfluous parentheses should be removed",
        "((alpha))",
        {
          type: "term",
          value: "alpha"
        }
      ],
    ];

    testSyntacticallyCorrectQueries(queries);
  });

  describe("miscellaneous", () => {
    const queries = [
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
      [
        "really complicated nested NOTs",
        "(a AND NOT b) AND NOT (c OR NOT d)",
        {
          operator: "AND",
          left: {
            operator: "AND",
            left: {
              type: "term",
              value: "a"
            },
            right: {
              operator: "NOT",
              right: {
                type: "term",
                value: "b"
              }
            }
          },
          right: {
            operator: "NOT",
            right: {
              operator: "OR",
              left: {
                type: "term",
                value: "c"
              },
              right: {
                operator: "NOT",
                right: {
                  type: "term",
                  value: "d"
                }
              }
            }
          }
        }
      ],
      [
        "chain of nested NOTs with terms",
        "a AND NOT (b AND NOT (c AND NOT (d AND NOT e)))",
        {
          operator: "AND",
          left: {
            type: "term",
            value: "a"
          },
          right: {
            operator: "NOT",
            right: {
              operator: "AND",
              left: {
                type: "term",
                value: "b"
              },
              right: {
                operator: "NOT",
                right: {
                  operator: "AND",
                  left: {
                    type: "term",
                    value: "c"
                  },
                  right: {
                    operator: "NOT",
                    right: {
                      operator: "AND",
                      left: {
                        type: "term",
                        value: "d"
                      },
                      right: {
                        operator: "NOT",
                        right: {
                          type: "term",
                          value: "e"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ],
      [
        "chain of nested NOTs with phrases",
        "\"a\" AND NOT (\"b\" AND NOT (\"c\" AND NOT (\"d\" AND NOT \"e\")))",
        {
          operator: "AND",
          left: {
            type: "phrase",
            value: "a"
          },
          right: {
            operator: "NOT",
            right: {
              operator: "AND",
              left: {
                type: "phrase",
                value: "b"
              },
              right: {
                operator: "NOT",
                right: {
                  operator: "AND",
                  left: {
                    type: "phrase",
                    value: "c"
                  },
                  right: {
                    operator: "NOT",
                    right: {
                      operator: "AND",
                      left: {
                        type: "phrase",
                        value: "d"
                      },
                      right: {
                        operator: "NOT",
                        right: {
                          type: "phrase",
                          value: "e"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    ];
  
    testSyntacticallyCorrectQueries(queries);
  });
});
