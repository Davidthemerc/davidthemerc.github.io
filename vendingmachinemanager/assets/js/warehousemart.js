updateMoney(manager.money);

let selectFields = document.getElementsByClassName('itemQuantity');
let costFields = document.getElementsByClassName('itemPrice');
let unitPriceFields = document.getElementsByClassName('itemUnitPrice');

Array.from(selectFields).forEach((arrayLoop, index) => {
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

Array.from(unitPriceFields).forEach((arrayLoop, index) => {
  arrayLoop.innerHTML = `$${itemPriceTable[index].itemPrice.toFixed(2)}`;
});

const purchaseButtons = document.getElementsByClassName('btn-primary');

Array.from(purchaseButtons).forEach((itemButton) => {
  itemButton.addEventListener('click', () => {
    const found = itemPriceTable.find(
      (array) => array.refName === itemButton.id
    );
    const index = itemPriceTable.findIndex(
      (array) => array.refName === itemButton.id
    );

    try {
      wmartBuy(found, index, selectFields);
      selectFields[index].selectedIndex = 0;
    } catch (error) {
      let messages = [];
      messages.push(error);
      displayMessages(messages, statusEl);
    }
  });
});
