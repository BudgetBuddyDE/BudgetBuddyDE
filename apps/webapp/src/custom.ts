interface Number {
  toDecimal(decimals?: number): number;
}

Number.prototype.toDecimal = function (decimals = 2) {
  return parseFloat(this.toFixed(decimals));
};
