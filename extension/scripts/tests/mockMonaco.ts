declare var global;
export function mock() {
    const monaco = {
        Range: () => {}
    };
    // chai runner wants self, node wants global
    (typeof self === "undefined" ? global : self)["monaco"] = monaco;
}