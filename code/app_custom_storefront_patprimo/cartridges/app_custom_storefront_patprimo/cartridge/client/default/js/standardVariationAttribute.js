const colorButtons = document.querySelectorAll('.color-attribute');
const colorNameLabel = document.querySelector('.selected-color .color-name');

const initialSelectedColor = document.querySelector('.color-attribute[selected] .swatch-circle');
if (initialSelectedColor) {
    const initialColorName = initialSelectedColor.getAttribute('data-attr-value');
    colorNameLabel.textContent = initialColorName;
}

colorButtons.forEach(button => {
    button.addEventListener('click', () => {
    const selectedColor = button.querySelector('.swatch-circle');
        if (selectedColor) {
            const colorName = selectedColor.getAttribute('data-attr-value');
            colorNameLabel.textContent = colorName;
        } else {
            colorNameLabel.textContent = '';
        }
    });
});
