// navBar_element = document.getElementById("home");
// navBar_element.classList.add("active")
const title_block = document.querySelector(".title_block_inner");
const title_img = document.querySelector("#title_image");
let img_width = title_img.naturalWidth*500/title_img.naturalHeight;
title_block.style.width = img_width+"px";



const header_and_navigatorBlock_height = 960;
const bottomOffset = 20;
const animationDistance = 125;
const animationTime = 100;
const timeStep = 1;

//Get the button:
const backToTopButton = document.getElementById("back_to_top_block");
var shown = document.body.scrollTop > header_and_navigatorBlock_height || document.documentElement.scrollTop > header_and_navigatorBlock_height;
if(shown) {
    backToTopButton.style.display = "flex";
}

const moveBackToTopButton = (display) => {
    if (display === "flex") {
        if(shown) {
            return;
        }
        backToTopButton.style.display = display;
        var pos = (display === "flex" ? bottomOffset-animationDistance : bottomOffset);
        backToTopButton.style.bottom = pos + 'px';
        const increment = (display === "flex" ? 1 : -1) * animationDistance/(animationTime/timeStep);
        const id = setInterval(frame, timeStep);
        const steps = animationTime / timeStep;
        var step = 0;
        function frame() {
            if (step === steps - 1) {
                  backToTopButton.style.bottom = (display === "flex" ? bottomOffset : bottomOffset-animationDistance) + 'px';
                  clearInterval(id);
            } else {
                  pos += increment;
                  backToTopButton.style.bottom = pos + 'px';
            }
            step++;
        }
        shown = true;
    } else {
        shown = false;
        backToTopButton.style.display = display;
    }
}

const scrollFunction = () => {
    if (document.body.scrollTop > header_and_navigatorBlock_height || document.documentElement.scrollTop > header_and_navigatorBlock_height) {
        moveBackToTopButton("flex");
    } else {
        moveBackToTopButton("none");
    }
}

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = scrollFunction;


// When the user clicks on the button, scroll to the top of the document
const goToTop = () => {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}
