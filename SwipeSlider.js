(function (root, factory) {

    root.SwipeSlider = factory();

}(this, function () {

    function SwipeSlider(container, options) {

        var viewportWrapper, viewport, slideSelectors, stage, frames, videos;
        var defaults = {
            "videoControls" : true,
            "videoAutoPlay" : true
        };
        var state = {currentSlide : 0};
        var settings = merge(defaults, options);
        var el = this;

        function init(){

            viewportWrapper = container.getElementsByClassName('swipeSliderViewport')[0];
            viewport = document.createElement('div')
            viewport.classList.add('swipeSliderViewportInner');
            slideSelectors = container.getElementsByClassName('swipeSliderSlideSelectors')[0];
            for(var i=0;i < slideSelectors.children.length; i++){
                slideSelectors.children[i].dataset.slideNumber = i;
            }
            stage = slideSelectors.cloneNode(true);
            stage.className = 'stage';
            stage.id = '';
            frames = Array.from(stage.querySelectorAll('li'));
            frames.filter(function(frame){
                let video = frame.getElementsByTagName('video')[0];
                let img = frame.getElementsByTagName('img')[0];
                frame.className ='swipeSliderFrame';
                if(video){
                    video.hasAttribute("controls") && settings.videoControls == true ? video.removeAttribute("controls") : video.setAttribute("controls", "true");
                    video.ondragstart = function() { return false; }
                }
                if(img)
                    img.ondragstart = function() { return false; };
            });

            viewportWrapper.innerHTML = '';
            viewport.appendChild(stage);
            viewportWrapper.appendChild(viewport);
            // need this to pause() on slide all the time
            videos = document.getElementsByTagName("video");

            el.draw();
            bind();
            //animate();
        }

        function bind(){

            viewport.mouse = {}, viewport.scroll = {};
            viewport.addEventListener('mousedown', handleSwipeEvent);
            viewport.addEventListener('touchstart',handleSwipeEvent);
            viewport.addEventListener('mouseup', handleSwipeEvent);
            viewport.addEventListener('touchend', handleSwipeEvent);
            viewport.addEventListener('mouseleave', handleSwipeEvent);
            viewport.addEventListener('touchmove', handleSwipeEvent, {passive : false});
            for(var i=0;i < slideSelectors.children.length; i++){
                slideSelectors.children[i].addEventListener('mousedown', function(){
                    el.moveSlide(this.dataset.slideNumber * viewport.offsetWidth, 0);
                });
            }
        }

        function handleSwipeEvent(event){
            switch (event.type) {
                case 'mousedown':
                case 'touchstart':
                    start(event);
                    break;
                case 'mousemove':
                case 'touchmove':
                    move(event);
                    break;
                case 'mouseup':
                case 'mouseleave':
                case 'touchend':
                    end(event);
                    break;
            }
        }

        function start(e){
            viewport.mouse.startX = e.pageX || e.changedTouches[0].pageX;
            viewport.scroll.startX = viewport.scrollLeft;
            viewport.startTime = new Date().getTime();
            viewport.addEventListener('mousemove', handleSwipeEvent, {passive : false});
        }

        function end(e){
            e.preventDefault();
            viewport.removeEventListener('mousemove', handleSwipeEvent, {passive : false});
            let duration = new Date().getTime() - viewport.startTime;
            let x = e.pageX || e.changedTouches[0].pageX;
            let delta = (viewport.mouse.startX - x);
            let scrollto = Math.round(viewport.scrollLeft / viewport.offsetWidth);
            let absDelta = Math.abs(delta);
            if(absDelta > 10){
                if((duration < 250 && (absDelta < (viewport.offsetWidth/2))) ||
                  ((absDelta > (viewport.offsetWidth/4)) && (absDelta < (viewport.offsetWidth/2)))
                ){
                    if(delta > 20){
                        scrollto ++;
                    }else if(delta < 20){
                        scrollto --;
                    }
                }
                el.moveSlide(scrollto * viewport.offsetWidth, 200);
            }

            return false;
        }

        function move(e){
            let x = e.pageX || e.changedTouches[0].pageX;
            let delta = (viewport.mouse.startX - x);
            if(Math.abs(delta) > 5){
                e.preventDefault();
                viewport.scrollLeft = (viewport.scroll.startX + delta);
                return false;
            }
        }

        function updateSlideSelectors(){
            for(var i=0;i<slideSelectors.children.length;i++){
                slideSelectors.children[i].dataset.slideNumber == state.currentSlide ?
                slideSelectors.children[i].classList.add('active') :
                slideSelectors.children[i].classList.remove('active');
            }
        }

        function updateVideos(){
            Object.keys(videos).map(function(key, index){
                videos[key].pause();
            });
            if(settings.videoAutoPlay == true && frames[state.currentSlide].children[0].tagName == "VIDEO"){
                frames[state.currentSlide].getElementsByTagName("video")[0].play();
            }
        }

        function animate(){
            // can put any automatic animations here like auto scroll
        }

        function merge(defaultJSON, overWriteJSON){
            let result = {};
            for(var key in defaultJSON) result[key] = defaultJSON[key];
            for(var key in overWriteJSON) result[key] = overWriteJSON[key];
            return result;
        }

        // public functions

        el.moveSlide = function(to, duration){ // thanks :) https://gist.github.com/andjosh/6764939
            var element = viewport,
            start = element.scrollLeft,
            change = to - start,
            startDate = new Date().getTime(),
            easeInOutQuad = function(t, b, c, d) {
                t /= d/2;
                if (t < 1) return c/2*t*t + b;
                t--;
                return -c/2 * (t*(t-2) - 1) + b;
            },
            animateScroll = function() {
                const currentDate = new Date().getTime();
                const currentTime = currentDate - startDate;
                element.scrollLeft = parseInt(easeInOutQuad(currentTime, start, change, duration));
                currentTime < duration ? requestAnimationFrame(animateScroll) : element.scrollLeft = to;
            };
            animateScroll();
            // update state
            state.currentSlide = Math.floor(frames.length/(stage.offsetWidth / to));
            state.currentSlide = state.currentSlide < 0 ? 0 : state.currentSlide;
            state.currentSlide = state.currentSlide > slideSelectors.children.length - 1 ? slideSelectors.children.length - 1: state.currentSlide;

            updateSlideSelectors();
            updateVideos();
        }

        el.draw = function(){
            viewport.pos = viewport.getClientRects();
            stage.style.width = (viewport.offsetWidth * frames.length) + 'px';
            frames.filter(function(frame){ frame.style.width = viewport.offsetWidth + 'px' });
            viewport.style.overflowX = "hidden";// hide scrollbar
            if(slideSelectors.children.length == 1){slideSelectors.children[0].style.display = "none"}
            updateSlideSelectors();
        }

        init();

        return this;
    }

    return SwipeSlider;
}));
