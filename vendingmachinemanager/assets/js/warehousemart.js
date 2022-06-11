currentMoney.innerHTML = `$${manager.money.toFixed(2)}`;

let selectFields = document.getElementsByClassName('itemQuantity');
let costFields = document.getElementsByClassName('itemPrice');
let unitPriceFields = document.getElementsByClassName('itemUnitPrice');

Array.from(selectFields).forEach(function (arrayLoop, index) {
  for (let x = 0; x <= 3; x++) {
    let opt = document.createElement('option');
    opt.value = quantityControlNum[x];
    opt.innerHTML = quantityControlNames[x];
    arrayLoop.appendChild(opt);
  }

  arrayLoop.addEventListener('change', () => {
    costFields[index].innerHTML = `$${(
      itemPriceTable[index].itemPrice *
      quantityControlNum[selectFields[index].selectedIndex - 1]
    ).toFixed(2)}`;
  });
});

Array.from(unitPriceFields).forEach(function (arrayLoop, index) {
  unitPriceFields[index].innerHTML = `$${itemPriceTable[
    index
  ].itemPrice.toFixed(2)}`;
});
