// === UTILITIES ===============================================================


function random(itemArray) {
    const max = itemArray.length;
    const x = Math.floor(Math.random() * max);
    return itemArray[x];
}

function randomHighlight() {
    return random(['shakeX', 'tada', 'bounce', 'wobble', 'pulse', 'jello', 'rubberBand']);
}

window.getJsonValue = function (jsonStr, targetKey) {
    try {
        const jsonObj = JSON.parse(jsonStr);
        const argumentsObj = jsonObj.arguments ? jsonObj.arguments : jsonObj;
        return argumentsObj[targetKey] ?? "Key not found";
    } catch (error) {
        console.error("Error parsing JSON:", error);
        return "Invalid JSON format";
    }
};


// === DOM HELPERS =============================================================

function getElements(selector) {
    return document.querySelectorAll(selector);
}

function show(selector, shouldFlash = false) {
    const elements = getElements(selector);

    elements.forEach(el => {
        // 1. Make it appear
        el.classList.remove('hidden');
        el.style.transform = '';
        el.style.visibility = 'visible';
        el.style.display = ''; // Reset in case 'remove' was called

        // 2. Flash if requested
        if (shouldFlash) {
            // We pass the selector to animateCSS
            animateCSS(selector, 'flash');
        }
    });
}
// === ANIMATION ===============================================================

function hide(selector) {
    getElements(selector).forEach(el => {
        el.classList.add('hidden');
    });
}

function remove(selector) {
    getElements(selector).forEach(el => {
        el.style.display = 'none';
    });
}

function scaleTo(selector, factor, speed = 0.4) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.style.transition = `transform ${speed}s`;
    el.style.transform = `scale(${factor})`;
}



function onScreen(id) {
    return !!document.getElementById(id);
}

window.diagnose = function(condition) {
    const final = focal.diagnosis.toLowerCase();
    if (condition.toLowerCase().includes(final)) {
        document.getElementById("content").innerHTML = "Congratulations";
    } else {
        document.getElementById("content").innerHTML = "Try again. Ask for more tests";
    }
};

function order(test) {
     console.log('In movement-functions, order was called; Test ordered for', test, 'is', focal[test]);
    showDial(test);
    setValue(test, 344);
}

function getElementVhVw(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
        vh: Math.floor((rect.top / window.innerHeight) * 100),
        vw: Math.floor((rect.left / window.innerWidth) * 100)
    };
}

function toggleInteracted(el) {
    if ($('#interacted > img').is(':visible')) {
        $('#interacted').fadeOut();
    } else {
        $('#interacted').empty();
        $('#interacted').append($(el));
        $('#interacted').fadeIn();
    }
}

function playNoise(selector) {
    const el = document.getElementById(selector.replace('#', ''));
    if (el) el.play();
}

// Chain multiple async steps without manual sleep/await clutter
async function sequence(steps) {
    for (const step of steps) await step();
}


// === ANIMATION ===============================================================

const animateCSS = (element, animation, prefix, repeat, callback) =>
    new Promise((resolve) => {
        const animationPrefix = prefix === 'ta' ? '' : 'animate__';
        const animationName = `${animationPrefix}${animation}`;
        const animationRepeat = repeat ? `animate__repeat-${repeat}` : '18';
        const node = document.querySelector(element);
        if (!node) return resolve('Element not found');

        const isEntranceAnimation = animation.includes('In');
        node.classList.add(`${animationPrefix}animated`, animationName, animationRepeat);

        function handleAnimationEnd(event) {
            node.classList.remove(`${animationPrefix}animated`, animationName, animationRepeat);
            if (isEntranceAnimation) {
                node.classList.remove('hidden');
                node.classList.add('visible');
            }
            resolve('Animation ended');
            event.stopPropagation();
        }

        node.addEventListener('animationend', handleAnimationEnd, { once: true });
    }).then(() => { if (callback) callback(); });

// === MOVEMENT ================================================================


