window.addEventListener('storage', (e) => {
  if (e.key === 'VMM-warehouseData') {
    // Re-render the warehouse. Somehow.
    warehouseDOM();
  }
});

warehouseDOM();
