

module.exports = {
  convertFloatDigit : (number,digit) =>{

    return Math.floor(number * Math.pow(10,digit)) / Math.pow(10,digit);
  
  }
}