// Safely extracts the current X/Y translation from an element's computed transform
function getTranslateOffset(element) {
    const transformValue = window.getComputedStyle(element).transform;
    if (!transformValue || transformValue === 'none') return { x: 0, y: 0 };
    try {
        const matrix = new DOMMatrixReadOnly(transformValue);
        return { x: matrix.m41, y: matrix.m42 };
    } catch (e) {
        console.warn('Could not parse transform, defaulting to 0 offset.', e);
        return { x: 0, y: 0 };
    }
}

window.moveThis = function (item, _horizontal, _vertical, _speed) {
    const element = document.querySelector(item);
    if (!element) return;

    const speed = _speed ?? 0.5;
    const h = _horizontal ? `${_horizontal}vw` : '0vw';
    const v = _vertical ? `${_vertical}vh` : '0vh';

    element.style.animationFillMode = 'forwards';
    element.style.transition = `transform ${speed}s`;

    const currentTransform = window.getComputedStyle(element).transform;
    const newTransform = `translate3d(${h}, ${v}, 0px)`;
    element.style.transform = currentTransform === 'none' ? newTransform : `${currentTransform} ${newTransform}`;
};

// CANDIDATE FOR REMOVAL: moveThisByGrid — identical to moveThis(), just an alias. If nothing calls this name specifically, delete it.
// const moveThisByGrid = (item, horizontal, vertical, speed) =>
//     window.moveThis(item, horizontal, vertical, speed);

window.directionalMove = function (item, direction) {
    const step = 10;
    const speed = 2;
    let horizontal = 0;
    let vertical = 0;

    switch ((direction ?? '').toLowerCase()) {
        case 'up':        case 'north':     vertical = -step / 2; break;
        case 'down':      case 'south':     vertical = step;      break;
        case 'left':      case 'west':      horizontal = -step;   break;
        case 'right':     case 'east':      horizontal = step;    break;
        case 'northwest': horizontal = -step; vertical = -step;   break;
        case 'northeast': horizontal =  step; vertical = -step;   break;
        case 'southwest': horizontal = -step; vertical =  step;   break;
        case 'southeast': horizontal =  step; vertical =  step;   break;
        default:
            console.error(`directionalMove: Unknown direction "${direction}"`);
            return;
    }

    window.moveThis(item, horizontal, vertical, speed);
};

window.moveWithLegs = function (item, direction = 'right') {
    const id = item.replace('#', '');
    const element = document.getElementById(id);
    if (!element) return;

    const currentLeft = parseInt(getComputedStyle(element).getPropertyValue('left'));
    element.classList.remove('walkImage', 'left-walkImage');
    void element.offsetWidth; // Force reflow

    let newLeft;
    if (direction === 'left') {
        newLeft = currentLeft - 40;
        element.style.setProperty('--start-left', newLeft + 'px');
        element.classList.add('left-walkImage');
    } else {
        newLeft = currentLeft + 30;
        element.style.setProperty('--start-left', newLeft + 'px');
        element.classList.add('walkImage');
    }
    element.style.left = newLeft + 'px';
};

/**
 * Moves item toward a target, optionally overshooting by `overlay` px.
 * Fires `onProximity` when edges are within `proximityDist` px.
 * Fires `callback` when animation completes.
 */
