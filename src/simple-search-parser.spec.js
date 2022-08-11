// const { parse } = require("./simple-search-parser");

const peg = require("pegjs");
const fs = require("fs");
const { fail } = require("assert");

const { parse } = peg.generate(
  fs.readFileSync("./grammar/simple-search.grammar").toString()
);

const SKIP = "skip";

const COMPUTER_JPN = "コンピュータ";
const SURGERY_JPN = "サージャリー";
const COMPUTER_CMN = "计算机";
const SURGERY_CMN = "手术";
const COMPUTER_THAI = "คอมพิวเตอร์";
const SURGERY_THAI = "การผ่าตัด";

function testQueries(queries) {
  for (const [description, input, expected, run = "only"] of queries) {
    it[run](description, () => {
      expect(parse(input)).toEqual(expected);
    });
  }
}

describe("simple-search-parser", () => {
  describe.only("negative tests", () => {
    it("unbalanced parentheses should throw an error", () => {
      const input = "(alpha";

      try {
        parse(input);
        fail("an error should have been thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });

    it("AND without right operand should throw an error", () => {
      const input = "alpha AND ";

      try {
        parse(input);
        fail("an error should have been thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });

    it("AND without left operand should throw an error", () => {
      const input = " AND beta";

      try {
        parse(input);
        fail("an error should have been thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });
  });

  describe.skip("spacing", () => {
    const queries = [
      [
        "leading whitespace",
        "  alpha",
        {
          type: "term",
          value: "alpha"
        },
        SKIP
      ],
      [
        "trailing whitespace",
        "  alpha",
        {
          type: "term",
          value: "alpha"
        },
        SKIP
      ],
      [
        "should ignore leading AND trailing whitespace",
        "  alpha  ",
        {
          type: "term",
          value: "alpha"
        },
        SKIP
      ]
    ];

    testQueries(queries);
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
  
      testQueries(queries);
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
  
      testQueries(queries);
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
  
      testQueries(queries);
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
      ]
    ];

    testQueries(queries);
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

    testQueries(queries);
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
        ]
      ];
  
      testQueries(queries);  
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
  
      testQueries(queries);  
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
  
      testQueries(queries);  
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
  
      testQueries(queries);  
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
  
      testQueries(queries);  

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
  
      testQueries(queries);  

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
  
      testQueries(queries);  
    });
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

      testQueries(queries);  
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

      testQueries(queries);  
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

      testQueries(queries);  
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

      testQueries(queries);
    });

    describe("with other connectives", () => {
      const queries = [
        [
          "comma-delimited list of terms should be parsed as 3 ANDed terms",
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
          "comma-delimited list of terms with separating spaces should be parsed as 3 ANDed terms",
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

      testQueries(queries);
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

    testQueries(queries);
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
        "chain of nested NOTs",
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
      ]
    ];
  
    testQueries(queries);
  });
});
