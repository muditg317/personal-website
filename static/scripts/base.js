let content_blocks = document.querySelectorAll(".content_block");

let last_known_scroll_position = 0;
let ticking = false;

function scrollEvent(scroll_pos) {
    var content_index = 0;
    while (content_index < content_blocks.length && !(content_blocks[content_index].getBoundingClientRect().top < 51 && content_blocks[content_index].getBoundingClientRect().bottom > 51)) {
        content_index++;
    }
    if (content_index == content_blocks.length) {
        return;
    }

    let nav_bar = document.querySelector(".nav_bar#top_nav");
    let current = nav_bar.querySelector(".active");
    if (current != null) {
        current.className = current.className.replace(" active", "");
    }

    if (content_index != 0) {
        let nav_id = "nav_" + content_blocks[content_index].id;
        let new_nav_item = nav_bar.querySelector("#"+nav_id);
        new_nav_item.className += " active";
    }
}

window.addEventListener('scroll', function(e) {
    last_known_scroll_position = window.scrollY;

    if (!ticking) {
        window.requestAnimationFrame(function() {
          scrollEvent(last_known_scroll_position);
          ticking = false;
        });

        ticking = true;
    }
});