// window.moveTowards = function (
//     sourceSelector,
//     targetSelector,
//     speed = 3.0,
//     proximityDist = 50,
//     labelSelector = null,
//     overlay = 0,
//     callback = null,
//     onProximity = null
// ) {
//     if (typeof sourceSelector === 'string' && !sourceSelector.startsWith('#')) sourceSelector = '#' + sourceSelector;
//     if (typeof targetSelector === 'string' && !targetSelector.startsWith('#')) targetSelector = '#' + targetSelector;
//
//     const source = document.querySelector(sourceSelector);
//     const target = document.querySelector(targetSelector);
//     const label  = labelSelector ? document.querySelector(labelSelector) : null;
//
//     if (!source || !target) {
//         console.error(`moveTowards: could not find source (${sourceSelector}) or target (${targetSelector})`);
//         return;
//     }
//
//     if (source.style.position !== 'absolute') source.style.position = 'absolute';
//
//     function getCenter(el) {
//         const rect = el.getBoundingClientRect();
//         return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, width: rect.width, height: rect.height };
//     }
//
//     const start   = getCenter(source);
//     const end     = getCenter(target);
//     const deltaX  = end.x - start.x;
//     const deltaY  = end.y - start.y;
//     const dist    = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
//
//     if (dist <= 1) { if (callback) callback(); return; }
//
//     const dirX        = deltaX / dist;
//     const dirY        = deltaY / dist;
//     const moveDist    = dist + overlay;
//     const currentOffset = getTranslateOffset(source);
//     const finalAbsX   = currentOffset.x + dirX * moveDist;
//     const finalAbsY   = currentOffset.y + dirY * moveDist;
//
//     source.style.transition = `transform ${speed}s`;
//     source.style.transform  = `translate(${finalAbsX}px, ${finalAbsY}px)`;
//
//     if (label) {
//         label.style.transition = `transform ${speed}s`;
//         label.style.transform  = `translate(${finalAbsX}px, ${finalAbsY}px)`;
//     }
//
//     if (onProximity) {
//         let triggered = false;
//         let active    = true;
//
//         const checkProximity = () => {
//             if (!active || triggered) return;
//             const s = getCenter(source);
//             const t = getCenter(target);
//             const dx = t.x - s.x;
//             const dy = t.y - s.y;
//             const centerDist = Math.sqrt(dx * dx + dy * dy);
//             const edgeDist   = centerDist - ((s.width + s.height) / 4) - ((t.width + t.height) / 4);
//
//             if (edgeDist <= proximityDist) {
//                 triggered = true;
//                 onProximity();
//             } else {
//                 requestAnimationFrame(checkProximity);
//             }
//         };
//         requestAnimationFrame(checkProximity);
//         setTimeout(() => { active = false; }, speed * 1000 + 100);
//     }
//
//     if (callback) setTimeout(callback, speed * 1000);
//};

window.moveTowards = function (
    sourceSelector,
    targetSelector,
    speed = 0.5,
    proximityDist = 50,
    overlay = 0,
    callback = null,
    onProximity = null
) {
    const fixSelector = (s) => (typeof s === 'string' && !s.startsWith('#') && !s.startsWith('.') ? '#' + s : s);
    const source = document.querySelector(fixSelector(sourceSelector));
    const target = document.querySelector(fixSelector(targetSelector));

    if (!source || !target) {
        console.error(`[moveTowards] Missing:`, { source, target });
        return;
    }

    function getCenter(el) {
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            w: rect.width,
            h: rect.height
        };
    }

    const start = getCenter(source);
    const end = getCenter(target);
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Get current transform to prevent the "jump"
    const style = window.getComputedStyle(source);
    const matrix = new DOMMatrixReadOnly(style.transform);

    // Calculate final position including the optional overlay (extra travel distance)
    const angle = Math.atan2(deltaY, deltaX);
    const moveDist = dist + overlay;
    const finalAbsX = matrix.m41 + (Math.cos(angle) * moveDist);
    const finalAbsY = matrix.m42 + (Math.sin(angle) * moveDist);

    console.log(`%c[DEBUG] Dist: ${dist.toFixed(1)}px | Target: ${finalAbsX.toFixed(1)}, ${finalAbsY.toFixed(1)}`, "color: cyan");

    // Apply animation
    source.style.transition = `transform ${speed}s linear`;
    source.style.transform = `translate(${finalAbsX}px, ${finalAbsY}px)`;

    // Fixed Proximity Logic
    if (onProximity) {
        let triggered = false;
        const check = () => {
            if (triggered) return;

            const s = getCenter(source);
            const t = getCenter(target);
            const currentDist = Math.sqrt(Math.pow(t.x - s.x, 2) + Math.pow(t.y - s.y, 2));

            // Check if center-to-center distance is within range
            // (You can subtract radii here if you want edge-to-edge)
            if (currentDist <= proximityDist) {
                console.log(`%c[PROXIMITY] Hit at ${currentDist.toFixed(1)}px`, "color: yellow");
                triggered = true;
                onProximity();
            } else {
                requestAnimationFrame(check);
            }
        };
        requestAnimationFrame(check);
    }

    if (callback) {
        setTimeout(() => {
            console.log("%c[COMPLETE] Animation finished", "color: lime");
            callback();
        }, speed * 1000);
    }
};

