

//     function hideItemUnder(item) {
//
//     // if there is an image place a cupcake underneath it
//     const el = document.getElementById(item);
//     const height = el.naturalHeight // Math.round(containerRect.height);// * topOffsetPercentage;
//     const width = el.naturalWidth //Math.round(containerRect.width);// * topOffsetPercentage;
//
//     // Set the image's position and size.
//     let top = el.getBoundingClientRect().y + (height * .4) //Math.round(rect.y - 210);
//     let left = el.getBoundingClientRect().x + (width * .3);
//     console.log('item', item, 't', top, 'l', left, ' he', height, 'w', width);
//
//     const imgElement = document.createElement('img');
//     imgElement.style.position = `absolute`;
//     imgElement.src = `/images/cupcake.png`; // Use template literals for correct path
//     imgElement.style.left = left + "px";
//     imgElement.style.top = top + "px";
//     imgElement.classList.add('prop');
//     imgElement.classList.add('hidden');
//     imgElement.classList.add(item);
//     document.getElementsByTagName('body')[0].appendChild(imgElement);
// }
export default {


    setup() {


    },
    respond() {
    }
}






