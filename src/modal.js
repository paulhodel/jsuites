jSuites.modal = (function(el, options) {
    var obj = {};
    obj.options = {};

    // Default configuration
    var defaults = {
        url: null,
        onopen: null,
        onclose: null,
        closed: false,
        width: null,
        height: null,
        title: null,
        padding: null,
    };

    // Loop through our object
    for (var property in defaults) {
        if (options && options.hasOwnProperty(property)) {
            obj.options[property] = options[property];
        } else {
            obj.options[property] = defaults[property];
        }
    }

    // Title
    if (! obj.options.title && el.getAttribute('title')) {
        obj.options.title = el.getAttribute('title');
    }

    // Cascading Management
    if(el.querySelector(".jmodal")!=null) {
        var newEl =  el.cloneNode(false);
        el.parentNode.appendChild(newEl);
        return jSuites.modal(newEl, obj.options);
    }

    var temp = document.createElement('div');
    while (el.children[0]) {
        temp.appendChild(el.children[0]);
    }

    obj.content = document.createElement('div');
    obj.content.className = 'jmodal_content';
    obj.content.innerHTML = el.innerHTML;

    while (temp.children[0]) {
        obj.content.appendChild(temp.children[0]);
    }

    obj.container = document.createElement('div');
    obj.container.className = 'jmodal';
    obj.container.appendChild(obj.content);

    if (obj.options.padding) {
        obj.content.style.padding = obj.options.padding;
    }
    if (obj.options.width) {
        obj.container.style.width = obj.options.width;
    }
    if (obj.options.height) {
        obj.container.style.height = obj.options.height;
    }
    if (obj.options.title) {
        obj.container.setAttribute('title', obj.options.title);
    } else {
        obj.container.classList.add('no-title');
    }
    el.innerHTML = '';
    el.style.display = 'none';
    el.appendChild(obj.container);

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.className = 'jmodal_backdrop';
    backdrop.onclick = function() {
        obj.close();
    }
    el.appendChild(backdrop);

    obj.open = function() {
        el.style.display = 'block';
        // Fullscreen
        var rect = obj.container.getBoundingClientRect();
        if (jSuites.getWindowWidth() < rect.width) {
            obj.container.style.top = '';
            obj.container.style.left = '';
            obj.container.classList.add('jmodal_fullscreen');
            jSuites.animation.slideBottom(obj.container, 1);
        } else {
            backdrop.style.display = 'block';
        }
        // Cascading management
        if (jSuites.modal.openedModalCascading.length > 0 && !obj.container.classList.contains("jmodal_fullscreen")) {
            obj.container.style.top = "calc(50% + " + (5 * (jSuites.modal.openedModalCascading.length % 10))  + "px)";
            obj.container.style.left = "calc(50% + " + (5 * (jSuites.modal.openedModalCascading.length % 10)) + "px)";

            var backDrop = obj.container.parentNode.querySelector("div.jmodal_backdrop");
            if (backDrop != null) {
                backDrop.style.backgroundColor = "transparent";
            }
        }
        // Push on cascading modal
        if (jSuites.modal.current != null) {
            jSuites.modal.openedModalCascading.push(jSuites.modal.current);
        }
        // Current
        jSuites.modal.current = obj;
        // Event
        if (typeof(obj.options.onopen) == 'function') {
            obj.options.onopen(el, obj);
        }
    }

    obj.resetPosition = function() {
        obj.container.style.top = '';
        obj.container.style.left = '';
    }

    obj.isOpen = function() {
        return el.style.display != 'none' ? true : false;
    }

    obj.close = function() {
        el.style.display = 'none';
        // Backdrop
        backdrop.style.display = '';
        // Current
        jSuites.modal.current = null;
        // Remove fullscreen class
        obj.container.classList.remove('jmodal_fullscreen');
        // Cascading managemenet
        if (jSuites.modal.openedModalCascading.length > 0) {
            jSuites.modal.current = jSuites.modal.openedModalCascading.pop();
        }
        // Event
        if (typeof(obj.options.onclose) == 'function') {
            obj.options.onclose(el, obj);
        }
    }

    if (! jSuites.modal.hasEvents) {
        jSuites.modal.current = obj;

        if ('ontouchstart' in document.documentElement === true) {
            document.addEventListener("touchstart", jSuites.modal.mouseDownControls);
        } else {
            document.addEventListener('mousedown', jSuites.modal.mouseDownControls);
            document.addEventListener('mousemove', jSuites.modal.mouseMoveControls);
            document.addEventListener('mouseup', jSuites.modal.mouseUpControls);
        }

        document.addEventListener('keydown', jSuites.modal.keyDownControls);

        jSuites.modal.hasEvents = true;
    }

    if (obj.options.url) {
        jSuites.ajax({
            url: obj.options.url,
            method: 'GET',
            dataType: 'text/html',
            success: function(data) {
                obj.content.innerHTML = data;

                if (! obj.options.closed) {
                    obj.open();
                }
            }
        });
    } else {
        if (! obj.options.closed) {
            obj.open();
        }
    }

    // Keep object available from the node
    el.modal = obj;

    return obj;
});

jSuites.modal.current = null;
jSuites.modal.position = null;
jSuites.modal.openedModalCascading = [];

jSuites.modal.keyDownControls = function(e) {
    if (e.which == 27) {
        if (jSuites.modal.current) {
            jSuites.modal.current.close();
        }
    }
}

jSuites.modal.mouseUpControls = function(e) {
    if (jSuites.modal.current) {
        jSuites.modal.current.container.style.cursor = 'auto';
    }
    jSuites.modal.position = null;
}

jSuites.modal.mouseMoveControls = function(e) {
    if (jSuites.modal.current && jSuites.modal.position) {
        if (e.which == 1 || e.which == 3) {
            var position = jSuites.modal.position;
            jSuites.modal.current.container.style.top = (position[1] + (e.clientY - position[3]) + (position[5] / 2)) + 'px';
            jSuites.modal.current.container.style.left = (position[0] + (e.clientX - position[2]) + (position[4] / 2)) + 'px';
            jSuites.modal.current.container.style.cursor = 'move';
        } else {
            jSuites.modal.current.container.style.cursor = 'auto';
        }
    }
}

jSuites.modal.mouseDownControls = function(e) {
    jSuites.modal.position = [];

    if (e.target.classList.contains('jmodal')) {
        setTimeout(function() {
            // Get target info
            var rect = e.target.getBoundingClientRect();

            if (e.changedTouches && e.changedTouches[0]) {
                var x = e.changedTouches[0].clientX;
                var y = e.changedTouches[0].clientY;
            } else {
                var x = e.clientX;
                var y = e.clientY;
            }

            if (rect.width - (x - rect.left) < 50 && (y - rect.top) < 50) {
                setTimeout(function() {
                    jSuites.modal.current.close();
                }, 100);
            } else {
                if (e.target.getAttribute('title') && (y - rect.top) < 50) {
                    if (document.selection) {
                        document.selection.empty();
                    } else if ( window.getSelection ) {
                        window.getSelection().removeAllRanges();
                    }

                    jSuites.modal.position = [
                        rect.left,
                        rect.top,
                        e.clientX,
                        e.clientY,
                        rect.width,
                        rect.height,
                    ];
                }
            }
        }, 100);
    }
}