// Move + stop mid-flight when element collides with a target
function moveThisAsync(item, horizontal, vertical, speed = 0.5, callback, target, proximityThreshold = 1) {
    return new Promise((resolve, reject) => {
        if (!item) return reject(new Error("The 'item' element is required."));

        const h = horizontal || 0;
        const v = vertical   || 0;
        const originalTransition = item.style.transition;

        item.style.transition = `transform ${speed}s linear`;
        item.style.transform  = `translate3d(${h}vw, ${v}vh, 0)`;

        let motionStopped    = false;
        let animationFrameID = null;

        if (target) {
            const checkProximity = () => {
                if (motionStopped) return;
                const ir = item.getBoundingClientRect();
                const tr = target.getBoundingClientRect();

                const overlapping   = ir.left < tr.right && ir.right > tr.left && ir.top < tr.bottom && ir.bottom > tr.top;
                const closeToLeft   = Math.abs(ir.right  - tr.left)   <= proximityThreshold;
                const closeToRight  = Math.abs(ir.left   - tr.right)  <= proximityThreshold;
                const closeToTop    = Math.abs(ir.bottom - tr.top)    <= proximityThreshold;
                const closeToBottom = Math.abs(ir.top    - tr.bottom) <= proximityThreshold;

                if (closeToLeft || closeToRight || closeToTop || closeToBottom || overlapping) {
                    motionStopped = true;
                    if (animationFrameID !== null) { cancelAnimationFrame(animationFrameID); animationFrameID = null; }

                    const currentTransform = window.getComputedStyle(item).transform;
                    item.style.transition = 'none';
                    item.style.transform  = currentTransform;
                    void item.offsetWidth;

                    const result = { closeToLeft, closeToRight, closeToTop, closeToBottom, overlapping };
                    if (callback) callback(result);
                    resolve(result);
                    return;
                }

                animationFrameID = requestAnimationFrame(checkProximity);
            };
            animationFrameID = requestAnimationFrame(checkProximity);
        }

        const onTransitionEnd = (e) => {
            if (e.propertyName !== 'transform' || motionStopped) return;
            if (animationFrameID) { cancelAnimationFrame(animationFrameID); animationFrameID = null; }
            item.style.transition = originalTransition;
            item.removeEventListener('transitionend', onTransitionEnd);
            resolve({ status: 'reached_destination' });
        };
        item.addEventListener('transitionend', onTransitionEnd);
    });
}

// Thin wrapper — promisified moveThisAsync with error handling
window.startMovement = async function (item, horizontal, vertical, speed) {
    try {
        await moveThisAsync(item, horizontal, vertical, speed);
    } catch (error) {
        console.error('Error during movement:', error);
    }
};


// === COLLISION / PROXIMITY ===================================================

window.areTouching = function (el1, el2, amountX, amountY = amountX) {
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();
    return (r1.right + amountX) >= r2.left && (r2.right + amountX) >= r1.left &&
        (r1.bottom + amountY) >= r2.top  && (r2.bottom + amountY) >= r1.top;
};

window.checkPosition = function (item1, item2, amount) {
    return window.areTouching(document.getElementById(item1), document.getElementById(item2), amount);
};

