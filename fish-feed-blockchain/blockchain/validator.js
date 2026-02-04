// blockchain/validator.js

/**
 * Example validation rules for an order:
 * - Quantity must be > 0
 * - Price must be > 0
 * - Feed type must be non-empty
 */

function validateOrder(orderData) {
  const { quantity, price, feed_type } = orderData;

  if (!quantity || quantity <= 0) {
    return { isValid: false, message: "Quantity must be greater than 0" };
  }

  if (!price || price <= 0) {
    return { isValid: false, message: "Price must be greater than 0" };
  }

  if (!feed_type || feed_type.trim() === "") {
    return { isValid: false, message: "Feed type must be provided" };
  }

  // Passed all checks
  return { isValid: true, message: "Order is valid" };
}

module.exports = { validateOrder };
