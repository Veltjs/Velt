package xyz.corman.velt;

import org.graalvm.polyglot.Value;

public class TypescriptCompiler extends JSRuntime {
    private Value compiler;
    public TypescriptCompiler(ContextCreation creator) {
        super(creator);
    }

    public String transpile(String text) {
        Value opts = this.eval("{ compilerOptions: { module: ts.ModuleKind.CommonJS }}", "<Typescript>");
        return this.transpile(text, opts);
    }

    public String transpile(String text, Value options) {
        Value obj = Value.asValue(text);
        String res = compiler.invokeMember("transpileModule", obj, options).getMember("outputText").asString();
        return new String(res); //Copying the string so that GraalJS doesn't throw a fit about "Value from another context"
    }

    public TypescriptCompiler init() {
        super.init();
        compiler = this.require("typescript");
        this.put("ts", compiler);
        return this;
    }
}