window.checkCloseness = function (id1, id2, cp) {
    const el1 = document.getElementById(id1);
    const el2 = document.getElementById(id2);
    if (!el1 || !el2) return false;

    const r1     = el1.getBoundingClientRect();
    const r2     = el2.getBoundingClientRect();

    // TEST: paste this into console to verify both rects are reading correctly:
    // checkCloseness('el1id', 'el2id', 0.5);
    // then check the log below matches what you'd expect visually
    console.log('[checkCloseness]', {
        el1: { left: r1.left, top: r1.top },
        el2: { left: r2.left, top: r2.top },
        xplane: Math.abs(r1.left - r2.left),
        yplane: Math.abs(r1.top  - r2.top),
        threshold: cp * 100
    });

    const xplane = Math.abs(r1.left - r2.left);
    const yplane = Math.abs(r1.top  - r2.top);
    const newMax = cp * 100;

    if (xplane <= newMax && yplane <= newMax) {
        el1.style.transition = 'none';
        return true;
    }
    return false;
};

// Returns Manhattan distance between two elements (or 0/100 if a constraint is set)
function proximity(el1, el2, constraint) {
    const x = el1 instanceof HTMLElement ? el1 : document.querySelector(el1);
    const y = el2 instanceof HTMLElement ? el2 : document.querySelector(el2);
    const rectX = x.getBoundingClientRect();
    const rectY = y.getBoundingClientRect();
    const lFirst  = rectX.left + window.scrollX + Math.floor(x.offsetWidth  / 2);
    const lSecond = rectY.left + window.scrollX + Math.floor(y.offsetWidth  / 2);
    const tFirst  = rectX.top  + window.scrollY + Math.floor(x.offsetHeight / 2);
    const tSecond = rectY.top  + window.scrollY + Math.floor(y.offsetHeight / 2);
    const totalDistance = Math.floor(Math.abs(lFirst - lSecond) + Math.abs(tFirst - tSecond));
    if (constraint !== undefined) return totalDistance > constraint ? 100 : 0;
    return totalDistance;
}

// Returns the relative direction of el2 from el1's perspective
function itemRelationship(control, id2) {
    const r1 = document.getElementById(control).getBoundingClientRect();
    const r2 = document.getElementById(id2).getBoundingClientRect();
    if (r1.top  > r2.top)   return 'above';
    if (r1.top  < r2.top)   return 'below';
    if (r1.right > r2.left) return 'left';
    return 'right';
}

window.monitorAnimation = function (el, testFn) {
    el.addEventListener('transitionstart', () => {
        const interval = setInterval(() => {
            if (testFn()) {
                const e = $('#' + el.id).css('transform');
                $('#' + el.id).css({ transform: e, transition: 'none' });
                animateCSS('#' + el.id, 'tada');
                // animateCSS('#' + el.id, 'flip-2-hor-top-1');
                clearInterval(interval);
            }
        }, 100);
    });
};

function rotateAround(sourceSelector) {
    if (typeof sourceSelector === 'string' && !sourceSelector.startsWith('#')) sourceSelector = '#' + sourceSelector;
    animateCSS(sourceSelector, 'flip-2-hor-top-1');
}

// window.checkCloseness = function (id1, id2, cp) {
//     const el1 = document.getElementById(id1);
//     const el2 = document.getElementById(id2);
//     if (!el1 || !el2) return false;
//
//     const xplane = Math.abs(el1.getBoundingClientRect().left - el2.getBoundingClientRect().left);
//     const yplane = Math.abs(el1.getBoundingClientRect().top  - el2.getBoundingClientRect().top);
//     const newMax = cp * 100;
//
//     if (xplane <= newMax && yplane <= newMax) {
//         el1.style.transition = 'none';
//         return true;
//     }
//     return false;
// };

// === TALK BUBBLES ============================================================

function askOthers(askee, sayingThis) {
    animateCSS('#' + askee, randomHighlight());
    createTalkBubble('#' + askee, sayingThis);
    return true;
}

