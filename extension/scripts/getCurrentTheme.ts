export function getCurrentTheme(): "light" | "dark" {
    const styles = $("style[type='text/css']").toArray().map((s) => s.innerHTML);
    const [themeStyle] = styles.filter((s) => s.indexOf("palette-neutral-0: ") > 0);
    if (!themeStyle) {
        return "light";
    }
    /** given the rgb values of the background color grab the red value */
    const backgroundRed = themeStyle.match(/(?<=--palette-neutral-0: )\d+/);
    const amountofRed = backgroundRed && +backgroundRed[0];
    return amountofRed === 255 ? "light" : "dark";
}
