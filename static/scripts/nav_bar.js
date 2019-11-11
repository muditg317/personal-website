const top_nav = document.getElementById("top_nav");

const responsiveNav = () => {
  if (top_nav.className === "nav_bar") {
    top_nav.className += " responsive";
  } else {
    top_nav.className = "nav_bar";
  }
}

const navToSection = (elementSelector) => {
    jumpToSection(elementSelector);
    top_nav.className = "nav_bar";
}

const windowResizeHandler_NAV = () => {
    if (window.innerWidth > 650) {
        top_nav.className = "nav_bar";
    }
}

window.addEventListener("resize", windowResizeHandler_NAV);
