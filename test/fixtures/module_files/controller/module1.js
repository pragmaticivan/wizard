module.exports = function(app, modify) {
  if (modify) {
    this.execute = true;
  }
  this.foo = "bar";
  return this;
};
