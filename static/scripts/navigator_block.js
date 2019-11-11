scrollByAnimated = function(scrollY, duration){
  //gist here https://gist.github.com/loadedsith/857540fd76fe9c0609c7
  var startTime = new Date().getTime();

  var startY = window.scrollY;
  var endY = startY + scrollY;
  var currentY = startY;
  var directionY = scrollY > 0 ? 'down' : 'up';

  var animationComplete;
  var count = 0;

  var animationId;

  if(duration === undefined){
    duration = 250;//ms
  }

  //grab scroll events from the browser
  var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel" //FF doesn't recognize mousewheel as of FF3.x

  //stop the current animation if its still going on an input from the user
  var cancelAnimation = function () {
    if(animationId!==undefined){
      window.cancelAnimationFrame(animationId)
      animationId=undefined;
    }

  }

  if (document.attachEvent) {
    //if IE (and Opera depending on user setting)
    document.attachEvent("on "+mousewheelevt, cancelAnimation)
  } else if (document.addEventListener) {
    //WC3 browsers
    document.addEventListener(mousewheelevt, cancelAnimation, false)
  }

  var step = function (a,b,c) {
    var now = new Date().getTime();
    var completeness = (now - startTime) / duration;
    window.scrollTo(0, Math.round(startY + completeness * scrollY));
    currentY = window.scrollY;
    if(directionY === 'up') {
      if (currentY === 0){
        animationComplete = true;
      }else{
        animationComplete = currentY<=endY;
      }
    }
    if(directionY === 'down') {
      /*limitY is cross browser, we want the largest of these values*/
      var limitY = Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight );
      if(currentY + window.innerHeight === limitY){
        animationComplete = true;
      }else{
        animationComplete = currentY>=endY;
      }
    }

    if(animationComplete===true){
      /*Stop animation*/
      return;
    }else{
      /*repeat animation*/
      if(count > 500){
        return;
      }else{
        count++;
        animationId = window.requestAnimationFrame(step);
      }

    }
  };
  /*start animation*/
  step();
};