window.createTalkBubble = function (selector, text = 'hi') {
    const element = document.querySelector(selector);
    if (!element) {
        console.error('createTalkBubble: Element not found for selector', selector);
        return;
    }

    const rect      = element.getBoundingClientRect();
    const midScreen = window.innerWidth / 2;

    // If element is in the right half of the screen, shift bubble left so it
    // doesn't overflow. If in the left half, nudge it right of the element.
    const finalLeft = rect.x > midScreen
        ? rect.x - 60   // element on right → bubble anchors left of it
        : rect.x + 20;  // element on left  → bubble anchors right of it

    const top = rect.y - 100; // always overhead

    const bubble = document.createElement('div');
    bubble.classList.add('talk-bubble');
    Object.assign(bubble.style, {
        top:              top + 'px',
        left:             finalLeft + 'px',
        backgroundImage: 'url(/images/talkBubbleLeft.png)',
        backgroundSize:  'contain',
        backgroundRepeat:'no-repeat',
        zIndex:          '350',
        position:        'absolute'
    });
    bubble.appendChild(document.createTextNode(text));
    document.body.appendChild(bubble);

    setTimeout(() => {
        document.querySelectorAll('.talk-bubble').forEach(b => b.remove());
    }, 3000);
};

// window.createTalkBubble = function (selector, text = 'hi') {
//     const element = document.querySelector(selector);
//     if (!element) {
//         console.error('createTalkBubble: Element not found for selector', selector);
//         return;
//     }
//
//     const top       = element.getBoundingClientRect().y - 100;
//     const left      = element.getBoundingClientRect().x - 20;
//     const finalLeft = left < 60 ? left + 50 : left;
//
//     const bubble = document.createElement('div');
//     bubble.classList.add('talk-bubble');
//     Object.assign(bubble.style, {
//         top:             top + 'px',
//         left:            finalLeft + 'px',
//         backgroundImage: 'url(/images/talkBubbleLeft.png)',
//         backgroundSize:  'contain',
//         backgroundRepeat:'no-repeat',
//         zIndex:          '350',
//         position:        'absolute'
//     });
//     bubble.appendChild(document.createTextNode(text));
//     document.body.appendChild(bubble);
//
//     setTimeout(() => {
//         document.querySelectorAll('.talk-bubble').forEach(b => b.remove());
//     }, 3000);
// };
window.explode = function(imageSelector, particleCount = 20) {
    const fixSelector = (s) => (typeof s === 'string' && !s.startsWith('#') && !s.startsWith('.') ? '#' + s : s);
    const img = document.querySelector(fixSelector(imageSelector));

    if (!img) return;

    // 1. Trigger Pulse - We use 'animate__infinite' or just a slower duration if animate.css allows
    img.classList.add('animate__animated', 'animate__pulse');
    img.style.setProperty('--animate-duration', '1s'); // Slow down the pulse itself

    const rect = img.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 2. DELAY THE EXPLOSION: Wait for the pulse to finish its "swell"
    setTimeout(() => {
        // SLOWER FADE: 0.8s transition for a smoother disappearance
        img.style.transition = "opacity 0.8s ease-in-out, transform 0.8s ease-in-out";
        img.style.opacity = "0";
        img.style.transform = "scale(0.5)"; // Don't shrink it to nothingness too fast

        for (let i = 0; i < particleCount; i++) {
            const container = document.createElement('div');
            const ball = document.createElement('div');

            const color = Math.random() > 0.5 ? '#ADD8E6' : '#D3D3D3';
            const size = Math.floor(Math.random() * 8) + 6;

            // Container handles the outward flight
            Object.assign(container.style, {
                position: 'fixed',
                left: `${centerX}px`,
                top: `${centerY}px`,
                width: '1px',
                height: '1px',
                zIndex: '10000',
                pointerEvents: 'none',
                transition: 'transform 1.2s cubic-bezier(0.165, 0.84, 0.44, 1), opacity 1.2s ease'
            });

            // Inner ball handles the jackInTheBox pop
            Object.assign(ball.style, {
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                borderRadius: '50%',
                marginTop: `-${size/2}px`,
                marginLeft: `-${size/2}px`
            });

            ball.classList.add('animate__animated', 'animate__jackInTheBox');

            container.appendChild(ball);
            document.body.appendChild(container);

            void container.offsetWidth; // Reflow

            // 3. Move Out
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 120 + 60;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;

            container.style.transform = `translate(${tx}px, ${ty}px)`;

            // Particles also fade slower
            setTimeout(() => {
                container.style.opacity = '0';
                setTimeout(() => container.remove(), 1200);
            }, 600);
        }
    }, 600); // Wait 600ms so the user sees the pulse clearly
};
// === WIDGETS =================================================================

