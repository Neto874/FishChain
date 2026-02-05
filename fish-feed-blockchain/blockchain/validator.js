function validateOrder(orderData) {
  const { quantity, price, feed_type, quantity_available, exp_date, delivery_location } = orderData;

  if (!quantity || quantity <= 0) {
    return { isValid: false, message: "Quantity must be greater than 0" };
  }

  if (!quantity_available || quantity_available < quantity) {
    return { isValid: false, message: "You donot have enough product to accept this order" };
  }

  if (quantity > 1000) { 
    return { isValid: false, message: "Quantity exceeds the maximum allowed per order" };
  }
  if (!exp_date) { 
    return { isValid: false, message: "You can only order products that have a valid expiry date" };
  }

  if (!price || price <= 0) {
    return { isValid: false, message: "Price must be greater than 0" };
  }

  if (!feed_type || feed_type.trim() === "") {
    return { isValid: false, message: "Feed type must be provided" };
  }

  if (!delivery_location || delivery_location.trim() === "") {
    return { isValid: false, message: "Delivery location must be provided" };
  }


  
  return { isValid: true, message: "Order is valid" };
}

module.exports = { validateOrder };
