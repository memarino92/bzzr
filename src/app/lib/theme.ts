export const THEME_STORAGE_KEY = "bzzr:theme";

// Runs before styles paint, including on pages without a theme button.
// Only an explicit saved choice overrides the CSS system-color preference.
export const themeBootstrapScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch{}`;