function setguage(elementId, direction) {
    const container = document.getElementById(elementId);
    if (!container) { console.error(`setguage: #${elementId} not found`); return; }

    const valueEl = container.querySelector('.value');
    if (!valueEl) { console.error(`setguage: no .value inside #${elementId}`); return; }

    let current = parseFloat(valueEl.textContent);
    if (isNaN(current)) { console.error(`setguage: non-numeric value in #${elementId}`); return; }

    const dir = direction.toLowerCase();
    if      (dir === 'up')   current += 5;
    else if (dir === 'down') current -= 5;
    else { console.warn(`setguage: unknown direction "${direction}"`); return; }

    valueEl.dataset.currentValue = current;
    valueEl.textContent = Math.round(current);
}

function setGuageAmount(elementId, amount) {
    const container = document.getElementById(elementId);
    if (!container) { console.error(`setGuageAmount: #${elementId} not found`); return; }

    const valueEl = container.querySelector('.value');
    if (!valueEl) { console.error(`setGuageAmount: no .value inside #${elementId}`); return; }

    valueEl.dataset.currentValue = amount;
    valueEl.textContent = Math.round(amount);
}

window.getTest = function(testname) {
    showDial(testname);
};

window.drawConnection = function (sourceSelector, targetSelector = 'patient', duration = 0.5, color = 'red', width = 3) {
    // console.log('drawConnection-------', focal);
    if (typeof sourceSelector === 'string' && !sourceSelector.startsWith('#')) sourceSelector = '#' + sourceSelector;
    if (typeof targetSelector === 'string' && !targetSelector.startsWith('#')) targetSelector = '#' + targetSelector;

    const source = document.querySelector(sourceSelector);
    const target = document.querySelector(targetSelector);
    if (!source || !target) {
        console.error(`drawConnection: could not find source or target`);
        return;
    }

    const sr = source.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    const sx = sr.left + sr.width  / 2;
    const sy = sr.top  + sr.height / 2;
    const tx = tr.left + tr.width  / 2;
    const ty = tr.top  + tr.height / 2;

    const distance = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2);
    const angle    = Math.atan2(ty - sy, tx - sx);

    const laser = document.createElement('div');
    Object.assign(laser.style, {
        position:        'absolute',
        background:      color,
        height:          `${width}px`,
        width:           `${distance}px`,
        zIndex:          '9999',
        boxShadow:       `0 0 5px ${color}`,
        left:            `${sx}px`,
        top:             `${sy}px`,
        transformOrigin: '0 0',
        transform:       `rotate(${angle}rad)`,
        transition:      `opacity ${duration}s ease-out`
    });
    document.body.appendChild(laser);

    setTimeout(() => { laser.style.opacity = '0'; }, 50);
    setTimeout(() => { laser.remove(); }, duration * 2000 + 100);

    source.classList.add('connected');
    target.classList.add('connected');
};


// === MISC ====================================================================

// const addTag = (target, tag, niceName) => { $(target).addClass(tag); };
// const removeTag = (target, tag) => { $(target).removeClass(tag); };

// CANDIDATE FOR REMOVAL: listenOff() — hardcoded '#listen-button'; not a window function. Verify the button still exists.
// function listenOff(off) {
//     if (off) $('#listen-button').click();
// }