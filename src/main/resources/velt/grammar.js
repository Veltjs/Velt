// Generated automatically by nearley, version 2.19.3
// http://github.com/Hardmath123/nearley
(function () {
    function id(x) { return x[0]; }
    var grammar = {
        Lexer: undefined,
        ParserRules: [
            {"name": "main$ebnf$1", "symbols": ["args"], "postprocess": id},
            {"name": "main$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
            {"name": "main", "symbols": ["cmd", "main$ebnf$1"], "postprocess":  ([ cmd, args ]) => ({
                    cmd,
                    args
                }) },
            {"name": "cmd$ebnf$1", "symbols": [/[a-zA-Z]/]},
            {"name": "cmd$ebnf$1", "symbols": ["cmd$ebnf$1", /[a-zA-Z]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
            {"name": "cmd", "symbols": ["cmd$ebnf$1"], "postprocess": i => i[0].join('')},
            {"name": "type$subexpression$1", "symbols": ["simple_type"]},
            {"name": "type$subexpression$1", "symbols": ["optional"]},
            {"name": "type$subexpression$1", "symbols": ["spread"]},
            {"name": "type", "symbols": [{"literal":"("}, "type$subexpression$1", {"literal":")"}], "postprocess": i => i[1][0]},
            {"name": "simple_type$ebnf$1", "symbols": [/[a-zA-Z]/]},
            {"name": "simple_type$ebnf$1", "symbols": ["simple_type$ebnf$1", /[a-zA-Z]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
            {"name": "simple_type", "symbols": ["simple_type$ebnf$1"], "postprocess":  i => ({
                    type: 'simple',
                    value: i[0].join('')
                }) },
            {"name": "optional", "symbols": ["simple_type", {"literal":"?"}], "postprocess":  i => ({
                    type: 'optional',
                    value: i[0]
                }) },
            {"name": "spread$string$1", "symbols": [{"literal":"."}, {"literal":"."}, {"literal":"."}], "postprocess": function joiner(d) {return d.join('');}},
            {"name": "spread", "symbols": ["spread$string$1", "simple_type"], "postprocess":  i => ({
                    type: 'spread',
                    value: i[1]
                }) },
            {"name": "args$ebnf$1$subexpression$1", "symbols": [{"literal":" "}, "type"]},
            {"name": "args$ebnf$1", "symbols": ["args$ebnf$1$subexpression$1"]},
            {"name": "args$ebnf$1$subexpression$2", "symbols": [{"literal":" "}, "type"]},
            {"name": "args$ebnf$1", "symbols": ["args$ebnf$1", "args$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
            {"name": "args", "symbols": ["args$ebnf$1"], "postprocess": i => i[0].map(x => x[1])}
        ]
        , ParserStart: "main"
    }
    if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
        module.exports = grammar;
    } else {
        window.grammar = grammar;
    }
})();
